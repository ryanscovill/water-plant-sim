import { useState } from 'react';
import { useTrends } from '../../hooks/useTrends';
import { TrendChart } from './TrendChart';

const AVAILABLE_TAGS = [
  { tag: 'INT-FIT-001', label: 'Raw Water Flow', unit: 'MGD' },
  { tag: 'INT-AIT-001', label: 'Raw Turbidity', unit: 'NTU' },
  { tag: 'INT-PDT-001', label: 'Screen Diff Press', unit: 'PSI' },
  { tag: 'COG-AIT-001', label: 'Floc Basin Turbidity', unit: 'NTU' },
  { tag: 'SED-AIT-001', label: 'Clarifier Turbidity', unit: 'NTU' },
  { tag: 'SED-LIT-001', label: 'Sludge Blanket', unit: 'ft' },
  { tag: 'FLT-PDT-001', label: 'Filter Head Loss', unit: 'ft' },
  { tag: 'FLT-AIT-001', label: 'Filter Effluent Turb', unit: 'NTU' },
  { tag: 'DIS-AIT-001', label: 'Plant Cl2 Residual', unit: 'mg/L', highLimit: 3.0, lowLimit: 0.5 },
  { tag: 'DIS-AIT-002', label: 'Dist Cl2 Residual', unit: 'mg/L', highLimit: 2.0, lowLimit: 0.3 },
  { tag: 'DIS-AIT-003', label: 'Finished Water pH', unit: '', highLimit: 8.0, lowLimit: 6.8 },
  { tag: 'DIS-AIT-004', label: 'Fluoride Residual', unit: 'mg/L', highLimit: 1.0, lowLimit: 0.7 },
  { tag: 'DIS-LIT-001', label: 'Clearwell Level', unit: 'ft' },
];

const DURATIONS = [
  { label: '10 min', value: 600 },
  { label: '30 min', value: 1800 },
  { label: '1 hr', value: 3600 },
  { label: '4 hr', value: 14400 },
];

export function TrendPanel() {
  const [selectedTag, setSelectedTag] = useState('DIS-AIT-001');
  const [duration, setDuration] = useState(1800);
  const tagInfo = AVAILABLE_TAGS.find((t) => t.tag === selectedTag);
  const { data, loading } = useTrends(selectedTag, duration);

  return (
    <div className="flex gap-4 h-full">
      {/* Tag selector */}
      <div id="trend-tag-selector" className="w-56 bg-gray-900 border border-gray-700 rounded-lg overflow-y-auto">
        <div className="px-2 py-2 text-xs text-gray-400 border-b border-gray-700 font-bold">SELECT TAG</div>
        {AVAILABLE_TAGS.map((t) => (
          <button
            key={t.tag}
            onClick={() => setSelectedTag(t.tag)}
            className={`w-full text-left px-3 py-2 text-xs font-mono border-b border-gray-800 hover:bg-gray-800 ${selectedTag === t.tag ? 'bg-blue-900/40 text-blue-300' : 'text-gray-300'}`}
          >
            <div className="font-bold">{t.tag}</div>
            <div className="text-gray-500">{t.label}</div>
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`px-3 py-1 text-xs rounded font-mono ${duration === d.value ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
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
            highLimit={tagInfo?.highLimit}
            lowLimit={tagInfo?.lowLimit}
            height={300}
          />
        )}

        <div className="text-xs text-gray-500 font-mono">
          {data.length} data points &bull; {tagInfo?.label}
        </div>
      </div>
    </div>
  );
}
