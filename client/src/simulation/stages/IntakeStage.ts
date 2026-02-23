import type { IntakeState } from '../ProcessState';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export class IntakeStage {
  private turbidityPhase = 0;
  private screenDriftRate = 0.0005; // PSI per tick

  update(state: IntakeState, dt: number): IntakeState {
    const next = { ...state };
    next.intakePump1 = { ...state.intakePump1 };
    next.intakePump2 = { ...state.intakePump2 };
    next.intakeValve = { ...state.intakeValve };

    if (next.intakePump1.running && !next.intakePump1.fault) {
      next.intakePump1.runHours += dt / 3600;
    }
    if (next.intakePump2.running && !next.intakePump2.fault) {
      next.intakePump2.runHours += dt / 3600;
    }

    const pump1Flow = (next.intakePump1.running && !next.intakePump1.fault)
      ? 4.5 * (next.intakePump1.speed / 100) : 0;
    const pump2Flow = (next.intakePump2.running && !next.intakePump2.fault)
      ? 4.5 * (next.intakePump2.speed / 100) : 0;

    const valveFactor = next.intakeValve.open ? (next.intakeValve.position / 100) : 0;
    const targetFlow = (pump1Flow + pump2Flow) * valveFactor;

    next.rawWaterFlow += (targetFlow - next.rawWaterFlow) * 0.1;
    next.rawWaterFlow = clamp(next.rawWaterFlow, 0, 10);

    const inflow = next.naturalInflow;
    const outflow = next.rawWaterFlow * 0.02;
    next.rawWaterLevel += (inflow - outflow) * dt;
    next.rawWaterLevel = clamp(next.rawWaterLevel, 0, 15);

    next.screenDiffPressure += this.screenDriftRate * dt;
    next.screenDiffPressure = clamp(next.screenDiffPressure, 0.5, 12);

    this.turbidityPhase += 0.001 * dt;
    const amplitude = Math.max(2, next.sourceTurbidityBase * 0.3);
    const baseTurbidity = next.sourceTurbidityBase
      + Math.sin(this.turbidityPhase) * amplitude * 0.6
      + Math.cos(this.turbidityPhase * 0.3) * amplitude * 0.4;
    next.rawTurbidity += (baseTurbidity - next.rawTurbidity) * 0.005;
    next.rawTurbidity = clamp(next.rawTurbidity, 1, 600);

    return next;
  }

  clearScreen(state: IntakeState): IntakeState {
    return { ...state, screenDiffPressure: 0.8 };
  }
}
