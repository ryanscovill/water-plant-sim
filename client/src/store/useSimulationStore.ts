import { create } from 'zustand';
import type { ProcessState } from '../types/process';

interface SimulationStore {
  state: ProcessState | null;
  connected: boolean;
  setState: (state: ProcessState) => void;
  setConnected: (connected: boolean) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  state: null,
  connected: false,
  setState: (state) => set({ state }),
  setConnected: (connected) => set({ connected }),
}));
