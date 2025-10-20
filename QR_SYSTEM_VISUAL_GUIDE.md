# Universal QR System - Visual Guide
## Quick Reference

---

## 🎯 **What You'll See Now**

### **Preparation Details Page**

#### **BEFORE:**
```
┌─────────────────────────────────────────────────────┐
│ Seq │ Ingredient                     │ Target  │ ... │
├─────────────────────────────────────────────────────┤
│  1  │ sample-abc123-def456-789...    │ 50.00 g │ ... │
│  2  │ sample-xyz789-ghi012-345...    │ 30.00 g │ ... │
└─────────────────────────────────────────────────────┘
     ❌ Shows raw UUIDs (not helpful!)
```

#### **AFTER:**
```
┌─────────────────────────────────────────────────────┐
│ Seq │ Ingredient                     │ Target  │ ... │
├─────────────────────────────────────────────────────┤
│  1  │ Musk Al Tahara                 │ 50.00 g │ ... │
│  2  │ Rose Oil Concentrate           │ 30.00 g │ ... │
└─────────────────────────────────────────────────────┘
     ✅ Shows human-readable names!
```

---

## 📱 **QR Code Format**

### **OLD Format (REMOVED):**
```
S:GIV001003
```
❌ Simple but no metadata  
❌ Can't verify material details  
❌ Different format per type  

---

### **NEW Universal Format:**
```
NBS:RM;id=sample-uuid-here;code=GIV001003;name=Musk Al Tahara;ver=1
```
✅ Contains all metadata  
✅ Self-validating  
✅ Same format everywhere  
✅ Version-tagged for future updates  

---

## 🔍 **What the Scanner Recognizes**

When you scan ANY of these, the system will match the material:

```
1. ✅ NBS:RM;id=sample-abc;code=GIV001003;name=Musk;ver=1
   (Full QR payload - new format)

2. ✅ RM:sample-abc123
   (UUID reference - system format)

3. ✅ sample-abc123
   (Short UUID - internal format)

4. ✅ S:GIV001003
   (Legacy code with prefix - backwards compatibility)

5. ✅ GIV001003
   (Bare code - user-friendly)

6. ✅ 12345678901234
   (Linear barcode - auto-generated)
```

**All 6 formats work! No configuration needed!** 🎉

---

## 💡 **How to Use**

### **Creating a New Sample:**

1. **Fill in sample details:**
   - Custom ID: `GIV001003`
   - Name: `Musk Al Tahara`
   - Other fields...

2. **Save the sample**

3. **QR code auto-generates!**
   ```
   Console log:
   [SampleForm] Universal QR generated: {
     qrPayload: 'NBS:RM;id=sample-...;code=GIV001003;name=Musk Al Tahara;ver=1',
     barcode: '12345678901234',
     aliasCount: 6
   }
   ```

4. **Print label** (future feature)

5. **Use in preparation:**
   - Scan the QR or barcode
   - System instantly recognizes it
   - OR type `GIV001003` manually
   - All work the same!

---

### **During Preparation:**

```
┌────────────────────────────────────────┐
│  Step 1: Weigh Musk Al Tahara          │
│                                        │
│  [Scan Code Input]                     │
│  ┌──────────────────────────────────┐ │
│  │ GIV001003                     ✓  │ │  ← Green checkmark
│  └──────────────────────────────────┘ │
│                                        │
│  ✅ Material recognized!               │
│  📦 Musk Al Tahara                     │
│  🏷️  GIV001003                         │
│                                        │
│  [Proceed to weighing...]              │
└────────────────────────────────────────┘
```

---

## 🧪 **Quick Test Checklist**

### ✅ **Test 1: Name Display**
- [ ] Open a completed preparation
- [ ] See ingredient names (not UUIDs)

### ✅ **Test 2: QR Generation**
- [ ] Create new sample
- [ ] Save it
- [ ] Check console for QR log
- [ ] Verify format: `NBS:RM;...`

### ✅ **Test 3: Scanning**
- [ ] Start formula preparation
- [ ] Scan QR code
- [ ] See green checkmark
- [ ] Proceed to weighing

### ✅ **Test 4: Manual Entry**
- [ ] Start formula preparation
- [ ] Type code manually (e.g., `GIV001003`)
- [ ] See green checkmark
- [ ] Proceed to weighing

### ✅ **Test 5: Legacy Format**
- [ ] Start formula preparation
- [ ] Type `S:GIV001003` (old format)
- [ ] Still works! (backwards compatible)

---

## 📊 **System Architecture**

```
┌──────────────────────────────────────────────────────────┐
│                    Sample Creation                       │
│                                                          │
│  User fills form → useAutoGenerateQR hook triggers       │
│                  → generateMaterialCodes() runs          │
│                  → Unified QR + Barcode generated        │
│                  → Stored in sample.qrPayload            │
│                  → Stored in sample.barcode              │
│                  → Stored in sample.scanAliases[]        │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│                   Scan Registry                          │
│                                                          │
│  ScanIndexKeeper rebuilds index on app boot              │
│  → Reads all samples from localStorage                   │
│  → Reads all raw materials from localStorage             │
│  → For each material:                                    │
│    → Extract ALL scan aliases                            │
│    → Add to scanRegistry.index Map                       │
│  → Ready for instant lookups!                            │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│                  Preparation Wizard                      │
│                                                          │
│  User scans QR/barcode → normalizeScan() standardizes    │
│                        → scanRegistry.findMaterial()     │
│                        → Instant match! ✓                │
│                        → Display name shown              │
│                        → Proceed to weighing             │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│                 Preparation Details                      │
│                                                          │
│  Display completed prep → getIngredientName(uuid)        │
│                         → Lookup from localStorage       │
│                         → Show human name ✓              │
└──────────────────────────────────────────────────────────┘
```

---

## 🎉 **Benefits**

### **For Users:**
- 💚 **Easy to read:** Names instead of UUIDs
- 🎯 **Flexible scanning:** Works with ANY format
- ⚡ **Fast:** Instant recognition
- 🔄 **Compatible:** Old codes still work

### **For Developers:**
- 🛠️ **Simple:** One QR format everywhere
- 🔧 **Maintainable:** No format conversions needed
- 📦 **Extensible:** Easy to add more metadata (ver=2, etc.)
- 🐛 **Debuggable:** Clear console logs

### **For the System:**
- 🚀 **Performant:** O(1) lookups via Map
- 🔐 **Reliable:** Self-validating QR codes
- 📈 **Scalable:** Handles thousands of materials
- 🎯 **Accurate:** No scan mismatches

---

## 🆘 **Troubleshooting**

### **Problem: Name still shows as UUID**
**Solution:** Clear localStorage and re-seed data:
```
1. Open DevTools (F12)
2. Go to Application tab → Storage → Local Storage
3. Delete 'nbslims_enhanced_samples' and 'nbslims_raw_materials'
4. Go to Settings → Developer tab
5. Click "Seed All Data"
6. Refresh page
```

### **Problem: QR not recognized**
**Solution:** Check console logs:
```
Expected logs:
[ScanRegistry] Material found for token: 'GIV001003'
[CodeInput] Scan matched material: { id: '...', name: 'Musk Al Tahara' }

If missing:
1. Check if material exists in localStorage
2. Verify scanAliases array on material
3. Check scan registry was built on boot
4. Look for [ScanIndexKeeper] logs
```

### **Problem: Console shows old format**
**Solution:** Sample was created before fix:
```
1. Edit the sample
2. Save it again (triggers QR regeneration)
3. New universal format will be generated
4. Old format is now gone!
```

---

*Generated: October 20, 2025*  
*Universal QR System v1.0*

