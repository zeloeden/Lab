# Guided Preparation Issues - Analysis & Fix

## 🔍 Issue 1: "Waiting zero..." Problem

### What's Happening
The screen shows:
- ✅ "Scale Connected"
- ✅ "Auto-TARE"
- ✅ "Stable"
- ✅ "Current: 0.000 g"
- ❌ **"Waiting zero..."** (should say "Zero OK")

### Root Cause
The preparation wizard is using the **OLD** `WeighPanel` component which uses the **OLD** `useScale` hook. This hook expects `reading.stable` from the old format, but the new bridge sends JSON packets that need the new `useScaleWS` hook.

**The mismatch:**
- Bridge sends: `{"type":"weight","value":0.000,"unit":"g","stable":true}`
- Old useScale parses: `reading = {valueG: 0.000, stable: false, raw: "{...json...}"}`
- It sees the JSON string as `raw`, but `stable` is NOT properly extracted!

### Solution
Use the NEW `WeighPanelStable` component we created that works with the new bridge.

---

## 🔍 Issue 2: QR Code Not Recognized

### What's Happening
You scan a QR code, but it shows "Waiting..." instead of unlocking the step.

### Root Cause
There are **MULTIPLE QR CODE FORMATS** in your system!

**1. New unified format** (from `src/lib/qr/generator.ts`):
```
NBS:RM;id=xxx;code=xxx;name=Musk AL Tahara;ver=1
```

**2. Old simple format** (from `src/lib/qrGenerator.ts`):
```
S:sample-id-here
```

**3. Formula format**:
```
F:formula-id
```

### The Problem
The **scan registry** expects one of these formats, but if the QR was generated with the **old** `qrGenerator.ts` format (`S:sample-id`), it might not match properly if the preparation step is looking for the `name` or `code`.

### What the Registry Does
From `src/lib/scan/registry.ts`, it tries to match:
1. Direct ID match: `sample-xxx`
2. Prefixed ID: `RM:sample-xxx`
3. Code variations: `S:CODE`, `CODE`
4. Barcodes from `barcodes[]` array
5. Saved aliases from `scanAliases[]`

### Why Your Scan Fails
Most likely: **The QR code doesn't contain the expected identifier**

Example scenario:
- Step expects: `RM:sample-123`
- QR contains: `NBS:RM;id=456;code=MAT001;name=Musk AL Tahara;ver=1`
- Result: **MISMATCH** (different IDs!)

---

## ✅ Solutions

### Fix 1: Use New WeighPanel

Replace `<WeighPanel>` with `<WeighPanelStable>` in the preparation wizard.

### Fix 2: Debug QR Code Content

**Step 1**: Check what's actually in the QR code
**Step 2**: Check what the preparation step expects
**Step 3**: Make sure they match!

Let me check what's expected in the preparation step:


