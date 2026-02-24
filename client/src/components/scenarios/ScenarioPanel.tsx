import { useEffect } from 'react';
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

  useEffect(() => {
    setScenarios(ALL_SCENARIOS.map((s) => ({ ...s, active: false })));
  }, [setScenarios]);

  useEffect(() => {
    setActiveScenario(activeScenarioId);
  }, [activeScenarioId, setActiveScenario]);

  const startScenario = (id: string) => {
    const scenario = ALL_SCENARIOS.find((s) => s.id === id);
    if (scenario) {
      getEngine().scenarioEngine.start(scenario, getEngine(), getEngine().getSimulatedTime());
    }
  };

  const stopScenario = () => {
    getEngine().scenarioEngine.stop(getEngine());
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ALL_SCENARIOS.map((scenario) => (
        <ScenarioCard
          key={scenario.id}
          scenario={{ ...scenario, active: scenario.id === activeScenarioId }}
          onStart={() => startScenario(scenario.id)}
          onStop={stopScenario}
        />
      ))}
    </div>
  );
}
