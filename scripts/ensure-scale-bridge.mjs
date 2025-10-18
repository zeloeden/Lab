#!/usr/bin/env node
/**
 * Ensures the JA5003 WebSocket bridge is running
 * - Checks if port 8787 is already in use
 * - If free, spawns the bridge as a detached background process
 * - Logs bridge state
 */

import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.JA_WS_PORT || '8787', 10);
const HOST = process.env.JA_WS_HOST || '127.0.0.1';
const LOCK_FILE = join(os.tmpdir(), 'ja5003_ws_bridge.lock');

/**
 * Check if a port is in use
 */
function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port, host);
  });
}

/**
 * Check if the bridge is already running by checking the lock file
 */
function checkExistingBridge() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      console.log(`[bridge] Found existing instance: PID ${lock.pid}, port ${lock.port}`);
      
      // Verify the process is still running
      try {
        process.kill(lock.pid, 0); // Signal 0 checks existence without killing
        return lock;
      } catch {
        console.log('[bridge] Stale lock file detected, will start new instance');
        fs.unlinkSync(LOCK_FILE);
        return null;
      }
    }
  } catch (err) {
    console.error('[bridge] Error checking lock file:', err.message);
  }
  return null;
}

/**
 * Start the bridge as a detached process
 */
function startBridge() {
  const bridgePath = join(__dirname, 'ja5003_ws_bridge.js');
  
  if (!fs.existsSync(bridgePath)) {
    console.error(`[bridge] Bridge script not found at ${bridgePath}`);
    return null;
  }
  
  console.log('[bridge] Starting WebSocket bridge...');
  
  const env = {
    ...process.env,
    JA_FORCE_OPEN: '1',
    JA_PORT: process.env.JA_PORT || 'AUTO',
    JA_BAUD: process.env.JA_BAUD || '9600',
    JA_CONTINUOUS: '1',
    JA_SI_MS: process.env.JA_SI_MS || '500',
    JA_WS_PORT: String(PORT),
    JA_WS_HOST: HOST,
  };
  
  const child = spawn('node', [bridgePath], {
    detached: true,
    stdio: 'ignore',
    env,
  });
  
  child.unref(); // Allow parent to exit independently
  
  console.log(`[bridge] Started bridge process (PID: ${child.pid}) on ws://${HOST}:${PORT}`);
  console.log('[bridge] Bridge is running in the background');
  
  return child;
}

/**
 * Main function
 */
async function main() {
  console.log(`[bridge] Checking if bridge is needed on ws://${HOST}:${PORT}...`);
  
  // Check for existing bridge via lock file
  const existingBridge = checkExistingBridge();
  if (existingBridge) {
    console.log(`[bridge] Bridge already running (PID: ${existingBridge.pid}, port: ${existingBridge.port})`);
    console.log(`[bridge] Connect to ws://${existingBridge.host || HOST}:${existingBridge.port}`);
    return;
  }
  
  // Check if port is in use
  const inUse = await isPortInUse(PORT, HOST);
  if (inUse) {
    console.log(`[bridge] Port ${PORT} already in use (likely by bridge or another service)`);
    console.log(`[bridge] Assuming bridge is running. Connect to ws://${HOST}:${PORT}`);
    return;
  }
  
  // Start the bridge
  console.log(`[bridge] Port ${PORT} is free, starting bridge...`);
  const child = startBridge();
  
  if (child) {
    // Wait a bit to see if it starts successfully
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if port is now in use
    const nowInUse = await isPortInUse(PORT, HOST);
    if (nowInUse) {
      console.log(`✓ [bridge] Bridge started successfully on ws://${HOST}:${PORT}`);
    } else {
      console.warn(`⚠ [bridge] Bridge may have failed to start. Check logs.`);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[bridge] Error:', err);
    process.exit(1);
  });
}

export { main as ensureBridgeRunning, isPortInUse, checkExistingBridge, startBridge };

