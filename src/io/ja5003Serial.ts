import { EventEmitter } from 'node:events';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

export type JAEventMap = {
  'open': { path: string; baud: number };
  'data': { raw: string; value?: number; unit?: string };
  'close': void;
  'error': { error: Error };
  'status': { message: string };
};

/**
 * JA5003 serial driver (Node.js only)
 * - Auto-detects port by VID/PID or friendly name
 * - Autodetects baud from common values
 * - Enables continuous output on connect (C, Q, CONT 1, STA 1)
 * - Keeps connection alive and auto-reconnects with backoff
 */
export class JA5003Serial extends EventEmitter {
  private port?: SerialPort;
  private parser?: ReadlineParser;
  private stopFlag = false;
  private backoffMs = 1000;
  private readonly maxBackoffMs = 30000;
  private readonly keepAliveMs = 10000; // ask once in a while if device is silent
  private lastKA = 0;

  // detection order
  private readonly baudCandidates = [9600, 19200, 4800, 2400];

  constructor(
    private readonly preferredPath = process.env.JA_PORT ?? 'AUTO', // 'AUTO' | 'COMx'
    private readonly vid = 0x0403,
    private readonly pid = 0x6001,
  ) { super(); }

  /** Start and keep the connection alive */
  public start = async () => {
    this.stopFlag = false;
    while (!this.stopFlag) {
      try {
        const path = await this.resolvePath();
        const { port, baud } = await this.openWithAutodetect(path);
        this.port = port;

        // Enable continuous/auto print on connect (with light pacing for reliability)
        await this.enableContinuous(port);

        this.emit('open', { path, baud });
        this.backoffMs = 1000; // reset on success

        // read loop via parser
        this.parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        this.parser.on('data', (line: string) => {
          const parsed = this.parseWeight(line);
          this.emit('data', parsed ?? { raw: line });
        });

        port.on('close', () => {
          this.emit('close', undefined as any);
          this.scheduleReconnect();
        });

        port.on('error', (err) => {
          this.emit('error', { error: err as Error });
          try { port.close(); } catch {}
        });

        // keepalive ticker
        const tick = () => {
          if (this.stopFlag) return;
          const now = Date.now();
          if (this.port && this.port.isOpen && now - this.lastKA > this.keepAliveMs) {
            this.writeSafe('SI\r\n'); // ask one stable reading
            this.lastKA = now;
          }
          setTimeout(tick, 1000);
        };
        tick();

        // hold here until port closes
        await new Promise<void>(resolve => port.once('close', () => resolve()));
      } catch (err: any) {
        this.emit('error', { error: err });
        this.scheduleReconnect();
      }
    }
  };

  /** Stop and close */
  public stop = async () => {
    this.stopFlag = true;
    if (this.parser) { this.parser.removeAllListeners(); this.parser = undefined; }
    if (this.port?.isOpen) {
      await new Promise<void>(res => this.port!.close(() => res()));
    }
  };

  /** Request a single print now */
  public printOnce() { this.writeSafe('P\r\n'); }

  /** Toggle continuous on some firmwares (ignored if unsupported) */
  public toggleContinuous() { this.writeSafe('C\r\n'); }

  /** Send TARE sequence */
  public tare() {
    this.writeSafe('T\r\n');
    this.writeSafe('Z\r\n');
    this.writeSafe('TARE\r\n');
  }

