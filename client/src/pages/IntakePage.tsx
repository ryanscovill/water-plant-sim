import { IntakeHMI } from '../components/hmi/IntakeHMI';
import { AlarmPanel } from '../components/alarms/AlarmPanel';
import { useAlarmStore } from '../store/useAlarmStore';

export function IntakePage() {
  const alarms = useAlarmStore(s => s.alarms);
  const intakeAlarms = alarms.filter(a => a.active && a.tag.startsWith('INT'));

  return (
    <div className="space-y-4">
      <IntakeHMI />
      {intakeAlarms.length > 0 && (
        <div className="max-w-2xl">
          <AlarmPanel />
        </div>
      )}
    </div>
  );
}
