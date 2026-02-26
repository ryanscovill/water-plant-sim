import type { EquipmentStatus } from '../../../types/process';

interface PumpProps {
  status: EquipmentStatus;
  label: string;
  id?: string;
  onClick?: () => void;
  x?: number;
  y?: number;
  selected?: boolean;
}

export function Pump({ status, label, id, onClick, x = 0, y = 0, selected }: PumpProps) {
  const color = status.fault ? '#dc2626'
    : status.running ? '#2563eb'
    : '#6b7280';

  const isSpinning = status.running && !status.fault && status.speed > 0;
  const animStyle = isSpinning
    ? { animationDuration: `${100 / status.speed}s` }
    : undefined;

  return (
    <g
      id={id}
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      data-interactive={onClick ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
    >
      {/* Clickable ring indicator */}
      {onClick && (
        <circle cx="0" cy="0" r="23" fill="transparent" stroke="#22d3ee" strokeWidth="2.5"
          strokeDasharray="5,3" className="interactive-ring" />
      )}
      {/* Pump body circle */}
      <circle cx="0" cy="0" r="18" fill={color} stroke="#374151" strokeWidth="2" />
      {/* Impeller blades */}
      <g className={isSpinning ? 'animate-rotate' : ''} style={{ transformOrigin: '0px 0px', ...animStyle }}>
        <line x1="0" y1="-12" x2="0" y2="0" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="6" x2="0" y2="0" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="-10" y1="6" x2="0" y2="0" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* Fault X */}
      {status.fault && (
        <g>
          <line x1="-8" y1="-8" x2="8" y2="8" stroke="white" strokeWidth="2.5" />
          <line x1="8" y1="-8" x2="-8" y2="8" stroke="white" strokeWidth="2.5" />
        </g>
      )}
      {/* Label */}
      <text x="0" y="30" textAnchor="middle" fill="#9ca3af" fontSize="13" fontFamily="monospace">
        {label}
      </text>
    </g>
  );
}
