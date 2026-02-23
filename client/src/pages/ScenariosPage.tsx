import { ScenarioPanel } from '../components/scenarios/ScenarioPanel';

export function ScenariosPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-gray-300 font-bold text-sm font-mono">TRAINING SCENARIOS</h2>
      <p className="text-gray-500 text-xs max-w-2xl">
        Select a scenario to inject fault conditions into the simulation. Respond to alarms and correct process deviations as you would in a real plant.
      </p>
      <ScenarioPanel />
    </div>
  );
}
