import { db } from './db';

export async function pushOutbox(){
  const items = await db.outbox.where('sent').equals(0).toArray();
  if (!items.length) return;
  await new Promise(r=>setTimeout(r,200));
  await db.transaction('rw', db.outbox, async ()=>{
    for (const it of items) await db.outbox.update(it.id!, { sent: 1 });
  });
}


