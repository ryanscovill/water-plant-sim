import { createInitialWWState } from './WWProcessState';
import type { WWProcessState, Alarm } from './WWProcessState';
import { WWAlarmManager } from './WWAlarmManager';
import { HeadworksStage } from './stages/HeadworksStage';
import { PrimaryClarifierStage } from './stages/PrimaryClarifierStage';
import { AerationStage } from './stages/AerationStage';
import { SecondaryClarifierStage } from './stages/SecondaryClarifierStage';
import { WWDisinfectionStage } from './stages/WWDisinfectionStage';
import { wwConfig } from './wwConfig';
import { WWHistorian } from './WWHistorian';

const STORAGE_KEY = 'scada_ww_state';
const STORAGE_VERSION = 1;

export class WWSimulationEngine {
  private state: WWProcessState;
  private alarmManager: WWAlarmManager;
  private headworksStage: HeadworksStage;
  private primaryStage: PrimaryClarifierStage;
  private aerationStage: AerationStage;
  private secondaryStage: SecondaryClarifierStage;
  private disinfectionStage: WWDisinfectionStage;
  public historian: WWHistorian;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private simulatedTime: number = Date.now();
  private simulationStartTime: number = this.simulatedTime;
  private listeners: Map<string, Set<(arg: unknown) => void>> = new Map();

