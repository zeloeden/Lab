import { useEffect, useRef, useState } from 'react';

const JUMP_EPSILON_G = 0.01; // if change >= 0.01g, update instantly even if unstable
const DROP_STABLE_DELAY_MS = 400; // when stream moves again, wait a bit before calling it 'live' to avoid flicker

export type ScaleState = {
  rawWeight: number | null;
  displayWeight: number | null;
  unit: 'g' | null;
  status: 'live' | 'stable' | 'idle';
  lastTs: number | null;
};

export function useScaleWS(wsUrl: string = 'ws://127.0.0.1:8787') {
  const [state, setState] = useState<ScaleState>({
    rawWeight: null,
    displayWeight: null,
    unit: 'g',
    status: 'idle',
    lastTs: null,
  });
  const lastStableRef = useRef(false);
  const dropStableTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('[ScaleWS] Connected to', wsUrl);
    };

    ws.onmessage = (ev) => {
      let msg: any;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        // Legacy plain text format - ignore or parse if needed
        return;
      }

      if (msg?.type !== 'weight') return;

      setState((prev) => {
        const now = msg.ts || Date.now();
        const raw = typeof msg.value === 'number' ? msg.value : prev.rawWeight ?? null;
        const unit = msg.unit || prev.unit || 'g';
        let display = prev.displayWeight;
        let status: ScaleState['status'] = prev.status;

        // Instant snap for big jumps (user removed/placed item)
        if (display == null || (raw != null && Math.abs(raw - display) >= JUMP_EPSILON_G)) {
          display = raw;
          status = 'live'; // will become stable when bridge marks stable true
        }

        if (msg.stable) {
          display = raw;
          status = 'stable';
          lastStableRef.current = true;
          if (dropStableTimer.current) {
            clearTimeout(dropStableTimer.current);
            dropStableTimer.current = null;
          }
        } else {
          // not stable: only drop stable after a short delay (hysteresis)
          if (lastStableRef.current && !dropStableTimer.current) {
            dropStableTimer.current = setTimeout(() => {
              lastStableRef.current = false;
              setState((s) => ({ ...s, status: 'live' }));
            }, DROP_STABLE_DELAY_MS);
          }
        }

        return {
          rawWeight: raw,
          displayWeight: display,
          unit,
          status,
          lastTs: now,
        };
      });
    };

    ws.onclose = () => {
      console.log('[ScaleWS] Disconnected');
      setState((s) => ({ ...s, status: 'idle' }));
    };

    ws.onerror = () => {
      console.error('[ScaleWS] Connection error');
    };

    return () => {
      try {
        ws.close();
      } catch {}
      if (dropStableTimer.current) {
        clearTimeout(dropStableTimer.current);
      }
    };
  }, [wsUrl]);

  return state;
}

