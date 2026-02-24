import { create } from 'zustand';
import { config } from '../simulation/config';

type ThresholdSet = { ll?: number; l?: number; h?: number; hh?: number };
type AlarmThresholds = Record<string, ThresholdSet>;

interface SettingsStore {
  alarmThresholds: AlarmThresholds;
  setAlarmThreshold: (tag: string, level: 'll' | 'l' | 'h' | 'hh', value: number | undefined) => void;
  resetThresholds: () => void;
}

const defaultThresholds: AlarmThresholds = JSON.parse(JSON.stringify(config.alarmThresholds));

export const useSettingsStore = create<SettingsStore>((set) => ({
  alarmThresholds: JSON.parse(JSON.stringify(defaultThresholds)),

  setAlarmThreshold: (tag, level, value) => {
    set((s) => {
      const updated: AlarmThresholds = {
        ...s.alarmThresholds,
        [tag]: { ...s.alarmThresholds[tag], [level]: value },
      };
      // Propagate to running engine — imported lazily to avoid circular init order
      import('../simulation/engine').then(({ getEngine }) => {
        getEngine().setAlarmThresholds(updated);
      });
      return { alarmThresholds: updated };
    });
  },

  resetThresholds: () => {
    const reset: AlarmThresholds = JSON.parse(JSON.stringify(defaultThresholds));
    set({ alarmThresholds: reset });
    import('../simulation/engine').then(({ getEngine }) => {
      getEngine().setAlarmThresholds(reset);
    });
  },
}));
