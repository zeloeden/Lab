# Preparation Flow Refactored to Modal-Based

## Summary

The preparation workflow has been refactored from a route-based system (`/preparations/:id`) to a modal-based system. This provides a more seamless user experience where scanning a formula QR code instantly opens the preparation modal without navigating away from the current page.

---

## Changes Made

### 1. Removed `/preparations/:id` Route

**File:** `src/App.tsx`

- **Removed:**
  - Import: `const PreparationDetail = lazyNamed(() => import('@/pages/PreparationDetail'), 'PreparationDetail');`
  - Route: `<Route path="/preparations/:id" element={<Layout><PreparationDetail /></Layout>} />`

- **Reason:** Preparations are now entirely modal-based, so a dedicated route is no longer needed.

---

### 2. Updated FormulaFirst.tsx to Open Modals

**File:** `src/pages/FormulaFirst.tsx`

**Changes:**

1. **Added state for current formula:**
   ```typescript
   const [currentFormula, setCurrentFormula] = useState<Formula|null>(null);
   ```

2. **Modified auto-start logic** to open modal instead of navigating:
   ```typescript
   if (mode === 'prep') {
     // Open modal instead of navigating to a route
     setCurrentFormula(formulaByCode.data as any);
     setSelected(formulaByCode.data as any);
     setPrepOpen(true); // Open batch size dialog
   } else {
     // Resume test management for the latest session of that formula
     navigate(`/test-management?sessionId=${session.id}`, { replace: true });
   }
   ```

3. **Updated QR parsing** to handle prep QRs gracefully:
   - If a prep QR contains a formula code, redirect to that formula with auto-start
   - Otherwise, show an informative error message

4. **Enhanced wizard modal** with better UX:
   - Full-screen modal (95vw × 90vh)
   - Close button
   - Proper header with formula name and batch size
   - Scrollable content area

---

### 3. Updated Scan Navigation Handler

**File:** `src/lib/handleScanNavigation.ts`

**Changes:**

- **Before:** `nav(\`/preparations/${encodeURIComponent(qr.id)}\`);`
- **After:** Check for formula code in QR extras and redirect to formula-first with auto-start:
  ```typescript
  case 'prep':
    // Preparations are now modal-based. If there's a formula code in extras, redirect to it
    if (qr.extras?.formulaCode) {
      const params = new URLSearchParams({ code: qr.extras.formulaCode, auto: 'start' });
      nav(`/formula-first?${params.toString()}`);
    } else {
      // No formula context - this shouldn't happen with proper QR generation
      console.warn('Prep QR without formula code - cannot open modal');
    }
    break;
  ```

---

### 4. Updated Scan Resolver

**File:** `src/services/scanResolver.client.ts`

**Changes:**

- **Before:** Returns routes like `/preparations/${s.id}`
- **After:** Returns routes like `/formula-first?code=${code}&auto=start`

**Implementation:**
- Created helper function `formulaRoute()` that generates formula-first URLs
- All resolver paths now use this helper to redirect to formula-first instead of preparations
- The formula-first page then handles opening the modal

---

## User Flow

### Before (Route-Based)

```
Scan QR → Navigate to /preparations/:id → Wait for page load → Show prep UI
```

### After (Modal-Based)

```
Scan QR → Navigate to /formula-first?code=X&auto=start 
       → Formula loads → Modal opens instantly → Batch size dialog 
       → User confirms → Guided prep wizard opens (modal)
       → User completes prep → Modal closes → Back on formulas page
```

---

## Benefits

1. **Faster UX:** Modals open instantly without page navigation
2. **Context Preservation:** Stay on the current page while preparing
3. **Hardware Integration:** Scale bridge connection persists across modal open/close
4. **Cleaner Architecture:** No need for route-level state management
5. **Better Mobile Experience:** Modal UI works better on tablets/phones

---

## Testing Checklist

- [x] Remove `/preparations/:id` route
- [x] Update FormulaFirst to open modals
- [x] Update scan handlers (handleScanNavigation)
- [x] Update scan resolver (scanResolver.client)
- [x] No linting errors
- [x] Fixed React Hooks violation (early return moved after all hooks)
- [ ] Test: Scan formula QR → Modal opens
- [ ] Test: Modal shows batch size dialog first
- [ ] Test: Batch size dialog → Guided wizard
- [ ] Test: Scale integration works in modal
- [ ] Test: Modal close button works
- [ ] Test: Completion flow (sample creation, test scheduling)
- [ ] Test: Resume flow (existing in-progress prep)

---

## Files Modified

1. `src/App.tsx` - Removed preparation route
2. `src/pages/FormulaFirst.tsx` - Added modal management, fixed hooks order violation
3. `src/lib/handleScanNavigation.ts` - Redirect to formula-first
4. `src/services/scanResolver.client.ts` - Generate formula-first routes

## Bug Fixes

### React Hooks Violation

**Issue:** "Rendered fewer hooks than expected" error in FormulaFirst component

**Cause:** Early return statement (`return <div>Formula not found</div>`) was placed between hooks (after `useEffect` but before `useMemo`), violating React's Rules of Hooks.

**Fix:** Moved the early return check to happen **after all hooks** are declared:

```typescript
// ❌ WRONG - Early return between hooks
useEffect(() => { ... });
if (code && !data) return <div>Not found</div>; // ← Violates hooks rules
const header = useMemo(() => { ... });

// ✅ CORRECT - Early return after all hooks
useEffect(() => { ... });
const header = useMemo(() => { ... });
useEffect(() => { ... });
// All hooks declared first, THEN early returns
if (code && !data) return <div>Not found</div>;
```

**Rule:** All hooks must be called in the same order on every render. Never put return statements between hook calls.

---

## Breaking Changes

⚠️ **URL Change:** Any bookmarks or external links to `/preparations/:id` will no longer work. Users should use formula QR codes or the formulas page to start preparations.

---

## Future Enhancements

1. **Resume Preparation:** Add "Resume" button on formulas page for in-progress preps
2. **Preparation History:** Show list of past preparations in formula detail modal
3. **Multi-Prep:** Allow multiple preparation modals open at once (advanced users)
4. **Keyboard Shortcuts:** Add shortcuts for common prep actions (tare, next step, etc.)
5. **Prep Templates:** Save custom batch sizes per formula

---

## Rollback Plan

If issues arise, you can rollback by:

1. Revert `src/App.tsx` to restore the `/preparations/:id` route
2. Revert `src/pages/FormulaFirst.tsx` to use `navigate()` instead of `setPrepOpen()`
3. Revert scan handlers to return `/preparations/:id` URLs
4. Redeploy previous version

---

## Related Documentation

- [COMPLETE_SYSTEM_WORKFLOW.md](./COMPLETE_SYSTEM_WORKFLOW.md) - Full system documentation
- [START_OR_RESUME_FLOW.md](./START_OR_RESUME_FLOW.md) - Session management logic
- [TECHNICAL_SPEC_FOR_AI.md](./TECHNICAL_SPEC_FOR_AI.md) - Technical architecture

