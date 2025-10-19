# Technical Specification for AI Recreation

## Quick Start for AI Agents

**Goal:** Recreate this Lab Management System from scratch.

**What you need:**
1. This file (technical spec)
2. `PRD_LAB_MANAGEMENT_SYSTEM.md` (business requirements)
3. Your preferred tech stack

**Recommended approach:**
1. ✅ Read this entire document first
2. ✅ Set up project structure
3. ✅ Implement data layer (IndexedDB)
4. ✅ Implement services (business logic)
5. ✅ Build UI components
6. ✅ Add hardware integration
7. ✅ Test workflows

---

## Tech Stack (Recommended)

### Core
- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Router:** React Router DOM v6
- **State:** TanStack Query (React Query) + IndexedDB
- **Styling:** Tailwind CSS + shadcn/ui

### Optional Alternatives
| Component | Original | Alternative |
|-----------|----------|-------------|
| React | React 18 | Vue 3, Svelte, Solid.js |
| IndexedDB | Dexie.js | idb, localForage, PouchDB |
| Styling | Tailwind | CSS Modules, styled-components, MUI |
| State | React Query | Redux Toolkit, Zustand, Jotai |

---

## Project Structure

```
src/
├── pages/                    # Route components
│   ├── Formulas.tsx
│   ├── FormulaFirst.tsx     # Scan → start prep
│   ├── PreparationDetail.tsx # Wrapper (routing logic)
│   ├── Samples.tsx
│   ├── TestManagement.tsx
│   └── Settings.tsx
│
├── features/                 # Feature modules
│   └── preparations/
│       ├── PreparationDetails.tsx  # Inner component (UI)
│       ├── Wizard.tsx              # Guided prep flow
│       └── PrepBatchDialog.tsx     # Size selector
│
├── components/               # Shared UI
│   ├── ui/                   # shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── Navigation.tsx
│   ├── Header.tsx
│   └── Layout.tsx
│
├── lib/                      # Core utilities
│   ├── db.ts                 # Dexie schema
│   ├── qr.ts                 # QR decode logic
│   ├── queryClient.ts        # React Query setup
│   └── scale/
│       ├── useScale.ts       # Scale hook
│       └── scaleWs.ts        # WebSocket client
│
├── services/                 # Business logic
│   ├── sessions.ts           # Prep management
│   └── scanResolver.ts       # QR routing
│
├── contexts/                 # React contexts
│   └── AuthContext.tsx
│
├── hooks/                    # Custom hooks
│   ├── useBarcode.ts         # Scanner integration
│   └── useScaleBridge.ts     # Scale status
│
└── App.tsx                   # Root component

scripts/                      # Node.js utilities
├── ja5003_ws_bridge.js       # Scale WebSocket server
└── bridge-runner.mjs         # Auto-restart runner

e2e/                          # Playwright tests
├── smoke.spec.ts
├── qr.spec.ts
└── formula-start.spec.ts
```

---

## Implementation Guide

### Step 1: Set Up Project

```bash
# Create Vite project
npm create vite@latest lab-lims -- --template react-ts
cd lab-lims

# Install dependencies
npm install react-router-dom @tanstack/react-query dexie uuid
npm install -D @types/uuid tailwindcss autoprefixer postcss
npm install -D @playwright/test

# Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input dialog table
```

---

### Step 2: Database Layer (`src/lib/db.ts`)

**Critical:** This is the foundation. Get it right first.

```typescript
import Dexie, { Table } from 'dexie';

// Define interfaces (from PRD Section 5)
export interface PreparationSession {
  id: string;
  formulaId: string;
  formulaVersionId?: string;
  formulaCode?: string;
  attemptNo: number;
  status: 'in_progress' | 'failed' | 'locked_failed' | 'completed' | 'server_rejected';
  operator: string;
  startedAt: number;
  endedAt?: number;
}

export interface PreparationStep {
  id: string;
  sessionId: string;
  sequence: number;
  ingredientId: string;
  requiredCodeValue: string;
  altCodeValues?: string[];
  allowedSymbologies?: string[];
  parser?: 'plain' | 'gs1' | 'kv';
  targetQtyG: number;
  toleranceAbsG: number;
  capturedQtyG?: number;
  isStable?: boolean;
  status: 'pending' | 'ok' | 'failed';
  failureReason?: string;
  capturedAt?: number;
}

export interface AuditEvent {
  id?: number;
  sessionId: string;
  ts: number;
  user: string;
  action: string;
  payload: any;
}

export interface TestSchedule {
  id: string;
  type: 'formula' | 'personal';
  linkId: string;
  startAt: number;
  dueAt: number;
  remindOffsets: number[];
  status: 'scheduled' | 'done' | 'canceled';
}

// Define database
export class NBSDB extends Dexie {
  sessions!: Table<PreparationSession, string>;
  steps!: Table<PreparationStep, string>;
  events!: Table<AuditEvent, number>;
  tests!: Table<TestSchedule, string>;

  constructor() {
    super('nbs-lims');
    
    // Version 1: Initial schema
    this.version(1).stores({
      sessions: 'id, formulaId, status, startedAt',
      steps: 'id, sessionId, sequence, ingredientId, status',
      events: '++id, sessionId, ts',
      tests: 'id, type, linkId, dueAt, status'
    });

    // Version 2: Add indexes for smart routing
    this.version(2).stores({
      sessions: 'id, formulaId, formulaCode, startedAt, status',
      steps: 'id, sessionId, sequence, ingredientId, status',
      events: '++id, sessionId, ts',
      tests: 'id, type, linkId, dueAt, status'
    });
  }
}

export const db = new NBSDB();
```

