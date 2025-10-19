# Complete System Workflow & Logic Documentation

## Navigation Overview

The Lab Management System consists of 14 main sections accessible via the sidebar navigation. Each section serves a specific purpose in the lab workflow, from formula management to purchasing and analytics.

---

## 1. Dashboard

### Purpose
Central command center providing real-time overview of lab operations, pending tasks, and key metrics.

### Functionality
- **Quick Actions:** Scan QR to start preparation, create sample, schedule test
- **Status Cards:**
  - Active preparations (in-progress count)
  - Pending tests (due today/overdue)
  - Low stock alerts (raw materials below threshold)
  - Recent samples (last 24 hours)
- **Scale Status:** Real-time connection indicator
- **Recent Activity Feed:** Last 10 actions across the system

### Workflow
```
User lands on Dashboard
    ↓
Scan QR code (wedge scanner or manual entry)
    ├─ Formula QR → Navigate to Formula First (auto-start prep)
    ├─ Sample QR → Navigate to Sample detail
    └─ Prep QR → Navigate to Preparation detail
    ↓
Click quick action buttons:
    ├─ "New Preparation" → Formula search
    ├─ "New Sample" → Sample creation form
    └─ "Schedule Test" → Test management
```

### Key Integrations
- **Scale Bridge:** WebSocket connection status badge
- **IndexedDB:** Real-time queries for counts and recent items
- **QR Scanner:** Global scanner integration via `useBarcode` hook

---

## 2. Samples

### Purpose
Track all samples from creation through testing to disposal. Samples can originate from preparations, suppliers, complaints, or stability studies.

### Functionality

#### Sample List View
- **Search/Filter:**
  - By sample code (e.g., GIV001003)
  - By formula code
  - By source (preparation, supplier, complaint, stability)
  - By status (active, tested, discarded)
  - By date range
- **Display Columns:**
  - Sample code (with QR code icon)
  - Name
  - Source
  - Created date
  - Status badge
  - Actions (view, edit, test, discard)

#### Sample Detail View
- **Header:** Sample code, name, status, created date/by
- **Source Information:**
  - If from preparation: Link to prep session, formula used
  - If from supplier: Supplier name, PO number, lot number
  - If from complaint: Complaint ID, customer info
- **Material Trace:** (for cost calculation)
  - List of raw materials used
  - Quantity of each (grams)
  - Cost per gram (from RM price)
  - Line total cost
  - Total sample cost
- **Test History:**
  - Scheduled tests (upcoming)
  - Completed tests with results (pass/fail)
  - Test dates and operators
- **Storage:**
  - Location (fridge, shelf, cabinet)
  - Expiry date
  - Notes

#### Create Sample Flow
```
Entry Points:
├─ From completed preparation (most common)
├─ From Samples list (manual entry)
└─ From supplier receipt

Create Sample Form:
    ↓
Auto-generate sample code (e.g., GIV001003)
    ↓
User fills:
    - Name (optional)
    - Source type (dropdown)
    - Source details (prep ID, supplier, etc.)
    - Location
    - Expiry date (optional)
    - Notes
    ↓
System creates Sample record
    ↓
If from preparation:
    - Copy material trace from prep session
    - Calculate cost from raw material prices
    - Link to formula
    ↓
Generate QR code for sample
    ↓
Navigate to sample detail
```

### Data Model
```typescript
Sample {
  id: string
  sampleCode: string (unique, e.g., "GIV001003")
  name?: string
  source: 'preparation' | 'supplier' | 'complaint' | 'stability'
  preparationSessionId?: string
  formulaId?: string
  supplierId?: string
  complaintId?: string
  status: 'active' | 'tested' | 'discarded'
  createdAt: timestamp
  createdBy: string
  location?: string (fridge, shelf, cabinet A3)
  expiryDate?: timestamp
  notes?: string
  
  // Cost calculation (populated if from prep)
  materialTrace?: MaterialTrace[]
  costTotal?: number
  currency?: string
  costComputedAt?: timestamp
}

MaterialTrace {
  rmId: string (raw material ID)
  rmName: string
  qtyActual: number (grams used)
  unitCost?: number (cost per gram)
  lineCost?: number (qtyActual × unitCost)
  lotId?: string
}
```

### Key Features
- **QR Code Scanning:** Scan sample QR to view details instantly
- **Cost Tracking:** Automatic cost calculation from material trace
- **Batch Operations:** Discard multiple samples at once
- **Export:** Export sample list to CSV/Excel

---

## 3. Tests

### Purpose
Manage quality control testing schedule and results for all samples.

### Functionality

#### Test Management View
- **Pending Tests Tab:**
  - List of scheduled tests not yet completed
  - Due date sorting (overdue highlighted in red)
  - Sample code and formula
  - Test type (pH, viscosity, microbiology, etc.)
  - Assigned operator
- **Completed Tests Tab:**
  - Historical test results
  - Pass/fail status
  - Test date and operator
  - Result values and expected ranges
- **Test Templates Tab:**
  - Pre-configured test types
  - Default parameters and pass criteria
  - Frequency settings (per batch, per week, etc.)

#### Schedule Test Flow
```
Entry Points:
├─ From sample detail (most common)
├─ From preparation completion
└─ From Tests list (manual)

Schedule Test:
    ↓
Select sample (if not already selected)
    ↓
Choose test type(s) from templates:
    ├─ pH Test (expected: 5.5-6.5)
    ├─ Viscosity (expected: 2000-3000 cP)
    ├─ Microbiology (negative for pathogens)
    ├─ Stability (visual inspection)
    └─ Custom test
    ↓
Set schedule:
    - Start date (when to begin testing)
    - Due date (deadline)
    - Remind before (e.g., 1 day before due)
    ↓
Assign operator (optional)
    ↓
Create TestSchedule record(s)
    ↓
System shows confirmation with test IDs
```

#### Record Test Result Flow
```
Tests list → Click pending test
    ↓
Test detail page opens
    ↓
User performs physical test in lab
    ↓
User enters:
    - Result value (e.g., pH = 6.2)
    - Pass/Fail (auto-determined if range specified)
    - Notes (observations)
    - Completion date/time
    ↓
System validates result against expected range
    ↓
If fail:
    - Mark sample as "failed"
    - Trigger alert to QC manager
    - Create investigation task
    ↓
If pass:
    - Mark test as complete
    - Update sample status
    ↓
System logs audit event
```

