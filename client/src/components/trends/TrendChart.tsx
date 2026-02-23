import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

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
}

export function TrendChart({ data, tag, unit = '', highLimit, lowLimit, height = 200 }: TrendChartProps) {
  const formatted = data.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString(),
    value: Number(p.value.toFixed(3)),
  }));

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
      <div className="text-sm text-gray-400 font-mono mb-2">{tag} {unit && `(${unit})`}</div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={formatted} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 13 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#6b7280', fontSize: 13 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: 14 }}
            labelStyle={{ color: '#9ca3af' }}
            itemStyle={{ color: '#60a5fa' }}
          />
          {highLimit !== undefined && (
            <ReferenceLine y={highLimit} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `H: ${highLimit}`, fill: '#f59e0b', fontSize: 12 }} />
          )}
          {lowLimit !== undefined && (
            <ReferenceLine y={lowLimit} stroke="#3b82f6" strokeDasharray="4 2" label={{ value: `L: ${lowLimit}`, fill: '#3b82f6', fontSize: 12 }} />
          )}
          <Line
            type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={1.5}
            dot={false} activeDot={{ r: 4, fill: '#60a5fa' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
