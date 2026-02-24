import { DisinfectionHMI } from '../components/hmi/DisinfectionHMI';
import { OverviewHMI } from '../components/hmi/OverviewHMI';

export function DisinfectionPage() {
  return (
    <div className="space-y-4">
      <DisinfectionHMI />
      <OverviewHMI activeStage="DISINFECTION" />
    </div>
  );
}
