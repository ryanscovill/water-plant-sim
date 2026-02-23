import { create } from 'zustand';

export interface OperatorEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
}

interface OperatorEventStore {
  events: OperatorEvent[];
  addEvent: (event: OperatorEvent) => void;
  clearEvents: () => void;
}

export const useEventStore = create<OperatorEventStore>((set) => ({
  events: [],
  addEvent: (event) =>
    set((s) => ({
      events: [event, ...s.events].slice(0, 500),
    })),
  clearEvents: () => set({ events: [] }),
}));
