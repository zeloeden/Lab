import { openDB } from "idb";

const DB_NAME = "nbs-label-editor";
const STORE = "templates";

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    },
  });
}

export type TemplateRecord = {
  id: string;          // `${printerId}:${name}`
  printerId: string;
  name: string;
  json: string;        // fabric canvas JSON
  meta: any;           // EditorMeta + custom
  updatedAt: number;
};

export async function saveTemplateLocal(t: TemplateRecord) {
  const d = await db();
  await d.put(STORE, t);
  return t.id;
}
export async function getTemplateLocal(id: string) {
  const d = await db();
  return d.get(STORE, id) as Promise<TemplateRecord | undefined>;
}
export async function listTemplatesLocal(printerId: string) {
  const d = await db();
  const all: TemplateRecord[] = [];
  let cursor = await d.transaction(STORE).store.openCursor();
  while (cursor) {
    if ((cursor.value as TemplateRecord).printerId === printerId) all.push(cursor.value as TemplateRecord);
    cursor = await cursor.continue();
  }
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function deleteTemplateLocal(id: string) {
  const d = await db();
  await d.delete(STORE, id);
}

// TODO: add server REST wiring; for now use local functions.
