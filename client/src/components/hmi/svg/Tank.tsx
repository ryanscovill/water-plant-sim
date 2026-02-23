interface TankProps {
  level: number;       // 0-100%
  maxLevel: number;    // actual max in units
  currentLevel: number; // actual value
  unit: string;
  label: string;
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export function Tank({ level, label, currentLevel, unit, id, x = 0, y = 0, width = 50, height = 80 }: TankProps) {
  const fillH = Math.max(0, Math.min(1, level / 100)) * (height - 10);
  const fillY = height - 5 - fillH;

  const fillColor = level > 85 ? '#dc2626'
    : level > 70 ? '#f59e0b'
    : level < 15 ? '#dc2626'
    : '#2563eb';

  return (
    <g id={id} transform={`translate(${x}, ${y})`}>
      {/* Tank outline */}
      <rect x="0" y="5" width={width} height={height - 5} rx="3" fill="#111827" stroke="#374151" strokeWidth="2" />
      {/* Fill level */}
      <rect x="2" y={fillY} width={width - 4} height={fillH} rx="2" fill={fillColor} opacity="0.85" />
      {/* Level grid lines */}
      {[25, 50, 75].map((pct) => (
        <line
          key={pct}
          x1="2" y1={height - 5 - (pct / 100) * (height - 10)}
          x2={width - 2} y2={height - 5 - (pct / 100) * (height - 10)}
          stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2"
        />
      ))}
      {/* Label */}
      <text x={width / 2} y={-4} textAnchor="middle" fill="#9ca3af" fontSize="13" fontFamily="monospace">
        {label}
      </text>
      {/* Value */}
      <text x={width / 2} y={height + 14} textAnchor="middle" fill="#6ee7b7" fontSize="13" fontFamily="monospace">
        {currentLevel.toFixed(1)} {unit}
      </text>
    </g>
  );
}
