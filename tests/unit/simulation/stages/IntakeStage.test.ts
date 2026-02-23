import { describe, it, expect, beforeEach } from 'vitest';
import { IntakeStage } from '../../../../client/src/simulation/stages/IntakeStage';
import { createInitialState } from '../../../../client/src/simulation/ProcessState';
import type { IntakeState } from '../../../../client/src/simulation/ProcessState';

function baseIntake(): IntakeState {
  return createInitialState().intake;
}

function runTicks(stage: IntakeStage, state: IntakeState, ticks: number, dt = 0.5): IntakeState {
  let s = state;
  for (let i = 0; i < ticks; i++) s = stage.update(s, dt);
  return s;
}

describe('IntakeStage', () => {
  let stage: IntakeStage;

  beforeEach(() => {
    stage = new IntakeStage();
  });

  it('flow converges to 0 when both pumps are off', () => {
    let s = baseIntake();
    s.intakePump1 = { ...s.intakePump1, running: false };
    s.intakePump2 = { ...s.intakePump2, running: false };
    s = runTicks(stage, s, 200);
    expect(s.rawWaterFlow).toBeCloseTo(0, 1);
  });

  it('flow converges to 2.25 MGD for a single pump at 50% speed', () => {
    let s = baseIntake();
    s.intakePump1 = { ...s.intakePump1, running: true, speed: 50 };
    s.intakePump2 = { ...s.intakePump2, running: false };
    s.intakeValve = { ...s.intakeValve, open: true, position: 100 };
    s.rawWaterFlow = 0;
    s = runTicks(stage, s, 500);
    // 4.5 * 0.5 = 2.25 MGD
    expect(s.rawWaterFlow).toBeCloseTo(2.25, 1);
  });

  it('flow converges to 9.0 MGD with both pumps at 100%', () => {
    let s = baseIntake();
    s.intakePump1 = { ...s.intakePump1, running: true, speed: 100 };
    s.intakePump2 = { ...s.intakePump2, running: true, speed: 100 };
    s.intakeValve = { ...s.intakeValve, open: true, position: 100 };
    s.rawWaterFlow = 0;
    s = runTicks(stage, s, 500);
    expect(s.rawWaterFlow).toBeCloseTo(9.0, 1);
  });

  it('faulted pump contributes no flow (running + fault → 0)', () => {
    let s = baseIntake();
    s.intakePump1 = { ...s.intakePump1, running: true, fault: true, speed: 100 };
    s.intakePump2 = { ...s.intakePump2, running: false };
    s.rawWaterFlow = 0;
    s = runTicks(stage, s, 200);
    expect(s.rawWaterFlow).toBeCloseTo(0, 1);
  });

  it('closed valve results in zero flow regardless of pump state', () => {
    let s = baseIntake();
    s.intakePump1 = { ...s.intakePump1, running: true, speed: 100 };
    s.intakeValve = { ...s.intakeValve, open: false };
    s.rawWaterFlow = 5;
    s = runTicks(stage, s, 200);
    expect(s.rawWaterFlow).toBeCloseTo(0, 1);
  });

  it('50% valve position halves flow compared to 100%', () => {
    const makeFlow = (position: number) => {
      const st = new IntakeStage();
      let s = baseIntake();
      s.intakePump1 = { ...s.intakePump1, running: true, speed: 100 };
      s.intakePump2 = { ...s.intakePump2, running: false };
      s.intakeValve = { ...s.intakeValve, open: true, position };
      s.rawWaterFlow = 0;
      return runTicks(st, s, 500).rawWaterFlow;
    };
    const full = makeFlow(100);
    const half = makeFlow(50);
    expect(half).toBeCloseTo(full / 2, 1);
  });

  it('run hours accumulate when pump is running and not faulted', () => {
    let s = baseIntake();
    s.intakePump1 = { ...s.intakePump1, running: true, fault: false, runHours: 0 };
    s = stage.update(s, 3600); // 1 simulated hour
    expect(s.intakePump1.runHours).toBeCloseTo(1, 5);
  });

  it('run hours do not accumulate when pump is faulted', () => {
    let s = baseIntake();
    s.intakePump1 = { ...s.intakePump1, running: true, fault: true, runHours: 10 };
    s = stage.update(s, 3600);
    expect(s.intakePump1.runHours).toBe(10);
  });

  it('screen diff pressure increases over time and clamps at 12 PSI', () => {
    let s = baseIntake();
    s.screenDiffPressure = 11.9;
    s = runTicks(stage, s, 1000, 0.5);
    expect(s.screenDiffPressure).toBe(12);
  });
});
