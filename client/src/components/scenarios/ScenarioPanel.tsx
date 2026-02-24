import { useEffect, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { useScenarioStore } from '../../store/useScenarioStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { ScenarioCard } from './ScenarioCard';
import { getEngine } from '../../simulation/engine';
import {
  normalOperations,
  highTurbidityStorm,
  intakePumpFailure,
  filterBreakthrough,
  chlorineDosingFault,
  alumOverdose,
  sludgeBlanketBuildup,
} from '../../simulation/scenarios/index';
import type { ScenarioDefinition } from '../../simulation/scenarios/index';

const ALL_SCENARIOS: ScenarioDefinition[] = [
  normalOperations,
  highTurbidityStorm,
  intakePumpFailure,
  filterBreakthrough,
  chlorineDosingFault,
  alumOverdose,
  sludgeBlanketBuildup,
];

export function ScenarioPanel() {
  const { setScenarios, setActiveScenario } = useScenarioStore();
  const activeScenarioId = useSimulationStore((s) => s.state?.activeScenario ?? null);
  const [pendingScenario, setPendingScenario] = useState<ScenarioDefinition | null>(null);

  useEffect(() => {
    setScenarios(ALL_SCENARIOS.map((s) => ({ ...s, active: false })));
  }, [setScenarios]);

  useEffect(() => {
    setActiveScenario(activeScenarioId);
  }, [activeScenarioId, setActiveScenario]);

  const handleStartRequest = (id: string) => {
    const scenario = ALL_SCENARIOS.find((s) => s.id === id);
    if (scenario) setPendingScenario(scenario);
  };

  const handleConfirmStart = () => {
    if (!pendingScenario) return;
    getEngine().reset();
    getEngine().applyControl('setpoint', { tagId: 'simSpeed', value: 10 });
    getEngine().scenarioEngine.start(pendingScenario, getEngine(), getEngine().getSimulatedTime());
    setPendingScenario(null);
  };

  const stopScenario = () => {
    getEngine().scenarioEngine.stop(getEngine());
  };

  return (
    <>
      {pendingScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-amber-700 rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-amber-400 font-bold text-sm tracking-wider mb-1">START SCENARIO?</h2>
            <p className="text-white font-semibold text-sm mb-3">{pendingScenario.name}</p>
            <p className="text-gray-400 text-xs mb-5">
              Starting this scenario will reset the simulation. All process data, alarm history, and operator events will be cleared. Simulation speed will be set to 10×.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPendingScenario(null)}
                className="px-3 py-1.5 rounded text-xs font-mono bg-gray-700 text-gray-300 hover:bg-gray-600 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmStart}
                className="px-3 py-1.5 rounded text-xs font-mono bg-amber-700 text-amber-100 hover:bg-amber-600 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={11} />
                <Play size={11} />
                RESET & START
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_SCENARIOS.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={{ ...scenario, active: scenario.id === activeScenarioId }}
            onStart={() => handleStartRequest(scenario.id)}
            onStop={stopScenario}
          />
        ))}
      </div>
    </>
  );
}
