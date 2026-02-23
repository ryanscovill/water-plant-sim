import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Alarm } from '../../types/process';

interface TrendPoint {
  timestamp: string;
  value: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  tag: string;
  unit?: string;
  highLimit?: number;
  lowLimit?: number;
  height?: number;
  activeAlarms?: Alarm[];
  events?: Array<{ time: string; description: string }>;
}

const ALARM_LINE_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f59e0b',
  MEDIUM:   '#eab308',
  LOW:      '#60a5fa',
};

const ALARM_BORDER: Record<string, string> = {
  CRITICAL: 'border-red-500',
  HIGH:     'border-amber-500',
  MEDIUM:   'border-yellow-500',
  LOW:      'border-blue-400',
};

export function TrendChart({ data, tag, unit = '', highLimit, lowLimit, height = 200, activeAlarms = [], events = [] }: TrendChartProps) {
  const formatted = data.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString(),
    value: Number(p.value.toFixed(3)),
  }));

  // Highest-priority alarm for this tag drives line color
  const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const topAlarm = activeAlarms.length > 0
    ? activeAlarms.slice().sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority))[0]
    : null;

  const lineColor = topAlarm ? ALARM_LINE_COLOR[topAlarm.priority] : '#60a5fa';
  const borderClass = topAlarm ? ALARM_BORDER[topAlarm.priority] : 'border-gray-700';

  return (
    <div className={`bg-gray-900 border rounded-lg p-3 ${borderClass}`}>
      <div className="text-sm text-gray-400 font-mono mb-2">{tag} {unit && `(${unit})`}</div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={formatted} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 13 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#6b7280', fontSize: 13 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: 14 }}
            labelStyle={{ color: '#9ca3af' }}
            itemStyle={{ color: lineColor }}
          />
          {highLimit !== undefined && (
            <ReferenceLine y={highLimit} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `H: ${highLimit}`, fill: '#f59e0b', fontSize: 12 }} />
          )}
          {lowLimit !== undefined && (
            <ReferenceLine y={lowLimit} stroke="#3b82f6" strokeDasharray="4 2" label={{ value: `L: ${lowLimit}`, fill: '#3b82f6', fontSize: 12 }} />
          )}
          {/* Reference lines for each active alarm threshold */}
          {activeAlarms.map((alarm) => {
            const isHigh = alarm.condition === 'H' || alarm.condition === 'HH';
            const color = ALARM_LINE_COLOR[alarm.priority];
            return (
              <ReferenceLine
                key={alarm.id}
                y={alarm.setpoint}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="6 3"
                label={{ value: `${alarm.condition}: ${alarm.setpoint}`, fill: color, fontSize: 11, position: isHigh ? 'insideTopRight' : 'insideBottomRight' }}
              />
            );
          })}
          {events.map((ev, i) => (
            <ReferenceLine
              key={i}
              x={ev.time}
              stroke="#a855f7"
              strokeWidth={1}
              strokeDasharray="3 3"
              label={{ value: '▲', fill: '#a855f7', fontSize: 10, position: 'insideTopLeft' }}
            />
          ))}
          <Line
            type="monotone" dataKey="value" stroke={lineColor} strokeWidth={1.5}
            dot={false} activeDot={{ r: 4, fill: lineColor }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
