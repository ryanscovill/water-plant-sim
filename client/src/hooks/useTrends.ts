import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../simulation/engine';

interface TrendPoint {
  timestamp: string;
  value: number;
}

export function useTrends(tag: string, durationSeconds: number = 3600) {
  const [data, setData] = useState<TrendPoint[]>([]);

  const refresh = useCallback(() => {
    if (!tag) return;
    const result = getEngine().historian.getTagHistory(tag, durationSeconds);
    setData(result);
  }, [tag, durationSeconds]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, loading: false, error: null, refetch: refresh };
}
