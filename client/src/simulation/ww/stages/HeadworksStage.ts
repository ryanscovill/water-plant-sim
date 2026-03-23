import type { HeadworksState } from '../WWProcessState';
import { clamp, firstOrderLag, lagFactor, accumulateRunHours } from '../../utils';
import { HEADWORKS_CONSTANTS } from '../wwConfig';

const {
  PUMP_MAX_FLOW_MGD,
  SCREEN_DRIFT_RATE,
  SCREEN_CLEAN_DP,
  GRIT_EFFICIENCY_ON,
  GRIT_EFFICIENCY_OFF,
} = HEADWORKS_CONSTANTS;

/** Max bar screen DP before the screen is completely blocked (in H2O). */
const SCREEN_MAX_DP = 30;

/**
 * Fraction of raw TSS that is grit-removable.
 * Typically 10-20% of influent TSS is inorganic grit.
 */
const GRIT_TSS_FRACTION = 0.15;

export class HeadworksStage {
  update(state: HeadworksState, dt: number): HeadworksState {
    const next = { ...state };
    next.influentPump1 = { ...state.influentPump1 };
    next.influentPump2 = { ...state.influentPump2 };
    next.influentValve = { ...state.influentValve };
    next.gritCollectorStatus = { ...state.gritCollectorStatus };

    // ── Run hours ──────────────────────────────────────────────────────────
    next.influentPump1.runHours = accumulateRunHours(
      next.influentPump1.runHours, next.influentPump1.running, next.influentPump1.fault, dt,
    );
    next.influentPump2.runHours = accumulateRunHours(
      next.influentPump2.runHours, next.influentPump2.running, next.influentPump2.fault, dt,
    );
    next.gritCollectorStatus.runHours = accumulateRunHours(
      next.gritCollectorStatus.runHours, next.gritCollectorStatus.running, next.gritCollectorStatus.fault, dt,
    );

    // ── Pump flow ──────────────────────────────────────────────────────────
    const pump1Flow = (next.influentPump1.running && !next.influentPump1.fault)
      ? PUMP_MAX_FLOW_MGD * (next.influentPump1.speed / 100)
      : 0;
    const pump2Flow = (next.influentPump2.running && !next.influentPump2.fault)
      ? PUMP_MAX_FLOW_MGD * (next.influentPump2.speed / 100)
      : 0;

    const valveFactor = next.influentValve.open ? (next.influentValve.position / 100) : 0;
    const targetFlow = (pump1Flow + pump2Flow) * valveFactor;

    // tau = 5s — pump/valve hydraulic response time
    next.influentFlow = clamp(
      firstOrderLag(next.influentFlow, targetFlow, lagFactor(dt, 5)),
      0,
      PUMP_MAX_FLOW_MGD * 2,
    );

    // ── Bar screen differential pressure ───────────────────────────────────
    next.barScreenDiffPressure = clamp(
      next.barScreenDiffPressure + SCREEN_DRIFT_RATE * dt,
      0,
      SCREEN_MAX_DP,
    );

    // ── Influent quality (slow convergence to source base values) ──────────
    const qualityFactor = lagFactor(dt, 300);

    // BOD: converge toward source base
    next.influentBOD = clamp(
      firstOrderLag(next.influentBOD, next.sourceBODBase, qualityFactor),
      1,
      1000,
    );

    // TSS: converge toward source base, then apply grit removal
    const gritEfficiency = (next.gritCollectorStatus.running && !next.gritCollectorStatus.fault)
      ? GRIT_EFFICIENCY_ON
      : GRIT_EFFICIENCY_OFF;
    const tssTarget = next.sourceTSSBase * (1 - gritEfficiency * GRIT_TSS_FRACTION);
    next.influentTSS = clamp(
      firstOrderLag(next.influentTSS, tssTarget, qualityFactor),
      1,
      1000,
    );

    // NH3: converge toward source base
    next.influentNH3 = clamp(
      firstOrderLag(next.influentNH3, next.sourceNH3Base, qualityFactor),
      0.1,
      100,
    );

    // Temperature and pH: hold steady (no dynamic model needed for now)
    // They remain at their current values.

    return next;
  }

  clearScreen(state: HeadworksState): HeadworksState {
    return { ...state, barScreenDiffPressure: SCREEN_CLEAN_DP };
  }
}
