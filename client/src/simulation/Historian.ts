import type { ProcessState } from './ProcessState';
import { createInitialState } from './ProcessState';
import { config } from './config';

interface HistorianPoint {
  timestamp: string;
  values: Record<string, number>;
}

function extractTagValues(state: ProcessState): Record<string, number> {
  return {
    'INT-FIT-001': state.intake.rawWaterFlow,
    'INT-AIT-001': state.intake.rawTurbidity,
    'INT-PDT-001': state.intake.screenDiffPressure,
    'INT-LIT-001': state.intake.rawWaterLevel,
    'COG-AIT-001': state.coagulation.flocBasinTurbidity,
    'COG-FIT-001': state.coagulation.alumDoseRate,
    'SED-AIT-001': state.sedimentation.clarifierTurbidity,
    'SED-LIT-001': state.sedimentation.sludgeBlanketLevel,
    'FLT-PDT-001': state.sedimentation.filterHeadLoss,
    'FLT-AIT-001': state.sedimentation.filterEffluentTurbidity,
    'FLT-RUN-001': state.sedimentation.filterRunTime,
    'DIS-AIT-001': state.disinfection.chlorineResidualPlant,
    'DIS-AIT-002': state.disinfection.chlorineResidualDist,
    'DIS-AIT-003': state.disinfection.finishedWaterPH,
    'DIS-LIT-001': state.disinfection.clearwellLevel,
    'DIS-FIT-001': state.disinfection.chlorineDoseRate,
  };
}

export class Historian {
  private buffer: HistorianPoint[] = [];
  private maxPoints: number;

  constructor() {
    this.maxPoints = config.historian.maxPoints;
  }

  record(state: ProcessState): void {
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
    if (this.buffer.length === 0) return Object.keys(extractTagValues(createInitialState()));
    return Object.keys(this.buffer[0].values);
  }
}
