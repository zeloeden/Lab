import { v4 as uuid } from 'uuid';
import { db, type PreparationSession } from '@/lib/db';
import { queryClient } from '@/lib/queryClient';

export type FormulaLike = {
  id: string;
  code: string;
  internalCode?: string;
  name: string;
  steps: Array<{ ingredientId: string; ingredientName: string; fraction: number }>;
};

/**
 * Find the most recent session for a given formula code
 */
export async function getLastSessionByFormulaCode(code: string): Promise<PreparationSession | null> {
  // Requires index: formulaCode, startedAt in db.ts
  const list = await db.sessions
    .where('formulaCode')
    .equals(code)
    .reverse()
    .sortBy('startedAt');
  return list[0] ?? null;
}

/**
 * Create a new preparation session from a formula
 */
export async function createSessionFromFormula(
  formula: FormulaLike,
  opts?: { amount?: number; unit?: string }
): Promise<PreparationSession> {
  const id = uuid();
  const amount = Math.max(0.001, opts?.amount ?? 100);
  const unit = opts?.unit ?? 'g';

  // Calculate attempt number for this formula
  const attemptNo = (await db.sessions.where('formulaId').equals(formula.id).count()) + 1;

  // Map formula → session structure
  const session: PreparationSession = {
    id,
    formulaId: formula.id,
    formulaVersionId: formula.id,
    formulaCode: formula.code,
    attemptNo,
    status: 'in_progress',
    operator: 'operator', // TODO: get from auth context
    startedAt: Date.now(),
  };

  // Transaction-safe write
  await db.transaction('rw', db.sessions, db.steps, async () => {
    await db.sessions.put(session);

    // Create steps from formula
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

  // Warm cache so detail page paints instantly
  try {
    queryClient.setQueryData(['session', id], session);
  } catch (err) {
    console.warn('[session-create] cache prime failed:', err);
  }

  return session;
}

/**
 * Smart routing: start a new session OR resume/test the last one
 * 
 * Logic:
 * - If no previous session exists: create new → prep mode
 * - If last session is in-progress: resume → prep mode
 * - If last session is completed: go to test management
 */
export async function startOrResumeForFormula(formula: FormulaLike) {
  const last = await getLastSessionByFormulaCode(formula.code);
  
  // If last session is completed, go to test management
  if (last && last.status !== 'in_progress') {
    return { mode: 'resume-test' as const, session: last };
  }
  
  // Otherwise, use existing in-progress session or create new one
  const session = last && last.status === 'in_progress'
    ? last
    : await createSessionFromFormula(formula);
  
  return { mode: 'prep' as const, session };
}

