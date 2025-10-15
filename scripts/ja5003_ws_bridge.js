'use strict';

// WebSocket bridge for JA5003Serial (ESM)
// - Serves a WS that streams raw weight lines to all clients
// - Accepts simple text commands: TARE, T, Z, SI, P, C, and arbitrary strings

import http from 'node:http';
import { WebSocketServer } from 'ws';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { JA5003Serial } from './ja5003Serial.js';

const HOST = process.env.JA_WS_HOST || '127.0.0.1';
const PORT = parseInt(process.env.JA_WS_PORT || '8787', 10);
const FORCE = process.env.JA_FORCE_OPEN === '1';

// Simple CLI arg parsing: --port=, --baud=
const argv = process.argv.slice(2);
const argvMap = Object.fromEntries(argv.filter(a=>/^--\w+=/.test(a)).map(a=>{
  const [k,v] = a.replace(/^--/,'').split('=');
  return [k.toLowerCase(), v];
}));

// Optional pre-flight probe and verbose logging to help diagnose Windows COM access
try {
  const list = await SerialPort.list();
  console.log('[debug] Available ports:', list.map(p => p.path));
  if (process.env.JA_DEBUG_PROBE === '1') {
    let path = process.env.JA_PORT || 'COM3';
    if (process.platform === 'win32' && !path.startsWith('\\\\.\\') && /^COM(\d+)$/i.test(path)) {
      const n = Number(path.slice(3));
      if (n >= 10) path = '\\\\.' + '\\' + path; // \\.\COM10 form
    }
    const baudRate = Number(process.env.JA_BAUD || 9600);
    console.log('[debug] Probe opening', path, 'at', baudRate);
    const testPort = new SerialPort({ path, baudRate, dataBits:8, parity:'none', stopBits:1, autoOpen:false });
    await new Promise((resolve, reject)=> testPort.open(err => err ? reject(err) : resolve()));
    console.log('[debug] Port opened (probe), closing');
    await new Promise(resolve => testPort.close(()=> resolve()));
  }
} catch (e) {
  console.log('[debug] SerialPort preflight error:', e?.message || e);
}

const srv = http.createServer((req, res)=>{
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('JA5003 WS Bridge running\n');
});

const wss = new WebSocketServer({ server: srv });

function broadcast(line){
  const msg = String(line || '').trim(); if (!msg) return;
  for (const client of wss.clients){
    try { if (client.readyState === 1) client.send(msg); } catch {}
  }
}

