# Product Requirements Document: Lab Management System (NBS LIMS)

## Document Information

**Product Name:** NBS Lab Information Management System (LIMS)  
**Version:** 2.0  
**Last Updated:** 2025-01-18  
**Document Type:** Product Requirements Document  
**Target Audience:** AI Agents, Developers, Product Teams  

---

## Executive Summary

NBS LIMS is a **digital lab management system** for cosmetics/chemical manufacturing that enables:
- Formula management and versioning
- Guided preparation workflows with barcode scanning
- Real-time scale integration for precise weighing
- Quality control testing and sample tracking
- Raw material inventory and purchasing
- Regulatory compliance and audit trails

**Key Innovation:** Seamless barcode-driven workflows with real-time hardware integration (scales, scanners).

---

## Table of Contents

1. [Product Vision & Goals](#1-product-vision--goals)
2. [User Personas](#2-user-personas)
3. [Core Features](#3-core-features)
4. [User Flows](#4-user-flows)
5. [Data Models](#5-data-models)
6. [Technical Architecture](#6-technical-architecture)
7. [Integration Requirements](#7-integration-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Success Metrics](#9-success-metrics)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. Product Vision & Goals

### Vision Statement
"Enable cosmetics manufacturers to achieve 100% traceability and compliance while reducing preparation errors by 90% through intuitive, barcode-driven workflows."

### Business Goals
1. **Reduce errors:** Cut weighing errors from ~15% to <1%
2. **Increase throughput:** 3× faster preparation times
3. **Ensure compliance:** 100% audit trail for GMP/ISO standards
4. **Minimize waste:** Real-time tolerance checking prevents over-dispensing

### User Goals
1. **Lab Technicians:** Complete preparations faster with fewer mistakes
2. **Quality Managers:** Track all batches from raw materials to finished goods
3. **Purchasing:** Maintain optimal inventory levels, prevent stockouts
4. **Regulators:** Access complete batch records for audits

---

## 2. User Personas

### Persona 1: Lab Technician (Primary User)
**Name:** Maria  
**Age:** 28  
**Role:** Production Technician  
**Goals:**
- Complete 20+ preparations per day accurately
- Follow SOPs without manual calculations
- Scan barcodes instead of typing codes

**Pain Points:**
- Paper SOPs are slow and error-prone
- Manual calculations cause mistakes
- Hard to find which formula to prepare next

**Tech Proficiency:** Medium (comfortable with tablets, barcode scanners)

---

### Persona 2: Quality Manager
**Name:** James  
**Age:** 42  
**Role:** QC Manager  
**Goals:**
- Schedule tests for all batches
- Track test results and failures
- Generate compliance reports

**Pain Points:**
- Difficult to track which batches need testing
- Hard to correlate failures to raw material lots
- Manual report generation takes hours

**Tech Proficiency:** High

---

### Persona 3: Purchasing Officer
**Name:** Sarah  
**Age:** 35  
**Role:** Procurement Specialist  
**Goals:**
- Maintain 2-week inventory buffer
- Track costs per batch
- Find best suppliers

**Pain Points:**
- Doesn't know when to reorder until stockout
- Can't compare supplier prices easily
- No visibility into consumption trends

**Tech Proficiency:** Medium

---

## 3. Core Features

### 3.1 Formula Management

#### Feature: Formula Library
**Description:** Central repository of all product formulas with versioning.

**User Stories:**
```
As a lab technician,
I want to search formulas by code or name,
So that I can quickly find the formula I need to prepare.

As a formulation chemist,
I want to create new formula versions,
So that I can iterate on recipes without losing history.

As a quality manager,
I want to see which formula version was used in each batch,
So that I can investigate quality issues.
```

**Acceptance Criteria:**
- [ ] User can create formula with name, code, ingredients, and percentages
- [ ] User can search by formula code, name, or barcode
- [ ] User can view formula history (versions)
- [ ] User can mark formula as active/inactive
- [ ] System validates that percentages sum to 100%
- [ ] User can attach documents (SDS, spec sheets) to formula

**Data Fields:**
```typescript
Formula {
  id: string (UUID)
  code: string (unique, e.g., "PRM00936")
  internalCode?: string (legacy codes)
  name: string (e.g., "Premium Moisturizer Base")
  status: 'active' | 'inactive' | 'archived'
  version: number
  category?: string (e.g., "Base", "Actives")
  targetBatchSize: number (default amount)
  targetBatchUnit: 'g' | 'kg' | 'ml' | 'L'
  ingredients: Ingredient[]
  notes?: string
  createdAt: timestamp
  updatedAt: timestamp
  createdBy: User
}

Ingredient {
  id: string
  ingredientId: string (reference to raw material)
  ingredientName: string
  percentage: number (0-100)
  fraction: number (0-1, calculated from percentage)
  order: number (display order)
  notes?: string
}
```

**UI Mockup Reference:**
- List view: Searchable table with code, name, status, last used
- Detail view: Formula header + ingredient table + actions
- Edit mode: Inline editing with auto-save

---

### 3.2 Preparation Workflow

#### Feature: Guided Preparation
**Description:** Step-by-step workflow for preparing batches with real-time scale integration.

**User Stories:**
```
As a lab technician,
I want to scan a formula barcode and start preparation,
So that I don't have to manually find and open the formula.

As a lab technician,
I want the system to tell me how much of each ingredient to add,
So that I don't have to calculate amounts.

As a lab technician,
I want to see real-time weight from the scale,
So that I know when to stop adding ingredient.

As a quality manager,
I want to see if the technician went outside tolerance,
So that I can flag batches for review.
```

**Acceptance Criteria:**
- [ ] User can scan formula QR code to start preparation
- [ ] System prompts for batch size (amount + unit)
- [ ] System calculates target weights for all ingredients
- [ ] System displays current step with target weight ± tolerance
- [ ] System shows real-time scale reading
- [ ] System validates captured weight is within tolerance
- [ ] System auto-advances to next step when validated
- [ ] System allows "Tare" action between steps
- [ ] System records all weighing events with timestamps
- [ ] User can pause/resume preparation
- [ ] User can mark preparation as complete
- [ ] System prevents editing completed preparations

**Workflow States:**
```
not_started → in_progress → completed
                ↓
              paused → resumed → in_progress
                ↓
              failed (optional, with reason)
```

**Data Fields:**
```typescript
PreparationSession {
  id: string (UUID)
  formulaId: string
  formulaCode: string (denormalized for fast lookup)
  formulaVersionId?: string
  attemptNo: number (1, 2, 3... for retries)
  status: 'in_progress' | 'completed' | 'failed' | 'locked_failed' | 'server_rejected'
  operator: string (user name)
  startedAt: timestamp
  endedAt?: timestamp
  targetAmount: number (e.g., 250)
  targetUnit: 'g' | 'kg' | 'ml' | 'L'
}

PreparationStep {
  id: string
  sessionId: string
  sequence: number (1, 2, 3...)
  ingredientId: string
  requiredCodeValue: string (barcode to scan)
  altCodeValues?: string[] (alternate barcodes)
  targetQtyG: number (calculated from formula + batch size)
  toleranceAbsG: number (e.g., ±0.5g)
  capturedQtyG?: number (actual weighed amount)
  isStable?: boolean (was scale reading stable?)
  status: 'pending' | 'ok' | 'failed'
  failureReason?: string
  capturedAt?: timestamp
  lotId?: string (if lot tracking enabled)
}

AuditEvent {
  id: number (auto-increment)
  sessionId: string
  ts: timestamp
  user: string
  action: 'SESSION_START' | 'STEP_COMPLETE' | 'TARE' | 'SESSION_COMPLETE' | 'SESSION_ABORT'
  payload: any (action-specific data)
}
```

**UI Flow:**
1. **Start Screen:** Scan formula QR or search
2. **Size Dialog:** Enter batch size (default from formula)
3. **Guided Steps:** For each ingredient:
   - Show ingredient name + barcode
   - Show target weight + tolerance
   - Show real-time scale reading (updates every 500ms)
   - Validate and auto-advance
4. **Complete Screen:** Summary + option to create sample

---

### 3.3 QR Code System

#### Feature: Universal QR Decoding
**Description:** Scan any QR code (formula, sample, prep, raw material) and navigate to the correct page.

**Supported QR Formats:**
```
Formula:
  F=PRM00936
  F:PRM00936
  FORMULA:PRM00936
  http://app.com/formulas/PRM00936

Sample:
  S=GIV001003
  S:GIV001003
  SAMPLE:GIV001003
  http://app.com/samples/GIV001003

Preparation:
  P=abc-123-def
  PREP:abc-123-def
  http://app.com/preparations/abc-123-def

Composite (multiple tokens):
  F=PRM00936;S=GIV001003
  (routes to formula with sample context)
```

**Routing Logic:**
```typescript
decodeQR(raw: string) → QR {
  if (matches formula pattern) → type: 'formula'
  if (matches sample pattern) → type: 'sample'
  if (matches prep pattern) → type: 'prep'
  if (UUID-like) → type: 'prep' (assume preparation)
  else → type: 'sample' (fallback)
}

handleScanNavigation(qr: QR) {
  if (qr.type === 'formula') → /formula-first?code=X&auto=start
  if (qr.type === 'sample') → /samples?search=X
  if (qr.type === 'prep') → /preparations/:id
}
```

**Smart Routing (Start or Resume):**
```typescript
startOrResumeForFormula(formula) {
  last = getLastSessionByFormulaCode(formula.code)
  
  if (!last) → create new → mode: 'prep'
  if (last.status === 'in_progress') → resume → mode: 'prep'
  if (last.status === 'completed') → mode: 'resume-test'
  
  if (mode === 'prep') → navigate(/preparations/:id?modal=size&auto=1)
  if (mode === 'resume-test') → navigate(/tests/management?sessionId=:id)
}
```

---

### 3.4 Sample Management

#### Feature: Sample Tracking
**Description:** Track samples from creation through testing to disposal.

**User Stories:**
```
As a lab technician,
I want to create a sample from a completed preparation,
So that I can send it to QC for testing.

As a quality manager,
I want to see all samples pending testing,
So that I can prioritize my workload.

As a quality manager,
I want to record test results against a sample,
So that I have a permanent record.
```

**Sample Lifecycle:**
```
created → pending_test → tested → approved/rejected → archived
```

**Data Fields:**
```typescript
Sample {
  id: string
  sampleCode: string (unique, e.g., "GIV001003")
  name?: string
  source: 'preparation' | 'supplier' | 'complaint' | 'stability'
  preparationSessionId?: string (if from prep)
  formulaId?: string
  status: 'active' | 'tested' | 'discarded'
  createdAt: timestamp
  createdBy: string
  location?: string (fridge, shelf, etc.)
  expiryDate?: timestamp
  notes?: string
  materialTrace?: MaterialTrace[] (cost calculation)
  costTotal?: number
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

---

### 3.5 Test Management

#### Feature: Test Scheduling & Results
**Description:** Schedule tests for samples and record results.

**User Stories:**
```
As a quality manager,
I want to schedule tests for a sample,
So that I don't forget to test it.

As a lab technician,
I want to see which tests are due today,
So that I can prioritize my work.

As a quality manager,
I want to record test results (pass/fail),
So that I can approve or reject batches.
```

**Data Fields:**
```typescript
TestSchedule {
  id: string
  type: 'formula' | 'personal' (formula = automated, personal = manual)
  linkId: string (sampleId or preparationSessionId)
  startAt: timestamp (when to start testing)
  dueAt: timestamp (deadline)
  remindOffsets: number[] (e.g., [-86400000] = 1 day before)
  status: 'scheduled' | 'done' | 'canceled'
}

TestResult {
  id: string
  testScheduleId: string
  sampleId: string
  testName: string (e.g., "pH Test", "Viscosity")
  result: 'pass' | 'fail' | 'pending'
  value?: any (measured value)
  expectedRange?: string (e.g., "5.5-6.5")
  notes?: string
  testedAt: timestamp
  testedBy: string
}
```

---

### 3.6 Raw Material Management

#### Feature: Inventory Tracking
**Description:** Track raw material inventory, suppliers, and pricing.

**User Stories:**
```
As a purchasing officer,
I want to see which raw materials are low in stock,
So that I can reorder before we run out.

As a purchasing officer,
I want to compare prices from different suppliers,
So that I can get the best deal.

As a lab technician,
I want to see the supplier and lot number for each raw material,
So that I can trace issues back to the source.
```

**Data Fields:**
```typescript
RawMaterial {
  id: string
  code: string (unique, e.g., "RM-001")
  name: string (e.g., "Glycerin USP")
  casNumber?: string
  supplier?: string
  supplierCode?: string
  price?: number (cost per kg)
  unit?: 'kg' | 'L'
  stockQty?: number
  minStockQty?: number (reorder threshold)
  location?: string (warehouse location)
  sdsUrl?: string (Safety Data Sheet)
  notes?: string
}

PurchaseOrder {
  id: string
  supplierId: string
  status: 'draft' | 'sent' | 'received' | 'canceled'
  items: POItem[]
  totalCost: number
  currency: string
  createdAt: timestamp
  receivedAt?: timestamp
}

POItem {
  rawMaterialId: string
  quantity: number
  unitPrice: number
  totalPrice: number
}
```

---

### 3.7 Scale Integration

#### Feature: Real-Time Scale Connection
**Description:** Connect to precision scales via Serial Port or WebSocket bridge.

**Modes:**
1. **Browser Serial API** (Chrome/Edge only)
   - Direct USB connection
   - No server required
   - Limited browser support

2. **WebSocket Bridge** (Recommended)
   - Node.js server connects to scale via Serial Port
   - Broadcasts weight data via WebSocket
   - Works in all browsers
   - Auto-reconnect on disconnect

**Supported Scales:**
- A&D JA5003 (primary)
- Generic scales with RS-232 output

**Data Protocol:**
```
Scale → Serial → Bridge → WebSocket → Client

Example packet: "ST,+000.123 g"

Parsed:
  status: 'ST' (stable) | 'US' (unstable)
  value: 0.123
  unit: 'g'
```

**Scale Commands:**
- `P` - Print (request current weight)
- `T` - Tare (zero the scale)
- `SI` - Send continuously (streaming mode)
- `S` - Stop continuous mode

**Configuration:**
```typescript
ScaleConfig {
  mode: 'browser-serial' | 'websocket-bridge'
  bridgeUrl: string (e.g., "ws://127.0.0.1:8787")
  serialPort?: string (e.g., "COM3", "/dev/ttyUSB0")
  baudRate: number (e.g., 9600)
  pollingInterval: number (ms between readings)
  autoTare: boolean
}
```

---

## 4. User Flows

### 4.1 Complete Preparation Flow

```
[Start] User scans formula QR code
   ↓
[System] Decode QR → Identify formula
   ↓
[System] Check last session for this formula:
   ├─ None or in-progress? → Continue to prep
   └─ Completed? → Route to test management
   ↓
[System] Show "Batch Size" dialog
   ├─ Default: Formula target batch size
   └─ User can override (e.g., 250g instead of 100g)
   ↓
[User] Enters batch size, clicks "Start"
   ↓
[System] Calculate target weights for all ingredients
[System] Create PreparationSession in DB
[System] Create PreparationSteps for each ingredient
[System] Navigate to /preparations/:id?modal=size&auto=1
   ↓
[System] Display Step 1:
   ┌─────────────────────────────────┐
   │ Step 1 of 8: Glycerin           │
   │ Target: 45.00g ± 0.11g          │
   │ Current: 0.00g                  │
   │ [Tare Scale] [Skip] [Complete]  │
   └─────────────────────────────────┘
   ↓
[User] Places container on scale, clicks "Tare Scale"
   ↓
[System] Send tare command to scale
[System] Wait for stable reading = 0.00g
   ↓
[User] Scan ingredient barcode (optional, for validation)
   ↓
[System] Verify barcode matches expected ingredient
   ↓
[User] Pours ingredient into container
   ↓
[System] Display real-time weight (updates every 500ms)
   ├─ Weight < target-tolerance: Show orange indicator
   ├─ Weight in range: Show green indicator + "✓ OK"
   └─ Weight > target+tolerance: Show red indicator + "! Over"
   ↓
[System] Auto-advance when weight stable in range (3s)
   ↓
[System] Record step completion:
   - Captured weight
   - Timestamp
   - Lot ID (if scanned)
   ↓
[System] Display Step 2 (repeat for all ingredients)
   ↓
[End] All steps complete
   ↓
[System] Show completion summary:
   ┌─────────────────────────────────┐
   │ Preparation Complete!           │
   │ Total: 250.12g (250.00g target) │
   │ Variance: +0.12g (+0.05%)       │
   │ [Create Sample] [Finish]        │
   └─────────────────────────────────┘
   ↓
[User] Clicks "Create Sample"
   ↓
[System] Generate sample code (e.g., GIV001003)
[System] Create Sample record linked to PreparationSession
[System] Navigate to /samples/:id
```

---

### 4.2 Resume Preparation Flow

```
[Start] User scans formula QR code (already in-progress)
   ↓
[System] Check last session: status = 'in_progress'
   ↓
[System] Navigate to /preparations/:existing-id
   ↓
[System] Load session from DB
[System] Find last completed step
   ↓
[System] Resume at next step
   ↓
[User] Continues weighing remaining ingredients
```

---

### 4.3 Test Management Flow

```
[Start] User scans formula QR code (completed prep)
   ↓
[System] Check last session: status = 'completed'
   ↓
[System] Navigate to /tests/management?sessionId=:id
   ↓
[System] Display test scheduling UI:
   ┌─────────────────────────────────┐
   │ Schedule Tests for Batch #3     │
   │ Formula: PRM00936               │
   │ Sample: GIV001003               │
   │                                 │
   │ ☐ pH Test (Due: Today)         │
   │ ☐ Viscosity (Due: +2 days)     │
   │ ☐ Microbiology (Due: +7 days)  │
   │                                 │
   │ [Schedule Selected Tests]       │
   └─────────────────────────────────┘
   ↓
[User] Selects tests, clicks "Schedule"
   ↓
[System] Create TestSchedule records
[System] Show confirmation
```

---

## 5. Data Models

### 5.1 Entity Relationship Diagram

```
┌─────────────┐
│   Formula   │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│  Ingredient     │ (composition)
└─────────────────┘

┌─────────────┐
│   Formula   │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼───────────────┐
│ PreparationSession   │
└──────┬───────────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│ PreparationStep │
└─────────────────┘

┌─────────────────────┐
│ PreparationSession  │
└──────┬──────────────┘
       │ 1
       │
       │ 1
┌──────▼──────┐
│   Sample    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│ TestSchedule    │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│  TestResult     │
└─────────────────┘

┌─────────────┐
│ RawMaterial │
└──────┬──────┘
       │ N
       │
       │ M
┌──────▼──────┐
│  Supplier   │
└─────────────┘
```

---

### 5.2 Database Schema (IndexedDB)

**Tables:**
```typescript
// Version 1
sessions: 'id, formulaId, status, startedAt'
steps: 'id, sessionId, sequence, ingredientId, status'
events: '++id, sessionId, ts'
outbox: '++id, ts, type, sent'
tests: 'id, type, linkId, dueAt, status'

// Version 2 (with indexes for smart routing)
sessions: 'id, formulaId, formulaCode, startedAt, status'
samples: 'id, source, status, createdAt, preparationSessionId, [source+status+createdAt]'
```

**localStorage (legacy):**
- `nbslims_formulas` - Formula list
- `nbslims_raw_materials` - Raw material list
- `nbslims_enhanced_samples` - Sample list with cost data

---

## 6. Technical Architecture

### 6.1 Tech Stack

**Frontend:**
- React 18 (hooks, suspense)
- TypeScript
- React Router DOM (v6)
- TanStack Query (React Query)
- Dexie.js (IndexedDB wrapper)
- Vite (build tool)
- Tailwind CSS + shadcn/ui components

**Hardware Integration:**
- SerialPort API (Node.js)
- WebSocket (real-time scale data)
- Web Serial API (browser-native, limited support)

**Development:**
- pnpm (package manager)
- ESLint + TypeScript compiler
- Playwright (E2E testing)
- GitHub Actions (CI/CD)

---

### 6.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│  ┌────────────────────────────────────────────┐    │
│  │           React Application                 │    │
│  │  ┌──────────────────────────────────────┐  │    │
│  │  │  Pages (Formulas, Preparations, etc) │  │    │
│  │  └────────────┬─────────────────────────┘  │    │
│  │               │                             │    │
│  │  ┌────────────▼─────────────────────────┐  │    │
│  │  │  Services (sessions, qr, scan, etc)  │  │    │
│  │  └────────────┬─────────────────────────┘  │    │
│  │               │                             │    │
│  │  ┌────────────▼──────┐  ┌───────────────┐ │    │
│  │  │  React Query      │  │  IndexedDB    │ │    │
│  │  │  (Cache + Sync)   │  │  (Dexie)      │ │    │
│  │  └────────────┬──────┘  └───────┬───────┘ │    │
│  │               │                  │         │    │
│  │  ┌────────────▼──────────────────▼───────┐ │    │
│  │  │        Data Layer (db.ts)              │ │    │
│  │  └────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │       WebSocket Client (scaleWs)           │    │
│  └────────────┬───────────────────────────────┘    │
└───────────────┼─────────────────────────────────────┘
                │ ws://127.0.0.1:8787
                │
┌───────────────▼─────────────────────────────────────┐
│              Node.js Scale Bridge                   │
│  ┌────────────────────────────────────────────┐    │
│  │  WebSocket Server (8787)                   │    │
│  └────────────┬───────────────────────────────┘    │
│               │                                     │
│  ┌────────────▼───────────────────────────────┐    │
│  │  SerialPort (COM3, 9600 baud)              │    │
│  └────────────┬───────────────────────────────┘    │
└───────────────┼─────────────────────────────────────┘
                │ RS-232
                │
┌───────────────▼─────────────────────────────────────┐
│         A&D JA5003 Precision Scale                  │
└─────────────────────────────────────────────────────┘
```

---

### 6.3 Key Design Patterns

**1. Transaction-Safe Writes**
```typescript
await db.transaction('rw', db.sessions, db.steps, async () => {
  await db.sessions.put(session);
  for (const step of steps) {
    await db.steps.put(step);
  }
});
// All writes commit together or none at all
```

**2. Cache Priming for Instant Navigation**
```typescript
// Service creates session
const session = await createSessionFromFormula(formula);
queryClient.setQueryData(['session', session.id], session); // Prime cache
navigate(`/preparations/${session.id}`, { state: { session } }); // Pass state
```

**3. Location State + InitialData for Zero-Latency Loads**
```typescript
// Wrapper primes cache from location state
if (loc.state?.session?.id === id) {
  qc.setQueryData(['session', id], loc.state.session);
}

// Inner component reads from cache immediately
const sessionQ = useQuery({
  queryKey: ['session', id],
  initialData: () => qc.getQueryData(['session', id]) ?? null,
  // No wait for DB query!
});
```

**4. Retry with Backoff**
```typescript
const sessionQ = useQuery({
  queryKey: ['session', id],
  queryFn: async () => await db.sessions.get(id) ?? null,
  retry: 3,
  retryDelay: 300, // 300ms × 3 = 900ms total
});
```

---

## 7. Integration Requirements

### 7.1 Scale Integration

**Requirement:** System must read weight data from precision scale in real-time (< 500ms latency).

**Implementation Options:**
1. **Browser Serial API** (Chrome/Edge only)
2. **WebSocket Bridge** (Recommended, cross-browser)

**Bridge Specifications:**
- Node.js server on `ws://127.0.0.1:8787`
- Reads from Serial Port (COM3, 9600 baud)
- Broadcasts weight packets to all connected clients
- Auto-reconnect on disconnect
- Health monitoring (warns if no data for 10s)

---

### 7.2 Barcode Scanner Integration

**Requirement:** System must support wedge scanners (keyboard emulation).

**Implementation:**
- `useBarcode` hook listens for rapid keystrokes
- Detects barcode scan (ends with Enter key)
- Parses via `decodeQR()` function
- Routes via `handleScanNavigation()`

**Supported Scanner Types:**
- USB wedge scanners
- Bluetooth scanners (keyboard mode)
- Camera-based scanners (ZXing library)

---

### 7.3 Backend Sync (Future)

**Requirement:** Sync local data to cloud backend for multi-device access.

**Approach:**
- Outbox pattern (queue mutations)
- Sync when online
- Conflict resolution (last-write-wins or merge)

---

## 8. Non-Functional Requirements

### 8.1 Performance
- **Page load time:** < 1s (cached pages < 100ms)
- **Scale data latency:** < 500ms (real-time feel)
- **Search response:** < 200ms (for 1000+ formulas)
- **DB query time:** < 50ms (indexed queries)

### 8.2 Reliability
- **Upfront availability:** 99.9% (offline-first = works without internet)
- **Data durability:** 100% (IndexedDB + periodic backup)
- **Scale reconnect:** Auto-reconnect within 5s

### 8.3 Usability
- **Learnability:** New user productive in < 30 minutes
- **Error rate:** < 1% (with real-time validation)
- **Accessibility:** WCAG 2.1 AA compliance

### 8.4 Security
- **Authentication:** Role-based (Admin, QC, Operator)
- **Audit trail:** All actions logged with timestamp + user
- **Data privacy:** GDPR compliant (user consent, data export)

---

## 9. Success Metrics

### 9.1 Operational Metrics
- **Preparations per day:** Baseline 20 → Target 60 (+200%)
- **Error rate:** Baseline 15% → Target <1% (-93%)
- **Average prep time:** Baseline 15 min → Target 5 min (-67%)

### 9.2 Quality Metrics
- **Out-of-tolerance incidents:** < 5 per month
- **Test failure rate:** < 2%
- **Traceability coverage:** 100%

### 9.3 User Satisfaction
- **NPS (Net Promoter Score):** > 50
- **Daily active users:** 100% of lab staff
- **Support tickets:** < 2 per week

---

## 10. Future Roadmap

### Phase 3 (Next 3 months)
- [ ] Camera-based barcode scanning (no hardware needed)
- [ ] Multi-language support (Spanish, French)
- [ ] Mobile app (React Native)

### Phase 4 (Next 6 months)
- [ ] Cloud backend with real-time sync
- [ ] Multi-site deployment
- [ ] Advanced analytics dashboard

### Phase 5 (Next 12 months)
- [ ] AI-powered formula optimization
- [ ] Predictive inventory management
- [ ] Integration with ERP systems (SAP, Oracle)

---

## Appendix A: Glossary

- **GMP:** Good Manufacturing Practice
- **ISO:** International Organization for Standardization
- **LIMS:** Laboratory Information Management System
- **SOP:** Standard Operating Procedure
- **SDS:** Safety Data Sheet
- **CAS:** Chemical Abstracts Service (unique chemical identifier)
- **Wedge Scanner:** Barcode scanner that emulates keyboard input
- **Tare:** Reset scale to zero (ignore container weight)
- **Tolerance:** Acceptable deviation from target (e.g., ±0.5g)

---

## Appendix B: API Reference (For AI Agents)

### Service: `sessions.ts`

```typescript
// Create new preparation session
createSessionFromFormula(
  formula: FormulaLike,
  opts?: { amount?: number; unit?: string }
): Promise<PreparationSession>

// Find most recent session for formula
getLastSessionByFormulaCode(
  code: string
): Promise<PreparationSession | null>

// Smart routing (create new or resume)
startOrResumeForFormula(
  formula: FormulaLike
): Promise<{ mode: 'prep' | 'resume-test'; session: PreparationSession }>
```

### Service: `qr.ts`

```typescript
// Decode QR code to structured data
decodeQR(
  raw: string
): QR | null

// Normalize QR code for search
normalizeForSearch(
  raw: string
): string

// Navigate based on QR type
handleScanNavigation(
  navigate: (to: string) => void,
  raw: string
): void
```

### Database: `db.ts`

```typescript
// IndexedDB tables
db.sessions: Table<PreparationSession, string>
db.steps: Table<PreparationStep, string>
db.events: Table<AuditEvent, number>
db.tests: Table<TestSchedule, string>

// Queries
db.sessions.get(id: string): Promise<PreparationSession | undefined>
db.sessions.where('formulaCode').equals(code).sortBy('startedAt'): Promise<PreparationSession[]>
db.steps.where('sessionId').equals(id).sortBy('sequence'): Promise<PreparationStep[]>
```

---

## Document End

**For AI Recreation:**
1. Start with data models (Section 5)
2. Implement core services (Section 3, Appendix B)
3. Build UI flows (Section 4)
4. Add hardware integration (Section 7)
5. Test against acceptance criteria (Section 3)

**Questions?** Refer to technical docs:
- `SESSIONS_IMPLEMENTATION.md` - Session management
- `START_OR_RESUME_FLOW.md` - Smart routing
- `RACE_CONDITION_FIX.md` - Data consistency
- `PREP_NOT_FOUND_FIX.md` - Debugging guide