### Data Model
```typescript
TestSchedule {
  id: string
  type: 'formula' | 'personal'
  linkId: string (sampleId or preparationSessionId)
  testName: string (e.g., "pH Test")
  startAt: timestamp (when to start)
  dueAt: timestamp (deadline)
  remindOffsets: number[] (e.g., [-86400000] = 1 day before)
  assignedTo?: string (operator name)
  status: 'scheduled' | 'in_progress' | 'done' | 'canceled'
}

TestResult {
  id: string
  testScheduleId: string
  sampleId: string
  testName: string
  result: 'pass' | 'fail' | 'pending'
  value?: any (measured value, e.g., 6.2)
  expectedRange?: string (e.g., "5.5-6.5")
  unit?: string (e.g., "pH", "cP", "CFU")
  notes?: string
  testedAt: timestamp
  testedBy: string
  attachments?: string[] (photo URLs)
}

TestTemplate {
  id: string
  name: string (e.g., "pH Test")
  category: 'physical' | 'chemical' | 'microbiology'
  expectedRange?: string
  unit?: string
  method?: string (test procedure)
  frequency?: 'per_batch' | 'daily' | 'weekly' | 'monthly'
  equipment?: string[] (required equipment)
}
```

### Key Features
- **Automatic Scheduling:** Tests auto-schedule based on formula requirements
- **Reminders:** Email/notification reminders before due date
- **Result Validation:** Auto pass/fail based on expected ranges
- **Audit Trail:** Complete history of who tested what when

---

## 4. Formulas

### Purpose
Central repository of all product formulas with versioning, ingredients, and preparation instructions.

### Functionality

#### Formula List View
- **Search/Filter:**
  - By formula code (F=PRM00936)
  - By name (Premium Moisturizer)
  - By status (active, inactive, archived)
  - By category (base, actives, fragrance)
- **Display Columns:**
  - Formula code (clickable, with QR icon)
  - Name
  - Status badge
  - # of ingredients
  - Last used date
  - Total preparations made
  - Actions (view, edit, copy, archive)
- **Bulk Actions:**
  - Export selected formulas
  - Batch status update
  - Generate QR codes

#### Formula Detail View
- **Header:**
  - Formula code, name, version
  - Status, category
  - Target batch size (e.g., 100g)
  - Created/updated dates
- **Ingredients Table:**
  - Sequence (order to add)
  - Ingredient name (linked to raw material)
  - Percentage (%)
  - Fraction (calculated: % / 100)
  - Notes (mixing instructions)
  - Actions (reorder, edit, delete)
- **Calculations:**
  - Total percentage (must = 100%)
  - Total weight (for target batch)
  - Cost per batch (if RM prices available)
- **Preparation History:**
  - List of all preparations using this formula
  - Success rate
  - Average time per prep
- **Attachments:**
  - SDS (Safety Data Sheets)
  - Specification sheets
  - Photos

#### Create/Edit Formula Flow
```
Formulas list → Click "New Formula"
    ↓
Formula form opens:
    ↓
User enters:
    - Formula code (e.g., PRM00936)
    - Name
    - Category
    - Target batch size (default 100g)
    ↓
Add ingredients (one at a time):
    ↓
For each ingredient:
    - Search/select raw material
    - Enter percentage (e.g., 45.0%)
    - Add notes (e.g., "Add slowly while stirring")
    - Set sequence order
    ↓
System validates:
    - Total percentages = 100%
    - No duplicate ingredients
    - All raw materials exist
    ↓
User clicks "Save"
    ↓
System:
    - Calculates fractions (% / 100)
    - Generates version number
    - Creates Formula record
    - Stores ingredients
    ↓
Navigate to formula detail
```

#### Formula Versioning
```
User edits existing formula
    ↓
System detects changes to ingredients
    ↓
Prompt: "Create new version or update current?"
    ├─ New version:
    │   - Copy current formula
    │   - Increment version number
    │   - Mark old version as "superseded"
    │   - New version becomes active
    │
    └─ Update current:
        - Modify existing formula
        - Add audit log entry
        - Keep same version number
```

### Data Model
```typescript
Formula {
  id: string (UUID)
  code: string (unique, e.g., "PRM00936")
  internalCode?: string (legacy codes)
  name: string (e.g., "Premium Moisturizer Base")
  status: 'active' | 'inactive' | 'archived'
  version: number
  category?: string (e.g., "Base", "Actives", "Fragrance")
  targetBatchSize: number (default 100)
  targetBatchUnit: 'g' | 'kg' | 'ml' | 'L'
  ingredients: Ingredient[]
  notes?: string
  createdAt: timestamp
  updatedAt: timestamp
  createdBy: User
  supersededBy?: string (if newer version exists)
}

Ingredient {
  id: string
  ingredientId: string (ref to RawMaterial.id)
  ingredientName: string (denormalized for speed)
  percentage: number (0-100, e.g., 45.0)
  fraction: number (0-1, calculated: percentage / 100)
  sequence: number (order to add, 1-based)
  notes?: string (mixing instructions)
}
```

### Key Features
- **Version Control:** Track formula changes over time
- **Cost Calculation:** Real-time cost per batch based on RM prices
- **QR Code Generation:** Print QR labels for formulas
- **Duplication:** Copy existing formula as starting point
- **Batch Preparation History:** See all preps made from this formula

---

## 5. Raw Materials

### Purpose
Manage inventory, suppliers, pricing, and specifications for all raw materials used in formulations.

### Functionality

#### Raw Materials List View
- **Search/Filter:**
  - By code (RM-001)
  - By name (Glycerin USP)
  - By CAS number
  - By supplier
  - By stock status (in stock, low stock, out of stock)
- **Display Columns:**
  - Code
  - Name
  - CAS number
  - Supplier
  - Stock quantity
  - Unit price
  - Min stock level (reorder point)
  - Status indicator (red/yellow/green dot)
  - Actions (view, edit, reorder, discard)
- **Quick Stats:**
  - Total RM count
  - Low stock count (below min level)
  - Out of stock count
  - Total inventory value

#### Raw Material Detail View
- **Identification:**
  - Code, name, CAS number
  - Category (active, base, preservative, fragrance, etc.)
  - QR code
- **Supplier Information:**
  - Primary supplier name
  - Supplier code/SKU
  - Alternate suppliers (with prices)
- **Inventory:**
  - Current stock quantity
  - Unit (kg, L, units)
  - Min stock level (reorder threshold)
  - Max stock level
  - Location in warehouse (e.g., "Shelf A3")
  - Last received date
  - Last used date
- **Pricing:**
  - Current price (per kg or per L)
  - Currency
  - Price history (chart showing trends)
  - Last updated date
- **Regulatory:**
  - SDS (Safety Data Sheet) - PDF link
  - Specification sheet - PDF link
  - Allergen information
  - Hazard symbols
  - Storage requirements (temperature, light, etc.)
- **Usage Statistics:**
  - Total consumed (last 30/90/365 days)
  - # of formulas using this RM
  - Average consumption per prep
  - Projected depletion date

#### Receive Raw Material Flow
```
Entry Points:
├─ From PO receipt
├─ From RM list (manual entry)
└─ From scan (receiving QR)

Receive RM:
    ↓
Scan/select raw material
    ↓
Enter receipt details:
    - Quantity received (kg or L)
    - Lot number
    - Expiry date
    - Supplier
    - PO number
    - Receipt date
    - Condition (good, damaged, etc.)
    ↓
System updates:
    - Stock quantity (add received amount)
    - Last received date
    - Create inventory transaction log
    ↓
If quantity now > min stock:
    - Clear low stock alert
    ↓
Generate lot label (QR code with RM + lot info)
```

