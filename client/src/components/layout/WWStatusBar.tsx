import { useWWSimulationStore } from '../../store/useWWSimulationStore';

export function WWStatusBar() {
  const state = useWWSimulationStore((s) => s.state);

  if (!state) return null;

  return (
    <div className="bg-gray-950 border-t border-gray-800 px-4 py-1 flex items-center gap-6 text-xs font-mono text-gray-500">
      <span>Influent: <span className="text-green-400">{state.headworks.influentFlow.toFixed(2)} MGD</span></span>
      <span>BOD In: <span className="text-yellow-400">{state.headworks.influentBOD.toFixed(0)} mg/L</span></span>
      <span>DO: <span className="text-blue-400">{state.aeration.dissolvedOxygen.toFixed(1)} mg/L</span></span>
      <span>MLSS: <span className="text-purple-400">{state.aeration.mlss.toFixed(0)} mg/L</span></span>
      <span>Eff BOD: <span className="text-cyan-400">{state.wwDisinfection.effluentBOD.toFixed(1)} mg/L</span></span>
      <span>Eff TSS: <span className="text-cyan-300">{state.wwDisinfection.effluentTSS.toFixed(1)} mg/L</span></span>
      <span>Cl&#8322; Res: <span className="text-blue-400">{state.wwDisinfection.chlorineResidual.toFixed(2)} mg/L</span></span>
      <span>TRC: <span className="text-blue-400">{state.wwDisinfection.totalResidualChlorine.toFixed(3)} mg/L</span></span>
      <span className="ml-auto">Speed: {state.simSpeed}x</span>
      <span className="text-yellow-600 font-semibold">&#9888; FOR TRAINING PURPOSES ONLY</span>
    </div>
  );
}
