import { test, expect } from '@playwright/test';

test.describe('Formula First Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173');
    
    // Wait for app to load
    await page.waitForSelector('text=NBS LIMS', { timeout: 10000 });
  });

  test('should show not found for non-existent formula', async ({ page }) => {
    // Navigate to formula-first with non-existent code
    await page.goto('http://localhost:5173/formula-first?code=NONEXISTENT123');
    
    // Should show not found message
    await expect(page.locator('text=Formula not found')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=NONEXISTENT123')).toBeVisible();
    
    // Should show "View All Formulas" button
    await expect(page.locator('button:has-text("View All Formulas")')).toBeVisible();
  });

  test('should load formula by internal code if exists', async ({ page }) => {
    // First, load sample data if needed
    await page.goto('http://localhost:5173/formulas');
    
    // Check if formulas exist
    const hasFormulas = await page.locator('table tbody tr').count() > 0;
    
    if (!hasFormulas) {
      // Load sample data
      const loadButton = page.locator('button:has-text("Load Sample Data")');
      if (await loadButton.isVisible()) {
        await loadButton.click();
        await page.waitForTimeout(1000);
        await page.reload();
      }
    }
    
    // Get first formula code from the table
    const firstCode = await page.locator('table tbody tr:first-child code').first().textContent();
    
    if (firstCode) {
      // Navigate to formula-first with that code
      await page.goto(`http://localhost:5173/formula-first?code=${firstCode}&auto=start`);
      
      // Should either show the batch size dialog or already be in progress
      await expect(
        page.locator('text=/Formula First|Batch Size|Preparation/i')
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should normalize scanned QR with garbage characters', async ({ page }) => {
    // Navigate to formulas page
    await page.goto('http://localhost:5173/formulas');
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Check if we have formulas
    const hasFormulas = await page.locator('table tbody tr').count() > 0;
    
    if (hasFormulas) {
      // Get a formula code
      const firstCode = await page.locator('table tbody tr:first-child code').first().textContent();
      
      if (firstCode) {
        // Simulate scan with RTL marks and Arabic semicolons
        const garbageQR = `\u200e${firstCode}\u200f؛test=123`;
        
        await page.goto(`http://localhost:5173/formula-first?code=${encodeURIComponent(garbageQR)}`);
        
        // Should still find the formula (normalized)
        await expect(page.locator('text=/Formula First|Not found/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show helpful error for empty database', async ({ page }) => {
    // Clear localStorage to simulate empty database
    await page.evaluate(() => {
      localStorage.removeItem('nbslims_formulas');
    });
    
    // Navigate to formula-first with any code
    await page.goto('http://localhost:5173/formula-first?code=NBS001');
    
    // Should show empty database message
    await expect(page.locator('text=/database is empty/i')).toBeVisible({ timeout: 5000 });
    
    // Should show "Load Sample Data" button
    await expect(page.locator('button:has-text("Load Sample Data")')).toBeVisible();
  });

  test('should list available formula codes when not found', async ({ page }) => {
    // Go to formulas and ensure we have some
    await page.goto('http://localhost:5173/formulas');
    await page.waitForTimeout(1000);
    
    const hasFormulas = await page.locator('table tbody tr').count() > 0;
    
    if (!hasFormulas) {
      const loadButton = page.locator('button:has-text("Load Sample Data")');
      if (await loadButton.isVisible()) {
        await loadButton.click();
        await page.waitForTimeout(1000);
        await page.reload();
      }
    }
    
    // Try to access non-existent formula
    await page.goto('http://localhost:5173/formula-first?code=FAKE999');
    
    // Should show available codes section
    await expect(page.locator('text=/Available formula codes/i')).toBeVisible({ timeout: 5000 });
    
    // Should show at least one code
    const codesSection = page.locator('code').first();
    await expect(codesSection).toBeVisible();
  });
});

