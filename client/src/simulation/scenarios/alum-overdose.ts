import type { ScenarioDefinition } from './index';

export const alumOverdose: ScenarioDefinition = {
  id: 'alum-overdose',
  name: 'Stuck Alum Valve',
  description: 'Alum valve sticks open at T+15s, driving the setpoint to 50 mg/L — nearly triple normal. Floc basin pH will crash. Reduce dosing before filter performance is impacted.',
  difficulty: 'Intermediate',
  duration: 0,
  simSpeed: 60,
  minTime: 60,
  completionConditions: [
    {
      description: 'Alum dose setpoint < 5 mg/L',
      check: (s) => s.coagulation.alumDoseSetpoint < 5,
    },
    {
      description: 'Finished water pH ≥ 7.0 (not crashing)',
      check: (s) => s.disinfection.finishedWaterPH >= 7.0,
    },
    {
      description: 'Floc basin turbidity < 5.0 NTU',
      check: (s) => s.sedimentation.clarifierTurbidity < 5.0,
    },
  ],
  steps: [
    { triggerAt: 15, action: 'setAlumDose', params: { value: 50 } },
  ],
};
