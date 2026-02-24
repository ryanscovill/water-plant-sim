import type { DisinfectionState, SedimentationState, CoagulationState, IntakeState } from '../ProcessState';
import { clamp, firstOrderLag, lagFactor, accumulateRunHours, rampDoseRate } from '../utils';

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

    // Chlorine dose: ramp τ = 5 s (pump response), decay τ = 10 s (residual line drain).
    next.chlorineDoseRate = rampDoseRate(next.chlorineDoseRate, next.chlorineDoseSetpoint, next.chlorinePumpStatus.running, next.chlorinePumpStatus.fault, lagFactor(dt, 5), Math.exp(-dt / 10), 0, 10);

    // Plant residual: dose efficiency minus turbidity demand (high turbidity exerts Cl₂ demand).
    const targetClResidual = next.chlorineDoseRate * CL_DOSE_EFFICIENCY
      - sed.filterEffluentTurbidity * CL_TURBIDITY_DEMAND;
    // τ = 10 s — chlorine analyser response / contactor mixing
    next.chlorineResidualPlant = clamp(firstOrderLag(next.chlorineResidualPlant, targetClResidual, lagFactor(dt, 10)), 0, 5);

    // Distribution residual: first-order decay from plant (scales with dt so simSpeed-independent).
    const targetDistResidual = next.chlorineResidualPlant * Math.exp(-CL_DIST_DECAY_K * dt);
    // τ = 16 s — distribution analyser response / pipe transit lag
    next.chlorineResidualDist = clamp(firstOrderLag(next.chlorineResidualDist, targetDistResidual, lagFactor(dt, 16)), 0, 4);

    // Finished-water pH: starts from source water pH, alum depresses it, caustic/lime raises it.
    // Default: 7.2 (sourcePH) − 18×0.02 + 2.8×0.2 = 7.2 − 0.36 + 0.56 = 7.40 S.U.
    const sourcePH = intake?.sourcePH ?? DEFAULT_SOURCE_PH;
    const alumDose = coag?.alumDoseRate ?? 18;
    const targetPH = sourcePH - alumDose * ALUM_PH_DEPRESSION + (coag?.pHAdjustDoseRate ?? 2.8) * PH_ADJUST_FACTOR;
    // τ = 25 s — pH analyser response / clearwell mixing lag
    next.finishedWaterPH = clamp(firstOrderLag(next.finishedWaterPH, targetPH, lagFactor(dt, 25)), 6.0, 9.0);

    // Clearwell level: inflow stops during backwash (filter not producing filtered water).
    const inflow = sed.backwashInProgress ? 0 : 0.006; // m/s
    const outflow = 0.0046; // m/s
    next.clearwellLevel = clamp(next.clearwellLevel + (inflow - outflow) * dt, 0, 6.1);

    return next;
  }
}
