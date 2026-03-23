import type { WWProcessState } from './WWProcessState';
import { createInitialWWState } from './WWProcessState';
import { wwConfig } from './wwConfig';

interface HistorianPoint {
  timestamp: string;
  values: Record<string, number>;
}

function extractTagValues(state: WWProcessState): Record<string, number> {
  return {
    // Headworks
    'HW-FIT-001': state.headworks.influentFlow,
    'HW-PDT-001': state.headworks.barScreenDiffPressure,
    'HW-AIT-001': state.headworks.influentBOD,
    'HW-AIT-002': state.headworks.influentTSS,
    'HW-AIT-003': state.headworks.influentNH3,
    // Primary
    'PRI-AIT-001': state.primary.primaryEffluentBOD,
    'PRI-AIT-002': state.primary.primaryEffluentTSS,
    'PRI-LIT-001': state.primary.sludgeBlanketLevel,
    // Aeration
    'AER-AIT-001': state.aeration.dissolvedOxygen,
    'AER-AIT-002': state.aeration.mlss,
    'AER-AIT-003': state.aeration.svi,
    'AER-AIT-004': state.aeration.aerationBasinBOD,
    'AER-AIT-005': state.aeration.aerationBasinNH3,
    'AER-AIT-006': state.aeration.aerationBasinNO3,
    'AER-FIT-001': state.aeration.airflowRate,
    // Secondary
    'SEC-AIT-001': state.secondary.effluentTSS,
    'SEC-AIT-002': state.secondary.effluentBOD,
    'SEC-LIT-001': state.secondary.sludgeBlanketLevel,
    // Disinfection
    'WDI-AIT-001': state.wwDisinfection.chlorineResidual,
    'WDI-AIT-002': state.wwDisinfection.totalResidualChlorine,
    'WDI-AIT-003': state.wwDisinfection.effluentPH,
    'WDI-AIT-004': state.wwDisinfection.effluentNH3,
    'WDI-FIT-001': state.wwDisinfection.chlorineDoseRate,
    'WDI-FIT-002': state.wwDisinfection.effluentFlow,
  };
}

export class WWHistorian {
  private buffer: HistorianPoint[] = [];
  private maxPoints: number;

  constructor() {
    this.maxPoints = wwConfig.historian.maxPoints;
  }

  record(state: WWProcessState): void {
    const point: HistorianPoint = {
      timestamp: state.timestamp,
      values: extractTagValues(state),
    };
    this.buffer.push(point);
    if (this.buffer.length > this.maxPoints) {
      this.buffer.shift();
    }
  }

  getTagHistory(tag: string, durationSeconds: number): Array<{ timestamp: string; value: number }> {
    const latest = this.buffer.length > 0
      ? new Date(this.buffer[this.buffer.length - 1].timestamp).getTime()
      : Date.now();
    const cutoff = latest - durationSeconds * 1000;
    return this.buffer
      .filter((p) => new Date(p.timestamp).getTime() >= cutoff)
      .map((p) => ({ timestamp: p.timestamp, value: p.values[tag] ?? 0 }));
  }

  clear(): void {
    this.buffer = [];
  }

  getAvailableTags(): string[] {
    if (this.buffer.length === 0) return Object.keys(extractTagValues(createInitialWWState()));
    return Object.keys(this.buffer[0].values);
  }
}
