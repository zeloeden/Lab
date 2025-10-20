# 🏷️ NBS LIMS Unified QR/Barcode Standard

## Overview

A unified, self-contained QR/barcode system that works seamlessly across all workflows in NBS LIMS.

---

## 🎯 QR Code Format

### **Standard Payload:**
```
NBS:RM;id=1760768228441;code=GIV001003;name=Musk AL Tahara;type=sample;ver=1
```

### **Fields:**
- `NBS:RM` - System identifier (NBS LIMS Raw Material)
- `id` - Sample/material ID (without `sample-` prefix)
- `code` - Human-readable code (e.g., GIV001003)
- `name` - Material name (for human readability)
- `type` - Material type (sample, raw_material, formula)
- `ver` - Format version (for future compatibility)

### **Why This Format?**

✅ **Self-Contained** - All info in one scan  
✅ **Works Offline** - No database lookup needed  
✅ **Future-Proof** - Version field for format evolution  
✅ **Human-Readable** - Name included for debugging  
✅ **Backwards Compatible** - Registry handles all formats  

---

## 🔢 Barcode Format

### **Linear Barcode (Code 128):**
```
S-1760768228441  (for samples)
F-abc123def456   (for formulas)
```

**Benefits:**
- Works with basic barcode scanners
- Shorter than QR payload
- Quick visual identification

---

## 🔄 Workflow Integration

### **1. Creating a Sample**

```typescript
import { generateMaterialCodes } from '@/lib/qr/generator';

const sample = {
  id: 'sample-1760768228441',
  code: 'GIV001003',
  name: 'Musk AL Tahara',
  type: 'sample',
};

const { qrPayload, qrImage, barcode } = await generateMaterialCodes(sample);

// Save to sample
sample.qrCode = qrImage;        // Base64 image for display
sample.qrPayload = qrPayload;   // Raw text for regeneration
sample.barcode = barcode;        // Linear barcode value
sample.scanAliases = [
  `RM:sample-1760768228441`,
  `S:GIV001003`,
  `GIV001003`,
  barcode,
  qrPayload,
];
```

### **2. Scanning in Preparation**

When user scans the QR:
1. **Input:** `NBS:RM;id=1760768228441;code=GIV001003;name=Musk AL Tahara;ver=1`
2. **Registry normalizes:** `RM:sample-1760768228441`
3. **Matches material:** ✅ Found in validCodes
4. **Step unlocks:** Ready to weigh

### **3. Scanning Alternative Codes**

The system accepts ALL these formats:
- `NBS:RM;id=1760768228441;code=GIV001003;...` (QR payload)
- `RM:sample-1760768228441` (canonical)
- `sample-1760768228441` (short)
- `S:GIV001003` (code with prefix)
- `GIV001003` (bare code)
- `S-1760768228441` (barcode)

---

## 📦 Implementation Files

### **Core:**
- `src/lib/qr/generator.ts` - QR/barcode generation
- `src/lib/scan/registry.ts` - Parsing and validation
- `src/hooks/useAutoGenerateQR.ts` - Auto-generation hook

### **Integration Points:**
1. **Samples Page** - Auto-generate on create/edit
2. **Raw Materials Page** - Auto-generate on create/edit
3. **Formulas Page** - Generate formula QR codes
4. **Preparation Wizard** - Validate all formats
5. **Label Printing** - Include both QR and barcode

---

## 🔧 How to Add to Sample Form

```tsx
import { useAutoGenerateQR } from '@/hooks/useAutoGenerateQR';

function SampleForm({ sample }) {
  const { qrData, isGenerating } = useAutoGenerateQR(sample);

  useEffect(() => {
    if (qrData && sample.id) {
      // Auto-save QR and barcode to sample
      updateSample({
        ...sample,
        qrCode: qrData.qrImage,
        qrPayload: qrData.qrPayload,
        barcode: qrData.barcode,
        scanAliases: [
          ...(sample.scanAliases || []),
          qrData.qrPayload,
          qrData.barcode,
        ],
      });
    }
  }, [qrData]);

  return (
    <div>
      {/* Sample form fields */}
      
      {isGenerating && <p>Generating QR code...</p>}
      
      {qrData && (
        <div className="border p-4 rounded">
          <h3>Generated Codes</h3>
          <img src={qrData.qrImage} alt="QR Code" className="w-32 h-32" />
          <p className="text-sm font-mono">{qrData.barcode}</p>
          <button onClick={() => printLabel(qrData)}>Print Label</button>
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 Label Template

```
┌──────────────────────────────┐
│  [QR Code]    NBS LIMS       │
│               ───────────     │
│               Musk AL Tahara  │
│               GIV001003       │
│                               │
│  ||||||||||||||||||||||||    │
│  S-1760768228441             │
└──────────────────────────────┘
```

---

## 🧪 Testing Checklist

- [ ] Create new sample → QR auto-generates
- [ ] Scan QR in preparation → Step unlocks
- [ ] Scan barcode in preparation → Step unlocks
- [ ] Scan old format (`S:CODE`) → Still works
- [ ] Edit sample code → QR updates
- [ ] Print label → QR and barcode both print
- [ ] Scan from mobile → Recognized
- [ ] Scan with wedge scanner → Normalized correctly

---

## 🚀 Benefits

### **For Users:**
- ✅ Scan once, works everywhere
- ✅ No manual code entry
- ✅ Self-documenting (name in QR)
- ✅ Multiple scan formats supported

### **For System:**
- ✅ Automatic QR generation
- ✅ Consistent across all modules
- ✅ Easy to debug (readable format)
- ✅ Version field for future changes

### **For Compliance:**
- ✅ Unique identifiers
- ✅ Traceability built-in
- ✅ Print-ready labels
- ✅ Audit trail in QR payload

---

## 📝 Next Steps

1. **Integrate into Samples page** - Add auto-generation
2. **Update label printing** - Use new QR format
3. **Migrate existing samples** - Generate QR for all
4. **Test with scanners** - Verify hardware compatibility
5. **Train users** - Document scanning workflow

---

## 🔍 Example Scenarios

### **Scenario 1: New Sample Creation**
1. User creates "Musk AL Tahara" with code "GIV001003"
2. System auto-generates QR and barcode
3. User prints label
4. Label ready to scan in any workflow

### **Scenario 2: Formula Preparation**
1. Operator scans formula QR → Opens prep
2. Scans ingredient QR → `NBS:RM;id=...;code=GIV001003;...`
3. System validates → ✅ Matches step 1
4. Weighing unlocks → Operator continues

### **Scenario 3: Old Scanner**
1. Old scanner can't read QR
2. Uses barcode instead → `S-1760768228441`
3. System normalizes → `RM:sample-1760768228441`
4. Still matches → ✅ Works perfectly

---

**Status:** ✅ Ready to implement  
**Priority:** High  
**Impact:** System-wide  