  private loadSavedState(): WWProcessState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { version: number; state: WWProcessState };
      if (parsed.version !== STORAGE_VERSION) return null;
      return { ...parsed.state, alarms: [] };
    } catch {
      return null;
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, state: this.state }));
    } catch {
      // Ignore: localStorage may be full or unavailable
    }
  }

  constructor() {
    this.state = this.loadSavedState() ?? createInitialWWState();
    this.alarmManager = new WWAlarmManager();
    this.headworksStage = new HeadworksStage();
    this.primaryStage = new PrimaryClarifierStage();
    this.aerationStage = new AerationStage();
    this.secondaryStage = new SecondaryClarifierStage();
    this.disinfectionStage = new WWDisinfectionStage();
    this.historian = new WWHistorian();
  }

  on(event: string, fn: (arg: unknown) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  off(event: string, fn: (arg: unknown) => void): void {
    this.listeners.get(event)?.delete(fn);
  }

  private emit(event: string, arg?: unknown): void {
    this.listeners.get(event)?.forEach((fn) => fn(arg));
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), wwConfig.simulationInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause(): void {
    this.stop();
    this.state = { ...this.state, running: false };
    this.emit('state:update', this.state);
  }

  resume(): void {
    this.state = { ...this.state, running: true };
    this.start();
    this.emit('state:update', this.state);
  }

  private tick(): void {
    const dt = (wwConfig.simulationInterval / 1000) * this.state.simSpeed;
    this.simulatedTime += dt * 1000;

    const nextHW = this.headworksStage.update(this.state.headworks, dt);
    const nextPri = this.primaryStage.update(this.state.primary, nextHW, dt);
    const nextAer = this.aerationStage.update(this.state.aeration, nextPri, nextHW, dt);
    const nextSec = this.secondaryStage.update(this.state.secondary, nextAer, nextHW, dt);
    const nextDis = this.disinfectionStage.update(this.state.wwDisinfection, nextSec, nextAer, nextHW, dt);

    const preAlarmState: WWProcessState = {
      ...this.state,
      timestamp: new Date(this.simulatedTime).toISOString(),
      headworks: nextHW,
      primary: nextPri,
      aeration: nextAer,
      secondary: nextSec,
      wwDisinfection: nextDis,
    };

    const { newAlarms, clearedAlarms, valueUpdates } = this.alarmManager.evaluate(preAlarmState);

    let updatedAlarms = [...preAlarmState.alarms];
    for (const alarm of newAlarms) {
      updatedAlarms.push(alarm);
    }
    for (const cleared of clearedAlarms) {
      updatedAlarms = updatedAlarms.map((a) =>
        a.id === cleared.id ? { ...a, active: false, clearedAt: cleared.clearedAt } : a
      );
    }
    for (const update of valueUpdates) {
      updatedAlarms = updatedAlarms.map((a) =>
        a.id === update.id ? { ...a, value: update.value } : a
      );
    }
    updatedAlarms = updatedAlarms.filter(
      (a) =>
        a.active ||
        (a.clearedAt && this.simulatedTime - new Date(a.clearedAt).getTime() < 300000)
    );

    this.state = { ...preAlarmState, alarms: updatedAlarms };
    this.historian.record(this.state);

    this.emit('state:update', this.state);
    this.saveState();
    for (const alarm of newAlarms) {
      this.emit('alarm:new', alarm);
    }
    for (const alarm of clearedAlarms) {
      this.emit('alarm:cleared', alarm);
    }
  }

  getState(): WWProcessState {
    return this.state;
  }

  getSimulatedTime(): number {
    return this.simulatedTime;
  }

  getSimulationStartTime(): number {
    return this.simulationStartTime;
  }

  applyControl(type: string, payload: Record<string, unknown>): void {
    const description = this.buildEventDescription(type, payload);
    switch (type) {
      case 'pump': {
        const { pumpId, command, value } = payload as { pumpId: string; command: string; value?: number };
        this.state = this.applyPumpControl(this.state, pumpId, command, value);
        break;
      }
      case 'valve': {
        const { valveId, command, value } = payload as { valveId: string; command: string; value?: number };
        this.state = this.applyValveControl(this.state, valveId, command, value);
        break;
      }
      case 'setpoint': {
        const { tagId, value } = payload as { tagId: string; value: number };
        this.state = this.applySetpoint(this.state, tagId, value);
        break;
      }
      case 'clearScreen': {
        this.state = { ...this.state, headworks: this.headworksStage.clearScreen(this.state.headworks) };
        break;
      }
    }
    this.emit('operator:event', {
      id: crypto.randomUUID(),
      timestamp: new Date(this.simulatedTime).toISOString(),
      type,
      description,
    });
    this.emit('state:update', this.state);
    this.saveState();
  }

  private buildEventDescription(type: string, payload: Record<string, unknown>): string {
    const PUMP_NAMES: Record<string, string> = {
      influentPump1: 'Influent Pump 1 (P-501)',
      influentPump2: 'Influent Pump 2 (P-502)',
      gritCollector: 'Grit Collector',
      primarySludgePump: 'Primary Sludge Pump',
      scraper: 'Clarifier Scraper',
      blower1: 'Blower 1 (B-301)',
      blower2: 'Blower 2 (B-302)',
      rasPump: 'RAS Pump',
      wasPump: 'WAS Pump',
      secondaryScraper: 'Secondary Scraper',
      secondaryRake: 'Secondary Rake',
      chlorinePump: 'Chlorine Pump',
      dechlorinationPump: 'Dechlorination Pump',
    };
    const VALVE_NAMES: Record<string, string> = {
      influentValve: 'Influent Valve (XV-501)',
    };

    switch (type) {
      case 'pump': {
        const { pumpId, command, value } = payload as { pumpId: string; command: string; value?: number };
        const name = PUMP_NAMES[pumpId] ?? pumpId;
        if (command === 'start') return `${name}: stopped → running`;
        if (command === 'stop') return `${name}: running → stopped`;
        if (command === 'setSpeed') return `${name} speed: → ${Math.max(0, Math.min(100, value ?? 0))}%`;
        return `${name} ${command}`;
      }
      case 'valve': {
        const { valveId, command, value } = payload as { valveId: string; command: string; value?: number };
        const name = VALVE_NAMES[valveId] ?? valveId;
        if (command === 'open') return `${name}: → open`;
        if (command === 'close') return `${name}: → closed`;
        if (command === 'setPosition') return `${name} position: → ${Math.max(0, Math.min(100, value ?? 0))}%`;
        return `${name} ${command}`;
      }
      case 'setpoint': {
        const { tagId, value } = payload as { tagId: string; value: number };
        switch (tagId) {
          case 'simSpeed': return `Simulation speed: → ${value}×`;
          case 'doSetpoint': return `DO setpoint: → ${Number(value).toFixed(1)} mg/L`;
          case 'airflowSetpoint': return `Airflow setpoint: → ${Number(value).toFixed(0)} SCFM`;
          case 'rasSetpoint': return `RAS flow setpoint: → ${Number(value).toFixed(1)} MGD`;
          case 'wasSetpoint': return `WAS flow setpoint: → ${Number(value).toFixed(0)} GPM`;
          case 'sludgeWastingSetpoint': return `Primary sludge wasting: → ${Number(value).toFixed(0)} GPM`;
          case 'chlorineDoseSetpoint': return `Chlorine dose: → ${Number(value).toFixed(1)} mg/L`;
          case 'dechlorinationSetpoint': return `Dechlorination dose: → ${Number(value).toFixed(1)} mg/L`;
          case 'sourceBODBase': return `Source BOD: → ${Number(value).toFixed(0)} mg/L`;
          case 'sourceTSSBase': return `Source TSS: → ${Number(value).toFixed(0)} mg/L`;
          case 'sourceNH3Base': return `Source NH3: → ${Number(value).toFixed(1)} mg/L`;
          case 'sourceFlowBase': return `Source flow: → ${Number(value).toFixed(1)} MGD`;
          default: return `Setpoint ${tagId} → ${value}`;
        }
      }
      case 'clearScreen': return 'Bar screen cleaned';
      default: return type;
    }
  }

  private applyPumpControl(state: WWProcessState, pumpId: string, command: string, value?: number): WWProcessState {
    const next = { ...state };
    type PumpStatus = typeof state.headworks.influentPump1;
    const setPump = (pump: PumpStatus): PumpStatus => {
      switch (command) {
        case 'start': return { ...pump, running: true, fault: false, speed: 75 };
        case 'stop': return { ...pump, running: false, speed: 0 };
        case 'setSpeed': return { ...pump, speed: Math.max(0, Math.min(100, value ?? pump.speed)) };
        default: return pump;
      }
    };

    switch (pumpId) {
      case 'influentPump1':
        next.headworks = { ...state.headworks, influentPump1: setPump(state.headworks.influentPump1) }; break;
      case 'influentPump2':
        next.headworks = { ...state.headworks, influentPump2: setPump(state.headworks.influentPump2) }; break;
      case 'gritCollector':
        next.headworks = { ...state.headworks, gritCollectorStatus: setPump(state.headworks.gritCollectorStatus) }; break;
      case 'primarySludgePump':
        next.primary = { ...state.primary, primarySludgePump: setPump(state.primary.primarySludgePump) }; break;
      case 'scraper':
        next.primary = { ...state.primary, scraperStatus: setPump(state.primary.scraperStatus) }; break;
      case 'blower1':
        next.aeration = { ...state.aeration, blower1: setPump(state.aeration.blower1) }; break;
      case 'blower2':
        next.aeration = { ...state.aeration, blower2: setPump(state.aeration.blower2) }; break;
      case 'rasPump':
        next.aeration = { ...state.aeration, rasPump: setPump(state.aeration.rasPump) }; break;
      case 'wasPump':
        next.aeration = { ...state.aeration, wasPump: setPump(state.aeration.wasPump) }; break;
      case 'secondaryScraper':
        next.secondary = { ...state.secondary, scraperStatus: setPump(state.secondary.scraperStatus) }; break;
      case 'secondaryRake':
        next.secondary = { ...state.secondary, rakeStatus: setPump(state.secondary.rakeStatus) }; break;
      case 'chlorinePump':
        next.wwDisinfection = { ...state.wwDisinfection, chlorinePump: setPump(state.wwDisinfection.chlorinePump) }; break;
      case 'dechlorinationPump':
        next.wwDisinfection = { ...state.wwDisinfection, dechlorinationPump: setPump(state.wwDisinfection.dechlorinationPump) }; break;
    }
    return next;
  }

  private applyValveControl(state: WWProcessState, valveId: string, command: string, value?: number): WWProcessState {
    if (valveId !== 'influentValve') return state;
    const valve = state.headworks.influentValve;
    let newValve = { ...valve };
    switch (command) {
      case 'open': newValve = { ...valve, open: true, position: 100 }; break;
      case 'close': newValve = { ...valve, open: false, position: 0 }; break;
      case 'setPosition':
        newValve = { ...valve, position: Math.max(0, Math.min(100, value ?? valve.position)), open: (value ?? 0) > 0 };
        break;
    }
    return { ...state, headworks: { ...state.headworks, influentValve: newValve } };
  }

  private applySetpoint(state: WWProcessState, tagId: string, value: number): WWProcessState {
    switch (tagId) {
      case 'simSpeed':
        return { ...state, simSpeed: Math.max(0.5, Math.min(600, value)) };
      case 'doSetpoint':
        return { ...state, aeration: { ...state.aeration, doSetpoint: Math.max(0, Math.min(8, value)) } };
      case 'airflowSetpoint':
        return { ...state, aeration: { ...state.aeration, airflowSetpoint: Math.max(0, Math.min(6000, value)) } };
      case 'rasSetpoint':
        return { ...state, aeration: { ...state.aeration, rasSetpoint: Math.max(0, Math.min(10, value)) } };
      case 'wasSetpoint':
        return { ...state, aeration: { ...state.aeration, wasSetpoint: Math.max(0, Math.min(100, value)) } };
      case 'sludgeWastingSetpoint':
        return { ...state, primary: { ...state.primary, sludgeWastingSetpoint: Math.max(0, Math.min(200, value)) } };
      case 'chlorineDoseSetpoint':
        return { ...state, wwDisinfection: { ...state.wwDisinfection, chlorineDoseSetpoint: Math.max(0, Math.min(15, value)) } };
      case 'dechlorinationSetpoint':
        return { ...state, wwDisinfection: { ...state.wwDisinfection, dechlorinationSetpoint: Math.max(0, Math.min(10, value)) } };
      case 'sourceBODBase':
        return { ...state, headworks: { ...state.headworks, sourceBODBase: Math.max(50, Math.min(500, value)) } };
      case 'sourceTSSBase':
        return { ...state, headworks: { ...state.headworks, sourceTSSBase: Math.max(50, Math.min(600, value)) } };
      case 'sourceNH3Base':
        return { ...state, headworks: { ...state.headworks, sourceNH3Base: Math.max(5, Math.min(80, value)) } };
      case 'sourceFlowBase':
        return { ...state, headworks: { ...state.headworks, sourceFlowBase: Math.max(1, Math.min(15, value)) } };
      default:
        return state;
    }
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = createInitialWWState();
    this.alarmManager = new WWAlarmManager();
    this.historian.clear();
    this.simulatedTime = Date.now();
    this.simulationStartTime = this.simulatedTime;
    this.emit('simulation:reset');
    this.emit('state:update', this.state);
  }

  getAlarmHistory(): Alarm[] {
    return this.alarmManager.getHistory();
  }

  setAlarmThresholds(thresholds: Record<string, { ll?: number; l?: number; h?: number; hh?: number }>): void {
    this.alarmManager.setThresholds(thresholds);
  }
}
