export interface TutorialStep {
  id: string;
  instruction: string;
  spotlight: string;
  waitFor?: string;
  clickToAdvance?: boolean;
  hint?: string;
}

export interface TutorialInfo {
  id: string;
  title: string;
  description: string;
  stepCount: number;
}

export interface Tutorial extends TutorialInfo {
  steps: TutorialStep[];
}
