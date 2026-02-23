import { DisinfectionHMI } from '../components/hmi/DisinfectionHMI';
import { AlarmPanel } from '../components/alarms/AlarmPanel';
import { useAlarmStore } from '../store/useAlarmStore';

export function DisinfectionPage() {
  const alarms = useAlarmStore(s => s.alarms);
  const disAlarms = alarms.filter(a => a.active && a.tag.startsWith('DIS'));

  return (
    <div className="space-y-4">
      <DisinfectionHMI />
      {disAlarms.length > 0 && (
        <div className="max-w-2xl">
          <AlarmPanel />
        </div>
      )}
    </div>
  );
}
