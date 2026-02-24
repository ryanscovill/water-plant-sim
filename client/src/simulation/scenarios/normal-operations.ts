import type { ScenarioDefinition } from './index';

export const normalOperations: ScenarioDefinition = {
  id: 'normal-operations',
  name: 'Normal Shift',
  description: 'Steady-state operations. All equipment running normally. Practice navigation and monitoring.',
  difficulty: 'Beginner',
  duration: 0,
  simSpeed: 10,
  minTime: 120,
  completionConditions: [
    {
      description: 'Raw water flow ≥ 2.0 MGD',
      check: (s) => s.intake.rawWaterFlow >= 2.0,
    },
    {
      description: 'Filter effluent turbidity < 0.3 NTU',
      check: (s) => s.sedimentation.filterEffluentTurbidity < 0.3,
    },
    {
      description: 'Plant Cl₂ residual > 0.5 mg/L',
      check: (s) => s.disinfection.chlorineResidualPlant > 0.5,
    },
  ],
  steps: [],
};
