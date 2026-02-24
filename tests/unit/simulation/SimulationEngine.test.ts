import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../../../client/src/simulation/SimulationEngine';

describe('SimulationEngine — simSpeed setpoint', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = new SimulationEngine();
  });

  it('defaults to 1x', () => {
    expect(engine.getState().simSpeed).toBe(1);
  });

  it('sets speed to 10x', () => {
    engine.applyControl('setpoint', { tagId: 'simSpeed', value: 10 });
    expect(engine.getState().simSpeed).toBe(10);
  });

  it('sets speed to 60x', () => {
    engine.applyControl('setpoint', { tagId: 'simSpeed', value: 60 });
    expect(engine.getState().simSpeed).toBe(60);
  });

  it('clamps above 60 to 60', () => {
    engine.applyControl('setpoint', { tagId: 'simSpeed', value: 999 });
    expect(engine.getState().simSpeed).toBe(60);
  });

  it('clamps below 0.5 to 0.5', () => {
    engine.applyControl('setpoint', { tagId: 'simSpeed', value: 0 });
    expect(engine.getState().simSpeed).toBe(0.5);
  });
});
