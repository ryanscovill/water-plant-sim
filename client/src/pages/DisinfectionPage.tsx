import { DisinfectionHMI } from '../components/hmi/DisinfectionHMI';
import { PlantStagesGrid } from '../components/hmi/OverviewHMI';

export function DisinfectionPage() {
  return (
    <div className="space-y-4">
      <DisinfectionHMI />
      <PlantStagesGrid activeStage="DISINFECTION" />
    </div>
  );
}
