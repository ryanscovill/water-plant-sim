import type { ValveStatus } from '../../../types/process';

interface ValveProps {
  status: ValveStatus;
  label: string;
  id?: string;
  onClick?: () => void;
  x?: number;
  y?: number;
}

export function Valve({ status, label, id, onClick, x = 0, y = 0 }: ValveProps) {
  const color = status.fault ? '#dc2626'
    : status.open ? '#16a34a'
    : '#6b7280';

  return (
    <g
      id={id}
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      data-interactive={onClick ? 'true' : undefined}
    >
      {/* Clickable ring indicator */}
      {onClick && (
        <rect x="-19" y="-27" width="38" height="42" rx="4" fill="none" stroke="#22d3ee"
          strokeWidth="1.5" strokeDasharray="5,3" className="interactive-ring" />
      )}
      {/* Valve body - bow-tie shape */}
      <polygon points="-14,-10 14,-10 0,0" fill={color} stroke="#374151" strokeWidth="1.5" />
      <polygon points="-14,10 14,10 0,0" fill={color} stroke="#374151" strokeWidth="1.5" />
      {/* Stem */}
      <line x1="0" y1="-15" x2="0" y2="-10" stroke="#9ca3af" strokeWidth="2" />
      {/* Handwheel */}
      <rect x="-8" y="-22" width="16" height="7" rx="2" fill="#374151" stroke="#9ca3af" strokeWidth="1" />
      {/* Open indicator */}
      {status.open && (
        <line x1="-8" y1="0" x2="8" y2="0" stroke="white" strokeWidth="1.5" strokeDasharray="3,2" />
      )}
      <text x="0" y="22" textAnchor="middle" fill="#9ca3af" fontSize="13" fontFamily="monospace">
        {label}
      </text>
    </g>
  );
}
