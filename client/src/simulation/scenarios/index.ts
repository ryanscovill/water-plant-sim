import type { ProcessState } from '../ProcessState';

export interface CompletionCondition {
  description: string;
  check: (state: ProcessState) => boolean;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number; // seconds, displayed in UI only
  simSpeed: number; // sim speed set when scenario starts
  minTime: number;  // simulated seconds before completion check begins
  completionConditions: CompletionCondition[];
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
