import { useState, useEffect } from 'react';
import { X, FlaskConical, CheckCircle } from 'lucide-react';
import { getEngine } from '../../simulation/engine';

// Mirror the constants from CoagulationStage
const ALUM_TURBIDITY_RATIO = 0.12;
const MAX_COAG_REMOVAL = 0.85;
const MIXING_FACTOR = 1.2 * 1.1; // both rapid + slow mixers running (standard jar test)

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function computeFlocTurbidity(dose: number, rawTurbidity: number, tempFactor: number): number {
  const effectiveness = clamp((dose / (rawTurbidity * ALUM_TURBIDITY_RATIO)) * tempFactor, 0, 1);
  return clamp((rawTurbidity * (1 - MAX_COAG_REMOVAL * effectiveness)) / MIXING_FACTOR, 0.3, rawTurbidity);
}

function turbidityToWaterColor(ntu: number): string {
  if (ntu < 1) return 'rgba(180, 220, 230, 0.35)';
  if (ntu < 3) return 'rgba(170, 200, 190, 0.50)';
  if (ntu < 6) return 'rgba(185, 175, 130, 0.65)';
  if (ntu < 15) return 'rgba(175, 145, 80, 0.75)';
  if (ntu < 40) return 'rgba(155, 110, 45, 0.88)';
  return 'rgba(120, 75, 18, 0.96)';
}

function turbidityToSedimentHeight(ntu: number): number {
  // sediment layer at bottom of jar, as % of jar height
  return clamp(Math.sqrt(ntu) * 3.5, 2, 35);
}

interface JarTestModalProps {
  rawTurbidity: number;
  sourceTemperature: number;
  currentSetpoint: number;
  onClose: () => void;
}

