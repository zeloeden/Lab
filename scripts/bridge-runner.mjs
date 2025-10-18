#!/usr/bin/env node
/**
 * Resilient JA5003 WebSocket Bridge Runner
 * - Checks if bridge is already running
 * - Spawns bridge with auto-restart on crash
 * - Exponential backoff: 1s → 2s → 5s (capped)
 * - Single instance via .bridge.lock pidfile
 * - Cross-platform (Windows, Linux, Mac)
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WS_HOST = process.env.JA_WS_HOST || '127.0.0.1';
const WS_PORT = Number(process.env.JA_WS_PORT || 8787);
const LOCK_PATH = path.resolve('.bridge.lock');

/**
 * Check if WebSocket bridge is already listening on the port
 */
function checkWsUp(host = WS_HOST, port = WS_PORT, timeoutMs = 800) {
  return new Promise((resolve) => {
    const req = http.request({ 
      host, 
      port, 
      method: 'GET', 
      timeout: timeoutMs 
    }, () => {
      // Any response means something is listening
      req.destroy();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { 
      req.destroy(); 
      resolve(false); 
    });
    req.end();
  });
}

/**
 * Write PID to lock file
 */
function writeLock(pid) {
  try { 
    fs.writeFileSync(LOCK_PATH, JSON.stringify({ pid, port: WS_PORT, timestamp: Date.now() })); 
  } catch (e) {
    console.error('[bridge-runner] Failed to write lock file:', e.message);
  }
}

/**
 * Remove lock file
 */
function clearLock() {
  try { 
    if (fs.existsSync(LOCK_PATH)) {
      fs.unlinkSync(LOCK_PATH); 
      console.log('[bridge-runner] Lock file cleared');
    }
  } catch (e) {
    console.error('[bridge-runner] Failed to clear lock file:', e.message);
  }
}

/**
 * Check if process is running by PID
 */
function isProcessRunning(pid) {
  try {
    process.kill(pid, 0); // Signal 0 checks existence without killing
    return true;
  } catch {
    return false;
  }
}

/**
 * Main runner function
 */
async function main() {
  console.log(`[bridge-runner] Checking for existing bridge on ws://${WS_HOST}:${WS_PORT}...`);
  
  // Check if bridge is already running via network probe
  const up = await checkWsUp();
  if (up) {
    console.log(`✓ [bridge-runner] Bridge already running on ws://${WS_HOST}:${WS_PORT}`);
    return;
  }

  // Check lock file for stale instance
  if (fs.existsSync(LOCK_PATH)) {
    try {
      const lock = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));
      if (lock.pid && isProcessRunning(lock.pid)) {
        console.log(`[bridge-runner] Lock file exists for PID ${lock.pid}, but port not responding. Cleaning up...`);
      }
      fs.unlinkSync(LOCK_PATH);
    } catch {
      fs.unlinkSync(LOCK_PATH);
    }
  }

  let backoffIdx = 0;
  const backoffs = [1000, 2000, 5000, 5000]; // Exponential backoff with cap
  let childProcess = null;
  let healthCheckInterval = null;

  const env = {
    ...process.env,
    JA_FORCE_OPEN: process.env.JA_FORCE_OPEN ?? '1',
    JA_PORT: process.env.JA_PORT ?? 'AUTO',
    JA_BAUD: process.env.JA_BAUD ?? '9600',
    JA_CONTINUOUS: process.env.JA_CONTINUOUS ?? '1',
    JA_POLL_CMDS: process.env.JA_POLL_CMDS ?? '',
    JA_SI_MS: process.env.JA_SI_MS ?? '500',
    JA_WS_PORT: String(WS_PORT),
    JA_WS_HOST: WS_HOST,
  };

  /**
   * Spawn the bridge process
   */
  function spawnBridge() {
    const bridgePath = path.join(__dirname, 'ja5003_ws_bridge.js');
    
    console.log(`[bridge-runner] Starting WS bridge on ws://${WS_HOST}:${WS_PORT}`);
    console.log(`[bridge-runner] Bridge script: ${bridgePath}`);
    
    childProcess = spawn(process.execPath, [bridgePath], {
      stdio: ['ignore', 'pipe', 'pipe'], // Capture stdout/stderr
      detached: false, // Keep attached for better process management
      env,
    });
    
    writeLock(childProcess.pid);
    
    // Log bridge output
    childProcess.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(line => console.log(`[bridge] ${line}`));
    });
    
    childProcess.stderr?.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(line => console.error(`[bridge] ${line}`));
    });

    // Handle bridge exit
    childProcess.on('exit', (code, signal) => {
      console.warn(`[bridge-runner] Bridge exited (code=${code} signal=${signal})`);
      clearLock();
      
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
      }
      
      // Auto-restart with backoff
      const delay = backoffs[backoffIdx];
      console.log(`[bridge-runner] Restarting in ${delay}ms...`);
      backoffIdx = Math.min(backoffIdx + 1, backoffs.length - 1);
      
      setTimeout(() => {
        spawnBridge();
      }, delay);
    });

    childProcess.on('error', (err) => {
      console.error(`[bridge-runner] Failed to spawn bridge:`, err.message);
    });

    // Reset backoff on successful startup (after 10s)
    setTimeout(() => {
      backoffIdx = 0;
      console.log('[bridge-runner] Bridge stable, reset backoff');
    }, 10000);

    // Periodic health check via TCP probe
    healthCheckInterval = setInterval(async () => {
      const alive = await checkWsUp();
      if (!alive && childProcess && !childProcess.killed) {
        console.warn('[bridge-runner] Health check failed, bridge port not responding');
        // Let the exit handler restart it
        childProcess.kill('SIGTERM');
      }
    }, 5000);
  }

  // Cleanup handlers
  process.on('exit', () => {
    clearLock();
    if (healthCheckInterval) clearInterval(healthCheckInterval);
  });
  
  process.on('SIGINT', () => {
    console.log('\n[bridge-runner] Received SIGINT, cleaning up...');
    clearLock();
    if (childProcess && !childProcess.killed) {
      childProcess.kill('SIGTERM');
    }
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('[bridge-runner] Received SIGTERM, cleaning up...');
    clearLock();
    if (childProcess && !childProcess.killed) {
      childProcess.kill('SIGTERM');
    }
    process.exit(0);
  });

  // Start the bridge
  spawnBridge();
}

// Run if called directly
main().catch((err) => {
  console.error('[bridge-runner] Fatal error:', err);
  clearLock();
  process.exit(1);
});

