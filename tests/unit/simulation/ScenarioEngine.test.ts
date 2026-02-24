import { describe, it, expect, beforeEach } from 'vitest';
import { ScenarioEngine } from '../../../client/src/simulation/ScenarioEngine';
import { createInitialState } from '../../../client/src/simulation/ProcessState';
import type { ProcessState } from '../../../client/src/simulation/ProcessState';
import type { ScenarioDefinition } from '../../../client/src/simulation/scenarios/index';

// All seven scenario definitions
import { normalOperations }       from '../../../client/src/simulation/scenarios/normal-operations';
import { highTurbidityStorm }     from '../../../client/src/simulation/scenarios/high-turbidity-storm';
import { intakePumpFailure }      from '../../../client/src/simulation/scenarios/intake-pump-failure';
import { filterBreakthrough }     from '../../../client/src/simulation/scenarios/filter-breakthrough';
import { chlorineDosingFault }    from '../../../client/src/simulation/scenarios/chlorine-dosing-fault';
import { alumOverdose }           from '../../../client/src/simulation/scenarios/alum-overdose';
import { sludgeBlanketBuildup }   from '../../../client/src/simulation/scenarios/sludge-blanket-buildup';

// ---------------------------------------------------------------------------
// Mock EngineInterface
// ---------------------------------------------------------------------------

interface Call {
  type: string;
  args: unknown[];
}

function makeMockEngine(initialState?: Partial<ProcessState>) {
  let state: ProcessState = { ...createInitialState(), ...initialState };
  const calls: Call[] = [];

  const engine = {
    injectScenario(mod: (s: ProcessState) => ProcessState) {
      calls.push({ type: 'injectScenario', args: [mod] });
      state = mod(state);
    },
    setActiveScenario(id: string | null) {
      calls.push({ type: 'setActiveScenario', args: [id] });
      state = { ...state, activeScenario: id };
    },
    applyControl(type: string, payload: Record<string, unknown>) {
      calls.push({ type: 'applyControl', args: [type, payload] });
    },
    emitSimulationEvent(description: string) {
      calls.push({ type: 'emitSimulationEvent', args: [description] });
    },
    // helpers for assertions
    getState: () => state,
    getCalls: () => calls,
    callsOfType: (type: string) => calls.filter(c => c.type === type),
  };

  return engine;
}

type MockEngine = ReturnType<typeof makeMockEngine>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INDEFINITE: ScenarioDefinition = {
  id: 'test-indefinite',
  name: 'Test Indefinite',
  description: 'no-op',
  difficulty: 'Beginner',
  duration: 0,
  steps: [],
};

const TIMED: ScenarioDefinition = {
  id: 'test-timed',
  name: 'Test Timed',
  description: 'no-op with 60 s duration',
  difficulty: 'Beginner',
  duration: 60,
  steps: [],
};

// ---------------------------------------------------------------------------
// ScenarioEngine — lifecycle
// ---------------------------------------------------------------------------