export function JarTestModal({ rawTurbidity, sourceTemperature, currentSetpoint, onClose }: JarTestModalProps) {
  useEffect(() => {
    getEngine().pause();
    return () => { getEngine().resume(); };
  }, []);

  const tempFactor = clamp((sourceTemperature - 1) / 19, 0.35, 1.0);

  // Generate 6 doses spanning from under-dose to over-dose relative to the theoretical optimum.
  // Optimal effectiveness = 1 at dose = rawTurbidity * ALUM_TURBIDITY_RATIO / tempFactor
  const theoreticalOptDose = clamp((rawTurbidity * ALUM_TURBIDITY_RATIO) / tempFactor, 2, 70);

  const rawDoses = [
    theoreticalOptDose * 0.25,
    theoreticalOptDose * 0.50,
    theoreticalOptDose * 0.75,
    theoreticalOptDose * 1.00,
    theoreticalOptDose * 1.30,
    theoreticalOptDose * 1.60,
  ].map(d => Math.round(clamp(d, 1, 80) * 2) / 2); // round to nearest 0.5

  // Deduplicate while preserving order
  const seen = new Set<number>();
  const doses = rawDoses.filter(d => { if (seen.has(d)) return false; seen.add(d); return true; });

  const jars = doses.map(dose => ({
    dose,
    flocTurb: computeFlocTurbidity(dose, rawTurbidity, tempFactor),
  }));

  // Recommend: lowest dose that gets floc turbidity < 5 NTU;
  // if none qualifies, pick the jar with the lowest turbidity.
  const TARGET_NTU = 5;
  const qualifying = jars.filter(j => j.flocTurb < TARGET_NTU);
  const recommended = qualifying.length > 0
    ? qualifying[0]
    : jars.reduce((best, j) => j.flocTurb < best.flocTurb ? j : best, jars[0]);

  const [selectedDose, setSelectedDose] = useState<number>(recommended.dose);

  const handleApply = () => {
    getEngine().applyControl('setpoint', { tagId: 'alumDoseSetpoint', value: selectedDose });
    onClose();
  };

  const selectedJar = jars.find(j => j.dose === selectedDose);

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full shadow-2xl"
        style={{ maxWidth: '640px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <FlaskConical size={16} className="text-purple-400" />
            <h2 className="text-white font-bold text-sm font-mono tracking-wider">JAR TEST — ALUM DOSE OPTIMIZATION</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white p-2 rounded hover:bg-gray-700 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current conditions */}
        <div className="px-5 py-2.5 bg-gray-800/60 border-b border-gray-700 flex flex-wrap gap-x-6 gap-y-1">
          <div className="text-xs font-mono">
            <span className="text-gray-500">RAW TURBIDITY</span>
            <span className="text-cyan-300 ml-2 font-semibold">{rawTurbidity.toFixed(1)} NTU</span>
          </div>
          <div className="text-xs font-mono">
            <span className="text-gray-500">TEMPERATURE</span>
            <span className="text-cyan-300 ml-2 font-semibold">{sourceTemperature.toFixed(1)} °C</span>
          </div>
          <div className="text-xs font-mono">
            <span className="text-gray-500">COAG EFFICIENCY</span>
            <span className="text-cyan-300 ml-2 font-semibold">{(tempFactor * 100).toFixed(0)}%</span>
          </div>
          <div className="text-xs font-mono">
            <span className="text-gray-500">CURRENT DOSE</span>
            <span className="text-amber-300 ml-2 font-semibold">{currentSetpoint.toFixed(1)} mg/L</span>
          </div>
        </div>

        {/* Jar display */}
        <div className="px-5 pt-5 pb-3">
          <div className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-4">
            Simulated Settling Results — click a jar to select
          </div>
          <div className="flex gap-2 justify-center">
            {jars.map((jar, i) => {
              const isRecommended = jar.dose === recommended.dose;
              const isSelected = jar.dose === selectedDose;
              const meetsTarget = jar.flocTurb < TARGET_NTU;
              const waterColor = turbidityToWaterColor(jar.flocTurb);
              const sedHeight = turbidityToSedimentHeight(jar.flocTurb);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDose(jar.dose)}
                  className={`flex flex-col items-center rounded-lg pt-2 pb-2 px-2 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-900/25 shadow-lg shadow-blue-900/30'
                      : isRecommended
                      ? 'border-green-600/60 bg-green-900/10 hover:border-green-500'
                      : 'border-gray-700 hover:border-gray-500 bg-transparent'
                  }`}
                  title={`Dose: ${jar.dose} mg/L → ${jar.flocTurb.toFixed(1)} NTU`}
                >
                  {/* Recommended badge */}
                  <div className="h-4 flex items-center justify-center mb-1">
                    {isRecommended && (
                      <CheckCircle size={12} className="text-green-400" />
                    )}
                  </div>

                  {/* Beaker SVG */}
                  <svg width="44" height="72" viewBox="0 0 44 72">
                    {/* Beaker body outline */}
                    <path
                      d="M8,4 L8,60 Q8,66 14,66 L30,66 Q36,66 36,60 L36,4 Z"
                      fill="#0f172a"
                      stroke="#4b5563"
                      strokeWidth="1.5"
                    />
                    {/* Beaker rim / lip */}
                    <rect x="5" y="2" width="34" height="4" rx="1" fill="#374151" stroke="#4b5563" strokeWidth="1" />

                    {/* Water fill - clip to beaker shape */}
                    <clipPath id={`jar-clip-${i}`}>
                      <path d="M9,6 L9,60 Q9,65 14,65 L30,65 Q35,65 35,60 L35,6 Z" />
                    </clipPath>

                    {/* Main water body */}
                    <rect
                      x="9" y="6"
                      width="26" height="59"
                      fill={waterColor}
                      clipPath={`url(#jar-clip-${i})`}
                    />

                    {/* Sediment layer at bottom */}
                    <rect
                      x="9"
                      y={65 - sedHeight * 0.59}
                      width="26"
                      height={sedHeight * 0.59}
                      fill="rgba(100, 65, 15, 0.82)"
                      clipPath={`url(#jar-clip-${i})`}
                    />

                    {/* Settled/clear water interface line */}
                    {meetsTarget && (
                      <line
                        x1="9" y1={65 - sedHeight * 0.59 - 1}
                        x2="35" y2={65 - sedHeight * 0.59 - 1}
                        stroke="rgba(100, 220, 170, 0.5)"
                        strokeWidth="1"
                        clipPath={`url(#jar-clip-${i})`}
                      />
                    )}

                    {/* Jar number label */}
                    <text x="22" y="14" textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="monospace">{i + 1}</text>
                  </svg>

                  {/* Dose */}
                  <div className="text-xs font-mono font-bold text-gray-200 mt-1.5 leading-tight">
                    {jar.dose % 1 === 0 ? jar.dose.toFixed(0) : jar.dose.toFixed(1)}
                  </div>
                  <div className="text-xs font-mono text-gray-600 leading-tight">mg/L</div>

                  {/* Result turbidity */}
                  <div className={`text-xs font-mono font-bold mt-1.5 leading-tight ${
                    meetsTarget ? 'text-green-400' : jar.flocTurb < 15 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {jar.flocTurb.toFixed(1)}
                  </div>
                  <div className="text-xs font-mono text-gray-600 leading-tight">NTU</div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs font-mono text-gray-600">
            <span className="flex items-center gap-1">
              <CheckCircle size={10} className="text-green-400" /> Recommended
            </span>
            <span>
              Target: &lt;{TARGET_NTU} NTU settled
            </span>
            <span className="text-green-500">≥ target</span>
            <span className="text-yellow-500">marginal</span>
            <span className="text-red-500">under-treated</span>
          </div>
        </div>

        {/* Result summary */}
        {selectedJar && (
          <div className="mx-5 mb-4 px-3 py-2.5 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex gap-4">
                <span>
                  <span className="text-gray-500">Selected dose</span>
                  <span className="text-white font-bold ml-2">{selectedJar.dose.toFixed(1)} mg/L</span>
                </span>
                <span>
                  <span className="text-gray-500">Predicted floc turbidity</span>
                  <span className={`font-bold ml-2 ${selectedJar.flocTurb < TARGET_NTU ? 'text-green-400' : 'text-yellow-400'}`}>
                    {selectedJar.flocTurb.toFixed(2)} NTU
                  </span>
                </span>
              </div>
              {selectedJar.dose === recommended.dose && (
                <span className="text-green-400 font-bold">RECOMMENDED</span>
              )}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-5 pb-5 border-t border-gray-700 pt-4 flex items-center justify-between gap-3">
          <p className="text-gray-600 text-xs font-mono">
            Applies dose to COG-P-201 setpoint immediately.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded font-mono cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-mono cursor-pointer font-bold"
            >
              Apply {selectedDose % 1 === 0 ? selectedDose.toFixed(0) : selectedDose.toFixed(1)} mg/L
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
