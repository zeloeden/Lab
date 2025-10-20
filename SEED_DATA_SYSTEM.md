# 🌱 Seed Data System - Comprehensive Testing Data

## Overview

A complete seed data system that fills the entire NBS LIMS application with realistic test data for development, testing, and demonstration purposes.

## How to Use

### Access the Seed Feature

1. Navigate to **Settings** (gear icon in navigation)
2. Click on the **Developer** tab
3. You'll see the "Test Data Management" card with two buttons:
   - **Seed Test Data** - Populate the system
   - **Clear All Data** - Remove everything

### Seeding Data

1. Click **"Seed Test Data"** button
2. Confirm the action in the dialog
3. Wait for the seeding process (takes 2-5 seconds)
4. Page will automatically reload
5. All modules are now populated with test data!

### Clearing Data

1. Click **"Clear All Data"** button
2. Confirm the destructive action
3. All data will be removed from localStorage and IndexedDB
4. Page will automatically reload
5. System is reset to empty state

## What Gets Seeded

### 📦 Samples (32 items)
- **Names:** English and Arabic fragrance names (Lavender Dream / حلم اللافندر)
- **Suppliers:** Randomly assigned from seeded suppliers
- **Customers:** Randomly assigned from seeded customers
- **Customer Sample Numbers:** Format: `CUST-00001`, `PPD-00002`, etc.
- **Patch Numbers:** Format: `PATCH-2025-001`
- **Storage:** Rack numbers (A1-A10) with positions
- **Pricing:** Base price + 7 scaling tiers (25, 50, 100, 200, 250, 500, 1000)
- **QR Codes & Barcodes:** Auto-generated
- **Ledger Data:** Main brand, related names, DPG%, priority, concepts, ingredients
- **Shipment Info:** Carrier, AWB, origin country
- **Status:** Mix of Tested, Untested, In Progress
- **Dates:** Random dates within last 60 days

### 🧪 Raw Materials (24 items)
- Essential chemicals: Ethanol, DPG, IPM, Benzyl Alcohol, etc.
- Aroma chemicals: Linalool, Limonene, Vanillin, Iso E Super, etc.
- Full pricing with scaling tiers
- QR codes in format: `RM:{id}`
- Supplier assignments
- Storage locations
- Status: All marked as "Tested" and "Approved"

### 🏢 Suppliers (8 items)
```
1. Givaudan (GIV) - Switzerland
2. Firmenich (FIR) - Switzerland  
3. IFF (IFF) - USA
4. Symrise (SYM) - Germany
5. Mane (MAN) - France
6. Takasago (TAK) - Japan
7. Robertet (ROB) - France
8. Sensient (SEN) - USA
```
Each with:
- Contact info (email, phone, contact person)
- Address (street, city, country)
- Scaling enabled
- Notes about their specialty

### 👥 Customers (6 items)
```
1. Perfume Palace Dubai (PPD) - UAE
2. Scent & Co London (SCL) - UK
3. Aroma Traders NYC (ATN) - USA
4. Fragrance House Paris (FHP) - France
5. Oriental Perfumes Riyadh (OPR) - Saudi Arabia
6. Singapore Scent Hub (SSH) - Singapore
```
Each with:
- Email, phone
- Address
- Customer code
- Country

### 🧪 Formulas (5 items)
```
1. NBS001 - Summer Breeze Formula (EDP)
2. NBS002 - Winter Musk Formula (EDT)
3. NBS003 - Oriental Night Formula (Perfume Oil)
4. NBS004 - Fresh Citrus Formula (Body Spray)
5. NBS005 - Floral Garden Formula (EDP)
```
Each with:
- 3-8 ingredients from raw materials
- Percentages for each ingredient
- Purpose/type
- Version control
- Status (draft/active/archived)

### 🔬 Tests (15 items)
- Test types: Stability, pH Level, Viscosity, Color Analysis, Fragrance Intensity
- Statuses: Mix of completed, in-progress, pending
- Assigned to: Lab Tech 1, Lab Tech 2, Lab Tech 3
- Results (for completed): Pass/fail with measurements
- Linked to samples

### 📋 Tasks (8 items)
```
1. Review new sample submissions (High, In Progress)
2. Complete stability tests for Batch 034 (High, Pending)
3. Update formula NBS001 (Medium, Pending)
4. Prepare quarterly inventory report (Medium, In Progress)
5. Order new lab equipment (Low, Pending)
6. Train new staff on QR scanning (Low, Completed)
7. Review customer feedback (Medium, Pending)
8. Update storage rack labels (Low, Completed)
```