#### Consume Raw Material Flow
```
Happens automatically during preparation:
    ↓
PreparationStep records capturedQtyG
    ↓
On preparation completion:
    ↓
For each step:
    - Deduct capturedQtyG from RM stock
    - Create inventory transaction log
    - Link to preparation session
    ↓
If new stock < min stock:
    - Trigger low stock alert
    - Add to reorder list
    ↓
Update RM usage statistics
```

### Data Model
```typescript
RawMaterial {
  id: string (UUID)
  code: string (unique, e.g., "RM-001")
  name: string (e.g., "Glycerin USP")
  casNumber?: string (e.g., "56-81-5")
  category?: string (active, base, preservative, etc.)
  
  // Supplier
  supplierId?: string
  supplierCode?: string (supplier's SKU)
  
  // Inventory
  stockQty: number (current quantity)
  unit: 'kg' | 'L' | 'units'
  minStockQty: number (reorder threshold)
  maxStockQty?: number
  location?: string (warehouse location)
  lastReceivedAt?: timestamp
  lastUsedAt?: timestamp
  
  // Pricing
  price?: number (cost per unit)
  currency?: string (USD, EUR, etc.)
  priceUpdatedAt?: timestamp
  
  // Regulatory
  sdsUrl?: string (Safety Data Sheet PDF)
  specUrl?: string (Specification sheet PDF)
  allergens?: string[]
  hazardSymbols?: string[]
  storageRequirements?: string
  
  // Metadata
  notes?: string
  createdAt: timestamp
  updatedAt: timestamp
}

InventoryTransaction {
  id: string
  rawMaterialId: string
  type: 'receive' | 'consume' | 'adjust' | 'discard'
  quantity: number (positive for receive, negative for consume)
  unit: string
  lotNumber?: string
  expiryDate?: timestamp
  reference?: string (PO number or prep session ID)
  performedBy: string
  performedAt: timestamp
  notes?: string
  balanceAfter: number (stock qty after transaction)
}
```

### Key Features
- **Auto-Depletion:** Stock automatically decreases during preparations
- **Low Stock Alerts:** Dashboard widget + email notifications
- **Price Tracking:** Historical price charts
- **Lot Tracking:** Trace which lot was used in which prep
- **Supplier Comparison:** See prices from multiple suppliers

---

## 6. Finished Goods

### Purpose
Track finished products after preparation and packaging, ready for sale or distribution.

### Functionality

#### Finished Goods List View
- **Search/Filter:**
  - By product code (FG-001)
  - By name
  - By batch number
  - By status (in stock, shipped, sold, expired)
  - By date range
- **Display Columns:**
  - Product code
  - Name
  - Batch number
  - Quantity in stock
  - Unit (bottles, jars, boxes)
  - Manufacturing date
  - Expiry date
  - Status
  - Actions (view, ship, adjust, discard)

#### Finished Good Detail View
- **Product Information:**
  - Code, name, description
  - Batch number (linked to preparation)
  - Formula used
  - Manufacturing date
  - Expiry date (calculated from mfg date + shelf life)
- **Inventory:**
  - Quantity in stock
  - Unit (bottles, jars, kg, etc.)
  - Location (warehouse, retail, etc.)
  - Reserved quantity (for pending orders)
  - Available quantity (stock - reserved)
- **Packaging:**
  - Container type (bottle, jar, tube, etc.)
  - Container size (50ml, 100ml, etc.)
  - Label design reference
  - # of units per case
- **Compliance:**
  - Product registration number
  - Certifications (organic, vegan, etc.)
  - Claims (anti-aging, moisturizing, etc.)
  - Regulatory status
- **Traceability:**
  - Preparation session ID (raw materials used)
  - Test results (QC approval)
  - Packaging date
  - Operator who packaged
- **Sales:**
  - Price per unit
  - Total value in stock
  - # of units shipped (lifetime)
  - Revenue generated

#### Create Finished Good Flow
```
Entry Points:
├─ From completed preparation
└─ From FG list (manual entry)

Create FG:
    ↓
Select source preparation (if applicable)
    ↓
Enter product details:
    - Product code (auto-generated or manual)
    - Name
    - Batch number
    - Quantity produced
    - Unit (bottles, jars, kg)
    - Manufacturing date
    - Shelf life (days)
    ↓
System calculates:
    - Expiry date (mfg date + shelf life)
    ↓
Enter packaging details:
    - Container type
    - Container size
    - # of units
    ↓
Link to formula and prep session
    ↓
System creates FG record
    ↓
Generate batch label (QR code)
```

### Data Model
```typescript
FinishedGood {
  id: string
  productCode: string (unique, e.g., "FG-001")
  name: string
  description?: string
  batchNumber: string (e.g., "20250118-001")
  
  // Source traceability
  preparationSessionId?: string
  formulaId?: string
  
  // Inventory
  stockQty: number
  unit: 'bottles' | 'jars' | 'tubes' | 'kg' | 'L' | 'boxes'
  reservedQty: number (for pending orders)
  location?: string
  
  // Dates
  mfgDate: timestamp (manufacturing)
  expiryDate: timestamp (calculated: mfg + shelfLife)
  shelfLifeDays: number
  
  // Packaging
  containerType?: string
  containerSize?: string (e.g., "50ml")
  unitsPerCase?: number
  
  // Pricing
  pricePerUnit?: number
  currency?: string
  
  // Compliance
  registrationNumber?: string
  certifications?: string[]
  claims?: string[]
  
  // Status
  status: 'in_stock' | 'shipped' | 'sold' | 'expired' | 'recalled'
  
  // Metadata
  notes?: string
  createdAt: timestamp
  createdBy: string
}

ShipmentRecord {
  id: string
  finishedGoodId: string
  quantityShipped: number
  recipient: string
  shippedAt: timestamp
  shippedBy: string
  trackingNumber?: string
  notes?: string
}
```

### Key Features
- **Batch Traceability:** Link back to prep session and raw materials
- **Expiry Tracking:** Auto-calculate expiry dates, alert before expiration
- **Shipment History:** Track where products went
- **Compliance Ready:** All info needed for regulatory audits

---

## 7. Labels

### Purpose
Generate and print labels (QR codes, batch labels, product labels) for formulas, samples, raw materials, and finished goods.

### Functionality

#### Label Templates
- **Formula Labels:**
  - Formula code (large text)
  - QR code (encoded: F=CODE)
  - Formula name
  - Version number
  - Date printed
- **Sample Labels:**
  - Sample code (large text)
  - QR code (encoded: S=CODE)
  - Sample name
  - Source (prep ID or supplier)
  - Created date
  - Expiry date
- **Raw Material Labels:**
  - RM code + name
  - QR code (encoded: RM=CODE)
  - Lot number
  - Received date
  - Expiry date
  - Hazard symbols
- **Finished Good Labels:**
  - Product name
  - QR code (encoded: FG=CODE)
  - Batch number
  - Mfg date / Expiry date
  - Container size
  - Ingredients list (if required)

