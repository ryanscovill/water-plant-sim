import { useState, useEffect } from 'react';
import { getEngine } from '../../simulation/engine';
import type { ValveStatus } from '../../types/process';

interface ValveControlProps {
  valveId: string;
  status: ValveStatus;
  label: string;
}

export function ValveControl({ valveId, status, label }: ValveControlProps) {
  const [position, setPosition] = useState(status.position);
  useEffect(() => {
    setPosition(status.position);
  }, [status.position]);

  const sendCommand = (command: string, value?: number) => {
    getEngine().applyControl('valve', { valveId, command, value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${status.fault ? 'bg-red-500 animate-flash' : status.open ? 'bg-green-400' : 'bg-gray-500'}`} />
        <span className="text-sm font-mono text-gray-300">
          {status.fault ? 'FAULT' : status.open ? `OPEN ${status.position}%` : 'CLOSED'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => sendCommand('open')}
          disabled={status.open && status.position === 100}
          className="px-3 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded font-semibold"
        >
          OPEN
        </button>
        <button
          onClick={() => sendCommand('close')}
          disabled={!status.open}
          className="px-3 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded font-semibold"
        >
          CLOSE
        </button>
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Position: {position}%</label>
        <input
          type="range" min="0" max="100" value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          onMouseUp={() => sendCommand('setPosition', position)}
          onTouchEnd={() => sendCommand('setPosition', position)}
          className="w-full accent-blue-500"
        />
      </div>

      <div className="text-xs text-gray-500 font-mono">
        <div>Tag: {label}</div>
        <div>ID: {valveId}</div>
      </div>
    </div>
  );
}
