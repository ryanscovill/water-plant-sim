import { useAlarmStore } from '../../store/useAlarmStore';
import { AlarmRow } from './AlarmRow';

export function AlarmPanel() {
  const alarms = useAlarmStore((s) => s.alarms);
  const active = alarms.filter((a) => a.active).sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div id="alarm-list" className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-bold text-gray-200">ACTIVE ALARMS ({active.length})</span>
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
