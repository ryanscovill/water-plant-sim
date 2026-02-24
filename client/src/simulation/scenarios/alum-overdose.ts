import type { ScenarioDefinition } from './index';

export const alumOverdose: ScenarioDefinition = {
  id: 'alum-overdose',
  name: 'Stuck Alum Valve',
  description: 'Alum valve sticks open at T+15s, driving the setpoint to 50 mg/L — nearly triple normal. Floc basin pH will crash. Reduce dosing before filter performance is impacted.',
  difficulty: 'Intermediate',
  duration: 0,
  completionTime: 600,
  steps: [
    { triggerAt: 15, action: 'setAlumDose', params: { value: 50 } },
  ],
};
