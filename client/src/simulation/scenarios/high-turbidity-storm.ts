import type { ScenarioDefinition } from './index';

export const highTurbidityStorm: ScenarioDefinition = {
  id: 'high-turbidity-storm',
  name: 'Storm Runoff Event',
  description: 'Turbidity ramps from 15 to 180 NTU over 5 minutes due to storm runoff. Adjust alum dosing to compensate.',
  difficulty: 'Intermediate',
  duration: 600,
  steps: [
    { triggerAt: 30, action: 'setTurbidity', params: { target: 60, duration: 60 } },
    { triggerAt: 90, action: 'setTurbidity', params: { target: 120, duration: 60 } },
    { triggerAt: 150, action: 'setTurbidity', params: { target: 180, duration: 60 } },
    { triggerAt: 360, action: 'setTurbidity', params: { target: 90, duration: 120 } },
    { triggerAt: 480, action: 'setTurbidity', params: { target: 20, duration: 120 } },
  ],
};
