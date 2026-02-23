import type { EquipmentStatus } from '../../../types/process';

interface ChemFeedProps {
  status: EquipmentStatus;
  doseRate: number;
  unit: string;
  label: string;
  id?: string;
  onClick?: () => void;
  x?: number;
  y?: number;
  selected?: boolean;
}

export function ChemFeed({ status, doseRate, unit, label, id, onClick, x = 0, y = 0, selected }: ChemFeedProps) {
  const color = status.fault ? '#dc2626' : status.running ? '#a855f7' : '#6b7280';

  return (
    <g id={id} transform={`translate(${x}, ${y})`} onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      data-interactive={onClick ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}>
      {/* Clickable ring indicator */}
      {onClick && (
        <rect x="-19" y="-31" width="38" height="55" rx="4" fill="none" stroke="#22d3ee"
          strokeWidth="1.5" strokeDasharray="5,3" className="interactive-ring" />
      )}
      {/* Chemical drum */}
      <ellipse cx="0" cy="-20" rx="14" ry="6" fill={color} stroke="#374151" strokeWidth="1.5" />
      <rect x="-14" y="-20" width="28" height="28" fill={color} stroke="#374151" strokeWidth="1.5" />
      <ellipse cx="0" cy="8" rx="14" ry="6" fill={color} stroke="#374151" strokeWidth="1.5" />
      {/* Feed line */}
      <line x1="0" y1="8" x2="0" y2="20" stroke="#9ca3af" strokeWidth="2" />
      {/* Pump indicator */}
      {status.running && (
        <circle cx="0" cy="25" r="5" fill="#22d3ee" opacity="0.8" className="animate-slow-flash" />
      )}
      <text x="0" y="40" textAnchor="middle" fill="#9ca3af" fontSize="12" fontFamily="monospace">
        {label}
      </text>
      <text x="0" y="52" textAnchor="middle" fill="#a855f7" fontSize="13" fontFamily="monospace" fontWeight="bold">
        {doseRate.toFixed(1)} {unit}
      </text>
    </g>
  );
}
