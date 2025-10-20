import { useScaleWS } from '@/lib/scale/useScaleStable';

export function ScaleStatusChip() {
  const s = useScaleWS('ws://127.0.0.1:8787');
  
  const color =
    s.status === 'stable'
      ? 'bg-green-500'
      : s.status === 'live'
      ? 'bg-amber-500'
      : 'bg-gray-400';

  const label =
    s.status === 'stable'
      ? 'Stable'
      : s.status === 'live'
      ? 'Live'
      : 'Idle';

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
      <span className="text-gray-600 dark:text-gray-300">Scale</span>
      {s.displayWeight != null && (
        <span className="tabular-nums font-medium">
          {s.displayWeight.toFixed(3)} {s.unit ?? 'g'}
        </span>
      )}
      <span className="text-[10px] text-gray-400">({label})</span>
    </div>
  );
}

