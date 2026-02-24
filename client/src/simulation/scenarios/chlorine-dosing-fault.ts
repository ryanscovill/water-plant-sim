import type { ScenarioDefinition } from './index';

export const chlorineDosingFault: ScenarioDefinition = {
  id: 'chlorine-dosing-fault',
  name: 'Chlorine Pump Fault',
  description: 'Chlorine dose signal is lost at T+5s and the pump trips at T+15s. Residual decays toward zero. Restore dosing before a distribution violation occurs.',
  difficulty: 'Advanced',
  duration: 0,
  simSpeed: 10,
  minTime: 60,
  completionConditions: [
    {
      description: 'Chlorine pump running',
      check: (s) => s.disinfection.chlorinePumpStatus.running,
    },
    {
      description: 'Plant Cl₂ residual > 0.5 mg/L',
      check: (s) => s.disinfection.chlorineResidualPlant > 0.5,
    },
    {
      description: 'Distribution Cl₂ residual > 0.2 mg/L',
      check: (s) => s.disinfection.chlorineResidualDist > 0.2,
    },
  ],
  steps: [
    { triggerAt: 5,  action: 'setChlorineDoseSetpoint', params: { value: 0 } },
    { triggerAt: 15, action: 'faultPump',               params: { pumpId: 'chlorinePump' } },
  ],
};
