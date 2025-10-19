# QR Parser & Formula Lookup Refactor

## Summary

Implemented a comprehensive QR code parsing and formula lookup system to handle scanner garbage characters, normalize input, and provide better error messages.

---

## Changes Made

### 1. Universal QR Parser (`src/lib/qr.ts`) ✅

**New file** with comprehensive QR parsing utilities:

- `normalizeScan(input)` - Removes RTL marks, Arabic punctuation, normalizes Unicode
- `parseQR(input)` - Parses QR codes into structured data (formula/sample/unknown)
- `isUuid(str)` - UUID v4 validation
- `isFormulaCode(str)` - Formula code pattern matching (NBS001, PRM00936, etc.)
- `decodeQR(raw)` - Compatibility function for existing codebase
- `normalizeForSearch(query)` - Alias for search contexts

**Handles:**
- UUID format (formula IDs)
- Formula codes (NBS001, PRM00936)
- Key-value pairs (F=code, S=sample, N=ordinal)
- Mixed formats (F=NBS001;S=sample-123;N=1)
- Garbage characters from wedge scanners (RTL marks, Arabic semicolons)

---

### 2. Centralized Formula Lookup (`src/services/formulas.ts`) ✅

**New file** with formula querying utilities:

- `getFormulaByAny(codeOrId)` - Lookup by UUID or internal code
- `listFormulaCodes(limit)` - Get list of available codes
- `getAllFormulas()` - Get all formulas
- `hasFormulas()` - Check if database is empty

**Features:**
- Case-insensitive code matching
- UUID-first lookup optimization
- localStorage fallback
- Error handling

---

### 3. Enhanced NotFoundFormula Component (`src/components/NotFoundFormula.tsx`) ✅

**New component** for better error UX:

**Displays:**
- Clear error message with the scanned code
- Explanation of why the formula wasn't found
- List of available formula codes (up to 8)
- "View All Formulas" button
- "Load Sample Data" button (if database empty)

**Design:**
- Color-coded sections (red error, blue available codes, yellow empty state)
- Icons for visual clarity
- Responsive layout

---

### 4. Refactored FormulaFirst Page (`src/pages/FormulaFirst.tsx`) ✅

**Major changes:**

1. **Query Param Handling:**
   ```typescript
   // Accept both ?q= and ?code=
   const rawParam = (sp.get('q') ?? sp.get('code') ?? '').trim();
   const normalized = normalizeScan(rawParam);
   ```

2. **QR Parsing:**
   ```typescript
   const parsed = parseQR(normalized);
   const candidateKey = parsed.formulaId ?? parsed.formulaCode ?? normalized;
   ```

3. **Centralized Lookup:**
   ```typescript
   const formulaByCode = useQuery({
     queryKey: ['formulaByCode', candidateKey],
     queryFn: () => getFormulaByAny(candidateKey),
     enabled: !!candidateKey,
   });
   ```

4. **Better Error Handling:**
   ```typescript
   if (candidateKey && formulaByCode.isSuccess && !formulaByCode.data) {
     return <NotFoundFormula code={candidateKey} />;
   }
   ```

5. **Debug Logging:**
   ```typescript
   console.debug('[formula-first]', { 
     candidateKey, 
     isLoading, 
     hasData,
     auto 
   });
   ```

---

### 5. Normalized Dashboard Scans (`src/pages/DashboardNew.tsx`) ✅

**Updated scan handler:**

```typescript
async function handleScannedCode(code: string){
  const { normalizeScan } = await import('@/lib/qr');
  const clean = normalizeScan(code);
  console.debug('[qr] scan raw:', code, 'clean:', clean);
  
  handleScanNavigation(navigate, clean);
}
```

**Benefits:**
- Removes RTL marks from wedge scanner output
- Converts Arabic semicolons to ASCII
- Normalizes Unicode characters
- Logs both raw and cleaned values for debugging

---

### 6. Database Indexes (Already Present) ✅

**Verified in `src/lib/db.ts`:**

```typescript
this.version(2).stores({
  sessions: 'id, formulaId, formulaCode, startedAt, status',
  // ✅ formulaCode index for fast session lookup
});
```

**Interface updated:**
```typescript
export interface PreparationSession {
  id: string;
  formulaId: string;
  formulaCode?: string; // ✅ Optional formula code
  // ... other fields
}
```

---

### 7. E2E Tests (`e2e/formula-first.spec.ts`) ✅

**New Playwright tests:**

1. **Not found flow** - Shows helpful error for non-existent codes
2. **Formula lookup** - Finds formula by internal code
3. **Garbage character handling** - Normalizes RTL marks and Arabic chars
4. **Empty database** - Shows "Load Sample Data" button
5. **Available codes list** - Displays existing formula codes

---

## Problem Solved

### Before:
```
User scans: "؛NBS001\u200e" (with Arabic semicolon and RTL mark)
System: "Formula not found for code: ؛NBS001"
User: 😕 Stuck, no guidance
```