#### Label Generation Flow
```
Entry Points:
├─ From any detail page (Formula, Sample, RM, FG)
└─ From Labels page (batch generation)

Generate Label:
    ↓
Select item(s) to label
    ↓
Choose label template:
    - Standard (QR + basic info)
    - Detailed (QR + extended info)
    - Compliance (QR + regulatory data)
    - Custom (user-designed template)
    ↓
Preview label(s):
    - Check QR code scans correctly
    - Verify all data fields
    ↓
Adjust settings:
    - Label size (30mm × 15mm, 50mm × 25mm, etc.)
    - # of copies
    - Printer selection
    ↓
Print or Download PDF
```

#### Batch Label Generation
```
Labels page → Select "Batch Print"
    ↓
Choose entity type:
    ├─ Formulas
    ├─ Samples
    ├─ Raw Materials
    └─ Finished Goods
    ↓
Filter items:
    - By status (active only)
    - By date range
    - By category
    ↓
Select items from filtered list (checkbox)
    ↓
Choose template
    ↓
Preview sheet (shows label layout on page)
    ↓
Print all labels
```

### Data Model
```typescript
LabelTemplate {
  id: string
  name: string (e.g., "Standard Formula Label")
  entityType: 'formula' | 'sample' | 'raw_material' | 'finished_good'
  size: { width: number; height: number } (mm)
  fields: LabelField[] (what to show on label)
  qrCodePosition: { x: number; y: number; size: number }
  layout: 'portrait' | 'landscape'
  backgroundColor?: string
  borderStyle?: string
}

LabelField {
  name: string (e.g., "formulaCode")
  label?: string (e.g., "Formula:")
  fontSize: number
  position: { x: number; y: number }
  fontWeight?: 'normal' | 'bold'
  alignment?: 'left' | 'center' | 'right'
}
```

### Key Features
- **QR Code Generation:** Automatic QR encoding based on entity type
- **Custom Templates:** Design your own label layouts
- **Batch Printing:** Print 100s of labels at once
- **PDF Export:** Save labels as PDF for external printing

---

## 8. Suppliers

### Purpose
Manage supplier information, contacts, pricing, and performance metrics.

### Functionality

#### Supplier List View
- **Search/Filter:**
  - By name
  - By country
  - By rating (stars)
  - By status (active, inactive)
  - By materials supplied
- **Display Columns:**
  - Name
  - Country
  - # of materials supplied
  - Average lead time (days)
  - On-time delivery rate (%)
  - Rating (1-5 stars)
  - Actions (view, edit, deactivate)

#### Supplier Detail View
- **Company Information:**
  - Name
  - Address
  - Country
  - Phone, email, website
  - Registration number
  - Certifications (ISO, GMP, etc.)
- **Contacts:**
  - Sales rep (name, email, phone)
  - Technical support
  - Billing contact
- **Materials Supplied:**
  - List of raw materials
  - Price per material
  - Minimum order quantity (MOQ)
  - Lead time per material
- **Performance Metrics:**
  - # of POs placed
  - Total spend (lifetime)
  - Average lead time (days)
  - On-time delivery rate (%)
  - Quality issues count
  - Rating (calculated from deliveries)
- **Purchase History:**
  - List of all POs
  - Dates, amounts, statuses
- **Documents:**
  - Contracts (PDF)
  - Certificates (ISO, GMP, etc.)
  - Price lists

### Data Model
```typescript
Supplier {
  id: string
  name: string
  address?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  registrationNumber?: string
  certifications?: string[]
  
  // Contacts
  contacts: Contact[]
  
  // Performance
  rating: number (1-5, calculated)
  averageLeadTimeDays: number
  onTimeDeliveryRate: number (0-100)
  totalPurchaseOrders: number
  totalSpend: number
  qualityIssues: number
  
  // Status
  status: 'active' | 'inactive' | 'blocked'
  notes?: string
  createdAt: timestamp
  updatedAt: timestamp
}

Contact {
  name: string
  role: 'sales' | 'technical' | 'billing' | 'other'
  email?: string
  phone?: string
}
```

### Key Features
- **Performance Tracking:** Auto-calculate on-time delivery, quality
- **Price Comparison:** Compare prices across suppliers for same RM
- **Rating System:** Star rating based on delivery performance

---

## 9. Purchasing

### Purpose
Create and manage purchase orders for raw materials, track receipts, and maintain inventory levels.

### Functionality

#### Purchase Order List View
- **Search/Filter:**
  - By PO number
  - By supplier
  - By status (draft, sent, received, canceled)
  - By date range
- **Display Columns:**
  - PO number
  - Supplier name
  - # of items
  - Total amount
  - Currency
  - Status badge
  - Created date
  - Expected delivery date
  - Actions (view, edit, cancel, receive)
- **Quick Stats:**
  - Total POs (this month)
  - Pending deliveries count
  - Total spend (this month)
  - Average lead time

#### Purchase Order Detail View
- **Header:**
  - PO number (auto-generated)
  - Supplier name
  - Status
  - Created date/by
  - Expected delivery date
- **Line Items:**
  - Raw material name
  - Quantity ordered
  - Unit price
  - Line total
  - Received quantity (updates on receipt)
  - Status per line (pending, partial, received)
- **Totals:**
  - Subtotal
  - Tax (if applicable)
  - Shipping
  - Total
  - Currency
- **Delivery:**
  - Shipping method
  - Tracking number
  - Expected delivery date
  - Actual delivery date
- **Notes:**
  - Internal notes
  - Notes to supplier
- **Attachments:**
  - PO PDF
  - Supplier quote
  - Packing slips

#### Create Purchase Order Flow
```
Entry Points:
├─ From Purchasing list
├─ From low stock alert (dashboard)
└─ From RM detail (reorder button)

Create PO:
    ↓
Select supplier (dropdown)
    ↓
Add line items (one at a time):
    - Search/select raw material
    - Enter quantity needed
    - Enter unit price (pre-filled from last PO)
    - System calculates line total
    ↓
System shows:
    - Subtotal
    - Total (if no tax/shipping)
    ↓
Enter delivery details:
    - Expected delivery date
    - Shipping method
    - Notes to supplier
    ↓
Save as draft OR Send to supplier
    ↓
If "Send":
    - Generate PO PDF
    - Email to supplier
    - Change status to "sent"
    - Create audit log entry
    ↓
Navigate to PO detail
```

#### Receive Purchase Order Flow
```
PO list → Click PO with status "sent"
    ↓
PO detail → Click "Receive Items"
    ↓
Receive form shows all line items:
    ↓
For each line item:
    - Scan/check off item
    - Enter quantity received
    - Enter lot number
    - Enter expiry date
    - Note any damage/issues
    ↓
System validates:
    - Received qty ≤ ordered qty
    - All required fields filled
    ↓
Click "Complete Receipt"
    ↓
System updates:
    - PO status → "received" (if all items received)
    - PO status → "partial" (if some items pending)
    - Raw material stock quantities (add received)
    - Create inventory transactions
    - Update last received dates
    ↓
System clears low stock alerts (if qty now > min)
    ↓
Navigate back to PO detail (now shows received status)
```

