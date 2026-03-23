import type { AerationState, PrimaryClarifierState, HeadworksState } from '../WWProcessState';
import { clamp, firstOrderLag, lagFactor, accumulateRunHours, rampDoseRate } from '../../utils';
import { AERATION_CONSTANTS } from '../wwConfig';

const C = AERATION_CONSTANTS;

export class AerationStage {
  update(
    state: AerationState,
    primary: PrimaryClarifierState,
    headworks: HeadworksState,
    dt: number,
  ): AerationState {
    const next: AerationState = {
      ...state,
      blower1: { ...state.blower1 },
      blower2: { ...state.blower2 },
      rasPump: { ...state.rasPump },
      wasPump: { ...state.wasPump },
    };

    // ── Run hours ───────────────────────────────────────────────────────────
    next.blower1.runHours = accumulateRunHours(next.blower1.runHours, next.blower1.running, next.blower1.fault, dt);
    next.blower2.runHours = accumulateRunHours(next.blower2.runHours, next.blower2.running, next.blower2.fault, dt);
    next.rasPump.runHours = accumulateRunHours(next.rasPump.runHours, next.rasPump.running, next.rasPump.fault, dt);
    next.wasPump.runHours = accumulateRunHours(next.wasPump.runHours, next.wasPump.running, next.wasPump.fault, dt);

    // ── Temperature (slow lag toward headworks temperature) ─────────────────
    next.temperature = firstOrderLag(next.temperature, headworks.influentTemperature, lagFactor(dt, 3600));

    // ── Airflow ─────────────────────────────────────────────────────────────
    const blower1Output = (next.blower1.running && !next.blower1.fault)
      ? (next.blower1.speed / 100) * C.BLOWER_CAPACITY_SCFM : 0;
    const blower2Output = (next.blower2.running && !next.blower2.fault)
      ? (next.blower2.speed / 100) * C.BLOWER_CAPACITY_SCFM : 0;
    const blowerOutput = blower1Output + blower2Output;

    // tau = 10 s for blower response
    next.airflowRate = clamp(
      firstOrderLag(next.airflowRate, blowerOutput, lagFactor(dt, 10)),
      0,
      C.BLOWER_CAPACITY_SCFM * 2,
    );

    // ── RAS/WAS flow control ────────────────────────────────────────────────
    next.rasFlow = rampDoseRate(
      next.rasFlow, next.rasSetpoint,
      next.rasPump.running, next.rasPump.fault,
      lagFactor(dt, 15), // ramp tau ~15s
      1 - lagFactor(dt, 30), // decay tau ~30s
      0, 10, // clamp: 0-10 MGD
    );

    next.wasFlow = rampDoseRate(
      next.wasFlow, next.wasSetpoint,
      next.wasPump.running, next.wasPump.fault,
      lagFactor(dt, 15),
      1 - lagFactor(dt, 30),
      0, 200, // clamp: 0-200 GPM
    );

    // ── Flow conversions ────────────────────────────────────────────────────
    const influentFlow_L_per_s = headworks.influentFlow * 3_785_000 / 86400;
    const wasFlow_L_per_s = next.wasFlow * 3.785 / 60;

    // ── BOD removal (Monod kinetics) ────────────────────────────────────────
    const tempFactorBOD = Math.pow(C.THETA_BOD, next.temperature - C.REF_TEMP);
    const monodBOD = next.aerationBasinBOD / (C.KS_BOD + next.aerationBasinBOD);
    const monodDO_BOD = next.dissolvedOxygen / (C.KO_BOD + next.dissolvedOxygen);
    const bodRatePerDay = C.MU_MAX_BOD * monodBOD * monodDO_BOD * tempFactorBOD;
    const bodConsumedPerSec = (bodRatePerDay / 86400) * next.mlvss;

    // Incoming BOD load per second
    const incomingBOD = (primary.primaryEffluentBOD * influentFlow_L_per_s) / C.BASIN_VOLUME_L;

    next.aerationBasinBOD = clamp(
      next.aerationBasinBOD + (incomingBOD - bodConsumedPerSec) * dt,
      0,
      1000,
    );

    // ── Nitrification (Monod kinetics) ──────────────────────────────────────
    const srtActive = next.srt >= C.MIN_SRT_FOR_NITRIFICATION ? 1 : 0;
    const tempFactorNH3 = Math.pow(C.THETA_NH3, next.temperature - C.REF_TEMP);
    const monodNH3 = next.aerationBasinNH3 / (C.KN_NH3 + next.aerationBasinNH3);
    const monodDO_NH3 = next.dissolvedOxygen / (C.KO_NH3 + next.dissolvedOxygen);
    const nh3RatePerDay = C.MU_MAX_NH3 * monodNH3 * monodDO_NH3 * tempFactorNH3;
    const nh3ConsumedPerSec = (nh3RatePerDay / 86400) * (next.mlvss / 1000) * srtActive;

    // Incoming NH3 load per second
    const incomingNH3 = (headworks.influentNH3 * influentFlow_L_per_s) / C.BASIN_VOLUME_L;

    next.aerationBasinNH3 = clamp(
      next.aerationBasinNH3 + (incomingNH3 - nh3ConsumedPerSec) * dt,
      0,
      100,
    );

    // NO3 produced = NH3 consumed (stoichiometric)
    next.aerationBasinNO3 += nh3ConsumedPerSec * dt;

    // ── Denitrification (simplified) ────────────────────────────────────────
    if (next.dissolvedOxygen < C.DENIT_DO_THRESHOLD) {
      const denitRate = (C.DENIT_RATE / 86400) * (next.mlvss / 1000);
      next.aerationBasinNO3 -= denitRate * dt;
    }
    next.aerationBasinNO3 = clamp(next.aerationBasinNO3, 0, 100);

    // ── Dissolved Oxygen balance ────────────────────────────────────────────
    // Self-limiting O2 transfer: supply slows as DO approaches saturation
    const supplyRate = (next.airflowRate / 6000)
      * (C.DO_SATURATION - next.dissolvedOxygen) / C.DO_SATURATION;

    // Oxygen demand from BOD removal + nitrification
    const demandRate = bodConsumedPerSec * 1.2 + nh3ConsumedPerSec * C.O2_PER_NH3;

    const rawDO = next.dissolvedOxygen + (supplyRate - demandRate) * dt;
    const clampedDO = clamp(rawDO, 0, C.DO_SATURATION);

    // Sensor response lag (tau = 300s)
    next.dissolvedOxygen = firstOrderLag(next.dissolvedOxygen, clampedDO, lagFactor(dt, 300));
    next.dissolvedOxygen = clamp(next.dissolvedOxygen, 0, C.DO_SATURATION);

    // ── MLSS dynamics ───────────────────────────────────────────────────────
    const growth = C.YIELD * bodConsumedPerSec; // mg VSS/L/s
    const decay = (C.KD / 86400) * next.mlvss;  // mg VSS/L/s
    const wasRemoval = wasFlow_L_per_s * next.mlss / C.BASIN_VOLUME_L; // mg/L/s

    next.mlss = clamp(
      next.mlss + ((growth - decay) / C.VSS_FRACTION - wasRemoval) * dt,
      100,
      10000,
    );
    next.mlvss = next.mlss * C.VSS_FRACTION;

    // ── SRT (Solids Retention Time) ─────────────────────────────────────────
    // SRT = BASIN_VOLUME_L / (wasFlow_L_per_day * RAS_CONCENTRATION_FACTOR)
    // RAS concentration factor ~2.0
    const wasFlow_L_per_day = next.wasFlow * 3.785 * 1440;
    const RAS_CONC_FACTOR = 2.0;
    if (wasFlow_L_per_day > 0) {
      next.srt = C.BASIN_VOLUME_L / (wasFlow_L_per_day * RAS_CONC_FACTOR);
    }
    // If WAS is off, SRT grows unbounded — cap at a reasonable max
    next.srt = clamp(next.srt, 0.5, 100);

    // ── Derived values ──────────────────────────────────────────────────────
    // F:M = (primaryEffluentBOD * influentFlow_MGD) / (mlvss * BASIN_VOLUME_MG)
    if (next.mlvss > 0 && C.BASIN_VOLUME_MG > 0) {
      next.foodToMassRatio = (primary.primaryEffluentBOD * headworks.influentFlow)
        / (next.mlvss * C.BASIN_VOLUME_MG);
    }

    // HRT = BASIN_VOLUME_MG / influentFlow_MGD * 24 (hours)
    if (headworks.influentFlow > 0) {
      next.hydraulicRetentionTime = (C.BASIN_VOLUME_MG / headworks.influentFlow) * 24;
    }

    // ── SVI (Sludge Volume Index) ───────────────────────────────────────────
    // Target SVI driven by F:M ratio and DO
    const sviTarget = 100
      + Math.max(0, (next.foodToMassRatio - 0.4) * 200)
      + Math.max(0, (1.5 - next.dissolvedOxygen) * 40);

    // Slow response (tau = 3600s)
    next.svi = clamp(
      firstOrderLag(next.svi, sviTarget, lagFactor(dt, 3600)),
      50,
      300,
    );

    return next;
  }
}
