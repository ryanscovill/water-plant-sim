import { create } from 'zustand';
import type { ScenarioInfo } from '../types/scenarios';

interface ScenarioStore {
  scenarios: ScenarioInfo[];
  activeScenarioId: string | null;
  setScenarios: (scenarios: ScenarioInfo[]) => void;
  setActiveScenario: (id: string | null) => void;
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  scenarios: [],
  activeScenarioId: null,
  setScenarios: (scenarios) => set({ scenarios }),
  setActiveScenario: (id) => set({ activeScenarioId: id }),
}));
