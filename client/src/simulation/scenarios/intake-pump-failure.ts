import type { ScenarioDefinition } from './index';

export const intakePumpFailure: ScenarioDefinition = {
  id: 'intake-pump-failure',
  name: 'Intake Pump 1 Failure',
  description: 'Pump 1 trips at T+15s. Raw water flow drops by 75%. Start Pump 2 and restore flow before the wet well empties.',
  difficulty: 'Intermediate',
  duration: 0,
  completionTime: 120,
  steps: [
    { triggerAt: 15, action: 'faultPump', params: { pumpId: 'intakePump1' } },
  ],
};
