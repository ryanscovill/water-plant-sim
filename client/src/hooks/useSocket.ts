import { useEffect } from 'react';
import { getEngine } from '../simulation/engine';
import { useSimulationStore } from '../store/useSimulationStore';
import { useAlarmStore } from '../store/useAlarmStore';
import { useScenarioStore } from '../store/useScenarioStore';
import { useEventStore } from '../store/useEventStore';
import type { ProcessState, Alarm } from '../types/process';
import type { OperatorEvent } from '../store/useEventStore';

export function useSocket() {
  const setState = useSimulationStore((s) => s.setState);
  const setConnected = useSimulationStore((s) => s.setConnected);
  const setAlarms = useAlarmStore((s) => s.setAlarms);
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const clearAlarm = useAlarmStore((s) => s.clearAlarm);
  const resetAlarms = useAlarmStore((s) => s.resetAlarms);
  const setActiveScenario = useScenarioStore((s) => s.setActiveScenario);
  const addEvent = useEventStore((s) => s.addEvent);
  const clearEvents = useEventStore((s) => s.clearEvents);

  useEffect(() => {
    const engine = getEngine();
    setConnected(true);

    const onOperatorEvent = (evt: unknown) => {
      addEvent(evt as OperatorEvent);
    };

    const onSimulationEvent = (evt: unknown) => {
      addEvent(evt as OperatorEvent);
    };

    const onStateUpdate = (state: unknown) => {
      const s = state as ProcessState;
      setState(s);
      setActiveScenario(s.activeScenario);
      setAlarms(s.alarms ?? []);
    };

    const onAlarmNew = (alarm: unknown) => {
      addAlarm(alarm as Alarm);
    };

    const onAlarmCleared = (alarm: unknown) => {
      clearAlarm(alarm as Alarm);
    };

    const onReset = () => {
      resetAlarms();
      clearEvents();
    };

    engine.on('state:update', onStateUpdate);
    engine.on('alarm:new', onAlarmNew);
    engine.on('alarm:cleared', onAlarmCleared);
    engine.on('simulation:reset', onReset);
    engine.on('operator:event', onOperatorEvent);
    engine.on('simulation:event', onSimulationEvent);

    return () => {
      engine.off('state:update', onStateUpdate);
      engine.off('alarm:new', onAlarmNew);
      engine.off('alarm:cleared', onAlarmCleared);
      engine.off('simulation:reset', onReset);
      engine.off('operator:event', onOperatorEvent);
      engine.off('simulation:event', onSimulationEvent);
    };
  }, [setState, setConnected, setAlarms, addAlarm, clearAlarm, resetAlarms, setActiveScenario, addEvent, clearEvents]);
}
