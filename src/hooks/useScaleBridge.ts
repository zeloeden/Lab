import { useEffect, useState, useRef } from 'react';
import { scaleWs } from '@/lib/scaleWs';

export function useScaleBridge() {
  const [connected, setConnected] = useState<boolean>(false);
  const [lastMsg, setLastMsg] = useState<string>('');
  const [bridgeUrl] = useState<string>('ws://127.0.0.1:8787');
  const lastPacketAtRef = useRef<number>(0);

  useEffect(() => {
    let open = false;
    const unsub = scaleWs.subscribe((m) => {
      setLastMsg(m);
      lastPacketAtRef.current = Date.now();
      if (!open) { setConnected(true); open = true; }
    });
    
    scaleWs.start();

    const t = setInterval(() => {
      setConnected(prev => !!lastMsg || prev);
    }, 10000);

    return () => { unsub(); clearInterval(t); scaleWs.close(); };
  }, [lastMsg]);

  const getPacketAge = () => {
    if (!lastPacketAtRef.current) return null;
    return Math.round((Date.now() - lastPacketAtRef.current) / 1000);
  };

  const getStatusBadgeColor = () => {
    if (!connected) return 'red';
    const age = getPacketAge();
    if (age === null || age >= 5) return 'amber';
    return 'green';
  };

  return { 
    connected, 
    lastMsg, 
    lastPacketAt: lastPacketAtRef.current,
    packetAge: getPacketAge(),
    statusBadgeColor: getStatusBadgeColor(),
    bridgeUrl
  };
}


