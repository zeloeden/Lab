import Dexie, { Table } from 'dexie';

export interface PreparationSession { id:string; formulaId:string; formulaVersionId?:string; formulaCode?:string; attemptNo:number; status:'in_progress'|'failed'|'locked_failed'|'completed'|'server_rejected'; operator:string; startedAt:number; endedAt?:number; }
export interface PreparationStep { id:string; sessionId:string; sequence:number; ingredientId:string; requiredCodeValue:string; altCodeValues?:string[]; allowedSymbologies?:string[]; parser?: 'plain'|'gs1'|'kv'; targetQtyG:number; toleranceAbsG:number; capturedQtyG?:number; isStable?:boolean; status:'pending'|'ok'|'failed'; failureReason?:string; capturedAt?:number; }
export interface AuditEvent { id?:number; sessionId:string; ts:number; user:string; action:string; payload:any; }
export interface TestSchedule { id:string; type:'formula'|'personal'; linkId:string; startAt:number; dueAt:number; remindOffsets:number[]; status:'scheduled'|'done'|'canceled'; }
export interface OutboxEvent { id?:number; ts:number; type:string; payload:any; sent:0|1; }

export class NBSDB extends Dexie {
  sessions!: Table<PreparationSession, string>;
  steps!: Table<PreparationStep, string>;
  events!: Table<AuditEvent, number>;
  outbox!: Table<OutboxEvent, number>;
  tests!: Table<TestSchedule, string>;
  constructor(){
    super('nbs-lims');
    this.version(1).stores({
      sessions: 'id, formulaId, status, startedAt',
      steps: 'id, sessionId, sequence, ingredientId, status',
      events: '++id, sessionId, ts',
      outbox: '++id, ts, type, sent',
      tests: 'id, type, linkId, dueAt, status'
    });
    // Version 2: Add samples table and update sessions indexes
    this.version(2).stores({
      sessions: 'id, formulaId, formulaCode, startedAt, status',
      steps: 'id, sessionId, sequence, ingredientId, status',
      events: '++id, sessionId, ts',
      outbox: '++id, ts, type, sent',
      tests: 'id, type, linkId, dueAt, status',
      samples: 'id, source, status, createdAt, preparationSessionId, [source+status+createdAt]'
    });
  }
}
export const db = new NBSDB();


