import type { ScenarioDefinition } from './index';

export const filterBreakthrough: ScenarioDefinition = {
  id: 'filter-breakthrough',
  name: 'Filter Breakthrough',
  description: 'Filter run time is pre-loaded to 68 hours. Head loss approaches trigger level. Initiate backwash before breakthrough occurs.',
  difficulty: 'Advanced',
  duration: 0,
  steps: [
    { triggerAt: 0, action: 'preloadFilter', params: { headLoss: 6.5, filterRunTime: 68 } },
  ],
};
