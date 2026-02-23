import { SedimentationHMI } from '../components/hmi/SedimentationHMI';
import { AlarmPanel } from '../components/alarms/AlarmPanel';
import { useAlarmStore } from '../store/useAlarmStore';

export function SedimentationPage() {
  const alarms = useAlarmStore(s => s.alarms);
  const sedAlarms = alarms.filter(a => a.active && (a.tag.startsWith('SED') || a.tag.startsWith('FLT')));

  return (
    <div className="space-y-4">
      <SedimentationHMI />
      {sedAlarms.length > 0 && (
        <div className="max-w-2xl">
          <AlarmPanel />
        </div>
      )}
    </div>
  );
}
