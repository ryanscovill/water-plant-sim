import type { EquipmentStatus } from '../../../types/process';

interface MixerProps {
  status: EquipmentStatus;
  label: string;
  id?: string;
  onClick?: () => void;
  x?: number;
  y?: number;
  size?: number;
  selected?: boolean;
  speed?: 'rapid' | 'slow';
}

export function Mixer({ status, label, id, onClick, x = 0, y = 0, size = 20, selected, speed = 'rapid' }: MixerProps) {
  const color = status.fault ? '#dc2626' : status.running ? '#16a34a' : '#6b7280';
  const animClass = status.running && !status.fault
    ? (speed === 'slow' ? 'animate-rotate-slow' : 'animate-rotate')
    : '';

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
        <rect x={-size * 0.6 - 5} y={-size * 0.6 - 5} width={size * 1.2 + 10} height={size * 1.2 + 10}
          rx="6" fill="transparent" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="5,3" className="interactive-ring" />
      )}
      {/* Motor housing */}
      <rect x={-size * 0.6} y={-size * 0.6} width={size * 1.2} height={size * 1.2} rx="4"
        fill={color} stroke="#374151" strokeWidth="1.5" />
      {/* Impeller */}
      <g className={animClass} style={{ transformOrigin: '0px 0px' }}>
        <ellipse cx="0" cy="0" rx={size * 0.4} ry={size * 0.15} fill="none" stroke="white" strokeWidth="1.5" />
        <ellipse cx="0" cy="0" rx={size * 0.15} ry={size * 0.4} fill="none" stroke="white" strokeWidth="1.5" />
      </g>
      <text x="0" y={size + 12} textAnchor="middle" fill="#9ca3af" fontSize="12" fontFamily="monospace">
        {label}
      </text>
    </g>
  );
}
