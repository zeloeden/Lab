'use strict';

// JA5003 auto-connect serial helper (ESM)
// - Finds FTDI VID/PID 0x0403/0x6001 or falls back to COM3
// - Auto-detects baud (9600, 19200, 4800, 2400)
// - Reconnects with exponential backoff
// - Emits: open, data, close, error, status

import { EventEmitter } from 'node:events';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

export class JA5003Serial extends EventEmitter {
  constructor(preferredPath = process.env.JA_PORT || 'AUTO', vid = 0x0403, pid = 0x6001) {
    super();
    this.preferredPath = preferredPath;
    this.vid = vid; this.pid = pid;
    this.port = undefined;
    this.parser = undefined;
    this.stopFlag = false;
    this.backoffMs = 1000;
    this.maxBackoffMs = 30000;
    // Back off a bit for stability, can be tuned via JA_SI_MS env
    this.keepAliveMs = Number(process.env.JA_SI_MS || 1000);
    this.lastKA = 0;
    this.baudCandidates = [9600, 19200, 4800, 2400];
  }

  async start(){
    this.stopFlag = false;
    while (!this.stopFlag){
      try {
        const candidates = await this.listCandidates();
        let opened = null;
        for (const path of candidates){
          try {
            const { port, baud } = await this.openWithAutodetect(path);
            opened = { port, baud, path };
            break;
          } catch (e) {
            // try next candidate
          }
        }
        if (!opened) {
          throw new Error('No serial port available to open');
        }
        this.port = opened.port;
        this.emit('open', { path: opened.path, baud: opened.baud });
        this.backoffMs = 1000;

        this.parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        this.parser.on('data', line => {
          const parsed = this.parseWeight(line);
          this.emit('data', parsed || { raw: line });
        });

        port.on('close', () => {
          this.emit('close');
          this.scheduleReconnect();
        });
        port.on('error', (err) => {
          this.emit('error', { error: err });
          try { port.close(); } catch {}
        });

        // Optionally assert DTR/RTS (some setups require DTR high)
        try { if (process.env.JA_SET_DTR_RTS !== '0') this.port.set({ dtr: true, rts: false }, ()=>{}); } catch {}

        // Enable continuous on connect + vendor-agnostic fallbacks
        try {
          if (process.env.JA_CONTINUOUS !== '0') {
            const enableSeq = (process.env.JA_ENABLE_CMDS || 'C,Q,CONT 1,STA 1').split(',').map(s=>s.trim()).filter(Boolean);
            for (const cmd of enableSeq){ try { this.write(cmd + '\r\n'); } catch {} await this.sleep(120); }
          }
        } catch {}

        const pollSeq = (process.env.JA_POLL_CMDS || 'SI,S,P').split(',').map(s=>s.trim()).filter(Boolean);
        let pollIdx = 0;
        const tick = () => {
          if (this.stopFlag) return;
          const now = Date.now();
          if (this.port && this.port.isOpen && now - this.lastKA > this.keepAliveMs){
            const cmd = pollSeq[pollIdx % pollSeq.length] || 'SI'; pollIdx++;
            this.write(cmd + '\r\n');
            this.lastKA = now;
          }
          setTimeout(tick, 1000);
        };
        tick();

        await new Promise(res => port.once('close', res));
      } catch (err) {
        this.emit('error', { error: err });
        this.scheduleReconnect();
      }
    }
  }

  async stop(){
    this.stopFlag = true;
    if (this.parser) { this.parser.removeAllListeners(); this.parser = undefined; }
    if (this.port?.isOpen){ await new Promise(res => this.port.close(() => res())); }
  }

  printOnce(){ this.write('P\r\n'); }
  toggleContinuous(){ this.write('C\r\n'); }
  async tare(){
    const seq = (process.env.JA_TARE_CMDS || 'T,Z,TARE,ZERO').split(',').map(s=>s.trim()).filter(Boolean);
    for (const cmd of seq){ try { this.write(cmd + (cmd.endsWith('\r\n')?'':'\r\n')); } catch {} await this.sleep(120); }
  }
  send(cmd){ this.write(cmd.endsWith('\r\n') ? cmd : (cmd + '\r\n')); }

