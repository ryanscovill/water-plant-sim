import type { SedimentationState, CoagulationState } from '../ProcessState';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

const BACKWASH_DURATION = 600;
const FILTER_RUNTIME_TRIGGER = 72;

export class SedimentationStage {
  update(sed: SedimentationState, coag: CoagulationState, dt: number): SedimentationState {
    const next = { ...sed };
    next.sludgePumpStatus = { ...sed.sludgePumpStatus };
    next.clarifierRakeStatus = { ...sed.clarifierRakeStatus };

    if (next.sludgePumpStatus.running && !next.sludgePumpStatus.fault) {
      next.sludgePumpStatus.runHours += dt / 3600;
    }
    if (next.clarifierRakeStatus.running && !next.clarifierRakeStatus.fault) {
      next.clarifierRakeStatus.runHours += dt / 3600;
    }

    const sludgeImpact = clamp(next.sludgeBlanketLevel / 6, 0, 0.5);
    const clarifierEfficiency = 0.9 * (1 - sludgeImpact);
    const targetClarTurb = coag.flocBasinTurbidity * (1 - clarifierEfficiency);
    next.clarifierTurbidity += (targetClarTurb - next.clarifierTurbidity) * 0.05;
    next.clarifierTurbidity = clamp(next.clarifierTurbidity, 0.1, 200);

    const sludgeAccumulation = 0.001 * (dt / 0.5);
    const sludgeRemoval =
      next.sludgePumpStatus.running && !next.sludgePumpStatus.fault
        ? 0.005 * (next.sludgePumpStatus.speed / 100) * (dt / 0.5)
        : 0;
    next.sludgeBlanketLevel += sludgeAccumulation - sludgeRemoval;
    next.sludgeBlanketLevel = clamp(next.sludgeBlanketLevel, 0, 10);

    if (next.backwashInProgress) {
      next.backwashTimeRemaining = Math.max(0, next.backwashTimeRemaining - dt);
      if (next.backwashTimeRemaining <= 0) {
        next.backwashInProgress = false;
        next.filterHeadLoss = 0.5;
        next.filterRunTime = 0;
      }
    } else {
      if (next.filterRunTime < FILTER_RUNTIME_TRIGGER) {
        next.filterHeadLoss += 0.0001 * (dt / 0.5) * (1 + next.clarifierTurbidity / 5);
        next.filterRunTime += dt / 3600;
      }
      next.filterHeadLoss = clamp(next.filterHeadLoss, 0, 12);
    }

    const filterBreakthrough = clamp((next.filterHeadLoss - 6) / 3, 0, 1);
    const targetEfflTurb = next.clarifierTurbidity * 0.05 + filterBreakthrough * 2;
    next.filterEffluentTurbidity += (targetEfflTurb - next.filterEffluentTurbidity) * 0.03;
    next.filterEffluentTurbidity = clamp(next.filterEffluentTurbidity, 0.01, 10);

    return next;
  }

  startBackwash(state: SedimentationState): SedimentationState {
    return { ...state, backwashInProgress: true, backwashTimeRemaining: BACKWASH_DURATION };
  }

  abortBackwash(state: SedimentationState): SedimentationState {
    return { ...state, backwashInProgress: false, backwashTimeRemaining: 0 };
  }
}
