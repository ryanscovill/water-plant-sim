import type {
  WWDisinfectionState,
  SecondaryClarifierState,
  AerationState,
  HeadworksState,
} from '../WWProcessState';
import { clamp, firstOrderLag, lagFactor, accumulateRunHours, rampDoseRate } from '../../utils';
import { WW_DISINFECTION_CONSTANTS } from '../wwConfig';

const {
  CL_EFFICIENCY,
  CL_DEMAND_BOD,
  CL_DEMAND_TSS,
  CL_DEMAND_NH3,
  CONTACT_VOLUME_GAL,
  DECHLOR_EFFICIENCY,
} = WW_DISINFECTION_CONSTANTS;

export class WWDisinfectionStage {
  update(
    state: WWDisinfectionState,
    secondary: SecondaryClarifierState,
    aeration: AerationState,
    headworks: HeadworksState,
    dt: number,
  ): WWDisinfectionState {
    const next = { ...state };
    next.chlorinePump = { ...state.chlorinePump };
    next.dechlorinationPump = { ...state.dechlorinationPump };

    // ── Run hours ───────────────────────────────────────────────────────────
    next.chlorinePump.runHours = accumulateRunHours(
      next.chlorinePump.runHours,
      next.chlorinePump.running,
      next.chlorinePump.fault,
      dt,
    );
    next.dechlorinationPump.runHours = accumulateRunHours(
      next.dechlorinationPump.runHours,
      next.dechlorinationPump.running,
      next.dechlorinationPump.fault,
      dt,
    );

    // ── Chlorine dose: ramp toward setpoint when pump running ────────────
    next.chlorineDoseRate = rampDoseRate(
      next.chlorineDoseRate,
      next.chlorineDoseSetpoint,
      next.chlorinePump.running,
      next.chlorinePump.fault,
      lagFactor(dt, 5),    // rampFactor
      Math.exp(-dt / 10),  // decayFactor
      0,                   // min
      15,                  // max
    );

    // ── Chlorine demand ─────────────────────────────────────────────────────
    const demand =
      secondary.effluentBOD * CL_DEMAND_BOD +
      secondary.effluentTSS * CL_DEMAND_TSS +
      aeration.aerationBasinNH3 * CL_DEMAND_NH3;

    // ── Target chlorine residual ────────────────────────────────────────────
    const targetResidual = next.chlorineDoseRate * CL_EFFICIENCY - demand;
    next.chlorineResidual = clamp(
      firstOrderLag(next.chlorineResidual, targetResidual, lagFactor(dt, 120)),
      0,
      10,
    );

    // ── Dechlorination dose ─────────────────────────────────────────────────
    next.dechlorinationDoseRate = rampDoseRate(
      next.dechlorinationDoseRate,
      next.dechlorinationSetpoint,
      next.dechlorinationPump.running,
      next.dechlorinationPump.fault,
      lagFactor(dt, 5),    // same ramp/decay pattern
      Math.exp(-dt / 10),
      0,
      15,
    );

    // ── Total residual chlorine (after dechlorination) ──────────────────────
    const targetTRC = Math.max(
      0,
      next.chlorineResidual - next.dechlorinationDoseRate * DECHLOR_EFFICIENCY,
    );
    next.totalResidualChlorine = firstOrderLag(
      next.totalResidualChlorine,
      targetTRC,
      lagFactor(dt, 60),
    );

    // ── Contact time ────────────────────────────────────────────────────────
    // CT = volume / flow rate, flow in MGD converted to gal/min
    const flowGPM = headworks.influentFlow * 1_000_000 / 1440;
    next.chlorineContactTime = flowGPM > 0
      ? CONTACT_VOLUME_GAL / flowGPM
      : Infinity;

    // ── Effluent pass-through from upstream stages ──────────────────────────
    next.effluentBOD = secondary.effluentBOD;
    next.effluentTSS = secondary.effluentTSS;
    next.effluentNH3 = aeration.aerationBasinNH3;
    next.effluentFlow = headworks.influentFlow;

    // ── Effluent pH: slight depression from chlorine addition ───────────────
    const targetPH = headworks.influentPH - next.chlorineDoseRate * 0.05;
    next.effluentPH = clamp(
      firstOrderLag(next.effluentPH, targetPH, lagFactor(dt, 300)),
      4.0,
      10.0,
    );

    return next;
  }
}
