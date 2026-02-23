import type { ScenarioDefinition } from './index';

export const sludgeBlanketBuildup: ScenarioDefinition = {
  id: 'sludge-blanket-buildup',
  name: 'Sludge Pump Failure',
  description: 'Sludge pump trips. Blanket rises over 20 minutes. Restore pump or clarifier performance degrades.',
  difficulty: 'Intermediate',
  duration: 0,
  steps: [
    { triggerAt: 30, action: 'faultPump', params: { pumpId: 'sludgePump' } },
  ],
};
