import type { ScenarioDefinition } from './index';

export const filterBreakthrough: ScenarioDefinition = {
  id: 'filter-breakthrough',
  name: 'Filter Breakthrough',
  description: 'Filter is pre-loaded at 71 hours run time with 8.5 ft head loss — well past the 6 ft breakthrough onset. Effluent turbidity is rising. Initiate backwash immediately.',
  difficulty: 'Advanced',
  duration: 0,
  steps: [
    { triggerAt: 0, action: 'preloadFilter', params: { headLoss: 8.5, filterRunTime: 71 } },
  ],
};