**Key points:**
- Use `string` for session IDs (UUIDs)
- Use `number` for auto-increment IDs (events)
- Index fields you'll query on (`formulaCode`, `startedAt`)
- Version upgrades preserve existing data

---

### Step 3: Query Client (`src/lib/queryClient.ts`)

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 0,
    },
  },
});
```

---

### Step 4: QR Decoder (`src/lib/qr.ts`)

**Critical:** Universal QR decoder handles all barcode formats.

```typescript
export type QR =
  | { type: 'sample'; code: string; extras?: Record<string, string> }
  | { type: 'formula'; code: string; extras?: Record<string, string> }
  | { type: 'prep'; id: string; extras?: Record<string, string> };

export function decodeQR(raw0: string): QR | null {
  const raw = (raw0 ?? '').trim();
  if (!raw) return null;

  // Try URL-style first
  try {
    const u = new URL(raw);
    const segs = u.pathname.split('/').filter(Boolean).map(s => s.trim());
    const q = Object.fromEntries(u.searchParams.entries());
    const head = (segs[0] || '').toLowerCase();
    const val = segs[1];

    if (head === 'f' && val) return { type: 'formula', code: val, extras: q };
    if (head === 's' && val) return { type: 'sample', code: val, extras: q };
    if (head === 'p' && val) return { type: 'prep', id: val, extras: q };

    if (head === 'formulas' && val) return { type: 'formula', code: val, extras: q };
    if (head === 'samples' && val) return { type: 'sample', code: val, extras: q };
    if (head === 'preparations' && val) return { type: 'prep', id: val, extras: q };
  } catch {
    // Not a URL
  }

  // Legacy prefixes: S:, F=, P:, SAMPLE:, FORMULA:, PREP:
  const pref = raw.match(/^(S|F|P|SAMPLE|FORMULA|PREP)\s*[:=]\s*(.+)$/i);
  if (pref) {
    const kind = pref[1].toUpperCase();
    const val = pref[2].trim();
    if (kind === 'S' || kind === 'SAMPLE') return { type: 'sample', code: val };
    if (kind === 'F' || kind === 'FORMULA') return { type: 'formula', code: val };
    if (kind === 'P' || kind === 'PREP') return { type: 'prep', id: val };
  }

  // UUID-ish → prep
  if (/^[0-9a-f-]{20,}$/i.test(raw)) return { type: 'prep', id: raw };

  // Fallback: treat as sample code
  return { type: 'sample', code: raw };
}

export function normalizeForSearch(raw: string): string {
  const qr = decodeQR(raw);
  if (!qr) return '';
  return qr.type === 'prep' ? qr.id : qr.code;
}
```

---

### Step 5: Scan Navigation (`src/lib/handleScanNavigation.ts`)

```typescript
import { decodeQR } from './qr';

export function handleScanNavigation(nav: (to: string) => void, raw: string) {
  const qr = decodeQR(raw);
  if (!qr) return;

  switch (qr.type) {
    case 'prep':
      nav(`/preparations/${encodeURIComponent(qr.id)}`);
      break;
    case 'formula': {
      const params = new URLSearchParams({ code: qr.code, auto: 'start' });
      nav(`/formula-first?${params.toString()}`);
      break;
    }
    case 'sample': {
      const params = new URLSearchParams({ search: qr.code });
      nav(`/samples?${params.toString()}`);
      break;
    }
  }
}
```

---

### Step 6: Session Service (`src/services/sessions.ts`)

**Critical:** This is your business logic core.

```typescript
import { v4 as uuid } from 'uuid';
import { db, type PreparationSession } from '@/lib/db';
import { queryClient } from '@/lib/queryClient';

