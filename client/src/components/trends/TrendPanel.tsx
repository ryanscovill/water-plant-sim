import { useState } from 'react';
import { useTrends } from '../../hooks/useTrends';
import { useAlarmStore } from '../../store/useAlarmStore';
import { useEventStore } from '../../store/useEventStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { TrendChart } from './TrendChart';
import { getEngine } from '../../simulation/engine';
import { Check, CheckCheck } from 'lucide-react';
import type { Alarm } from '../../types/process';

const AVAILABLE_TAGS = [
  { tag: 'INT-FIT-001', label: 'Raw Water Flow', unit: 'MGD', decimals: 2 },
  { tag: 'INT-AIT-001', label: 'Raw Turbidity', unit: 'NTU', decimals: 1 },
  { tag: 'INT-PDT-001', label: 'Screen Diff Press', unit: 'PSI', decimals: 1 },
  { tag: 'INT-LIT-001', label: 'Raw Water Level', unit: 'ft', decimals: 1 },
  { tag: 'COG-FIT-001', label: 'Alum Dose Rate', unit: 'mg/L', decimals: 1 },
  { tag: 'COG-AIT-001', label: 'Floc Basin Turbidity', unit: 'NTU', decimals: 1 },
  { tag: 'SED-AIT-001', label: 'Clarifier Turbidity', unit: 'NTU', decimals: 2 },
  { tag: 'SED-LIT-001', label: 'Sludge Blanket', unit: 'ft', decimals: 1 },
  { tag: 'FLT-PDT-001', label: 'Filter Head Loss', unit: 'ft', decimals: 1 },
  { tag: 'FLT-AIT-001', label: 'Filter Effluent Turb', unit: 'NTU', decimals: 3 },
  { tag: 'FLT-RUN-001', label: 'Filter Run Time', unit: 'hr', decimals: 1 },
  { tag: 'DIS-FIT-001', label: 'Chlorine Dose Rate', unit: 'mg/L', decimals: 1 },
  { tag: 'DIS-AIT-001', label: 'Plant Cl2 Residual', unit: 'mg/L', decimals: 2, highLimit: 3.0, lowLimit: 0.5 },
  { tag: 'DIS-AIT-002', label: 'Dist Cl2 Residual', unit: 'mg/L', decimals: 2, highLimit: 2.0, lowLimit: 0.3 },
  { tag: 'DIS-AIT-003', label: 'Finished Water pH', unit: '', decimals: 2, highLimit: 8.0, lowLimit: 6.8, yMin: 6, yMax: 8 },
  { tag: 'DIS-LIT-001', label: 'Clearwell Level', unit: 'm', decimals: 2 },
];

const DURATIONS = [
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '30 min', value: 1800 },
  { label: '1 hr', value: 3600 },
];

const PRIORITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH:     'bg-amber-500',
  MEDIUM:   'bg-yellow-400',
  LOW:      'bg-blue-400',
};

const PRIORITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH:     'bg-amber-600 text-white',
  MEDIUM:   'bg-yellow-500 text-black',
  LOW:      'bg-blue-600 text-white',
};

const PRIORITY_ROW: Record<string, string> = {
  CRITICAL: 'border-l-red-500 bg-red-950/20',
  HIGH:     'border-l-amber-500 bg-amber-950/20',
  MEDIUM:   'border-l-yellow-500 bg-yellow-950/10',
  LOW:      'border-l-blue-500 bg-blue-950/10',
};

function topAlarmForTag(alarms: Alarm[], tag: string): Alarm | null {
  const matches = alarms.filter((a) => a.tag === tag && a.active);
  if (!matches.length) return null;
  return matches.slice().sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))[0];
}

