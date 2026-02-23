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

  private tick(): void {
    const dt = (config.simulationInterval / 1000) * this.state.simSpeed;
    this.simulatedTime += dt * 1000;

    const nextIntake = this.intakeStage.update(this.state.intake, dt);
    const nextCoag = this.coagStage.update(this.state.coagulation, nextIntake, dt);
    const nextSed = this.sedStage.update(this.state.sedimentation, nextCoag, dt);
    const nextDis = this.disStage.update(this.state.disinfection, nextSed, dt, nextCoag);

    const preAlarmState: ProcessState = {
      ...this.state,
      timestamp: new Date(this.simulatedTime).toISOString(),
      intake: nextIntake,
      coagulation: nextCoag,
      sedimentation: nextSed,
      disinfection: nextDis,
    };

    const { newAlarms, clearedAlarms } = this.alarmManager.evaluate(preAlarmState);

    let updatedAlarms = [...preAlarmState.alarms];
    for (const alarm of newAlarms) {
      updatedAlarms.push(alarm);
    }
    for (const cleared of clearedAlarms) {
      updatedAlarms = updatedAlarms.map((a) =>
        a.id === cleared.id ? { ...a, active: false, clearedAt: cleared.clearedAt } : a
      );
    }
    updatedAlarms = updatedAlarms.filter(
      (a) =>
        a.active ||
        (a.clearedAt && Date.now() - new Date(a.clearedAt).getTime() < 300000)
    );

    this.state = { ...preAlarmState, alarms: updatedAlarms };
    this.historian.record(this.state);

    this.scenarioEngine.tick(this);

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

  applyControl(type: string, payload: Record<string, unknown>): void {
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
      case 'acknowledgeAlarm': {
        const { alarmId } = payload as { alarmId: string };
        this.state = {
          ...this.state,
          alarms: this.state.alarms.map((a) =>
            a.id === alarmId ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() } : a
          ),
        };
        break;
      }
      case 'acknowledgeAll': {
        this.state = {
          ...this.state,
          alarms: this.state.alarms.map((a) => ({
            ...a,
            acknowledged: true,
            acknowledgedAt: a.acknowledged ? a.acknowledgedAt : new Date().toISOString(),
          })),
        };
        break;
      }
      case 'clearScreen': {
        this.state = { ...this.state, intake: this.intakeStage.clearScreen(this.state.intake) };
        break;
      }
    }
    this.emit('state:update', this.state);
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
      case 'fluoridePump':
        next.disinfection = { ...state.disinfection, fluoridePumpStatus: setPump(state.disinfection.fluoridePumpStatus) };
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
      case 'fluorideDoseSetpoint':
        return { ...state, disinfection: { ...state.disinfection, fluorideDoseSetpoint: Math.max(0, Math.min(2, value)) } };
      case 'pHAdjustDoseRate':
        return { ...state, coagulation: { ...state.coagulation, pHAdjustDoseRate: Math.max(0, Math.min(10, value)) } };
      case 'simSpeed':
        return { ...state, simSpeed: Math.max(0.5, Math.min(10, value)) };
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

  injectScenario(modifications: (state: ProcessState) => ProcessState): void {
    this.state = modifications(this.state);
  }

  setActiveScenario(id: string | null): void {
    this.state = { ...this.state, activeScenario: id };
  }

  getAlarmHistory(): Alarm[] {
    return this.alarmManager.getHistory();
  }
}
