import { describe, it, expect, beforeEach } from 'vitest';
import { AlarmManager } from '../AlarmManager';
import { createInitialState } from '../ProcessState';
import type { ProcessState } from '../ProcessState';

function makeState(overrides?: Partial<{
  chlorineResidualPlant: number;
  chlorineResidualDist: number;
  finishedWaterPH: number;
  filterEffluentTurbidity: number;
}>): ProcessState {
  const state = createInitialState();
  if (overrides) {
    state.disinfection = { ...state.disinfection, ...overrides };
    if (overrides.filterEffluentTurbidity !== undefined) {
      state.sedimentation = {
        ...state.sedimentation,
        filterEffluentTurbidity: overrides.filterEffluentTurbidity,
      };
    }
  }
  return state;
}

describe('AlarmManager', () => {
  let manager: AlarmManager;

  beforeEach(() => {
    manager = new AlarmManager();
  });

  it('produces zero alarms for normal initial state', () => {
    const state = createInitialState();
    const { newAlarms } = manager.evaluate(state);
    expect(newAlarms).toHaveLength(0);
  });

  describe('DIS-AIT-001 — Plant Cl₂ (EPA MRDL)', () => {
    it('raises HH (CRITICAL) at ≥ 4.0 mg/L', () => {
      const state = makeState({ chlorineResidualPlant: 4.0 });
      const { newAlarms } = manager.evaluate(state);
      const alarm = newAlarms.find(a => a.id === 'DIS-AIT-001-HH');
      expect(alarm).toBeDefined();
      expect(alarm?.priority).toBe('CRITICAL');
    });

    it('does not raise HH below 4.0 mg/L', () => {
      const state = makeState({ chlorineResidualPlant: 3.99 });
      const { newAlarms } = manager.evaluate(state);
      expect(newAlarms.find(a => a.id === 'DIS-AIT-001-HH')).toBeUndefined();
    });

    it('raises H (HIGH) between 3.0 and 4.0 mg/L', () => {
      const state = makeState({ chlorineResidualPlant: 3.5 });
      const { newAlarms } = manager.evaluate(state);
      const alarm = newAlarms.find(a => a.id === 'DIS-AIT-001-H');
      expect(alarm).toBeDefined();
      expect(alarm?.priority).toBe('HIGH');
    });
  });

  describe('DIS-AIT-002 — Distribution Cl₂ (EPA SWTR min)', () => {
    it('raises LL (CRITICAL) at ≤ 0.2 mg/L', () => {
      const state = makeState({ chlorineResidualDist: 0.2 });
      const { newAlarms } = manager.evaluate(state);
      const alarm = newAlarms.find(a => a.id === 'DIS-AIT-002-LL');
      expect(alarm).toBeDefined();
      expect(alarm?.priority).toBe('CRITICAL');
    });

    it('does not raise LL above 0.2 mg/L', () => {
      const state = makeState({ chlorineResidualDist: 0.21 });
      const { newAlarms } = manager.evaluate(state);
      expect(newAlarms.find(a => a.id === 'DIS-AIT-002-LL')).toBeUndefined();
    });
  });

  describe('DIS-AIT-003 — Finished Water pH (EPA SMCL)', () => {
    it('raises LL (CRITICAL) at ≤ 6.5', () => {
      const state = makeState({ finishedWaterPH: 6.5 });
      const { newAlarms } = manager.evaluate(state);
      const alarm = newAlarms.find(a => a.id === 'DIS-AIT-003-LL');
      expect(alarm).toBeDefined();
      expect(alarm?.priority).toBe('CRITICAL');
    });

    it('raises HH (CRITICAL) at ≥ 8.5', () => {
      const state = makeState({ finishedWaterPH: 8.5 });
      const { newAlarms } = manager.evaluate(state);
      const alarm = newAlarms.find(a => a.id === 'DIS-AIT-003-HH');
      expect(alarm).toBeDefined();
      expect(alarm?.priority).toBe('CRITICAL');
    });

    it('raises L (MEDIUM) between ll and l thresholds (6.5 < pH ≤ 6.8)', () => {
      const state = makeState({ finishedWaterPH: 6.7 });
      const { newAlarms } = manager.evaluate(state);
      const alarm = newAlarms.find(a => a.id === 'DIS-AIT-003-L');
      expect(alarm).toBeDefined();
      expect(alarm?.priority).toBe('MEDIUM');
    });

    it('does not raise L when LL is already active', () => {
      const state = makeState({ finishedWaterPH: 6.5 });
      const { newAlarms } = manager.evaluate(state);
      // LL fires; L should not because value <= ll threshold
      expect(newAlarms.find(a => a.id === 'DIS-AIT-003-L')).toBeUndefined();
    });
  });

  describe('FLT-AIT-001 — Filter Effluent Turbidity (LT2ESWTR)', () => {
    it('raises H (HIGH) at ≥ 0.3 NTU', () => {
      const state = createInitialState();
      state.sedimentation.filterEffluentTurbidity = 0.3;
      const { newAlarms } = manager.evaluate(state);
      const alarm = newAlarms.find(a => a.id === 'FLT-AIT-001-H');
      expect(alarm).toBeDefined();
      expect(alarm?.priority).toBe('HIGH');
    });

    it('raises HH (CRITICAL) at ≥ 0.5 NTU', () => {
      const state = createInitialState();
      state.sedimentation.filterEffluentTurbidity = 0.5;
      const { newAlarms } = manager.evaluate(state);
      const alarm = newAlarms.find(a => a.id === 'FLT-AIT-001-HH');
      expect(alarm).toBeDefined();
      expect(alarm?.priority).toBe('CRITICAL');
    });

    it('does not raise H when HH is active (value ≥ 0.5)', () => {
      const state = createInitialState();
      state.sedimentation.filterEffluentTurbidity = 0.5;
      const { newAlarms } = manager.evaluate(state);
      expect(newAlarms.find(a => a.id === 'FLT-AIT-001-H')).toBeUndefined();
    });
  });

  describe('Alarm lifecycle', () => {
    it('produces valueUpdates when alarm already active in state', () => {
      const state = makeState({ chlorineResidualPlant: 4.0 });
      // First evaluate: no existing alarms → newAlarms fires
      const { newAlarms } = manager.evaluate(state);
      expect(newAlarms.length).toBeGreaterThan(0);

      // Add the alarm into state and re-evaluate same value
      state.alarms = [...newAlarms];
      const { valueUpdates } = manager.evaluate(state);
      const update = valueUpdates.find(u => u.id === 'DIS-AIT-001-HH');
      expect(update).toBeDefined();
      expect(update?.value).toBe(4.0);
    });

    it('produces clearedAlarms when value returns to normal', () => {
      // Raise alarm
      const state = makeState({ chlorineResidualPlant: 4.0 });
      const { newAlarms } = manager.evaluate(state);
      state.alarms = [...newAlarms];

      // Return to normal
      const cleared = makeState({ chlorineResidualPlant: 1.8 });
      cleared.alarms = [...state.alarms];
      const { clearedAlarms } = manager.evaluate(cleared);
      expect(clearedAlarms.find(a => a.id === 'DIS-AIT-001-HH')).toBeDefined();
    });
  });
});
