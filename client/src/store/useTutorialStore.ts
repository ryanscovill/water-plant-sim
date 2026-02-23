import { create } from 'zustand';
import type { Tutorial } from '../types/tutorials';

interface TutorialStore {
  activeTutorial: Tutorial | null;
  currentStep: number;
  completed: boolean;
  startTutorial: (tutorial: Tutorial) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeTutorial: () => void;
  exitTutorial: () => void;
}

export const useTutorialStore = create<TutorialStore>((set) => ({
  activeTutorial: null,
  currentStep: 0,
  completed: false,

  startTutorial: (tutorial) => set({ activeTutorial: tutorial, currentStep: 0, completed: false }),

  nextStep: () =>
    set((s) => {
      if (!s.activeTutorial) return s;
      const nextIdx = s.currentStep + 1;
      if (nextIdx >= s.activeTutorial.steps.length) {
        return { currentStep: nextIdx, completed: true };
      }
      return { currentStep: nextIdx };
    }),

  prevStep: () =>
    set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),

  completeTutorial: () => set({ completed: true }),

  exitTutorial: () => set({ activeTutorial: null, currentStep: 0, completed: false }),
}));
