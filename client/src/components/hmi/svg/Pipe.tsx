import { useRef, useEffect } from 'react';

interface PipeProps {
  x1: number | string;
  y1: number | string;
  x2: number | string;
  y2: number | string;
  flowing?: boolean;
  filled?: boolean;
  flowRate?: number;
  maxFlow?: number;
  color?: string;
  strokeWidth?: number;
}

export function Pipe({ x1, y1, x2, y2, flowing = true, filled = false, flowRate, maxFlow = 10, color = '#374151', strokeWidth = 6 }: PipeProps) {
  const lineRef = useRef<SVGLineElement>(null);
  const offsetRef = useRef(0);
  const flowRateRef = useRef(flowRate);
  flowRateRef.current = flowRate;

  useEffect(() => {
    if (!flowing || !lineRef.current) return;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      // 7 px/s at zero flow up to 35 px/s at max flow (dash cycle = 14px)
      const rate = flowRateRef.current;
      const speed = rate != null
        ? 7 + (Math.min(rate, maxFlow) / maxFlow) * 28
        : 17.5;
      offsetRef.current = (offsetRef.current + speed * dt) % 14;
      lineRef.current?.setAttribute('stroke-dashoffset', String(-offsetRef.current));
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [flowing, maxFlow]);

  return (
    <g>
      {/* Background pipe */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Animated flow dashes */}
      {flowing && (
        <line
          ref={lineRef}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#60a5fa"
          strokeWidth={strokeWidth - 3}
          strokeLinecap="round"
          strokeDasharray="8 6"
          opacity="0.7"
        />
      )}
      {/* Static water fill (no animation) */}
      {!flowing && filled && (
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#60a5fa"
          strokeWidth={strokeWidth - 3}
          strokeLinecap="round"
          opacity="0.4"
        />
      )}
    </g>
  );
}
