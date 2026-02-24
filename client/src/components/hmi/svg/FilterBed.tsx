interface FilterBedProps {
  headLoss: number;       // feet
  maxHeadLoss?: number;   // feet (default 10)
  runTime: number;        // hours
  backwashInProgress: boolean;
  backwashTimeRemaining: number;
  id?: string;
  onClick?: () => void;
  x?: number;
  y?: number;
  selected?: boolean;
}

export function FilterBed({ headLoss, maxHeadLoss = 10, runTime, backwashInProgress, backwashTimeRemaining, id, onClick, x = 0, y = 0, selected }: FilterBedProps) {
  const fillPct = Math.min(1, headLoss / maxHeadLoss);
  const color = headLoss >= 8 ? '#dc2626' : headLoss >= 6 ? '#f59e0b' : '#2563eb';

  // Solids accumulation layer grows upward from media surface as filter plugs.
  // Headspace above media is 40px (y=-40 to y=0); leave at least 6px of clear water.
  const plugHeight = fillPct * 34;
  const plugColor = headLoss >= 8 ? '#7f1d1d' : headLoss >= 6 ? '#92400e' : '#a16207';
  const plugOpacity = 0.35 + fillPct * 0.55;

  return (
    <g id={id} transform={`translate(${x}, ${y})`} onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      data-interactive={onClick ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}>
      {/* Filter bed outline */}
      <rect x="-30" y="-40" width="60" height="80" rx="3" fill="#111827"
        stroke={onClick ? '#22d3ee' : '#374151'} strokeWidth={onClick ? 1.5 : 2}
        strokeDasharray={onClick ? '6,3' : undefined} className={onClick ? 'interactive-ring' : undefined} />
      {/* Media layers */}
      <rect x="-28" y="0" width="56" height="12" fill="#78716c" opacity="0.6" />
      <rect x="-28" y="12" width="56" height="10" fill="#a8a29e" opacity="0.6" />
      <rect x="-28" y="22" width="56" height="16" fill="#d4d4d8" opacity="0.4" />
      {/* Accumulated solids — grows up from media surface as head loss increases */}
      {plugHeight > 0.5 && (
        <rect x="-28" y={-plugHeight} width="56" height={plugHeight}
          fill={plugColor} opacity={plugOpacity} rx="1" />
      )}
      {/* Backwash indicator */}
      {backwashInProgress && (
        <text x="0" y="-26" textAnchor="middle" fill="#22d3ee" fontSize="11" className="animate-slow-flash">
          BACKWASH
        </text>
      )}
      {/* Labels */}
      <text x="0" y="-48" textAnchor="middle" fill="#9ca3af" fontSize="12" fontFamily="monospace">FILTER</text>
      <text x="0" y="52" textAnchor="middle" fill={color} fontSize="12" fontFamily="monospace">
        HL: {headLoss.toFixed(1)} ft
      </text>
      <text x="0" y="63" textAnchor="middle" fill="#6b7280" fontSize="12" fontFamily="monospace">
        RT: {runTime.toFixed(0)}h
      </text>
      {backwashInProgress && (
        <text x="0" y="74" textAnchor="middle" fill="#22d3ee" fontSize="12" fontFamily="monospace">
          {Math.ceil(backwashTimeRemaining)}s rem
        </text>
      )}
    </g>
  );
}
