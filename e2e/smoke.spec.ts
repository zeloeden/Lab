import { test, expect } from '@playwright/test';

test('app mounts and routes work', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.waitForURL('**/dashboard');
  await expect(page.locator('body')).toBeVisible();

  await page.goto('http://localhost:5173/formulas');
  await expect(page.locator('body')).toBeVisible();

  await page.goto('http://localhost:5173/formula-first');
  await expect(page.locator('body')).toBeVisible();

  await page.goto('http://localhost:5173/preparations/123');
  await expect(page.locator('body')).toBeVisible();

  await page.goto('http://localhost:5173/__diag');
  await expect(page.getByText('Diagnostics')).toBeVisible();
});


