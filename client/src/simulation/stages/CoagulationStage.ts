import type { CoagulationState, IntakeState } from '../ProcessState';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export class CoagulationStage {
  update(coag: CoagulationState, intake: IntakeState, dt: number): CoagulationState {
    const next = { ...coag };
    next.alumPumpStatus = { ...coag.alumPumpStatus };
    next.rapidMixerStatus = { ...coag.rapidMixerStatus };
    next.slowMixerStatus = { ...coag.slowMixerStatus };

    if (next.alumPumpStatus.running && !next.alumPumpStatus.fault) {
      next.alumPumpStatus.runHours += dt / 3600;
    }
    if (next.rapidMixerStatus.running && !next.rapidMixerStatus.fault) {
      next.rapidMixerStatus.runHours += dt / 3600;
    }
    if (next.slowMixerStatus.running && !next.slowMixerStatus.fault) {
      next.slowMixerStatus.runHours += dt / 3600;
    }

    if (next.alumPumpStatus.running && !next.alumPumpStatus.fault) {
      next.alumDoseRate += (next.alumDoseSetpoint - next.alumDoseRate) * 0.1;
    } else {
      next.alumDoseRate *= 0.9;
    }
    next.alumDoseRate = clamp(next.alumDoseRate, 0, 80);

    const mixingFactor =
      (next.rapidMixerStatus.running ? 1.2 : 0.5) *
      (next.slowMixerStatus.running ? 1.1 : 0.7);

    const temp = intake.sourceTemperature ?? 16;
    const tempFactor = clamp((temp - 1) / 19, 0.35, 1.0);

    const alumEffectiveness = clamp((next.alumDoseRate / (intake.rawTurbidity * 0.12)) * tempFactor, 0, 1);
    const targetFlocTurb = (intake.rawTurbidity * (1 - 0.85 * alumEffectiveness)) / mixingFactor;
    next.flocBasinTurbidity += (targetFlocTurb - next.flocBasinTurbidity) * 0.02;
    next.flocBasinTurbidity = clamp(next.flocBasinTurbidity, 0.5, 600);

    if (next.rapidMixerStatus.running) {
      next.rapidMixerSpeed = clamp(next.rapidMixerSpeed + (120 - next.rapidMixerSpeed) * 0.1, 0, 200);
    } else {
      next.rapidMixerSpeed *= 0.9;
    }

    if (next.slowMixerStatus.running) {
      next.slowMixerSpeed = clamp(next.slowMixerSpeed + (45 - next.slowMixerSpeed) * 0.1, 0, 100);
    } else {
      next.slowMixerSpeed *= 0.9;
    }

    return next;
  }
}
