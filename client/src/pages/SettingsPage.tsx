import { useState } from 'react';
import { AlarmThresholdsTab } from '../components/settings/AlarmThresholdsTab';

type SettingsTab = 'alarms';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'alarms', label: 'Alarm Thresholds' },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('alarms');

  return (
    <div className="space-y-4 max-w-4xl">
      <h2 className="text-gray-300 font-bold text-sm font-mono">SETTINGS</h2>

      {/* Sub-tab bar */}
      <div className="flex gap-1 border-b border-gray-700 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-mono font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-2">
        {activeTab === 'alarms' && <AlarmThresholdsTab />}
      </div>
    </div>
  );
}
