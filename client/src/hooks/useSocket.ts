import { useEffect } from 'react';
import { getEngine } from '../simulation/engine';
import { useSimulationStore } from '../store/useSimulationStore';
import { useAlarmStore } from '../store/useAlarmStore';
import { useScenarioStore } from '../store/useScenarioStore';
import type { ProcessState, Alarm } from '../types/process';

export function useSocket() {
  const setState = useSimulationStore((s) => s.setState);
  const setConnected = useSimulationStore((s) => s.setConnected);
  const setAlarms = useAlarmStore((s) => s.setAlarms);
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const clearAlarm = useAlarmStore((s) => s.clearAlarm);
  const setActiveScenario = useScenarioStore((s) => s.setActiveScenario);

  useEffect(() => {
    const engine = getEngine();
    setConnected(true);

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

    engine.on('state:update', onStateUpdate);
    engine.on('alarm:new', onAlarmNew);
    engine.on('alarm:cleared', onAlarmCleared);

    return () => {
      engine.off('state:update', onStateUpdate);
      engine.off('alarm:new', onAlarmNew);
      engine.off('alarm:cleared', onAlarmCleared);
    };
  }, [setState, setConnected, setAlarms, addAlarm, clearAlarm, setActiveScenario]);
}
