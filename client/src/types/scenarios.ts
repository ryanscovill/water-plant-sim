export interface ScenarioInfo {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  simSpeed: number;
  minTime: number;
  completionConditionDescriptions: string[];
  active: boolean;
}
