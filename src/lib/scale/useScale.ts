import { useEffect, useRef, useState } from 'react';

export type ScaleReading = { valueG:number; stable:boolean; raw:string|null };
// More permissive weight matcher: accepts lines like "ST,+000.123 g" or "+0.000 g" or "0.000g" or "12.3 kg"
const LINE_RE = /([\-+]?\d+(?:\.\d+)?)(?:\s*)(g|kg)?/i;
const GLOBAL_EVT = 'nbs-scale-reading';

type SerialOptions = {
  baudRate:number;
  dataBits:7|8;
  stopBits:1|2;
  parity:'none'|'even'|'odd';
  flowControl:'none'|'hardware';
};

const DEFAULT_OPTS: SerialOptions = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none'
};

const STORAGE_KEY = 'nbslims_scale_serial_options';
const MODE_KEY = 'nbslims_scale_mode'; // 'webserial' | 'bridge'
const WS_KEY = 'nbslims_scale_ws_url';
const PREF_INFO_KEY = 'nbslims_scale_preferred_info'; // stores {vendorId, productId, serialNumber}

function loadOptions(): SerialOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_OPTS, ...JSON.parse(raw) } : DEFAULT_OPTS;
  } catch { return DEFAULT_OPTS; }
}

export function useScale(){
  const [connected,setConnected] = useState(false);
  const [supported,setSupported] = useState<boolean>(false);
  const [error,setError] = useState<string|null>(null);
  const [reading,setReading]   = useState<ScaleReading>({ valueG:0, stable:false, raw:null });
  const [mode,setModeState] = useState<'webserial'|'bridge'>(() => (localStorage.getItem(MODE_KEY) as any) || 'webserial');
  const [wsUrl,setWsUrlState] = useState<string>(() => localStorage.getItem(WS_KEY) || 'ws://127.0.0.1:8787');
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array>|null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const wsRef = useRef<WebSocket|null>((window as any).__nbsScaleWS || null);
  function getOpenPort(){
    // Try local ref first, then a shared global ref so multiple components can use the same connection
    const g = (window as any).__nbsScalePort;
    return portRef.current || g || null;
  }

  function setGlobalPort(port:any){
    portRef.current = port;
    (window as any).__nbsScalePort = port;
  }

  const optionsRef = useRef<SerialOptions>(loadOptions());

  useEffect(()=>{
    // @ts-ignore
    setSupported(typeof navigator !== 'undefined' && !!navigator.serial);
  },[]);

  // Ensure bridge auto-reconnects when tab becomes visible again
  useEffect(()=>{
    if (mode !== 'bridge') return;
    const onVis = () => {
      if (!document.hidden){
        // If ws is not open, reconnect silently
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN){
          // Best-effort reconnect; ignore result
          autoConnect().catch(()=>{});
        }
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, wsRef.current]);

  // Subscribe to global reading events so new hook instances get updates from an existing connection
  useEffect(()=>{
    const handler = (ev: Event)=>{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (ev as any).detail as ScaleReading | undefined;
      if (detail) setReading(detail);
    };
    window.addEventListener(GLOBAL_EVT, handler as EventListener);
    const last = (window as any).__nbsScaleLast as ScaleReading | undefined;
    if (last) setReading(last);

    // If there is an already-open WS, attach listeners so events continue flowing
    if (mode==='bridge' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
      setConnected(true);
      const ws = wsRef.current;
      let lastBuf:number[] = [];
      const onMsg = (ev: MessageEvent)=>{
        const rd = parseLineToReading(String(ev.data||''), lastBuf); if (!rd) return;
        (window as any).__nbsScaleLast = rd;
        window.dispatchEvent(new CustomEvent(GLOBAL_EVT, { detail: rd }));
      };
      ws.addEventListener('message', onMsg);
      const onClose = ()=> setConnected(false);
      ws.addEventListener('close', onClose);
      return () => { ws.removeEventListener('message', onMsg); ws.removeEventListener('close', onClose); window.removeEventListener(GLOBAL_EVT, handler as EventListener); };
    }

    return () => { window.removeEventListener(GLOBAL_EVT, handler as EventListener); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function setSerialOptions(next: Partial<SerialOptions>){
    optionsRef.current = { ...optionsRef.current, ...next } as SerialOptions;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(optionsRef.current)); } catch {}
  }

  function setMode(next: 'webserial'|'bridge'){
    setModeState(next);
    try { localStorage.setItem(MODE_KEY, next); } catch {}
  }

  function setWsUrl(next:string){
    setWsUrlState(next);
    try { localStorage.setItem(WS_KEY, next); } catch {}
  }

  function convertToGrams(value:number, unit?:string|null){
    if (!unit) return value;
    const u = unit.toLowerCase();
    if (u === 'kg') return value * 1000;
    if (u === 'mg') return value / 1000;
    if (u === 'g') return value;
    return value; // unknown unit, assume grams
  }

  function parseLineToReading(line:string, last:number[]): ScaleReading|null {
    const trimmed = line.trim(); if (!trimmed) return null;
    const m = LINE_RE.exec(trimmed); if (!m) return null;
    const rawNum = Number(m[1]); const unit = m[2] || 'g';
    const g = convertToGrams(rawNum, unit);
    last.push(g); if (last.length>3) last.shift();
    const hasST = /\bST\b/i.test(trimmed) || trimmed.startsWith('ST');
    const stableFromVariance = last.length===3 && Math.max(...last)-Math.min(...last) <= 0.001;
    return { valueG:g, stable: hasST || stableFromVariance, raw: trimmed };
  }


  async function startReader(port:any){
    const dec = new (window as any).TextDecoderStream(); (port.readable as ReadableStream).pipeTo(dec.writable);
    const reader = dec.readable.getReader();
    readerRef.current = reader;
    let last:number[] = [];
    (async () => {
      try {
        while (true){
          const { value, done } = await reader.read(); if (done || !value) break;
          for (const line of value.split(/\r?\n/)){
            const rd = parseLineToReading(line, last); if (!rd) continue;
            setReading(rd);
          }
        }
      } catch (e:any){
        setError(e?.message || 'Scale read error');
      }
    })();
  }

  async function ensureWriter(port:any){
    if (writerRef.current) return;
    try {
      writerRef.current = (port.writable as WritableStream<Uint8Array>).getWriter();
    } catch (e:any) {
      // If locked by another writer, we'll retry later
      setError(e?.message || 'Unable to get writer');
    }
  }

  async function connect(){
    setError(null);
    try {
      if (mode === 'bridge'){
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN){ setConnected(true); return true; }
        await new Promise<void>((resolve, reject)=>{
          try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws; (window as any).__nbsScaleWS = ws;
            let last:number[] = [];
            ws.addEventListener('open', ()=>{ setConnected(true); resolve(); });
            ws.addEventListener('error', ()=>{ setError('Bridge connection error'); reject(new Error('ws error')); });
            ws.addEventListener('close', ()=>{ setConnected(false); });
            ws.addEventListener('message', (ev:any)=>{
              const rd = parseLineToReading(String(ev.data||''), last); if (!rd) return;
            setReading(rd);
            });
          } catch (e:any){ reject(e); }
        });
        return true;
      }
      if (!supported) throw new Error('Web Serial not supported. Use Chrome/Edge on HTTPS or localhost.');
      // If already connected (same page), reuse
      const existing = getOpenPort();
      if (existing && existing.readable) { setConnected(true); return true; }
      // Try preferred device first (by stored info)
      try {
        // @ts-ignore
        const ports: any[] = await navigator.serial.getPorts();
        const prefRaw = localStorage.getItem(PREF_INFO_KEY);
        if (prefRaw && ports?.length){
          const pref = JSON.parse(prefRaw);
          const matched = ports.find(p => {
            try { const info = p.getInfo?.(); return info && info.usbVendorId===pref.usbVendorId && info.usbProductId===pref.usbProductId; } catch { return false; }
          });
          if (matched){
            const port = matched;
            if (!(port as any).readable) { await port.open(optionsRef.current); }
            setGlobalPort(port); setConnected(true);
            await Promise.all([startReader(port), ensureWriter(port)]);
            return true;
          }
        }
      } catch {}
      // Otherwise prompt user; prefer FTDI filter
      // @ts-ignore
      const port = await navigator.serial.requestPort({ filters: [{ usbVendorId: 0x0403, usbProductId: 0x6001 }] });
      try {
        await port.open(optionsRef.current);
      } catch (e:any){
        // If it's already open elsewhere in this app, assume connected and try to attach reader
        if (String(e?.message || '').toLowerCase().includes('already open')){
          setGlobalPort(port); setConnected(true);
          try { await startReader(port); } catch {}
          return true;
        }
        throw e;
      }
      setGlobalPort(port); setConnected(true);
      await Promise.all([startReader(port), ensureWriter(port)]);
      return true;
    } catch (e:any){ setError(e?.message || 'Unable to connect to scale'); return false; }
  }

  async function autoConnect(){
    setError(null);
    try {
      if (mode === 'bridge'){
        if (wsRef.current?.readyState === WebSocket.OPEN) return true;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws; (window as any).__nbsScaleWS = ws;
        await new Promise<void>((resolve,reject)=>{
          let last:number[] = [];
          ws.addEventListener('open', ()=>{ setConnected(true); resolve(); });
          ws.addEventListener('error', ()=>{ setError('Bridge connection error'); reject(new Error('ws error')); });
          ws.addEventListener('close', ()=> setConnected(false));
          ws.addEventListener('message', (ev:any)=>{
            const rd = parseLineToReading(String(ev.data||''), last); if (!rd) return;
            setReading(rd);
            (window as any).__nbsScaleLast = rd;
            window.dispatchEvent(new CustomEvent(GLOBAL_EVT, { detail: rd }));
          });
        });
        return true;
      }
      if (!supported) return false;
      // @ts-ignore
      const ports = await navigator.serial.getPorts();
      if (!ports?.length) return false;
      const prefRaw = localStorage.getItem(PREF_INFO_KEY);
      let port = ports[0];
      if (prefRaw){
        try {
          const pref = JSON.parse(prefRaw);
          const matched = ports.find(p=>{ try { const info = p.getInfo?.(); return info && info.usbVendorId===pref.usbVendorId && info.usbProductId===pref.usbProductId; } catch { return false; } });
          if (matched) port = matched;
        } catch {}
      }
      if (!(port as any).readable) {
        await port.open(optionsRef.current);
      }
      setGlobalPort(port); setConnected(true);
      await Promise.all([startReader(port), ensureWriter(port)]);
      return true;
    } catch { return false; }
  }

  async function disconnect(){
    try {
      if (readerRef.current){ try { await readerRef.current.cancel(); } catch {}
        try { readerRef.current.releaseLock(); } catch {}
      }
      if (writerRef.current){ try { await writerRef.current.releaseLock(); } catch {} writerRef.current = null; }
      const port = getOpenPort();
      if (port){ try { await port.close(); } catch {} }
      if (wsRef.current){ try { wsRef.current.close(); } catch {} wsRef.current = null; }
    } finally {
      setGlobalPort(null); readerRef.current = null; setConnected(false);
    }
  }

  async function tare(){
    if (mode === 'bridge'){
      try {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
        // Some firmwares require CRLF; send in safe order with small spacing
        wsRef.current.send('T');
        wsRef.current.send('Z');
        wsRef.current.send('TARE');
        return true;
      } catch (e:any){ setError(e?.message || 'TARE failed'); return false; }
    }
    const port = getOpenPort(); if (!port?.writable) return false;
    try {
      await ensureWriter(port);
      const writer = writerRef.current!;
      writeQueueRef.current = writeQueueRef.current.then(async ()=>{
        for (const cmd of ["T\r\n","Z\r\n","TARE\r\n"]) {
          await writer.write(new TextEncoder().encode(cmd));
          await new Promise(r=>setTimeout(r,150));
        }
      });
      await writeQueueRef.current;
      return true;
    } catch (e:any){ setError(e?.message || 'TARE failed'); return false; }
  }

  async function send(command:string){
    if (mode === 'bridge'){
      try { if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false; wsRef.current.send(command); return true; }
      catch (e:any){ setError(e?.message || 'Send failed'); return false; }
    }
    const port = getOpenPort(); if (!port?.writable) return false;
    try {
      await ensureWriter(port);
      const writer = writerRef.current!;
      const withTerm = /\r\n$/.test(command) ? command : command + "\r\n";
      writeQueueRef.current = writeQueueRef.current.then(async ()=>{
        await writer.write(new TextEncoder().encode(withTerm));
      });
      await writeQueueRef.current;
      return true;
    } catch (e:any){ setError(e?.message || 'Send failed'); return false; }
  }

  async function pickJA5003(){
    if (!supported) return false;
    try {
      // @ts-ignore
      const port = await navigator.serial.requestPort({ filters: [{ usbVendorId: 0x0403, usbProductId: 0x6001 }] });
      try {
        const info = port.getInfo?.();
        if (info) localStorage.setItem(PREF_INFO_KEY, JSON.stringify(info));
      } catch {}
      try { await port.open(optionsRef.current); } catch {}
      setGlobalPort(port); setConnected(true);
      await Promise.all([startReader(port), ensureWriter(port)]);
      return true;
    } catch (e:any){ setError(e?.message || 'Selection failed'); return false; }
  }

  async function ping(){
    // Ask one stable reading
    return await send('SI');
  }

  async function reconnect(){
    try { await disconnect(); } catch {}
    try { return await connect(); } catch { return false; }
  }

  return { supported, connected, reading, error, connect, autoConnect, disconnect, tare, send, ping, reconnect, setSerialOptions, mode, setMode, wsUrl, setWsUrl, pickJA5003 };
}


