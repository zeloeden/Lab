import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db';
import { queryClient } from '@/lib/queryClient';

export type Formula = {
  id: string;
  code?: string;
  internalCode?: string;
  name: string;
  ingredients?: Array<{ 
    id: string;
    ingredientId?: string; 
    ingredientName?: string;
    name?: string;
    quantity: number;
    unit?: string;
  }>;
  steps?: Array<{ 
    ingredientId: string; 
    ingredientName?: string; 
    fraction: number;
  }>;
  targetBatchSize?: number;
  targetBatchUnit?: string;
};

export type Preparation = {
  id: string;
  formulaId: string;
  formulaCode: string;
  name: string;
  createdAt: number;
  status: 'in-progress' | 'done' | 'aborted';
  attempt: number;
  targetAmount?: number;
  targetUnit?: string;
  steps: Array<{
    seq: number;
    ingredientId: string;
    ingredientName: string;
    target: number;
    toleranceAbs?: number;
    tolerancePct?: number;
    weighed?: number;
  }>;
};

export async function createPreparationFromFormula(
  formula: Formula,
  opts?: { amount?: number; unit?: string }
): Promise<Preparation> {
  const id = uuid();
  const amount = opts?.amount ?? 100;
  const unit = opts?.unit ?? 'g';

  const formulaSteps = formula.steps ?? [];
  const steps = formulaSteps.map((s, i) => ({
    seq: i + 1,
    ingredientId: s.ingredientId,
    ingredientName: s.ingredientName || s.ingredientId,
    target: Math.round((s.fraction * amount + Number.EPSILON) * 1000) / 1000,
    toleranceAbs: Math.max(0.001, amount * 0.0025),
  }));

  const prep: Preparation = {
    id,
    formulaId: formula.id,
    formulaCode: formula.code || formula.internalCode || formula.id,
    name: formula.name,
    createdAt: Date.now(),
    status: 'in-progress',
    attempt: 1,
    targetAmount: amount,
    targetUnit: unit,
    steps,
  };

  // Transaction-safe write to ensure atomicity
  await db.transaction('rw', db.sessions, db.steps, async () => {
    // Store session (using the actual DB schema)
    await db.sessions.put({
      id: prep.id,
      formulaId: prep.formulaId,
      formulaVersionId: prep.formulaId,
      attemptNo: prep.attempt,
      status: 'in_progress',
      operator: 'operator',
      startedAt: prep.createdAt,
    });

    // Store steps
    for (const step of prep.steps) {
      await db.steps.put({
        id: uuid(),
        sessionId: prep.id,
        sequence: step.seq,
        ingredientId: step.ingredientId,
        requiredCodeValue: step.ingredientId,
        targetQtyG: step.target,
        toleranceAbsG: step.toleranceAbs || 0.001,
        status: 'pending',
      });
    }
  });

  // Prime react-query cache for instant read on the next route
  try {
    queryClient.setQueryData(['prep', id], prep);
  } catch (err) {
    console.warn('[prep-create] cache prime failed:', err);
  }

  return prep;
}

export async function getPreparationById(id: string): Promise<Preparation | null> {
  try {
    const prep = await db.sessions.get(id);
    return prep || null;
  } catch (err) {
    console.error('[preparations] Failed to get preparation:', err);
    return null;
  }
}

export async function getPreparationSteps(sessionId: string): Promise<PreparationStep[]> {
  try {
    return await db.steps.where('sessionId').equals(sessionId).sortBy('sequence');
  } catch (err) {
    console.error('[preparations] Failed to get steps:', err);
    return [];
  }
}

