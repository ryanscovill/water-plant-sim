interface BarScreenProps {
  diffPressure: number;   // inches H2O
  rakeRunning: boolean;
  id?: string;
  onClick?: () => void;
  x?: number;
  y?: number;
  selected?: boolean;
}

export function BarScreen({ diffPressure, rakeRunning, id, onClick, x = 0, y = 0, selected }: BarScreenProps) {
  const highDP = diffPressure > 15;
  const barColor = highDP ? '#f59e0b' : '#9ca3af';

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
        <rect x="-22" y="-32" width="44" height="74" rx="4" fill="transparent" stroke="#22d3ee"
          strokeWidth="2.5" strokeDasharray="5,3" className="interactive-ring" />
      )}

      {/* Channel walls */}
      <rect x="-18" y="-26" width="36" height="62" rx="2" fill="#111827" stroke="#374151" strokeWidth="1.5" />

      {/* Vertical bars */}
      {[-10, -5, 0, 5, 10].map((bx) => (
        <line key={bx} x1={bx} y1="-22" x2={bx} y2="28" stroke={barColor} strokeWidth="2" strokeLinecap="round" />
      ))}

      {/* Top crossbar */}
      <line x1="-12" y1="-20" x2="12" y2="-20" stroke={barColor} strokeWidth="2" />
      {/* Bottom crossbar */}
      <line x1="-12" y1="26" x2="12" y2="26" stroke={barColor} strokeWidth="2" />

      {/* Rake mechanism */}
      <g className={rakeRunning ? 'animate-rake' : ''}>
        <rect x="-14" y="-28" width="28" height="5" rx="1" fill="#4b5563" stroke="#6b7280" strokeWidth="1" />
        {/* Rake teeth */}
        {[-8, -3, 2, 7].map((tx) => (
          <line key={tx} x1={tx} y1="-23" x2={tx} y2="-18" stroke="#6b7280" strokeWidth="1.5" />
        ))}
      </g>

      {/* DP value */}
      <text x="0" y="48" textAnchor="middle" fill={highDP ? '#f59e0b' : '#9ca3af'} fontSize="11" fontFamily="monospace">
        {diffPressure.toFixed(1)} inH2O
      </text>

      {/* Label */}
      <text x="0" y="60" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">
        BAR SCREEN
      </text>

      <style>{`
        @keyframes rake-cycle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-rake { animation: rake-cycle 2s ease-in-out infinite; }
      `}</style>
    </g>
  );
}
