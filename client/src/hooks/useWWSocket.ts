import { useEffect } from 'react';
import { getWWEngine } from '../simulation/ww/wwEngine';
import { useWWSimulationStore } from '../store/useWWSimulationStore';
import { useAlarmStore } from '../store/useAlarmStore';
import { useEventStore } from '../store/useEventStore';
import type { WWProcessState } from '../simulation/ww/WWProcessState';
import type { Alarm } from '../types/process';
import type { OperatorEvent } from '../store/useEventStore';

export function useWWSocket() {
  const setState = useWWSimulationStore((s) => s.setState);
  const setConnected = useWWSimulationStore((s) => s.setConnected);
  const setAlarms = useAlarmStore((s) => s.setAlarms);
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const clearAlarm = useAlarmStore((s) => s.clearAlarm);
  const resetAlarms = useAlarmStore((s) => s.resetAlarms);
  const addEvent = useEventStore((s) => s.addEvent);
  const clearEvents = useEventStore((s) => s.clearEvents);

  useEffect(() => {
    const engine = getWWEngine();
    setConnected(true);

    const onStateUpdate = (state: unknown) => {
      const s = state as WWProcessState;
      setState(s);
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

    const onOperatorEvent = (evt: unknown) => {
      addEvent(evt as OperatorEvent);
    };

    engine.on('state:update', onStateUpdate);
    engine.on('alarm:new', onAlarmNew);
    engine.on('alarm:cleared', onAlarmCleared);
    engine.on('simulation:reset', onReset);
    engine.on('operator:event', onOperatorEvent);

    return () => {
      engine.off('state:update', onStateUpdate);
      engine.off('alarm:new', onAlarmNew);
      engine.off('alarm:cleared', onAlarmCleared);
      engine.off('simulation:reset', onReset);
      engine.off('operator:event', onOperatorEvent);
    };
  }, [setState, setConnected, setAlarms, addAlarm, clearAlarm, resetAlarms, addEvent, clearEvents]);
}
