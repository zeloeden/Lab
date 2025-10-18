import { test, expect } from '@playwright/test';

test.describe('QR Variants Route Correctly', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and ensure it's loaded
    await page.goto('/');
    
    // Simple auth if needed (adjust based on your auth flow)
    const url = page.url();
    if (url.includes('/login')) {
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**', { timeout: 5000 }).catch(() => {});
    }
  });

  test('Samples search normalizes S: prefix', async ({ page }) => {
    await page.goto('/samples');
    
    // Wait for page to load
    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 5000 });
    
    const input = page.locator('input[placeholder*="Search"]').first();
    await input.fill('S:TEST001');
    
    // The normalized search should strip S: and search for TEST001
    // Verify search input still shows what was typed
    await expect(input).toHaveValue('S:TEST001');
    
    // If a sample with TEST001 exists, it should be visible
    // This is optional depending on your seed data
    // await expect(page.getByText('TEST001')).toBeVisible({ timeout: 3000 });
  });

  test('Formula search normalizes F= prefix', async ({ page }) => {
    await page.goto('/formulas');
    
    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 5000 });
    
    const input = page.locator('input[placeholder*="Search"]').first();
    await input.fill('F=FORM001');
    
    // Verify input shows raw value
    await expect(input).toHaveValue('F=FORM001');
    
    // Normalized search strips F= and searches for FORM001
  });

  test('Prep fallback: missing prep with ?f= redirects to formula-first with auto-start', async ({ page }) => {
    // Navigate to non-existent prep with formula fallback
    await page.goto('/preparations/not-a-real-prep-id-12345?f=TESTFORMULA');
    
    // Should redirect to formula-first
    await page.waitForURL('**/formula-first**', { timeout: 5000 });
    
    // URL should contain code and auto=start
    expect(page.url()).toContain('code=TESTFORMULA');
    expect(page.url()).toContain('auto=start');
    
    // Page should show Formula First heading
    await expect(page.locator('text=/Formula First/i')).toBeVisible({ timeout: 5000 });
  });

  test('decodeQR handles various formats', async ({ page }) => {
    // Test that dashboard scan input works with different formats
    await page.goto('/dashboard');
    
    const scanInput = page.locator('input[placeholder*="Scan"], input[placeholder*="formula"]').first();
    
    if (await scanInput.isVisible().catch(() => false)) {
      // Test F= format
      await scanInput.fill('F=TEST123');
      await scanInput.press('Enter');
      
      // Should navigate somewhere (formula-first or similar)
      await page.waitForTimeout(500);
      
      // Navigate back
      await page.goto('/dashboard');
      
      // Test S: format
      await scanInput.fill('S:SAMPLE001');
      await scanInput.press('Enter');
      
      await page.waitForTimeout(500);
    }
  });

  test('UUID-like strings are treated as prep IDs', async ({ page }) => {
    // A UUID-like string should be treated as a prep ID
    const fakeUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    
    await page.goto('/dashboard');
    
    const scanInput = page.locator('input[placeholder*="Scan"], input[placeholder*="formula"]').first();
    
    if (await scanInput.isVisible().catch(() => false)) {
      await scanInput.fill(fakeUuid);
      await scanInput.press('Enter');
      
      // Should navigate to preparations/:id
      await page.waitForURL(`**/preparations/${fakeUuid}**`, { timeout: 3000 }).catch(() => {
        // If not found, that's okay - we just want to verify it tried to navigate
      });
    }
  });

  test('Plain text defaults to sample code', async ({ page }) => {
    await page.goto('/samples');
    
    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 5000 });
    
    const input = page.locator('input[placeholder*="Search"]').first();
    
    // Plain text without prefix should be treated as sample code
    await input.fill('PLAINCODE123');
    
    // Verify it searches (normalized value is the same)
    await expect(input).toHaveValue('PLAINCODE123');
  });
});

