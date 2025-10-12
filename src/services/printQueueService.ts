type QueueItem = {
  templateId: string;
  payloadRecord: any;
  device?: string;
  copies?: number;
  format: 'raster'|'zpl';
  createdAt: number;
};

const KEY = 'nbslims_print_outbox';

function read(): QueueItem[]{ const raw=localStorage.getItem(KEY); if (!raw) return []; try { return JSON.parse(raw); } catch { return []; } }
function write(items: QueueItem[]){ localStorage.setItem(KEY, JSON.stringify(items)); }

export const printQueueService = {
  enqueue(item: Omit<QueueItem,'createdAt'>){ const list=read(); list.push({ ...item, createdAt: Date.now() }); write(list); try { console.debug('[print-queue] enqueued', item); } catch {} }
};


