type Listener = (msg: string) => void;

export class ScaleWS {
  private url: string;
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private retryMs = 1000;
  private stop = false;

  constructor(url = 'ws://127.0.0.1:8787') { this.url = url; }

  start() {
    this.stop = false;
    const connect = () => {
      if (this.stop) return;
      try {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => { this.retryMs = 1000; };
        this.ws.onmessage = (e) => this.listeners.forEach(l => l(String(e.data)));
        this.ws.onclose = () => this.scheduleReconnect();
        this.ws.onerror = () => this.scheduleReconnect();
      } catch { this.scheduleReconnect(); }
    };
    connect();
  }

  private scheduleReconnect() {
    if (this.stop) return;
    setTimeout(() => this.start(), this.retryMs);
    this.retryMs = Math.min(this.retryMs * 2, 8000);
  }

  subscribe(cb: Listener) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
  close() { this.stop = true; try { this.ws?.close(); } catch {} }
}

export const scaleWs = new ScaleWS();