### Data Model
```typescript
PurchaseOrder {
  id: string
  poNumber: string (unique, e.g., "PO-2025-001")
  supplierId: string
  status: 'draft' | 'sent' | 'partial' | 'received' | 'canceled'
  items: POItem[]
  
  // Amounts
  subtotal: number
  tax?: number
  shipping?: number
  total: number
  currency: string
  
  // Delivery
  shippingMethod?: string
  trackingNumber?: string
  expectedDeliveryDate?: timestamp
  actualDeliveryDate?: timestamp
  
  // Notes
  internalNotes?: string
  supplierNotes?: string
  
  // Audit
  createdAt: timestamp
  createdBy: string
  sentAt?: timestamp
  receivedAt?: timestamp
  updatedAt: timestamp
}

POItem {
  id: string
  rawMaterialId: string
  rawMaterialName: string (denormalized)
  quantityOrdered: number
  quantityReceived: number
  unit: string
  unitPrice: number
  lineTotal: number (quantityOrdered × unitPrice)
  status: 'pending' | 'partial' | 'received'
  
  // Receipt details (filled when received)
  lotNumber?: string
  expiryDate?: timestamp
  receivedAt?: timestamp
  receivedBy?: string
  notes?: string
}
```

### Key Features
- **Auto-Reorder:** Generate PO from low stock alerts
- **Partial Receipts:** Receive items as they arrive
- **Supplier Email:** Send PO PDF directly from system
- **Cost Tracking:** Track spend by supplier, by month

---

## 10. Requested Items

### Purpose
Internal request system where lab staff can request raw materials or supplies. Purchasing team reviews and converts to POs.

### Functionality

#### Requested Items List View
- **Search/Filter:**
  - By requested by (user)
  - By status (pending, approved, ordered, received, rejected)
  - By priority (urgent, high, normal, low)
  - By category
- **Display Columns:**
  - Item name
  - Requested by
  - Date requested
  - Quantity needed
  - Priority badge
  - Status badge
  - Actions (view, approve, order, reject)
- **Quick Stats:**
  - Pending requests count
  - Urgent requests count
  - Approved but not ordered count

#### Request Detail View
- **Request Information:**
  - Item name/description
  - Requested by
  - Date requested
  - Quantity needed
  - Unit
  - Priority (urgent, high, normal, low)
  - Reason/justification
- **Item Details:**
  - Category (raw material, lab supply, equipment, etc.)
  - Specifications
  - Preferred supplier (optional)
  - Estimated cost (optional)
- **Status:**
  - Current status
  - Reviewed by (if approved/rejected)
  - Review date
  - Review notes
  - PO number (if ordered)
  - Received date (if fulfilled)

#### Create Request Flow
```
Entry Points:
├─ From Requested Items list
├─ From dashboard (quick action)
└─ From RM detail (if out of stock)

Create Request:
    ↓
User fills form:
    - Item name/description
    - Quantity needed
    - Unit
    - Category (dropdown)
    - Priority (urgent, high, normal, low)
    - Reason (why do you need this?)
    - Preferred supplier (optional)
    ↓
Click "Submit Request"
    ↓
System creates Request record
    ↓
Notification sent to purchasing team
    ↓
Request shows in pending list
```

#### Review & Approve Flow
```
Purchasing team sees pending request
    ↓
Click to review request
    ↓
Evaluate:
    - Is this needed?
    - Is quantity reasonable?
    - Is priority justified?
    - Do we have budget?
    ↓
Decision:
    ├─ Approve:
    │   - Change status to "approved"
    │   - Add to shopping list
    │   - Notify requester
    │
    ├─ Reject:
    │   - Change status to "rejected"
    │   - Add rejection reason
    │   - Notify requester
    │
    └─ Request more info:
        - Comment on request
        - Status stays "pending"
        - Notify requester
```

#### Order Flow
```
Approved requests list → Select multiple items
    ↓
Click "Create PO from Selected"
    ↓
System groups by supplier (if known)
    ↓
Navigate to Create PO page (pre-filled with items)
    ↓
User adjusts quantities/prices if needed
    ↓
Send PO to supplier
    ↓
System updates requests:
    - Status → "ordered"
    - Links to PO number
    ↓
When PO is received:
    - Request status → "received"
    - Notify original requester
```

### Data Model
```typescript
RequestedItem {
  id: string
  itemName: string
  description?: string
  category: 'raw_material' | 'lab_supply' | 'equipment' | 'packaging' | 'other'
  
  // Request details
  quantityNeeded: number
  unit: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  reason: string (justification)
  
  // Optional
  preferredSupplierId?: string
  estimatedCost?: number
  specifications?: string
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'received'
  
  // Audit
  requestedBy: string
  requestedAt: timestamp
  reviewedBy?: string
  reviewedAt?: timestamp
  reviewNotes?: string
  poNumber?: string (if ordered)
  receivedAt?: timestamp
}
```

### Key Features
- **Request Tracking:** Full lifecycle from request to receipt
- **Priority Management:** Urgent requests highlighted
- **Batch Ordering:** Convert multiple requests to single PO
- **Notifications:** Email requester when status changes

---

## 11. Tasks

### Purpose
Task management system for lab operations, quality checks, maintenance, and follow-ups.

### Functionality

#### Task List View
- **Tabs:**
  - My Tasks (assigned to me)
  - All Tasks (system-wide)
  - Completed (archived)
- **Search/Filter:**
  - By assignee
  - By type (prep, test, maintenance, investigation, etc.)
  - By priority
  - By status
  - By due date range
- **Display:**
  - Checkbox (mark complete)
  - Task title
  - Type badge
  - Priority badge
  - Assignee avatar
  - Due date (red if overdue)
  - Actions (edit, complete, delete)

#### Task Detail View
- **Task Information:**
  - Title
  - Description
  - Type (dropdown: prep, test, maintenance, investigation, admin, other)
  - Priority (urgent, high, normal, low)
  - Status (pending, in_progress, completed, canceled)
- **Assignment:**
  - Assigned to (user dropdown)
  - Assigned by
  - Assigned date
- **Timing:**
  - Due date
  - Reminder (e.g., 1 day before)
  - Completed date (if done)
- **Links:**
  - Related prep session
  - Related sample
  - Related test
  - Related item (RM, FG, etc.)
- **Subtasks:**
  - Checklist of steps to complete
  - Each step can be checked off
- **Comments:**
  - Discussion thread
  - Updates, questions, clarifications