  scheduleReconnect(){
    if (this.stopFlag) return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs);
    this.emit('status', { message: `Reconnecting in ${Math.round(delay/1000)}s...` });
    setTimeout(() => { if (!this.stopFlag) this.start(); }, delay);
  }

  async resolvePath(){
    if (this.preferredPath !== 'AUTO') return this.preferredPath;
    const ports = await SerialPort.list();
    const ftdi = ports.find(p => (p.vendorId && parseInt(p.vendorId,16)===this.vid) && (p.productId && parseInt(p.productId,16)===this.pid));
    if (ftdi?.path) return ftdi.path;
    const usb = ports.find(p => /USB.*Serial/i.test(`${p.friendlyName || ''}`));
    return usb?.path || 'COM3';
  }

  async listCandidates(){
    if (this.preferredPath !== 'AUTO') return [this.preferredPath];
    const ports = await SerialPort.list();
    const ftdi = ports.filter(p => (p.vendorId && parseInt(p.vendorId,16)===this.vid) && (p.productId && parseInt(p.productId,16)===this.pid)).map(p=>p.path);
    const usb = ports.filter(p => /USB.*Serial/i.test(`${p.friendlyName || ''}`)).map(p=>p.path);
    const all = ports.map(p=>p.path);
    const uniq = (arr)=>[...new Set(arr.filter(Boolean))];
    const merged = uniq([...ftdi, ...usb, ...all, 'COM3']);
    if (merged.length===0) return ['COM3'];
    return merged;
  }

  async openWithAutodetect(path){
    for (const baud of this.baudCandidates){
      try {
        const port = await this.open(path, baud);
        const ok = await this.probe(port);
        if (ok) return { port, baud };
        const got = await this.waitForLine(port, 600);
        if (got) return { port, baud };
        await this.safeClose(port);
      } catch {}
    }
    const port = await this.open(path, 9600);
    return { port, baud: 9600 };
  }

  open(path, baudRate){
    return new Promise((resolve, reject)=>{
      const port = new SerialPort({ path, baudRate, dataBits:8, parity:'none', stopBits:1, autoOpen:false });
      port.open(err => err ? reject(err) : resolve(port));
    });
  }

  safeClose(p){ return new Promise(res => { try { p.close(()=>res()); } catch { res(); } }); }

  async probe(p){
    try {
      p.flush();
      p.write('P\r\n'); await this.sleep(200);
      const l1 = await this.waitForLine(p, 400); if (l1) return true;
      p.write('SI\r\n'); await this.sleep(200);
      const l2 = await this.waitForLine(p, 400); return !!l2;
    } catch { return false; }
  }

  waitForLine(p, ms){
    return new Promise(resolve => {
      let timer;
      const parser = p.pipe(new ReadlineParser({ delimiter: '\r\n' }));
      const onData = (line)=>{ cleanup(); resolve(line); };
      const cleanup = ()=>{ parser.off('data', onData); if (timer) clearTimeout(timer); };
      parser.on('data', onData);
      timer = setTimeout(()=>{ cleanup(); resolve(null); }, ms);
    });
  }

  write(s){ if (this.port?.isOpen) { try { this.port.write(s); } catch {} } }

  parseWeight(line){
    const raw = String(line || '').trim();
    const m = raw.match(/([+-]?\d+(?:\.\d+)?)(?:\s*)(g|kg)?/i);
    if (!m) return { raw };
    const n = parseFloat(m[1]);
    const unit = (m[2] || 'g').toLowerCase();
    return { raw, value: Number.isFinite(n) ? n : undefined, unit };
  }

  sleep(ms){ return new Promise(res => setTimeout(res, ms)); }
}


