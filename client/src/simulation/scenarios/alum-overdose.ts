import type { ScenarioDefinition } from './index';

export const alumOverdose: ScenarioDefinition = {
  id: 'alum-overdose',
  name: 'Stuck Alum Valve',
  description: 'Alum dose doubles due to stuck valve. Monitor and correct pH drop.',
  difficulty: 'Intermediate',
  duration: 0,
  steps: [
    { triggerAt: 30, action: 'setAlumDose', params: { value: 36 } },
  ],
};
