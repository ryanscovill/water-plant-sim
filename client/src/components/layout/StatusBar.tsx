import { useSimulationStore } from '../../store/useSimulationStore';
import { useScenarioStore } from '../../store/useScenarioStore';

export function StatusBar() {
  const state = useSimulationStore((s) => s.state);
  const scenarios = useScenarioStore((s) => s.scenarios);
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

  if (!state) return null;

  return (
    <div className="bg-gray-950 border-t border-gray-800 px-4 py-1 flex items-center gap-6 text-xs font-mono text-gray-500">
      <span>Flow: <span className="text-green-400">{state.intake.rawWaterFlow.toFixed(2)} MGD</span></span>
      <span>Raw Turb: <span className="text-yellow-400">{state.intake.rawTurbidity.toFixed(1)} NTU</span></span>
      <span>Filter Eff: <span className="text-blue-400">{state.sedimentation.filterEffluentTurbidity.toFixed(2)} NTU</span></span>
      <span>pH: <span className="text-purple-400">{state.disinfection.finishedWaterPH.toFixed(2)}</span></span>
      <span>Plant Cl₂: <span className="text-cyan-400">{state.disinfection.chlorineResidualPlant.toFixed(2)} mg/L</span></span>
      <span>Dist Cl₂: <span className="text-cyan-300">{state.disinfection.chlorineResidualDist.toFixed(2)} mg/L</span></span>
      <span>CW Level: <span className="text-blue-400">{state.disinfection.clearwellLevel.toFixed(1)} ft</span></span>
      <span>Filter HL: <span className="text-blue-400">{state.sedimentation.filterHeadLoss.toFixed(1)} ft</span></span>
      {state.sedimentation.backwashInProgress && (
        <span className="text-cyan-300 animate-slow-flash">BACKWASH IN PROGRESS</span>
      )}
      {activeScenario && (
        <span className="text-amber-400">▶ {activeScenario.name}</span>
      )}
      <span className="ml-auto">Speed: {state.simSpeed}x</span>
      <span className="text-yellow-600 font-semibold">⚠ FOR TRAINING PURPOSES ONLY — Data and values may be inaccurate</span>
    </div>
  );
}
