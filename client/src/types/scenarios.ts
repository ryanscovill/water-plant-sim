export interface ScenarioInfo {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  active: boolean;
}
