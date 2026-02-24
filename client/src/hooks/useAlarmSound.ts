import { useEffect, useRef } from 'react';
import { useAlarmStore } from '../store/useAlarmStore';

export function useAlarmSound() {
  const alarms = useAlarmStore((s) => s.alarms);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const activeUnacked = alarms.filter((a) => a.active).length;
    if (activeUnacked > prevCountRef.current) {
      // Play a simple beep using Web Audio API
      try {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
      } catch {
        // Audio not available
      }
    }
    prevCountRef.current = activeUnacked;
  }, [alarms]);
}
