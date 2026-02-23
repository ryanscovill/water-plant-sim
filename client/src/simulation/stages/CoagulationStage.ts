import type { CoagulationState, IntakeState } from '../ProcessState';
import { clamp, firstOrderLag, accumulateRunHours, rampDoseRate } from '../utils';

// Alum dose-to-turbidity ratio constant (dimensionless)
const ALUM_TURBIDITY_RATIO = 0.12;

// Maximum turbidity removal fraction by coagulation (85%)
const MAX_COAG_REMOVAL = 0.85;

// Rapid-mix target speed (RPM) and slow-mix target speed (RPM)
const RAPID_MIX_TARGET_RPM = 120;
const SLOW_MIX_TARGET_RPM = 45;

export class CoagulationStage {
  update(coag: CoagulationState, intake: IntakeState, dt: number): CoagulationState {
    const next = { ...coag };
    next.alumPumpStatus = { ...coag.alumPumpStatus };
    next.rapidMixerStatus = { ...coag.rapidMixerStatus };
    next.slowMixerStatus = { ...coag.slowMixerStatus };

    next.alumPumpStatus.runHours = accumulateRunHours(next.alumPumpStatus.runHours, next.alumPumpStatus.running, next.alumPumpStatus.fault, dt);
    next.rapidMixerStatus.runHours = accumulateRunHours(next.rapidMixerStatus.runHours, next.rapidMixerStatus.running, next.rapidMixerStatus.fault, dt);
    next.slowMixerStatus.runHours = accumulateRunHours(next.slowMixerStatus.runHours, next.slowMixerStatus.running, next.slowMixerStatus.fault, dt);

    // Alum dose ramps toward setpoint when pump runs; decays when off (τ_decay = 10 ticks).
    next.alumDoseRate = rampDoseRate(next.alumDoseRate, next.alumDoseSetpoint, next.alumPumpStatus.running, next.alumPumpStatus.fault, 0.1, 0.9, 0, 80);

    // Mixing energy boosts coagulation (rapid mix has larger effect than slow mix).
    const mixingFactor =
      (next.rapidMixerStatus.running ? 1.2 : 0.5) *
      (next.slowMixerStatus.running ? 1.1 : 0.7);

    // Cold water reduces coagulant effectiveness (< 5 °C is especially problematic).
    // Linear scale: 0.35 at 1 °C → 1.0 at 20 °C, clamped.
    const temp = intake.sourceTemperature ?? 16;
    const tempFactor = clamp((temp - 1) / 19, 0.35, 1.0);

    // Jar-test derived relationship: dose/(turbidity × 0.12) gives coagulation efficiency.
    const alumEffectiveness = clamp(
      (next.alumDoseRate / (intake.rawTurbidity * ALUM_TURBIDITY_RATIO)) * tempFactor,
      0, 1,
    );
    const targetFlocTurb = (intake.rawTurbidity * (1 - MAX_COAG_REMOVAL * alumEffectiveness)) / mixingFactor;
    next.flocBasinTurbidity = clamp(firstOrderLag(next.flocBasinTurbidity, targetFlocTurb, 0.02), 0.5, 600);

    // Mixer speeds track target RPM with first-order lag; coast down when stopped.
    next.rapidMixerSpeed = next.rapidMixerStatus.running
      ? clamp(firstOrderLag(next.rapidMixerSpeed, RAPID_MIX_TARGET_RPM, 0.1), 0, 200)
      : next.rapidMixerSpeed * 0.9;

    next.slowMixerSpeed = next.slowMixerStatus.running
      ? clamp(firstOrderLag(next.slowMixerSpeed, SLOW_MIX_TARGET_RPM, 0.1), 0, 100)
      : next.slowMixerSpeed * 0.9;

    return next;
  }
}
