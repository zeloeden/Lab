import React from 'react';
import { useEffect, useState } from 'react';
import { env } from '@/config/env';
import { useScaleBridge } from '@/hooks/useScaleBridge';

export default function Diagnostics() {
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [wsOk, setWsOk] = useState<boolean | null>(null);
  const [lastMsg, setLastMsg] = useState<string>("(none)");
  const [dbOk, setDbOk] = useState<boolean | null>(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // @ts-ignore
        const db = (await import('@/db')).db;
        await db.open();
        setDbOk(true);
      } catch {
        setDbOk(false);
      }
    })();
  }, []);

  const bridge = useScaleBridge();
  useEffect(() => {
    setWsOk(bridge.connected);
    setLastMsg((bridge.lastMsg || '').slice(0,200) || '(none)');
  }, [bridge.connected, bridge.lastMsg]);

  return (
    <div className="p-6 space-y-2">
      <h1 className="text-xl font-semibold">Diagnostics</h1>
      <div>App version: <code>{env.VITE_APP_VERSION}</code></div>
      <div>Online: <b>{String(online)}</b></div>
      <div>Dexie (db): <b>{dbOk === null ? 'checking...' : String(dbOk)}</b></div>
      <div>Scale WS bridge: <b>{wsOk === null ? 'connecting...' : String(wsOk)}</b></div>
      {!wsOk && (
        <div className="text-sm text-amber-700">
          Bridge not connected. Start it via <code>scripts/start-scale-soft.cmd</code> or <code>pnpm run scale:bridge:soft</code>.
        </div>
      )}
      <div>Last scale message (first 200 chars): <code className="break-all">{lastMsg}</code></div>
    </div>
  );
}


