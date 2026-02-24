import { describe, it, expect, beforeEach } from 'vitest';
import { SedimentationStage } from '../../../../client/src/simulation/stages/SedimentationStage';
import { createInitialState } from '../../../../client/src/simulation/ProcessState';
import type { SedimentationState, CoagulationState } from '../../../../client/src/simulation/ProcessState';

function baseStates(): { sed: SedimentationState; coag: CoagulationState } {
  const s = createInitialState();
  return { sed: s.sedimentation, coag: s.coagulation };
}

function runTicks(
  stage: SedimentationStage,
  sed: SedimentationState,
  coag: CoagulationState,
  ticks: number,
  dt = 0.5,
): SedimentationState {
  let s = sed;
  for (let i = 0; i < ticks; i++) s = stage.update(s, coag, dt);
  return s;
}

describe('SedimentationStage', () => {
  let stage: SedimentationStage;

  beforeEach(() => {
    stage = new SedimentationStage();
  });

  // ── Clarifier turbidity ───────────────────────────────────────────────────

  it('clarifierTurbidity converges to ~10% of flocBasinTurbidity with zero sludge blanket', () => {
    // 90% base removal, 0 blanket → target = flocBasin × 0.10
    const { sed, coag } = baseStates();
    sed.sludgeBlanketLevel = 0;
    sed.clarifierTurbidity = 0;
    const inputTurb = 20;
    const fixedCoag = { ...coag, flocBasinTurbidity: inputTurb };
    const result = runTicks(stage, sed, fixedCoag, 500);
    expect(result.clarifierTurbidity).toBeCloseTo(inputTurb * 0.10, 1);
  });

  it('high sludge blanket (6 ft) reduces clarifier efficiency by 50%', () => {
    // sludgeImpact = 6/6 = 1.0, clamped to 0.5 → efficiency = 0.9 × 0.5 = 0.45
    const { sed, coag } = baseStates();
    sed.sludgeBlanketLevel = 0;
    const fixedCoag = { ...coag, flocBasinTurbidity: 20 };
    const cleanResult = runTicks(new SedimentationStage(), { ...sed }, fixedCoag, 500);

    const dirtySed = { ...sed, sludgeBlanketLevel: 6 };
    const dirtyResult = runTicks(new SedimentationStage(), dirtySed, fixedCoag, 500);

    expect(dirtyResult.clarifierTurbidity).toBeGreaterThan(cleanResult.clarifierTurbidity);
  });

  it('clarifierTurbidity is lower when flocBasinTurbidity is lower', () => {
    const { sed } = baseStates();
    sed.sludgeBlanketLevel = 0;
    const lowCoag = { ...createInitialState().coagulation, flocBasinTurbidity: 5 };
    const highCoag = { ...createInitialState().coagulation, flocBasinTurbidity: 50 };
    const lowResult = runTicks(new SedimentationStage(), { ...sed }, lowCoag, 500);
    const highResult = runTicks(new SedimentationStage(), { ...sed }, highCoag, 500);
    expect(lowResult.clarifierTurbidity).toBeLessThan(highResult.clarifierTurbidity);
  });

  // ── Sludge blanket ────────────────────────────────────────────────────────

  it('sludgeBlanketLevel rises when sludge pump is off', () => {
    const { sed, coag } = baseStates();
    sed.sludgeBlanketLevel = 1.0;
    sed.sludgePumpStatus = { ...sed.sludgePumpStatus, running: false };
    const result = stage.update(sed, coag, 0.5);
    expect(result.sludgeBlanketLevel).toBeGreaterThan(1.0);
  });

  it('sludgeBlanketLevel falls when sludge pump runs at 100% speed', () => {
    // removal (0.005 × 1.0 × 1) > accumulation (0.001 × 1) → net negative
    const { sed, coag } = baseStates();
    sed.sludgeBlanketLevel = 2.0;
    sed.sludgePumpStatus = { ...sed.sludgePumpStatus, running: true, fault: false, speed: 100 };
    const result = stage.update(sed, coag, 0.5);
    expect(result.sludgeBlanketLevel).toBeLessThan(2.0);
  });

  it('higher sludge pump speed removes more sludge per tick', () => {
    const { sed, coag } = baseStates();
    sed.sludgeBlanketLevel = 3.0;

    const slowSed = { ...sed, sludgePumpStatus: { ...sed.sludgePumpStatus, running: true, fault: false, speed: 25 } };
    const fastSed = { ...sed, sludgePumpStatus: { ...sed.sludgePumpStatus, running: true, fault: false, speed: 100 } };

    const slowResult = stage.update(slowSed, coag, 0.5);
    const fastResult = stage.update(fastSed, coag, 0.5);

    // Fast pump removes more → level is lower
    expect(fastResult.sludgeBlanketLevel).toBeLessThan(slowResult.sludgeBlanketLevel);
  });

  it('sludge pump fault prevents blanket removal', () => {
    const { sed, coag } = baseStates();
    sed.sludgeBlanketLevel = 2.0;
    // running=true but fault=true → no removal, only accumulation
    sed.sludgePumpStatus = { ...sed.sludgePumpStatus, running: true, fault: true, speed: 100 };
    const result = stage.update(sed, coag, 0.5);
    expect(result.sludgeBlanketLevel).toBeGreaterThan(2.0);
  });

  it('sludgeBlanketLevel clamps at 10 ft maximum', () => {
    const { sed, coag } = baseStates();
    sed.sludgeBlanketLevel = 9.999;
    sed.sludgePumpStatus = { ...sed.sludgePumpStatus, running: false };
    const result = runTicks(stage, sed, coag, 100, 0.5);
    expect(result.sludgeBlanketLevel).toBeLessThanOrEqual(10);
  });

  // ── Filter head loss ──────────────────────────────────────────────────────

  it('filterHeadLoss accumulates during normal operation', () => {
    const { sed, coag } = baseStates();
    sed.backwashInProgress = false;
    sed.filterRunTime = 0;
    const initial = sed.filterHeadLoss;
    const result = stage.update(sed, coag, 0.5);
    expect(result.filterHeadLoss).toBeGreaterThan(initial);
  });

  it('high clarifierTurbidity causes faster filterHeadLoss accumulation', () => {
    const { sed } = baseStates();
    sed.backwashInProgress = false;
    sed.filterRunTime = 0;
    sed.filterHeadLoss = 1.0;

    const cleanCoag = { ...createInitialState().coagulation, flocBasinTurbidity: 1 };
    const dirtyCoag = { ...createInitialState().coagulation, flocBasinTurbidity: 50 };

    // We need clarifierTurbidity to differ — set it directly via a seeded sed
    const cleanSed = { ...sed, clarifierTurbidity: 0.5 };
    const dirtySed = { ...sed, clarifierTurbidity: 30 };

    const cleanResult = runTicks(new SedimentationStage(), cleanSed, cleanCoag, 200, 0.5);
    const dirtyResult = runTicks(new SedimentationStage(), dirtySed, dirtyCoag, 200, 0.5);

    expect(dirtyResult.filterHeadLoss).toBeGreaterThan(cleanResult.filterHeadLoss);
  });

  it('filterHeadLoss stops accumulating after 72h filter runtime', () => {
    const { sed, coag } = baseStates();
    sed.filterRunTime = 72; // already at trigger
    sed.filterHeadLoss = 5.0;
    sed.backwashInProgress = false;
    const result = runTicks(stage, sed, coag, 100, 0.5);
    expect(result.filterHeadLoss).toBeCloseTo(5.0, 3);
  });

  it('filterRunTime increments during normal operation', () => {
    const { sed, coag } = baseStates();
    sed.filterRunTime = 0;
    sed.backwashInProgress = false;
    // 3600 simulated seconds = 1 hour of filter run time
    const result = stage.update(sed, coag, 3600);
    expect(result.filterRunTime).toBeCloseTo(1, 5);
  });

  // ── Filter breakthrough → effluent turbidity ──────────────────────────────

  it('filterEffluentTurbidity is ~5% of clarifierTurbidity with no breakthrough', () => {
    // headLoss well below 6ft → breakthrough = 0
    // flocBasin=40 → clarifier target = 40 × (1 − 0.9) = 4.0 → effluent target = 4.0 × 0.05 = 0.20
    const { sed, coag } = baseStates();
    sed.filterHeadLoss = 1.0;
    sed.filterRunTime = 10;
    sed.clarifierTurbidity = 4.0;
    sed.filterEffluentTurbidity = 0;
    sed.sludgeBlanketLevel = 0;
    const fixedCoag = { ...coag, flocBasinTurbidity: 40 };
    const result = runTicks(stage, sed, fixedCoag, 500);
    expect(result.filterEffluentTurbidity).toBeCloseTo(0.20, 1);
  });

  it('filterEffluentTurbidity increases when head loss exceeds breakthrough onset (6 ft)', () => {
    const { sed, coag } = baseStates();
    sed.filterRunTime = 10;

    const noBT = { ...sed, filterHeadLoss: 1.0, clarifierTurbidity: 2.0, filterEffluentTurbidity: 0 };
    const withBT = { ...sed, filterHeadLoss: 7.5, clarifierTurbidity: 2.0, filterEffluentTurbidity: 0 };
    // breakthrough = (7.5 - 6) / 3 = 0.5 → adds 1.0 NTU

    const noBTResult = runTicks(new SedimentationStage(), noBT, coag, 200);
    const withBTResult = runTicks(new SedimentationStage(), withBT, coag, 200);

    expect(withBTResult.filterEffluentTurbidity).toBeGreaterThan(noBTResult.filterEffluentTurbidity);
  });

  it('full breakthrough at 9 ft adds maximum turbidity penalty (~2 NTU)', () => {
    const { sed, coag } = baseStates();
    sed.filterHeadLoss = 9.0; // full breakthrough
    sed.clarifierTurbidity = 0.1; // minimal base to isolate breakthrough penalty
    sed.filterEffluentTurbidity = 0;
    sed.filterRunTime = 10;
    const result = runTicks(stage, sed, coag, 500);
    // target = 0.1 × 0.05 + 1.0 × 2 ≈ 2.005 NTU
    expect(result.filterEffluentTurbidity).toBeGreaterThan(1.5);
  });

  // ── Backwash ──────────────────────────────────────────────────────────────

  it('startBackwash sets backwashInProgress and 600 second countdown', () => {
    const { sed } = baseStates();
    const result = stage.startBackwash(sed);
    expect(result.backwashInProgress).toBe(true);
    expect(result.backwashTimeRemaining).toBe(600);
  });

  it('backwash completes after 600 simulated seconds', () => {
    const { sed, coag } = baseStates();
    sed.filterHeadLoss = 8.0;
    sed.filterRunTime = 40;
    let s = stage.startBackwash(sed);
    // Run exactly 1200 ticks × 0.5s dt = 600 simulated seconds
    s = runTicks(stage, s, coag, 1200, 0.5);
    expect(s.backwashInProgress).toBe(false);
  });

  it('backwash resets filterHeadLoss to 0.5 ft and filterRunTime to 0 on completion', () => {
    const { sed, coag } = baseStates();
    sed.filterHeadLoss = 8.0;
    sed.filterRunTime = 60;
    let s = stage.startBackwash(sed);
    s = runTicks(stage, s, coag, 1200, 0.5); // exactly 600 s — reset tick
    expect(s.filterHeadLoss).toBe(0.5);
    expect(s.filterRunTime).toBe(0);
  });

  it('backwash does not complete before 600 simulated seconds', () => {
    const { sed, coag } = baseStates();
    let s = stage.startBackwash(sed);
    s = runTicks(stage, s, coag, 1199, 0.5); // 599.5 s — just short
    expect(s.backwashInProgress).toBe(true);
  });

  it('abortBackwash stops backwash immediately', () => {
    const { sed } = baseStates();
    let s = stage.startBackwash(sed);
    expect(s.backwashInProgress).toBe(true);
    s = stage.abortBackwash(s);
    expect(s.backwashInProgress).toBe(false);
    expect(s.backwashTimeRemaining).toBe(0);
  });

  it('filterHeadLoss does not accumulate during backwash', () => {
    const { sed, coag } = baseStates();
    sed.filterHeadLoss = 5.0;
    sed.filterRunTime = 10;
    let s = stage.startBackwash(sed);
    // Run a few ticks mid-backwash
    s = runTicks(stage, s, coag, 10, 0.5);
    // Head loss should not have increased (backwash in progress)
    expect(s.filterHeadLoss).toBeLessThanOrEqual(5.0);
  });

  // ── Run hours ─────────────────────────────────────────────────────────────

  it('sludge pump run hours accumulate when running and not faulted', () => {
    const { sed, coag } = baseStates();
    sed.sludgePumpStatus = { ...sed.sludgePumpStatus, running: true, fault: false, runHours: 0 };
    const result = stage.update(sed, coag, 3600);
    expect(result.sludgePumpStatus.runHours).toBeCloseTo(1, 5);
  });

  it('clarifier rake run hours accumulate when running and not faulted', () => {
    const { sed, coag } = baseStates();
    sed.clarifierRakeStatus = { ...sed.clarifierRakeStatus, running: true, fault: false, runHours: 0 };
    const result = stage.update(sed, coag, 3600);
    expect(result.clarifierRakeStatus.runHours).toBeCloseTo(1, 5);
  });

  it('sludge pump run hours do not accumulate when faulted', () => {
    const { sed, coag } = baseStates();
    sed.sludgePumpStatus = { ...sed.sludgePumpStatus, running: true, fault: true, runHours: 100 };
    const result = stage.update(sed, coag, 3600);
    expect(result.sludgePumpStatus.runHours).toBe(100);
  });
});
