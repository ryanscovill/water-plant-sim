export function formatTPlus(ts: number, simStartTime: number): string {
  const elapsed = Math.max(0, ts - simStartTime);
  const totalSec = Math.floor(elapsed / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `T+${h}:${mm}:${ss}` : `T+${mm}:${ss}`;
}
