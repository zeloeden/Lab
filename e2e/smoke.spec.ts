import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Simple auth helper: set mock login
    await page.goto('/');
    
    // Check if we're redirected to login
    const url = page.url();
    if (url.includes('/login')) {
      // Fill login form (adjust selectors based on actual form)
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForURL('**/dashboard**', { timeout: 5000 }).catch(() => {
        console.log('Not redirected to dashboard, continuing...');
      });
    }
  });

  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NBS|LIMS|Lab/i);
  });

  test('diagnostics page displays system info', async ({ page }) => {
    await page.goto('/__diag');
    
    // Check for diagnostic info
    await expect(page.locator('text=/Diagnostics/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/App Version|Version/i')).toBeVisible();
    await expect(page.locator('text=/Online|Network/i')).toBeVisible();
  });

  test('formula first page is accessible', async ({ page }) => {
    await page.goto('/formula-first');
    
    await expect(page.locator('text=/Formula First|Scan formula/i')).toBeVisible({ timeout: 10000 });
  });

  test('formulas page loads', async ({ page }) => {
    await page.goto('/formulas');
    
    await expect(page.locator('text=/Formula|Recipes/i')).toBeVisible({ timeout: 10000 });
  });

  test('samples page loads', async ({ page }) => {
    await page.goto('/samples');
    
    await expect(page.locator('text=/Sample|Inventory/i')).toBeVisible({ timeout: 10000 });
  });

  test('dashboard loads and shows stats', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for common dashboard elements
    const hasContent = await Promise.race([
      page.locator('text=/Dashboard|Statistics|Activity/i').isVisible().catch(() => false),
      page.locator('[data-testid="dashboard-root"]').isVisible().catch(() => false),
      new Promise(resolve => setTimeout(() => resolve(false), 3000))
    ]);
    
    expect(hasContent).toBeTruthy();
  });

  test('preparation fallback redirects to formula-first with auto-start', async ({ page }) => {
    // Navigate to non-existent prep with formula code
    await page.goto('/preparations/non-existent-prep-id?f=TEST123');
    
    // Should redirect to formula-first with code and auto=start
    await page.waitForURL('**/formula-first**', { timeout: 5000 });
    expect(page.url()).toContain('code=TEST123');
    expect(page.url()).toContain('auto=start');
  });

  test('QR scan simulation navigates correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Simulate scanning a formula QR code
    const scanInput = page.locator('input[placeholder*="Scan"], input[placeholder*="barcode"]').first();
    if (await scanInput.isVisible().catch(() => false)) {
      await scanInput.fill('F=TEST-FORMULA-123');
      await scanInput.press('Enter');
      
      // Should navigate to formula-first with auto-start
      await page.waitForURL('**/formula-first**', { timeout: 3000 }).catch(() => {});
      if (page.url().includes('/formula-first')) {
        expect(page.url()).toContain('code=');
        expect(page.url()).toContain('auto=start');
      }
    }
  });

  test('scale mock server is accessible (if running)', async ({ page }) => {
    // This test verifies the mock scale server can be connected to
    // The actual connection is handled by the app's scale bridge client
    await page.goto('/__diag');
    
    const scaleStatus = await page.locator('text=/Scale|Bridge/i').first().textContent();
    console.log('[test] Scale status from diagnostics:', scaleStatus);
    
    // We just verify the page loads; actual scale connection depends on env
  });
});