#### Create Task Flow
```
Entry Points:
├─ From Tasks list (manual)
├─ Auto-generated (test due, prep failed, equipment maintenance)
└─ From other pages (prep detail, sample detail)

Create Task:
    ↓
User fills:
    - Title (e.g., "Investigate pH test failure")
    - Description
    - Type (dropdown)
    - Priority
    - Assignee
    - Due date
    - Related links (optional)
    ↓
Add subtasks (optional):
    - List of steps to complete
    ↓
Click "Create Task"
    ↓
System:
    - Creates Task record
    - Sends notification to assignee
    - Adds to "My Tasks" for assignee
    ↓
Navigate to task detail
```

#### Complete Task Flow
```
My Tasks → Click task to complete
    ↓
Task detail opens
    ↓
User performs work:
    - Checks off subtasks
    - Adds comments/updates
    ↓
When done:
    - Click "Mark Complete"
    - Optionally add completion notes
    ↓
System:
    - Status → "completed"
    - Completed date → now
    - Sends notification to task creator
    - Moves to Completed tab
```

### Data Model
```typescript
Task {
  id: string
  title: string
  description?: string
  type: 'prep' | 'test' | 'maintenance' | 'investigation' | 'admin' | 'other'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'canceled'
  
  // Assignment
  assignedTo: string (user ID)
  assignedBy: string
  assignedAt: timestamp
  
  // Timing
  dueAt: timestamp
  reminderOffset?: number (ms before due)
  completedAt?: timestamp
  
  // Links
  preparationSessionId?: string
  sampleId?: string
  testScheduleId?: string
  relatedItemId?: string
  relatedItemType?: string
  
  // Subtasks
  subtasks?: Subtask[]
  
  // Comments (could be separate table)
  comments?: Comment[]
  
  // Audit
  createdAt: timestamp
  updatedAt: timestamp
}

Subtask {
  id: string
  text: string
  completed: boolean
  completedAt?: timestamp
}

Comment {
  id: string
  userId: string
  text: string
  createdAt: timestamp
}
```

### Key Features
- **Auto-Task Creation:** System creates tasks for test due dates, equipment maintenance
- **Reminders:** Email/notification before due date
- **Subtask Tracking:** Break large tasks into steps
- **Comments:** Discuss and collaborate on tasks

---

## 12. Analytics

### Purpose
Business intelligence dashboard with charts, trends, and insights from lab operations.

### Functionality

#### Overview Dashboard
- **Key Metrics (Cards):**
  - Total preparations (this month vs last month, % change)
  - Total samples created (this month vs last month)
  - Total tests completed (pass rate %)
  - Total cost (this month, raw materials)
  - Average prep time (minutes)
  - Error rate (out-of-tolerance preps, %)
- **Charts:**
  - Preparations per day (line chart, last 30 days)
  - Top 10 formulas (bar chart, by prep count)
  - Test results distribution (pie chart: pass/fail)
  - Cost trends (line chart, last 6 months)
  - Raw material consumption (bar chart, top 10)
  - Preparation time distribution (histogram)

#### Detailed Reports
- **Preparation Analytics:**
  - Average prep time by formula
  - Success rate by formula (% in tolerance)
  - Operator performance (avg time, error rate)
  - Time of day analysis (busiest hours)
- **Quality Analytics:**
  - Test pass/fail rates by test type
  - Test turnaround time (from schedule to result)
  - Sample rejection rate
  - Issue trends (which tests fail most often)
- **Inventory Analytics:**
  - Consumption rate by raw material
  - Projected depletion dates
  - Stock value over time
  - Reorder frequency
  - Supplier lead time trends
- **Cost Analytics:**
  - Cost per batch by formula
  - Cost trends over time
  - Most expensive raw materials
  - Cost savings opportunities (supplier comparison)

#### Export & Sharing
- **Export Options:**
  - Export charts as PNG
  - Export data as CSV/Excel
  - Generate PDF report
- **Scheduled Reports:**
  - Daily, weekly, monthly reports
  - Email to stakeholders
  - Auto-generated on specific dates

### Data Sources
```typescript
// All data comes from existing tables
AnalyticsData {
  preparations: PreparationSession[]
  steps: PreparationStep[]
  samples: Sample[]
  tests: TestSchedule[] + TestResult[]
  rawMaterials: RawMaterial[]
  inventoryTransactions: InventoryTransaction[]
  purchaseOrders: PurchaseOrder[]
}

// Aggregations computed in real-time
Metrics {
  totalPreparations: number
  avgPrepTime: number (ms)
  errorRate: number (0-1)
  testPassRate: number (0-1)
  totalCost: number
  // ... many more
}
```

### Key Features
- **Real-Time Data:** Charts update as new data is created
- **Interactive Charts:** Click to drill down
- **Date Range Selection:** View data for any time period
- **Comparison:** Compare this month vs last month, this year vs last year

---

## 13. Settings

### Purpose
System configuration for hardware, users, notifications, and preferences.

### Functionality

#### Settings Tabs
1. **Scale Settings**
2. **User Profile**
3. **Notifications**
4. **System Preferences**
5. **Data Management**

#### 1. Scale Settings Tab
- **Connection Mode:**
  - Radio buttons: Browser Serial API OR WebSocket Bridge
- **Browser Serial API Settings:**
  - Port selection (dropdown: COM1, COM2, COM3, etc.)
  - Baud rate (dropdown: 9600, 19200, 38400)
  - Connect/Disconnect button
  - Status indicator (green = connected, red = disconnected)
  - Test button (request reading)
  - Note: "Chrome/Edge only. Firefox/Safari not supported."
