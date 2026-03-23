import type {
  SecondaryClarifierState,
  AerationState,
  HeadworksState,
} from '../WWProcessState';
import { clamp, firstOrderLag, lagFactor, accumulateRunHours } from '../../utils';
import { SECONDARY_CONSTANTS } from '../wwConfig';

const {
  CLARIFIER_AREA_FT2,
  BASE_SETTLING_EFFICIENCY,
  SVI_PENALTY_PER_UNIT,
} = SECONDARY_CONSTANTS;

export class SecondaryClarifierStage {
  update(
    state: SecondaryClarifierState,
    aeration: AerationState,
    headworks: HeadworksState,
    dt: number,
  ): SecondaryClarifierState {
    const next = { ...state };
    next.scraperStatus = { ...state.scraperStatus };
    next.rakeStatus = { ...state.rakeStatus };

    // ── Run hours ───────────────────────────────────────────────────────────
    next.scraperStatus.runHours = accumulateRunHours(
      next.scraperStatus.runHours,
      next.scraperStatus.running,
      next.scraperStatus.fault,
      dt,
    );
    next.rakeStatus.runHours = accumulateRunHours(
      next.rakeStatus.runHours,
      next.rakeStatus.running,
      next.rakeStatus.fault,
      dt,
    );

    // ── Settling efficiency ─────────────────────────────────────────────────
    const settlingEfficiency = clamp(
      BASE_SETTLING_EFFICIENCY - (aeration.svi - 100) * SVI_PENALTY_PER_UNIT,
      0.90,
      0.995,
    );

    // ── Effluent TSS ────────────────────────────────────────────────────────
    const targetTSS = aeration.mlss * (1 - settlingEfficiency);
    next.effluentTSS = firstOrderLag(next.effluentTSS, targetTSS, lagFactor(dt, 300));

    // ── Effluent BOD ────────────────────────────────────────────────────────
    // Soluble BOD from aeration basin + particulate BOD (0.5 * effluent TSS)
    const targetBOD = aeration.aerationBasinBOD + 0.5 * next.effluentTSS;
    next.effluentBOD = firstOrderLag(next.effluentBOD, targetBOD, lagFactor(dt, 300));

    // ── Surface overflow rate ───────────────────────────────────────────────
    next.surfaceOverflowRate = headworks.influentFlow * 1_000_000 / CLARIFIER_AREA_FT2;

    // ── Sludge blanket dynamics ─────────────────────────────────────────────
    const accumRate = 0.00005 * (aeration.svi / 100); // ft/s
    next.sludgeBlanketLevel += accumRate * dt;

    // Scraper reduces blanket when running
    if (next.scraperStatus.running && !next.scraperStatus.fault) {
      next.sludgeBlanketLevel -= 0.0002 * (next.scraperStatus.speed / 100) * dt;
    }

    next.sludgeBlanketLevel = clamp(next.sludgeBlanketLevel, 0, 8);

    return next;
  }
}
