import type { ScenarioDefinition } from './index';

export const highTurbidityStorm: ScenarioDefinition = {
  id: 'high-turbidity-storm',
  name: 'Storm Runoff Event',
  description: 'Heavy rainfall rapidly drives source turbidity from 15 to 300 NTU. Increase alum dosing aggressively to protect the filter.',
  difficulty: 'Intermediate',
  duration: 300,
  completionTime: 250,
  steps: [
    { triggerAt: 10,  action: 'setTurbidity', params: { target: 80,  duration: 10 } },
    { triggerAt: 30,  action: 'setTurbidity', params: { target: 180, duration: 10 } },
    { triggerAt: 60,  action: 'setTurbidity', params: { target: 300, duration: 10 } },
    { triggerAt: 120, action: 'setTurbidity', params: { target: 120, duration: 15 } },
    { triggerAt: 210, action: 'setTurbidity', params: { target: 20,  duration: 30 } },
  ],
};
