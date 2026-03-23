import { describe, it, expect, beforeEach } from 'vitest';
import { HeadworksStage } from '../../../../../client/src/simulation/ww/stages/HeadworksStage';
import { createInitialWWState } from '../../../../../client/src/simulation/ww/WWProcessState';
import type { HeadworksState } from '../../../../../client/src/simulation/ww/WWProcessState';

function baseHeadworks(): HeadworksState {
  return createInitialWWState().headworks;
}

function runTicks(stage: HeadworksStage, state: HeadworksState, ticks: number, dt = 0.5): HeadworksState {
  let s = state;
  for (let i = 0; i < ticks; i++) s = stage.update(s, dt);
  return s;
}

describe('HeadworksStage', () => {
  let stage: HeadworksStage;

  beforeEach(() => {
    stage = new HeadworksStage();
  });

  // ── Flow physics ──────────────────────────────────────────────────────────

  it('flow converges to 0 when both pumps are off', () => {
    let s = baseHeadworks();
    s.influentPump1 = { ...s.influentPump1, running: false };
    s.influentPump2 = { ...s.influentPump2, running: false };
    s = runTicks(stage, s, 200);
    expect(s.influentFlow).toBeCloseTo(0, 1);
  });

  it('flow converges to 5.0 MGD for a single pump at 100% speed', () => {
    let s = baseHeadworks();
    s.influentPump1 = { ...s.influentPump1, running: true, speed: 100 };
    s.influentPump2 = { ...s.influentPump2, running: false };
    s.influentValve = { ...s.influentValve, open: true, position: 100 };
    s.influentFlow = 0;
    s = runTicks(stage, s, 500);
    expect(s.influentFlow).toBeCloseTo(5.0, 1);
  });

  it('flow converges to 10.0 MGD with both pumps at 100%', () => {
    let s = baseHeadworks();
    s.influentPump1 = { ...s.influentPump1, running: true, speed: 100 };
    s.influentPump2 = { ...s.influentPump2, running: true, speed: 100 };
    s.influentValve = { ...s.influentValve, open: true, position: 100 };
    s.influentFlow = 0;
    s = runTicks(stage, s, 500);
    expect(s.influentFlow).toBeCloseTo(10.0, 1);
  });

  it('faulted pump contributes no flow (running + fault -> 0)', () => {
    let s = baseHeadworks();
    s.influentPump1 = { ...s.influentPump1, running: true, fault: true, speed: 100 };
    s.influentPump2 = { ...s.influentPump2, running: false };
    s.influentFlow = 0;
    s = runTicks(stage, s, 200);
    expect(s.influentFlow).toBeCloseTo(0, 1);
  });

  it('closed valve results in zero flow regardless of pump state', () => {
    let s = baseHeadworks();
    s.influentPump1 = { ...s.influentPump1, running: true, speed: 100 };
    s.influentPump2 = { ...s.influentPump2, running: true, speed: 100 };
    s.influentValve = { ...s.influentValve, open: false, position: 0 };
    s.influentFlow = 8;
    s = runTicks(stage, s, 200);
    expect(s.influentFlow).toBeCloseTo(0, 1);
  });

  it('50% valve position halves flow compared to 100%', () => {
    const makeFlow = (position: number) => {
      const st = new HeadworksStage();
      let s = baseHeadworks();
      s.influentPump1 = { ...s.influentPump1, running: true, speed: 100 };
      s.influentPump2 = { ...s.influentPump2, running: false };
      s.influentValve = { ...s.influentValve, open: true, position };
      s.influentFlow = 0;
      return runTicks(st, s, 500).influentFlow;
    };
    const full = makeFlow(100);
    const half = makeFlow(50);
    expect(half).toBeCloseTo(full / 2, 1);
  });

  // ── Run hours ─────────────────────────────────────────────────────────────

  it('run hours accumulate when pump is running and not faulted', () => {
    let s = baseHeadworks();
    s.influentPump1 = { ...s.influentPump1, running: true, fault: false, runHours: 0 };
    s = stage.update(s, 3600); // 1 simulated hour
    expect(s.influentPump1.runHours).toBeCloseTo(1, 5);
  });

  it('run hours do not accumulate when pump is faulted', () => {
    let s = baseHeadworks();
    s.influentPump1 = { ...s.influentPump1, running: true, fault: true, runHours: 10 };
    s = stage.update(s, 3600);
    expect(s.influentPump1.runHours).toBe(10);
  });

  it('grit collector run hours accumulate when running', () => {
    let s = baseHeadworks();
    s.gritCollectorStatus = { ...s.gritCollectorStatus, running: true, fault: false, runHours: 0 };
    s = stage.update(s, 3600);
    expect(s.gritCollectorStatus.runHours).toBeCloseTo(1, 5);
  });

  // ── Bar screen DP ─────────────────────────────────────────────────────────

  it('bar screen DP increases over time', () => {
    let s = baseHeadworks();
    s.barScreenDiffPressure = 5.0;
    s = runTicks(stage, s, 100, 0.5);
    expect(s.barScreenDiffPressure).toBeGreaterThan(5.0);
  });

  it('bar screen DP clamps at 30', () => {
    let s = baseHeadworks();
    s.barScreenDiffPressure = 29.9;
    // SCREEN_DRIFT_RATE = 0.0015 in H2O/s; 0.1 / 0.0015 = 66.7s = ~134 ticks at dt=0.5
    s = runTicks(stage, s, 200, 0.5);
    expect(s.barScreenDiffPressure).toBe(30);
  });

  it('clearScreen resets DP to 3.0', () => {
    let s = baseHeadworks();
    s.barScreenDiffPressure = 20.0;
    s = stage.clearScreen(s);
    expect(s.barScreenDiffPressure).toBe(3.0);
  });

  // ── Influent quality ──────────────────────────────────────────────────────

  it('higher sourceBODBase results in higher influentBOD over time', () => {
    const lowBase = baseHeadworks();
    lowBase.sourceBODBase = 100;
    lowBase.influentBOD = 100;

    const highBase = baseHeadworks();
    highBase.sourceBODBase = 400;
    highBase.influentBOD = 400;

    const lowResult = runTicks(new HeadworksStage(), lowBase, 500);
    const highResult = runTicks(new HeadworksStage(), highBase, 500);

    expect(highResult.influentBOD).toBeGreaterThan(lowResult.influentBOD);
  });

  it('influentBOD converges toward sourceBODBase', () => {
    let s = baseHeadworks();
    s.sourceBODBase = 200;
    s.influentBOD = 50; // start far from base
    s = runTicks(stage, s, 2000);
    // Should converge closer to 200 (tau=300s, 2000 ticks at 0.5s = 1000s > 3*tau)
    expect(s.influentBOD).toBeGreaterThan(150);
  });

  it('influentTSS is reduced by grit removal when collector running', () => {
    let s = baseHeadworks();
    s.sourceTSSBase = 300;
    s.influentTSS = 300;
    s.gritCollectorStatus = { ...s.gritCollectorStatus, running: true, fault: false };
    s = runTicks(stage, s, 2000);
    // With grit efficiency 0.85, TSS target = 300 * (1 - 0.85) = 45 → should drop significantly
    // But grit only removes grit fraction, so actual target = 300 * (1 - 0.85 * gritFraction)
    // With our model: target = sourceTSSBase * (1 - gritEfficiency * GRIT_TSS_FRACTION)
    // Simplified: just check it converges below source
    expect(s.influentTSS).toBeLessThan(300);
  });

  it('influentTSS is higher when grit collector is off', () => {
    const makeWith = (gritRunning: boolean) => {
      const st = new HeadworksStage();
      let s = baseHeadworks();
      s.sourceTSSBase = 250;
      s.influentTSS = 250;
      s.gritCollectorStatus = { ...s.gritCollectorStatus, running: gritRunning, fault: false };
      return runTicks(st, s, 2000).influentTSS;
    };
    const withGrit = makeWith(true);
    const withoutGrit = makeWith(false);
    expect(withoutGrit).toBeGreaterThan(withGrit);
  });
});
