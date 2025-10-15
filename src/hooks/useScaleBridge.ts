import { useEffect, useState } from 'react';
import { scaleWs } from '@/lib/scaleWs';

export function useScaleBridge() {
  const [connected, setConnected] = useState<boolean>(false);
  const [lastMsg, setLastMsg] = useState<string>('');

  useEffect(() => {
    let open = false;
    const unsub = scaleWs.subscribe((m) => {
      setLastMsg(m);
      if (!open) { setConnected(true); open = true; }
    });
    scaleWs.start();

    const t = setInterval(() => {
      setConnected(prev => !!lastMsg || prev);
    }, 10000);

    return () => { unsub(); clearInterval(t); scaleWs.close(); };
  }, [lastMsg]);

  return { connected, lastMsg };
}


