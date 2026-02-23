import type { ProcessState } from './ProcessState';
import type { ScenarioDefinition } from './scenarios/index';

// Forward reference — SimulationEngine imports ScenarioEngine so we use a minimal interface
interface EngineInterface {
  injectScenario(modifications: (state: ProcessState) => ProcessState): void;
  setActiveScenario(id: string | null): void;
  applyControl(type: string, payload: Record<string, unknown>): void;
}

export class ScenarioEngine {
  private activeScenario: ScenarioDefinition | null = null;
  private startTime: number = 0;
  private executedSteps: Set<number> = new Set();
  private turbidityTarget: number | null = null;
  private turbidityDuration: number = 0;

  start(scenario: ScenarioDefinition, engine: EngineInterface): void {
    this.activeScenario = scenario;
    this.startTime = Date.now();
    this.executedSteps = new Set();
    engine.setActiveScenario(scenario.id);

    for (const step of scenario.steps) {
      if (step.triggerAt === 0) {
        this.executeStep(step, engine);
        this.executedSteps.add(step.triggerAt);
      }
    }
  }

  stop(engine: EngineInterface): void {
    this.activeScenario = null;
    this.turbidityTarget = null;
    engine.setActiveScenario(null);
  }

  tick(engine: EngineInterface): void {
    if (!this.activeScenario) return;

    const elapsed = (Date.now() - this.startTime) / 1000;

    for (const step of this.activeScenario.steps) {
      if (step.triggerAt > 0 && elapsed >= step.triggerAt && !this.executedSteps.has(step.triggerAt)) {
        this.executeStep(step, engine);
        this.executedSteps.add(step.triggerAt);
      }
    }

    if (this.turbidityTarget !== null) {
      const target = this.turbidityTarget;
      const dur = Math.max(this.turbidityDuration, 1);
      engine.injectScenario((state: ProcessState) => ({
        ...state,
        intake: {
          ...state.intake,
          rawTurbidity: state.intake.rawTurbidity + (target - state.intake.rawTurbidity) * (0.5 / dur),
        },
      }));
    }

    if (this.activeScenario.duration > 0 && elapsed >= this.activeScenario.duration) {
      engine.setActiveScenario(null);
      this.activeScenario = null;
      this.turbidityTarget = null;
    }
  }

  private executeStep(
    step: { action: string; params: Record<string, unknown> },
    engine: EngineInterface
  ): void {
    switch (step.action) {
      case 'faultPump': {
        const pumpId = step.params.pumpId as string;
        engine.injectScenario((state: ProcessState) => {
          type PumpStatus = typeof state.intake.intakePump1;
          const setFault = (pump: PumpStatus): PumpStatus => ({ ...pump, fault: true, running: false });
          switch (pumpId) {
            case 'intakePump1':
              return { ...state, intake: { ...state.intake, intakePump1: setFault(state.intake.intakePump1) } };
            case 'intakePump2':
              return { ...state, intake: { ...state.intake, intakePump2: setFault(state.intake.intakePump2) } };
            case 'sludgePump':
              return { ...state, sedimentation: { ...state.sedimentation, sludgePumpStatus: setFault(state.sedimentation.sludgePumpStatus) } };
            case 'chlorinePump':
              return { ...state, disinfection: { ...state.disinfection, chlorinePumpStatus: setFault(state.disinfection.chlorinePumpStatus) } };
            default:
              return state;
          }
        });
        break;
      }
      case 'setTurbidity': {
        this.turbidityTarget = step.params.target as number;
        this.turbidityDuration = step.params.duration as number;
        break;
      }
      case 'preloadFilter': {
        engine.injectScenario((state: ProcessState) => ({
          ...state,
          sedimentation: {
            ...state.sedimentation,
            filterHeadLoss: step.params.headLoss as number,
            filterRunTime: step.params.filterRunTime as number,
          },
        }));
        break;
      }
      case 'setAlumDose': {
        engine.injectScenario((state: ProcessState) => ({
          ...state,
          coagulation: {
            ...state.coagulation,
            alumDoseSetpoint: step.params.value as number,
            alumDoseRate: step.params.value as number,
          },
        }));
        break;
      }
    }
  }

  getActiveScenario(): ScenarioDefinition | null {
    return this.activeScenario;
  }
}
