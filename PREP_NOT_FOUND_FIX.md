# "Preparation not found" - Root Cause & Fix

## 🔴 The Problem

You were seeing **"Preparation not found"** because of a **cache key mismatch** between two components.

### The Disconnect

```
PreparationDetail.tsx (wrapper)
  ├─ Creates session with query key: ['session', id]
  ├─ Passes state: { session }
  └─ Navigates to /preparations/:id
       ↓
PreparationDetails.tsx (inner)  ❌ MISMATCH!
  ├─ Looks for query key: ['prep', id]     ← Different key!
  └─ Expects state: { prep }               ← Different prop!
       ↓
  Result: Cache miss → DB query → null → "Preparation not found"
```

**Why it happened:**
- We updated the wrapper to use `['session', id]` and `state: { session }`
- But forgot to update the inner component
- The inner component was still looking for `['prep', id]` and `state: { prep }`

---

## ✅ The Fix

Updated `src/features/preparations/PreparationDetails.tsx` to:

1. **Use same cache key:** `['session', id]` (not `['prep', id]`)
2. **Add `initialData`:** Reads from cache that wrapper primed
3. **Accept new props:** `defaultOpen` and `onOpenChange` for modal control
4. **Remove duplicate state logic:** Wrapper already handles state priming

### Key Changes

```typescript
// BEFORE (broken)
const prepQ = useQuery({
  queryKey: ['prep', id],  // ❌ Wrong key
  // No initialData → always queries DB
});

// AFTER (fixed)
const cacheKey = ['session', id];  // ✅ Matches wrapper
const prepQ = useQuery({
  queryKey: cacheKey,
  initialData: () => qc.getQueryData(cacheKey) ?? null,  // ✅ Uses cache
  // ... rest of config
});
```

---

## 🔍 How to Verify It's Working

### 1. Check Console Output

**Before fix (broken):**
```
[prep-detail] id abc-123 fromState? true      ← Wrapper has data
[prep-details-inner] id abc-123               ← Inner component
(3 retries...)
"Preparation not found"                        ← DB query fails
```

**After fix (working):**
```
[prep-detail] id abc-123 fromState? true      ← Wrapper has data
[prep-details-inner] id abc-123 defaultOpen? true  ← Inner component
(loads instantly from cache)                   ← No retries needed!
```

---

### 2. Check Browser DevTools

**React Query DevTools:**
```
Queries:
  ✅ ['session', 'abc-123'] - fresh (cached)
  ❌ ['prep', 'abc-123'] - (should NOT exist anymore)
```

**IndexedDB:**
```
Application → IndexedDB → nbs-lims → sessions
  ✅ Should see your session with id 'abc-123'
```

---

## 🧪 Test the Fix

### Test 1: First Scan (Create New Session)

1. Clear DB (optional):
   ```javascript
   await db.sessions.clear();
   ```

2. Navigate to:
   ```
   http://localhost:5173/formula-first?code=PRM00936&auto=start
   ```

3. **Expected:**
   - ✅ Console: `[prep-start] prep abc-123`
   - ✅ Console: `[prep-detail] id abc-123 fromState? true`
   - ✅ Console: `[prep-details-inner] id abc-123 defaultOpen? true`
   - ✅ Page loads with preparation details (NOT "not found")
   - ✅ Modal opens automatically (if implemented)

---

### Test 2: Resume Session

1. Don't complete the prep
2. Scan/navigate again:
   ```
   http://localhost:5173/formula-first?code=PRM00936&auto=start
   ```

3. **Expected:**
   - ✅ Same session ID reused
   - ✅ Page loads instantly
   - ✅ No "Preparation not found"

---

### Test 3: Direct Navigation

1. Copy a session ID from IndexedDB
2. Navigate directly:
   ```
   http://localhost:5173/preparations/abc-123
   ```

