export interface TutorialStep {
  id: string;
  instruction: string;
  spotlight: string;
  waitFor?: string;
  hint?: string;
}

export interface TutorialDefinition {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
}

export { startupProcedure } from './startup-procedure';
export { alarmResponse } from './alarm-response';
export { backwashProcedure } from './backwash-procedure';
export { chlorinationAdjustment } from './chlorination-adjustment';
