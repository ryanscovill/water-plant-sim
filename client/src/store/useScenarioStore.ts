import { create } from 'zustand';
import type { ScenarioInfo } from '../types/scenarios';

interface ScenarioStore {
  scenarios: ScenarioInfo[];
  activeScenarioId: string | null;
  completedScenarioName: string | null;
  completedScenarioConditions: string[];
  setScenarios: (scenarios: ScenarioInfo[]) => void;
  setActiveScenario: (id: string | null) => void;
  setCompletedScenario: (name: string | null, conditions?: string[]) => void;
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  scenarios: [],
  activeScenarioId: null,
  completedScenarioName: null,
  completedScenarioConditions: [],
  setScenarios: (scenarios) => set({ scenarios }),
  setActiveScenario: (id) => set({ activeScenarioId: id }),
  setCompletedScenario: (name, conditions = []) => set({ completedScenarioName: name, completedScenarioConditions: conditions }),
}));
