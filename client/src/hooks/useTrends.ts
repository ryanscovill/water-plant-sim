import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../simulation/engine';
import { getWWEngine } from '../simulation/ww/wwEngine';

interface TrendPoint {
  timestamp: string;
  value: number;
}

export function useTrends(tag: string, durationSeconds: number = 3600, isWW: boolean = false) {
  const [data, setData] = useState<TrendPoint[]>([]);

  const refresh = useCallback(() => {
    if (!tag) return;
    const engine = isWW ? getWWEngine() : getEngine();
    const result = engine.historian.getTagHistory(tag, durationSeconds);
    setData(result);
  }, [tag, durationSeconds, isWW]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const engine = isWW ? getWWEngine() : getEngine();
    engine.on('simulation:reset', refresh);
    return () => engine.off('simulation:reset', refresh);
  }, [refresh, isWW]);

  return { data, loading: false, error: null, refetch: refresh };
}
