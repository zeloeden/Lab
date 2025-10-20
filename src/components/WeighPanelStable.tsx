import { useEffect, useMemo, useState } from 'react';
import { useScaleWS } from '@/lib/scale/useScaleStable';

export function WeighPanelStable(props: {
  targetG: number;
  tolAbsG: number;
  autoTare?: boolean;
  enabled: boolean;
  onConfirm: (capturedG: number) => void;
  onHardStop: (valueG: number) => void;
}) {
  const { targetG, tolAbsG, enabled, onConfirm, onHardStop } = props;
  const scale = useScaleWS('ws://127.0.0.1:8787');
  const [zeroed, setZeroed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setZeroed(false);
      return;
    }
    
    // Continuously check for zero (not just once!)
    const ok =
      scale.status === 'stable' &&
      scale.displayWeight !== null &&
      Math.abs(scale.displayWeight) <= 0.002;
    
    if (ok) {
      setZeroed(true);
    }
  }, [enabled, scale]); // ← Reruns when scale updates!

  useEffect(() => {
    if (!enabled) return;
    if (
      scale.status === 'stable' &&
      scale.displayWeight !== null &&
      scale.displayWeight > targetG + tolAbsG
    ) {
      onHardStop(scale.displayWeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, enabled]);

  const within = useMemo(() => {
    if (scale.status !== 'stable' || scale.displayWeight === null) return false;
    return Math.abs(scale.displayWeight - targetG) <= tolAbsG;
  }, [scale, targetG, tolAbsG]);

  const connected = scale.status !== 'idle';

  return (
    <div className="p-4 rounded-2xl border">
      {/* Status indicators */}
      <div className="flex gap-2 items-center flex-wrap">
        <span
          className={`inline-flex items-center gap-1 text-sm ${
            connected ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          {connected ? 'Scale Connected' : 'Scale Disconnected'}
        </span>

        <span
          className={
            scale.status === 'stable'
              ? 'text-green-600 font-semibold'
              : scale.status === 'live'
              ? 'text-amber-600'
              : 'text-gray-600'
          }
        >
          {scale.status === 'stable'
            ? '● Stable'
            : scale.status === 'live'
            ? '○ Live'
            : '○ Idle'}
        </span>

        <span className={zeroed ? 'text-green-600' : 'text-gray-600'}>
          {zeroed ? 'Zero OK' : 'Waiting zero…'}
        </span>
      </div>

      {/* Weight display with raw/display split */}
      <div className="mt-4 flex items-end gap-4">
        <div className="flex-1">
          <div className="text-sm text-gray-500 mb-1">Display Weight</div>
          <div className="text-4xl tabular-nums font-semibold">
            {scale.displayWeight == null
              ? '--'
              : scale.displayWeight.toFixed(3)}{' '}
            <span className="text-base">{scale.unit ?? 'g'}</span>
          </div>
          {scale.rawWeight != null && scale.status !== 'stable' && (
            <div className="text-xs text-muted-foreground mt-1">
              Live: {scale.rawWeight.toFixed(3)} {scale.unit ?? 'g'}
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">Target</div>
          <div className="text-2xl tabular-nums font-medium">
            {targetG.toFixed(3)} g
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">Δ</div>
          <div
            className={`text-2xl tabular-nums font-medium ${
              scale.displayWeight !== null &&
              Math.abs(scale.displayWeight - targetG) <= tolAbsG
                ? 'text-green-600'
                : 'text-gray-900'
            }`}
          >
            {scale.displayWeight == null
              ? '--'
              : (scale.displayWeight - targetG).toFixed(3)}{' '}
            g
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <button
        className="mt-4 px-4 py-2 rounded bg-black text-white disabled:opacity-50 w-full"
        disabled={!enabled || !zeroed || !within}
        onClick={() =>
          scale.displayWeight !== null && onConfirm(scale.displayWeight)
        }
      >
        Confirm Step
      </button>
    </div>
  );
}

