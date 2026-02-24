import { SedimentationHMI } from '../components/hmi/SedimentationHMI';
import { PlantStagesGrid } from '../components/hmi/OverviewHMI';

export function SedimentationPage() {
  return (
    <div className="space-y-4">
      <SedimentationHMI />
      <PlantStagesGrid activeStage="SEDIMENTATION" />
    </div>
  );
}
