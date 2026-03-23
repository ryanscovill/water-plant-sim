import { describe, it, expect, beforeEach } from 'vitest';
import { WWDisinfectionStage } from '../../../../../client/src/simulation/ww/stages/WWDisinfectionStage';
import { createInitialWWState } from '../../../../../client/src/simulation/ww/WWProcessState';
import type {
  WWDisinfectionState,
  SecondaryClarifierState,
  AerationState,
  HeadworksState,
} from '../../../../../client/src/simulation/ww/WWProcessState';

function baseState() {
  const state = createInitialWWState();
  return {
    disinfection: state.wwDisinfection,
    secondary: state.secondary,
    aeration: state.aeration,
    headworks: state.headworks,
  };
}

function runTicks(
  stage: WWDisinfectionStage,
  disinfection: WWDisinfectionState,
  secondary: SecondaryClarifierState,
  aeration: AerationState,
  headworks: HeadworksState,
  ticks: number,
  dt = 0.5,
): WWDisinfectionState {
  let s = disinfection;
  for (let i = 0; i < ticks; i++)
    s = stage.update(s, secondary, aeration, headworks, dt);
  return s;
}

describe('WWDisinfectionStage', () => {
  let stage: WWDisinfectionStage;

  beforeEach(() => {
    stage = new WWDisinfectionStage();
  });

  // ── Chlorine residual ─────────────────────────────────────────────────────

  it('chlorine residual increases when chlorine pump is running', () => {
    const { disinfection, secondary, aeration, headworks } = baseState();
    disinfection.chlorineResidual = 0;
    disinfection.chlorineDoseRate = 0;
    disinfection.chlorineDoseSetpoint = 5.0;
    disinfection.chlorinePump = {
      ...disinfection.chlorinePump,
      running: true,
      fault: false,
    };
    const result = runTicks(
      stage,
      disinfection,
      secondary,
      aeration,
      headworks,
      2000,
    );
    expect(result.chlorineResidual).toBeGreaterThan(0);
  });

  it('chlorine residual decreases toward 0 when pump is off', () => {
    const { disinfection, secondary, aeration, headworks } = baseState();
    disinfection.chlorineResidual = 2.0;
    disinfection.chlorineDoseRate = 5.0;
    disinfection.chlorinePump = {
      ...disinfection.chlorinePump,
      running: false,
    };
    const result = runTicks(
      stage,
      disinfection,
      secondary,
      aeration,
      headworks,
      2000,
    );
    expect(result.chlorineResidual).toBeLessThan(2.0);
    expect(result.chlorineResidual).toBeCloseTo(0, 0);
  });

  it('higher BOD/TSS/NH3 creates more chlorine demand (lower residual)', () => {
    const { disinfection, aeration, headworks } = baseState();

    // Low demand scenario
    const lowSecondary: SecondaryClarifierState = {
      ...createInitialWWState().secondary,
      effluentBOD: 5,
      effluentTSS: 5,
    };
    const lowAeration = { ...aeration, aerationBasinNH3: 1.0 };
    const lowDis = {
      ...disinfection,
      chlorineDoseRate: 5.0,
      chlorineDoseSetpoint: 5.0,
      chlorineResidual: 0,
      chlorinePump: { ...disinfection.chlorinePump, running: true, fault: false },
    };
    const lowResult = runTicks(
      new WWDisinfectionStage(),
      lowDis,
      lowSecondary,
      lowAeration,
      headworks,
      2000,
    );

    // High demand scenario
    const highSecondary: SecondaryClarifierState = {
      ...createInitialWWState().secondary,
      effluentBOD: 30,
      effluentTSS: 30,
    };
    const highAeration = { ...aeration, aerationBasinNH3: 10.0 };
    const highDis = {
      ...disinfection,
      chlorineDoseRate: 5.0,
      chlorineDoseSetpoint: 5.0,
      chlorineResidual: 0,
      chlorinePump: { ...disinfection.chlorinePump, running: true, fault: false },
    };
    const highResult = runTicks(
      new WWDisinfectionStage(),
      highDis,
      highSecondary,
      highAeration,
      headworks,
      2000,
    );

    expect(highResult.chlorineResidual).toBeLessThan(lowResult.chlorineResidual);
  });

  // ── Dechlorination / TRC ──────────────────────────────────────────────────

  it('TRC is low when dechlorination pump is running adequately', () => {
    const { disinfection, secondary, aeration, headworks } = baseState();
    disinfection.chlorineDoseRate = 5.0;
    disinfection.chlorineDoseSetpoint = 5.0;
    disinfection.chlorineResidual = 2.0;
    disinfection.chlorinePump = {
      ...disinfection.chlorinePump,
      running: true,
      fault: false,
    };
    disinfection.dechlorinationDoseRate = 3.0;
    disinfection.dechlorinationSetpoint = 3.0;
    disinfection.dechlorinationPump = {
      ...disinfection.dechlorinationPump,
      running: true,
      fault: false,
    };
    const result = runTicks(
      stage,
      disinfection,
      secondary,
      aeration,
      headworks,
      2000,
    );
    // TRC = max(0, residual - dechlorDose * 0.9) should be low
    expect(result.totalResidualChlorine).toBeLessThan(1.0);
  });

  it('TRC equals chlorine residual when dechlorination pump is off', () => {
    const { disinfection, secondary, aeration, headworks } = baseState();
    disinfection.chlorineDoseRate = 5.0;
    disinfection.chlorineDoseSetpoint = 5.0;
    disinfection.chlorineResidual = 2.0;
    disinfection.chlorinePump = {
      ...disinfection.chlorinePump,
      running: true,
      fault: false,
    };
    disinfection.dechlorinationDoseRate = 0;
    disinfection.dechlorinationSetpoint = 0;
    disinfection.dechlorinationPump = {
      ...disinfection.dechlorinationPump,
      running: false,
    };
    const result = runTicks(
      stage,
      disinfection,
      secondary,
      aeration,
      headworks,
      2000,
    );
    // With no dechlorination, TRC should approach chlorine residual
    expect(result.totalResidualChlorine).toBeCloseTo(
      result.chlorineResidual,
      0,
    );
  });

  // ── Contact time ──────────────────────────────────────────────────────────

  it('contact time calculated correctly from flow and volume', () => {
    const { disinfection, secondary, aeration, headworks } = baseState();
    headworks.influentFlow = 8.0; // MGD
    const result = stage.update(disinfection, secondary, aeration, headworks, 0.5);
    // CT = CONTACT_VOLUME_GAL * 1440 / (influentFlow * 1_000_000)
    //    = 500_000 * 1440 / (8 * 1_000_000) = 720_000_000 / 8_000_000 = 90 min
    expect(result.chlorineContactTime).toBeCloseTo(90, 0);
  });

  // ── Effluent pass-through ─────────────────────────────────────────────────

  it('effluent BOD/TSS/NH3 pass through from upstream', () => {
    const { disinfection, secondary, aeration, headworks } = baseState();
    secondary.effluentBOD = 15;
    secondary.effluentTSS = 18;
    aeration.aerationBasinNH3 = 3.5;
    headworks.influentFlow = 8.0;
    const result = stage.update(disinfection, secondary, aeration, headworks, 0.5);
    expect(result.effluentBOD).toBe(15);
    expect(result.effluentTSS).toBe(18);
    expect(result.effluentNH3).toBe(3.5);
    expect(result.effluentFlow).toBe(8.0);
  });

  // ── pH ────────────────────────────────────────────────────────────────────

  it('effluent pH decreases with higher chlorine dose', () => {
    const { disinfection, secondary, aeration, headworks } = baseState();

    // Low chlorine dose
    const lowDis = {
      ...disinfection,
      chlorineDoseRate: 1.0,
      chlorineDoseSetpoint: 1.0,
      chlorinePump: { ...disinfection.chlorinePump, running: true, fault: false },
      effluentPH: 7.1, // start at same baseline
    };
    const lowResult = runTicks(
      new WWDisinfectionStage(),
      lowDis,
      secondary,
      aeration,
      headworks,
      2000,
    );

    // High chlorine dose
    const highDis = {
      ...disinfection,
      chlorineDoseRate: 10.0,
      chlorineDoseSetpoint: 10.0,
      chlorinePump: { ...disinfection.chlorinePump, running: true, fault: false },
      effluentPH: 7.1, // start at same baseline
    };
    const highResult = runTicks(
      new WWDisinfectionStage(),
      highDis,
      secondary,
      aeration,
      headworks,
      2000,
    );

    expect(highResult.effluentPH).toBeLessThan(lowResult.effluentPH);
  });

  // ── Run hours ─────────────────────────────────────────────────────────────

  it('run hours accumulate for chlorine pump', () => {
    const { disinfection, secondary, aeration, headworks } = baseState();
    disinfection.chlorinePump = {
      ...disinfection.chlorinePump,
      running: true,
      fault: false,
      runHours: 0,
    };
    const result = stage.update(disinfection, secondary, aeration, headworks, 3600);
    expect(result.chlorinePump.runHours).toBeCloseTo(1, 5);
  });
});