export type FormulaLike = {
  id: string;
  code: string;
  internalCode?: string;
  name: string;
  steps: Array<{
    ingredientId: string;
    ingredientName: string;
    fraction: number;
  }>;
};

/**
 * Find most recent session for formula
 */
export async function getLastSessionByFormulaCode(
  code: string
): Promise<PreparationSession | null> {
  const list = await db.sessions
    .where('formulaCode')
    .equals(code)
    .reverse()
    .sortBy('startedAt');
  return list[0] ?? null;
}

/**
 * Create new session from formula
 */
export async function createSessionFromFormula(
  formula: FormulaLike,
  opts?: { amount?: number; unit?: string }
): Promise<PreparationSession> {
  const id = uuid();
  const amount = Math.max(0.001, opts?.amount ?? 100);
  const unit = opts?.unit ?? 'g';

  const attemptNo = (await db.sessions.where('formulaId').equals(formula.id).count()) + 1;

  const session: PreparationSession = {
    id,
    formulaId: formula.id,
    formulaVersionId: formula.id,
    formulaCode: formula.code,
    attemptNo,
    status: 'in_progress',
    operator: 'operator',
    startedAt: Date.now(),
  };

  // Transaction-safe write
  await db.transaction('rw', db.sessions, db.steps, async () => {
    await db.sessions.put(session);

    // Create steps
    const steps = (formula.steps ?? []).map((s, i) => ({
      seq: i + 1,
      ingredientId: s.ingredientId,
      ingredientName: s.ingredientName,
      target: Math.round((s.fraction * amount + Number.EPSILON) * 1000) / 1000,
      toleranceAbs: Math.max(0.001, amount * 0.0025),
    }));

    for (const step of steps) {
      await db.steps.put({
        id: uuid(),
        sessionId: id,
        sequence: step.seq,
        ingredientId: step.ingredientId,
        requiredCodeValue: step.ingredientId,
        targetQtyG: step.target,
        toleranceAbsG: step.toleranceAbs,
        status: 'pending',
      });
    }
  });

  // Prime cache
  try {
    queryClient.setQueryData(['session', id], session);
  } catch (err) {
    console.warn('[session-create] cache prime failed:', err);
  }

  return session;
}

/**
 * Smart routing: create new or resume existing
 */
export async function startOrResumeForFormula(formula: FormulaLike) {
  const last = await getLastSessionByFormulaCode(formula.code);

  if (last && last.status !== 'in_progress') {
    return { mode: 'resume-test' as const, session: last };
  }

  const session =
    last && last.status === 'in_progress'
      ? last
      : await createSessionFromFormula(formula);

  return { mode: 'prep' as const, session };
}
```

**Key patterns:**
- ✅ Transaction-safe writes (`db.transaction`)
- ✅ Cache priming before navigation
- ✅ Smart routing based on session status

---

### Step 7: Page Components

#### FormulaFirst.tsx (Scan Entry Point)

```typescript
import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { startOrResumeForFormula } from '@/services/sessions';

export default function FormulaFirst() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const code = (sp.get('code') ?? '').trim();
  const auto = sp.get('auto');
  const didAutoRef = useRef(false);

  // Query formula from localStorage or API
  const formulaQ = useQuery({
    queryKey: ['formulaByCode', code],
    queryFn: async () => {
      const list = JSON.parse(localStorage.getItem('nbslims_formulas') || '[]');
      return list.find((f: any) => f.code === code) ?? null;
    },
    enabled: !!code,
  });

  // Auto-start on ?auto=start
  useEffect(() => {
    if (!auto || !formulaQ.data || didAutoRef.current) return;
    didAutoRef.current = true;

    (async () => {
      const { mode, session } = await startOrResumeForFormula(formulaQ.data);

      console.debug('[prep-start]', mode, session.id);

      if (mode === 'prep') {
        navigate(`/preparations/${session.id}?modal=size&auto=1`, {
          replace: true,
          state: { session },
        });
      } else {
        navigate(`/tests/management?sessionId=${session.id}`, { replace: true });
      }
    })();
  }, [auto, formulaQ.data, navigate]);

  if (!code) return <div>Scan formula QR to begin</div>;
  if (formulaQ.isLoading) return <div>Looking up formula...</div>;
  if (!formulaQ.data) return <div>Formula not found: {code}</div>;

  return (
    <div>
      <h1>Formula First</h1>
      <p>Found: {formulaQ.data.name}</p>
    </div>
  );
}
```

---

#### PreparationDetail.tsx (Wrapper with State)

```typescript
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db, type PreparationSession } from '@/lib/db';
import { PreparationDetails } from '@/features/preparations/PreparationDetails';

