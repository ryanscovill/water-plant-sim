import type { WWProcessState, Alarm } from './WWProcessState';
import { wwConfig } from './wwConfig';

interface TagValue {
  tag: string;
  value: number;
  description: string;
}

function getTagValues(state: WWProcessState): TagValue[] {
  return [
    // Headworks
    { tag: 'HW-FIT-001', value: state.headworks.influentFlow, description: 'Influent Flow' },
    { tag: 'HW-PDT-001', value: state.headworks.barScreenDiffPressure, description: 'Bar Screen DP' },
    // Primary
    { tag: 'PRI-LIT-001', value: state.primary.sludgeBlanketLevel, description: 'Primary Sludge Blanket' },
    // Aeration
    { tag: 'AER-AIT-001', value: state.aeration.dissolvedOxygen, description: 'Dissolved Oxygen' },
    { tag: 'AER-AIT-002', value: state.aeration.mlss, description: 'MLSS' },
    { tag: 'AER-AIT-003', value: state.aeration.svi, description: 'Sludge Volume Index' },
    // Secondary
    { tag: 'SEC-AIT-001', value: state.secondary.effluentTSS, description: 'Sec. Effluent TSS' },
    { tag: 'SEC-AIT-002', value: state.secondary.effluentBOD, description: 'Sec. Effluent BOD' },
    { tag: 'SEC-LIT-001', value: state.secondary.sludgeBlanketLevel, description: 'Sec. Sludge Blanket' },
    // Disinfection
    { tag: 'WDI-AIT-001', value: state.wwDisinfection.chlorineResidual, description: 'Chlorine Residual' },
    { tag: 'WDI-AIT-002', value: state.wwDisinfection.totalResidualChlorine, description: 'TRC After Dechlor' },
    { tag: 'WDI-AIT-003', value: state.wwDisinfection.effluentPH, description: 'Effluent pH' },
    { tag: 'WDI-AIT-004', value: state.wwDisinfection.effluentNH3, description: 'Effluent NH3' },
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

export class WWAlarmManager {
  private alarmHistory: Alarm[] = [];
  private thresholds: Record<string, { ll?: number; l?: number; h?: number; hh?: number }> =
    JSON.parse(JSON.stringify(wwConfig.alarmThresholds));

  setThresholds(thresholds: Record<string, { ll?: number; l?: number; h?: number; hh?: number }>): void {
    this.thresholds = thresholds;
  }

  evaluate(state: WWProcessState): { newAlarms: Alarm[]; clearedAlarms: Alarm[]; valueUpdates: { id: string; value: number }[] } {
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
            timestamp: state.timestamp,
          };
          newAlarms.push(alarm);
          this.alarmHistory.push({ ...alarm });
        } else if (check.active && existing && existing.active) {
          valueUpdates.push({ id: alarmId, value });
        } else if (!check.active && existing && existing.active) {
          clearedAlarms.push({ ...existing, active: false, clearedAt: state.timestamp });
          const histIdx = this.alarmHistory.findIndex(a => a.id === alarmId && a.active);
          if (histIdx >= 0) {
            this.alarmHistory[histIdx].active = false;
            this.alarmHistory[histIdx].clearedAt = state.timestamp;
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
