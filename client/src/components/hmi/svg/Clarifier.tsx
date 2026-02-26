interface ClarifierProps {
  turbidity: number;      // NTU
  sludgeLevel: number;    // feet
  maxSludge?: number;     // feet
  id?: string;
  x?: number;
  y?: number;
  r?: number;
}

export function Clarifier({ turbidity, sludgeLevel, maxSludge = 8, id, x = 0, y = 0, r = 40 }: ClarifierProps) {
  const sludgePct = Math.min(1, sludgeLevel / maxSludge);
  const sludgeHeight = sludgePct * r;
  const waterColor = turbidity > 10 ? '#92400e'
    : turbidity > 5 ? '#b45309'
    : turbidity > 2 ? '#1d4ed8'
    : '#1e40af';

  return (
    <g id={id} transform={`translate(${x}, ${y})`}>
      {/* Clarifier tank */}
      <ellipse cx="0" cy="0" rx={r} ry={r * 0.4} fill="none" stroke="#374151" strokeWidth="2" />
      <rect x={-r} y="0" width={r * 2} height={r * 0.8} fill="none" stroke="#374151" strokeWidth="2" />
      <ellipse cx="0" cy={r * 0.8} rx={r} ry={r * 0.4} fill="#111827" stroke="#374151" strokeWidth="2" />
      {/* Water fill */}
      <rect x={-r + 2} y="0" width={r * 2 - 4} height={r * 0.8} fill={waterColor} opacity="0.4" />
      <ellipse cx="0" cy="0" rx={r - 2} ry={r * 0.38} fill={waterColor} opacity="0.4" />
      {/* Sludge blanket */}
      <rect x={-r + 2} y={r * 0.8 - sludgeHeight} width={r * 2 - 4} height={sludgeHeight} fill="#78350f" opacity="0.7" />
      {/* Center well */}
      <rect x="-8" y="-12" width="16" height={r * 0.8 + 12} fill="#1f2937" stroke="#4b5563" strokeWidth="1" />
      {/* Labels */}
      <text x="0" y={-r * 0.5} textAnchor="middle" fill="#9ca3af" fontSize="12" fontFamily="monospace">CLARIFIER</text>
    </g>
  );
}
