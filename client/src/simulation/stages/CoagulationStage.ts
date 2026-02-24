import type { CoagulationState, IntakeState } from '../ProcessState';
import { clamp, firstOrderLag, lagFactor, accumulateRunHours, rampDoseRate } from '../utils';

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
    next.pHAdjustPumpStatus = { ...coag.pHAdjustPumpStatus };

    next.alumPumpStatus.runHours = accumulateRunHours(next.alumPumpStatus.runHours, next.alumPumpStatus.running, next.alumPumpStatus.fault, dt);
    next.rapidMixerStatus.runHours = accumulateRunHours(next.rapidMixerStatus.runHours, next.rapidMixerStatus.running, next.rapidMixerStatus.fault, dt);
    next.slowMixerStatus.runHours = accumulateRunHours(next.slowMixerStatus.runHours, next.slowMixerStatus.running, next.slowMixerStatus.fault, dt);
    next.pHAdjustPumpStatus.runHours = accumulateRunHours(next.pHAdjustPumpStatus.runHours, next.pHAdjustPumpStatus.running, next.pHAdjustPumpStatus.fault, dt);

    // Alum dose: ramp τ = 5 s (pump response), decay τ = 5 s (line drains quickly).
    next.alumDoseRate = rampDoseRate(next.alumDoseRate, next.alumDoseSetpoint, next.alumPumpStatus.running, next.alumPumpStatus.fault, lagFactor(dt, 5), Math.exp(-dt / 5), 0, 80);

    // pH adjust: ramp τ = 5 s, decay τ = 10 s (caustic line drains more slowly).
    next.pHAdjustDoseRate = rampDoseRate(next.pHAdjustDoseRate, next.pHAdjustDoseSetpoint, next.pHAdjustPumpStatus.running, next.pHAdjustPumpStatus.fault, lagFactor(dt, 5), Math.exp(-dt / 10), 0, 10);

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
    // τ = 1500 s — AWWA flocculation basin HRT (20–30 min); dose changes take ~25 min to propagate
    next.flocBasinTurbidity = clamp(firstOrderLag(next.flocBasinTurbidity, targetFlocTurb, lagFactor(dt, 1500)), 0.5, 600);

    // Mixer speeds: spin-up τ = 5 s, coast-down τ = 5 s.
    next.rapidMixerSpeed = next.rapidMixerStatus.running
      ? clamp(firstOrderLag(next.rapidMixerSpeed, RAPID_MIX_TARGET_RPM, lagFactor(dt, 5)), 0, 200)
      : next.rapidMixerSpeed * Math.exp(-dt / 5);

    next.slowMixerSpeed = next.slowMixerStatus.running
      ? clamp(firstOrderLag(next.slowMixerSpeed, SLOW_MIX_TARGET_RPM, lagFactor(dt, 5)), 0, 100)
      : next.slowMixerSpeed * Math.exp(-dt / 5);

    return next;
  }
}
