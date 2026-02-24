import { useAlarmStore } from '../../store/useAlarmStore';
import { useNavigate } from 'react-router-dom';

function tagToRoute(tag: string): string {
  if (tag.startsWith('INT-')) return '/intake';
  if (tag.startsWith('COG-')) return '/coagulation';
  if (tag.startsWith('SED-') || tag.startsWith('FLT-')) return '/sedimentation';
  if (tag.startsWith('DIS-')) return '/disinfection';
  return '/';
}

export function AlarmHistory() {
  const navigate = useNavigate();
  const history = useAlarmStore((s) => s.history);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-bold text-gray-200">ALARM HISTORY ({history.length})</span>
      </div>
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-xs font-mono">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              <th className="text-left px-2 py-1 text-gray-400">Time</th>
              <th className="text-left px-2 py-1 text-gray-400">Tag</th>
              <th className="text-left px-2 py-1 text-gray-400">Description</th>
              <th className="text-left px-2 py-1 text-gray-400">Priority</th>
              <th className="text-left px-2 py-1 text-gray-400">Value</th>
              <th className="text-left px-2 py-1 text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {history.map((alarm, i) => {
              const isHigh = alarm.condition === 'H' || alarm.condition === 'HH';
              const arrow = isHigh ? '↑' : '↓';
              const op = isHigh ? '>' : '<';
              return (
                <tr
                  key={`${alarm.id}-${i}`}
                  className="hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => navigate(tagToRoute(alarm.tag))}
                >
                  <td className="px-2 py-1 text-gray-400">{new Date(alarm.timestamp).toLocaleTimeString()}</td>
                  <td className="px-2 py-1 text-gray-300">{alarm.tag}</td>
                  <td className="px-2 py-1 text-gray-300 max-w-[200px] truncate">{alarm.description}</td>
                  <td className={`px-2 py-1 font-bold ${alarm.priority === 'CRITICAL' ? 'text-red-400' : alarm.priority === 'HIGH' ? 'text-amber-400' : 'text-yellow-300'}`}>
                    {alarm.priority}
                  </td>
                  <td className="px-2 py-1 text-gray-300">{arrow} {alarm.value.toFixed(2)} {op} {alarm.setpoint.toFixed(2)}</td>
                  <td className="px-2 py-1">
                    {alarm.active
                      ? <span className="text-red-400">ACTIVE</span>
                      : <span className="text-gray-500">CLEARED</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {history.length === 0 && (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">No alarm history</div>
        )}
      </div>
    </div>
  );
}