export const PreparationDetail: React.FC = () => {
  const { id = '' } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const loc = useLocation() as { state?: { session?: PreparationSession } };
  const fromState = loc.state?.session;
  const cacheKey = ['session', id];

  console.debug('[prep-detail] id', id, 'fromState?', !!fromState);

  // Warm cache from navigation state
  if (fromState && fromState.id === id) {
    qc.setQueryData(cacheKey, fromState);
    db.sessions.put(fromState).catch(() => {});
  }

  // Safe query: never returns undefined
  const sessionQ = useQuery({
    queryKey: cacheKey,
    queryFn: async () => {
      if (!id) return null;
      const rec = await db.sessions.get(id);
      return rec ?? null;
    },
    initialData: () => (qc.getQueryData(cacheKey) as any) ?? null,
    retry: 2,
    retryDelay: 250,
    staleTime: 5_000,
  });

  // Early guards
  if (sessionQ.isLoading) return <div>Loading...</div>;
  if (sessionQ.data === null) {
    const f = sp.get('f');
    if (f) {
      navigate(`/formula-first?code=${encodeURIComponent(f)}&auto=start`, { replace: true });
      return null;
    }
    return <div>Preparation not found.</div>;
  }

  // Auto-open modal from query params
  const [openPrep, setOpenPrep] = useState(false);
  useEffect(() => {
    if (sp.get('modal') === 'size' || sp.get('auto') === '1') {
      setOpenPrep(true);
    }
  }, [sp]);

  return (
    <PreparationDetails
      id={id}
      layout="full"
      defaultOpen={openPrep}
      onOpenChange={setOpenPrep}
    />
  );
};
```

---

#### PreparationDetails.tsx (Inner UI Component)

```typescript
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function PreparationDetails({
  id,
  layout,
  defaultOpen,
  onOpenChange,
}: {
  id: string;
  layout: 'drawer' | 'full';
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const cacheKey = ['session', id];

  const prepQ = useQuery({
    queryKey: cacheKey,
    queryFn: async () => {
      if (!id) return null;
      const s = await db.sessions.get(id);
      const st = await db.steps.where('sessionId').equals(id).sortBy('sequence');
      return { session: s, steps: st };
    },
    initialData: () => (qc.getQueryData(cacheKey) as any) ?? null,
    enabled: !!id,
    retry: 2,
    retryDelay: 250,
    staleTime: 5_000,
  });

  if (prepQ.isLoading || !prepQ.data) return <div>Loading...</div>;
  if (!prepQ.data.session) return <div>Not found.</div>;

  const { session, steps } = prepQ.data;

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Preparation {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Formula: {session.formulaId}</p>
          <p>Status: {session.status}</p>
          <p>Steps: {steps.length}</p>

          {/* TODO: Add guided prep wizard here */}
          {/* Use defaultOpen prop to auto-open modal */}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Step 8: Scale Integration (Optional)

**Node.js Bridge (`scripts/ja5003_ws_bridge.js`):**

```javascript
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = Number(process.env.JA_WS_PORT || 8787);
const HOST = process.env.JA_WS_HOST || '127.0.0.1';
const SERIAL_PORT = process.env.JA_PORT || 'COM3';
const BAUD_RATE = Number(process.env.JA_BAUD || 9600);

// Create HTTP + WebSocket servers
const server = http.createServer();
const wss = new WebSocketServer({ server });

// Open serial port
const port = new SerialPort({ path: SERIAL_PORT, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Broadcast to all WS clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

// Parse scale data
parser.on('data', (line) => {
  console.log('[scale]', line);
  broadcast(line);
});

// Handle WS connections
wss.on('connection', (ws) => {
  console.log('[ws] client connected');

  ws.on('message', (msg) => {
    const cmd = msg.toString().trim();
    if (['P', 'T', 'SI', 'S'].includes(cmd)) {
      port.write(cmd + '\r\n');
    }
  });

  ws.on('close', () => {
    console.log('[ws] client disconnected');
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`✓ JA5003 WS Bridge on ws://${HOST}:${PORT}`);
});
```

**Client Hook (`src/lib/scale/useScale.ts`):**

```typescript
import { useEffect, useState } from 'react';

export function useScale() {
  const [connected, setConnected] = useState(false);
  const [reading, setReading] = useState<{
    value: number;
    unit: string;
    stable: boolean;
  } | null>(null);

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
      const match = line.match(/(ST|US),([+-]\d+\.\d+)\s*(\w+)/);
      if (match) {
        setReading({
          value: parseFloat(match[2]),
          unit: match[3],
          stable: match[1] === 'ST',
        });
      }
    };

    ws.onclose = () => {
      console.log('[scale] disconnected');
      setConnected(false);
    };

    return () => ws.close();
  }, []);

  return { connected, reading };
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { decodeQR } from '@/lib/qr';

