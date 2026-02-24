import { CoagFloccHMI } from '../components/hmi/CoagFloccHMI';
import { PlantStagesGrid } from '../components/hmi/OverviewHMI';

export function CoagFloccPage() {
  return (
    <div className="space-y-4">
      <CoagFloccHMI />
      <PlantStagesGrid activeStage="COAGULATION" />
    </div>
  );
}
