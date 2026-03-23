import { describe, it, expect, beforeEach } from 'vitest';
import { PrimaryClarifierStage } from '../../../../../client/src/simulation/ww/stages/PrimaryClarifierStage';
import { createInitialWWState } from '../../../../../client/src/simulation/ww/WWProcessState';
import type { HeadworksState, PrimaryClarifierState } from '../../../../../client/src/simulation/ww/WWProcessState';

function baseState() {
  const state = createInitialWWState();
  return { primary: state.primary, headworks: state.headworks };
}

function runTicks(
  stage: PrimaryClarifierStage,
  primary: PrimaryClarifierState,
  headworks: HeadworksState,
  ticks: number,
  dt = 0.5,
): PrimaryClarifierState {
  let s = primary;
  for (let i = 0; i < ticks; i++) s = stage.update(s, headworks, dt);
  return s;
}

describe('PrimaryClarifierStage', () => {
  let stage: PrimaryClarifierStage;

  beforeEach(() => {
    stage = new PrimaryClarifierStage();
  });

  // ── BOD / TSS removal ─────────────────────────────────────────────────────

  it('BOD effluent is lower than influent BOD (removal occurs)', () => {
    const { primary, headworks } = baseState();
    headworks.influentBOD = 220;
    const result = runTicks(stage, primary, headworks, 2000);
    expect(result.primaryEffluentBOD).toBeLessThan(220);
  });

  it('TSS effluent is lower than influent TSS', () => {
    const { primary, headworks } = baseState();
    headworks.influentTSS = 250;
    const result = runTicks(stage, primary, headworks, 2000);
    expect(result.primaryEffluentTSS).toBeLessThan(250);
  });

  it('TSS removal fraction is higher than BOD removal fraction', () => {
    const { primary, headworks } = baseState();
    headworks.influentBOD = 200;
    headworks.influentTSS = 200; // same influent to compare removal
    const p = { ...primary, primaryEffluentBOD: 200, primaryEffluentTSS: 200, sludgeBlanketLevel: 0.5 };
    const result = runTicks(stage, p, headworks, 3000);
    // TSS removal should be higher (base 55% vs 30%)
    const bodRemoved = 200 - result.primaryEffluentBOD;
    const tssRemoved = 200 - result.primaryEffluentTSS;
    expect(tssRemoved).toBeGreaterThan(bodRemoved);
  });

  it('high sludge blanket degrades removal efficiency (higher effluent concentrations)', () => {
    const { headworks } = baseState();
    headworks.influentBOD = 220;
    headworks.influentTSS = 250;

    // Low sludge blanket
    const lowSludge = { ...baseState().primary, sludgeBlanketLevel: 0.5 };
    const lowResult = runTicks(new PrimaryClarifierStage(), lowSludge, headworks, 3000);

    // High sludge blanket
    const highSludge = { ...baseState().primary, sludgeBlanketLevel: 7.0 };
    const highResult = runTicks(new PrimaryClarifierStage(), highSludge, headworks, 3000);

    // Higher sludge blanket should produce higher (worse) effluent BOD
    expect(highResult.primaryEffluentBOD).toBeGreaterThan(lowResult.primaryEffluentBOD);
    expect(highResult.primaryEffluentTSS).toBeGreaterThan(lowResult.primaryEffluentTSS);
  });

  // ── Sludge blanket dynamics ───────────────────────────────────────────────

  it('sludge blanket increases when pump is off', () => {
    const { primary, headworks } = baseState();
    primary.sludgeBlanketLevel = 2.0;
    primary.primarySludgePump = { ...primary.primarySludgePump, running: false };
    const result = runTicks(stage, primary, headworks, 200);
    expect(result.sludgeBlanketLevel).toBeGreaterThan(2.0);
  });

  it('sludge blanket decreases when pump is running', () => {
    const { primary, headworks } = baseState();
    primary.sludgeBlanketLevel = 4.0;
    primary.primarySludgePump = { ...primary.primarySludgePump, running: true, fault: false, speed: 100 };
    const result = runTicks(stage, primary, headworks, 200);
    // Pump removal rate (0.0004 * 100/100) > accumulation rate (0.00007) → net decrease
    expect(result.sludgeBlanketLevel).toBeLessThan(4.0);
  });

  it('sludge blanket clamps at MAX_SLUDGE_BLANKET (8.0)', () => {
    const { primary, headworks } = baseState();
    primary.sludgeBlanketLevel = 7.95;
    primary.primarySludgePump = { ...primary.primarySludgePump, running: false };
    const result = runTicks(stage, primary, headworks, 2000);
    expect(result.sludgeBlanketLevel).toBe(8.0);
  });

  it('sludge blanket clamps at 0', () => {
    const { primary, headworks } = baseState();
    primary.sludgeBlanketLevel = 0.01;
    primary.primarySludgePump = { ...primary.primarySludgePump, running: true, fault: false, speed: 100 };
    const result = runTicks(stage, primary, headworks, 2000);
    expect(result.sludgeBlanketLevel).toBe(0);
  });

  // ── Run hours ─────────────────────────────────────────────────────────────

  it('run hours accumulate for sludge pump when running', () => {
    const { primary, headworks } = baseState();
    primary.primarySludgePump = { ...primary.primarySludgePump, running: true, fault: false, runHours: 0 };
    const result = stage.update(primary, headworks, 3600);
    expect(result.primarySludgePump.runHours).toBeCloseTo(1, 5);
  });

  it('run hours do not accumulate for faulted sludge pump', () => {
    const { primary, headworks } = baseState();
    primary.primarySludgePump = { ...primary.primarySludgePump, running: true, fault: true, runHours: 10 };
    const result = stage.update(primary, headworks, 3600);
    expect(result.primarySludgePump.runHours).toBe(10);
  });

  it('scraper run hours accumulate when running', () => {
    const { primary, headworks } = baseState();
    primary.scraperStatus = { ...primary.scraperStatus, running: true, fault: false, runHours: 0 };
    const result = stage.update(primary, headworks, 3600);
    expect(result.scraperStatus.runHours).toBeCloseTo(1, 5);
  });

  // ── SOR calculation ───────────────────────────────────────────────────────

  it('SOR calculated correctly from flow', () => {
    const { primary, headworks } = baseState();
    headworks.influentFlow = 8.0; // 8 MGD
    const result = stage.update(primary, headworks, 0.5);
    // SOR = 8,000,000 / 7854 ≈ 1018.6 gpd/ft2
    expect(result.surfaceOverflowRate).toBeCloseTo(8_000_000 / 7854, 0);
  });

  it('SOR is 0 when flow is 0', () => {
    const { primary, headworks } = baseState();
    headworks.influentFlow = 0;
    const result = stage.update(primary, headworks, 0.5);
    expect(result.surfaceOverflowRate).toBe(0);
  });

  // ── Sludge wasting rate ───────────────────────────────────────────────────

  it('sludge wasting rate ramps toward setpoint when pump running', () => {
    const { primary, headworks } = baseState();
    primary.sludgeWastingRate = 10;
    primary.sludgeWastingSetpoint = 80;
    primary.primarySludgePump = { ...primary.primarySludgePump, running: true, fault: false };
    const result = runTicks(stage, primary, headworks, 200);
    expect(result.sludgeWastingRate).toBeGreaterThan(10);
    expect(result.sludgeWastingRate).toBeLessThanOrEqual(80);
  });

  it('sludge wasting rate decays when pump is off', () => {
    const { primary, headworks } = baseState();
    primary.sludgeWastingRate = 50;
    primary.sludgeWastingSetpoint = 50;
    primary.primarySludgePump = { ...primary.primarySludgePump, running: false };
    const result = runTicks(stage, primary, headworks, 200);
    expect(result.sludgeWastingRate).toBeLessThan(50);
  });
});
