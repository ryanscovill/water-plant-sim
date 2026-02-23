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
}

export function ChemDoseControl({ tagId, currentSetpoint, currentActual, label, unit, min, max, step = 0.1 }: ChemDoseControlProps) {
  const [value, setValue] = useState(currentSetpoint);

  // Keep local value in sync with engine setpoint
  useEffect(() => {
    setValue(currentSetpoint);
  }, [currentSetpoint]);

  const apply = () => {
    getEngine().applyControl('setpoint', { tagId, value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
        <div className="bg-gray-900 rounded p-2">
          <div className="text-gray-500 text-xs">SETPOINT</div>
          <div className="text-yellow-300 font-bold">{currentSetpoint.toFixed(2)} {unit}</div>
        </div>
        <div className="bg-gray-900 rounded p-2">
          <div className="text-gray-500 text-xs">ACTUAL</div>
          <div className="text-green-300 font-bold">{currentActual.toFixed(2)} {unit}</div>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">{label}: {value.toFixed(2)} {unit}</label>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{min} {unit}</span>
          <span>{max} {unit}</span>
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
          className="px-4 py-1 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded font-semibold"
        >
          APPLY
        </button>
      </div>
    </div>
  );
}
