import { FullConfig } from '@playwright/test';
import { closeMockScaleServer } from './mocks/mock-scale-ws';

async function globalTeardown(config: FullConfig) {
  console.log('[global-teardown] Cleaning up mock scale server...');
  
  const mockServer = (global as any).__MOCK_SCALE_SERVER__;
  if (mockServer) {
    try {
      await closeMockScaleServer(mockServer.server, mockServer.wss);
      console.log('[global-teardown] Mock scale server closed');
    } catch (err) {
      console.error('[global-teardown] Error closing mock scale server:', err);
    }
  }
}

export default globalTeardown;