async function openJaPort(){
  const envPathRaw = (argvMap.port || process.env.JA_PORT || 'COM3');
  const baudRate = Number(argvMap.baud || process.env.JA_BAUD || 9600);

  async function tryOpen(path, info){
    console.log('[debug] Opening', path, 'at', baudRate);
    const port = new SerialPort({ path, baudRate, dataBits:8, stopBits:1, parity:'none', rtscts:false, xon:false, xoff:false, autoOpen:true });
    port.on('open', () => console.log('[serial] OPENED', path));
    port.on('error', (err) => console.error('[serial] ERROR:', err?.message || err));
    port.on('close', () => console.warn('[serial] CLOSED'));
    if (info) console.log(`[serial] using PORT=${info.path || path} (chip: ${info.friendlyName || info.manufacturer || info.serialNumber || 'unknown'})`);
    return port;
  }

  async function pickAutoPort(){
    while (true){
      try {
        const list = await SerialPort.list();
        console.log('[debug] Available ports:', list.map(p => p.path));
        const candidates = list
          .filter(p => p.path && !/^COM1$/i.test(p.path))
          .sort((a,b)=>{
            const score = (p)=>{
              const name = `${p.friendlyName||''} ${p.manufacturer||''}`.toLowerCase();
              let s = 0;
              if (/usb|serial|ch340|prolific|silabs|cp210|ftdi/.test(name)) s += 10;
              const m = /com(\d+)/i.exec(p.path);
              if (m) s += parseInt(m[1],10);
              return s;
            };
            return score(b)-score(a);
          });
        for (const info of candidates){
          let path = info.path;
          if (process.platform === 'win32' && /^COM(\d+)$/i.test(path)){
            const n = Number(path.slice(3));
            if (n >= 10) path = '\\.' + '\\' + path;
          }
          try {
            return await tryOpen(path, info);
          } catch (e) {
            console.error('[auto-port] failed to open', info.path, e?.message || e);
          }
        }
      } catch (e) {
        console.error('[auto-port] list error', e?.message || e);
      }
      await new Promise(r=>setTimeout(r, 2000));
    }
  }

  const envUpper = String(envPathRaw || '').toUpperCase();
  if (envUpper === 'AUTO' || envUpper === '' || envUpper === 'UNDEFINED'){
    const port = await pickAutoPort();
    return { port };
  }

  const list = await SerialPort.list();
  console.log('[debug] Available ports:', list.map(p => p.path));

  let path = envPathRaw;
  if (process.platform === 'win32' && /^COM(\d+)$/i.test(envPathRaw)) {
    const n = Number(String(envPathRaw).slice(3));
    if (n >= 10) path = '\\.' + '\\' + envPathRaw; // \\.\COM10
  }

  const port = await tryOpen(path);

  // Robust line splitter: handle \r, \n, or \r\n
  let lineBuf = '';
  // Stable-weight detection ring buffer & params
  const lastReadings = [];
  const stableEps = Number(process.env.JA_STABLE_EPS || 0.02);
  const stableMs = Number(process.env.JA_STABLE_MS || 1500);
  const tareWin = Number(process.env.JA_TARE_WINDOW || 0.05);
  const autoTare = process.env.JA_AUTO_TARE === '1';
  let lastTareAt = 0;
  const tareCooldownMs = Number(process.env.JA_TARE_COOLDOWN_MS || 3000);

  function parseNumericWeight(line){
    const m = /(-?\d+(?:\.\d+)?)/.exec(String(line));
    return m ? Number(m[1]) : null;
  }

  let autoTareLoggedDisabled = false;
  function maybeAutoTare(weight){
    try {
      if (!autoTare) {
        if (!autoTareLoggedDisabled){ console.log('[auto-tare] disabled (set JA_AUTO_TARE=1 to enable)'); autoTareLoggedDisabled = true; }
        return;
      }
      const now = Date.now();
      if (Math.abs(weight) > tareWin) return;
      const recent = lastReadings.filter(r => now - r.t <= stableMs);
      if (recent.length < 6) return;
      const min = Math.min(...recent.map(r=>r.w));
      const max = Math.max(...recent.map(r=>r.w));
      const delta = max - min;
      const span = now - recent[0].t;
      if (delta <= stableEps && span >= stableMs){
        if (now - lastTareAt >= tareCooldownMs){
          lastTareAt = now;
          console.log(`[auto-tare] stable: Δ=${delta.toFixed(4)}g span=${span}ms weight=${weight.toFixed(4)}g (eps=${stableEps}, window=${tareWin}) → TARE`);
          try { port.write('T\r\n'); } catch {}
        } else {
          const left = tareCooldownMs - (now - lastTareAt);
          if (left > 0) console.log(`[auto-tare] skipped (cooldown ${left}ms left)`);
        }
      }
    } catch {}
  }

  port.on('data', (buf) => {
    try {
      const chunk = buf.toString('utf8');
      lineBuf += chunk;
      const parts = lineBuf.split(/\r|\n/);
      lineBuf = parts.pop() || '';
      for (const line of parts){
        const trimmed = String(line || '').trim();
        if (trimmed) broadcast(trimmed);
        const w = parseNumericWeight(trimmed);
        if (typeof w === 'number' && !Number.isNaN(w)){
          const t = Date.now();
          lastReadings.push({ t, w });
          if (lastReadings.length > 24) lastReadings.shift();
          maybeAutoTare(w);
        }
      }
    } catch {}
  });

  // Optionally assert DTR/RTS
  try { if (process.env.JA_SET_DTR_RTS !== '0') port.set({ dtr:true, rts:false }, ()=>{}); } catch {}

  // Send enable/continuous sequence on connect
  try {
    if (process.env.JA_CONTINUOUS !== '0') {
      const enableSeq = (process.env.JA_ENABLE_CMDS || 'C,Q,CONT 1,STA 1').split(',').map(s=>s.trim()).filter(Boolean);
      (async () => { for (const cmd of enableSeq){ try { port.write((cmd.endsWith('\r\n')?cmd:cmd+'\r\n')); } catch {} await new Promise(r=>setTimeout(r,120)); } })();
    }
  } catch {}

  // Periodic polling (works even if device isn't in continuous mode)
  const pollSeq = (process.env.JA_POLL_CMDS || 'SI').split(',').map(s=>s.trim()).filter(Boolean);
  console.log('[poll] sequence:', pollSeq.join(','));
  let pollIdx = 0;
  const siMs = Math.max(250, Number(process.env.JA_SI_MS || 1000));
  setInterval(()=>{
    try {
      if (!port.isOpen || pollSeq.length===0) return;
      const cmd = pollSeq[pollIdx % pollSeq.length] || 'SI'; pollIdx++;
      port.write((cmd.endsWith('\r\n')?cmd:cmd+'\r\n'));
    } catch {}
  }, siMs);

  return { port };
}

let scale;
let forced = null;
if (!FORCE){
  scale = new JA5003Serial();
  scale.on('open', ({ path, baud }) => console.log(`[open] ${path} @ ${baud}`));
  scale.on('status', ({ message }) => console.log('[status]', message));
  scale.on('data', ({ raw }) => broadcast(raw));
  scale.on('error', ({ error }) => console.error('[error]', error?.message || error));
  scale.on('close', () => console.log('[close]'));
}

wss.on('connection', (ws)=>{
  ws.on('message', (data)=>{
    const text = String(data || '').trim().toUpperCase();
    if (FORCE){
      const port = forced?.port; if (!port || !port.isOpen) return;
      const write = (s)=> port.write(s.endsWith('\r\n') ? s : s + '\r\n');
      if (text === 'TARE') {
      (async ()=>{
        for (const cmd of (process.env.JA_TARE_CMDS || 'T,Z,TARE,ZERO').split(',').map(s=>s.trim()).filter(Boolean)){
          write(cmd);
          await new Promise(r=>setTimeout(r,120));
        }
      })();
        return;
      }
      if (text === 'T') return write('T');
      if (text === 'Z') return write('Z');
      if (text === 'SI') return write('SI');
      if (text === 'P') return write('P');
      if (text === 'C') return write('C');
      return write(text);
    } else {
      if (text === 'TARE') { scale.tare(); return; }
      if (text === 'T') { scale.send('T'); return; }
      if (text === 'Z') { scale.send('Z'); return; }
      if (text === 'SI') { scale.send('SI'); return; }
      if (text === 'P') { scale.printOnce(); return; }
      if (text === 'C') { scale.toggleContinuous(); return; }
      scale.send(text);
    }
  });
});

srv.listen(PORT, HOST, async ()=>{
  console.log(`JA5003 WS Bridge on ws://${HOST}:${PORT}`);
  if (FORCE){
    try { forced = await openJaPort(); } catch (e) { console.error('[boot] failed to open port:', e?.message || e); }
  } else {
    await scale.start();
  }
});

process.on('SIGINT', async ()=>{ try { if (!FORCE) await scale.stop(); } catch {} process.exit(0); });


