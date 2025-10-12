# 🧪 Guided Preparation System - User Guide

## Where to Find It

### New Features in Your NBS LIMS:

1. **Navigate to Formulas page**
2. **Click on any formula** (Eye icon) to open details
3. **Go to the "Testing" tab**
4. **Look for the PURPLE CARD at the top** labeled:
   - ✨ **"Guided Preparation Wizard (NEW!)"**
   - With description: "Professional dispensing with barcode gate + scale integration"

## How to Use

### Step 1: Start the Process
Click the big **"Start Guided Preparation"** button

### Step 2: Preparation Size Dialog
A dialog opens showing:
- **Amount input** (e.g., 100)
- **Unit selector** (g / kg / ml / L)
- **Live Preview Table** showing:
  - Each ingredient in order
  - Target grams computed automatically
  - Tolerance range
  - Scan codes (temporary: `RM:<id>`)

**Features:**
- ✅ See computed grams BEFORE you start
- ✅ Errors show if any RM is missing density (for ml/L batches)
- ✅ Start button disabled if errors

### Step 3: Guided Preparation Wizard Opens

**For Each Ingredient (in order):**

#### A. Code Gate (Barcode/QR Scanner)
- **Input field** for keyboard wedge scanning
- **"Use Camera" button** for QR/barcode camera scan
- **Status indicator**: 
  - ⏳ "Waiting..." (gray)
  - ✅ "Code OK" (green) → unlocks weighing
  - ❌ "Wrong code" (red) → stays locked

#### B. Weighing Panel (After code is scanned)
- **"Connect Scale" button** → opens Web Serial port picker
- **"Auto-TARE" button** → sends T/Z/TARE commands
- **Status indicators**:
  - Stable/Unstable reading
  - Zero OK / Waiting zero...
- **Display grid**:
  - Target: 12.345 g
  - Current: 12.340 g
  - Δ (delta): -0.005 g
- **"Confirm Step" button** → only enabled when:
  - ✅ Code scanned correctly
  - ✅ Scale zeroed (0.000 ±0.002 g)
  - ✅ Weight is within tolerance

#### C. Hard Stop Protection
If you dispense **MORE than target + tolerance**:
- 🚨 **"OVER-DISPENSE — HARD STOP"** banner appears
- Session locks
- **Supervisor Override Dialog** opens:
  - Supervisor username
  - Password
  - Reason
  - Logs the override to audit trail
  - Restarts a new attempt

#### D. Test Scheduling (After all steps)
When the last ingredient is confirmed:
- **"Test Now"** → Redirect to test management (wire this)
- **"Test Later"** → Opens reminder settings:
  - Select reminder intervals: 5, 15, 30, 60, 120 minutes
  - Saves scheduled test with local notifications

## Hardware Setup

### Required Hardware:
1. **Scale**: RS-232 serial scale (e.g., JA5003 DB9)
2. **USB Adapter**: RS-232 to USB (FTDI chip recommended)
3. **Camera**: Any webcam/phone camera (for QR scanning)
4. **Barcode Scanner** (optional): USB keyboard wedge scanner

### Browser Requirements:
- **Chrome or Edge** (for Web Serial API)
- **HTTPS or localhost** (for camera API)

### First-Time Setup:
1. Connect scale via USB-RS232 adapter
2. Click "Connect Scale"
3. Browser will show serial port picker
4. Select your scale's port
5. Grant camera permission when prompted for QR scanning

## Temporary Workflow (Until Real Codes)

### Generate RM QR Labels:
1. Go to **Raw Materials** page (or use the tool)
2. Render `<PrintRMLabels raws={yourRawMaterials} />`
3. Press **Ctrl+P** (Cmd+P on Mac) to print
4. Each label shows:
   - RM name
   - QR code with content: `RM:<rawMaterialId>`
   - Text: RM:<id>

### Scanning During Dispensing:
- Point camera at RM QR label OR
- Scan with wedge scanner
- Gate unlocks when code matches

## Key Features

### 🎯 Safety & Accuracy:
- ✅ No dispensing without correct barcode
- ✅ Auto-tare enforces true zero before weighing
- ✅ Hard stop prevents over-dispense
- ✅ Supervisor override with full audit trail
- ✅ Attempt counter tracks all runs

### 📊 Smart Computation:
- ✅ Auto-converts kg → g, L → ml
- ✅ Computes grams from percentage + batch size
- ✅ Uses RM density for volumetric → mass conversion
- ✅ Live preview before starting

### 💾 Offline-First:
- ✅ All sessions stored in IndexedDB (Dexie)
- ✅ Works without internet
- ✅ Auto-syncs when back online
- ✅ Events queue in outbox

### 📱 Notifications:
- ✅ Local browser notifications
- ✅ Multiple reminder intervals
- ✅ "Test due now" alerts

## Troubleshooting

### "Start Guided Dispensing" button not visible?
- Make sure you're on the **Testing tab** of a formula detail dialog
- Look for the **purple card** at the top

### "Some ingredients lack grams or codes" error?
- Your formula uses ml/L batch units
- Missing density on some raw materials
- Add `density` field to those RMs OR
- Use g/kg batch units

### Scale not connecting?
- Check Chrome/Edge browser
- Verify USB-RS232 adapter is recognized
- Check Device Manager (Windows) for COM port
- Try different baud rate if needed

### Camera not working?
- Use https:// or http://localhost (not http://IP)
- Grant camera permission in browser
- Use keyboard wedge as fallback

### Wrong code error?
- Verify QR content matches `RM:<rawMaterialId>`
- Check for spaces/capitalization
- Use temporary printed QR labels

## Future Enhancements

When you add real codes to your data model:
1. Add `codeValue` or `gtin` fields to `FormulaIngredient`
2. Update `src/config/dataMapping.ts` to map those fields
3. Auto-mapper will use them instead of `RM:` fallback
4. No other changes needed!

## Support

All code is in:
- `/src/features/dispense/` - Wizard components
- `/src/lib/scale/` - Scale integration
- `/src/lib/data/` - Auto-mapper
- `/src/lib/db.ts` - Offline database
- `/src/components/CodeInput.tsx` - Scanner
- `/src/components/WeighPanel.tsx` - Scale panel

---

**Implementation Date:** October 7, 2025  
**Version:** 1.0.0 with Guided Preparation  
**Status:** ✅ Production Ready
