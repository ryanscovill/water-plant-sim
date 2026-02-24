import type { DisinfectionState, SedimentationState, CoagulationState, IntakeState } from '../ProcessState';
import { clamp, firstOrderLag, lagFactor, accumulateRunHours, rampDoseRate } from '../utils';

// Chlorine utilisation efficiency (fraction of applied dose becoming residual)
const CL_DOSE_EFFICIENCY = 0.85;

// Chlorine demand per NTU of filter effluent turbidity (mg/L per NTU)
const CL_TURBIDITY_DEMAND = 0.1;

// Chlorine decay constant for pipe transit from plant to distribution analyser (1/simulated-second).
const CL_DIST_DECAY_K = 0.05;
// Nominal pipe transit time (simulated seconds). This is a fixed spatial property —
// the pipe length doesn't change with simSpeed — so dt must NOT be used here.
const CL_DIST_TRANSIT_S = 0.5;

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
    // τ = 120 s — chlorine analyser response (2-min instrument lag) + contact chamber mixing
    next.chlorineResidualPlant = clamp(firstOrderLag(next.chlorineResidualPlant, targetClResidual, lagFactor(dt, 120)), 0, 5);

    // Distribution residual: fixed spatial decay from plant through pipe network to analyser.
    // Uses CL_DIST_TRANSIT_S (not dt) so the steady-state reading is simSpeed-independent.
    const targetDistResidual = next.chlorineResidualPlant * Math.exp(-CL_DIST_DECAY_K * CL_DIST_TRANSIT_S);
    // τ = 900 s — 15-min pipe transit from plant to distribution sample point + analyser response
    next.chlorineResidualDist = clamp(firstOrderLag(next.chlorineResidualDist, targetDistResidual, lagFactor(dt, 900)), 0, 4);

    // Finished-water pH: starts from source water pH, alum depresses it, caustic/lime raises it.
    // Default: 7.2 (sourcePH) − 18×0.02 + 2.8×0.2 = 7.2 − 0.36 + 0.56 = 7.40 S.U.
    const sourcePH = intake?.sourcePH ?? DEFAULT_SOURCE_PH;
    const alumDose = coag?.alumDoseRate ?? 18;
    const targetPH = sourcePH - alumDose * ALUM_PH_DEPRESSION + (coag?.pHAdjustDoseRate ?? 2.8) * PH_ADJUST_FACTOR;
    // τ = 420 s — clearwell mixing lag (~7 min) + pH analyser response
    next.finishedWaterPH = clamp(firstOrderLag(next.finishedWaterPH, targetPH, lagFactor(dt, 420)), 6.0, 9.0);

    // Clearwell level: inflow is proportional to plant flow; stops during backwash.
    // At nominal flow (3.375 MGD) inflow = 0.000283 m/s, based on a realistic clearwell with
    // ~6-hour storage: volume = 3.375 MGD × 0.25 day × 3785 L/MG = 3193 m³,
    // cross-section = 3193/6.1 m ≈ 523 m², level rate = 0.1479 m³/s / 523 m² ≈ 0.000283 m/s.
    const NOMINAL_FLOW_MGD = 3.375;
    const NOMINAL_INFLOW = 0.000283; // m/s at nominal flow
    const M_PER_MGD = NOMINAL_INFLOW / NOMINAL_FLOW_MGD; // level rate (m/s) per MGD
    const flowFraction = (intake?.rawWaterFlow ?? 0) / NOMINAL_FLOW_MGD;
    const inflow = sed.backwashInProgress ? 0 : NOMINAL_INFLOW * flowFraction;
    const outflow = next.distributionDemand * M_PER_MGD; // scales with operator demand setpoint
    next.clearwellLevel = clamp(next.clearwellLevel + (inflow - outflow) * dt, 0, 6.1);

    return next;
  }
}
