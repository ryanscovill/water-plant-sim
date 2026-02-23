interface AnalyzerTagProps {
  tag: string;
  value: number;
  unit: string;
  label: string;
  id?: string;
  x?: number;
  y?: number;
  alarm?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
  decimals?: number;
}

export function AnalyzerTag({ tag, value, unit, label, id, x = 0, y = 0, alarm, decimals = 2 }: AnalyzerTagProps) {
  const borderColor = alarm === 'CRITICAL' ? '#dc2626'
    : alarm === 'HIGH' ? '#f59e0b'
    : alarm === 'MEDIUM' ? '#facc15'
    : '#22d3ee';

  const textColor = alarm ? borderColor : '#6ee7b7';
  const animClass = alarm === 'CRITICAL' ? 'animate-flash' : alarm === 'HIGH' ? 'animate-slow-flash' : '';

  return (
    <g id={id} transform={`translate(${x}, ${y})`}>
      <rect x="-42" y="-18" width="84" height="50" rx="4"
        fill="#111827" stroke={borderColor} strokeWidth={alarm ? 2 : 1} />
      <text x="0" y="-6" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">
        {tag}
      </text>
      <text x="0" y="6" textAnchor="middle" fill={textColor} fontSize="14" fontFamily="monospace" fontWeight="bold" className={animClass}>
        {value.toFixed(decimals)}<tspan fontSize="11" fill="#9ca3af"> {unit}</tspan>
      </text>
      <text x="0" y="26" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">
        {label}
      </text>
    </g>
  );
}
