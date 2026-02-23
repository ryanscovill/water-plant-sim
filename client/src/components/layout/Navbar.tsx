import { Wifi, WifiOff } from 'lucide-react';
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="22" height="22">
          <rect width="32" height="32" rx="6" fill="#1a1a2e"/>
          <path d="M16 5 C16 5 8 14 8 19 a8 8 0 0 0 16 0 C24 14 16 5 16 5Z" fill="#38bdf8"/>
          <ellipse cx="13" cy="17" rx="2" ry="3" fill="white" opacity="0.25" transform="rotate(-20 13 17)"/>
          <path d="M22 10 a9 9 0 0 1 0 12" stroke="#60a5fa" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.7"/>
          <path d="M24 8 a12 12 0 0 1 0 16" stroke="#60a5fa" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.4"/>
        </svg>
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
