import { describe, it, expect, beforeEach } from 'vitest';
import { DisinfectionStage } from '../../../../client/src/simulation/stages/DisinfectionStage';
import { createInitialState } from '../../../../client/src/simulation/ProcessState';
import type { DisinfectionState, SedimentationState, CoagulationState, IntakeState } from '../../../../client/src/simulation/ProcessState';

function baseStates(): { dis: DisinfectionState; sed: SedimentationState; coag: CoagulationState; intake: IntakeState } {
  const state = createInitialState();
  return {
    dis: state.disinfection,
    sed: state.sedimentation,
    coag: state.coagulation,
    intake: state.intake,
  };
}

function runTicks(
  stage: DisinfectionStage,
  dis: DisinfectionState,
  sed: SedimentationState,
  ticks: number,
  dt = 0.5,
  coag?: CoagulationState,
  intake?: IntakeState,
): DisinfectionState {
  let s = dis;
  for (let i = 0; i < ticks; i++) s = stage.update(s, sed, dt, coag, intake);
  return s;
}

describe('DisinfectionStage', () => {
  let stage: DisinfectionStage;

  beforeEach(() => {
    stage = new DisinfectionStage();
  });

  it('chlorine dose ramps toward setpoint when pump is running', () => {
    const { dis, sed, coag, intake } = baseStates();
    dis.chlorineDoseRate = 0;
    dis.chlorineDoseSetpoint = 2.5;
    dis.chlorinePumpStatus = { ...dis.chlorinePumpStatus, running: true, fault: false };
    const result = stage.update(dis, sed, 0.5, coag, intake);
    expect(result.chlorineDoseRate).toBeGreaterThan(0);
    expect(result.chlorineDoseRate).toBeLessThan(2.5);
  });

  it('chlorine dose decays when pump is off', () => {
    const { dis, sed, coag, intake } = baseStates();
    dis.chlorineDoseRate = 2.5;
    dis.chlorinePumpStatus = { ...dis.chlorinePumpStatus, running: false };
    const result = stage.update(dis, sed, 0.5, coag, intake);
    expect(result.chlorineDoseRate).toBeLessThan(2.5);
  });

  it('plant Cl₂ stays below 4.0 mg/L under normal setpoints after many ticks', () => {
    const { dis, sed, coag, intake } = baseStates();
    const result = runTicks(stage, dis, sed, 500, 0.5, coag, intake);
    expect(result.chlorineResidualPlant).toBeLessThan(4.0);
  });

  it('distribution Cl₂ residual stays below H alarm threshold (2.0 mg/L) at normal setpoints', () => {
    const { dis, sed, coag, intake } = baseStates();
    const result = runTicks(stage, dis, sed, 500, 0.5, coag, intake);
    expect(result.chlorineResidualDist).toBeLessThan(2.0);
  });

  it('clean filter effluent yields higher plant Cl₂ than dirty effluent', () => {
    const { dis, sed, coag, intake } = baseStates();

    const cleanSed = { ...sed, filterEffluentTurbidity: 0.05 };
    const dirtySed = { ...sed, filterEffluentTurbidity: 2.0 };

    const cleanResult = runTicks(new DisinfectionStage(), { ...dis }, cleanSed, 300, 0.5, coag, intake);
    const dirtyResult = runTicks(new DisinfectionStage(), { ...dis }, dirtySed, 300, 0.5, coag, intake);

    expect(cleanResult.chlorineResidualPlant).toBeGreaterThan(dirtyResult.chlorineResidualPlant);
  });

  it('pH converges to 7.4 at default operating point (sourcePH 7.2, alum 18 mg/L, caustic 2.8 mg/L)', () => {
    const { dis, sed, coag, intake } = baseStates();
    // sourcePH (7.2) − 18 × ALUM_PH_DEPRESSION (0.02) + 2.8 × PH_ADJUST_FACTOR (0.2) = 7.40
    const result = runTicks(stage, dis, sed, 500, 0.5, coag, intake);
    expect(result.finishedWaterPH).toBeCloseTo(7.4, 1);
  });

  it('higher source pH raises finished-water pH', () => {
    const { dis, sed, coag, intake } = baseStates();
    const highSourceIntake = { ...intake, sourcePH: 8.0 };
    const lowSourceIntake  = { ...intake, sourcePH: 6.8 };

    const highResult = runTicks(new DisinfectionStage(), { ...dis }, sed, 500, 0.5, coag, highSourceIntake);
    const lowResult  = runTicks(new DisinfectionStage(), { ...dis }, sed, 500, 0.5, coag, lowSourceIntake);

    expect(highResult.finishedWaterPH).toBeGreaterThan(lowResult.finishedWaterPH);
  });

  it('high alum dose depresses pH below normal', () => {
    const { dis, sed, coag, intake } = baseStates();
    const highAlumCoag = { ...coag, alumDoseRate: 50, alumDoseSetpoint: 50 };
    const normalResult   = runTicks(new DisinfectionStage(), { ...dis }, sed, 500, 0.5, coag, intake);
    const highAlumResult = runTicks(new DisinfectionStage(), { ...dis }, sed, 500, 0.5, highAlumCoag, intake);
    // 7.2 + 2.8×0.2 − 50×0.02 = 7.2 + 0.56 − 1.00 = 6.76 → below L alarm (6.8)
    expect(highAlumResult.finishedWaterPH).toBeLessThan(normalResult.finishedWaterPH);
    expect(highAlumResult.finishedWaterPH).toBeLessThan(6.8);
  });

  it('pH stays within 6.5–8.5 under normal conditions', () => {
    const { dis, sed, coag, intake } = baseStates();
    const result = runTicks(stage, dis, sed, 500, 0.5, coag, intake);
    expect(result.finishedWaterPH).toBeGreaterThanOrEqual(6.5);
    expect(result.finishedWaterPH).toBeLessThanOrEqual(8.5);
  });

  it('clearwell level rises when not backwashing at normal flow', () => {
    const { dis, sed, coag, intake } = baseStates();
    dis.clearwellLevel = 3.0;
    const normalSed = { ...sed, backwashInProgress: false };
    const result = stage.update(dis, normalSed, 0.5, coag, intake);
    expect(result.clearwellLevel).toBeGreaterThan(3.0);
  });

  it('clearwell drains when intake flow is zero', () => {
    const { dis, sed, coag, intake } = baseStates();
    dis.clearwellLevel = 3.0;
    const zeroFlowIntake = { ...intake, rawWaterFlow: 0 };
    const normalSed = { ...sed, backwashInProgress: false };
    const result = stage.update(dis, normalSed, 0.5, coag, zeroFlowIntake);
    expect(result.clearwellLevel).toBeLessThan(3.0);
  });

  it('clearwell inflow scales with flow rate', () => {
    const { dis, sed, coag, intake } = baseStates();
    dis.clearwellLevel = 3.0;
    const halfFlowIntake = { ...intake, rawWaterFlow: intake.rawWaterFlow / 2 };
    const normalSed = { ...sed, backwashInProgress: false };

    const fullResult = stage.update({ ...dis }, normalSed, 0.5, coag, intake);
    const halfResult = stage.update({ ...dis }, normalSed, 0.5, coag, halfFlowIntake);

    // Full flow rises more than half flow
    expect(fullResult.clearwellLevel - dis.clearwellLevel)
      .toBeGreaterThan(halfResult.clearwellLevel - dis.clearwellLevel);
  });

  it('clearwell level drains during backwash', () => {
    const { dis, sed, coag, intake } = baseStates();
    dis.clearwellLevel = 3.0;
    const bwSed = { ...sed, backwashInProgress: true };
    const result = stage.update(dis, bwSed, 0.5, coag, intake);
    expect(result.clearwellLevel).toBeLessThan(3.0);
  });

  it('clearwell level clamps at 0 during extended backwash with empty well', () => {
    const { dis, sed, coag, intake } = baseStates();
    dis.clearwellLevel = 0;
    const bwSed = { ...sed, backwashInProgress: true };
    const result = runTicks(stage, dis, bwSed, 100, 0.5, coag, intake);
    expect(result.clearwellLevel).toBe(0);
  });

  it('chlorine pump run hours accumulate when running', () => {
    const { dis, sed, coag, intake } = baseStates();
    dis.chlorinePumpStatus = { ...dis.chlorinePumpStatus, running: true, fault: false, runHours: 0 };
    const result = stage.update(dis, sed, 3600, coag, intake);
    expect(result.chlorinePumpStatus.runHours).toBeCloseTo(1, 5);
  });

  it('UV system run hours accumulate when running and not faulted', () => {
    const { dis, sed, coag, intake } = baseStates();
    dis.uvSystemStatus = { ...dis.uvSystemStatus, running: true, fault: false, runHours: 0 };
    const result = stage.update(dis, sed, 3600, coag, intake);
    expect(result.uvSystemStatus.runHours).toBeCloseTo(1, 5);
  });

  it('high filter effluent turbidity exerts chlorine demand → lower plant Cl₂', () => {
    const { dis, coag, intake } = baseStates();
    dis.chlorineDoseRate = 2.0;
    dis.chlorineDoseSetpoint = 2.0;
    dis.chlorinePumpStatus = { ...dis.chlorinePumpStatus, running: true };

    const cleanSed = { ...createInitialState().sedimentation, filterEffluentTurbidity: 0.05 };
    const dirtySed = { ...createInitialState().sedimentation, filterEffluentTurbidity: 5.0 };

    const cleanResult = runTicks(stage, { ...dis }, cleanSed, 300, 0.5, coag, intake);
    const dirtyResult = runTicks(new DisinfectionStage(), { ...dis }, dirtySed, 300, 0.5, coag, intake);

    expect(cleanResult.chlorineResidualPlant).toBeGreaterThan(dirtyResult.chlorineResidualPlant);
  });

  it('distribution Cl₂ is lower than plant Cl₂ due to decay', () => {
    const { dis, sed, coag, intake } = baseStates();
    const result = runTicks(stage, dis, sed, 500, 0.5, coag, intake);
    expect(result.chlorineResidualDist).toBeLessThan(result.chlorineResidualPlant);
  });

  it('higher plant Cl₂ results in higher distribution Cl₂', () => {
    const { coag, intake } = baseStates();
    const sed = createInitialState().sedimentation;

    const lowDis = { ...createInitialState().disinfection, chlorineDoseRate: 0.5, chlorineDoseSetpoint: 0.5 };
    const highDis = { ...createInitialState().disinfection, chlorineDoseRate: 4.0, chlorineDoseSetpoint: 4.0 };

    const lowResult = runTicks(new DisinfectionStage(), lowDis, sed, 500, 0.5, coag, intake);
    const highResult = runTicks(new DisinfectionStage(), highDis, sed, 500, 0.5, coag, intake);

    expect(highResult.chlorineResidualDist).toBeGreaterThan(lowResult.chlorineResidualDist);
  });

  it('higher distribution demand drains clearwell faster than lower demand', () => {
    const { dis, sed, coag, intake } = baseStates();
    dis.clearwellLevel = 3.0;
    const normalSed = { ...sed, backwashInProgress: false };

    const lowDemand  = { ...dis, distributionDemand: 1.0 };
    const highDemand = { ...dis, distributionDemand: 5.0 };

    const lowResult  = runTicks(new DisinfectionStage(), lowDemand,  normalSed, 100, 0.5, coag, intake);
    const highResult = runTicks(new DisinfectionStage(), highDemand, normalSed, 100, 0.5, coag, intake);

    expect(highResult.clearwellLevel).toBeLessThan(lowResult.clearwellLevel);
  });

  it('zero distribution demand causes clearwell to fill (inflow only)', () => {
    const { dis, sed, coag, intake } = baseStates();
    dis.clearwellLevel = 3.0;
    dis.distributionDemand = 0;
    const normalSed = { ...sed, backwashInProgress: false };
    const result = stage.update(dis, normalSed, 0.5, coag, intake);
    expect(result.clearwellLevel).toBeGreaterThan(3.0);
  });

  it('chlorine pump fault causes dose rate to decay even when running=true', () => {
    const { dis, sed, coag, intake } = baseStates();
    dis.chlorineDoseRate = 2.0;
    dis.chlorinePumpStatus = { ...dis.chlorinePumpStatus, running: true, fault: true };
    const result = runTicks(stage, dis, sed, 100, 0.5, coag, intake);
    expect(result.chlorineDoseRate).toBeLessThan(2.0);
  });
});
