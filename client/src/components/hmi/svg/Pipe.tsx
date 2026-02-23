interface PipeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  flowing?: boolean;
  color?: string;
  strokeWidth?: number;
}

export function Pipe({ x1, y1, x2, y2, flowing = true, color = '#374151', strokeWidth = 6 }: PipeProps) {
  return (
    <g>
      {/* Background pipe */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {/* Animated flow dashes */}
      {flowing && (
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#60a5fa"
          strokeWidth={strokeWidth - 3}
          strokeLinecap="round"
          strokeDasharray="8 6"
          className="animate-flow"
          opacity="0.7"
        />
      )}
    </g>
  );
}
