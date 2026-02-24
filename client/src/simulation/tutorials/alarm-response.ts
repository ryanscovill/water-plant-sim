import type { TutorialDefinition } from './index';
import { getEngine } from '../engine';

export const alarmResponse: TutorialDefinition = {
  id: 'alarm-response',
  title: 'Responding to Process Alarms',
  description: 'Learn the proper procedure for identifying and responding to process alarms.',
  onStart() {
    // Inject elevated raw turbidity so INT-AIT-001 H alarm fires immediately.
    // sourceTurbidityBase keeps it elevated; rawTurbidity seeds the lag filter
    // so the alarm appears on the first engine tick rather than after ~100 s.
    getEngine().injectScenario((state) => ({
      ...state,
      intake: {
        ...state.intake,
        sourceTurbidityBase: 250,
        rawTurbidity: 250,
      },
    }));
  },
  steps: [
    {
      id: 'step-1',
      instruction: 'An alarm is active! Look at the alarm banner at the top of the screen.',
      spotlight: 'alarm-banner',
      hint: 'Look at the red/amber banner at the top of the screen.',
    },
    {
      id: 'step-2',
      instruction: 'Navigate to the Alarms page to see all active alarms.',
      spotlight: 'nav-alarms',
      hint: 'Click "Alarms" in the left navigation menu.',
    },
    {
      id: 'step-3',
      instruction: 'Review the active alarm details — note the tag name, current value, and priority.',
      spotlight: 'alarm-list',
      hint: 'Read the alarm row to understand what process tag is in alarm.',
    },
    {
      id: 'step-4',
      instruction: 'Navigate to the Intake screen to investigate the cause of the alarm.',
      spotlight: 'nav-intake',
      hint: 'Click "Intake" in the left navigation menu.',
    },
    {
      id: 'step-5',
      instruction: 'Observe the raw turbidity reading. It is elevated. Navigate to Coagulation.',
      spotlight: 'hmi-rawTurbidity',
      hint: 'Look at the turbidity analyzer tag on the intake screen.',
    },
    {
      id: 'step-6',
      instruction: 'Increase the alum dose setpoint to compensate for high turbidity.',
      spotlight: 'hmi-alumDose',
      waitFor: 'coagulation.alumDoseSetpoint > 20',
      hint: 'Click the alum dose setpoint and increase it.',
    },
    {
      id: 'step-7',
      instruction: 'Well done! Monitor the floc turbidity to confirm improvement.',
      spotlight: 'hmi-flocTurbidity',
      hint: 'Watch the floc turbidity value decrease over time.',
    },
  ],
};
