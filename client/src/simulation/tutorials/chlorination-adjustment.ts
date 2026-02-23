import type { TutorialDefinition } from './index';

export const chlorinationAdjustment: TutorialDefinition = {
  id: 'chlorination-adjustment',
  title: 'Chlorine Dose Adjustment',
  description: 'Learn to read chlorine residual trends and adjust the dose setpoint.',
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
      instruction: 'Click on the chlorine dose display to open the setpoint adjustment dialog.',
      spotlight: 'hmi-chlorineDose',
      waitFor: 'disinfection.chlorineDoseSetpoint !== 2.5',
      hint: 'Click the chlorine dose rate display.',
    },
    {
      id: 'step-5',
      instruction: 'Good job! Monitor the residual over the next few minutes to verify the change.',
      spotlight: 'hmi-chlorineResidual',
      hint: 'Watch the chlorine residual value change in response to your adjustment.',
    },
  ],
};