export function TrendPanel() {
  const [selectedTag, setSelectedTag] = useState('DIS-AIT-001');
  const [duration, setDuration] = useState(300);
  const tagInfo = AVAILABLE_TAGS.find((t) => t.tag === selectedTag);
  const { data, loading } = useTrends(selectedTag, duration);

  const allEvents = useEventStore((s) => s.events);
  const alarmHistory = useAlarmStore((s) => s.history);
  const simNow = useSimulationStore((s) => new Date(s.state!.timestamp).getTime());
  const cutoff = simNow - duration * 1000;

  const chartEvents = [
    ...allEvents
      .filter((e) => new Date(e.timestamp).getTime() >= cutoff)
      .map((e) => ({
        ts: new Date(e.timestamp).getTime(),
        type: e.type,
        description: e.description,
      })),
    ...alarmHistory
      .filter((a) => new Date(a.timestamp).getTime() >= cutoff)
      .map((a) => ({
        ts: new Date(a.timestamp).getTime(),
        type: `alarm-${a.priority}` as string,
        description: `${a.tag} ${a.condition}: ${a.description}`,
      })),
    ...alarmHistory
      .filter((a) => a.clearedAt && new Date(a.clearedAt).getTime() >= cutoff)
      .map((a) => ({
        ts: new Date(a.clearedAt!).getTime(),
        type: 'alarm-cleared' as string,
        description: `${a.tag} ${a.condition} cleared`,
      })),
  ].sort((a, b) => a.ts - b.ts);

  const alarms = useAlarmStore((s) => s.alarms);
  const activeAlarms = alarms.filter((a) => a.active).sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  );
  const tagAlarms = activeAlarms.filter((a) => a.tag === selectedTag);

  return (
    <div className="flex gap-4 h-full">
      {/* Tag selector */}
      <div id="trend-tag-selector" className="w-56 bg-gray-900 border border-gray-700 rounded-lg overflow-y-auto shrink-0">
        <div className="px-2 py-2 text-xs text-gray-400 border-b border-gray-700 font-bold">SELECT TAG</div>
        {AVAILABLE_TAGS.map((t) => {
          const top = topAlarmForTag(activeAlarms, t.tag);
          return (
            <button
              key={t.tag}
              onClick={() => setSelectedTag(t.tag)}
              className={`w-full text-left px-3 py-2 text-xs font-mono border-b border-gray-800 hover:bg-gray-800 cursor-pointer ${selectedTag === t.tag ? 'bg-blue-900/40 text-blue-300' : 'text-gray-300'}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold">{t.tag}</span>
                {top && (
                  <span className={`text-xs px-1 rounded font-bold shrink-0 ${PRIORITY_BADGE[top.priority]}`}>
                    {top.condition}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="text-gray-500">{t.label}</span>
                {top && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[top.priority]} ${top.priority === 'CRITICAL' ? 'animate-flash' : top.priority === 'HIGH' ? 'animate-slow-flash' : ''}`} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Chart area */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Duration picker */}
        <div className="flex items-center gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`px-3 py-1 text-xs rounded font-mono cursor-pointer ${duration === d.value ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Loading...</div>
        ) : (
          <TrendChart
            data={data}
            tag={selectedTag}
            unit={tagInfo?.unit}
            decimals={tagInfo?.decimals}
            highLimit={tagInfo?.highLimit}
            lowLimit={tagInfo?.lowLimit}
            yMin={tagInfo?.yMin}
            yMax={tagInfo?.yMax}
            height={300}
            activeAlarms={tagAlarms}
            events={chartEvents}
          />
        )}

        <div className="text-xs text-gray-500 font-mono">
          {data.length} data points &bull; {tagInfo?.label}
        </div>

        {/* Active alarms */}
        {activeAlarms.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
              <span className="text-xs font-bold text-gray-200 font-mono">ACTIVE ALARMS ({activeAlarms.length})</span>
              {activeAlarms.some((a) => !a.acknowledged) && (
                <button
                  onClick={() => getEngine().applyControl('acknowledgeAll', {})}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 cursor-pointer"
                >
                  <CheckCheck size={12} /> ACK ALL
                </button>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-gray-800">
              {activeAlarms.map((alarm) => {
                const isHigh = alarm.condition === 'H' || alarm.condition === 'HH';
                const isSelected = alarm.tag === selectedTag;
                return (
                  <div
                    key={alarm.id}
                    className={`flex items-center gap-2 px-3 py-1.5 border-l-4 cursor-pointer hover:brightness-125 ${alarm.acknowledged ? 'opacity-60' : ''} ${PRIORITY_ROW[alarm.priority]} ${isSelected ? 'ring-1 ring-inset ring-white/20' : ''}`}
                    onClick={() => setSelectedTag(alarm.tag)}
                  >
                    <span className={`text-xs px-1 py-0.5 rounded font-bold shrink-0 ${PRIORITY_BADGE[alarm.priority]}`}>
                      {alarm.condition}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs text-white font-mono font-bold">{alarm.tag}</span>
                        <span className="text-xs text-gray-300 font-mono truncate">{alarm.description}</span>
                        <span className="text-xs font-mono font-bold text-white">{isHigh ? '↑' : '↓'} {alarm.value.toFixed(2)}</span>
                      </div>
                    </div>
                    {!alarm.acknowledged && (
                      <button
                        onClick={(e) => { e.stopPropagation(); getEngine().applyControl('acknowledgeAlarm', { alarmId: alarm.id }); }}
                        className="flex items-center gap-1 px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Check size={10} /> ACK
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