### After:
```
User scans: "؛NBS001\u200e" 
System normalizes to: "NBS001"
System finds formula: ✅ Opens preparation modal
```

**If not found:**
```
System shows:
- Clear error: "Formula not found for code: NBS001"
- Explanation why
- List of available codes: [NBS002, NBS003, PRM00936, ...]
- Button: "View All Formulas"
- Button: "Load Sample Data" (if empty)
```

---

## User Flow

### Successful Scan:
```
Scan QR → Normalize → Parse → Lookup Formula → Start/Resume Session → Open Modal
```

### Failed Scan:
```
Scan QR → Normalize → Parse → Lookup Formula → Not Found → Show Helpful Error
  ↓
Click "View All Formulas" → Browse formulas → Select one → Scan its QR
```

### Empty Database:
```
Scan QR → Lookup Formula → Database Empty → Show "Load Sample Data"
  ↓
Click "Load Sample Data" → Populate DB → Scan again → Success
```

---

## Technical Details

### Normalization Rules:

1. **Unicode:** NFKC normalization (compatibility composition)
2. **RTL Marks:** Remove `\u200e`, `\u200f`, `\ufeff`, `\u061c`, `\u202a-\u202e`
3. **Arabic Punctuation:** Convert `؛` → `;`, `،` → `,`
4. **Whitespace:** Collapse multiple spaces to single space
5. **Trim:** Remove leading/trailing whitespace

### Parsing Priority:

1. **UUID v4** → Formula ID (direct lookup)
2. **Pattern `[A-Z]{2,4}\d{3,}`** → Formula Code (NBS001, PRM00936)
3. **Prefix `sample-` or `RM:`** → Sample Code
4. **Key-value `F=...`** → Formula identifier
5. **Key-value `S=...`** → Sample identifier
6. **Key-value `N=...`** → Sequence/ordinal

### Lookup Strategy:

1. Try UUID match (exact, fast)
2. Try internal code (case-insensitive)
3. Try external code (case-insensitive)
4. Try plain ID match (fallback)
5. Return null if no match

---

## Benefits

1. **✅ Robustness** - Handles scanner garbage gracefully
2. **✅ Better UX** - Helpful error messages, not dead ends
3. **✅ Debugging** - Comprehensive console logs
4. **✅ Performance** - Optimized lookups (UUID-first, indexed)
5. **✅ Maintainability** - Centralized parsing logic
6. **✅ Testability** - Pure functions, E2E coverage

---

## Files Modified

1. ✅ `src/lib/qr.ts` - **Created** - Universal QR parser
2. ✅ `src/services/formulas.ts` - **Created** - Formula lookup service
3. ✅ `src/components/NotFoundFormula.tsx` - **Created** - Error component
4. ✅ `src/pages/FormulaFirst.tsx` - **Updated** - Use new parser & lookup
5. ✅ `src/pages/DashboardNew.tsx` - **Updated** - Normalize scans
6. ✅ `e2e/formula-first.spec.ts` - **Created** - Playwright tests
7. ✅ `src/lib/db.ts` - **Verified** - Indexes already present
8. ✅ `src/services/sessions.ts` - **Verified** - Already implements smart routing

---

## Testing

### Manual Testing:

1. **Scan valid QR** → Should open batch size dialog
2. **Scan with garbage** → Should still work (normalized)
3. **Scan non-existent code** → Should show helpful error
4. **Empty database** → Should show "Load Sample Data" button
5. **Click "View All Formulas"** → Should navigate to formulas page

### Automated Testing:

```bash
# Run Playwright tests
pnpm test:e2e

# Or specific test
pnpm playwright test e2e/formula-first.spec.ts
```

---

## Migration Notes

**No breaking changes** - All existing functionality preserved:

- Old `parseQR` from `@/lib/parseQR` still works
- New `parseQR` from `@/lib/qr` adds more features
- `decodeQR` provides compatibility layer
- localStorage storage unchanged
- Session creation logic unchanged

**Improvements are additive:**
- Better normalization
- Better error messages
- Better debugging
- Better testing

---

## Next Steps

### Optional Enhancements:

1. **Add to other search inputs** - Normalize in Samples, Raw Materials search
2. **Fuzzy matching** - Suggest similar codes if exact match fails
3. **Recent scans** - Show history of scanned codes
4. **Barcode validation** - Detect and validate barcode formats
5. **QR generation** - Ensure generated QRs match parser expectations

---

## Related Documentation

- [COMPLETE_SYSTEM_WORKFLOW.md](./COMPLETE_SYSTEM_WORKFLOW.md) - Full system documentation
- [PREPARATION_MODAL_REFACTOR.md](./PREPARATION_MODAL_REFACTOR.md) - Modal-based prep flow
- [START_OR_RESUME_FLOW.md](./START_OR_RESUME_FLOW.md) - Session management

