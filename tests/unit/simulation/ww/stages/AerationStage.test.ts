import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialWWState } from '../../../../../client/src/simulation/ww/WWProcessState';
import type { AerationState } from '../../../../../client/src/simulation/ww/WWProcessState';
import type { PrimaryClarifierState, HeadworksState } from '../../../../../client/src/simulation/ww/WWProcessState';
import { AerationStage } from '../../../../../client/src/simulation/ww/stages/AerationStage';
import { AERATION_CONSTANTS } from '../../../../../client/src/simulation/ww/wwConfig';

function baseState() {
  const s = createInitialWWState();
  return {
    aeration: { ...s.aeration },
    primary: { ...s.primary },
    headworks: { ...s.headworks },
  };
}

function runTicks(
  stage: AerationStage,
  aeration: AerationState,
  primary: PrimaryClarifierState,
  headworks: HeadworksState,
  ticks: number,
  dt = 0.5,
): AerationState {
  let s = aeration;
  for (let i = 0; i < ticks; i++) s = stage.update(s, primary, headworks, dt);
  return s;
}

describe('AerationStage', () => {
  let stage: AerationStage;

  beforeEach(() => {
    stage = new AerationStage();
  });

  // ── Dissolved Oxygen ──────────────────────────────────────────────────────

  describe('dissolved oxygen', () => {
    it('DO increases when blowers are running and demand is low', () => {
      const { aeration, primary, headworks } = baseState();
      // Start with low DO, running blower, low BOD demand
      aeration.dissolvedOxygen = 0.5;
      aeration.blower1 = { ...aeration.blower1, running: true, fault: false, speed: 80 };
      aeration.blower2 = { ...aeration.blower2, running: false };
      aeration.airflowRate = 2400; // Already flowing
      aeration.aerationBasinBOD = 1; // Very low BOD -> low demand
      aeration.aerationBasinNH3 = 0.1; // Very low NH3 -> low demand

      const result = runTicks(stage, aeration, primary, headworks, 200);
      expect(result.dissolvedOxygen).toBeGreaterThan(0.5);
    });

    it('DO decreases toward 0 when both blowers are off', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.dissolvedOxygen = 4.0;
      aeration.blower1 = { ...aeration.blower1, running: false, speed: 0 };
      aeration.blower2 = { ...aeration.blower2, running: false, speed: 0 };
      aeration.airflowRate = 0;
      // Maintain some BOD/NH3 so there is oxygen demand
      aeration.aerationBasinBOD = 20;
      aeration.aerationBasinNH3 = 5;

      const result = runTicks(stage, aeration, primary, headworks, 400);
      expect(result.dissolvedOxygen).toBeLessThan(4.0);
    });

    it('DO clamps at DO_SATURATION (8.0)', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.dissolvedOxygen = 7.9;
      // Both blowers at full blast, no demand
      aeration.blower1 = { ...aeration.blower1, running: true, fault: false, speed: 100 };
      aeration.blower2 = { ...aeration.blower2, running: true, fault: false, speed: 100 };
      aeration.airflowRate = 6000;
      aeration.aerationBasinBOD = 0;
      aeration.aerationBasinNH3 = 0;
      aeration.mlss = 100; // Minimal biomass -> minimal decay demand

      const result = runTicks(stage, aeration, primary, headworks, 2000);
      expect(result.dissolvedOxygen).toBeLessThanOrEqual(AERATION_CONSTANTS.DO_SATURATION);
    });

    it('DO clamps at 0', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.dissolvedOxygen = 0.1;
      aeration.blower1 = { ...aeration.blower1, running: false, speed: 0 };
      aeration.blower2 = { ...aeration.blower2, running: false, speed: 0 };
      aeration.airflowRate = 0;
      // High demand
      aeration.aerationBasinBOD = 100;
      aeration.aerationBasinNH3 = 20;
      aeration.mlss = 5000;
      aeration.mlvss = 3750;

      const result = runTicks(stage, aeration, primary, headworks, 500);
      expect(result.dissolvedOxygen).toBeGreaterThanOrEqual(0);
    });
  });

  // ── BOD Removal ───────────────────────────────────────────────────────────

  describe('BOD removal', () => {
    it('BOD decreases over time with adequate MLSS and DO', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.aerationBasinBOD = 50;
      aeration.dissolvedOxygen = 3.0;
      aeration.mlss = 3000;
      aeration.mlvss = 2250;
      // Minimize incoming BOD to isolate removal
      primary.primaryEffluentBOD = 0;
      headworks.influentFlow = 0;

      const result = runTicks(stage, aeration, primary, headworks, 200);
      expect(result.aerationBasinBOD).toBeLessThan(50);
    });

    it('BOD increases when primary effluent BOD is very high', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.aerationBasinBOD = 5;
      aeration.dissolvedOxygen = 2.0;
      aeration.mlss = 3000;
      aeration.mlvss = 2250;
      // Very high incoming BOD load
      primary.primaryEffluentBOD = 500;
      headworks.influentFlow = 10; // 10 MGD

      const result = runTicks(stage, aeration, primary, headworks, 200);
      expect(result.aerationBasinBOD).toBeGreaterThan(5);
    });
  });

  // ── Nitrification ─────────────────────────────────────────────────────────

  describe('nitrification', () => {
    it('NH3 decreases with adequate DO and SRT (nitrification active)', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.aerationBasinNH3 = 10;
      aeration.dissolvedOxygen = 3.0;
      aeration.srt = 10; // Well above MIN_SRT_FOR_NITRIFICATION (5)
      aeration.mlss = 3000;
      aeration.mlvss = 2250;
      // Minimize incoming NH3
      headworks.influentNH3 = 0;
      headworks.influentFlow = 0;

      const result = runTicks(stage, aeration, primary, headworks, 200);
      expect(result.aerationBasinNH3).toBeLessThan(10);
    });

    it('NH3 does NOT decrease when DO is very low (<0.5)', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.aerationBasinNH3 = 10;
      aeration.dissolvedOxygen = 0.1; // Very low DO
      aeration.srt = 15;
      aeration.mlss = 3000;
      aeration.mlvss = 2250;
      // No incoming NH3
      headworks.influentNH3 = 0;
      headworks.influentFlow = 0;
      // Keep blowers off so DO stays low
      aeration.blower1 = { ...aeration.blower1, running: false, speed: 0 };
      aeration.blower2 = { ...aeration.blower2, running: false, speed: 0 };
      aeration.airflowRate = 0;
      // Keep BOD low so what little DO there is gets consumed quickly
      aeration.aerationBasinBOD = 0;

      const result = runTicks(stage, aeration, primary, headworks, 200);
      // With DO=0.1, Monod term is 0.1 / (0.5 + 0.1) = 0.167 — still some removal.
      // But the DO itself is consumed, dropping to near 0, making the Monod term vanish.
      // With no supply and some baseline decay, DO should drop to 0 quickly.
      // NH3 should remain approximately unchanged (no significant removal).
      expect(result.aerationBasinNH3).toBeCloseTo(10, 0);
    });

    it('NO3 increases when nitrification is active', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.aerationBasinNH3 = 15;
      aeration.aerationBasinNO3 = 5;
      aeration.dissolvedOxygen = 3.0;
      aeration.srt = 10;
      aeration.mlss = 3000;
      aeration.mlvss = 2250;
      // Keep DO high with blowers
      aeration.blower1 = { ...aeration.blower1, running: true, fault: false, speed: 80 };
      aeration.airflowRate = 2400;
      // No incoming flow to muddy the picture
      headworks.influentFlow = 0;
      headworks.influentNH3 = 0;
      primary.primaryEffluentBOD = 0;

      const result = runTicks(stage, aeration, primary, headworks, 200);
      expect(result.aerationBasinNO3).toBeGreaterThan(5);
    });
  });

  // ── Denitrification ───────────────────────────────────────────────────────

  describe('denitrification', () => {
    it('NO3 decreases (denitrification) when DO < 0.5', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.aerationBasinNO3 = 20;
      aeration.dissolvedOxygen = 0.1;
      aeration.mlss = 3000;
      aeration.mlvss = 2250;
      // Blowers off to keep DO low
      aeration.blower1 = { ...aeration.blower1, running: false, speed: 0 };
      aeration.blower2 = { ...aeration.blower2, running: false, speed: 0 };
      aeration.airflowRate = 0;
      // No incoming NO3 or NH3
      headworks.influentFlow = 0;
      headworks.influentNH3 = 0;
      aeration.aerationBasinNH3 = 0;
      aeration.aerationBasinBOD = 0;

      const result = runTicks(stage, aeration, primary, headworks, 200);
      expect(result.aerationBasinNO3).toBeLessThan(20);
    });
  });

  // ── MLSS Dynamics ─────────────────────────────────────────────────────────

  describe('MLSS dynamics', () => {
    it('MLSS increases when growth exceeds wasting', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.mlss = 2000;
      aeration.mlvss = 1500;
      aeration.aerationBasinBOD = 80; // High BOD = high growth
      aeration.dissolvedOxygen = 3.0;
      // WAS pump off -> no wasting
      aeration.wasPump = { ...aeration.wasPump, running: false, speed: 0 };
      aeration.wasFlow = 0;

      const result = runTicks(stage, aeration, primary, headworks, 200);
      expect(result.mlss).toBeGreaterThan(2000);
    });

    it('MLSS decreases when WAS pump is running at high rate', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.mlss = 4000;
      aeration.mlvss = 3000;
      aeration.aerationBasinBOD = 2; // Low BOD = minimal growth
      aeration.dissolvedOxygen = 2.0;
      // High WAS rate
      aeration.wasPump = { ...aeration.wasPump, running: true, fault: false, speed: 100 };
      aeration.wasFlow = 100; // 100 GPM — very high
      aeration.wasSetpoint = 100;
      // Reduce incoming load
      primary.primaryEffluentBOD = 10;
      headworks.influentFlow = 2;

      const result = runTicks(stage, aeration, primary, headworks, 400);
      expect(result.mlss).toBeLessThan(4000);
    });

    it('MLVSS tracks MLSS * VSS_FRACTION', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.mlss = 3000;

      const result = runTicks(stage, aeration, primary, headworks, 10);
      expect(result.mlvss).toBeCloseTo(result.mlss * AERATION_CONSTANTS.VSS_FRACTION, 1);
    });
  });

  // ── Derived Values ────────────────────────────────────────────────────────

  describe('derived values', () => {
    it('F:M ratio calculated correctly', () => {
      const { aeration, primary, headworks } = baseState();
      // F:M = (primaryEffluentBOD * influentFlow) / (mlvss * BASIN_VOLUME_MG)
      primary.primaryEffluentBOD = 150;
      headworks.influentFlow = 8.0;
      aeration.mlss = 3000;
      aeration.mlvss = 2250;

      const result = stage.update(aeration, primary, headworks, 0.5);
      const expectedFM = (150 * 8.0) / (2250 * AERATION_CONSTANTS.BASIN_VOLUME_MG);
      // F:M should be close to expected (lag may shift it slightly from the exact value)
      expect(result.foodToMassRatio).toBeCloseTo(expectedFM, 1);
    });

    it('HRT calculated correctly', () => {
      const { aeration, primary, headworks } = baseState();
      headworks.influentFlow = 4.0; // 4 MGD
      // HRT = BASIN_VOLUME_MG / influentFlow * 24 hours
      // = 1.0 / 4.0 * 24 = 6 hours

      const result = stage.update(aeration, primary, headworks, 0.5);
      const expectedHRT = (AERATION_CONSTANTS.BASIN_VOLUME_MG / 4.0) * 24;
      expect(result.hydraulicRetentionTime).toBeCloseTo(expectedHRT, 1);
    });
  });

  // ── Airflow & Blowers ─────────────────────────────────────────────────────

  describe('airflow and blowers', () => {
    it('blower airflow converges toward blower output', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.airflowRate = 0;
      aeration.blower1 = { ...aeration.blower1, running: true, fault: false, speed: 50 };
      aeration.blower2 = { ...aeration.blower2, running: false };
      // Target = 50% of 3000 = 1500 SCFM
      const target = 0.5 * AERATION_CONSTANTS.BLOWER_CAPACITY_SCFM;

      const result = runTicks(stage, aeration, primary, headworks, 200);
      // After 200 ticks at dt=0.5 (100s), with tau=10s, should be very close
      expect(result.airflowRate).toBeCloseTo(target, -1); // within ~10 SCFM
    });

    it('run hours accumulate for blowers', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.blower1 = { ...aeration.blower1, running: true, fault: false, runHours: 0 };
      aeration.blower2 = { ...aeration.blower2, running: false, fault: false, runHours: 0 };

      // 1 tick at dt = 3600s = 1 simulated hour
      const result = stage.update(aeration, primary, headworks, 3600);
      expect(result.blower1.runHours).toBeCloseTo(1, 5);
      expect(result.blower2.runHours).toBe(0);
    });

    it('faulted blower contributes no airflow', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.airflowRate = 0;
      aeration.blower1 = { ...aeration.blower1, running: true, fault: true, speed: 100 };
      aeration.blower2 = { ...aeration.blower2, running: false };

      const result = runTicks(stage, aeration, primary, headworks, 200);
      // Should converge toward 0 since the only blower is faulted
      expect(result.airflowRate).toBeCloseTo(0, 0);
    });
  });

  // ── RAS/WAS Flow Control ──────────────────────────────────────────────────

  describe('RAS/WAS flow control', () => {
    it('RAS flow ramps toward setpoint when pump is running', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.rasFlow = 0;
      aeration.rasSetpoint = 4.0;
      aeration.rasPump = { ...aeration.rasPump, running: true, fault: false, speed: 60 };

      const result = runTicks(stage, aeration, primary, headworks, 200);
      expect(result.rasFlow).toBeGreaterThan(0);
    });

    it('WAS flow ramps toward setpoint when pump is running', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.wasFlow = 0;
      aeration.wasSetpoint = 20;
      aeration.wasPump = { ...aeration.wasPump, running: true, fault: false, speed: 40 };

      const result = runTicks(stage, aeration, primary, headworks, 200);
      expect(result.wasFlow).toBeGreaterThan(0);
    });

    it('WAS flow decays when pump is off', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.wasFlow = 20;
      aeration.wasSetpoint = 20;
      aeration.wasPump = { ...aeration.wasPump, running: false, speed: 0 };

      const result = runTicks(stage, aeration, primary, headworks, 200);
      expect(result.wasFlow).toBeLessThan(20);
    });
  });

  // ── SVI ───────────────────────────────────────────────────────────────────

  describe('SVI', () => {
    it('SVI increases when F:M is high (poor settling)', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.svi = 100;
      aeration.mlss = 1500;
      aeration.mlvss = 1125;
      aeration.dissolvedOxygen = 2.0;
      // High F:M scenario
      primary.primaryEffluentBOD = 400;
      headworks.influentFlow = 10;

      const result = runTicks(stage, aeration, primary, headworks, 2000);
      expect(result.svi).toBeGreaterThan(100);
    });

    it('SVI clamps between 50 and 300', () => {
      const { aeration, primary, headworks } = baseState();
      aeration.svi = 290;
      aeration.mlss = 500;
      aeration.mlvss = 375;
      aeration.dissolvedOxygen = 0.2;
      // Extreme conditions to push SVI high
      primary.primaryEffluentBOD = 500;
      headworks.influentFlow = 12;

      const result = runTicks(stage, aeration, primary, headworks, 5000);
      expect(result.svi).toBeLessThanOrEqual(300);
      expect(result.svi).toBeGreaterThanOrEqual(50);
    });
  });

  // ── Temperature effects ───────────────────────────────────────────────────

  describe('temperature', () => {
    it('temperature tracks headworks influent temperature', () => {
      const { aeration, primary, headworks } = baseState();
      headworks.influentTemperature = 25;
      aeration.temperature = 15;

      const result = runTicks(stage, aeration, primary, headworks, 2000);
      // Should move toward headworks temperature
      expect(result.temperature).toBeGreaterThan(15);
    });
  });
});
