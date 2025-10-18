import { WebSocketServer } from 'ws';
import http from 'http';

/**
 * Mock JA5003 scale WebSocket server for E2E testing
 * Sends fake weight readings every 500ms
 * Handles PING, TARE, and other commands
 */
export function createMockScaleServer(port: number = 9878) {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Mock JA5003 WS Server\n');
  });

  const wss = new WebSocketServer({ server });
  
  let currentWeight = 0.123;
  let isTared = false;
  const readings = [0.123, 0.125, 0.122, 0.124, 0.126, 0.123];
  let readingIdx = 0;

  wss.on('connection', (ws) => {
    console.log('[mock-scale] Client connected');
    
    // Send weight readings periodically
    const interval = setInterval(() => {
      if (ws.readyState === 1) {
        currentWeight = isTared ? 0.000 : readings[readingIdx % readings.length];
        readingIdx++;
        const msg = `ST,+${currentWeight.toFixed(3)} g`;
        ws.send(msg);
      }
    }, 500);

    ws.on('message', (data) => {
      const text = String(data || '').trim().toUpperCase();
      console.log('[mock-scale] Received:', text);
      
      if (text === 'PING') {
        ws.send('PONG');
      } else if (text === 'TARE' || text === 'T' || text === 'Z') {
        isTared = true;
        setTimeout(() => { isTared = false; }, 2000);
        ws.send('ST,+0.000 g');
      } else if (text === 'SI') {
        // Send immediate reading
        ws.send(`ST,+${currentWeight.toFixed(3)} g`);
      }
    });

    ws.on('close', () => {
      console.log('[mock-scale] Client disconnected');
      clearInterval(interval);
    });

    ws.on('error', (err) => {
      console.error('[mock-scale] Error:', err.message);
    });
  });

  return new Promise<{ server: http.Server; wss: WebSocketServer; port: number }>((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => {
      console.log(`[mock-scale] Listening on ws://127.0.0.1:${port}`);
      resolve({ server, wss, port });
    });
    
    server.on('error', (err) => {
      console.error('[mock-scale] Server error:', err);
      reject(err);
    });
  });
}

export function closeMockScaleServer(server: http.Server, wss: WebSocketServer) {
  return new Promise<void>((resolve) => {
    wss.clients.forEach((client) => client.close());
    wss.close(() => {
      server.close(() => {
        console.log('[mock-scale] Server closed');
        resolve();
      });
    });
  });
}

