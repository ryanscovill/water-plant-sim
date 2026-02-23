import type { IntakeState } from '../ProcessState';
import { clamp, firstOrderLag, accumulateRunHours } from '../utils';

// PSI drift per simulated second (screen clogging rate)
const SCREEN_DRIFT_RATE = 0.0005;

// Max flow per intake pump at 100% speed (MGD)
const PUMP_MAX_FLOW_MGD = 4.5;

export class IntakeStage {
  private turbidityPhase = 0;

  update(state: IntakeState, dt: number): IntakeState {
    const next = { ...state };
    next.intakePump1 = { ...state.intakePump1 };
    next.intakePump2 = { ...state.intakePump2 };
    next.intakeValve = { ...state.intakeValve };

    next.intakePump1.runHours = accumulateRunHours(next.intakePump1.runHours, next.intakePump1.running, next.intakePump1.fault, dt);
    next.intakePump2.runHours = accumulateRunHours(next.intakePump2.runHours, next.intakePump2.running, next.intakePump2.fault, dt);

    const pump1Flow = (next.intakePump1.running && !next.intakePump1.fault)
      ? PUMP_MAX_FLOW_MGD * (next.intakePump1.speed / 100) : 0;
    const pump2Flow = (next.intakePump2.running && !next.intakePump2.fault)
      ? PUMP_MAX_FLOW_MGD * (next.intakePump2.speed / 100) : 0;

    const valveFactor = next.intakeValve.open ? (next.intakeValve.position / 100) : 0;
    const targetFlow = (pump1Flow + pump2Flow) * valveFactor;

    next.rawWaterFlow = clamp(firstOrderLag(next.rawWaterFlow, targetFlow, 0.1), 0, 10);

    // Wet-well mass balance: naturalInflow (ft/s equivalent) minus pump withdrawal.
    // Equilibrium at rawWaterFlow = naturalInflow / 0.02 MGD.
    const inflow = next.naturalInflow;
    const outflow = next.rawWaterFlow * 0.02;
    next.rawWaterLevel = clamp(next.rawWaterLevel + (inflow - outflow) * dt, 0, 15);

    next.screenDiffPressure = clamp(next.screenDiffPressure + SCREEN_DRIFT_RATE * dt, 0.5, 12);

    // Raw turbidity: sinusoidal modulation around source base with slow first-order lag.
    this.turbidityPhase += 0.001 * dt;
    const amplitude = Math.max(2, next.sourceTurbidityBase * 0.3);
    const baseTurbidity = next.sourceTurbidityBase
      + Math.sin(this.turbidityPhase) * amplitude * 0.6
      + Math.cos(this.turbidityPhase * 0.3) * amplitude * 0.4;
    next.rawTurbidity = clamp(firstOrderLag(next.rawTurbidity, baseTurbidity, 0.005), 1, 600);

    return next;
  }

  clearScreen(state: IntakeState): IntakeState {
    return { ...state, screenDiffPressure: 0.8 };
  }
}
