import { IntakeHMI } from '../components/hmi/IntakeHMI';
import { OverviewHMI } from '../components/hmi/OverviewHMI';

export function IntakePage() {
  return (
    <div className="space-y-4">
      <IntakeHMI />
      <OverviewHMI activeStage="INTAKE" />
    </div>
  );
}
