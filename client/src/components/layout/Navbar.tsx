import { Activity, Wifi, WifiOff } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useAlarmStore } from '../../store/useAlarmStore';
import { getEngine } from '../../simulation/engine';

export function Navbar() {
  const connected = useSimulationStore((s) => s.connected);
  const state = useSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const activeUnacked = alarms.filter((a) => a.active && !a.acknowledged).length;

  const changeSpeed = (speed: number) => {
    getEngine().applyControl('setpoint', { tagId: 'simSpeed', value: speed });
  };

  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Activity size={20} className="text-blue-400" />
        <span className="text-white font-bold text-sm tracking-wider">WATERWORKS SCADA TRAINER</span>
      </div>

      <div className="flex-1" />

      {/* Sim speed */}
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <span>SIM:</span>
        {[1, 5, 10].map((s) => (
          <button
            key={s}
            onClick={() => changeSpeed(s)}
            className={`px-2 py-0.5 rounded text-xs font-mono ${state?.simSpeed === s ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Active alarms indicator */}
      {activeUnacked > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-red-900/60 rounded text-red-300 text-xs animate-slow-flash">
          <span className="font-bold">{activeUnacked}</span> ALARM{activeUnacked > 1 ? 'S' : ''}
        </div>
      )}

      {/* Connection status */}
      <div className="flex items-center gap-1.5 text-xs">
        {connected ? (
          <>
            <Wifi size={14} className="text-green-400" />
            <span className="text-green-400">LIVE</span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="text-red-400 animate-flash" />
            <span className="text-red-400">DISCONNECTED</span>
          </>
        )}
      </div>

      {/* Timestamp */}
      {state && (
        <span className="text-gray-500 text-xs font-mono">
          {new Date(state.timestamp).toLocaleTimeString()}
        </span>
      )}
    </header>
  );
}
