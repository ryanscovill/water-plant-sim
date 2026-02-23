import { describe, it, expect } from 'vitest';
import { clamp, firstOrderLag, accumulateRunHours, rampDoseRate } from '../utils';

describe('clamp', () => {
  it('returns value when within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps below min', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps above max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('handles degenerate min === max', () => {
    expect(clamp(7, 5, 5)).toBe(5);
  });

  it('handles negative bounds', () => {
    expect(clamp(-10, -20, -5)).toBe(-10);
    expect(clamp(0, -20, -5)).toBe(-5);
    expect(clamp(-25, -20, -5)).toBe(-20);
  });
});

describe('firstOrderLag', () => {
  it('returns current unchanged when factor is 0', () => {
    expect(firstOrderLag(3, 10, 0)).toBe(3);
  });

  it('jumps to target when factor is 1', () => {
    expect(firstOrderLag(3, 10, 1)).toBe(10);
  });

  it('moves partway toward target for factor 0.5', () => {
    expect(firstOrderLag(0, 10, 0.5)).toBe(5);
  });

  it('converges asymptotically — after many ticks gets close to target', () => {
    let val = 0;
    for (let i = 0; i < 100; i++) val = firstOrderLag(val, 10, 0.1);
    expect(val).toBeCloseTo(10, 1);
  });

  it('moves toward a lower target', () => {
    const result = firstOrderLag(10, 2, 0.2);
    expect(result).toBeLessThan(10);
    expect(result).toBeGreaterThan(2);
  });
});

describe('accumulateRunHours', () => {
  it('accumulates hours proportional to dt when running and not faulted', () => {
    const result = accumulateRunHours(0, true, false, 3600);
    expect(result).toBe(1); // 3600s / 3600 = 1 hour
  });

  it('does not accumulate when stopped', () => {
    expect(accumulateRunHours(5, false, false, 3600)).toBe(5);
  });

  it('does not accumulate when faulted', () => {
    expect(accumulateRunHours(5, true, true, 3600)).toBe(5);
  });

  it('is proportional to dt', () => {
    const result = accumulateRunHours(0, true, false, 1800);
    expect(result).toBeCloseTo(0.5, 6);
  });
});

describe('rampDoseRate', () => {
  it('ramps toward setpoint when running', () => {
    const result = rampDoseRate(0, 10, true, false, 0.1, 0.95, 0, 10);
    expect(result).toBeCloseTo(1, 5); // 0 + (10-0)*0.1
  });

  it('decays when pump is off', () => {
    const result = rampDoseRate(10, 5, false, false, 0.1, 0.9, 0, 10);
    expect(result).toBeCloseTo(9, 5); // 10 * 0.9
  });

  it('decays when pump is faulted', () => {
    const result = rampDoseRate(8, 5, true, true, 0.1, 0.9, 0, 10);
    expect(result).toBeCloseTo(7.2, 5); // 8 * 0.9
  });

  it('clamps to max', () => {
    const result = rampDoseRate(9.5, 15, true, false, 1.0, 0.95, 0, 10);
    expect(result).toBe(10);
  });

  it('clamps to min', () => {
    const result = rampDoseRate(0.1, 0, false, false, 0.1, 0.0, 0, 10);
    expect(result).toBe(0);
  });

  it('jumps to setpoint in one step when factor is 1', () => {
    const result = rampDoseRate(0, 7, true, false, 1.0, 0.95, 0, 10);
    expect(result).toBe(7);
  });
});
