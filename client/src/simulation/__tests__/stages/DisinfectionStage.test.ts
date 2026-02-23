import { describe, it, expect, beforeEach } from 'vitest';
import { DisinfectionStage } from '../../stages/DisinfectionStage';
import { createInitialState } from '../../ProcessState';
import type { DisinfectionState, SedimentationState, CoagulationState } from '../../ProcessState';

function baseStates(): { dis: DisinfectionState; sed: SedimentationState; coag: CoagulationState } {
  const state = createInitialState();
  return {
    dis: state.disinfection,
    sed: state.sedimentation,
    coag: state.coagulation,
  };
}

function runTicks(
  stage: DisinfectionStage,
  dis: DisinfectionState,
  sed: SedimentationState,
  ticks: number,
  dt = 0.5,
  coag?: CoagulationState,
): DisinfectionState {
  let s = dis;
  for (let i = 0; i < ticks; i++) s = stage.update(s, sed, dt, coag);
  return s;
}

describe('DisinfectionStage', () => {
  let stage: DisinfectionStage;

  beforeEach(() => {
    stage = new DisinfectionStage();
  });

  it('chlorine dose ramps toward setpoint when pump is running', () => {
    const { dis, sed, coag } = baseStates();
    dis.chlorineDoseRate = 0;
    dis.chlorineDoseSetpoint = 2.5;
    dis.chlorinePumpStatus = { ...dis.chlorinePumpStatus, running: true, fault: false };
    const result = stage.update(dis, sed, 0.5, coag);
    expect(result.chlorineDoseRate).toBeGreaterThan(0);
    expect(result.chlorineDoseRate).toBeLessThan(2.5);
  });

  it('chlorine dose decays when pump is off', () => {
    const { dis, sed, coag } = baseStates();
    dis.chlorineDoseRate = 2.5;
    dis.chlorinePumpStatus = { ...dis.chlorinePumpStatus, running: false };
    const result = stage.update(dis, sed, 0.5, coag);
    expect(result.chlorineDoseRate).toBeLessThan(2.5);
  });

  it('plant Cl₂ stays below 4.0 mg/L under normal setpoints after many ticks', () => {
    const { dis, sed, coag } = baseStates();
    const result = runTicks(stage, dis, sed, 500, 0.5, coag);
    expect(result.chlorineResidualPlant).toBeLessThan(4.0);
  });

  it('clean filter effluent yields higher plant Cl₂ than dirty effluent', () => {
    const { dis, sed, coag } = baseStates();

    const cleanSed = { ...sed, filterEffluentTurbidity: 0.05 };
    const dirtySed = { ...sed, filterEffluentTurbidity: 2.0 };

    const cleanResult = runTicks(new DisinfectionStage(), { ...dis }, cleanSed, 300, 0.5, coag);
    const dirtyResult = runTicks(new DisinfectionStage(), { ...dis }, dirtySed, 300, 0.5, coag);

    expect(cleanResult.chlorineResidualPlant).toBeGreaterThan(dirtyResult.chlorineResidualPlant);
  });

  it('pH converges to 7.4 with default 2.0 mg/L coag pHAdjustDoseRate', () => {
    const { dis, sed, coag } = baseStates();
    // PH_BASE (7.0) + 2.0 * PH_ADJUST_FACTOR (0.2) = 7.4
    const result = runTicks(stage, dis, sed, 500, 0.5, coag);
    expect(result.finishedWaterPH).toBeCloseTo(7.4, 1);
  });

  it('pH stays within 6.5–8.5 under normal conditions', () => {
    const { dis, sed, coag } = baseStates();
    const result = runTicks(stage, dis, sed, 500, 0.5, coag);
    expect(result.finishedWaterPH).toBeGreaterThanOrEqual(6.5);
    expect(result.finishedWaterPH).toBeLessThanOrEqual(8.5);
  });

  it('fluoride residual converges toward dose × 0.9 efficiency', () => {
    const { dis, sed, coag } = baseStates();
    dis.fluorideDoseSetpoint = 0.8;
    dis.fluoridePumpStatus = { ...dis.fluoridePumpStatus, running: true };
    const result = runTicks(stage, dis, sed, 500, 0.5, coag);
    // fluorideDoseRate → 0.8, fluorideResidual → 0.8 * 0.9 = 0.72
    expect(result.fluorideResidual).toBeCloseTo(0.72, 1);
  });

  it('clearwell level rises when not backwashing', () => {
    const { dis, sed, coag } = baseStates();
    dis.clearwellLevel = 10;
    const normalSed = { ...sed, backwashInProgress: false };
    const result = stage.update(dis, normalSed, 0.5, coag);
    // inflow 0.02 > outflow 0.015 → net +0.0025 per tick
    expect(result.clearwellLevel).toBeGreaterThan(10);
  });

  it('clearwell level drains during backwash', () => {
    const { dis, sed, coag } = baseStates();
    dis.clearwellLevel = 10;
    const bwSed = { ...sed, backwashInProgress: true };
    const result = stage.update(dis, bwSed, 0.5, coag);
    // inflow 0 < outflow 0.015 → net -0.0075 per tick
    expect(result.clearwellLevel).toBeLessThan(10);
  });

  it('clearwell level clamps at 0 during extended backwash with empty well', () => {
    const { dis, sed, coag } = baseStates();
    dis.clearwellLevel = 0;
    const bwSed = { ...sed, backwashInProgress: true };
    const result = runTicks(stage, dis, bwSed, 100, 0.5, coag);
    expect(result.clearwellLevel).toBe(0);
  });

  it('chlorine pump run hours accumulate when running', () => {
    const { dis, sed, coag } = baseStates();
    dis.chlorinePumpStatus = { ...dis.chlorinePumpStatus, running: true, fault: false, runHours: 0 };
    const result = stage.update(dis, sed, 3600, coag); // 1 simulated hour
    expect(result.chlorinePumpStatus.runHours).toBeCloseTo(1, 5);
  });
});
