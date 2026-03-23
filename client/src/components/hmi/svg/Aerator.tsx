interface AeratorProps {
  doLevel: number;        // mg/L
  blowersRunning: boolean;
  width?: number;
  height?: number;
  id?: string;
  x?: number;
  y?: number;
}

export function Aerator({ doLevel, blowersRunning, width = 120, height = 60, id, x = 0, y = 0 }: AeratorProps) {
  // Water color: low DO = darker blue-gray, normal DO = blue-green
  const waterColor = doLevel < 1.0 ? '#334155'   // very low DO — dark slate
    : doLevel < 1.5 ? '#475569'                   // low DO — slate
    : doLevel < 2.5 ? '#0e7490'                   // normal — cyan-ish
    : '#059669';                                   // high DO — emerald

  const bubbleColumns = [0.2, 0.4, 0.6, 0.8];

  return (
    <g id={id} transform={`translate(${x}, ${y})`}>
      {/* Basin outline */}
      <rect x="0" y="0" width={width} height={height} rx="3" fill="#111827" stroke="#374151" strokeWidth="2" />

      {/* Water fill */}
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="2" fill={waterColor} opacity="0.5" />

      {/* Diffuser pipes at bottom */}
      <line x1="10" y1={height - 6} x2={width - 10} y2={height - 6} stroke="#6b7280" strokeWidth="2" strokeDasharray="4,3" />

      {/* Bubble columns (animated when blowers running) */}
      {blowersRunning && bubbleColumns.map((pct, i) => {
        const bx = pct * width;
        return (
          <g key={i} className={`bubble-col-${i}`}>
            {[0, 1, 2, 3, 4].map((bi) => (
              <circle
                key={bi}
                cx={bx + (bi % 2 === 0 ? -2 : 2)}
                cy={height - 10 - bi * 10}
                r={1.5 + (bi % 2) * 0.5}
                fill="white"
                opacity={0.3 + bi * 0.1}
                className={`animate-bubble-${i}`}
              />
            ))}
          </g>
        );
      })}

      {/* DO value display */}
      <rect x={width / 2 - 28} y={height / 2 - 10} width="56" height="20" rx="3" fill="#0f172a" opacity="0.85" />
      <text
        x={width / 2}
        y={height / 2 + 5}
        textAnchor="middle"
        fill={doLevel < 1.0 ? '#f87171' : doLevel < 1.5 ? '#fbbf24' : '#6ee7b7'}
        fontSize="12"
        fontFamily="monospace"
        fontWeight="bold"
      >
        {doLevel.toFixed(1)} mg/L
      </text>

      {/* Label */}
      <text x={width / 2} y={height + 14} textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">
        AERATION BASIN
      </text>

      <style>{`
        @keyframes bubble-rise-0 {
          0% { transform: translateY(0px); opacity: 0.3; }
          100% { transform: translateY(-${height - 16}px); opacity: 0; }
        }
        @keyframes bubble-rise-1 {
          0% { transform: translateY(0px); opacity: 0.3; }
          100% { transform: translateY(-${height - 16}px); opacity: 0; }
        }
        @keyframes bubble-rise-2 {
          0% { transform: translateY(0px); opacity: 0.3; }
          100% { transform: translateY(-${height - 16}px); opacity: 0; }
        }
        @keyframes bubble-rise-3 {
          0% { transform: translateY(0px); opacity: 0.3; }
          100% { transform: translateY(-${height - 16}px); opacity: 0; }
        }
        .animate-bubble-0 { animation: bubble-rise-0 2.0s ease-out infinite; }
        .animate-bubble-1 { animation: bubble-rise-1 2.3s ease-out infinite 0.3s; }
        .animate-bubble-2 { animation: bubble-rise-2 1.8s ease-out infinite 0.6s; }
        .animate-bubble-3 { animation: bubble-rise-3 2.5s ease-out infinite 0.1s; }
      `}</style>
    </g>
  );
}
