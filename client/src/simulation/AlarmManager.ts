import type { ProcessState, Alarm } from './ProcessState';
import { config } from './config';

interface TagValue {
  tag: string;
  value: number;
  description: string;
}

function getTagValues(state: ProcessState): TagValue[] {
  return [
    { tag: 'INT-FIT-001', value: state.intake.rawWaterFlow, description: 'Raw Water Flow' },
    { tag: 'INT-AIT-001', value: state.intake.rawTurbidity, description: 'Raw Turbidity' },
    { tag: 'INT-PDT-001', value: state.intake.screenDiffPressure, description: 'Screen Diff Pressure' },
    { tag: 'COG-AIT-001', value: state.coagulation.flocBasinTurbidity, description: 'Floc Basin Turbidity' },
    { tag: 'SED-AIT-001', value: state.sedimentation.clarifierTurbidity, description: 'Clarifier Turbidity' },
    { tag: 'SED-LIT-001', value: state.sedimentation.sludgeBlanketLevel, description: 'Sludge Blanket Level' },
    { tag: 'FLT-PDT-001', value: state.sedimentation.filterHeadLoss, description: 'Filter Head Loss' },
    { tag: 'FLT-AIT-001', value: state.sedimentation.filterEffluentTurbidity, description: 'Filter Effluent Turbidity' },
    { tag: 'DIS-AIT-001', value: state.disinfection.chlorineResidualPlant, description: 'Plant Cl2 Residual' },
    { tag: 'DIS-AIT-002', value: state.disinfection.chlorineResidualDist, description: 'Dist Cl2 Residual' },
    { tag: 'DIS-AIT-003', value: state.disinfection.finishedWaterPH, description: 'Finished Water pH' },
  ];
}

function getPriority(condition: 'HH' | 'H' | 'L' | 'LL'): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  switch (condition) {
    case 'HH': return 'CRITICAL';
    case 'LL': return 'CRITICAL';
    case 'H': return 'HIGH';
    case 'L': return 'MEDIUM';
  }
}

export class AlarmManager {
  private alarmHistory: Alarm[] = [];
  private thresholds: Record<string, { ll?: number; l?: number; h?: number; hh?: number }> =
    JSON.parse(JSON.stringify(config.alarmThresholds));

  setThresholds(thresholds: Record<string, { ll?: number; l?: number; h?: number; hh?: number }>): void {
    this.thresholds = thresholds;
  }

  evaluate(state: ProcessState): { newAlarms: Alarm[]; clearedAlarms: Alarm[]; valueUpdates: { id: string; value: number }[] } {
    const tagValues = getTagValues(state);
    const newAlarms: Alarm[] = [];
    const clearedAlarms: Alarm[] = [];
    const valueUpdates: { id: string; value: number }[] = [];

    for (const { tag, value, description } of tagValues) {
      const thresholds = this.thresholds[tag];
      if (!thresholds) continue;

      const checks: Array<{ condition: 'HH' | 'H' | 'L' | 'LL'; setpoint: number; active: boolean }> = [];

      if (thresholds.hh !== undefined) checks.push({ condition: 'HH', setpoint: thresholds.hh, active: value >= thresholds.hh });
      if (thresholds.h !== undefined) checks.push({ condition: 'H', setpoint: thresholds.h, active: value >= thresholds.h && (thresholds.hh === undefined || value < thresholds.hh) });
      if (thresholds.l !== undefined) checks.push({ condition: 'L', setpoint: thresholds.l, active: value <= thresholds.l && (thresholds.ll === undefined || value > thresholds.ll) });
      if (thresholds.ll !== undefined) checks.push({ condition: 'LL', setpoint: thresholds.ll, active: value <= thresholds.ll });

      for (const check of checks) {
        const alarmId = `${tag}-${check.condition}`;
        const existing = state.alarms.find(a => a.id === alarmId);

        if (check.active && !existing) {
          const alarm: Alarm = {
            id: alarmId,
            tag,
            description: `${description} ${check.condition}`,
            priority: getPriority(check.condition),
            value,
            setpoint: check.setpoint,
            condition: check.condition,
            active: true,
            acknowledged: false,
            timestamp: new Date().toISOString(),
          };
          newAlarms.push(alarm);
          this.alarmHistory.push({ ...alarm });
        } else if (check.active && existing && existing.active) {
          valueUpdates.push({ id: alarmId, value });
        } else if (!check.active && existing && existing.active) {
          clearedAlarms.push({ ...existing, active: false, clearedAt: new Date().toISOString() });
          const histIdx = this.alarmHistory.findIndex(a => a.id === alarmId && a.active);
          if (histIdx >= 0) {
            this.alarmHistory[histIdx].active = false;
            this.alarmHistory[histIdx].clearedAt = new Date().toISOString();
          }
        }
      }
    }

    return { newAlarms, clearedAlarms, valueUpdates };
  }

  getHistory(): Alarm[] {
    return [...this.alarmHistory].reverse().slice(0, 500);
  }
}