describe('ScenarioEngine', () => {
  let engine: ScenarioEngine;
  let mock: MockEngine;

  beforeEach(() => {
    engine = new ScenarioEngine();
    mock = makeMockEngine();
  });

  // ── start() ────────────────────────────────────────────────────────────────

  describe('start()', () => {
    it('sets the active scenario', () => {
      engine.start(INDEFINITE, mock, 0);
      expect(engine.getActiveScenario()).toBe(INDEFINITE);
    });

    it('calls setActiveScenario with the scenario id', () => {
      engine.start(INDEFINITE, mock, 0);
      const calls = mock.callsOfType('setActiveScenario');
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0]).toBe(INDEFINITE.id);
    });

    it('emits a "Scenario started" event', () => {
      engine.start(INDEFINITE, mock, 0);
      const events = mock.callsOfType('emitSimulationEvent');
      expect(events.some(e => (e.args[0] as string).includes('Scenario started'))).toBe(true);
    });

    it('executes steps with triggerAt === 0 immediately', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [
          { triggerAt: 0,  action: 'preloadFilter', params: { headLoss: 8.5, filterRunTime: 71 } },
          { triggerAt: 30, action: 'faultPump',     params: { pumpId: 'intakePump1' } },
        ],
      };
      engine.start(scenario, mock, 0);
      // preloadFilter is triggerAt=0 → injected immediately
      expect(mock.getState().sedimentation.filterHeadLoss).toBe(8.5);
      expect(mock.getState().sedimentation.filterRunTime).toBe(71);
      // faultPump is triggerAt=30 → NOT yet executed
      expect(mock.getState().intake.intakePump1.fault).toBe(false);
    });

    it('does not execute steps with triggerAt > 0 on start', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 15, action: 'faultPump', params: { pumpId: 'intakePump1' } }],
      };
      engine.start(scenario, mock, 0);
      expect(mock.getState().intake.intakePump1.fault).toBe(false);
    });
  });

  // ── stop() ─────────────────────────────────────────────────────────────────

  describe('stop()', () => {
    it('clears the active scenario', () => {
      engine.start(INDEFINITE, mock, 0);
      engine.stop(mock);
      expect(engine.getActiveScenario()).toBeNull();
    });

    it('calls setActiveScenario(null)', () => {
      engine.start(INDEFINITE, mock, 0);
      engine.stop(mock);
      const nullCalls = mock.callsOfType('setActiveScenario').filter(c => c.args[0] === null);
      expect(nullCalls).toHaveLength(1);
    });

    it('emits a "Scenario stopped" event containing the scenario name', () => {
      engine.start(INDEFINITE, mock, 0);
      engine.stop(mock);
      const events = mock.callsOfType('emitSimulationEvent');
      expect(events.some(e => (e.args[0] as string).includes('Scenario stopped'))).toBe(true);
      expect(events.some(e => (e.args[0] as string).includes(INDEFINITE.name))).toBe(true);
    });

    it('clears turbidity ramp state so a subsequent tick does not inject', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'setTurbidity', params: { target: 300, duration: 10 } }],
      };
      engine.start(scenario, mock, 0);
      engine.stop(mock);

      // tick after stop should not inject anything
      const callsBefore = mock.getCalls().length;
      engine.tick(mock, 0);
      expect(mock.getCalls().length).toBe(callsBefore);
    });
  });

  // ── getActiveScenario() ────────────────────────────────────────────────────

  describe('getActiveScenario()', () => {
    it('returns null before any scenario is started', () => {
      expect(engine.getActiveScenario()).toBeNull();
    });

    it('returns the active scenario after start()', () => {
      engine.start(INDEFINITE, mock, 0);
      expect(engine.getActiveScenario()).toBe(INDEFINITE);
    });

    it('returns null after stop()', () => {
      engine.start(INDEFINITE, mock, 0);
      engine.stop(mock);
      expect(engine.getActiveScenario()).toBeNull();
    });
  });

  // ── tick() ─────────────────────────────────────────────────────────────────

  describe('tick()', () => {
    it('does nothing when no scenario is active', () => {
      engine.tick(mock, 0);
      expect(mock.getCalls()).toHaveLength(0);
    });

    it('executes a delayed step when elapsed time exceeds triggerAt', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 15, action: 'faultPump', params: { pumpId: 'intakePump1' } }],
      };
      engine.start(scenario, mock, 0);
      expect(mock.getState().intake.intakePump1.fault).toBe(false);

      engine.tick(mock, 16_000); // 16 simulated seconds (ms)
      expect(mock.getState().intake.intakePump1.fault).toBe(true);
    });

    it('does not execute a step before its triggerAt time', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 30, action: 'faultPump', params: { pumpId: 'intakePump1' } }],
      };
      engine.start(scenario, mock, 0);
      engine.tick(mock, 10_000); // only 10 s elapsed
      expect(mock.getState().intake.intakePump1.fault).toBe(false);
    });

    it('does not re-execute an already-executed step', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 15, action: 'faultPump', params: { pumpId: 'intakePump1' } }],
      };
      engine.start(scenario, mock, 0);
      engine.tick(mock, 16_000);
      const injectsBefore = mock.callsOfType('injectScenario').length;
      engine.tick(mock, 16_000); // second tick — same elapsed time
      expect(mock.callsOfType('injectScenario').length).toBe(injectsBefore);
    });

    it('ramps turbidity toward target on each tick when setTurbidity was activated', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'setTurbidity', params: { target: 300, duration: 10 } }],
      };
      engine.start(scenario, mock, 0);
      const initialTurbidity = mock.getState().intake.sourceTurbidityBase;
      engine.tick(mock, 500);
      const afterTick = mock.getState().intake.sourceTurbidityBase;
      expect(afterTick).toBeGreaterThan(initialTurbidity);
      expect(afterTick).toBeLessThan(300);
    });

    it('completes a timed scenario when duration elapses', () => {
      engine.start(TIMED, mock, 0);
      engine.tick(mock, 61_000); // past the 60 s duration
      expect(engine.getActiveScenario()).toBeNull();
    });

    it('emits "Scenario completed" event when timed scenario ends', () => {
      engine.start(TIMED, mock, 0);
      engine.tick(mock, 61_000);
      const events = mock.callsOfType('emitSimulationEvent');
      expect(events.some(e => (e.args[0] as string).includes('Scenario completed'))).toBe(true);
    });

    it('never auto-completes an indefinite scenario (duration === 0)', () => {
      engine.start(INDEFINITE, mock, 0);
      engine.tick(mock, 999_999_000);
      expect(engine.getActiveScenario()).toBe(INDEFINITE);
    });
  });

  // ── executeStep — individual actions ──────────────────────────────────────

  describe('executeStep — faultPump', () => {
    function startFaultScenario(pumpId: string) {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'faultPump', params: { pumpId } }],
      };
      engine.start(scenario, mock, 0);
    }

    it('faults intakePump1 — sets fault=true and running=false', () => {
      startFaultScenario('intakePump1');
      const { intakePump1 } = mock.getState().intake;
      expect(intakePump1.fault).toBe(true);
      expect(intakePump1.running).toBe(false);
    });

    it('faults intakePump2 — sets fault=true and running=false', () => {
      const m = makeMockEngine({
        intake: {
          ...createInitialState().intake,
          intakePump2: { running: true, fault: false, speed: 60, runHours: 500 },
        },
      });
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'faultPump', params: { pumpId: 'intakePump2' } }],
      };
      engine.start(scenario, m, 0);
      expect(m.getState().intake.intakePump2.fault).toBe(true);
      expect(m.getState().intake.intakePump2.running).toBe(false);
    });

    it('faults sludgePump — sets fault=true and running=false', () => {
      startFaultScenario('sludgePump');
      const { sludgePumpStatus } = mock.getState().sedimentation;
      expect(sludgePumpStatus.fault).toBe(true);
      expect(sludgePumpStatus.running).toBe(false);
    });

    it('faults chlorinePump — sets fault=true and running=false', () => {
      startFaultScenario('chlorinePump');
      const { chlorinePumpStatus } = mock.getState().disinfection;
      expect(chlorinePumpStatus.fault).toBe(true);
      expect(chlorinePumpStatus.running).toBe(false);
    });

    it('emits a FAULT event containing the pump display name', () => {
      startFaultScenario('intakePump1');
      const events = mock.callsOfType('emitSimulationEvent');
      expect(events.some(e => (e.args[0] as string).startsWith('FAULT:'))).toBe(true);
      expect(events.some(e => (e.args[0] as string).includes('Intake Pump 1'))).toBe(true);
    });

    it('leaves all other pump states untouched', () => {
      startFaultScenario('intakePump1');
      const state = mock.getState();
      expect(state.intake.intakePump2.fault).toBe(false);
      expect(state.sedimentation.sludgePumpStatus.fault).toBe(false);
      expect(state.disinfection.chlorinePumpStatus.fault).toBe(false);
    });
  });

  describe('executeStep — setTurbidity', () => {
    it('does not immediately change sourceTurbidityBase (sets internal ramp target)', () => {
      const baseTurbidity = createInitialState().intake.sourceTurbidityBase;
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'setTurbidity', params: { target: 300, duration: 10 } }],
      };
      engine.start(scenario, mock, 0);
      // start() runs triggerAt=0 — setTurbidity only sets internal target, no inject yet
      expect(mock.callsOfType('injectScenario')).toHaveLength(0);
      expect(mock.getState().intake.sourceTurbidityBase).toBe(baseTurbidity);
    });

    it('turbidity ramps toward target over repeated ticks', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'setTurbidity', params: { target: 300, duration: 10 } }],
      };
      engine.start(scenario, mock, 0);
      for (let i = 0; i < 20; i++) engine.tick(mock, i * 500);
      expect(mock.getState().intake.sourceTurbidityBase).toBeGreaterThan(
        createInitialState().intake.sourceTurbidityBase
      );
    });

    it('turbidity is clamped between 1 and 300 NTU', () => {
      // Target below 1
      const scLow: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'setTurbidity', params: { target: 0, duration: 1 } }],
      };
      engine.start(scLow, mock, 0);
      for (let i = 0; i < 100; i++) engine.tick(mock, i * 500);
      expect(mock.getState().intake.sourceTurbidityBase).toBeGreaterThanOrEqual(1);
    });

    it('emits an event describing the turbidity ramp', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'setTurbidity', params: { target: 80, duration: 10 } }],
      };
      engine.start(scenario, mock, 0);
      const events = mock.callsOfType('emitSimulationEvent');
      expect(events.some(e => (e.args[0] as string).includes('80'))).toBe(true);
    });
  });

  describe('executeStep — preloadFilter', () => {
    it('sets filterHeadLoss on the sedimentation state', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'preloadFilter', params: { headLoss: 8.5, filterRunTime: 71 } }],
      };
      engine.start(scenario, mock, 0);
      expect(mock.getState().sedimentation.filterHeadLoss).toBe(8.5);
    });

    it('sets filterRunTime on the sedimentation state', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'preloadFilter', params: { headLoss: 8.5, filterRunTime: 71 } }],
      };
      engine.start(scenario, mock, 0);
      expect(mock.getState().sedimentation.filterRunTime).toBe(71);
    });

    it('emits an event describing the preload values', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'preloadFilter', params: { headLoss: 8.5, filterRunTime: 71 } }],
      };
      engine.start(scenario, mock, 0);
      const events = mock.callsOfType('emitSimulationEvent');
      expect(events.some(e => {
        const msg = e.args[0] as string;
        return msg.includes('8.5') && msg.includes('71');
      })).toBe(true);
    });
  });

  describe('executeStep — setAlumDose', () => {
    it('sets alumDoseSetpoint on the coagulation state', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'setAlumDose', params: { value: 50 } }],
      };
      engine.start(scenario, mock, 0);
      expect(mock.getState().coagulation.alumDoseSetpoint).toBe(50);
    });

    it('emits an event with the new dose value', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'setAlumDose', params: { value: 50 } }],
      };
      engine.start(scenario, mock, 0);
      const events = mock.callsOfType('emitSimulationEvent');
      expect(events.some(e => (e.args[0] as string).includes('50'))).toBe(true);
    });
  });

  describe('executeStep — setChlorineDoseSetpoint', () => {
    it('sets chlorineDoseSetpoint on the disinfection state', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'setChlorineDoseSetpoint', params: { value: 0 } }],
      };
      engine.start(scenario, mock, 0);
      expect(mock.getState().disinfection.chlorineDoseSetpoint).toBe(0);
    });

    it('emits an event with the new setpoint', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'setChlorineDoseSetpoint', params: { value: 3.5 } }],
      };
      engine.start(scenario, mock, 0);
      const events = mock.callsOfType('emitSimulationEvent');
      expect(events.some(e => (e.args[0] as string).includes('3.5'))).toBe(true);
    });
  });

  describe('executeStep — setSludgeLevel', () => {
    it('sets sludgeBlanketLevel on the sedimentation state', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'setSludgeLevel', params: { value: 3.5 } }],
      };
      engine.start(scenario, mock, 0);
      expect(mock.getState().sedimentation.sludgeBlanketLevel).toBe(3.5);
    });

    it('emits an event with the new level', () => {
      const scenario: ScenarioDefinition = {
        ...INDEFINITE,
        steps: [{ triggerAt: 0, action: 'setSludgeLevel', params: { value: 3.5 } }],
      };
      engine.start(scenario, mock, 0);
      const events = mock.callsOfType('emitSimulationEvent');
      expect(events.some(e => (e.args[0] as string).includes('3.5'))).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Scenario definitions — structural validation
// ---------------------------------------------------------------------------

describe('Scenario definitions', () => {
  const ALL_SCENARIOS: ScenarioDefinition[] = [
    normalOperations,
    highTurbidityStorm,
    intakePumpFailure,
    filterBreakthrough,
    chlorineDosingFault,
    alumOverdose,
    sludgeBlanketBuildup,
  ];

  it('there are exactly 7 scenarios', () => {
    expect(ALL_SCENARIOS).toHaveLength(7);
  });

  it('all scenario ids are unique', () => {
    const ids = ALL_SCENARIOS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all scenarios have a non-empty name and description', () => {
    for (const s of ALL_SCENARIOS) {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    }
  });

  it('all scenarios have a valid difficulty', () => {
    const valid = new Set(['Beginner', 'Intermediate', 'Advanced']);
    for (const s of ALL_SCENARIOS) {
      expect(valid.has(s.difficulty), `${s.id} has invalid difficulty: ${s.difficulty}`).toBe(true);
    }
  });

  it('all scenario steps have a non-negative triggerAt', () => {
    for (const s of ALL_SCENARIOS) {
      for (const step of s.steps) {
        expect(step.triggerAt).toBeGreaterThanOrEqual(0);
      }
    }
  });

  // ── normalOperations ────────────────────────────────────────────────────────

  describe('normalOperations', () => {
    it('has id "normal-operations"', () => {
      expect(normalOperations.id).toBe('normal-operations');
    });

    it('is Beginner difficulty', () => {
      expect(normalOperations.difficulty).toBe('Beginner');
    });

    it('has indefinite duration (0)', () => {
      expect(normalOperations.duration).toBe(0);
    });

    it('has no steps', () => {
      expect(normalOperations.steps).toHaveLength(0);
    });
  });

  // ── highTurbidityStorm ──────────────────────────────────────────────────────

  describe('highTurbidityStorm', () => {
    it('has id "high-turbidity-storm"', () => {
      expect(highTurbidityStorm.id).toBe('high-turbidity-storm');
    });

    it('is Intermediate difficulty', () => {
      expect(highTurbidityStorm.difficulty).toBe('Intermediate');
    });

    it('has a finite duration of 300 seconds', () => {
      expect(highTurbidityStorm.duration).toBe(300);
    });

    it('all steps use the setTurbidity action', () => {
      for (const step of highTurbidityStorm.steps) {
        expect(step.action).toBe('setTurbidity');
      }
    });

    it('turbidity peaks at 300 NTU (step 3 target)', () => {
      const peak = Math.max(...highTurbidityStorm.steps.map(s => s.params.target as number));
      expect(peak).toBe(300);
    });

    it('all steps trigger after t=0 (none are immediate)', () => {
      for (const step of highTurbidityStorm.steps) {
        expect(step.triggerAt).toBeGreaterThan(0);
      }
    });

    it('steps are in ascending triggerAt order', () => {
      const times = highTurbidityStorm.steps.map(s => s.triggerAt);
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThan(times[i - 1]);
      }
    });

    it('all triggerAt values are within the scenario duration', () => {
      for (const step of highTurbidityStorm.steps) {
        expect(step.triggerAt).toBeLessThan(highTurbidityStorm.duration);
      }
    });
  });

  // ── intakePumpFailure ───────────────────────────────────────────────────────

  describe('intakePumpFailure', () => {
    it('has id "intake-pump-failure"', () => {
      expect(intakePumpFailure.id).toBe('intake-pump-failure');
    });

    it('is Intermediate difficulty', () => {
      expect(intakePumpFailure.difficulty).toBe('Intermediate');
    });

    it('has indefinite duration', () => {
      expect(intakePumpFailure.duration).toBe(0);
    });

    it('has exactly one step', () => {
      expect(intakePumpFailure.steps).toHaveLength(1);
    });

    it('step faults intakePump1 at t=15', () => {
      const step = intakePumpFailure.steps[0];
      expect(step.action).toBe('faultPump');
      expect(step.params.pumpId).toBe('intakePump1');
      expect(step.triggerAt).toBe(15);
    });
  });

  // ── filterBreakthrough ──────────────────────────────────────────────────────

  describe('filterBreakthrough', () => {
    it('has id "filter-breakthrough"', () => {
      expect(filterBreakthrough.id).toBe('filter-breakthrough');
    });

    it('is Advanced difficulty', () => {
      expect(filterBreakthrough.difficulty).toBe('Advanced');
    });

    it('has indefinite duration', () => {
      expect(filterBreakthrough.duration).toBe(0);
    });

    it('has exactly one step at t=0', () => {
      expect(filterBreakthrough.steps).toHaveLength(1);
      expect(filterBreakthrough.steps[0].triggerAt).toBe(0);
    });

    it('preloads filter with headLoss=8.5 ft — past the 6 ft breakthrough onset', () => {
      const step = filterBreakthrough.steps[0];
      expect(step.action).toBe('preloadFilter');
      expect(step.params.headLoss as number).toBeGreaterThan(6);
      expect(step.params.headLoss).toBe(8.5);
    });

    it('preloads filter with filterRunTime=71 hours', () => {
      expect(filterBreakthrough.steps[0].params.filterRunTime).toBe(71);
    });
  });

  // ── chlorineDosingFault ─────────────────────────────────────────────────────

  describe('chlorineDosingFault', () => {
    it('has id "chlorine-dosing-fault"', () => {
      expect(chlorineDosingFault.id).toBe('chlorine-dosing-fault');
    });

    it('is Advanced difficulty', () => {
      expect(chlorineDosingFault.difficulty).toBe('Advanced');
    });

    it('has indefinite duration', () => {
      expect(chlorineDosingFault.duration).toBe(0);
    });

    it('has exactly two steps', () => {
      expect(chlorineDosingFault.steps).toHaveLength(2);
    });

    it('first step drops chlorine dose setpoint to 0 at t=5', () => {
      const step = chlorineDosingFault.steps[0];
      expect(step.action).toBe('setChlorineDoseSetpoint');
      expect(step.params.value).toBe(0);
      expect(step.triggerAt).toBe(5);
    });

    it('second step faults chlorinePump at t=15', () => {
      const step = chlorineDosingFault.steps[1];
      expect(step.action).toBe('faultPump');
      expect(step.params.pumpId).toBe('chlorinePump');
      expect(step.triggerAt).toBe(15);
    });
  });

  // ── alumOverdose ────────────────────────────────────────────────────────────

  describe('alumOverdose', () => {
    it('has id "alum-overdose"', () => {
      expect(alumOverdose.id).toBe('alum-overdose');
    });

    it('is Intermediate difficulty', () => {
      expect(alumOverdose.difficulty).toBe('Intermediate');
    });

    it('has indefinite duration', () => {
      expect(alumOverdose.duration).toBe(0);
    });

    it('has exactly one step', () => {
      expect(alumOverdose.steps).toHaveLength(1);
    });

    it('forces alum dose setpoint to 50 mg/L at t=15', () => {
      const step = alumOverdose.steps[0];
      expect(step.action).toBe('setAlumDose');
      expect(step.params.value).toBe(50);
      expect(step.triggerAt).toBe(15);
    });
  });

  // ── sludgeBlanketBuildup ────────────────────────────────────────────────────

  describe('sludgeBlanketBuildup', () => {
    it('has id "sludge-blanket-buildup"', () => {
      expect(sludgeBlanketBuildup.id).toBe('sludge-blanket-buildup');
    });

    it('is Intermediate difficulty', () => {
      expect(sludgeBlanketBuildup.difficulty).toBe('Intermediate');
    });

    it('has indefinite duration', () => {
      expect(sludgeBlanketBuildup.duration).toBe(0);
    });

    it('has exactly two steps', () => {
      expect(sludgeBlanketBuildup.steps).toHaveLength(2);
    });

    it('first step pre-sets sludge blanket to 3.5 ft at t=0', () => {
      const step = sludgeBlanketBuildup.steps[0];
      expect(step.action).toBe('setSludgeLevel');
      expect(step.params.value).toBe(3.5);
      expect(step.triggerAt).toBe(0);
    });

    it('second step faults sludgePump at t=15', () => {
      const step = sludgeBlanketBuildup.steps[1];
      expect(step.action).toBe('faultPump');
      expect(step.params.pumpId).toBe('sludgePump');
      expect(step.triggerAt).toBe(15);
    });
  });
});

// ---------------------------------------------------------------------------
// Integration: scenario start → state mutation verified end-to-end
// ---------------------------------------------------------------------------

describe('ScenarioEngine — end-to-end state mutations', () => {
  let scenarioEngine: ScenarioEngine;
  let mock: MockEngine;

  beforeEach(() => {
    scenarioEngine = new ScenarioEngine();
    mock = makeMockEngine();
  });

  it('filterBreakthrough: starting the scenario pre-loads filter state immediately', () => {
    scenarioEngine.start(filterBreakthrough, mock, 0);
    const state = mock.getState();
    expect(state.sedimentation.filterHeadLoss).toBe(8.5);
    expect(state.sedimentation.filterRunTime).toBe(71);
  });

  it('intakePumpFailure: pump fault fires after 15 s (not before)', () => {
    scenarioEngine.start(intakePumpFailure, mock, 0);
    expect(mock.getState().intake.intakePump1.fault).toBe(false);
    scenarioEngine.tick(mock, 14_999); // 14.999 s elapsed — not yet
    expect(mock.getState().intake.intakePump1.fault).toBe(false);
    scenarioEngine.tick(mock, 15_001); // 15.001 s elapsed — triggers
    expect(mock.getState().intake.intakePump1.fault).toBe(true);
  });

  it('chlorineDosingFault: setpoint drops at t=5 and pump faults at t=15', () => {
    scenarioEngine.start(chlorineDosingFault, mock, 0);
    expect(mock.getState().disinfection.chlorineDoseSetpoint).toBeGreaterThan(0);

    scenarioEngine.tick(mock, 5_001); // 5.001 s — setpoint step fires
    expect(mock.getState().disinfection.chlorineDoseSetpoint).toBe(0);
    expect(mock.getState().disinfection.chlorinePumpStatus.fault).toBe(false);

    scenarioEngine.tick(mock, 15_001); // 15.001 s — fault step fires
    expect(mock.getState().disinfection.chlorinePumpStatus.fault).toBe(true);
  });

  it('alumOverdose: alum setpoint spikes to 50 mg/L at t=15', () => {
    scenarioEngine.start(alumOverdose, mock, 0);
    expect(mock.getState().coagulation.alumDoseSetpoint).toBe(
      createInitialState().coagulation.alumDoseSetpoint
    );
    scenarioEngine.tick(mock, 15_001); // 15.001 s elapsed
    expect(mock.getState().coagulation.alumDoseSetpoint).toBe(50);
  });

  it('sludgeBlanketBuildup: sludge pre-set at t=0, pump faults at t=15', () => {
    scenarioEngine.start(sludgeBlanketBuildup, mock, 0);
    expect(mock.getState().sedimentation.sludgeBlanketLevel).toBe(3.5);
    expect(mock.getState().sedimentation.sludgePumpStatus.fault).toBe(false);
    scenarioEngine.tick(mock, 15_001); // 15.001 s elapsed
    expect(mock.getState().sedimentation.sludgePumpStatus.fault).toBe(true);
  });

  it('highTurbidityStorm: turbidity ramps toward 80 NTU after t=10', () => {
    scenarioEngine.start(highTurbidityStorm, mock, 0);
    const initialTurbidity = mock.getState().intake.sourceTurbidityBase;
    scenarioEngine.tick(mock, 10_001); // activates ramp (t=10 step fires)
    scenarioEngine.tick(mock, 10_001); // applies ramp increment
    expect(mock.getState().intake.sourceTurbidityBase).toBeGreaterThan(initialTurbidity);
  });

  it('highTurbidityStorm: auto-completes after 300 s', () => {
    scenarioEngine.start(highTurbidityStorm, mock, 0);
    scenarioEngine.tick(mock, 301_000); // 301 s elapsed
    expect(scenarioEngine.getActiveScenario()).toBeNull();
  });

  it('normalOperations: start and immediate stop emits correct events', () => {
    scenarioEngine.start(normalOperations, mock, 0);
    scenarioEngine.stop(mock);
    const events = mock.callsOfType('emitSimulationEvent').map(e => e.args[0] as string);
    expect(events.some(e => e.includes('Scenario started'))).toBe(true);
    expect(events.some(e => e.includes('Scenario stopped'))).toBe(true);
  });
});
