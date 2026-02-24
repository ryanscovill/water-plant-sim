import { SedimentationHMI } from '../components/hmi/SedimentationHMI';
import { OverviewHMI } from '../components/hmi/OverviewHMI';

export function SedimentationPage() {
  return (
    <div className="space-y-4">
      <SedimentationHMI />
      <OverviewHMI activeStage="SEDIMENTATION" />
    </div>
  );
}
