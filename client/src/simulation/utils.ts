/** Clamp val to [min, max]. */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * First-order exponential lag: moves current toward target by `factor` each tick.
 * factor = 1 - exp(-dt/τ); for small factors use factor ≈ dt/τ.
 */
export function firstOrderLag(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

/**
 * Compute the correct first-order lag factor for a given dt and time constant τ.
 * Use this instead of a hardcoded factor so behavior is dt-independent.
 *
 * @param dt          simulated seconds elapsed this tick
 * @param tauSeconds  physical time constant in simulated seconds
 */
export function lagFactor(dt: number, tauSeconds: number): number {
  return 1 - Math.exp(-dt / tauSeconds);
}

/**
 * Accumulate run hours for a piece of equipment.
 * Only counts when running and not faulted.
 */
export function accumulateRunHours(
  runHours: number,
  running: boolean,
  fault: boolean,
  dt: number,
): number {
  return running && !fault ? runHours + dt / 3600 : runHours;
}

/**
 * Ramp a chemical dose rate toward setpoint when the pump is running,
 * or decay it exponentially when the pump is off/faulted.
 *
 * @param current     current dose rate (mg/L)
 * @param setpoint    target dose rate (mg/L)
 * @param running     whether the chemical pump is running
 * @param fault       whether the chemical pump is faulted
 * @param rampFactor  fraction of gap closed per tick (e.g. 0.1 → τ = 10 ticks)
 * @param decayFactor fraction remaining per tick when off (e.g. 0.9 or 0.95)
 * @param min         lower clamp bound
 * @param max         upper clamp bound
 */
export function rampDoseRate(
  current: number,
  setpoint: number,
  running: boolean,
  fault: boolean,
  rampFactor: number,
  decayFactor: number,
  min: number,
  max: number,
): number {
  const next = running && !fault
    ? current + (setpoint - current) * rampFactor
    : current * decayFactor;
  return clamp(next, min, max);
}