3. **Expected:**
   - ✅ Brief "Loading..." (no state, so queries DB)
   - ✅ Loads after retry (DB query succeeds)
   - ✅ NO "Preparation not found" (unless truly doesn't exist)

---

## 🔧 If Still Showing "Preparation not found"

### Diagnostic Steps

#### 1. Check if session exists in DB

```javascript
// In browser console
const id = 'abc-123'; // Replace with your session ID
const session = await db.sessions.get(id);
console.log('Session:', session);
```

**If `null`:**
- Session wasn't created
- Check `createSessionFromFormula` is being called
- Check `db.transaction` completed

**If exists:**
- Cache mismatch still present (see step 2)

---

#### 2. Check cache keys

```javascript
// In browser console
import { queryClient } from '@/lib/queryClient';

const id = 'abc-123';
console.log('session key:', queryClient.getQueryData(['session', id]));
console.log('prep key:', queryClient.getQueryData(['prep', id]));
```

**Expected:**
- `session key`: Should have data
- `prep key`: Should be `undefined` (not used anymore)

**If both undefined:**
- Cache priming failed
- Check wrapper's `qc.setQueryData(cacheKey, fromState)` ran

---

#### 3. Check location state

```javascript
// Add to PreparationDetail.tsx temporarily:
console.log('fromState:', fromState);
console.log('fromState.id:', fromState?.id);
console.log('url id:', id);
```

**Expected:**
- `fromState`: Object with session data
- `fromState.id`: Matches URL param `id`

**If `fromState` is undefined:**
- Navigation didn't pass state
- Check `navigate(..., { state: { session } })` in FormulaFirst

---

#### 4. Check formula steps exist

```javascript
// In browser console
const formula = /* your formula object */;
console.log('Formula steps:', formula.steps);
console.log('Steps length:', formula.steps?.length);
```

**If `undefined` or empty:**
- Formula has no steps defined
- `createSessionFromFormula` won't create step records
- Prep will be "empty" but should still show

---

## 🎯 Summary of Root Causes

| Issue | Cause | Symptom | Fix |
|-------|-------|---------|-----|
| **Cache key mismatch** | Wrapper uses `['session']`, inner uses `['prep']` | Always queries DB, cache miss | Update inner to use `['session']` ✅ |
| **No initialData** | Inner component doesn't read cache | Slow load, retries | Add `initialData: () => qc.getQueryData(...)` ✅ |
| **Missing props** | Inner doesn't accept `defaultOpen` | Modal doesn't auto-open | Add props to signature ✅ |
| **State prop mismatch** | Wrapper passes `session`, inner expects `prep` | fromState undefined | Not an issue anymore (removed from inner) ✅ |

---

## ✅ Verification Checklist

After the fix, verify:

- [ ] Console shows `[prep-details-inner]` log with `defaultOpen?` value
- [ ] No "Preparation not found" on first scan
- [ ] No "Preparation not found" on resume
- [ ] Page loads instantly (< 100ms, no retries)
- [ ] React Query DevTools shows `['session', id]` query cached
- [ ] IndexedDB `sessions` table has the session record
- [ ] Modal opens automatically (if `?modal=size` or `?auto=1` present)

---

## 🚀 Next Steps

Now that the connection is fixed:

1. **Test the full workflow:**
   - Scan formula → Auto-create session → Open modal → Enter size → Guided prep

2. **Test resume:**
   - Scan same formula again → Resume existing session

3. **Test completed →test:**
   - Complete a prep → Scan again → Routes to test management

4. **Verify modal behavior:**
   - Check that `defaultOpen` prop opens your size/prep dialog
   - If not, check your modal component's prop name (might be `open`, `isOpen`, etc.)

---

## 📚 Related Docs

- `SESSIONS_IMPLEMENTATION.md` - Database schema and session service
- `START_OR_RESUME_FLOW.md` - Smart routing logic
- `RACE_CONDITION_FIX.md` - Transaction-safe writes

---

**Status:** ✅ FIXED  
**Issue:** Cache key mismatch between wrapper and inner component  
**Solution:** Updated inner component to use `['session', id]` cache key and read from `initialData`

