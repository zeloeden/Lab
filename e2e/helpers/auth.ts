import { Page, expect } from '@playwright/test';

export async function ensureLoggedIn(page: Page) {
	await page.goto('/');
	const onLogin = await page
		.getByRole('button', { name: /sign in|login/i })
		.isVisible()
		.catch(() => false);
	if (onLogin) {
		await page.getByLabel(/email|username/i).fill(process.env.E2E_USER ?? 'admin');
		await page.getByLabel(/password/i).fill(process.env.E2E_PASS ?? 'admin123');
		await page.getByRole('button', { name: /sign in|login/i }).click();
		await page.waitForURL('**/dashboard', { timeout: 30000 });
	}
}


