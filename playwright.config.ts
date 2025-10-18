import { defineConfig } from '@playwright/test';

export default defineConfig({
	timeout: 30_000,
	globalSetup: './e2e/global-setup.ts',
	globalTeardown: './e2e/global-teardown.ts',
	testDir: './e2e',
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	webServer: {
		command: 'pnpm run dev:safe',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		stdout: 'pipe',
		stderr: 'pipe',
	},
	reporter: [
		['html', { outputFolder: 'playwright-report' }],
		['list'],
	],
});


