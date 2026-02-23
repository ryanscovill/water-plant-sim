import { describe, it, expect, beforeEach } from 'vitest';
import { Historian } from '../../../client/src/simulation/Historian';
import { createInitialState } from '../../../client/src/simulation/ProcessState';

function makeState(tsOverride?: string) {
  const state = createInitialState();
  state.timestamp = tsOverride ?? new Date().toISOString();
  return state;
}

describe('Historian', () => {
  let historian: Historian;

  beforeEach(() => {
    historian = new Historian();
  });

  it('produces one point after a single record', () => {
    historian.record(makeState());
    const history = historian.getTagHistory('DIS-AIT-001', 3600);
    expect(history).toHaveLength(1);
  });

  it('maps DIS-AIT-001 to chlorineResidualPlant value', () => {
    const state = makeState();
    state.disinfection.chlorineResidualPlant = 2.42;
    historian.record(state);
    const history = historian.getTagHistory('DIS-AIT-001', 3600);
    expect(history[0].value).toBeCloseTo(2.42);
  });

  it('returns 0 (not throws) for unknown tag', () => {
    historian.record(makeState());
    const history = historian.getTagHistory('UNKNOWN-TAG', 3600);
    expect(history[0].value).toBe(0);
  });

  it('filters out points older than durationSeconds', () => {
    const old = new Date(Date.now() - 7200 * 1000).toISOString(); // 2h ago
    const recent = new Date().toISOString();
    historian.record(makeState(old));
    historian.record(makeState(recent));
    const history = historian.getTagHistory('DIS-AIT-001', 3600); // last 1h
    expect(history).toHaveLength(1);
    expect(history[0].timestamp).toBe(recent);
  });

  it('clear() empties the buffer', () => {
    historian.record(makeState());
    historian.record(makeState());
    historian.clear();
    expect(historian.getTagHistory('DIS-AIT-001', 3600)).toHaveLength(0);
  });

  it('getAvailableTags() returns expected tag list', () => {
    historian.record(makeState());
    const tags = historian.getAvailableTags();
    expect(tags).toContain('DIS-AIT-001');
    expect(tags).toContain('DIS-AIT-002');
    expect(tags).toContain('INT-FIT-001');
    expect(tags).toContain('FLT-AIT-001');
  });

  it('getAvailableTags() works before any records', () => {
    const tags = historian.getAvailableTags();
    expect(tags.length).toBeGreaterThan(0);
  });

  it('ring buffer records multiple points correctly', () => {
    const now = Date.now();
    const COUNT = 5;
    for (let i = 0; i < COUNT; i++) {
      const ts = new Date(now + i * 500).toISOString();
      historian.record(makeState(ts));
    }
    const history = historian.getTagHistory('DIS-AIT-001', 86400);
    expect(history).toHaveLength(COUNT);
  });
});
