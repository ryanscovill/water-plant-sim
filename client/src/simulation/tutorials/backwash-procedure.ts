import type { TutorialDefinition } from './index';

export const backwashProcedure: TutorialDefinition = {
  id: 'backwash-procedure',
  title: 'Filter Backwash Procedure',
  description: 'Learn to recognize when a filter needs backwashing and how to initiate the procedure.',
  steps: [
    {
      id: 'step-1',
      instruction: 'Navigate to the Sedimentation/Filtration screen to check filter status.',
      spotlight: 'nav-sedimentation',
      hint: 'Click "Sedimentation" in the left navigation menu.',
    },
    {
      id: 'step-2',
      instruction: 'Observe the Filter Head Loss value. When it reaches 8 feet, backwash is required.',
      spotlight: 'hmi-filterHeadLoss',
      hint: 'Look at the filter head loss indicator (FLT-PDT-001).',
    },
    {
      id: 'step-3',
      instruction: 'Also check the Filter Run Time. Backwash is required every 72 hours regardless of head loss.',
      spotlight: 'hmi-filterRunTime',
      hint: 'Look at the filter run time display.',
    },
    {
      id: 'step-4',
      instruction: 'Click the Filter Bed symbol to open the filter control panel.',
      spotlight: 'hmi-filterBed',
      hint: 'Click on the filter bed symbol on the HMI.',
    },
    {
      id: 'step-5',
      instruction: 'Click "Start Backwash" to initiate the backwash sequence.',
      spotlight: 'ctrl-backwash-start',
      waitFor: 'sedimentation.backwashInProgress === true',
      hint: 'Click the "Start Backwash" button in the filter control panel.',
    },
    {
      id: 'step-6',
      instruction: 'Backwash is in progress! Monitor the countdown timer. After 10 minutes, head loss will reset.',
      spotlight: 'hmi-backwashTimer',
      hint: 'Watch the backwash timer count down.',
    },
  ],
};
