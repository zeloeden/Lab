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
        const db = (await import('@/lib/db')).db;
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

  const getBadgeClasses = (color: string) => {
    const base = "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium";
    if (color === 'green') return `${base} bg-green-50 text-green-700 border border-green-200`;
    if (color === 'amber') return `${base} bg-amber-50 text-amber-700 border border-amber-200`;
    return `${base} bg-red-50 text-red-700 border border-red-200`;
  };

  const getStatusDot = (color: string) => {
    if (color === 'green') return 'bg-green-500';
    if (color === 'amber') return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-4" data-testid="diag-root">
      <h1 className="text-2xl font-semibold">Diagnostics</h1>
      
      <div className="space-y-3 bg-white dark:bg-gray-800 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">App Version:</span>
          <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{env.VITE_APP_VERSION}</code>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Network:</span>
          <span className={getBadgeClasses(online ? 'green' : 'red')}>
            <span className={`h-2 w-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} />
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Database (Dexie):</span>
          <span className={getBadgeClasses(dbOk === true ? 'green' : dbOk === false ? 'red' : 'amber')}>
            <span className={`h-2 w-2 rounded-full ${dbOk === true ? 'bg-green-500' : dbOk === false ? 'bg-red-500' : 'bg-amber-500'}`} />
            {dbOk === null ? 'Checking...' : dbOk ? 'Connected' : 'Unavailable'}
          </span>
        </div>
        
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Scale WS Bridge:</span>
            <span className={getBadgeClasses(bridge.statusBadgeColor)}>
              <span className={`h-2 w-2 rounded-full ${getStatusDot(bridge.statusBadgeColor)}`} />
              {wsOk ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-4">
            <div>Bridge URL: <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{bridge.bridgeUrl}</code></div>
            {bridge.packetAge !== null && (
              <div>Last packet: <span className={bridge.packetAge >= 5 ? 'text-amber-600' : ''}>{bridge.packetAge}s ago</span></div>
            )}
            {!wsOk && (
              <div className="mt-2 text-amber-600">
                Start bridge: <code className="bg-amber-50 px-1.5 py-0.5 rounded">pnpm run bridge:start</code> or <code className="bg-amber-50 px-1.5 py-0.5 rounded">pnpm run dev:with-bridge</code>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <div className="text-sm font-medium mb-2">Last Scale Message:</div>
        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded block break-all font-mono">
          {lastMsg || '(no messages yet)'}
        </code>
      </div>
    </div>
  );
}


