import { SimulationEngine } from './SimulationEngine';

let _engine: SimulationEngine | null = null;

export function getEngine(): SimulationEngine {
  if (!_engine) {
    _engine = new SimulationEngine();
    _engine.start();
  }
  return _engine;
}
