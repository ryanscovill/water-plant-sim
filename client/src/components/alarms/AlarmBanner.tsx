import { AlertTriangle, CheckCheck } from 'lucide-react';
import { useAlarmStore } from '../../store/useAlarmStore';
import { getEngine } from '../../simulation/engine';

export function AlarmBanner() {
  const alarms = useAlarmStore((s) => s.alarms);

  const activeUnacked = alarms.filter((a) => a.active && !a.acknowledged);
  const worst = activeUnacked.find((a) => a.priority === 'CRITICAL')
    || activeUnacked.find((a) => a.priority === 'HIGH')
    || activeUnacked[0];

  if (!worst) return null;

  const bgColor = worst.priority === 'CRITICAL' ? 'bg-red-700 animate-flash'
    : worst.priority === 'HIGH' ? 'bg-amber-700 animate-slow-flash'
    : 'bg-yellow-700';

  return (
    <div id="alarm-banner" className={`${bgColor} px-4 py-2 flex items-center gap-3`}>
      <AlertTriangle size={16} className="text-white flex-shrink-0" />
      <span className="text-white text-sm font-mono font-bold flex-1 truncate">
        [{worst.priority}] {worst.description} — {worst.value.toFixed(2)} (SP: {worst.setpoint.toFixed(2)})
      </span>
      <span className="text-white/70 text-xs">{activeUnacked.length} active</span>
      <button
        onClick={() => getEngine().applyControl('acknowledgeAll', {})}
        className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-white text-xs"
      >
        <CheckCheck size={12} /> ACK ALL
      </button>
    </div>
  );
}
