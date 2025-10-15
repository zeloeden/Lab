import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from './helpers/auth';

test('app mounts and key routes work', async ({ page }) => {
  await ensureLoggedIn(page);
  await expect(page.locator('body')).toBeVisible();

  await page.goto('/formulas');
  await expect(page.locator('body')).toBeVisible();

  await page.goto('/formula-first');
  await expect(page.locator('body')).toBeVisible();

  await page.goto('/preparations/123');
  await expect(page.locator('body')).toBeVisible();

  await page.goto('/__diag', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /diagnostics/i })).toBeVisible({ timeout: 15000 });
});


