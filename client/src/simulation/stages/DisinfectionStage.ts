import type { DisinfectionState, SedimentationState, CoagulationState, IntakeState } from '../ProcessState';
import { clamp, firstOrderLag, accumulateRunHours, rampDoseRate } from '../utils';

// Chlorine utilisation efficiency (fraction of applied dose becoming residual)
const CL_DOSE_EFFICIENCY = 0.85;

// Chlorine demand per NTU of filter effluent turbidity (mg/L per NTU)
const CL_TURBIDITY_DEMAND = 0.1;

// First-order chlorine decay constant through distribution system (1/simulated-second).
// Yields ≈ 2.5% loss over a standard 0.5 s tick; scales correctly with any dt.
const CL_DIST_DECAY_K = 0.05;

// pH adjustment: 1 mg/L of caustic raises finished-water pH by this many S.U.
const PH_ADJUST_FACTOR = 0.2;

// Alum (aluminium sulfate) hydrolyses to release H⁺, depressing finished-water pH.
// Calibrated at 0.02 S.U. per mg/L; 18 mg/L default dose depresses pH by 0.36 S.U.
const ALUM_PH_DEPRESSION = 0.02;

// Fallback source pH used when IntakeState is not passed (tests, edge cases).
const DEFAULT_SOURCE_PH = 7.2;

export class DisinfectionStage {
  update(dis: DisinfectionState, sed: SedimentationState, dt: number, coag?: CoagulationState, intake?: IntakeState): DisinfectionState {
    const next = { ...dis };
    next.chlorinePumpStatus = { ...dis.chlorinePumpStatus };
    next.uvSystemStatus = { ...dis.uvSystemStatus };

    next.chlorinePumpStatus.runHours = accumulateRunHours(next.chlorinePumpStatus.runHours, next.chlorinePumpStatus.running, next.chlorinePumpStatus.fault, dt);
    next.uvSystemStatus.runHours = accumulateRunHours(next.uvSystemStatus.runHours, next.uvSystemStatus.running, next.uvSystemStatus.fault, dt);

    // Chlorine dose rate ramps toward setpoint when pump runs; decays slowly when off.
    next.chlorineDoseRate = rampDoseRate(next.chlorineDoseRate, next.chlorineDoseSetpoint, next.chlorinePumpStatus.running, next.chlorinePumpStatus.fault, 0.1, 0.95, 0, 10);

    // Plant residual: dose efficiency minus turbidity demand (high turbidity exerts Cl₂ demand).
    const targetClResidual = next.chlorineDoseRate * CL_DOSE_EFFICIENCY
      - sed.filterEffluentTurbidity * CL_TURBIDITY_DEMAND;
    next.chlorineResidualPlant = clamp(firstOrderLag(next.chlorineResidualPlant, targetClResidual, 0.05), 0, 5);

    // Distribution residual: first-order decay from plant (scales with dt so simSpeed-independent).
    const targetDistResidual = next.chlorineResidualPlant * Math.exp(-CL_DIST_DECAY_K * dt);
    next.chlorineResidualDist = clamp(firstOrderLag(next.chlorineResidualDist, targetDistResidual, 0.03), 0, 4);

    // Finished-water pH: starts from source water pH, alum depresses it, caustic/lime raises it.
    // Default: 7.2 (sourcePH) − 18×0.02 + 2.8×0.2 = 7.2 − 0.36 + 0.56 = 7.40 S.U.
    const sourcePH = intake?.sourcePH ?? DEFAULT_SOURCE_PH;
    const alumDose = coag?.alumDoseRate ?? 18;
    const targetPH = sourcePH - alumDose * ALUM_PH_DEPRESSION + (coag?.pHAdjustDoseRate ?? 2.8) * PH_ADJUST_FACTOR;
    next.finishedWaterPH = clamp(firstOrderLag(next.finishedWaterPH, targetPH, 0.02), 6.0, 9.0);

    // Clearwell level: inflow stops during backwash (filter not producing filtered water).
    const inflow = sed.backwashInProgress ? 0 : 0.02;
    const outflow = 0.015;
    next.clearwellLevel = clamp(next.clearwellLevel + (inflow - outflow) * dt, 0, 20);

    return next;
  }
}
