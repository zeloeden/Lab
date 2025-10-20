# QR Code Mismatch - Root Cause Analysis
## Your Console Output Explained

---

## 🔍 **What Your Console Shows**

### **Formula Step Configuration:**
```javascript
[DEBUG] Final step for Plat: targetQtyG = 50g, validCodes: (8) [
  'RM:sample-1760964801010',
  'sample-1760964801010',
  'S-b4c27227-e20',
  'RM:sample-b4c27227-e209-47cf-87ea-10e9e22a20c8',
  'RM:sample-EXP001001',    // ← Formula expects this!
  'sample-EXP001001',
  'S:EXP001001',
  'EXP001001'               // ← Or this code
]
```

**What this means:**
- The formula step is expecting ingredient called **"Plat"**
- The formula is configured to accept sample with code **`EXP001001`**
- OR any of the other aliases listed

---

### **What You Scanned:**
```javascript
[CodeInput] Checking payload: NBS:RM;ID=0865A76F-E76D-4129-B4C8-E27A3F87273B;CODE=GIV001001;...
```

**Parsed to:**
```javascript
normalized: 'RM:sample-0865A76F-E76D-4129-B4C8-E27A3F87273B'
```

**What this means:**
- You scanned a QR for sample with ID: `0865A76F-E76D-4129-B4C8-E27A3F87273B`
- This sample has code: **`GIV001001`** ← Musk Al Tahara
- This sample is **NOT** in the formula's valid codes list

---

### **The Validation Result:**
```javascript
[ScanRegistry] tokenMatchesMaterial check: {
  materialId: 'sample-1760964774990',        // ← Wizard expects this sample
  normalized: 'RM:sample-0865A76F-...',      // ← You scanned this sample
  resolvedId: undefined,                     // ← Not found in registry for this step
  match: false                               // ← MISMATCH!
}
```

---

## ❌ **The Problem**

```
┌─────────────────────────────────────────────────────────────┐
│  Formula "sky" says:                                        │
│  Step 1: Add 50g of "Plat" (code: EXP001001)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  You scanned:                                               │
│  "Musk Al Tahara" (code: GIV001001)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ❌ MISMATCH!
```

**The system is correctly rejecting the scan because you're scanning the wrong material!**

---

## ✅ **Solutions**

### **Solution 1: Scan the Correct Material**

The formula expects **`EXP001001`** (Plat), so you need to:

1. **Find the sample with code `EXP001001`** in your Samples page
2. **Get its QR code** (or type `EXP001001` manually)
3. **Scan or type that** in the wizard

**To verify which sample you need:**
```
1. Open Samples page
2. Search for "EXP001001" or "Plat"
3. That's the material the formula expects
4. Use THAT sample's QR code
```

---

### **Solution 2: Update the Formula**

If the formula is configured wrong and should actually use **GIV001001** (Musk Al Tahara) instead:

1. **Go to Formulas page**
2. **Edit the "sky" formula**
3. **Check the ingredients list:**
   ```
   Step 1: What material is configured?
   - Is it "Plat" (EXP001001)?
   - Should it be "Musk Al Tahara" (GIV001001)?
   ```
4. **Update the ingredient** if needed
5. **Save the formula**
6. **Restart the preparation**

---

## 🔍 **How to Check Your Formula Configuration**

### **Method 1: Via UI**
```
1. Go to Formulas page
2. Find "sky" formula
3. Click Edit or View
4. Check the ingredients:
   - Ingredient 1: ?
   - Ingredient 2: ?
5. Verify the codes match what you expect
```

### **Method 2: Via Console**
```javascript
// Open DevTools Console (F12)
// Run this:
const formulas = JSON.parse(localStorage.getItem('nbslims_formulas') || '[]');
const sky = formulas.find(f => f.name === 'sky' || f.formulaName === 'sky');
console.log('Formula "sky" ingredients:', sky?.ingredients);
```

This will show you EXACTLY what the formula expects.

---

## 🎯 **Expected Behavior (Once Fixed)**

When you scan the **correct** material:

```javascript
[CodeInput] Checking payload: NBS:RM;ID=...;CODE=EXP001001;...

[ScanRegistry] tokenMatchesMaterial check: {
  materialId: 'sample-1760964801010',
  normalized: 'RM:sample-1760964801010',
  aliasCount: 8,
  aliases: ['RM:sample-1760964801010', 'S:EXP001001', 'EXP001001', ...]
}

[ScanRegistry] ✅ Direct alias match!
[CodeInput] Registry match result: true
```

✅ Code input turns GREEN  
✅ "Wrong code" disappears  
✅ You can proceed to weighing

---

## 📋 **Quick Diagnostic**

Run this in the browser console to see what materials you have:

```javascript
// Check all samples
const samples = JSON.parse(localStorage.getItem('nbslims_enhanced_samples') || '[]');
console.table(samples.map(s => ({
  id: s.id,
  code: s.code || s.customIdNo,
  name: s.itemNameEN || s.name,
})));
```

Look for:
- ✅ A sample with code **`EXP001001`** (this is what the formula expects)
- ✅ A sample with code **`GIV001001`** (this is what you scanned)

---

## 💡 **Summary**

**The QR system is working correctly!** ✅

The issue is:
- ❌ You're scanning the wrong sample
- ❌ The formula expects `EXP001001` (Plat)
- ❌ You scanned `GIV001001` (Musk Al Tahara)

**Next steps:**
1. Find the sample with code `EXP001001`
2. Scan THAT sample's QR code
3. OR update the formula to use `GIV001001` if that's what you intended

---

*Generated: October 20, 2025*

