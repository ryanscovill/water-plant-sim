import type { ScenarioDefinition } from './index';

export const filterBreakthrough: ScenarioDefinition = {
  id: 'filter-breakthrough',
  name: 'Filter Breakthrough',
  description: 'Filter is pre-loaded at 71 hours run time with 8.5 ft head loss — well past the 6 ft breakthrough onset. Effluent turbidity is rising. Initiate backwash immediately.',
  difficulty: 'Advanced',
  duration: 0,
  simSpeed: 10,
  minTime: 60,
  completionConditions: [
    {
      description: 'Backwash completed (not in progress)',
      check: (s) => !s.sedimentation.backwashInProgress,
    },
    {
      description: 'Filter head loss < 4.0 ft',
      check: (s) => s.sedimentation.filterHeadLoss < 4.0,
    },
    {
      description: 'Filter effluent turbidity < 0.3 NTU',
      check: (s) => s.sedimentation.filterEffluentTurbidity < 0.3,
    },
  ],
  steps: [
    { triggerAt: 0, action: 'preloadFilter', params: { headLoss: 8.5, filterRunTime: 71 } },
  ],
};
