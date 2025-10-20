# Preparation UX Improvements

## Summary

Implemented 4 major UX improvements to the preparation workflow:
1. Cancel button properly closes modals and navigates back
2. Material names displayed instead of UUIDs
3. Robust scan validation with garbage character handling
4. Polish: autofocus, text selection, Escape key, connection status

---

## Task 1: Cancel Button Functionality ✅

### Problem
Cancel button didn't close dialogs or navigate back to previous page.

### Solution

**FormulaFirst.tsx - Batch Size Dialog:**
```typescript
onCancel={()=> {
  setPrepOpen(false);
  // Navigate back if possible, otherwise to formulas
  if (window.history.length > 1) {
    navigate(-1, { replace: true });
  } else {
    navigate('/formulas', { replace: true });
  }
  // Show toast
  import('sonner').then(({ toast }) => {
    toast.info('Cancelled');
  });
}}
```

**FormulaFirst.tsx - Guided Wizard Modal:**
- Added Escape key handler
- Close button shows "Cancelled" toast
- Modal has `tabIndex={-1}` for keyboard event capture

### Features
- ✅ Cancel closes modal
- ✅ Navigates back (if history exists)
- ✅ Falls back to /formulas (if no history)
- ✅ Shows "Cancelled" toast notification
- ✅ Escape key closes modal
- ✅ Close button (✕) in header

---

## Task 2: Show Material Names ✅

### Problem
Steps showed UUIDs like `abc-123-def-456` instead of readable names.

### Solution

**buildStepsDef.ts** already included:
```typescript
let displayName: string = ingredientId;
if (rawMaterialId && typeof opts.getRawMaterial === 'function') {
  const rm:any = opts.getRawMaterial(rawMaterialId);
  if (rm) {
    displayName = (rm?.itemNameEN || rm?.itemNameAR || rm?.name || rawMaterialId);
  }
}

const step = {
  sequence: toNumber(val(ing, I.sequence)) ?? (idx + 1),
  ingredientId,
  rawMaterialId,
  displayName, // ← Human-readable name
  code,
  // ... rest
};
```

**Wizard.tsx** already used:
```typescript
const steps = useMemo(()=> stepsDef.map(s => ({
  id: crypto.randomUUID(),
  sequence: s.sequence,
  ingredientId: s.ingredientId,
  displayName: s.displayName || s.ingredientId, // ← Fallback to ID if no name
  // ... rest
})), [stepsDef]);
```

**Display:**
```typescript
<div>Step {step.sequence}: <b>{step.displayName || step.ingredientId}</b></div>
```

### Result
- ✅ Shows "Musk AL Tahara" instead of "abc-123-def"
- ✅ Falls back to ingredient ID if name unavailable
- ✅ Works for both raw materials and samples

---

## Task 3: Robust Scan Validation ✅

### Problem
Scanner injects garbage: `;…}÷`, RTL marks, different casing, etc.

### Solution

**New file: `src/lib/scan/normalize.ts`**

#### `normalizeScanInput(input: string)`
Cleans scanned input:
```typescript
// Remove leading/trailing keyboard-wedge noise
clean = clean.replace(/^[;:%\s]+|[\r\n]+$/g, '');

// Remove all whitespace
clean = clean.replace(/\s+/g, '');

// Remove garbage chars
clean = clean.replace(/[}÷]/g, '');

// Uppercase for comparison
clean = clean.toUpperCase();

// Normalize RM prefix patterns
// S=12345 → RM:SAMPLE-12345
// RM=SAMPLE-12345 → RM:SAMPLE-12345
```

#### `isScanMatch(scanned, stepRequired, rmCode, altCodes[])`
Flexible matching:
```typescript
// 1. Direct match: "RM:sample-123" === "RM:sample-123"
if (s === req) return true;

// 2. RM code match: "RM:sample-123" === "RM:sample-123"
if (s === rm) return true;

// 3. Alt code match: check all alternatives
if (normalizedAltCodes.some(alt => s === alt)) return true;

// 4. Naked code match: "1760768282441" === "1760768282441"
const sNaked = extractNakedCode(s); // "RM:sample-123" → "123"
if (sNaked && (sNaked === reqNaked || sNaked === rmNaked)) return true;

// 5. QR format match: "S=123" or "F=code"
const qrMatch = s.match(/^([FS])[:=](.+)$/i);
if (qrMatch) { /* check variants */ }
```

