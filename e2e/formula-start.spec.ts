import { test, expect } from '@playwright/test';

/**
 * Test: Formula code auto-start creates a preparation and navigates to detail page
 * 
 * This test verifies the deterministic flow:
 * 1. Navigate to /formula-first?code=X&auto=start
 * 2. FormulaFirst finds the formula
 * 3. createPreparationFromFormula() creates prep session + steps
 * 4. Navigate to /preparations/:id (only after creation completes)
 * 5. PreparationDetail loads with retry (allowing DB commit)
 */
test('formula code starts a preparation and lands on detail', async ({ page }) => {
  // Use a real formula code from your seed data
  // Adjust this to match a formula that exists in localStorage or Dexie
  const FORMULA_CODE = 'PRM00936'; // ⚠️ Replace with actual code from your test DB

  // Navigate with auto=start
  await page.goto(`http://localhost:5173/formula-first?code=${FORMULA_CODE}&auto=start`);

  // Should see Formula First page briefly (loading or found state)
  await expect(
    page.getByText(/Formula First|Looking up formula|Found formula/i)
  ).toBeVisible({ timeout: 5000 });

  // After creation completes, should redirect to /preparations/:uuid
  await expect(page).toHaveURL(/\/preparations\/[0-9a-f-]{20,}/, { timeout: 10000 });

  // Should see preparation detail UI
  await expect(
    page.getByText(/Preparation|Target|Seq|Ingredient|Operator/i)
  ).toBeVisible({ timeout: 5000 });

  // Should NOT see "Preparation not found" (which was the old bug)
  await expect(page.getByText(/Preparation not found/i)).not.toBeVisible();
});

/**
 * Test: Invalid formula code shows error (doesn't crash)
 */
test('invalid formula code shows not found error', async ({ page }) => {
  const INVALID_CODE = 'NOT_A_REAL_FORMULA_CODE_12345';

  await page.goto(`http://localhost:5173/formula-first?code=${INVALID_CODE}&auto=start`);

  // Should show "Formula not found" error
  await expect(
    page.getByText(/Formula not found/i)
  ).toBeVisible({ timeout: 5000 });

  // Should NOT redirect to preparations
  await expect(page).not.toHaveURL(/\/preparations\//);
});

/**
 * Test: Prep fallback - if prep doesn't exist but ?f=CODE is present, bounce to formula-first
 */
test('prep not found with formula fallback redirects to auto-start', async ({ page }) => {
  const FORMULA_CODE = 'PRM00936'; // ⚠️ Replace with actual code
  const BOGUS_PREP_ID = 'not-a-real-prep-id-12345';

  // Try to view a non-existent prep with a formula fallback
  await page.goto(`http://localhost:5173/preparations/${BOGUS_PREP_ID}?f=${FORMULA_CODE}`);

  // Should redirect to formula-first with auto=start
  await expect(page).toHaveURL(
    new RegExp(`/formula-first\\?code=${FORMULA_CODE}.*auto=start`),
    { timeout: 5000 }
  );

  // Then should create prep and land on /preparations/:id
  await expect(page).toHaveURL(/\/preparations\/[0-9a-f-]{20,}/, { timeout: 10000 });
});

/**
 * Test: Direct navigation to formula-first without auto=start shows UI (no auto-create)
 */
test('formula-first without auto=start shows manual start UI', async ({ page }) => {
  const FORMULA_CODE = 'PRM00936'; // ⚠️ Replace with actual code

  // Navigate WITHOUT auto=start
  await page.goto(`http://localhost:5173/formula-first?code=${FORMULA_CODE}`);

  // Should show the formula info
  await expect(page.getByText(/Found formula|Formula First/i)).toBeVisible({ timeout: 5000 });

  // Should NOT auto-redirect to preparations (because no auto=start)
  await page.waitForTimeout(2000); // Wait a bit to ensure no redirect
  await expect(page).toHaveURL(/\/formula-first/);
});

