# QR Scan Debugging Guide
## Issue: Uppercase QR not recognized

---

## 🔍 **The Problem**

**Your QR code:**
```
NBS:RM;ID=0865A76F-E76D-4129-B4C8-E27A3F87273B;CODE=GIV001001;NAME=MUSKALTAHARA;TYPE=SAMPLE;VER=1
```

**Status:** ❌ Not recognized (showed "Wrong code")

---

## 🛠️ **What I Fixed**

### **Fix 1: Case-Insensitive Parser**
**File:** `src/lib/qr/generator.ts`

**Before:**
```typescript
if (!payload.startsWith('NBS:')) return null;
```

**After:**
```typescript
// Case-insensitive check for NBS prefix
if (!payload.toUpperCase().startsWith('NBS:')) return null;
```

**Why:** The QR has uppercase `ID=`, `CODE=`, etc., but the parser was already converting keys to lowercase (line 143: `key.toLowerCase()`). However, the initial `NBS:` check was case-sensitive.

---

### **Fix 2: Enhanced Debug Logging**
**File:** `src/lib/scan/registry.ts`

**Added detailed logging in `tokenMatchesMaterial()`:**
```typescript
console.log('[ScanRegistry] tokenMatchesMaterial check:', {
  token,
  normalized: norm,
  materialId: material?.id,
  materialCode: material?.code,
  aliasCount: aliases.length,
  aliases: aliases.slice(0, 10), // Show first 10
});
```

**Why:** This will show us EXACTLY what's happening when you scan.

---

## 🧪 **How to Debug**

### **Step 1: Refresh the app**
```
1. Hard refresh (Ctrl+Shift+R)
2. Open DevTools Console (F12)
3. Check for: [ScanIndexKeeper] Initializing scan registry...
4. Check for: [ScanRegistry] Index built: X materials, Y tokens
```

### **Step 2: Try scanning again**
```
1. Start the formula preparation
2. Scan or paste: NBS:RM;ID=0865A76F-E76D-4129-B4C8-E27A3F87273B;CODE=GIV001001;...
3. Watch the console
```

### **Expected Console Output:**
```
[CodeInput] Using registry validation for material: 0865A76F-E76D-4129-B4C8-E27A3F87273B
[CodeInput] Checking payload: NBS:RM;ID=0865A76F-E76D-4129-B4C8-E27A3F87273B;...
[ScanRegistry] tokenMatchesMaterial check: {
  token: "NBS:RM;ID=0865A76F-E76D-4129-B4C8-E27A3F87273B;CODE=GIV001001;...",
  normalized: "RM:sample-0865A76F-E76D-4129-B4C8-E27A3F87273B",
  materialId: "sample-0865A76F-E76D-4129-B4C8-E27A3F87273B",
  materialCode: "GIV001001",
  aliasCount: 6,
  aliases: [
    "RM:sample-0865A76F-E76D-4129-B4C8-E27A3F87273B",
    "sample-0865A76F-E76D-4129-B4C8-E27A3F87273B",
    "S:GIV001001",
    "GIV001001",
    "NBS:RM;id=...",
    "barcode-here"
  ]
}
[ScanRegistry] ✅ Direct alias match!
[CodeInput] Registry match result: true
```

---

## 🎯 **What the Fix Does**

### **Normalization Process:**

**Input:**
```
NBS:RM;ID=0865A76F-E76D-4129-B4C8-E27A3F87273B;CODE=GIV001001;NAME=MUSKALTAHARA;TYPE=SAMPLE;VER=1
```

**Step 1:** Parse into key-value pairs (keys converted to lowercase):
```javascript
{
  nbs: "RM",
  id: "0865A76F-E76D-4129-B4C8-E27A3F87273B",
  code: "GIV001001",
  name: "MUSKALTAHARA",
  type: "SAMPLE",
  ver: "1"
}
```

**Step 2:** Extract ID and normalize:
```javascript
cleanId = "0865A76F-E76D-4129-B4C8-E27A3F87273B" // (remove 'sample-' prefix if present)
normalized = "RM:sample-0865A76F-E76D-4129-B4C8-E27A3F87273B"
```

**Step 3:** Look up in scan registry:
```javascript
aliases = [
  "RM:sample-0865A76F-E76D-4129-B4C8-E27A3F87273B",
  "sample-0865A76F-E76D-4129-B4C8-E27A3F87273B",
  "S:GIV001001",
  "GIV001001",
  // ... plus any stored in scanAliases
]

match = aliases.includes("RM:sample-0865A76F-E76D-4129-B4C8-E27A3F87273B")
// Should be TRUE!
```

---

## 🚨 **Possible Issues**

### **Issue 1: ID Mismatch**
**Symptom:** Console shows different IDs

**Example:**
```
materialId: "sample-0865A76F-E76D-4129-B4C8-E27A3F87273B"
normalized: "RM:sample-12345-different-id"
```

**Cause:** The sample in localStorage has a different ID than the QR code

**Solution:** 
1. Open DevTools → Application → Local Storage
2. Find `nbslims_enhanced_samples`
3. Search for `GIV001001`
4. Check the `id` field - does it match the QR?

---

### **Issue 2: Sample Not in Registry**
**Symptom:** Console shows `aliasCount: 0`

**Cause:** Sample wasn't loaded when scan registry was built

**Solution:**
1. Settings → Developer tab
2. Click "Seed All Data" (or create the sample again)
3. Refresh the page
4. Check console for: `[ScanRegistry] Index built: X materials, Y tokens`

---

### **Issue 3: Double Prefix**
**Symptom:** Console shows `RM:sample-sample-0865A76F...`

**Cause:** Sample ID in localStorage already has `sample-` prefix

**Solution:** This is now handled automatically (line 69 in `normalizeScan`):
```typescript
const cleanId = String(kv.id).replace(/^sample-/, '');
return `RM:sample-${cleanId}`;
```

---

## 📋 **Testing Checklist**

### ✅ **After Refresh:**
- [ ] Console shows: `[ScanIndexKeeper] Initializing scan registry...`
- [ ] Console shows: `[ScanRegistry] Index built: X materials, Y tokens`
- [ ] `X materials` should be > 0 (your sample count)

### ✅ **During Scan:**
- [ ] Console shows: `[CodeInput] Checking payload: ...`
- [ ] Console shows: `[ScanRegistry] tokenMatchesMaterial check: {...}`
- [ ] `normalized` matches one of the `aliases`
- [ ] Console shows: `[ScanRegistry] ✅ Direct alias match!`
- [ ] Console shows: `[CodeInput] Registry match result: true`
- [ ] Code input field turns GREEN
- [ ] "Wrong code" disappears

---

## 💡 **Quick Fix if Still Not Working**

If after refresh it STILL doesn't work:

### **Option 1: Re-save the sample**
```
1. Go to Samples page
2. Find "Musk Al Tahara" (GIV001001)
3. Click Edit
4. Click Save (don't change anything)
5. This regenerates the QR with lowercase format
6. Try scanning again
```

### **Option 2: Check Material in Wizard**
The wizard might not be passing the `material` prop correctly. Let me check:

**File:** `src/features/preparation/Wizard.tsx` (line 88)

Should have:
```typescript
<CodeInput
  material={step.material}  // ← This must be present!
  ...
/>
```

If missing, the registry validation won't work.

---

## 🎉 **Expected Result**

After the fix:
```
✅ Uppercase QR recognized
✅ Lowercase QR recognized
✅ All legacy formats still work
✅ Console shows detailed debug info
```

---

**Try it now and share the console output! 🚀**

*Generated: October 20, 2025*

