import { useRef, useEffect } from 'react';

interface ContactChamberProps {
  flowing: boolean;
  residual: number;       // mg/L
  width?: number;
  height?: number;
  id?: string;
  x?: number;
  y?: number;
}

export function ContactChamber({ flowing, residual, width = 140, height = 70, id, x = 0, y = 0 }: ContactChamberProps) {
  const dashRef = useRef<SVGPolylineElement>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!flowing || !dashRef.current) return;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      offsetRef.current = (offsetRef.current + 15 * dt) % 14;
      dashRef.current?.setAttribute('stroke-dashoffset', String(-offsetRef.current));
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [flowing]);

  // Baffle layout: 3 internal baffles creating a zigzag path
  const baffleGap = 8;
  const baffleW = 2;
  const sections = 4;
  const sectionWidth = width / sections;

  // Build zigzag flow path through baffles
  const flowPath = [
    `${6},${6}`,                                    // start top-left
    `${sectionWidth - baffleGap / 2},${6}`,          // across to first baffle top
    `${sectionWidth - baffleGap / 2},${height - 6}`, // down
    `${sectionWidth + baffleGap / 2},${height - 6}`, // past first baffle bottom
    `${sectionWidth * 2 - baffleGap / 2},${height - 6}`, // across to second baffle bottom
    `${sectionWidth * 2 - baffleGap / 2},${6}`,     // up
    `${sectionWidth * 2 + baffleGap / 2},${6}`,     // past second baffle top
    `${sectionWidth * 3 - baffleGap / 2},${6}`,     // across to third baffle top
    `${sectionWidth * 3 - baffleGap / 2},${height - 6}`, // down
    `${sectionWidth * 3 + baffleGap / 2},${height - 6}`, // past third baffle bottom
    `${width - 6},${height - 6}`,                   // across to exit
    `${width - 6},${height / 2}`,                   // up to exit center
  ].join(' ');

  return (
    <g id={id} transform={`translate(${x}, ${y})`}>
      {/* Chamber outline */}
      <rect x="0" y="0" width={width} height={height} rx="3" fill="#111827" stroke="#374151" strokeWidth="2" />

      {/* Water fill */}
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="2" fill="#164e63" opacity="0.4" />

      {/* Internal baffles */}
      {[1, 2, 3].map((i) => {
        const bx = sectionWidth * i - baffleW / 2;
        // Alternate: odd baffles hang from top, even from bottom
        const fromTop = i % 2 === 1;
        return (
          <rect
            key={i}
            x={bx}
            y={fromTop ? 0 : baffleGap}
            width={baffleW}
            height={height - baffleGap}
            fill="#4b5563"
          />
        );
      })}

      {/* Animated flow path */}
      {flowing && (
        <polyline
          ref={dashRef}
          points={flowPath}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 6"
          opacity="0.6"
        />
      )}

      {/* Residual value */}
      <rect x={width / 2 - 30} y={height / 2 - 10} width="60" height="20" rx="3" fill="#0f172a" opacity="0.85" />
      <text
        x={width / 2}
        y={height / 2 + 5}
        textAnchor="middle"
        fill={residual < 0.2 ? '#f87171' : '#6ee7b7'}
        fontSize="12"
        fontFamily="monospace"
        fontWeight="bold"
      >
        {residual.toFixed(2)} mg/L
      </text>

      {/* Label */}
      <text x={width / 2} y={height + 14} textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">
        CONTACT CHAMBER
      </text>
    </g>
  );
}
