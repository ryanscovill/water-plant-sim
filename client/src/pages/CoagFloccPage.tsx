import { CoagFloccHMI } from '../components/hmi/CoagFloccHMI';
import { AlarmPanel } from '../components/alarms/AlarmPanel';
import { useAlarmStore } from '../store/useAlarmStore';

export function CoagFloccPage() {
  const alarms = useAlarmStore(s => s.alarms);
  const coagAlarms = alarms.filter(a => a.active && a.tag.startsWith('COG'));

  return (
    <div className="space-y-4">
      <CoagFloccHMI />
      {coagAlarms.length > 0 && (
        <div className="max-w-2xl">
          <AlarmPanel />
        </div>
      )}
    </div>
  );
}
