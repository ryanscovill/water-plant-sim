import { TrendingUp } from 'lucide-react';

interface ValueDisplayProps {
  label: string;
  value: number | string;
  unit?: string;
  decimals?: number;
  alarm?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
  id?: string;
  onTrendClick?: () => void;
}

export function ValueDisplay({ label, value, unit, decimals = 2, alarm, id, onTrendClick }: ValueDisplayProps) {
  const numVal = typeof value === 'number' ? value.toFixed(decimals) : value;

  const alarmColor = alarm === 'CRITICAL' ? 'text-red-400 animate-flash'
    : alarm === 'HIGH' ? 'text-amber-400 animate-slow-flash'
    : alarm === 'MEDIUM' ? 'text-yellow-300'
    : alarm === 'LOW' ? 'text-blue-300'
    : 'text-green-300';

  return (
    <div id={id} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 min-w-[90px]">
      <div className="flex items-center gap-1">
        <span className="text-gray-300 text-xs uppercase tracking-wider flex-1">{label}</span>
        {onTrendClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onTrendClick(); }}
            className="text-gray-500 hover:text-blue-400 cursor-pointer shrink-0"
            title="View trend"
          >
            <TrendingUp size={10} />
          </button>
        )}
      </div>
      <div className={`font-mono text-sm font-bold ${alarmColor}`}>
        {numVal}{unit && <span className="text-gray-300 text-xs ml-1">{unit}</span>}
      </div>
    </div>
  );
}