  // ------------ internals ----------------
  private scheduleReconnect() {
    if (this.stopFlag) return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs);
    this.emit('status', { message: `Reconnecting in ${Math.round(delay/1000)}s...` });
    setTimeout(() => { if (!this.stopFlag) this.start(); }, delay);
  }

  private async resolvePath(): Promise<string> {
    if (this.preferredPath !== 'AUTO') return this.preferredPath;
    const { SerialPort } = await import('serialport');
    const ports = await SerialPort.list();
    // prefer FTDI VID/PID
    const ftdi = ports.find(p => (p.vendorId && parseInt(p.vendorId,16)===this.vid) &&
                                 (p.productId && parseInt(p.productId,16)===this.pid));
    if (ftdi?.path) return ftdi.path;
    // fallback: first USB Serial Port or COM3
    const usb = ports.find(p => /USB.*Serial/i.test(`${p.friendlyName ?? ''}`));
    return usb?.path ?? 'COM3';
  }

  private async openWithAutodetect(path: string): Promise<{ port: SerialPort; baud: number }> {
    for (const baud of this.baudCandidates) {
      try {
        const port = await this.open(path, baud);
        const ok = await this.probe(port);
        if (ok) return { port, baud };
        // Try continuous read for half a second
        const got = await this.waitForLine(port, 600);
        if (got) return { port, baud };
        await this.safeClose(port);
      } catch {
        // ignore; try next baud
      }
    }
    // Last resort: open at 9600 and hope device starts talking later
    const port = await this.open(path, 9600);
    return { port, baud: 9600 };
  }

  private async open(path: string, baudRate: number): Promise<SerialPort> {
    return new Promise((resolve, reject) => {
      const port = new SerialPort({ path, baudRate, dataBits: 8, parity: 'none', stopBits: 1, autoOpen: false });
      port.open(err => err ? reject(err) : resolve(port));
    });
  }

  private async safeClose(p: SerialPort) {
    return new Promise<void>(res => { try { p.close(() => res()); } catch { res(); } });
  }

  private async probe(p: SerialPort) {
    // Ask the scale to print once; many JA models accept P / SI
    try {
      p.flush();
      p.write('P\r\n'); await this.sleep(200);
      const l1 = await this.waitForLine(p, 400);
      if (l1) return true;
      p.write('SI\r\n'); await this.sleep(200);
      const l2 = await this.waitForLine(p, 400);
      return !!l2;
    } catch { return false; }
  }

  private waitForLine(p: SerialPort, ms: number): Promise<string | null> {
    return new Promise(resolve => {
      let timer: NodeJS.Timeout | undefined;
      const parser = p.pipe(new ReadlineParser({ delimiter: '\r\n' }));
      const onData = (line: string) => { cleanup(); resolve(line); };
      const cleanup = () => { parser.off('data', onData); if (timer) clearTimeout(timer); };
      parser.on('data', onData);
      timer = setTimeout(() => { cleanup(); resolve(null); }, ms);
    });
  }

  private writeSafe(s: string) {
    if (this.port?.isOpen) {
      try { this.port.write(s); } catch {}
    }
  }

  private async enableContinuous(p: SerialPort) {
    // Typical vendor-agnostic sequence seen to work on JA devices
    const cmds = ['C', 'Q', 'CONT 1', 'STA 1'];
    for (const cmd of cmds) {
      try { p.write((cmd.endsWith('\r\n') ? cmd : (cmd + '\r\n'))); } catch {}
      await this.sleep(120);
    }
  }

  private parseWeight(line: string): { raw: string; value?: number; unit?: string } {
    const raw = line.trim();
    // Examples: "+000.123 g", "-12.3 g", "0.000g", "  12.345 kg"
    const m = raw.match(/([+-]?\d+(?:\.\d+)?)(?:\s*)(g|kg)?/i);
    if (!m) return { raw };
    const n = parseFloat(m[1]);
    const unit = (m[2] ?? 'g').toLowerCase();
    return { raw, value: isFinite(n) ? n : undefined, unit };
  }

  private sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

  // --- typed emit helpers ---
  public override emit<K extends keyof JAEventMap>(event: K, payload: JAEventMap[K]) {
    return super.emit(event as string, payload);
  }
  public override on<K extends keyof JAEventMap>(event: K, listener: (payload: JAEventMap[K]) => void): this {
    return super.on(event as string, listener);
  }
}


