import type { ScenarioDefinition } from './index';

export const chlorineDosingFault: ScenarioDefinition = {
  id: 'chlorine-dosing-fault',
  name: 'Chlorine Pump Fault',
  description: 'Chlorine pump fails. Residual decays below 0.5 mg/L regulatory minimum. Restore dosing before violation.',
  difficulty: 'Advanced',
  duration: 0,
  steps: [
    { triggerAt: 60, action: 'faultPump', params: { pumpId: 'chlorinePump' } },
  ],
};
