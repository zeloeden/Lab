import { useEffect, useMemo, useState } from 'react';
import { useScale } from '@/lib/scale/useScale';

export function WeighPanel(props: {
  targetG: number;
  tolAbsG: number;
  autoTare?: boolean;
  enabled: boolean;
  onConfirm: (capturedG: number) => void;
  onHardStop: (valueG: number) => void;
}) {
  const { targetG, tolAbsG, autoTare=true, enabled, onConfirm, onHardStop } = props;
  const { supported, connected, reading, error, connect, autoConnect, tare } = useScale();
  const [zeroed,setZeroed] = useState(false);

  useEffect(()=>{
    (async ()=>{
      if (!enabled) { setZeroed(false); return; }
      // try silent auto connect first (user may have granted permission earlier)
      if (!connected) await autoConnect();
      if (autoTare) await tare();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(()=>{
    if (!enabled) return;
    const ok = reading.stable && Math.abs(reading.valueG) <= 0.002;
    if (ok) setZeroed(true);
  }, [enabled, reading]);

  useEffect(()=>{
    if (!enabled) return;
    if (reading.stable && reading.valueG > targetG + tolAbsG) onHardStop(reading.valueG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading, enabled]);

  const within = useMemo(()=> {
    if (!reading.stable) return false;
    return Math.abs(reading.valueG - targetG) <= tolAbsG;
  }, [reading, targetG, tolAbsG]);

  return (
    <div className="p-4 rounded-2xl border">
      <div className="flex gap-2 items-center">
        <button className="px-3 py-1 border rounded" onClick={connect} disabled={connected}>
          {connected ? 'Scale Connected' : 'Connect Scale'}
        </button>
        <span className={`inline-flex items-center gap-1 text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          {connected ? 'Connected' : 'Not connected'}
        </span>
        <button className="px-3 py-1 border rounded" onClick={tare}>Auto-TARE</button>
        <span className={reading.stable ? 'text-green-600' : 'text-gray-600'}>{reading.stable ? 'Stable' : 'Unstable'}</span>
        <span className={zeroed ? 'text-green-600' : 'text-gray-600'}>{zeroed ? 'Zero OK' : 'Waiting zero…'}</span>
        {!supported && (
          <span className="text-red-600 text-sm">Web Serial not supported. Use Chrome/Edge.</span>
        )}
        {error && (
          <span className="text-red-600 text-sm">{error}</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>Target: <b>{targetG.toFixed(3)} g</b></div>
        <div>Current: <b>{reading.raw ? reading.valueG.toFixed(3) : '--'} g</b></div>
        <div>Δ: <b>{reading.raw ? (reading.valueG - targetG).toFixed(3) : '--'} g</b></div>
      </div>

      <button
        className="mt-4 px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        disabled={!enabled || !zeroed || !within}
        onClick={()=> onConfirm(reading.valueG)}
      >
        Confirm Step
      </button>
    </div>
  );
}