**Updated: `src/components/CodeInput.tsx`**

```typescript
import { isScanMatch, normalizeScanInput } from '@/lib/scan/normalize';

function eqAny(payload: string) {
  // Try new scan matcher first (handles more formats)
  if (isScanMatch(payload, requiredCodeValue, requiredCodeValue, altCodeValues || [])) {
    return true;
  }
  
  // Fallback to old normalization
  const canon = normalize(payload);
  const targets = [requiredCodeValue, ...(altCodeValues||[])].map(normalize);
  return targets.includes(canon);
}

function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') {
    // Normalize before verification
    const normalized = normalizeScanInput(text);
    verify({ text: normalized, format: 'WEDGE' });
  }
}
```

### Accepted Formats

The scanner now accepts:

1. **Exact code**: `RM:sample-1760768282441`
2. **Naked code**: `1760768282441`
3. **Old format**: `S=1760768282441`
4. **Alt format**: `RM=sample-1760768282441`
5. **With garbage**: `;;;RM:sample-1760768282441}÷\r\n`
6. **Mixed case**: `rm:SAMPLE-1760768282441`

All normalize to the same canonical form for comparison.

---

## Task 4: UX Polish ✅

### Autofocus on Scan Input
```typescript
<input 
  ref={inputRef}
  autoFocus // ← Cursor ready for scan
  // ...
/>
```

### Auto-select After Scan
```typescript
useEffect(() => {
  if (status === 'ok' && inputRef.current) {
    inputRef.current.select(); // ← Next scan overwrites
  }
}, [status]);
```

### Escape Key Handler
```typescript
<div 
  className="fixed inset-0 bg-black/50..."
  onKeyDown={(e) => {
    if (e.key === 'Escape') {
      setShowWizard(false);
      setBatch(null);
      toast.info('Cancelled');
    }
  }}
  tabIndex={-1} // ← Enable keyboard events
>
```

### Better Status Messages
```typescript
<span className={
  status==='ok' ? 'text-green-600 font-semibold' : 
  status==='bad' ? 'text-red-600' : 
  'text-gray-500'
}>
  {status==='ok' ? '✓ Material matched' : // ← Clear success
   status==='bad' ? 'Wrong code' :         // ← Clear error
   'Waiting…'}                             // ← Clear idle
</span>
```

---

## User Flow Improvements

### Before:
```
1. User clicks "Start Preparation"
2. Modal opens
3. User scans: ";;;RM:sample-123}÷"
4. ❌ Error: "Wrong code"
5. User confused, stuck
6. Cancel button doesn't work
7. User force-closes browser tab
```

### After:
```
1. User clicks "Start Preparation"
2. Modal opens, cursor in scan field (autofocus)
3. User scans: ";;;RM:sample-123}÷"
4. System normalizes to: "RM:SAMPLE-123"
5. ✅ "✓ Material matched" (green, bold)
6. Text auto-selected (ready for next scan)
7. Scale panel unlocks
8. User weighs ingredient
9. User presses Escape or clicks Cancel
10. ✅ Modal closes, shows "Cancelled" toast
11. User back at formulas page
```

---

## Technical Details

### Normalization Pipeline

```
Input: ";;;RM:sample-1760768282441}÷\r\n"
  ↓
Strip leading noise: "RM:sample-1760768282441}÷\r\n"
  ↓
Strip trailing noise: "RM:sample-1760768282441"
  ↓
Remove whitespace: "RM:sample-1760768282441"
  ↓
Remove garbage: "RM:sample-1760768282441"
  ↓
Uppercase: "RM:SAMPLE-1760768282441"
  ↓
Match against: ["RM:SAMPLE-1760768282441", "1760768282441", ...]
  ↓
✅ Match found!
```

