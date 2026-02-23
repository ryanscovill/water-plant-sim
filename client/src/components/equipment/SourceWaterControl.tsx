import { useState, useEffect } from 'react';
import { getEngine } from '../../simulation/engine';
import type { IntakeState } from '../../types/process';

interface ParamRowProps {
  tagId: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  accentClass?: string;
  hint?: string;
}

function ParamRow({ tagId, label, unit, value, min, max, step, decimals = 1, accentClass = 'accent-cyan-500', hint }: ParamRowProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => { setLocal(value); }, [value]);

  const apply = () => getEngine().applyControl('setpoint', { tagId, value: local });

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-mono">{label}</span>
        <span className="text-xs text-gray-300 font-mono font-bold">{local.toFixed(decimals)} {unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range" min={min} max={max} step={step} value={local}
          onChange={(e) => setLocal(Number(e.target.value))}
          onMouseUp={apply}
          onTouchEnd={apply}
          className={`flex-1 ${accentClass}`}
        />
        <button
          onClick={apply}
          className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded font-mono"
        >
          SET
        </button>
      </div>
      <div className="flex justify-between text-xs text-gray-600 font-mono">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
      {hint && <p className="text-xs text-gray-600 italic">{hint}</p>}
    </div>
  );
}

interface SourceWaterControlProps {
  intake: IntakeState;
}

export function SourceWaterControl({ intake }: SourceWaterControlProps) {
  return (
    <div className="space-y-5">
      {/* Live readings */}
      <div>
        <div className="text-xs text-gray-500 font-mono uppercase mb-2">Current Readings</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-900 rounded p-2">
            <div className="text-gray-500 text-xs font-mono">TURBIDITY</div>
            <div className="text-cyan-300 font-bold text-sm font-mono">{intake.rawTurbidity.toFixed(1)} NTU</div>
          </div>
          <div className="bg-gray-900 rounded p-2">
            <div className="text-gray-500 text-xs font-mono">FLOW</div>
            <div className="text-cyan-300 font-bold text-sm font-mono">{intake.rawWaterFlow.toFixed(2)} MGD</div>
          </div>
          <div className="bg-gray-900 rounded p-2">
            <div className="text-gray-500 text-xs font-mono">WET WELL</div>
            <div className="text-cyan-300 font-bold text-sm font-mono">{intake.rawWaterLevel.toFixed(1)} ft</div>
          </div>
          <div className="bg-gray-900 rounded p-2">
            <div className="text-gray-500 text-xs font-mono">SCREEN ΔP</div>
            <div className={`font-bold text-sm font-mono ${intake.screenDiffPressure > 5 ? 'text-amber-400' : 'text-cyan-300'}`}>
              {intake.screenDiffPressure.toFixed(1)} PSI
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4 space-y-4">
        <div className="text-xs text-gray-500 font-mono uppercase">Source Water Parameters</div>

        <ParamRow
          tagId="sourceTurbidityBase"
          label="Base Turbidity"
          unit="NTU"
          value={intake.sourceTurbidityBase}
          min={1} max={300} step={1}
          decimals={0}
          accentClass="accent-amber-500"
          hint="Average river turbidity. Drives alum dose demand."
        />

        <ParamRow
          tagId="sourceTemperature"
          label="Water Temperature"
          unit="°C"
          value={intake.sourceTemperature}
          min={0} max={30} step={0.5}
          decimals={1}
          accentClass="accent-blue-400"
          hint="Cold water (<10 °C) reduces coagulation efficiency."
        />

        <ParamRow
          tagId="sourcePH"
          label="Source pH"
          unit="S.U."
          value={intake.sourcePH}
          min={5.0} max={9.0} step={0.1}
          decimals={1}
          accentClass="accent-green-500"
          hint="Optimal coagulation range: 6.5–7.5. High pH may require acid addition."
        />

        <ParamRow
          tagId="sourceColor"
          label="Apparent Color"
          unit="PCU"
          value={intake.sourceColor}
          min={0} max={100} step={1}
          decimals={0}
          accentClass="accent-yellow-500"
          hint="Indicates organic load and DBP precursor potential."
        />

        <ParamRow
          tagId="naturalInflow"
          label="River Inflow Rate"
          unit=""
          value={intake.naturalInflow}
          min={0.01} max={0.20} step={0.01}
          decimals={2}
          accentClass="accent-cyan-500"
          hint="Controls how fast the wet well fills from the river."
        />
      </div>
    </div>
  );
}
