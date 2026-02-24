import type { ScenarioDefinition } from './index';

export const sludgeBlanketBuildup: ScenarioDefinition = {
  id: 'sludge-blanket-buildup',
  name: 'Sludge Pump Failure',
  description: 'Clarifier enters the scenario with an already-elevated sludge blanket at 3.5 ft. The sludge pump then trips at T+15s. Blanket will breach 4 ft (alarm) within minutes — restore the pump or clarifier turbidity will spike.',
  difficulty: 'Intermediate',
  duration: 0,
  completionTime: 180,
  steps: [
    { triggerAt: 0,  action: 'setSludgeLevel', params: { value: 3.5 } },
    { triggerAt: 15, action: 'faultPump',      params: { pumpId: 'sludgePump' } },
  ],
};
