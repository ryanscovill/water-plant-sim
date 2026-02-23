interface ValueDisplayProps {
  label: string;
  value: number | string;
  unit?: string;
  decimals?: number;
  alarm?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
  id?: string;
}

export function ValueDisplay({ label, value, unit, decimals = 2, alarm, id }: ValueDisplayProps) {
  const numVal = typeof value === 'number' ? value.toFixed(decimals) : value;

  const alarmColor = alarm === 'CRITICAL' ? 'text-red-400 animate-flash'
    : alarm === 'HIGH' ? 'text-amber-400 animate-slow-flash'
    : alarm === 'MEDIUM' ? 'text-yellow-300'
    : alarm === 'LOW' ? 'text-blue-300'
    : 'text-green-300';

  return (
    <div id={id} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 min-w-[90px]">
      <div className="text-gray-500 text-xs uppercase tracking-wider">{label}</div>
      <div className={`font-mono text-sm font-bold ${alarmColor}`}>
        {numVal}{unit && <span className="text-gray-400 text-xs ml-1">{unit}</span>}
      </div>
    </div>
  );
}
