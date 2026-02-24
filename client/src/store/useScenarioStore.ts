import { create } from 'zustand';
import type { ScenarioInfo } from '../types/scenarios';

interface ScenarioStore {
  scenarios: ScenarioInfo[];
  activeScenarioId: string | null;
  completedScenarioName: string | null;
  setScenarios: (scenarios: ScenarioInfo[]) => void;
  setActiveScenario: (id: string | null) => void;
  setCompletedScenario: (name: string | null) => void;
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  scenarios: [],
  activeScenarioId: null,
  completedScenarioName: null,
  setScenarios: (scenarios) => set({ scenarios }),
  setActiveScenario: (id) => set({ activeScenarioId: id }),
  setCompletedScenario: (name) => set({ completedScenarioName: name }),
}));
