import { useState, useEffect } from 'react';
import { getEngine } from '../../simulation/engine';
import type { EquipmentStatus } from '../../types/process';

interface PumpControlProps {
  pumpId: string;
  status: EquipmentStatus;
  label: string;
  showSpeedControl?: boolean;
}

export function PumpControl({ pumpId, status, label, showSpeedControl = true }: PumpControlProps) {
  const [speed, setSpeed] = useState(status.speed);
  // Keep slider in sync with engine-reported speed when not actively dragging
  useEffect(() => {
    setSpeed(status.speed);
  }, [status.speed]);

  const sendCommand = (command: string, value?: number) => {
    getEngine().applyControl('pump', { pumpId, command, value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${status.fault ? 'bg-red-500 animate-flash' : status.running ? 'bg-green-400' : 'bg-gray-500'}`} />
        <span className="text-sm font-mono text-gray-300">
          {status.fault ? 'FAULT' : status.running ? 'RUNNING' : 'STOPPED'}
        </span>
        <span className="text-xs text-gray-300 ml-auto">{status.runHours.toFixed(0)} hrs</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          id="ctrl-pump-start"
          onClick={() => sendCommand('start')}
          disabled={status.running && !status.fault}
          className="px-3 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded font-semibold cursor-pointer disabled:cursor-not-allowed"
        >
          START
        </button>
        <button
          onClick={() => sendCommand('stop')}
          disabled={!status.running}
          className="px-3 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded font-semibold cursor-pointer disabled:cursor-not-allowed"
        >
          STOP
        </button>
      </div>

      {showSpeedControl && (
        <div>
          <label className="text-xs text-gray-300 block mb-1">Speed: {speed}%</label>
          <input
            type="range" min="0" max="100" value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            onMouseUp={() => sendCommand('setSpeed', speed)}
            onTouchEnd={() => sendCommand('setSpeed', speed)}
            className="w-full accent-blue-500"
          />
        </div>
      )}

      <div className="text-xs text-gray-400 font-mono">
        <div>{label}</div>
      </div>
    </div>
  );
}