### 🛒 Purchase Orders (5 items)
- PO numbers: Format `PO-2025-0001`
- Linked to suppliers
- Multiple line items per order
- Quantities and pricing
- Status: pending, approved, shipped, delivered
- Delivery dates
- Total amounts in USD

### 🏛️ Companies (3 items)
```
1. NBS Laboratory (NBS)
2. Scent Innovations (SI)
3. Aroma Tech (AT)
```

## Data Characteristics

### Realistic Values
- **Dates:** Random dates within realistic ranges (last 30-180 days)
- **Prices:** Range from $15-$500 based on item type
- **Codes:** Follow proper formatting (GIV001003, SAM00001, etc.)
- **Status:** Mix of states (not all completed/approved)

### Proper Relationships
- Samples → Suppliers (proper foreign keys)
- Samples → Customers (proper foreign keys)
- Formulas → Raw Materials (ingredient references)
- Tests → Samples (sample references)
- POs → Suppliers (supplier references)

### Complete Data
- Every required field is filled
- Arabic names for all samples
- QR codes and barcodes generated
- Storage locations assigned
- Pricing tiers configured

## Technical Details

### Storage Locations
- **IndexedDB (Dexie):**
  - `samples` table (10 samples)
  - `formulas` table (5 formulas)
  - `tests` table (15 tests)
  - `sessions` table (preserved)

- **localStorage:**
  - `nbslims_enhanced_samples` (all 32 samples)
  - `nbslims_raw_materials` (24 materials)
  - `nbslims_suppliers` (8 suppliers)
  - `nbslims_customers` (6 customers)
  - `nbslims_companies` (3 companies)
  - `nbslims_tasks` (8 tasks)
  - `nbslims_purchase_orders` (5 POs)

### Seed Service API

```typescript
import { seedService } from '@/services/seedService';

// Seed all data
const result = await seedService.seedAll();
// Returns: { success: boolean, message: string }

// Clear all data
const result = await seedService.clearAll();
// Returns: { success: boolean, message: string }

// Individual seed methods (called by seedAll):
await seedService.seedCompanies();
await seedService.seedSuppliers();
await seedService.seedCustomers();
await seedService.seedRawMaterials();
await seedService.seedSamples();
await seedService.seedFormulas();
await seedService.seedTests();
await seedService.seedTasks();
await seedService.seedPurchaseOrders();
```

### UI Component

```typescript
import { SeedDataButton } from '@/components/SeedDataButton';

// Use in any page:
<SeedDataButton />
```

## Use Cases

### Development
- Quickly populate a fresh install
- Test features with realistic data
- Develop without manual data entry

### Testing
- Verify search/filter functionality
- Test pagination and sorting
- Validate data relationships
- Check performance with data volume

### Demonstrations
- Show off features to clients
- Train new users
- Create screenshots/videos
- Present at meetings

### QA
- Reproduce bugs with consistent data
- Test edge cases
- Verify data integrity
- Performance testing

## Safety Features

### Confirmations
- Both seed and clear require dialog confirmation
- Clear action uses destructive styling (red)
- Warning icons and messages

### Auto-reload
- Page automatically reloads after seeding
- Ensures all components see new data
- Prevents stale state issues

### Visual Feedback
- Loading spinners during operations
- Toast notifications on success/error
- Clear status messages

## Best Practices

### When to Seed
- ✅ Fresh development environment
- ✅ Before testing a new feature
- ✅ When demonstrating to clients
- ✅ After clearing data

### When to Clear
- ✅ Before re-seeding (start fresh)
- ✅ When resetting test environment
- ✅ Before production deployment
- ⚠️ **NEVER in production!**

### Development Workflow
1. Clear all data
2. Seed test data
3. Test your feature
4. Make changes to seed data if needed
5. Re-clear and re-seed
6. Verify everything works

## Customization

To add more seed data or modify existing data, edit:
- **`src/services/seedService.ts`**

To add new entity types:
1. Add seed method to `seedService`
2. Call it from `seedAll()`
3. Add clear logic to `clearAll()`
4. Update documentation in `SeedDataButton.tsx`

## Warning ⚠️

This feature is for **development and testing only**. Never use in production:
- It overwrites existing data
- Clear operation is permanent
- No backup/restore functionality
- Not meant for real customer data

## Future Enhancements

Potential improvements:
- [ ] Export seed data to JSON
- [ ] Import custom seed data
- [ ] Partial seeding (select modules)
- [ ] Seed data versioning
- [ ] Configurable quantities
- [ ] Custom data templates
- [ ] Preserve specific data during clear

---

**Created:** October 2025  
**Status:** Production Ready  
**Location:** Settings > Developer Tab

