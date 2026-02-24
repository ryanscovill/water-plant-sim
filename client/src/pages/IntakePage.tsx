import { IntakeHMI } from '../components/hmi/IntakeHMI';
import { PlantStagesGrid } from '../components/hmi/OverviewHMI';

export function IntakePage() {
  return (
    <div className="space-y-4">
      <IntakeHMI />
      <PlantStagesGrid activeStage="INTAKE" />
    </div>
  );
}
