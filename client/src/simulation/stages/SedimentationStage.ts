import type { SedimentationState, CoagulationState } from '../ProcessState';
import { clamp, firstOrderLag, lagFactor, accumulateRunHours } from '../utils';

// AWWA/Ten States Standards: 10-minute backwash at normal flow
const BACKWASH_DURATION = 600; // seconds

// Stop accumulating head loss after 72 h runtime (typical rapid-sand filter cycle)
const FILTER_RUNTIME_TRIGGER = 72; // hours

// Head loss at which filter breakthrough begins (ft)
const BREAKTHROUGH_ONSET_FT = 6;
// Head loss at which breakthrough is complete (ft)
const BREAKTHROUGH_FULL_FT = 9;

// Base clarifier solids-removal efficiency (90% under ideal conditions)
const CLARIFIER_BASE_EFFICIENCY = 0.9;

// Filter normal turbidity removal factor (95% of clarifier effluent removed)
const FILTER_NORMAL_REMOVAL = 0.05;

export class SedimentationStage {
  update(sed: SedimentationState, coag: CoagulationState, dt: number): SedimentationState {
    const next = { ...sed };
    next.sludgePumpStatus = { ...sed.sludgePumpStatus };
    next.clarifierRakeStatus = { ...sed.clarifierRakeStatus };

    next.sludgePumpStatus.runHours = accumulateRunHours(next.sludgePumpStatus.runHours, next.sludgePumpStatus.running, next.sludgePumpStatus.fault, dt);
    next.clarifierRakeStatus.runHours = accumulateRunHours(next.clarifierRakeStatus.runHours, next.clarifierRakeStatus.running, next.clarifierRakeStatus.fault, dt);

    // Sludge blanket degrades clarifier efficiency; impact tops out at 50% at 6 ft blanket.
    const sludgeImpact = clamp(next.sludgeBlanketLevel / 6, 0, 0.5);
    const clarifierEfficiency = CLARIFIER_BASE_EFFICIENCY * (1 - sludgeImpact);
    const targetClarTurb = coag.flocBasinTurbidity * (1 - clarifierEfficiency);
    // τ = 10 s — clarifier turbidimeter response
    next.clarifierTurbidity = clamp(firstOrderLag(next.clarifierTurbidity, targetClarTurb, lagFactor(dt, 10)), 0.1, 200);

    // Sludge blanket: constant accumulation vs. pump removal (normalized to standard 500 ms tick).
    const tickNorm = dt / 0.5;
    const sludgeAccumulation = 0.001 * tickNorm;
    const sludgeRemoval = (next.sludgePumpStatus.running && !next.sludgePumpStatus.fault)
      ? 0.005 * (next.sludgePumpStatus.speed / 100) * tickNorm
      : 0;
    next.sludgeBlanketLevel = clamp(next.sludgeBlanketLevel + sludgeAccumulation - sludgeRemoval, 0, 10);

    // Filter head loss and run time.
    if (next.backwashInProgress) {
      next.backwashTimeRemaining = Math.max(0, next.backwashTimeRemaining - dt);
      if (next.backwashTimeRemaining <= 0) {
        next.backwashInProgress = false;
        next.filterHeadLoss = 0.5; // clean filter starting head loss (ft)
        next.filterRunTime = 0;
      }
    } else {
      if (next.filterRunTime < FILTER_RUNTIME_TRIGGER) {
        // Head loss accumulates faster at high clarifier turbidity (fouling model).
        next.filterHeadLoss += 0.0001 * tickNorm * (1 + next.clarifierTurbidity / 5);
        next.filterRunTime += dt / 3600;
      }
      next.filterHeadLoss = clamp(next.filterHeadLoss, 0, 12);
    }

    // Filter breakthrough: onset at BREAKTHROUGH_ONSET_FT, complete at BREAKTHROUGH_FULL_FT.
    const filterBreakthrough = clamp(
      (next.filterHeadLoss - BREAKTHROUGH_ONSET_FT) / (BREAKTHROUGH_FULL_FT - BREAKTHROUGH_ONSET_FT),
      0, 1,
    );
    const targetEfflTurb = next.clarifierTurbidity * FILTER_NORMAL_REMOVAL + filterBreakthrough * 2;
    // τ = 16 s — filter effluent turbidimeter response
    next.filterEffluentTurbidity = clamp(firstOrderLag(next.filterEffluentTurbidity, targetEfflTurb, lagFactor(dt, 16)), 0.01, 10);

    return next;
  }

  startBackwash(state: SedimentationState): SedimentationState {
    return { ...state, backwashInProgress: true, backwashTimeRemaining: BACKWASH_DURATION };
  }

  abortBackwash(state: SedimentationState): SedimentationState {
    return { ...state, backwashInProgress: false, backwashTimeRemaining: 0 };
  }
}
