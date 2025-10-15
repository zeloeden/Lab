import { defineConfig } from '@playwright/test';

export default defineConfig({
	timeout: 30_000,
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
	},
	webServer: {
		command: 'pnpm run dev:safe',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	},
});