### Matching Strategies

1. **Exact match** - Fastest, most reliable
2. **Normalized match** - Handles casing, whitespace
3. **Naked code match** - Accepts just the digits
4. **Alt code match** - Handles legacy formats
5. **QR format match** - Parses S=, F=, RM= patterns

### Fallback Chain

```typescript
isScanMatch() attempts:
  1. Direct normalized match
  2. RM code normalized match
  3. Alt codes normalized match
  4. Naked code extraction & match
  5. QR format parsing & match
  6. Return false (no match)
```

---

## Files Modified

1. ✅ `src/pages/FormulaFirst.tsx` - Cancel handlers, Escape key
2. ✅ `src/lib/scan/normalize.ts` - **New** - Scan normalization utilities
3. ✅ `src/components/CodeInput.tsx` - Enhanced validation, autofocus, auto-select
4. ✅ `src/lib/data/buildStepsDef.ts` - **Verified** - Already has displayName
5. ✅ `src/features/preparation/Wizard.tsx` - **Verified** - Already uses displayName

---

## Testing

### Manual Test Cases

**Cancel Functionality:**
- [ ] Click "Set Batch Size" → Click "Cancel" → Modal closes, navigates back
- [ ] Open wizard → Click ✕ button → Modal closes, shows toast
- [ ] Open wizard → Press Escape → Modal closes, shows toast

**Material Names:**
- [ ] Start prep → Step 1 shows "Musk AL Tahara" (not UUID)
- [ ] All steps show readable names

**Scan Validation:**
- [ ] Scan exact code `RM:sample-123` → ✅ Accepted
- [ ] Scan naked code `123` → ✅ Accepted
- [ ] Scan with garbage `;;;RM:sample-123}÷` → ✅ Accepted
- [ ] Scan wrong code `RM:sample-999` → ❌ "Wrong code"
- [ ] Scan then scan again → Text selected, overwrites

**UX Polish:**
- [ ] Modal opens → Cursor in scan field (autofocus)
- [ ] Successful scan → Text selected
- [ ] Press Escape → Modal closes
- [ ] Status shows: "Waiting…" → "✓ Material matched" → green/bold

---

## Edge Cases Handled

1. **No history** - Falls back to /formulas instead of navigate(-1)
2. **No display name** - Falls back to ingredient ID
3. **Multiple garbage chars** - All removed in one pass
4. **Mixed casing** - Normalized to uppercase
5. **Various prefixes** - All normalized to RM:SAMPLE-
6. **Naked codes** - Extracted and matched
7. **Alt codes** - Checked in addition to primary
8. **Camera scans** - Also normalized
9. **Enter key** - Triggers normalization & validation
10. **Modal close during scan** - Cleanup handled properly

---

## Benefits

1. **✅ Fewer Failed Scans** - Accepts 5+ format variations
2. **✅ Faster Workflow** - Autofocus, auto-select, Escape key
3. **✅ Clearer Feedback** - "✓ Material matched" vs "Wrong code"
4. **✅ No Dead Ends** - Cancel always works, navigates back
5. **✅ Readable Steps** - "Musk AL Tahara" vs "abc-123-def"
6. **✅ Professional Feel** - Toast notifications, smooth interactions
7. **✅ Keyboard Friendly** - Enter confirms, Escape cancels
8. **✅ Reduced Errors** - Garbage character handling
9. **✅ Better Discoverability** - Autofocus guides user
10. **✅ Faster Re-scans** - Auto-select for overwrite

---

## Related Documentation

- [COMPLETE_SYSTEM_WORKFLOW.md](./COMPLETE_SYSTEM_WORKFLOW.md) - Full system documentation
- [PREPARATION_MODAL_REFACTOR.md](./PREPARATION_MODAL_REFACTOR.md) - Modal-based prep flow
- [QR_PARSER_REFACTOR.md](./QR_PARSER_REFACTOR.md) - QR parsing system

