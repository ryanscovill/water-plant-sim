import { createInitialState } from './ProcessState';
import type { ProcessState, Alarm } from './ProcessState';
import { AlarmManager } from './AlarmManager';
import { IntakeStage } from './stages/IntakeStage';
import { CoagulationStage } from './stages/CoagulationStage';
import { SedimentationStage } from './stages/SedimentationStage';
import { DisinfectionStage } from './stages/DisinfectionStage';
import { config } from './config';
import { Historian } from './Historian';
import { ScenarioEngine } from './ScenarioEngine';

export class SimulationEngine {
  private state: ProcessState;
  private alarmManager: AlarmManager;
  private intakeStage: IntakeStage;
  private coagStage: CoagulationStage;
  private sedStage: SedimentationStage;
  private disStage: DisinfectionStage;
  public historian: Historian;
  public scenarioEngine: ScenarioEngine;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private simulatedTime: number = Date.now();
  private listeners: Map<string, Set<(arg: unknown) => void>> = new Map();

  constructor() {
    this.state = createInitialState();
    this.alarmManager = new AlarmManager();
    this.intakeStage = new IntakeStage();
    this.coagStage = new CoagulationStage();
    this.sedStage = new SedimentationStage();
    this.disStage = new DisinfectionStage();
    this.historian = new Historian();
    this.scenarioEngine = new ScenarioEngine();
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
    this.intervalId = setInterval(() => this.tick(), config.simulationInterval);
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
    const dt = (config.simulationInterval / 1000) * this.state.simSpeed;
    this.simulatedTime += dt * 1000;

    const nextIntake = this.intakeStage.update(this.state.intake, dt);
    const nextCoag = this.coagStage.update(this.state.coagulation, nextIntake, dt);
    const wasBackwashing = this.state.sedimentation.backwashInProgress;
    const nextSed = this.sedStage.update(this.state.sedimentation, nextCoag, dt);
    const backwashJustEnded = wasBackwashing && !nextSed.backwashInProgress;
    const nextDis = this.disStage.update(this.state.disinfection, nextSed, dt, nextCoag, nextIntake);

    const preAlarmState: ProcessState = {
      ...this.state,
      timestamp: new Date(this.simulatedTime).toISOString(),
      intake: nextIntake,
      coagulation: nextCoag,
      sedimentation: nextSed,
      disinfection: nextDis,
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

    this.scenarioEngine.tick(this, this.simulatedTime);

    if (backwashJustEnded) {
      this.emit('simulation:event', {
        id: crypto.randomUUID(),
        timestamp: new Date(this.simulatedTime).toISOString(),
        type: 'backwash',
        description: 'Filter backwash completed',
      });
    }

    this.emit('state:update', this.state);
    for (const alarm of newAlarms) {
      this.emit('alarm:new', alarm);
    }
    for (const alarm of clearedAlarms) {
      this.emit('alarm:cleared', alarm);
    }
  }

  getState(): ProcessState {
    return this.state;
  }

  getSimulatedTime(): number {
    return this.simulatedTime;
  }

  applyControl(type: string, payload: Record<string, unknown>): void {
    const description = this.buildEventDescription(type, payload); // read this.state BEFORE mutation
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
      case 'backwash': {
        const { command } = payload as { command: 'start' | 'abort' };
        if (command === 'start') {
          this.state = { ...this.state, sedimentation: this.sedStage.startBackwash(this.state.sedimentation) };
        } else {
          this.state = { ...this.state, sedimentation: this.sedStage.abortBackwash(this.state.sedimentation) };
        }
        break;
      }
      case 'clearScreen': {
        this.state = { ...this.state, intake: this.intakeStage.clearScreen(this.state.intake) };
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
  }

  private getPumpById(pumpId: string): { running: boolean; speed: number } | null {
    const s = this.state;
    switch (pumpId) {
      case 'intakePump1':   return s.intake.intakePump1;
      case 'intakePump2':   return s.intake.intakePump2;
      case 'alumPump':      return s.coagulation.alumPumpStatus;
      case 'pHAdjustPump':  return s.coagulation.pHAdjustPumpStatus;
      case 'rapidMixer':    return s.coagulation.rapidMixerStatus;
      case 'slowMixer':     return s.coagulation.slowMixerStatus;
      case 'sludgePump':    return s.sedimentation.sludgePumpStatus;
      case 'clarifierRake': return s.sedimentation.clarifierRakeStatus;
      case 'chlorinePump':  return s.disinfection.chlorinePumpStatus;
      case 'uvSystem':      return s.disinfection.uvSystemStatus;
      default:              return null;
    }
  }

  private buildEventDescription(type: string, payload: Record<string, unknown>): string {
    const PUMP_NAMES: Record<string, string> = {
      intakePump1:  'Intake Pump 1 (P-101)',
      intakePump2:  'Intake Pump 2 (P-102)',
      alumPump:     'Alum Pump',
      pHAdjustPump: 'pH Adjust Pump',
      rapidMixer:   'Rapid Mixer',
      slowMixer:    'Slow Mixer',
      sludgePump:   'Sludge Pump',
      clarifierRake:'Clarifier Rake',
      chlorinePump: 'Chlorine Pump',
      uvSystem:     'UV System',
    };
    const VALVE_NAMES: Record<string, string> = {
      intakeValve: 'Intake Valve (XV-101)',
    };

    switch (type) {
      case 'pump': {
        const { pumpId, command, value } = payload as { pumpId: string; command: string; value?: number };
        const name = PUMP_NAMES[pumpId] ?? pumpId;
        const pump = this.getPumpById(pumpId);
        if (command === 'start') {
          const before = pump?.running ? 'running' : 'stopped';
          return `${name}: ${before} → running`;
        }
        if (command === 'stop') {
          const before = pump?.running ? 'running' : 'stopped';
          return `${name}: ${before} → stopped`;
        }
        if (command === 'setSpeed') {
          const before = pump?.speed ?? 0;
          const after = Math.max(0, Math.min(100, value ?? before));
          return `${name} speed: ${before}% → ${after}%`;
        }
        return `${name} ${command}`;
      }
      case 'valve': {
        const { valveId, command, value } = payload as { valveId: string; command: string; value?: number };
        const name = VALVE_NAMES[valveId] ?? valveId;
        const valve = valveId === 'intakeValve' ? this.state.intake.intakeValve : null;
        if (command === 'open') {
          const before = valve?.open ? 'open' : 'closed';
          return `${name}: ${before} → open`;
        }
        if (command === 'close') {
          const before = valve?.open ? 'open' : 'closed';
          return `${name}: ${before} → closed`;
        }
        if (command === 'setPosition') {
          const before = valve?.position ?? 0;
          const after = Math.max(0, Math.min(100, value ?? before));
          return `${name} position: ${before}% → ${after}%`;
        }
        return `${name} ${command}`;
      }
      case 'setpoint': {
        const { tagId, value } = payload as { tagId: string; value: number };
        const s = this.state;
        switch (tagId) {
          case 'alumDoseSetpoint':
            return `Alum dose setpoint: ${s.coagulation.alumDoseSetpoint.toFixed(1)} → ${Number(value).toFixed(1)} mg/L`;
          case 'chlorineDoseSetpoint':
            return `Chlorine dose: ${s.disinfection.chlorineDoseSetpoint.toFixed(1)} → ${Number(value).toFixed(1)} mg/L`;
          case 'distributionDemand':
            return `Distribution demand: ${s.disinfection.distributionDemand.toFixed(1)} → ${Number(value).toFixed(1)} MGD`;
          case 'simSpeed':
            return `Simulation speed: ${s.simSpeed}× → ${value}×`;
          case 'sourceTurbidityBase':
            return `Source turbidity: ${s.intake.sourceTurbidityBase.toFixed(1)} → ${Number(value).toFixed(1)} NTU`;
          case 'clearScreen':
            return 'Intake screen cleared';
          case 'pHAdjustDoseSetpoint':
            return `pH adjust dose setpoint: ${s.coagulation.pHAdjustDoseSetpoint.toFixed(1)} → ${Number(value).toFixed(1)} mg/L`;
          case 'sourceTemperature':
            return `Source temperature: ${s.intake.sourceTemperature.toFixed(1)} → ${Number(value).toFixed(1)} °C`;
          case 'sourcePH':
            return `Source pH: ${s.intake.sourcePH.toFixed(1)} → ${Number(value).toFixed(1)}`;
          case 'sourceColor':
            return `Source color: ${s.intake.sourceColor.toFixed(0)} → ${Number(value).toFixed(0)} CU`;
          case 'naturalInflow':
            return `Natural inflow: ${s.intake.naturalInflow.toFixed(2)} → ${Number(value).toFixed(2)}`;
          default:
            return `Setpoint ${tagId} → ${value}`;
        }
      }
      case 'backwash': {
        const { command } = payload as { command: string };
        return command === 'start' ? 'Filter backwash started' : 'Filter backwash aborted';
      }
      case 'clearScreen':      return 'Intake screen cleared';
      default:                 return type;
    }
  }

  private applyPumpControl(
    state: ProcessState,
    pumpId: string,
    command: string,
    value?: number
  ): ProcessState {
    const next = { ...state };
    type PumpStatus = typeof state.intake.intakePump1;
    const setPump = (pump: PumpStatus): PumpStatus => {
      switch (command) {
        case 'start': return { ...pump, running: true, fault: false };
        case 'stop': return { ...pump, running: false };
        case 'setSpeed': return { ...pump, speed: Math.max(0, Math.min(100, value ?? pump.speed)) };
        default: return pump;
      }
    };

    switch (pumpId) {
      case 'intakePump1':
        next.intake = { ...state.intake, intakePump1: setPump(state.intake.intakePump1) };
        break;
      case 'intakePump2':
        next.intake = { ...state.intake, intakePump2: setPump(state.intake.intakePump2) };
        break;
      case 'alumPump':
        next.coagulation = { ...state.coagulation, alumPumpStatus: setPump(state.coagulation.alumPumpStatus) };
        break;
      case 'pHAdjustPump':
        next.coagulation = { ...state.coagulation, pHAdjustPumpStatus: setPump(state.coagulation.pHAdjustPumpStatus) };
        break;
      case 'rapidMixer':
        next.coagulation = { ...state.coagulation, rapidMixerStatus: setPump(state.coagulation.rapidMixerStatus) };
        break;
      case 'slowMixer':
        next.coagulation = { ...state.coagulation, slowMixerStatus: setPump(state.coagulation.slowMixerStatus) };
        break;
      case 'sludgePump':
        next.sedimentation = { ...state.sedimentation, sludgePumpStatus: setPump(state.sedimentation.sludgePumpStatus) };
        break;
      case 'clarifierRake':
        next.sedimentation = { ...state.sedimentation, clarifierRakeStatus: setPump(state.sedimentation.clarifierRakeStatus) };
        break;
      case 'chlorinePump':
        next.disinfection = { ...state.disinfection, chlorinePumpStatus: setPump(state.disinfection.chlorinePumpStatus) };
        break;
      case 'uvSystem':
        next.disinfection = { ...state.disinfection, uvSystemStatus: setPump(state.disinfection.uvSystemStatus) };
        break;
    }
    return next;
  }

  private applyValveControl(
    state: ProcessState,
    valveId: string,
    command: string,
    value?: number
  ): ProcessState {
    const valve = state.intake.intakeValve;
    let newValve = { ...valve };
    switch (command) {
      case 'open': newValve = { ...valve, open: true, position: 100 }; break;
      case 'close': newValve = { ...valve, open: false, position: 0 }; break;
      case 'setPosition':
        newValve = { ...valve, position: Math.max(0, Math.min(100, value ?? valve.position)), open: (value ?? 0) > 0 };
        break;
    }
    if (valveId === 'intakeValve') {
      return { ...state, intake: { ...state.intake, intakeValve: newValve } };
    }
    return state;
  }

  private applySetpoint(state: ProcessState, tagId: string, value: number): ProcessState {
    switch (tagId) {
      case 'alumDoseSetpoint':
        return { ...state, coagulation: { ...state.coagulation, alumDoseSetpoint: Math.max(0, Math.min(80, value)) } };
      case 'chlorineDoseSetpoint':
        return { ...state, disinfection: { ...state.disinfection, chlorineDoseSetpoint: Math.max(0, Math.min(10, value)) } };
      case 'distributionDemand':
        return { ...state, disinfection: { ...state.disinfection, distributionDemand: Math.max(0, Math.min(6, value)) } };
      case 'pHAdjustDoseSetpoint':
        return { ...state, coagulation: { ...state.coagulation, pHAdjustDoseSetpoint: Math.max(0, Math.min(10, value)) } };
      case 'simSpeed':
        return { ...state, simSpeed: Math.max(0.5, Math.min(60, value)) };
      case 'clearScreen':
        return { ...state, intake: this.intakeStage.clearScreen(state.intake) };
      case 'sourceTurbidityBase':
        return { ...state, intake: { ...state.intake, sourceTurbidityBase: Math.max(1, Math.min(300, value)) } };
      case 'sourceTemperature':
        return { ...state, intake: { ...state.intake, sourceTemperature: Math.max(0, Math.min(30, value)) } };
      case 'sourcePH':
        return { ...state, intake: { ...state.intake, sourcePH: Math.max(5.0, Math.min(9.0, value)) } };
      case 'sourceColor':
        return { ...state, intake: { ...state.intake, sourceColor: Math.max(0, Math.min(100, value)) } };
      case 'naturalInflow':
        return { ...state, intake: { ...state.intake, naturalInflow: Math.max(0.01, Math.min(0.20, value)) } };
      default:
        return state;
    }
  }

  reset(): void {
    this.state = createInitialState();
    this.alarmManager = new AlarmManager();
    this.historian.clear();
    this.scenarioEngine = new ScenarioEngine();
    this.simulatedTime = Date.now();
    this.emit('simulation:reset');
    this.emit('state:update', this.state);
  }

  injectScenario(modifications: (state: ProcessState) => ProcessState): void {
    this.state = modifications(this.state);
  }

  setActiveScenario(id: string | null): void {
    this.state = { ...this.state, activeScenario: id };
  }

  emitSimulationEvent(description: string): void {
    this.emit('simulation:event', {
      id: crypto.randomUUID(),
      timestamp: new Date(this.simulatedTime).toISOString(),
      type: 'simulation',
      description,
    });
  }

  getAlarmHistory(): Alarm[] {
    return this.alarmManager.getHistory();
  }

  setAlarmThresholds(thresholds: Record<string, { ll?: number; l?: number; h?: number; hh?: number }>): void {
    this.alarmManager.setThresholds(thresholds);
  }
}
