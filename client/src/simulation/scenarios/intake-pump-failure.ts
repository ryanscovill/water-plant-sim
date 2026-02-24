import type { ScenarioDefinition } from './index';

export const intakePumpFailure: ScenarioDefinition = {
  id: 'intake-pump-failure',
  name: 'Intake Pump 1 Failure',
  description: 'Pump 1 trips at T+15s. Raw water flow drops by 75%. Start Pump 2 and restore flow before the wet well empties.',
  difficulty: 'Intermediate',
  duration: 0,
  simSpeed: 10,
  minTime: 60,
  completionConditions: [
    {
      description: 'Intake Pump 2 running',
      check: (s) => s.intake.intakePump2.running,
    },
    {
      description: 'Raw water flow restored (≥ 2.0 MGD)',
      check: (s) => s.intake.rawWaterFlow >= 2.0,
    },
    {
      description: 'Wet well level stable (≥ 5.0 ft)',
      check: (s) => s.intake.rawWaterLevel >= 5.0,
    },
  ],
  steps: [
    { triggerAt: 15, action: 'faultPump', params: { pumpId: 'intakePump1' } },
  ],
};
