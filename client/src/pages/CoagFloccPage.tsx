import { CoagFloccHMI } from '../components/hmi/CoagFloccHMI';
import { OverviewHMI } from '../components/hmi/OverviewHMI';

export function CoagFloccPage() {
  return (
    <div className="space-y-4">
      <CoagFloccHMI />
      <OverviewHMI activeStage="COAGULATION" />
    </div>
  );
}
