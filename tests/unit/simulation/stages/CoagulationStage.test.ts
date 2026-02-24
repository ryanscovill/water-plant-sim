import { describe, it, expect, beforeEach } from 'vitest';
import { CoagulationStage } from '../../../../client/src/simulation/stages/CoagulationStage';
import { createInitialState } from '../../../../client/src/simulation/ProcessState';
import type { CoagulationState, IntakeState } from '../../../../client/src/simulation/ProcessState';

function baseStates(): { coag: CoagulationState; intake: IntakeState } {
  const s = createInitialState();
  return { coag: s.coagulation, intake: s.intake };
}

function runTicks(
  stage: CoagulationStage,
  coag: CoagulationState,
  intake: IntakeState,
  ticks: number,
  dt = 0.5,
): CoagulationState {
  let c = coag;
  for (let i = 0; i < ticks; i++) c = stage.update(c, intake, dt);
  return c;
}

describe('CoagulationStage', () => {
  let stage: CoagulationStage;

  beforeEach(() => {
    stage = new CoagulationStage();
  });

  // ── Alum dose rate ────────────────────────────────────────────────────────

  it('alumDoseRate ramps toward setpoint when pump is running', () => {
    const { coag, intake } = baseStates();
    coag.alumDoseRate = 0;
    coag.alumDoseSetpoint = 18;
    coag.alumPumpStatus = { ...coag.alumPumpStatus, running: true, fault: false };
    const result = stage.update(coag, intake, 0.5);
    expect(result.alumDoseRate).toBeGreaterThan(0);
    expect(result.alumDoseRate).toBeLessThan(18);
  });

  it('alumDoseRate converges to setpoint after sufficient ticks', () => {
    const { coag, intake } = baseStates();
    coag.alumDoseRate = 0;
    coag.alumDoseSetpoint = 30;
    coag.alumPumpStatus = { ...coag.alumPumpStatus, running: true, fault: false };
    const result = runTicks(stage, coag, intake, 500);
    expect(result.alumDoseRate).toBeCloseTo(30, 0);
  });

  it('alumDoseRate decays when pump is off', () => {
    const { coag, intake } = baseStates();
    coag.alumDoseRate = 18;
    coag.alumPumpStatus = { ...coag.alumPumpStatus, running: false };
    const result = stage.update(coag, intake, 0.5);
    expect(result.alumDoseRate).toBeLessThan(18);
  });

  it('alumDoseRate decays to zero when pump is faulted', () => {
    const { coag, intake } = baseStates();
    coag.alumDoseRate = 18;
    coag.alumPumpStatus = { ...coag.alumPumpStatus, running: true, fault: true };
    const result = runTicks(stage, coag, intake, 500);
    expect(result.alumDoseRate).toBeCloseTo(0, 1);
  });

  // ── pH adjust dose rate ───────────────────────────────────────────────────

  it('pHAdjustDoseRate ramps toward setpoint when pump is running', () => {
    const { coag, intake } = baseStates();
    coag.pHAdjustDoseRate = 0;
    coag.pHAdjustDoseSetpoint = 5;
    coag.pHAdjustPumpStatus = { ...coag.pHAdjustPumpStatus, running: true, fault: false };
    const result = stage.update(coag, intake, 0.5);
    expect(result.pHAdjustDoseRate).toBeGreaterThan(0);
    expect(result.pHAdjustDoseRate).toBeLessThan(5);
  });

  it('pHAdjustDoseRate decays more slowly than alumDoseRate when both pumps are off', () => {
    // pH adjust decay τ=10s vs alum decay τ=5s — caustic line retains dose longer
    const { coag, intake } = baseStates();
    const startDose = 10;
    coag.alumDoseRate = startDose;
    coag.pHAdjustDoseRate = startDose;
    coag.alumPumpStatus = { ...coag.alumPumpStatus, running: false };
    coag.pHAdjustPumpStatus = { ...coag.pHAdjustPumpStatus, running: false };
    const result = runTicks(stage, coag, intake, 40, 0.5); // 20 simulated seconds
    expect(result.pHAdjustDoseRate).toBeGreaterThan(result.alumDoseRate);
  });

  // ── Temperature factor → coagulation effectiveness ───────────────────────

  it('cold water (2°C) reduces coagulation effectiveness vs normal (16°C)', () => {
    const { coag, intake } = baseStates();
    coag.alumDoseRate = 18;
    coag.alumDoseSetpoint = 18;
    coag.alumPumpStatus = { ...coag.alumPumpStatus, running: true };
    // rawTurbidity=100 → base ratio = 18/(100×0.12) = 1.5; × 0.35 (cold) < 1, × 0.79 (warm) = 1.18 → clamped 1.0
    // So cold gives effectiveness=0.525, warm gives 1.0 — clear difference
    const coldIntake = { ...intake, rawTurbidity: 100, sourceTurbidityBase: 100, sourceTemperature: 2 };
    const warmIntake = { ...intake, rawTurbidity: 100, sourceTurbidityBase: 100, sourceTemperature: 16 };

    const coldResult = runTicks(new CoagulationStage(), { ...coag }, coldIntake, 500);
    const warmResult = runTicks(new CoagulationStage(), { ...coag }, warmIntake, 500);

    // Cold water → worse coagulation → higher flocBasinTurbidity
    expect(coldResult.flocBasinTurbidity).toBeGreaterThan(warmResult.flocBasinTurbidity);
  });

  it('temperature below 1°C clamps tempFactor to minimum (0.35)', () => {
    // At 1°C: (1-1)/19 = 0 → clamped to 0.35
    // At 20°C: (20-1)/19 = 1.0
    // Verify: running at 1°C gives same result as 0°C (both floored at 0.35)
    const { coag, intake } = baseStates();
    coag.alumDoseRate = 5;
    coag.alumPumpStatus = { ...coag.alumPumpStatus, running: true };

    const at1C = runTicks(new CoagulationStage(), { ...coag }, { ...intake, sourceTemperature: 1 }, 500);
    const at0C = runTicks(new CoagulationStage(), { ...coag }, { ...intake, sourceTemperature: 0 }, 500);

    expect(at1C.flocBasinTurbidity).toBeCloseTo(at0C.flocBasinTurbidity, 1);
  });

  it('temperature at 20°C gives better coagulation than at 10°C', () => {
    const { coag, intake } = baseStates();
    coag.alumDoseRate = 18;
    coag.alumPumpStatus = { ...coag.alumPumpStatus, running: true };
    // Need rawTurbidity high enough that effectiveness is not clamped at 1.0 for both temps
    // At turb=100: ratio=1.5; ×0.474 (10°C)=0.71 < 1; ×1.0 (20°C)=1.5→clamped. Clear difference.
    const highTurbIntake = { ...intake, rawTurbidity: 100, sourceTurbidityBase: 100 };

    const warm = runTicks(new CoagulationStage(), { ...coag }, { ...highTurbIntake, sourceTemperature: 20 }, 500);
    const cool = runTicks(new CoagulationStage(), { ...coag }, { ...highTurbIntake, sourceTemperature: 10 }, 500);

    expect(warm.flocBasinTurbidity).toBeLessThan(cool.flocBasinTurbidity);
  });

  // ── Alum dose → floc turbidity ────────────────────────────────────────────

  it('higher alum dose yields lower flocBasinTurbidity at the same raw turbidity', () => {
    const { intake } = baseStates();
    // Use rawTurbidity=100: at dose=5 → ratio=0.42→effectiveness=0.33; at dose=40 → ratio=3.3→clamped 1.0
    const highTurbIntake = { ...intake, rawTurbidity: 100, sourceTurbidityBase: 100 };
    const lowDoseCoag = { ...createInitialState().coagulation, alumDoseRate: 5, alumDoseSetpoint: 5 };
    const highDoseCoag = { ...createInitialState().coagulation, alumDoseRate: 40, alumDoseSetpoint: 40 };

    const lowResult = runTicks(new CoagulationStage(), lowDoseCoag, highTurbIntake, 500);
    const highResult = runTicks(new CoagulationStage(), highDoseCoag, highTurbIntake, 500);

    expect(highResult.flocBasinTurbidity).toBeLessThan(lowResult.flocBasinTurbidity);
  });

  it('higher raw turbidity leads to higher flocBasinTurbidity at the same alum dose', () => {
    const { coag } = baseStates();
    const lowTurbIntake = { ...createInitialState().intake, rawTurbidity: 10, sourceTurbidityBase: 10 };
    const highTurbIntake = { ...createInitialState().intake, rawTurbidity: 80, sourceTurbidityBase: 80 };

    const lowResult = runTicks(new CoagulationStage(), { ...coag }, lowTurbIntake, 500);
    const highResult = runTicks(new CoagulationStage(), { ...coag }, highTurbIntake, 500);

    expect(highResult.flocBasinTurbidity).toBeGreaterThan(lowResult.flocBasinTurbidity);
  });

  it('alum pump off → dose decays → flocBasinTurbidity rises over time', () => {
    const { coag, intake } = baseStates();
    coag.alumPumpStatus = { ...coag.alumPumpStatus, running: false };
    coag.alumDoseRate = 18;
    const initial = coag.flocBasinTurbidity;
    const result = runTicks(stage, coag, intake, 500);
    expect(result.flocBasinTurbidity).toBeGreaterThan(initial);
  });

  // ── Mixing energy ─────────────────────────────────────────────────────────

  it('both mixers off → higher flocBasinTurbidity than both running', () => {
    const { coag, intake } = baseStates();
    const mixersOn = { ...coag, rapidMixerStatus: { ...coag.rapidMixerStatus, running: true }, slowMixerStatus: { ...coag.slowMixerStatus, running: true } };
    const mixersOff = { ...coag, rapidMixerStatus: { ...coag.rapidMixerStatus, running: false }, slowMixerStatus: { ...coag.slowMixerStatus, running: false } };

    const onResult = runTicks(new CoagulationStage(), mixersOn, intake, 500);
    const offResult = runTicks(new CoagulationStage(), mixersOff, intake, 500);

    expect(offResult.flocBasinTurbidity).toBeGreaterThan(onResult.flocBasinTurbidity);
  });

  it('rapid mixer only off is worse than both mixers running', () => {
    const { coag, intake } = baseStates();
    const bothOn = { ...coag, rapidMixerStatus: { ...coag.rapidMixerStatus, running: true }, slowMixerStatus: { ...coag.slowMixerStatus, running: true } };
    const rapidOff = { ...coag, rapidMixerStatus: { ...coag.rapidMixerStatus, running: false }, slowMixerStatus: { ...coag.slowMixerStatus, running: true } };

    const onResult = runTicks(new CoagulationStage(), bothOn, intake, 500);
    const offResult = runTicks(new CoagulationStage(), rapidOff, intake, 500);

    expect(offResult.flocBasinTurbidity).toBeGreaterThan(onResult.flocBasinTurbidity);
  });

  // ── Mixer speeds ──────────────────────────────────────────────────────────

  it('rapid mixer speed converges to 120 RPM when running', () => {
    const { coag, intake } = baseStates();
    coag.rapidMixerSpeed = 0;
    coag.rapidMixerStatus = { ...coag.rapidMixerStatus, running: true };
    const result = runTicks(stage, coag, intake, 500);
    expect(result.rapidMixerSpeed).toBeCloseTo(120, 0);
  });

  it('slow mixer speed converges to 45 RPM when running', () => {
    const { coag, intake } = baseStates();
    coag.slowMixerSpeed = 0;
    coag.slowMixerStatus = { ...coag.slowMixerStatus, running: true };
    const result = runTicks(stage, coag, intake, 500);
    expect(result.slowMixerSpeed).toBeCloseTo(45, 0);
  });

  it('rapid mixer speed decays when turned off', () => {
    const { coag, intake } = baseStates();
    coag.rapidMixerSpeed = 120;
    coag.rapidMixerStatus = { ...coag.rapidMixerStatus, running: false };
    const result = stage.update(coag, intake, 0.5);
    expect(result.rapidMixerSpeed).toBeLessThan(120);
  });

  it('slow mixer speed decays when turned off', () => {
    const { coag, intake } = baseStates();
    coag.slowMixerSpeed = 45;
    coag.slowMixerStatus = { ...coag.slowMixerStatus, running: false };
    const result = stage.update(coag, intake, 0.5);
    expect(result.slowMixerSpeed).toBeLessThan(45);
  });

  // ── Run hours ─────────────────────────────────────────────────────────────

  it('alum pump run hours accumulate when running and not faulted', () => {
    const { coag, intake } = baseStates();
    coag.alumPumpStatus = { ...coag.alumPumpStatus, running: true, fault: false, runHours: 0 };
    const result = stage.update(coag, intake, 3600);
    expect(result.alumPumpStatus.runHours).toBeCloseTo(1, 5);
  });

  it('pH adjust pump run hours accumulate when running and not faulted', () => {
    const { coag, intake } = baseStates();
    coag.pHAdjustPumpStatus = { ...coag.pHAdjustPumpStatus, running: true, fault: false, runHours: 0 };
    const result = stage.update(coag, intake, 3600);
    expect(result.pHAdjustPumpStatus.runHours).toBeCloseTo(1, 5);
  });

  it('rapid mixer run hours accumulate when running and not faulted', () => {
    const { coag, intake } = baseStates();
    coag.rapidMixerStatus = { ...coag.rapidMixerStatus, running: true, fault: false, runHours: 0 };
    const result = stage.update(coag, intake, 3600);
    expect(result.rapidMixerStatus.runHours).toBeCloseTo(1, 5);
  });

  it('run hours do not accumulate when equipment is faulted', () => {
    const { coag, intake } = baseStates();
    coag.alumPumpStatus = { ...coag.alumPumpStatus, running: true, fault: true, runHours: 50 };
    const result = stage.update(coag, intake, 3600);
    expect(result.alumPumpStatus.runHours).toBe(50);
  });
});
