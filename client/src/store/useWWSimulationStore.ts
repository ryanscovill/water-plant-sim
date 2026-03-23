import { create } from 'zustand';
import type { WWProcessState } from '../simulation/ww/WWProcessState';

interface WWSimulationStore {
  state: WWProcessState | null;
  connected: boolean;
  setState: (state: WWProcessState) => void;
  setConnected: (connected: boolean) => void;
}

export const useWWSimulationStore = create<WWSimulationStore>((set) => ({
  state: null,
  connected: false,
  setState: (state) => set({ state }),
  setConnected: (connected) => set({ connected }),
}));
