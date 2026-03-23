import { WWSimulationEngine } from './WWSimulationEngine';

let _wwEngine: WWSimulationEngine | null = null;

export function getWWEngine(): WWSimulationEngine {
  if (!_wwEngine) {
    _wwEngine = new WWSimulationEngine();
    _wwEngine.start();
  }
  return _wwEngine;
}
