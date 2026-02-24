export interface TutorialStep {
  id: string;
  instruction: string;
  spotlight: string;
  waitFor?: string;
  clickToAdvance?: boolean;
  hint?: string;
}

export interface TutorialDefinition {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  onStart?: () => void;
}

export { startupProcedure } from './startup-procedure';
export { alarmResponse } from './alarm-response';
export { backwashProcedure } from './backwash-procedure';
export { chlorinationAdjustment } from './chlorination-adjustment';
