import { describe, it, expect, beforeEach } from 'vitest';
import { SecondaryClarifierStage } from '../../../../../client/src/simulation/ww/stages/SecondaryClarifierStage';
import { createInitialWWState } from '../../../../../client/src/simulation/ww/WWProcessState';
import type {
  SecondaryClarifierState,
  AerationState,
  HeadworksState,
} from '../../../../../client/src/simulation/ww/WWProcessState';

function baseState() {
  const state = createInitialWWState();
  return {
    secondary: state.secondary,
    aeration: state.aeration,
    headworks: state.headworks,
  };
}

function runTicks(
  stage: SecondaryClarifierStage,
  secondary: SecondaryClarifierState,
  aeration: AerationState,
  headworks: HeadworksState,
  ticks: number,
  dt = 0.5,
): SecondaryClarifierState {
  let s = secondary;
  for (let i = 0; i < ticks; i++) s = stage.update(s, aeration, headworks, dt);
  return s;
}

describe('SecondaryClarifierStage', () => {
  let stage: SecondaryClarifierStage;

  beforeEach(() => {
    stage = new SecondaryClarifierStage();
  });

  // ── Effluent TSS ──────────────────────────────────────────────────────────

  it('effluent TSS is much lower than MLSS (settling works)', () => {
    const { secondary, aeration, headworks } = baseState();
    aeration.mlss = 3000;
    aeration.svi = 120; // normal SVI
    const result = runTicks(stage, secondary, aeration, headworks, 2000);
    // With 99% settling at SVI 120, target TSS = 3000 * (1 - 0.95) = 150... but
    // settling efficiency = clamp(0.99 - (120-100)*0.002, 0.90, 0.995) = 0.95
    // So target TSS = 3000 * (1 - 0.95) = 150 → still much less than 3000
    expect(result.effluentTSS).toBeLessThan(aeration.mlss * 0.1);
    expect(result.effluentTSS).toBeGreaterThan(0);
  });

  it('high SVI (>150) increases effluent TSS (poor settling)', () => {
    const { secondary, headworks } = baseState();

    // Normal SVI
    const normalAeration = { ...createInitialWWState().aeration, svi: 100, mlss: 3000 };
    const normalResult = runTicks(
      new SecondaryClarifierStage(),
      { ...secondary },
      normalAeration,
      headworks,
      2000,
    );

    // High SVI — poor settling
    const highSviAeration = { ...createInitialWWState().aeration, svi: 180, mlss: 3000 };
    const highSviResult = runTicks(
      new SecondaryClarifierStage(),
      { ...secondary },
      highSviAeration,
      headworks,
      2000,
    );

    expect(highSviResult.effluentTSS).toBeGreaterThan(normalResult.effluentTSS);
  });

  it('low SVI (<100) gives very low effluent TSS', () => {
    const { secondary, headworks } = baseState();
    const aeration = { ...createInitialWWState().aeration, svi: 80, mlss: 3000 };
    // Settling efficiency = clamp(0.99 - (80-100)*0.002, 0.90, 0.995) = clamp(0.99 + 0.04, ...) = 0.995
    const result = runTicks(stage, secondary, aeration, headworks, 2000);
    // target TSS = 3000 * (1 - 0.995) = 15
    expect(result.effluentTSS).toBeLessThan(20);
  });

  // ── Effluent BOD ──────────────────────────────────────────────────────────

  it('effluent BOD includes soluble and particulate fractions', () => {
    const { secondary, aeration, headworks } = baseState();
    aeration.aerationBasinBOD = 8; // soluble BOD
    aeration.mlss = 3000;
    aeration.svi = 120;
    const result = runTicks(stage, secondary, aeration, headworks, 2000);
    // Effluent BOD = soluble BOD + 0.5 * effluentTSS
    // Should be > soluble BOD alone (has particulate contribution)
    // and > 0.5 * effluentTSS alone (has soluble contribution)
    expect(result.effluentBOD).toBeGreaterThan(aeration.aerationBasinBOD);
  });

  // ── Sludge blanket dynamics ───────────────────────────────────────────────

  it('sludge blanket increases when scraper is off', () => {
    const { secondary, aeration, headworks } = baseState();
    secondary.sludgeBlanketLevel = 2.0;
    secondary.scraperStatus = { ...secondary.scraperStatus, running: false };
    const result = runTicks(stage, secondary, aeration, headworks, 200);
    expect(result.sludgeBlanketLevel).toBeGreaterThan(2.0);
  });

  it('sludge blanket decreases when scraper is running', () => {
    const { secondary, aeration, headworks } = baseState();
    secondary.sludgeBlanketLevel = 4.0;
    secondary.scraperStatus = {
      ...secondary.scraperStatus,
      running: true,
      fault: false,
      speed: 100,
    };
    const result = runTicks(stage, secondary, aeration, headworks, 200);
    // Scraper removal rate (0.0002 * 100/100 = 0.0002) > accumulation rate (0.00005 * 120/100 = 0.00006)
    expect(result.sludgeBlanketLevel).toBeLessThan(4.0);
  });

  it('sludge blanket clamps at 8.0', () => {
    const { secondary, aeration, headworks } = baseState();
    secondary.sludgeBlanketLevel = 7.95;
    secondary.scraperStatus = { ...secondary.scraperStatus, running: false };
    const result = runTicks(stage, secondary, aeration, headworks, 5000);
    expect(result.sludgeBlanketLevel).toBe(8.0);
  });

  // ── SOR ───────────────────────────────────────────────────────────────────

  it('SOR updates correctly', () => {
    const { secondary, aeration, headworks } = baseState();
    headworks.influentFlow = 8.0; // MGD
    const result = stage.update(secondary, aeration, headworks, 0.5);
    // SOR = 8,000,000 / 7854 ≈ 1018.6
    expect(result.surfaceOverflowRate).toBeCloseTo(8_000_000 / 7854, 0);
  });

  // ── Run hours ─────────────────────────────────────────────────────────────

  it('run hours accumulate for scraper', () => {
    const { secondary, aeration, headworks } = baseState();
    secondary.scraperStatus = {
      ...secondary.scraperStatus,
      running: true,
      fault: false,
      runHours: 0,
    };
    const result = stage.update(secondary, aeration, headworks, 3600);
    expect(result.scraperStatus.runHours).toBeCloseTo(1, 5);
  });
});
