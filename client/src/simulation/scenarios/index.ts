export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number; // seconds, 0 = indefinite
  steps: ScenarioStep[];
}

export interface ScenarioStep {
  triggerAt: number; // seconds from start
  action: string;
  params: Record<string, unknown>;
}

export { normalOperations } from './normal-operations';
export { highTurbidityStorm } from './high-turbidity-storm';
export { intakePumpFailure } from './intake-pump-failure';
export { filterBreakthrough } from './filter-breakthrough';
export { chlorineDosingFault } from './chlorine-dosing-fault';
export { alumOverdose } from './alum-overdose';
export { sludgeBlanketBuildup } from './sludge-blanket-buildup';
