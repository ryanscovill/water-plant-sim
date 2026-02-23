import type { DisinfectionState, SedimentationState, CoagulationState } from '../ProcessState';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export class DisinfectionStage {
  update(dis: DisinfectionState, sed: SedimentationState, dt: number, coag?: CoagulationState): DisinfectionState {
    const next = { ...dis };
    next.chlorinePumpStatus = { ...dis.chlorinePumpStatus };
    next.fluoridePumpStatus = { ...dis.fluoridePumpStatus };
    next.uvSystemStatus = { ...dis.uvSystemStatus };

    if (next.chlorinePumpStatus.running && !next.chlorinePumpStatus.fault) {
      next.chlorinePumpStatus.runHours += dt / 3600;
    }
    if (next.fluoridePumpStatus.running && !next.fluoridePumpStatus.fault) {
      next.fluoridePumpStatus.runHours += dt / 3600;
    }
    if (next.uvSystemStatus.running && !next.uvSystemStatus.fault) {
      next.uvSystemStatus.runHours += dt / 3600;
    }

    if (next.chlorinePumpStatus.running && !next.chlorinePumpStatus.fault) {
      next.chlorineDoseRate += (next.chlorineDoseSetpoint - next.chlorineDoseRate) * 0.1;
    } else {
      next.chlorineDoseRate *= 0.95;
    }
    next.chlorineDoseRate = clamp(next.chlorineDoseRate, 0, 10);

    const targetClResidual = next.chlorineDoseRate * 0.85 - sed.filterEffluentTurbidity * 0.1;
    next.chlorineResidualPlant += (targetClResidual - next.chlorineResidualPlant) * 0.05;
    next.chlorineResidualPlant = clamp(next.chlorineResidualPlant, 0, 5);

    const targetDistResidual = next.chlorineResidualPlant * Math.exp(-0.05 * 0.5);
    next.chlorineResidualDist += (targetDistResidual - next.chlorineResidualDist) * 0.03;
    next.chlorineResidualDist = clamp(next.chlorineResidualDist, 0, 4);

    if (next.fluoridePumpStatus.running && !next.fluoridePumpStatus.fault) {
      next.fluorideDoseRate += (next.fluorideDoseSetpoint - next.fluorideDoseRate) * 0.1;
    } else {
      next.fluorideDoseRate *= 0.95;
    }
    next.fluorideDoseRate = clamp(next.fluorideDoseRate, 0, 2);
    const targetFluoride = next.fluorideDoseRate * 0.9;
    next.fluorideResidual += (targetFluoride - next.fluorideResidual) * 0.05;
    next.fluorideResidual = clamp(next.fluorideResidual, 0, 2);

    const targetPH = 7.0 + (coag?.pHAdjustDoseRate ?? 2.0) * 0.01;
    next.finishedWaterPH += (targetPH - next.finishedWaterPH) * 0.02;
    next.finishedWaterPH = clamp(next.finishedWaterPH, 6.0, 9.0);

    const inflow = sed.backwashInProgress ? 0 : 0.02;
    const outflow = 0.015;
    next.clearwellLevel += (inflow - outflow) * dt;
    next.clearwellLevel = clamp(next.clearwellLevel, 0, 20);

    return next;
  }
}
