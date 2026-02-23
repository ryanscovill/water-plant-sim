import type { ScenarioDefinition } from './index';

export const intakePumpFailure: ScenarioDefinition = {
  id: 'intake-pump-failure',
  name: 'Intake Pump 1 Failure',
  description: 'Pump 1 trips at T+60s. Flow drops 50%. Start Pump 2 to restore flow.',
  difficulty: 'Intermediate',
  duration: 0,
  steps: [
    { triggerAt: 60, action: 'faultPump', params: { pumpId: 'intakePump1' } },
  ],
};
