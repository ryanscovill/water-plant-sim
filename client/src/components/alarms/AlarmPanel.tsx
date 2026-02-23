import { useAlarmStore } from '../../store/useAlarmStore';
import { AlarmRow } from './AlarmRow';
import { CheckCheck } from 'lucide-react';
import { getEngine } from '../../simulation/engine';

export function AlarmPanel() {
  const alarms = useAlarmStore((s) => s.alarms);
  const active = alarms.filter((a) => a.active).sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-bold text-gray-200">ACTIVE ALARMS ({active.length})</span>
        {active.some((a) => !a.acknowledged) && (
          <button
            onClick={() => getEngine().applyControl('acknowledgeAll', {})}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
          >
            <CheckCheck size={12} /> ACK ALL
          </button>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-gray-800">
        {active.length === 0 ? (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">No active alarms</div>
        ) : (
          active.map((alarm) => <AlarmRow key={alarm.id} alarm={alarm} />)
        )}
      </div>
    </div>
  );
}
