import { useEventStore } from '../store/useEventStore';

const TYPE_BADGE: Record<string, string> = {
  pump:             'bg-blue-700 text-blue-100',
  valve:            'bg-cyan-700 text-cyan-100',
  setpoint:         'bg-purple-700 text-purple-100',
  backwash:         'bg-amber-700 text-amber-100',
  clearScreen:      'bg-green-700 text-green-100',
  simulation:       'bg-orange-700 text-orange-100',
};

export function HistoryPage() {
  const events = useEventStore((s) => s.events);
  const clearEvents = useEventStore((s) => s.clearEvents);

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-300 font-bold text-sm font-mono">EVENT HISTORY</h2>
        <button
          onClick={clearEvents}
          className="px-3 py-1 text-xs font-mono bg-gray-700 hover:bg-gray-600 text-gray-200 rounded border border-gray-600"
        >
          CLEAR
        </button>
      </div>

      <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
        {events.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm font-mono">
            No events recorded yet.
          </div>
        ) : (
          <div className="overflow-y-auto divide-y divide-gray-800">
            {events.map((evt) => (
              <div key={evt.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800/50">
                <span className="text-xs text-gray-500 font-mono whitespace-nowrap shrink-0">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${TYPE_BADGE[evt.type] ?? 'bg-gray-700 text-gray-200'}`}
                >
                  {evt.type}
                </span>
                <span className="text-sm text-gray-200 font-mono">{evt.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
