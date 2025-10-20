#!/usr/bin/env node
'use strict';

// Simple, robust WebSocket bridge for JA5003 scale
// Single file, no dependencies on other modules

import http from 'node:http';
import { WebSocketServer } from 'ws';
import { SerialPort } from 'serialport';

const HOST = '127.0.0.1';
const PORT = 8787;
const COM_PORT = process.env.JA_PORT || 'COM3';
const BAUD_RATE = parseInt(process.env.JA_BAUD || '9600', 10);

// Stability detection config (tunable via env)
const STABLE_WINDOW_MS = Number(process.env.JA_STABLE_WINDOW_MS ?? 1000);
const STABLE_MIN_COUNT = Number(process.env.JA_STABLE_MIN_COUNT ?? 5);
const STABLE_EPSILON_G = Number(process.env.JA_STABLE_EPSILON_G ?? 0.002);
const STABLE_COOLDOWN_MS = Number(process.env.JA_STABLE_COOLDOWN_MS ?? 500);

console.log('=== Simple JA5003 Bridge ===');
console.log(`Connecting to ${COM_PORT} at ${BAUD_RATE} baud...`);

// Stabilizer class - computes stable flag based on rolling window
class Stabilizer {
  constructor() {
    this.samples = []; // [{t, v}]
    this.lastCommitTs = 0;
    this.lastStable = false;
  }

  push(ts, v) {
    // Prune old samples outside window
    const cutoff = ts - STABLE_WINDOW_MS;
    this.samples.push({ t: ts, v });
    while (this.samples.length && this.samples[0].t < cutoff) {
      this.samples.shift();
    }

    // Need minimum sample count in window
    if (this.samples.length < STABLE_MIN_COUNT) {
      return { stable: false };
    }

    // Compute spread (max - min)
    let min = Infinity, max = -Infinity;
    for (const s of this.samples) {
      if (s.v < min) min = s.v;
      if (s.v > max) max = s.v;
    }
    const spread = max - min;
    const stableNow = spread <= STABLE_EPSILON_G;

    // Sticky stable: don't flap too fast (hysteresis)
    if (!stableNow && this.lastStable && (ts - this.lastCommitTs) < STABLE_COOLDOWN_MS) {
      return { stable: true, value: this.samples[this.samples.length - 1].v };
    }

    this.lastStable = stableNow;
    if (stableNow) this.lastCommitTs = ts;

    return stableNow
      ? { stable: true, value: this.samples[this.samples.length - 1].v }
      : { stable: false };
  }
}

const stabilizer = new Stabilizer();

// Open serial port with exact same settings as PowerShell
const serialPort = new SerialPort({
  path: COM_PORT,
  baudRate: BAUD_RATE,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  rtscts: false,
  xon: false,
  xoff: false,
  autoOpen: true
});

let lastPacketTime = Date.now();

// Handle serial port events
serialPort.on('open', () => {
  console.log(`✓ Serial port ${COM_PORT} OPENED`);
  console.log(`  Settings: ${BAUD_RATE} baud, 8N1, no flow control`);
});

serialPort.on('error', (err) => {
  console.error('✗ Serial port ERROR:', err.message);
});

serialPort.on('close', () => {
  console.warn('⚠ Serial port CLOSED');
  process.exit(1);
});

// Parse incoming data
let buffer = '';
serialPort.on('data', (chunk) => {
  const text = chunk.toString('utf8');
  buffer += text;
  
  // Split by newlines
  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    console.log('[RX]', trimmed);
    lastPacketTime = Date.now();
    
    // Extract weight if present
    const match = trimmed.match(/WT:\s*([\d.]+)\s*g/i);
    if (match) {
      const grams = parseFloat(match[1]);
      const ts = Date.now();
      const st = stabilizer.push(ts, grams);
      
      // Create structured packet with stability info
      const msg = {
        type: 'weight',
        value: grams,
        unit: 'g',
        ts,
        stable: !!st.stable,
      };
      
      // Broadcast structured JSON to all WebSocket clients
      broadcastToClients(JSON.stringify(msg));
      
      console.log(`  → Weight: ${grams} g [${msg.stable ? 'STABLE' : 'live'}]`);
    }
  }
});

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('JA5003 Simple Bridge\n');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (data) => {
    const text = String(data).trim().toUpperCase();
    console.log('[WS RX]', text);
    
    if (text === 'PING') {
      ws.send('PONG');
      return;
    }
    
    // Send command to scale
    if (text === 'TARE' || text === 'T') {
      serialPort.write('T\r\n');
    } else if (text === 'ZERO' || text === 'Z') {
      serialPort.write('Z\r\n');
    } else {
      serialPort.write(text + '\r\n');
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

function broadcastToClients(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      try {
        client.send(message);
      } catch (err) {
        console.error('Broadcast error:', err.message);
      }
    }
  });
}

// Start HTTP/WebSocket server
server.listen(PORT, HOST, () => {
  console.log(`✓ WebSocket bridge running on ws://${HOST}:${PORT}`);
  console.log('');
  console.log('Waiting for scale data...');
  console.log('(Place something on the scale to test)');
});

// Monitor data flow
setInterval(() => {
  const age = Date.now() - lastPacketTime;
  if (age > 15000) {
    console.warn(`⚠ No data received for ${(age/1000).toFixed(0)}s`);
  }
}, 15000);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  serialPort.close();
  server.close();
  process.exit(0);
});

