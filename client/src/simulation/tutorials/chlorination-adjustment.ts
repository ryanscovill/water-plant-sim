import type { TutorialDefinition } from './index';
import { getEngine } from '../engine';

export const chlorinationAdjustment: TutorialDefinition = {
  id: 'chlorination-adjustment',
  title: 'Chlorine Dose Adjustment',
  description: 'Learn to read chlorine residual trends and adjust the dose setpoint.',
  onStart() {
    // Set the dose setpoint to exactly 2.5 mg/L so the waitFor condition on
    // step 4 (chlorineDoseSetpoint !== 2.5) is not pre-satisfied and the user
    // must actually adjust the setpoint to advance.
    getEngine().injectScenario((state) => ({
      ...state,
      disinfection: {
        ...state.disinfection,
        chlorineDoseSetpoint: 2.5,
      },
    }));
  },
  steps: [
    {
      id: 'step-1',
      instruction: 'Navigate to the Trends page to view the chlorine residual history.',
      spotlight: 'nav-trends',
      hint: 'Click "Trends" in the left navigation menu.',
    },
    {
      id: 'step-2',
      instruction: 'Select "DIS-AIT-001" (Plant Cl2 Residual) from the tag list. Observe the trend.',
      spotlight: 'trend-tag-selector',
      clickToAdvance: true,
      hint: 'Click on DIS-AIT-001 in the tag list.',
    },
    {
      id: 'step-3',
      instruction: 'Navigate to the Disinfection screen to adjust the chlorine dose setpoint.',
      spotlight: 'nav-disinfection',
      hint: 'Click "Disinfection" in the left navigation menu.',
    },
    {
      id: 'step-4',
      instruction: 'Click on the chlorine feed display and change the dose setpoint away from 2.5 mg/L.',
      spotlight: 'hmi-chlorineDose',
      waitFor: 'disinfection.chlorineDoseSetpoint !== 2.5',
      hint: 'Click the chlorine dose feed display to open the setpoint control.',
    },
    {
      id: 'step-5',
      instruction: 'Good job! Monitor the residual over the next few minutes to verify the change.',
      spotlight: 'hmi-chlorineResidual',
      hint: 'Watch the chlorine residual value change in response to your adjustment.',
    },
  ],
};
