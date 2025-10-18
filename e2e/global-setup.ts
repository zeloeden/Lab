import { FullConfig } from '@playwright/test';
import { createMockScaleServer } from './mocks/mock-scale-ws';
import * as http from 'http';
import { WebSocketServer } from 'ws';

let mockScaleServer: { server: http.Server; wss: WebSocketServer; port: number } | null = null;

async function globalSetup(config: FullConfig) {
  console.log('[global-setup] Starting mock scale server...');
  
  try {
    // Start mock scale server on port 9878
    mockScaleServer = await createMockScaleServer(9878);
    console.log('[global-setup] Mock scale server running on ws://127.0.0.1:9878');
    
    // Set environment variable for the app to use mock scale
    process.env.VITE_SCALE_WS_URL = 'ws://127.0.0.1:9878';
    
    // Store server reference globally for teardown
    (global as any).__MOCK_SCALE_SERVER__ = mockScaleServer;
  } catch (err) {
    console.error('[global-setup] Failed to start mock scale server:', err);
    // Don't fail the whole test suite if mock server can't start
  }
}

export default globalSetup;

