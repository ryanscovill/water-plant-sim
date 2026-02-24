import type { TutorialDefinition } from './index';

export const startupProcedure: TutorialDefinition = {
  id: 'startup-procedure',
  title: 'Plant Startup Procedure',
  description: 'Learn to navigate the HMI and bring the plant online from a stopped state.',
  steps: [
    {
      id: 'step-1',
      instruction: 'Welcome to the Plant Startup tutorial. First, navigate to the Intake screen using the left sidebar.',
      spotlight: 'nav-intake',
      hint: 'Click "Intake" in the left navigation menu.',
    },
    {
      id: 'step-2',
      instruction: 'You are on the Intake screen. Click on Intake Pump 1 to open the control panel.',
      spotlight: 'hmi-intakePump1',
      clickToAdvance: true,
      hint: 'Click the pump symbol labeled "P-101" on the HMI.',
    },
    {
      id: 'step-3',
      instruction: 'Click "Start" to start Intake Pump 1. Watch the flow meter reading increase.',
      spotlight: 'ctrl-pump-start',
      waitFor: 'intake.intakePump1.running === true',
      hint: 'Click the green "Start" button in the pump control panel.',
    },
    {
      id: 'step-4',
      instruction: 'Good! Pump 1 is running. Now navigate to the Coagulation screen.',
      spotlight: 'nav-coagulation',
      hint: 'Click "Coagulation" in the left navigation menu.',
    },
    {
      id: 'step-5',
      instruction: 'Verify that the alum pump and mixers are running. Check the alum dose setpoint is set to 18 mg/L.',
      spotlight: 'hmi-alumDose',
      clickToAdvance: true,
      hint: 'Look at the chemical feed display showing alum dose rate.',
    },
    {
      id: 'step-6',
      instruction: 'Navigate to the Disinfection screen and verify chlorine pump is running.',
      spotlight: 'nav-disinfection',
      waitFor: 'disinfection.chlorinePumpStatus.running === true',
      hint: 'Click "Disinfection" in the left navigation menu.',
    },
    {
      id: 'step-7',
      instruction: 'Check the chlorine residual. It should be between 0.5 and 3.0 mg/L. Navigate to Trends to see the history.',
      spotlight: 'nav-trends',
      hint: 'Click "Trends" in the left navigation menu.',
    },
    {
      id: 'step-8',
      instruction: 'Excellent! Plant startup is complete. All systems are running normally. You can now monitor the process from the Overview screen.',
      spotlight: 'nav-overview',
      hint: 'Click "Overview" in the left navigation menu.',
    },
  ],
};
