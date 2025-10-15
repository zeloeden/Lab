import { useEffect, useRef } from 'react';

type Opts = { onScan: (code: string) => void; target?: HTMLElement | Document | null; idleMs?: number };
export function useBarcode({ onScan, target, idleMs = 80 }: Opts) {
  const buf = useRef('');
  const timer = useRef<number | null>(null);
  const finalize = () => {
    const clean = buf.current.replace(/[\r\n\t]/g, '').trim();
    buf.current = '';
    if (clean) onScan(clean);
  };
  useEffect(() => {
    const el: any = target ?? document;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); finalize(); return; }
      if (e.key.length === 1) {
        buf.current += e.key;
        if (timer.current) clearTimeout(timer.current);
        timer.current = window.setTimeout(finalize, idleMs);
      }
    };
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [onScan, target, idleMs]);
}


