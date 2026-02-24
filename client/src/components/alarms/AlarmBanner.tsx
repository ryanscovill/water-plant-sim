import { AlertTriangle } from 'lucide-react';
import { useAlarmStore } from '../../store/useAlarmStore';
import { useNavigate } from 'react-router-dom';
import type { Alarm } from '../../types/process';

function BannerRow({ alarm, count }: { alarm: Alarm; count?: number }) {
  const navigate = useNavigate();

  const bgColor = alarm.priority === 'CRITICAL' ? 'bg-red-700 animate-flash'
    : alarm.priority === 'HIGH' ? 'bg-amber-700 animate-slow-flash'
    : 'bg-yellow-700';

  return (
    <div
      onClick={() => navigate('/alarms')}
      className={`${bgColor} px-4 py-2 flex items-center gap-3 cursor-pointer`}
    >
      <AlertTriangle size={16} className="text-white flex-shrink-0" />
      <span className="text-white text-sm font-mono font-bold flex-1 truncate">
        [{alarm.priority}] {alarm.description} — {alarm.value.toFixed(2)} (SP: {alarm.setpoint.toFixed(2)})
      </span>
      {count !== undefined && (
        <span className="text-white/70 text-xs">{count} active</span>
      )}
    </div>
  );
}

export function AlarmBanner() {
  const alarms = useAlarmStore((s) => s.alarms);

  const active = alarms.filter((a) => a.active);
  const criticals = active.filter((a) => a.priority === 'CRITICAL');

  if (active.length === 0) return null;

  // Stack one row per critical alarm; if no criticals, show the single worst alarm.
  if (criticals.length > 0) {
    return (
      <div id="alarm-banner">
        {criticals.map((alarm, i) => (
          <BannerRow
            key={alarm.id}
            alarm={alarm}
            count={i === 0 ? active.length : undefined}
          />
        ))}
      </div>
    );
  }

  const worst = active.find((a) => a.priority === 'HIGH') ?? active[0];
  return (
    <div id="alarm-banner">
      <BannerRow alarm={worst} count={active.length} />
    </div>
  );
}
