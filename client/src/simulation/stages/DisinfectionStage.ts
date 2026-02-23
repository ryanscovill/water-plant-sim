import type { DisinfectionState, SedimentationState, CoagulationState } from '../ProcessState';
import { clamp, firstOrderLag, accumulateRunHours, rampDoseRate } from '../utils';

// Chlorine utilisation efficiency (fraction of applied dose becoming residual)
const CL_DOSE_EFFICIENCY = 0.85;

// Chlorine demand per NTU of filter effluent turbidity (mg/L per NTU)
const CL_TURBIDITY_DEMAND = 0.1;

// First-order chlorine decay constant through distribution system (1/simulated-second).
// Yields ≈ 2.5% loss over a standard 0.5 s tick; scales correctly with any dt.
const CL_DIST_DECAY_K = 0.05;

// Fluoride dose-to-residual transfer efficiency (90%)
const F_DOSE_EFFICIENCY = 0.9;

// pH adjustment: 1 mg/L of caustic raises finished-water pH by this many S.U.
// Calibrated so that the default 2.0 mg/L dose yields target pH 7.4.
const PH_ADJUST_FACTOR = 0.2;
const PH_BASE = 7.0;

export class DisinfectionStage {
  update(dis: DisinfectionState, sed: SedimentationState, dt: number, coag?: CoagulationState): DisinfectionState {
    const next = { ...dis };
    next.chlorinePumpStatus = { ...dis.chlorinePumpStatus };
    next.fluoridePumpStatus = { ...dis.fluoridePumpStatus };
    next.uvSystemStatus = { ...dis.uvSystemStatus };

    next.chlorinePumpStatus.runHours = accumulateRunHours(next.chlorinePumpStatus.runHours, next.chlorinePumpStatus.running, next.chlorinePumpStatus.fault, dt);
    next.fluoridePumpStatus.runHours = accumulateRunHours(next.fluoridePumpStatus.runHours, next.fluoridePumpStatus.running, next.fluoridePumpStatus.fault, dt);
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

    // Fluoride dose rate ramps toward setpoint; decays slowly when off.
    next.fluorideDoseRate = rampDoseRate(next.fluorideDoseRate, next.fluorideDoseSetpoint, next.fluoridePumpStatus.running, next.fluoridePumpStatus.fault, 0.1, 0.95, 0, 2);
    const targetFluoride = next.fluorideDoseRate * F_DOSE_EFFICIENCY;
    next.fluorideResidual = clamp(firstOrderLag(next.fluorideResidual, targetFluoride, 0.05), 0, 2);

    // Finished-water pH: base 7.0 plus contribution from caustic/lime dose.
    // Default 2.0 mg/L × 0.2 S.U./(mg/L) → target 7.4 S.U.
    const targetPH = PH_BASE + (coag?.pHAdjustDoseRate ?? 2.0) * PH_ADJUST_FACTOR;
    next.finishedWaterPH = clamp(firstOrderLag(next.finishedWaterPH, targetPH, 0.02), 6.0, 9.0);

    // Clearwell level: inflow stops during backwash (filter not producing filtered water).
    const inflow = sed.backwashInProgress ? 0 : 0.02;
    const outflow = 0.015;
    next.clearwellLevel = clamp(next.clearwellLevel + (inflow - outflow) * dt, 0, 20);

    return next;
  }
}
