interface FlowMeterProps {
  value: number;
  unit: string;
  tag: string;
  id?: string;
  x?: number;
  y?: number;
  alarm?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
}

export function FlowMeter({ value, unit, tag, id, x = 0, y = 0, alarm }: FlowMeterProps) {
  const color = alarm === 'CRITICAL' ? '#dc2626'
    : alarm === 'HIGH' ? '#f59e0b'
    : '#22d3ee';

  const animClass = alarm === 'CRITICAL' ? 'animate-flash' : alarm === 'HIGH' ? 'animate-slow-flash' : '';

  return (
    <g id={id} transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="0" r="22" fill="#111827" stroke={color} strokeWidth="2" />
      {/* Diamond inside */}
      <polygon points="0,-12 12,0 0,12 -12,0" fill="none" stroke={color} strokeWidth="1.5" />
      <text x="0" y="3" textAnchor="middle" fill={color} fontSize="11" fontFamily="monospace" className={animClass}>
        FIT
      </text>
      <text x="0" y="36" textAnchor="middle" fill={color} fontSize="13" fontFamily="monospace" fontWeight="bold" className={animClass}>
        {value.toFixed(2)} {unit}
      </text>
    </g>
  );
}
