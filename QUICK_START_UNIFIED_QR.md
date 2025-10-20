# 🚀 Quick Start: Unified QR/Barcode System

## ⚡ TL;DR

Your samples now **auto-generate QR codes and barcodes** when you edit them. The QR works everywhere in the system with one scan!

---

## 🎯 How to Use

### **Step 1: Edit an Existing Sample**

1. Go to **Samples** page
2. Click **Edit** on any sample
3. Scroll down past "Storage Location"
4. You'll see a new **blue card** labeled "QR Code & Barcode"
5. Wait ~500ms for auto-generation
6. ✅ Your QR code and barcode are ready!

### **Step 2: View Your Generated Codes**

You'll see:
- **Left side:** QR code image (200x200px)
- **Right side:** Linear barcode (S-xxxxxxxxx format)
- **Bottom:** Green success message

### **Step 3: Use the QR in Workflow**

The QR code contains:
```
NBS:RM;id=1760768228441;code=GIV001003;name=Musk AL Tahara;type=sample;ver=1
```

**You can scan this in:**
- ✅ Formula preparations
- ✅ Sample tracking
- ✅ Inventory management
- ✅ Any future workflow

---

## 📋 What Changed?

### **Before:**
- QR codes were generated with old format
- Scanning sometimes didn't work
- Multiple QR formats caused confusion

### **After:**
- ✅ **One unified QR format** for everything
- ✅ **Auto-generates** when editing samples
- ✅ **Works with scan registry** (no more "Wrong code")
- ✅ **Backwards compatible** (old QRs still work)

---

## 🎨 Visual Guide

### **Sample Form - QR Display:**

```
┌──────────────────────────────────────────────────┐
│  Storage Location Card                           │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐  ← NEW!
│  🔲 QR Code & Barcode                            │
│  Unified scanning codes for this sample          │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────┐    ┌────────────────────┐   │
│  │   QR Code      │    │  Linear Barcode    │   │
│  │                │    │                    │   │
│  │   [QR IMAGE]   │    │  S-1760768228441  │   │
│  │                │    │  ║║║║║║║║║║║║║    │   │
│  │   200x200px    │    │  Code 128          │   │
│  └────────────────┘    └────────────────────┘   │
│                                                  │
│  ✓ This sample can be scanned using the QR      │
│    code or barcode in any workflow               │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Pricing Information Card                        │
└──────────────────────────────────────────────────┘
```

---

## ✅ Testing Checklist

**Quick 5-Minute Test:**

1. [ ] Edit any existing sample
2. [ ] Scroll to QR section
3. [ ] Verify QR appears within 1 second
4. [ ] Verify barcode shows below QR
5. [ ] Save the sample
6. [ ] Re-open sample (verify QR persists)
7. [ ] Scan QR in formula preparation
8. [ ] Verify step unlocks

**If any step fails, see troubleshooting below.**

---

## 🐛 Troubleshooting

### **Problem: QR not showing**

**Solution:**
1. Make sure you're **editing** a sample (not creating new)
2. Sample must have an ID (already saved once)
3. Wait ~500ms for generation
4. Check console for errors (F12)

### **Problem: "Wrong code" in preparation**

**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Verify `ScanIndexKeeper` is running (check console)
3. Re-save the sample to update registry
4. Try scanning again

### **Problem: Barcode not scanning**

**Solution:**
1. Use the **QR code** instead (recommended)
2. Barcode is for backup/visual only
3. QR contains more data and is more reliable

---

## 🎓 Pro Tips

### **Tip 1: Print Labels**
Your QR code is ready to print! Just:
1. Right-click the QR image
2. "Save image as..."
3. Use in your label template

### **Tip 2: One QR, Multiple Uses**
The same QR works for:
- Formula preparation steps
- Sample tracking
- Inventory checks
- Quality control

### **Tip 3: Backwards Compatible**
Old QR codes and formats still work! No need to update everything at once.

### **Tip 4: Mobile Ready**
The QR format works with standard QR scanners, including mobile apps.

---

## 📊 Sample Data Structure

When you save, the sample now includes:

```json
{
  "id": "sample-1760768228441",
  "code": "GIV001003",
  "itemNameEN": "Musk AL Tahara",
  
  "qrPayload": "NBS:RM;id=1760768228441;code=GIV001003;name=Musk AL Tahara;type=sample;ver=1",
  "barcode": "S-1760768228441",
  "qrImageBase64": "data:image/png;base64,...",
  
  "scanAliases": [
    "NBS:RM;id=1760768228441;code=GIV001003;...",
    "S-1760768228441",
    "RM:sample-1760768228441",
    "sample-1760768228441",
    "S:GIV001003",
    "GIV001003"
  ]
}
```

**scanAliases** = All the ways this sample can be scanned

---

## 🔥 Common Use Cases

### **Use Case 1: Formula Preparation**

```
Operator → Scans formula QR
         → Opens prep wizard
         → Step 1: "Add Musk AL Tahara"
         → Scans sample QR
         → ✅ Step unlocks
         → Weighs ingredient
         → Next step
```

### **Use Case 2: Inventory Check**

```
Manager  → Scans sample QR
         → System shows: "Musk AL Tahara (GIV001003)"
         → Current location: Rack A1, Position 5
         → Last used: 2 days ago
```

### **Use Case 3: Quality Control**

```
QC Tech  → Scans sample QR
         → System shows test history
         → Can add new test result
         → Links automatically
```

---

## 📚 Additional Resources

- **Full Documentation:** `UNIFIED_QR_IMPLEMENTATION_COMPLETE.md`
- **Standard Specification:** `QR_BARCODE_UNIFIED_STANDARD.md`
- **Registry Guide:** `src/lib/scan/registry.ts` (comments)
- **Generator API:** `src/lib/qr/generator.ts` (JSDoc)

---

## 🎯 Next Features Coming

1. **Auto-generate for NEW samples** (not just edit)
2. **Bulk QR generation** (update all samples at once)
3. **QR on Raw Materials page**
4. **QR on Formulas page**
5. **Print label button** (one-click print)
6. **QR history** (track all scans)

---

## 💡 FAQ

**Q: Do I need to update all my samples?**  
A: No! Old formats still work. Update as you edit samples naturally.

**Q: Can I use my own QR scanner?**  
A: Yes! Standard QR code format works with any scanner.

**Q: What if I scan the wrong QR?**  
A: System validates and shows "Wrong code" - no data corruption.

**Q: Can I customize the QR content?**  
A: Yes, but requires developer changes to `generateMaterialQR()`.

**Q: Why does barcode look different each time?**  
A: It's based on sample ID, which is unique and never changes.

---

**🎉 You're all set! Start scanning!**

**Questions?** Check the full docs or open an issue.

**Last Updated:** 2025-01-19  
**Version:** 1.0

