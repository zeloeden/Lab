# Case Sensitivity Fix - UUID Matching
## October 20, 2025

---

## 🎯 **Problem Found: Case-Sensitive UUID Matching**

The scan validation was failing because of **case-sensitive UUID comparison**!

### **The Evidence:**

**QR Code Contains (UPPERCASE):**
```
ID=A92544CB-EADA-4265-A675-A1DE1E813CC6
```

**After normalization:**
```
normalized: 'RM:sample-A92544CB-EADA-4265-A675-A1DE1E813CC6'
```

**Aliases in Registry (lowercase):**
```
'RM:sample-a92544cb-eada-4265-a675-a1de1e813cc6'
```

**Result:**
```
'RM:sample-A92544CB-EADA-4265-A675-A1DE1E813CC6' !== 'RM:sample-a92544cb-eada-4265-a675-a1de1e813cc6'
match: false  ← FAILED!
```

---

## ✅ **The Fix**

Updated `src/lib/scan/registry.ts` to **convert all UUIDs to lowercase** for consistent comparison:

### **Changes Made:**

1. **In `normalizeScan()` function:**
   ```typescript
   // Before:
   const cleanId = String(kv.id).replace(/^sample-/, '');
   return `RM:sample-${cleanId}`;
   
   // After:
   const cleanId = String(kv.id).replace(/^sample-/, '').toLowerCase();
   return `RM:sample-${cleanId}`;
   ```

2. **In `buildScanAliases()` function:**
   ```typescript
   // Before:
   const cleanId = String(id).replace(/^sample-/, '');
   
   // After:
   const cleanId = String(id).replace(/^sample-/, '').toLowerCase();
   ```

3. **In pattern matching:**
   ```typescript
   // Before:
   if (m1) return `RM:sample-${m1[1]}`;
   
   // After:
   if (m1) return `RM:sample-${m1[1].toLowerCase()}`;
   ```

---

## 🎉 **Expected Result**

Now when you scan:

**QR Code (UPPERCASE):**
```
NBS:RM;ID=A92544CB-EADA-4265-A675-A1DE1E813CC6;CODE=EXP001001;...
```

**Normalized (lowercase):**
```
RM:sample-a92544cb-eada-4265-a675-a1de1e813cc6
```

**Aliases (lowercase):**
```
RM:sample-a92544cb-eada-4265-a675-a1de1e813cc6
```

**Result:**
```
✅ MATCH!
```

---

## 🧪 **How to Test**

1. **Refresh the page** (Ctrl+Shift+R)
2. **Go to Formulas**
3. **Start "sky" preparation**
4. **Scan the QR code** (or type `EXP001001`)
5. **Expected result:**
   - ✅ Code input turns GREEN
   - ✅ Console shows: `[ScanRegistry] ✅ Direct alias match!`
   - ✅ Console shows: `[CodeInput] Registry match result: true`
   - ✅ Can proceed to weighing

---

## 📊 **Comparison**

### **Before Fix:**
```javascript
QR ID:        'A92544CB-EADA-...' (uppercase)
Normalized:   'RM:sample-A92544CB-EADA-...' (uppercase)
Alias:        'RM:sample-a92544cb-eada-...' (lowercase)
Comparison:   'A92...' === 'a92...'  ❌ FALSE
```

### **After Fix:**
```javascript
QR ID:        'A92544CB-EADA-...' (uppercase)
Normalized:   'RM:sample-a92544cb-eada-...' (lowercase)
Alias:        'RM:sample-a92544cb-eada-...' (lowercase)
Comparison:   'a92...' === 'a92...'  ✅ TRUE
```

---

## 💡 **Why This Happened**

When QR codes are generated, the UUID might be stored in uppercase in some systems. The scan registry was doing case-sensitive string comparison, so:
- `RM:sample-ABC` (from QR) 
- `RM:sample-abc` (from database)

These two strings don't match in JavaScript string comparison, even though they represent the same UUID.

---

## ✅ **The Solution**

**Normalize EVERYTHING to lowercase** when dealing with UUIDs. This makes the comparison case-insensitive while keeping the system simple and fast.

---

## 🎯 **Benefits**

- ✅ Works with uppercase QR codes
- ✅ Works with lowercase QR codes
- ✅ Works with mixed-case QR codes
- ✅ No performance impact (just `.toLowerCase()`)
- ✅ Backwards compatible with existing data
- ✅ No need to regenerate QR codes

---

## 📋 **Files Modified**

1. ✅ `src/lib/scan/registry.ts`
   - Updated `normalizeScan()` to lowercase UUIDs
   - Updated `buildScanAliases()` to lowercase UUIDs
   - Build succeeded - no errors

---

**The fix is deployed! Refresh your page and try scanning again!** 🚀

---

*Generated: October 20, 2025*

