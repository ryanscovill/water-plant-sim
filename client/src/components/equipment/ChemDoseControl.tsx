import { useState, useEffect } from 'react';
import { getEngine } from '../../simulation/engine';

interface ChemDoseControlProps {
  tagId: string;
  currentSetpoint: number;
  currentActual: number;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onDirtyChange?: (dirty: boolean) => void;
}

export function ChemDoseControl({ tagId, currentSetpoint, currentActual, label, unit, min, max, step = 0.1, onDirtyChange }: ChemDoseControlProps) {
  const [value, setValue] = useState(currentSetpoint);

  // Keep local value in sync with engine setpoint
  useEffect(() => {
    setValue(currentSetpoint);
  }, [currentSetpoint]);

  const dirty = value !== currentSetpoint;

  // Notify parent when dirty state changes
  useEffect(() => {
    onDirtyChange?.(dirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty]);

  const apply = () => {
    getEngine().applyControl('setpoint', { tagId, value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
        <div className="bg-gray-900 rounded p-2">
          <div className="text-gray-300 text-xs">SETPOINT</div>
          <div className="text-yellow-300 font-bold">{currentSetpoint.toFixed(2)} {unit}</div>
        </div>
        <div className="bg-gray-900 rounded p-2">
          <div className="text-gray-300 text-xs">ACTUAL</div>
          <div className="text-green-300 font-bold">{currentActual.toFixed(2)} {unit}</div>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-300 block mb-1">
          {label}: <span className={dirty ? 'text-yellow-300' : ''}>{value.toFixed(2)} {unit}</span>
        </label>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-400">{min} {unit}</span>
          <span className="text-gray-400">{max} {unit}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="number" min={min} max={max} step={step} value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm font-mono"
        />
        <button
          onClick={apply}
          disabled={!dirty}
          className={`px-4 py-1 text-sm rounded font-semibold cursor-pointer disabled:cursor-not-allowed transition-colors ${
            dirty
              ? 'bg-purple-700 hover:bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-500'
          }`}
        >
          APPLY
        </button>
      </div>
    </div>
  );
}