- **WebSocket Bridge Settings:**
  - Bridge URL (input: ws://127.0.0.1:8787)
  - Ping button (test connection)
  - Reconnect button
  - Auto-reconnect (checkbox)
  - Status indicator
  - Last packet timestamp
  - Note: "Run bridge: pnpm run scale:bridge:auto"
- **Scale Behavior:**
  - Auto-tare before each step (checkbox)
  - Stable weight detection (checkbox)
  - Stable weight threshold (input: 0.001g)
  - Stable duration (input: 3 seconds)
  - Polling interval (input: 500ms)
- **Warning Banner:**
  - Red alert if both Browser Serial AND WS Bridge are active
  - Message: "Both modes active! This will cause errors. Disconnect one."

#### 2. User Profile Tab
- **Personal Information:**
  - Name (input)
  - Email (input)
  - Role (display only: Admin, QC, Operator)
  - Department (input)
- **Password:**
  - Change password button
  - Old password, new password, confirm
- **Preferences:**
  - Default batch size (input: 100g)
  - Default unit (dropdown: g, kg, ml, L)
  - Language (dropdown: English, Spanish, French)
  - Theme (dropdown: Light, Dark, Auto)

#### 3. Notifications Tab
- **Email Notifications:**
  - Test due reminders (checkbox)
  - Low stock alerts (checkbox)
  - Prep completion (checkbox)
  - Task assignments (checkbox)
  - PO received (checkbox)
- **In-App Notifications:**
  - Same as email but for in-app toasts
- **Notification Timing:**
  - Test reminders: X days before due (input)
  - Low stock: when qty < X% of min stock (input)

#### 4. System Preferences Tab
- **Data Sync:**
  - Auto-sync to cloud (checkbox, if backend exists)
  - Sync interval (dropdown: every 5 min, 15 min, hourly)
  - Last sync timestamp
  - Manual sync button
- **Data Retention:**
  - Keep completed preps for X days (input: 365)
  - Keep test results for X days (input: 730)
  - Keep audit logs for X days (input: 1095)
- **Defaults:**
  - Default batch size (system-wide)
  - Default tolerance (% of target)

#### 5. Data Management Tab
- **Export Data:**
  - Export all data as JSON (button)
  - Export specific tables (checkboxes + button)
  - Date range selection
- **Import Data:**
  - Import from JSON (file upload)
  - Import from CSV (file upload, with field mapping)
- **Backup:**
  - Create backup (button) → downloads .zip
  - Restore from backup (file upload)
  - Auto-backup schedule (checkbox + frequency)
- **Danger Zone:**
  - Clear all preparation data (button, requires confirmation)
  - Clear all test data (button, requires confirmation)
  - Factory reset (button, requires admin password)

### Key Features
- **Dual Scale Modes:** Supports both browser-native and bridge connections
- **Connection Testing:** Ping/test buttons for diagnostics
- **Data Portability:** Export/import for backup or migration
- **Safety:** Confirmation dialogs for destructive actions

---

## Scale Integration (Detailed)

### Overview
The system integrates with precision scales (primarily A&D JA5003) to enable real-time weight capture during preparations. Two connection modes are supported:

1. **Browser Serial API** (Chrome/Edge only, direct USB)
2. **WebSocket Bridge** (Recommended, cross-browser, Node.js server)

---

### Connection Mode 1: Browser Serial API

#### Architecture
```
Scale (RS-232 via USB) ←→ Browser (Web Serial API) ←→ React App
```

#### Setup
1. User connects scale to computer via USB (RS-232 adapter)
2. User opens Settings → Scale Settings
3. User selects "Browser Serial API" mode
4. User clicks "Connect" button
5. Browser shows port selection dialog (native OS dialog)
6. User selects correct COM port (e.g., COM3)
7. Browser opens serial port at 9600 baud
8. Connection established

#### Reading Weights
```typescript
// In React component
const { connected, reading } = useScale();

// `reading` updates every 500ms:
{
  value: 0.123,      // grams
  unit: 'g',
  stable: true,      // ST = stable, US = unstable
  raw: 'ST,+000.123 g'
}

// Display in UI:
<div className="text-2xl font-bold">
  {reading ? `${reading.value.toFixed(3)} ${reading.unit}` : '---'}
</div>
```

#### Commands
```typescript
// Send command to scale
port.write('P\r\n');  // Print (request current weight)
port.write('T\r\n');  // Tare (zero the scale)
port.write('SI\r\n'); // Send continuously (streaming mode)
port.write('S\r\n');  // Stop continuous mode
```

#### Limitations
- **Browser support:** Chrome/Edge only (Firefox, Safari don't support Web Serial API)
- **User interaction required:** Browser shows permission dialog on each connect
- **Single tab:** Only one tab can connect to port at a time

---

### Connection Mode 2: WebSocket Bridge (Recommended)

#### Architecture
```
Scale (RS-232 via USB) ←→ Node.js Bridge (SerialPort + WebSocket) ←→ Browser (WebSocket Client) ←→ React App
```

#### Bridge Server

**Location:** `scripts/ja5003_ws_bridge.js`

**Setup:**
```bash
# Install dependencies
npm install serialport ws

# Run bridge
node scripts/ja5003_ws_bridge.js

# Or use helper scripts
pnpm run scale:bridge:auto    # Auto-detect port
pnpm run scale:bridge:soft    # Soft mode (on-demand polling)
pnpm run scale:bridge:cont    # Continuous mode (streaming)

# Or combined with dev server
pnpm run dev:with-bridge
```

**Configuration (Environment Variables):**
```bash
JA_PORT=COM3              # Serial port (or "AUTO" to probe)
JA_BAUD=9600              # Baud rate
JA_WS_PORT=8787           # WebSocket port
JA_WS_HOST=127.0.0.1      # WebSocket host
JA_CONTINUOUS=0           # 0=polling, 1=continuous streaming
JA_POLL_CMDS=P            # Commands to poll (P, SI, S)
JA_SI_MS=500              # Polling interval (ms)
JA_FORCE_OPEN=1           # Force open port (even if already open)
```

**Key Features:**
- **Auto-port detection:** Tries common ports, prefers non-system ports
- **Single instance:** Lock file prevents duplicate bridges
- **Auto-port increment:** If 8787 in use, tries 8788, 8789, etc.
- **Health monitoring:** Warns if no data received in 10s
- **Ping/pong:** WS heartbeat every 15s, disconnects dead clients
- **Auto-reconnect:** Clients auto-reconnect on disconnect

**Running as Windows Service:**
```powershell
# Install NSSM (Non-Sucking Service Manager)
choco install nssm

# Install service
nssm install JA5003Bridge "C:\Program Files\nodejs\node.exe" "C:\path\to\scripts\ja5003_ws_bridge.js"
nssm set JA5003Bridge AppDirectory "C:\path\to\project"
nssm set JA5003Bridge AppEnvironmentExtra JA_PORT=COM3 JA_BAUD=9600
nssm start JA5003Bridge

# Service now runs on boot
```

#### Client (React Hook)

**Location:** `src/lib/scale/useScale.ts`

```typescript
export function useScale() {
  const [connected, setConnected] = useState(false);
  const [reading, setReading] = useState<ScaleReading | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8787');

    ws.onopen = () => {
      console.log('[scale] connected');
      setConnected(true);
      ws.send('P'); // Start polling
    };

    ws.onmessage = (event) => {
      const line = event.data;
      // Parse: "ST,+000.123 g"
      const parsed = parseScalePacket(line);
      setReading(parsed);
    };

    ws.onclose = () => {
      console.log('[scale] disconnected');
      setConnected(false);
      // Auto-reconnect after 5s
      setTimeout(() => {
        // useEffect will re-run and reconnect
      }, 5000);
    };

    return () => ws.close();
  }, []);

  return { connected, reading };
}
```

**Benefits:**
- **Cross-browser:** Works in all browsers (Firefox, Safari, etc.)
- **No permissions:** No browser dialog, automatic connection
- **Multi-tab:** Multiple tabs can connect simultaneously
- **Background:** Bridge runs in background, always available
- **Resilient:** Auto-reconnect, health monitoring

---

### Scale Data Protocol

#### Packet Format
```
ST,+000.123 g\r\n

Parts:
  ST      = Status (ST=stable, US=unstable, OL=overload, etc.)
  +000.123 = Value (signed, 6 digits, 3 decimals)
  g       = Unit (g, kg, oz, lb)
  \r\n    = Line ending (carriage return + line feed)
```

#### Parsing
```typescript
function parseScalePacket(line: string): ScaleReading | null {
  // Example: "ST,+000.123 g"
  const match = line.match(/(ST|US|OL),([+-]\d+\.\d+)\s*(\w+)/);
  if (!match) return null;

  return {
    status: match[1],           // "ST"
    value: parseFloat(match[2]), // 0.123
    unit: match[3],             // "g"
    stable: match[1] === 'ST',  // true
    raw: line                   // original packet
  };
}
```

#### Status Codes
- `ST` - Stable (ready to capture)
- `US` - Unstable (weight changing)
- `OL` - Overload (exceeds max capacity)
- `UN` - Underload (negative weight, need tare)
- `QT` - OK (command executed successfully)
- `EC` - Error (command failed)

---

### Preparation Workflow with Scale

#### Step-by-Step Integration

**Context:** User is on Step 3 of a preparation (adding Glycerin).

```
1. Page loads, useScale() hook establishes connection
   ↓
   Scale status badge: 🟢 Connected, 0.123g

2. Display shows:
   ┌─────────────────────────────────────┐
   │ Step 3 of 8: Glycerin               │
   │ Target: 45.00g ± 0.11g              │
   │                                     │
   │ Current Weight:                     │
   │   0.123 g                           │ ← Updates every 500ms
   │   [████░░░░░░] 0.3%                 │
   │                                     │
   │ [Tare Scale]                        │
   └─────────────────────────────────────┘

3. User places container on scale
   ↓
   Current Weight updates: 145.234 g (container)

4. User clicks [Tare Scale]
   ↓
   Send 'T' command to scale
   ↓
   Wait for QT response
   ↓
   Current Weight: 0.000 g ✓

5. User pours Glycerin into container
   ↓
   Current Weight updates in real-time:
     10.234 g  (too low, orange indicator)
     35.678 g  (still low, orange)
     43.950 g  (close, yellow)
     44.998 g  (IN RANGE! green ✓)
     45.012 g  (still in range, green ✓)
     45.100 g  (in range, green ✓)
     45.150 g  (OVER! red ✗)

6. User stops pouring at 45.012g (in range)
   ↓
   System checks for stable reading:
     - Same value for 3 seconds?
     - Status = ST (stable)?
   ↓
   If stable for 3s:
     - Auto-advance to next step
     - Record capturedQtyG = 45.012
     - Log audit event

7. Next step loads (Step 4)
   ↓
   Repeat process for remaining ingredients
```

#### Visual Indicators

```typescript
function getWeightIndicator(current: number, target: number, tolerance: number) {
  const diff = Math.abs(current - target);
  
  if (current < target - tolerance) {
    return { color: 'orange', message: 'Add more', icon: '↑' };
  }
  if (current > target + tolerance) {
    return { color: 'red', message: '! Over tolerance', icon: '⚠' };
  }
  // In range
  return { color: 'green', message: '✓ OK', icon: '✓' };
}
```

#### Auto-Advance Logic

```typescript
function checkAutoAdvance(
  currentWeight: number,
  targetWeight: number,
  tolerance: number,
  stable: boolean,
  stableDuration: number // ms
): boolean {
  // Must be in range
  const inRange = Math.abs(currentWeight - targetWeight) <= tolerance;
  if (!inRange) return false;

  // Must be stable
  if (!stable) return false;

  // Must be stable for at least 3 seconds
  if (stableDuration < 3000) return false;

  return true; // All conditions met, advance!
}
```

---

### Scale Settings & Configuration

#### Settings UI

**Location:** `src/pages/Settings.tsx` → Scale Settings tab

**Fields:**

1. **Connection Mode** (radio buttons)
   - ◉ Browser Serial API
   - ○ WebSocket Bridge

2. **Browser Serial API Section** (shown if mode = Browser Serial)
   - Port: [Dropdown: COM1, COM2, COM3, ...]
   - Baud Rate: [Dropdown: 9600, 19200, 38400, ...]
   - [Connect] [Disconnect] buttons
   - Status: 🟢 Connected to COM3 at 9600 baud
   - [Test Connection] button → sends 'P' command, shows result
   - Note: "Chrome/Edge only. Firefox/Safari not supported."

3. **WebSocket Bridge Section** (shown if mode = Bridge)
   - Bridge URL: [Input: ws://127.0.0.1:8787]
   - [Ping] [Reconnect] buttons
   - Status: 🟢 Connected, last packet 2s ago
   - Auto-reconnect: [x] (checkbox)
   - Note: "Run bridge: pnpm run scale:bridge:auto"

4. **Scale Behavior** (common settings)
   - [x] Auto-tare before each step
   - [x] Stable weight detection
   - Stable threshold: [Input: 0.001] g
   - Stable duration: [Input: 3] seconds
   - Polling interval: [Input: 500] ms

5. **Warning Banner** (shown if BOTH modes active)
   - 🔴 Both Browser Serial AND WebSocket Bridge are active!
   - This will cause conflicts. Disconnect one mode.

---

### Diagnostics & Troubleshooting

#### Diagnostics Page

**Location:** `src/pages/Diagnostics.tsx` (route: `/__diag`)

**Display:**

```
System Diagnostics

Network: ✓ Online
Database (Dexie): ✓ Connected (nbs-lims, v2)
localStorage: ✓ Available

Scale WS Bridge:
  Status: 🟢 Connected
  Bridge URL: ws://127.0.0.1:8787
  Last packet: 2s ago
  Last message: "ST,+000.123 g"
  
  [Reconnect] button
  
  Note: If disconnected, run: pnpm run bridge:start
```

#### Common Issues & Solutions

**Issue 1: "Bridge disconnected"**
- Check if bridge is running: `tasklist | findstr node`
- Start bridge: `pnpm run bridge:start`
- Check port not in use: `netstat -ano | findstr 8787`

**Issue 2: "Port COM3 not found"**
- Check Device Manager → Ports (COM & LPT)
- Verify scale is connected via USB
- Try different USB port
- Update USB-to-serial driver

**Issue 3: "Readings show 0.000g always"**
- Check scale is powered on
- Send test command: 'P' → should return weight
- Check baud rate matches scale (usually 9600)
- Check cable is connected to scale's RS-232 port

**Issue 4: "EADDRINUSE: port 8787 already in use"**
- Kill existing bridge: `taskkill /IM node.exe /F`
- Or change port: `JA_WS_PORT=8790 pnpm run bridge:start`
- Bridge auto-increments if 8787 busy (tries 8788, 8789, etc.)

**Issue 5: "Permission denied accessing serial port"**
- (Linux/Mac) Add user to dialout group: `sudo usermod -a -G dialout $USER`
- (Windows) Run as Administrator (not recommended, fix USB driver instead)

---

## Summary

This document covers:
- ✅ All 14 navigation sections with detailed functionality
- ✅ Complete workflows for each section
- ✅ Data models for all entities
- ✅ Scale integration (both connection modes)
- ✅ Step-by-step preparation with real-time weighing
- ✅ Settings configuration
- ✅ Diagnostics and troubleshooting

Each section is designed to work together in a cohesive lab management system, with the preparation workflow and scale integration being the core features that tie everything together.