describe('QR Decoder', () => {
  it('decodes formula QR', () => {
    expect(decodeQR('F=PRM00936')).toEqual({
      type: 'formula',
      code: 'PRM00936',
    });
  });

  it('decodes sample QR', () => {
    expect(decodeQR('S:GIV001003')).toEqual({
      type: 'sample',
      code: 'GIV001003',
    });
  });

  it('decodes UUID as prep', () => {
    const uuid = 'abc-123-def-456-789';
    expect(decodeQR(uuid)).toEqual({
      type: 'prep',
      id: uuid,
    });
  });
});
```

---

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('formula scan creates preparation', async ({ page }) => {
  await page.goto('http://localhost:5173/formula-first?code=PRM00936&auto=start');

  // Should redirect to prep detail
  await expect(page).toHaveURL(/\/preparations\/[0-9a-f-]{20,}/, { timeout: 5000 });

  // Should show prep UI
  await expect(page.getByText(/Preparation|Target|Ingredient/i)).toBeVisible();

  // Should NOT show "not found"
  await expect(page.getByText(/not found/i)).not.toBeVisible();
});
```

---

## Common Pitfalls for AI Agents

### ❌ Don't Do This:

```typescript
// BAD: Querying DB before cache prime
const session = await db.sessions.get(id); // May return null!
navigate(`/preparations/${id}`);

// BAD: Different cache keys in wrapper vs inner
// Wrapper:
queryClient.setQueryData(['prep', id], session);
// Inner:
useQuery({ queryKey: ['session', id] }); // MISMATCH!

// BAD: Returning undefined from query
queryFn: async () => await db.sessions.get(id), // Returns undefined if not found

// BAD: No retry logic
useQuery({ queryKey: ['session', id], retry: 0 }); // Fails on timing issues
```

---

### ✅ Do This Instead:

```typescript
// GOOD: Prime cache, then navigate
const session = await createSessionFromFormula(formula);
queryClient.setQueryData(['session', session.id], session);
navigate(`/preparations/${session.id}`, { state: { session } });

// GOOD: Same cache key everywhere
const cacheKey = ['session', id];
queryClient.setQueryData(cacheKey, session);
useQuery({ queryKey: cacheKey });

// GOOD: Always return null instead of undefined
queryFn: async () => (await db.sessions.get(id)) ?? null,

// GOOD: Retry with backoff
useQuery({ queryKey: ['session', id], retry: 3, retryDelay: 300 });
```

---

## Deployment Checklist

### Development
- [ ] `npm run dev` starts on port 5173
- [ ] IndexedDB initializes with version 2 schema
- [ ] localStorage has sample data for formulas/materials
- [ ] Scale bridge runs on ws://127.0.0.1:8787

### Production
- [ ] Build with `npm run build`
- [ ] Serve `dist/` folder with static server
- [ ] Scale bridge runs as Windows service (NSSM)
- [ ] HTTPS enabled (if deploying remotely)

---

## Summary for AI Agents

**Critical Path:**
1. ✅ Database schema (Dexie with indexes)
2. ✅ Session service (transaction-safe writes)
3. ✅ QR decoder (universal format support)
4. ✅ Wrapper component (cache priming + state passing)
5. ✅ Inner component (initialData from cache)
6. ✅ Smart routing (start or resume logic)

**Don't forget:**
- Cache key consistency (`['session', id]` everywhere)
- Transaction-safe writes (atomicity)
- Retry logic with backoff (handle timing issues)
- Location state for instant loads
- Auto-open modal from query params

**When stuck:**
- Read `PREP_NOT_FOUND_FIX.md` (debugging guide)
- Check console logs (`[prep-start]`, `[prep-detail]`)
- Inspect IndexedDB and React Query cache

**Questions?**
- Refer to PRD for business logic
- Refer to this doc for implementation details
- Check `START_OR_RESUME_FLOW.md` for routing logic

---

**Good luck building!** 🚀

