import { AlarmPanel } from '../components/alarms/AlarmPanel';
import { AlarmHistory } from '../components/alarms/AlarmHistory';

export function AlarmsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-gray-300 font-bold text-sm font-mono">ALARM MANAGEMENT</h2>
      <AlarmPanel />
      <AlarmHistory />
    </div>
  );
}
