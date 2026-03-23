import type { PrimaryClarifierState, HeadworksState } from '../WWProcessState';
import { clamp, firstOrderLag, lagFactor, accumulateRunHours, rampDoseRate } from '../../utils';
import { PRIMARY_CONSTANTS } from '../wwConfig';

const {
  CLARIFIER_AREA_FT2,
  BASE_BOD_REMOVAL,
  BASE_TSS_REMOVAL,
  SLUDGE_ACCUMULATION_RATE,
  SLUDGE_PUMP_REMOVAL_RATE,
  MAX_SLUDGE_BLANKET,
} = PRIMARY_CONSTANTS;

export class PrimaryClarifierStage {
  update(state: PrimaryClarifierState, headworks: HeadworksState, dt: number): PrimaryClarifierState {
    const next = { ...state };
    next.primarySludgePump = { ...state.primarySludgePump };
    next.scraperStatus = { ...state.scraperStatus };

    // ── Run hours ──────────────────────────────────────────────────────────
    next.primarySludgePump.runHours = accumulateRunHours(
      next.primarySludgePump.runHours, next.primarySludgePump.running, next.primarySludgePump.fault, dt,
    );
    next.scraperStatus.runHours = accumulateRunHours(
      next.scraperStatus.runHours, next.scraperStatus.running, next.scraperStatus.fault, dt,
    );

    // ── Surface overflow rate ──────────────────────────────────────────────
    // SOR = flow (GPD) / area (ft2); flow is in MGD so multiply by 1,000,000
    next.surfaceOverflowRate = headworks.influentFlow * 1_000_000 / CLARIFIER_AREA_FT2;

    // ── Removal efficiency factors ─────────────────────────────────────────
    // sorFactor: degrades at high SOR (above ~1200 gpd/ft2 typical design)
    const sorFactor = clamp(1.2 - next.surfaceOverflowRate / 2000, 0.6, 1.0);

    // sludgeImpact: high sludge blanket causes carryover, degrading effluent
    const sludgeImpact = clamp(next.sludgeBlanketLevel / MAX_SLUDGE_BLANKET, 0, 1) * 0.5;

    // BOD and TSS removal fractions
    const bodRemoval = clamp(BASE_BOD_REMOVAL * (1 - sludgeImpact) * sorFactor, 0.15, 0.40);
    const tssRemoval = clamp(BASE_TSS_REMOVAL * (1 - sludgeImpact) * sorFactor, 0.30, 0.70);

    // ── Effluent quality (first-order lag toward target) ───────────────────
    const effluentFactor = lagFactor(dt, 600);
    const targetBOD = headworks.influentBOD * (1 - bodRemoval);
    const targetTSS = headworks.influentTSS * (1 - tssRemoval);

    next.primaryEffluentBOD = clamp(
      firstOrderLag(next.primaryEffluentBOD, targetBOD, effluentFactor),
      1,
      1000,
    );
    next.primaryEffluentTSS = clamp(
      firstOrderLag(next.primaryEffluentTSS, targetTSS, effluentFactor),
      1,
      1000,
    );

    // ── Sludge blanket dynamics ────────────────────────────────────────────
    // Accumulates at a base rate; removed when pump is running
    let sludgeDelta = SLUDGE_ACCUMULATION_RATE * dt;

    if (next.primarySludgePump.running && !next.primarySludgePump.fault) {
      sludgeDelta -= SLUDGE_PUMP_REMOVAL_RATE * (next.primarySludgePump.speed / 100) * dt;
    }

    next.sludgeBlanketLevel = clamp(
      next.sludgeBlanketLevel + sludgeDelta,
      0,
      MAX_SLUDGE_BLANKET,
    );

    // ── Sludge wasting rate ────────────────────────────────────────────────
    next.sludgeWastingRate = rampDoseRate(
      next.sludgeWastingRate,
      next.sludgeWastingSetpoint,
      next.primarySludgePump.running,
      next.primarySludgePump.fault,
      0.1,   // rampFactor — fraction of gap closed per tick
      0.95,  // decayFactor — fraction remaining per tick when off
      0,     // min GPM
      200,   // max GPM
    );

    return next;
  }
}
