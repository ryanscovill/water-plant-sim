import type { ScenarioDefinition } from './index';

export const sludgeBlanketBuildup: ScenarioDefinition = {
  id: 'sludge-blanket-buildup',
  name: 'Sludge Pump Failure',
  description: 'Clarifier enters the scenario with an already-elevated sludge blanket at 3.5 ft. The sludge pump then trips at T+15s. Blanket will breach 4 ft (alarm) within minutes — restore the pump or clarifier turbidity will spike.',
  difficulty: 'Intermediate',
  duration: 0,
  simSpeed: 600,
  minTime: 60,
  completionConditions: [
    {
      description: 'Sludge pump running',
      check: (s) => s.sedimentation.sludgePumpStatus.running,
    },
    {
      description: 'Sludge blanket level < 3.0 ft',
      check: (s) => s.sedimentation.sludgeBlanketLevel < 3.0,
    },
    {
      description: 'Clarifier turbidity < 2.0 NTU',
      check: (s) => s.sedimentation.clarifierTurbidity < 2.0,
    },
  ],
  steps: [
    { triggerAt: 0,  action: 'setSludgeLevel', params: { value: 3.5 } },
    { triggerAt: 15, action: 'faultPump',      params: { pumpId: 'sludgePump' } },
  ],
};
