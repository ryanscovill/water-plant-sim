import { useState } from 'react';
import { Wifi, WifiOff, RotateCcw, Pause, Play } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useAlarmStore } from '../../store/useAlarmStore';
import { getEngine } from '../../simulation/engine';
import { formatTPlus } from '../../utils/formatTPlus';

export function Navbar() {
  const connected = useSimulationStore((s) => s.connected);
  const state = useSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const activeUnacked = alarms.filter((a) => a.active).length;
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const changeSpeed = (speed: number) => {
    getEngine().applyControl('setpoint', { tagId: 'simSpeed', value: speed });
  };

  const confirmReset = () => {
    getEngine().reset();
    setShowResetConfirm(false);
  };

  return (
    <>
    {showResetConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-gray-900 border border-red-700 rounded-lg p-6 w-80 shadow-xl">
          <h2 className="text-red-400 font-bold text-sm tracking-wider mb-2">RESET SIMULATION?</h2>
          <p className="text-gray-300 text-xs mb-5">
            All process state, alarm history, trend data, and operator events will be cleared. This cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1.5 rounded text-xs font-mono bg-gray-700 text-gray-300 hover:bg-gray-600 cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={confirmReset}
              className="px-3 py-1.5 rounded text-xs font-mono bg-red-800 text-red-200 hover:bg-red-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={11} />
              RESET
            </button>
          </div>
        </div>
      </div>
    )}
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="22" height="22">
          <rect width="32" height="32" rx="6" fill="#1a1a2e"/>
          <path d="M16 5 C16 5 8 14 8 19 a8 8 0 0 0 16 0 C24 14 16 5 16 5Z" fill="#38bdf8"/>
          <ellipse cx="13" cy="17" rx="2" ry="3" fill="white" opacity="0.25" transform="rotate(-20 13 17)"/>
          <path d="M22 10 a9 9 0 0 1 0 12" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>
          <path d="M24 8 a12 12 0 0 1 0 16" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
        </svg>
        <span className="text-white font-bold text-sm tracking-wider">WATERWORKS SCADA TRAINER</span>
      </div>

      <div className="flex-1" />

      {/* Sim speed */}
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <span>SIM:</span>
        <button
          onClick={() => state?.running ? getEngine().pause() : getEngine().resume()}
          title={state?.running ? 'Pause simulation' : 'Resume simulation'}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono cursor-pointer ${!state?.running ? 'bg-amber-700 text-amber-100 hover:bg-amber-600' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          {state?.running ? <Pause size={10} /> : <Play size={10} />}
          {state?.running ? 'PAUSE' : 'PAUSED'}
        </button>
        {[1, 10, 60, 600].map((s) => (
          <button
            key={s}
            onClick={() => changeSpeed(s)}
            disabled={!state?.running}
            className={`px-2 py-0.5 rounded text-xs font-mono cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${state?.simSpeed === s && state?.running ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {s}x
          </button>
        ))}
        <button
          onClick={() => setShowResetConfirm(true)}
          title="Reset simulation"
          className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-gray-800 text-gray-400 hover:bg-red-900 hover:text-red-300 cursor-pointer"
        >
          <RotateCcw size={11} />
          RESET
        </button>
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
          {formatTPlus(new Date(state.timestamp).getTime(), getEngine().getSimulationStartTime())}
        </span>
      )}
    </header>
    </>
  );
}
