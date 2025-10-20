# Formula Diagnostic - ID Mismatch Issue
## Root Cause Analysis

---

## 🔍 **The Real Problem**

Your console shows:

```javascript
// Formula expects:
materialId: 'sample-1760964774990'

// QR code contains:
normalized: 'RM:sample-0865A76F-E76D-4129-B4C8-E27A3F87273B'

// Result:
match: false  // ← IDs DON'T MATCH!
```

**This means the formula is referencing an OLD sample ID that no longer exists!**

---

## 🧪 **Run This Diagnostic**

### **Step 1: Open Browser Console (F12)**

### **Step 2: Paste and Run This:**

```javascript
// Check formulas
const formulas = JSON.parse(localStorage.getItem('nbslims_formulas') || '[]');
const sky = formulas.find(f => f.name === 'sky' || f.formulaName === 'sky');

// Check samples
const samples = JSON.parse(localStorage.getItem('nbslims_enhanced_samples') || '[]');
const musk = samples.find(s => 
  s.code === 'GIV001001' || 
  s.customIdNo === 'GIV001001' ||
  (s.itemNameEN || s.name || '').includes('Musk')
);

console.log('=== FORMULA "sky" ===');
console.log('Ingredient 1 rawMaterialId:', sky?.ingredients?.[0]?.rawMaterialId);
console.log('Ingredient 1 code:', sky?.ingredients?.[0]?.code);

console.log('\n=== SAMPLE "Musk AL Tahara" ===');
console.log('Current ID:', musk?.id);
console.log('Code:', musk?.code || musk?.customIdNo);
console.log('Name:', musk?.itemNameEN || musk?.name);
console.log('QR Payload:', musk?.qrPayload);

console.log('\n=== MISMATCH CHECK ===');
console.log('Formula expects ID:', sky?.ingredients?.[0]?.rawMaterialId);
console.log('Sample actual ID:', musk?.id);
console.log('IDs match?', sky?.ingredients?.[0]?.rawMaterialId === musk?.id);

// Check if old sample still exists
const oldSample = samples.find(s => s.id === 'sample-1760964774990');
console.log('\n=== OLD SAMPLE CHECK ===');
console.log('Old sample (sample-1760964774990) exists?', !!oldSample);
if (oldSample) {
  console.log('Old sample details:', {
    id: oldSample.id,
    code: oldSample.code || oldSample.customIdNo,
    name: oldSample.itemNameEN || oldSample.name
  });
}
```

---

## 📊 **Expected Output**

You'll see something like:

```
=== FORMULA "sky" ===
Ingredient 1 rawMaterialId: "sample-1760964774990"  ← OLD ID
Ingredient 1 code: undefined

=== SAMPLE "Musk AL Tahara" ===
Current ID: "sample-0865a76f-e76d-4129-b4c8-e27a3f87273b"  ← NEW ID
Code: "GIV001001"
Name: "Musk AL Tahara"
QR Payload: "NBS:RM;id=0865a76f-e76d-4129-b4c8-e27a3f87273b;..."

=== MISMATCH CHECK ===
Formula expects ID: "sample-1760964774990"
Sample actual ID: "sample-0865a76f-e76d-4129-b4c8-e27a3f87273b"
IDs match? false  ← PROBLEM!

=== OLD SAMPLE CHECK ===
Old sample (sample-1760964774990) exists? false
```

---

## ✅ **The Solution**

The formula is stuck referencing an old sample that was deleted or regenerated. You need to **update the formula** to use the current sample ID.

### **Option 1: Re-create the Formula (Easiest)**

```
1. Go to Formulas page
2. Delete the "sky" formula
3. Create it again:
   - Name: sky
   - Ingredient 1: Select "Musk AL Tahara" (GIV001001)
   - Quantity: 50g
   - Add other ingredients...
4. Save
5. Try the preparation again
```

### **Option 2: Manually Fix in Console (Quick)**

If you want to fix it immediately without recreating:

```javascript
// Get formulas
const formulas = JSON.parse(localStorage.getItem('nbslims_formulas') || '[]');
const skyIndex = formulas.findIndex(f => f.name === 'sky' || f.formulaName === 'sky');

// Get current Musk sample
const samples = JSON.parse(localStorage.getItem('nbslims_enhanced_samples') || '[]');
const musk = samples.find(s => 
  s.code === 'GIV001001' || 
  s.customIdNo === 'GIV001001'
);

// Update formula to reference current sample
if (skyIndex >= 0 && musk) {
  formulas[skyIndex].ingredients[0].rawMaterialId = musk.id;
  localStorage.setItem('nbslims_formulas', JSON.stringify(formulas));
  console.log('✅ Formula updated! Refresh the page and try again.');
} else {
  console.log('❌ Could not update - formula or sample not found');
}
```

Then **refresh the page** and start the preparation again.

---

## 🎯 **Why This Happened**

This typically happens when:

1. ✅ You created a formula with "Musk AL Tahara" 
2. ✅ Later, you edited/re-saved the "Musk AL Tahara" sample
3. ✅ Re-saving generated a NEW sample ID
4. ❌ Formula still references the OLD sample ID
5. ❌ Scan validation fails because IDs don't match

---

## 🔧 **Permanent Fix (Prevent This)**

The system should use **CODE** instead of **ID** for ingredients, so that re-saving a sample doesn't break formulas.

Let me check if we need to fix the formula system:

### **Check How Formulas Store Ingredients:**

```javascript
const formulas = JSON.parse(localStorage.getItem('nbslims_formulas') || '[]');
console.log('How formulas store ingredients:', 
  formulas[0]?.ingredients?.map(ing => ({
    rawMaterialId: ing.rawMaterialId,  // ← Uses ID (breaks on re-save)
    code: ing.code,                     // ← Should use CODE (stable)
  }))
);
```

If `rawMaterialId` is an ID like `sample-xxx`, we should change the system to use `code` instead for stability.

---

## 📋 **Quick Test After Fix**

After updating the formula:

1. ✅ Refresh the page
2. ✅ Start "sky" preparation
3. ✅ Scan Musk AL Tahara QR
4. ✅ Console should show:
   ```javascript
   materialId: 'sample-0865a76f-e76d-4129-b4c8-e27a3f87273b'
   normalized: 'RM:sample-0865a76f-e76d-4129-b4c8-e27a3f87273b'
   match: true  ← ✅ SUCCESS!
   ```
5. ✅ Code input turns green
6. ✅ Proceed to weighing

---

## 💡 **Summary**

**Problem:** Formula references old sample ID that no longer exists  
**Cause:** Sample was re-saved, generating new ID  
**Solution:** Update formula to reference current sample ID  
**Prevention:** System should use stable codes instead of IDs (future fix)

---

**Run the diagnostic script above and share the output!** 🔍

*Generated: October 20, 2025*

