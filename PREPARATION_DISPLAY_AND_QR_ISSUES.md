# Preparation Display & QR Code Issues - Analysis & Solutions

## 🐛 Issue 1: Raw Material Shows as UUID

### What You See
```
Raw Material: 48d145ff-dbac-4a59-a1fb-e5302b427292
```

### What You Should See
```
Raw Material: Musk AL Tahara
```

### Root Cause

**The database schema is missing the `displayName` field!**

**Current StepCtx interface** (line 6 in `useWizard.ts`):
```typescript
export interface StepCtx {
  id: string;
  sequence: number;
  ingredientId: string;  // ← Only stores UUID!
  requiredCodeValue: string;
  // ... other fields
  // ❌ NO displayName field!
}
```

**What gets saved to database** (line 26):
```typescript
await db.steps.add({
  id: s.id,
  sessionId,
  sequence: s.sequence,
  ingredientId: s.ingredientId,  // ← UUID like "48d145ff..."
  // ❌ displayName is NOT saved!
  ...
});
```

**But the Wizard HAS the displayName** (line 33 in `Wizard.tsx`):
```typescript
const steps = useMemo(()=> stepsDef.map(s => ({
  ...
  displayName: s.displayName || s.ingredientId,  // ← "Musk AL Tahara"
  ...
})), [stepsDef]);
```

It's just never saved to the database!

### Solution

**Step 1**: Add `displayName` to StepCtx interface
**Step 2**: Save `displayName` when creating steps
**Step 3**: Display `displayName` in PreparationDetails

---

## 🐛 Issue 2: QR Code Uses Old Format

### What the QR Contains
```
S:GIV001003
```
(Old simple format from `qrGenerator.ts`)

### What It Should Contain
```
NBS:RM;id=sample-123;code=GIV001003;name=Musk AL Tahara;ver=1
```
(New unified format that the scan registry understands)

### Root Cause

**Fallback logic in SampleForm uses OLD generator!**

**Line 427-449 in `SampleForm.tsx`**:
```typescript
} else if (!sample) {
  // Fallback for new samples when hook hasn't generated yet
  const tempSampleNo = Date.now() % 1000000;
  barcode = barcodeGenerator.generateBarcodeString(tempSampleNo);
  
  // ❌ Uses OLD qrGenerator!
  const qrResult = await qrGenerator.generateSampleQR(qrFallback);
  qrCode = qrResult.qrId;  // ← Returns "S:GIV001003"
  qrImageBase64 = qrResult.qrImageBase64;
}
```

**The old `qrGenerator.generateSampleQR()` creates**:
```typescript
// Line 68 in qrGenerator.ts
const qrId = `S:${sampleData.sampleId}`;  // ← Old format!
```

### Why This Happens

The `useAutoGenerateQR` hook (new system) doesn't always run in time, so the form falls back to the old `qrGenerator` system.

### Solution

**Remove the fallback** or **make the fallback use the NEW format** (`generateMaterialCodes` from `src/lib/qr/generator.ts`)

---

## ✅ Quick Fixes

### Fix 1: Display Names in Preparation History

The easiest fix is to **look up the display name** when showing preparation details, since the UUID is already there:

**In `PreparationDetails.tsx`**, when displaying steps:
```typescript
// Current (shows UUID):
<td>{step.ingredientId}</td>

// Fixed (lookup display name):
<td>{getRawMaterialName(step.ingredientId)}</td>
```

### Fix 2: Regenerate QR Codes

For existing samples with old QR codes:
1. Go to Samples page
2. Edit each sample
3. Save (triggers QR regeneration with new format)

**Or** seed data fresh (clears old QR codes):
1. Settings → Developer → Clear Data
2. Settings → Developer → Seed Data

---

## 🔧 Proper Long-term Fixes

### Fix 1: Store Display Names (Database Schema Change)

**Step 1**: Update `StepCtx` interface:
```typescript
export interface StepCtx {
  id: string;
  sequence: number;
  ingredientId: string;
  displayName: string;  // ← ADD THIS
  requiredCodeValue: string;
  ...
}
```

**Step 2**: Save displayName to database:
```typescript
await db.steps.add({
  ...
  ingredientId: s.ingredientId,
  displayName: s.displayName,  // ← ADD THIS
  ...
});
```

**Step 3**: Update IndexedDB schema in `src/lib/db.ts`:
```typescript
this.version(3).stores({
  steps: 'id, sessionId, sequence, ingredientId, displayName, status',
  // ↑ Add displayName to index
});
```

### Fix 2: Always Use New QR Format

**Remove old fallback** in `SampleForm.tsx`:
```typescript
// DELETE lines 427-452 (old fallback logic)

// OR replace with:
} else if (!sample) {
  // Use NEW generator instead of old
  const material = {
    id: formData.customIdNo || `sample-${Date.now()}`,
    code: formData.customIdNo,
    name: formData.itemNameEN,
    type: 'sample' as const
  };
  
  const { qrPayload: qp, qrImage: qi, barcode: bc } = 
    await generateMaterialCodes(material);
  
  qrPayload = qp;
  qrImageBase64 = qi;
  barcode = bc;
}
```

---

## 📋 Immediate Workarounds

### For Display Names Issue:

**Option A**: Update PreparationDetails to lookup names:
```typescript
const getRawMaterialName = (id: string) => {
  // Check localStorage samples
  const samples = JSON.parse(localStorage.getItem('nbslims_enhanced_samples') || '[]');
  const found = samples.find((s: any) => s.id === id);
  return found?.itemNameEN || found?.name || id;
};
```

**Option B**: Accept that old preparations show UUIDs (only affects history view)

### For QR Code Issue:

**Option A**: Regenerate all sample QR codes:
- Edit each sample → Save
- QR will regenerate with new format

**Option B**: Seed fresh data:
- Clear all data
- Run seed
- All QRs will use new format

---

## 🎯 Which Fix to Apply?

### Minimal Fix (Fastest):
1. ✅ Update `PreparationDetails` to lookup display names
2. ✅ Regenerate QR codes for important samples

### Complete Fix (Best):
1. ✅ Add displayName to database schema
2. ✅ Remove old QR fallback
3. ✅ Migrate data (regenerate QRs)

---

## 📊 Impact Analysis

### Issue 1 (UUIDs in prep history):
- **Severity**: Medium (cosmetic, doesn't break functionality)
- **Affected**: Historical preparation views only
- **Workaround**: Easy (lookup on display)

### Issue 2 (Wrong QR format):
- **Severity**: HIGH (breaks scanning!)
- **Affected**: Any sample created when hook didn't run
- **Workaround**: Regenerate QRs

---

## 🚀 Recommended Action Plan

**Immediate** (to fix your current prep):
1. Regenerate QR codes for your test samples
2. Test scanning with new QR codes

**Short-term** (this week):
1. Update PreparationDetails to show names
2. Remove old QR fallback

**Long-term** (next sprint):
1. Add displayName to database schema
2. Migrate existing data

---

**Current Status**: 
- ✅ Identified both root causes
- ⏳ Fixes require code changes
- 🔄 Workarounds available now


