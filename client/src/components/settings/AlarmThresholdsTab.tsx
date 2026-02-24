import { useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { config } from '../../simulation/config';

type Level = 'll' | 'l' | 'h' | 'hh';

interface TagMeta {
  tag: string;
  description: string;
  unit: string;
  levels: Level[];
}

const TAG_META: TagMeta[] = [
  { tag: 'INT-FIT-001', description: 'Raw Water Flow',            unit: 'MGD',  levels: ['ll', 'l', 'h', 'hh'] },
  { tag: 'INT-AIT-001', description: 'Raw Turbidity',             unit: 'NTU',  levels: ['h', 'hh'] },
  { tag: 'INT-PDT-001', description: 'Screen Diff Pressure',      unit: 'ft',   levels: ['h', 'hh'] },
  { tag: 'COG-AIT-001', description: 'Floc Basin Turbidity',      unit: 'NTU',  levels: ['h', 'hh'] },
  { tag: 'SED-AIT-001', description: 'Clarifier Turbidity',       unit: 'NTU',  levels: ['h', 'hh'] },
  { tag: 'SED-LIT-001', description: 'Sludge Blanket Level',      unit: 'ft',   levels: ['h', 'hh'] },
  { tag: 'FLT-PDT-001', description: 'Filter Head Loss',          unit: 'ft',   levels: ['h', 'hh'] },
  { tag: 'FLT-AIT-001', description: 'Filter Effluent Turbidity', unit: 'NTU',  levels: ['h', 'hh'] },
  { tag: 'DIS-AIT-001', description: 'Plant Cl₂ Residual',        unit: 'mg/L', levels: ['ll', 'l', 'h', 'hh'] },
  { tag: 'DIS-AIT-002', description: 'Dist Cl₂ Residual',         unit: 'mg/L', levels: ['ll', 'l', 'h'] },
  { tag: 'DIS-AIT-003', description: 'Finished Water pH',         unit: '',     levels: ['ll', 'l', 'h', 'hh'] },
];

const LEVEL_LABELS: Record<Level, { label: string; color: string }> = {
  ll: { label: 'LL',  color: 'text-red-400' },
  l:  { label: 'L',   color: 'text-yellow-400' },
  h:  { label: 'H',   color: 'text-orange-400' },
  hh: { label: 'HH',  color: 'text-red-500' },
};

const ALL_LEVELS: Level[] = ['ll', 'l', 'h', 'hh'];

const DEFAULT_THRESHOLDS = config.alarmThresholds as Record<string, Partial<Record<Level, number>>>;

export function AlarmThresholdsTab() {
  const { alarmThresholds, setAlarmThreshold, resetThresholds } = useSettingsStore();
  const [dirty, setDirty] = useState(false);

  // Local draft state so inputs are controlled without hitting the store on every keystroke
  const [draft, setDraft] = useState<Record<string, Partial<Record<Level, string>>>>(() => {
    const init: Record<string, Partial<Record<Level, string>>> = {};
    for (const { tag } of TAG_META) {
      init[tag] = {};
      for (const level of ALL_LEVELS) {
        const v = (alarmThresholds[tag] as Partial<Record<Level, number>>)?.[level];
        init[tag][level] = v !== undefined ? String(v) : '';
      }
    }
    return init;
  });

  function handleChange(tag: string, level: Level, raw: string) {
    setDraft((d) => ({ ...d, [tag]: { ...d[tag], [level]: raw } }));
    setDirty(true);
  }

  function handleApply() {
    for (const { tag, levels } of TAG_META) {
      for (const level of levels) {
        const raw = draft[tag]?.[level] ?? '';
        const num = raw === '' ? undefined : parseFloat(raw);
        if (num === undefined || !isNaN(num)) {
          setAlarmThreshold(tag, level, num);
        }
      }
    }
    setDirty(false);
  }

  function handleReset() {
    resetThresholds();
    const init: Record<string, Partial<Record<Level, string>>> = {};
    for (const { tag } of TAG_META) {
      init[tag] = {};
      for (const level of ALL_LEVELS) {
        const v = DEFAULT_THRESHOLDS[tag]?.[level];
        init[tag][level] = v !== undefined ? String(v) : '';
      }
    }
    setDraft(init);
    setDirty(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs">
        Override alarm setpoints for the live simulation. Changes take effect immediately after applying.
        Values are reset when the simulation resets.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 pr-4 text-gray-400 font-semibold w-32">Tag</th>
              <th className="text-left py-2 pr-4 text-gray-400 font-semibold">Description</th>
              <th className="text-center py-2 px-3 text-gray-400 font-semibold w-16">Unit</th>
              {ALL_LEVELS.map((lv) => (
                <th key={lv} className={`text-center py-2 px-3 font-semibold w-24 ${LEVEL_LABELS[lv].color}`}>
                  {LEVEL_LABELS[lv].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TAG_META.map(({ tag, description, unit, levels }, i) => (
              <tr
                key={tag}
                className={`border-b border-gray-800 ${i % 2 === 0 ? 'bg-gray-900/30' : ''}`}
              >
                <td className="py-2 pr-4 text-gray-300">{tag}</td>
                <td className="py-2 pr-4 text-gray-400">{description}</td>
                <td className="py-2 px-3 text-gray-500 text-center">{unit}</td>
                {ALL_LEVELS.map((level) => {
                  const hasLevel = levels.includes(level);
                  const raw = draft[tag]?.[level] ?? '';
                  const isInvalid = hasLevel && raw !== '' && isNaN(parseFloat(raw));
                  return (
                    <td key={level} className="py-1.5 px-2">
                      {hasLevel ? (
                        <input
                          type="number"
                          value={raw}
                          onChange={(e) => handleChange(tag, level, e.target.value)}
                          className={`w-full bg-gray-800 border rounded px-2 py-1 text-center text-gray-200 focus:outline-none focus:ring-1 ${
                            isInvalid
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                          step="any"
                        />
                      ) : (
                        <span className="block text-center text-gray-700">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleApply}
          disabled={!dirty}
          className="px-4 py-1.5 text-xs font-mono font-semibold rounded bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          APPLY CHANGES
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-1.5 text-xs font-mono font-semibold rounded bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
        >
          RESET TO DEFAULTS
        </button>
      </div>
    </div>
  );
}
