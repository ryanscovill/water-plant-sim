import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Alarm } from '../../types/process';
import { formatTPlus } from '../../utils/formatTPlus';

interface TrendPoint {
  timestamp: string;
  value: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  tag: string;
  unit?: string;
  decimals?: number;
  highLimit?: number;
  lowLimit?: number;
  yMin?: number;
  yMax?: number;
  height?: number;
  activeAlarms?: Alarm[];
  events?: Array<{ ts: number; type: string; description: string }>;
  simStartTime?: number;
}


const EVENT_LINE_COLOR: Record<string, string> = {
  pump:             '#1d4ed8',
  valve:            '#0e7490',
  setpoint:         '#7e22ce',
  backwash:         '#b45309',
  clearScreen:      '#15803d',
  simulation:       '#c2410c',
  'alarm-CRITICAL': '#ef4444',
  'alarm-HIGH':     '#f59e0b',
  'alarm-MEDIUM':   '#eab308',
  'alarm-LOW':      '#60a5fa',
  'alarm-cleared':  '#6b7280',
};

const EVENT_LABEL: Record<string, string> = {
  pump:             'Pump',
  valve:            'Valve',
  setpoint:         'Setpoint',
  backwash:         'Backwash',
  clearScreen:      'Clear Screen',
  simulation:       'Simulation',
  'alarm-CRITICAL': 'Alarm Critical',
  'alarm-HIGH':     'Alarm High',
  'alarm-MEDIUM':   'Alarm Medium',
  'alarm-LOW':      'Alarm Low',
  'alarm-cleared':  'Alarm Cleared',
};

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

export function TrendChart({ data, tag, unit = '', decimals = 2, highLimit, lowLimit, yMin, yMax, height = 200, activeAlarms = [], events = [], simStartTime }: TrendChartProps) {
  const formatted = data.map((p) => ({
    ts: new Date(p.timestamp).getTime(),
    value: Number(p.value.toFixed(3)),
  }));

  const tPlus = (ts: number) =>
    simStartTime != null ? formatTPlus(ts, simStartTime) : new Date(ts).toLocaleTimeString();

  // Highest-priority alarm for this tag drives line color
  const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const topAlarm = activeAlarms.length > 0
    ? activeAlarms.slice().sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority))[0]
    : null;

  const lineColor = topAlarm ? ALARM_LINE_COLOR[topAlarm.priority] : '#60a5fa';
  const borderClass = topAlarm ? ALARM_BORDER[topAlarm.priority] : 'border-gray-700';

  // Threshold for snapping tooltip to a nearby event: 2% of the visible time range
  const tsRange = formatted.length >= 2 ? formatted[formatted.length - 1].ts - formatted[0].ts : 60_000;
  const eventSnapThreshold = tsRange * 0.02;

  const CustomTooltip = ({ active, label, payload }: { active?: boolean; label?: number; payload?: Array<{ value: number }> }) => {
    if (!active || label == null) return null;
    const nearbyEvents = events.filter((ev) => Math.abs(ev.ts - label) <= eventSnapThreshold);
    const borderColor = nearbyEvents.length ? (EVENT_LINE_COLOR[nearbyEvents[0].type] ?? '#6b7280') : '#374151';
    return (
      <div style={{ backgroundColor: '#1f2937', border: `1px solid ${borderColor}`, borderRadius: 4, padding: '6px 10px', fontSize: 13, fontFamily: 'monospace' }}>
        <div style={{ color: '#9ca3af', marginBottom: 2 }}>{tPlus(label)}</div>
        {payload?.[0] != null && (
          <div style={{ color: lineColor }}>{payload[0].value} {unit}</div>
        )}
        {nearbyEvents.map((ev, i) => {
          const evColor = EVENT_LINE_COLOR[ev.type] ?? '#6b7280';
          return (
            <div key={i} style={{ color: evColor, marginTop: 4, borderTop: `1px solid ${evColor}40`, paddingTop: 4 }}>
              ▲ {ev.description}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`bg-gray-900 border rounded-lg p-3 ${borderClass}`}>
      <div className="text-sm text-gray-400 font-mono mb-2">
        {tag} {unit && `(${unit})`}
        {data.length > 0 && (
          <span className="ml-3 text-gray-200">{data[data.length - 1].value.toFixed(decimals)} {unit}</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={formatted} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v) => tPlus(v)}
            tick={{ fill: '#6b7280', fontSize: 13 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fill: '#6b7280', fontSize: 13 }} domain={yMin !== undefined && yMax !== undefined ? [yMin, yMax] : ['auto', 'auto']} />
          <Tooltip content={<CustomTooltip />} />
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
          {events.map((ev, i) => {
            const evColor = EVENT_LINE_COLOR[ev.type] ?? '#6b7280';
            return (
              <ReferenceLine
                key={i}
                x={ev.ts}
                stroke={evColor}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                label={{ value: '▲', fill: evColor, fontSize: 10, position: 'insideTopLeft' }}
              />
            );
          })}
          <Line
            type="monotone" dataKey="value" stroke={lineColor} strokeWidth={1.5}
            dot={false} activeDot={{ r: 4, fill: lineColor }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {events.length > 0 && (() => {
        const presentTypes = [...new Set(events.map((ev) => ev.type))];
        return (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-gray-800">
            {presentTypes.map((type) => {
              const color = EVENT_LINE_COLOR[type] ?? '#6b7280';
              const label = EVENT_LABEL[type] ?? type;
              return (
                <div key={type} className="flex items-center gap-1.5 text-xs font-mono">
                  <svg width="18" height="10">
                    <line x1="0" y1="5" x2="18" y2="5" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" />
                    <text x="9" y="9" textAnchor="middle" fill={color} fontSize="7">▲</text>
                  </svg>
                  <span style={{ color }}>{label}</span>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
