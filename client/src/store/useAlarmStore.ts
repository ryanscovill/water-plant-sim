import { create } from 'zustand';
import type { Alarm } from '../types/process';

interface AlarmStore {
  alarms: Alarm[];
  history: Alarm[];
  setAlarms: (alarms: Alarm[]) => void;
  addAlarm: (alarm: Alarm) => void;
  clearAlarm: (alarm: Alarm) => void;
  acknowledgeAlarm: (id: string) => void;
  acknowledgeAll: () => void;
  addHistory: (alarm: Alarm) => void;
  resetAlarms: () => void;
}

export const useAlarmStore = create<AlarmStore>((set) => ({
  alarms: [],
  history: [],

  setAlarms: (alarms) => set({ alarms }),

  addAlarm: (alarm) =>
    set((s) => ({
      alarms: s.alarms.some((a) => a.id === alarm.id) ? s.alarms : [...s.alarms, alarm],
      history: [alarm, ...s.history].slice(0, 500),
    })),

  clearAlarm: (alarm) =>
    set((s) => ({
      alarms: s.alarms.filter((a) => a.id !== alarm.id),
      history: s.history.map((a) => (a.id === alarm.id ? { ...a, ...alarm } : a)),
    })),

  acknowledgeAlarm: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) =>
        a.id === id ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() } : a
      ),
    })),

  acknowledgeAll: () =>
    set((s) => ({
      alarms: s.alarms.map((a) => ({
        ...a,
        acknowledged: true,
        acknowledgedAt: a.acknowledged ? a.acknowledgedAt : new Date().toISOString(),
      })),
    })),

  addHistory: (alarm) =>
    set((s) => ({ history: [alarm, ...s.history].slice(0, 500) })),

  resetAlarms: () => set({ alarms: [], history: [] }),
}));
