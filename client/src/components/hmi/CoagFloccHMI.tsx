import { useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useAlarmStore } from '../../store/useAlarmStore';
import { Mixer } from './svg/Mixer';
import { Pipe } from './svg/Pipe';
import { ChemFeed } from './svg/ChemFeed';
import { AnalyzerTag } from './svg/AnalyzerTag';
import { EquipmentPanel, EmptyPanel } from '../equipment/EquipmentPanel';
import { PumpControl } from '../equipment/PumpControl';
import { ChemDoseControl } from '../equipment/ChemDoseControl';
import { InfoModal } from '../common/InfoModal';

function SvgInfo({ x, y, onClick }: { x: number; y: number; onClick: () => void }) {
  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ cursor: 'pointer' }}>
      <circle cx={x} cy={y} r={9} fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" opacity="0.95" />
      <text x={x} y={y + 4} textAnchor="middle" fill="#60a5fa" fontSize="12" fontFamily="sans-serif" fontWeight="bold">i</text>
    </g>
  );
}

export function CoagFloccHMI() {
  const state = useSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const [selected, setSelected] = useState<string | null>(null);
  const [infoKey, setInfoKey] = useState<string | null>(null);

  if (!state) return <div className="text-gray-500">Connecting...</div>;

  const { coagulation } = state;
  const getAlarm = (tag: string) => alarms.find((a) => a.tag === tag && a.active)?.priority ?? null;
  const flowing = state.intake.rawWaterFlow > 0.5;

  return (
    <div>
      <h2 className="text-gray-300 font-bold text-sm mb-3 font-mono">COAGULATION / FLOCCULATION</h2>
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0">
          <svg viewBox="0 0 720 320" width="100%" className="bg-gray-950 rounded border border-gray-800">
            <style>{`text[font-size="11"],tspan[font-size="11"]{font-size:11px}text[font-size="12"]{font-size:12px}text[font-size="13"]{font-size:13px}text[font-size="14"]{font-size:14px}`}</style>
            {/* Inlet */}
            <text x="20" y="165" fill="#4b5563" fontSize="13" fontFamily="monospace">FROM</text>
            <text x="20" y="175" fill="#4b5563" fontSize="13" fontFamily="monospace">INTAKE</text>
            <Pipe x1="70" y1="170" x2="140" y2="170" flowing={flowing} />

            {/* Rapid Mix Basin */}
            <rect x="140" y="110" width="120" height="120" rx="4" fill="#0f172a" stroke="#1d4ed8" strokeWidth="2" />
            <text x="200" y="128" textAnchor="middle" fill="#3b82f6" fontSize="12" fontFamily="monospace">RAPID MIX</text>
            <Mixer status={coagulation.rapidMixerStatus} label="M-201" id="hmi-rapidMixer"
              onClick={() => setSelected('rapidMixer')} x={200} y={175} size={25}
              selected={selected === 'rapidMixer'} />
            <SvgInfo x={254} y={113} onClick={() => setInfoKey('rapidMixer')} />
            <Pipe x1="260" y1="170" x2="320" y2="170" flowing={flowing} />

            {/* Slow Mix / Floc Basin */}
            <rect x="320" y="110" width="160" height="120" rx="4" fill="#0f172a" stroke="#1d4ed8" strokeWidth="2" />
            <text x="400" y="128" textAnchor="middle" fill="#3b82f6" fontSize="12" fontFamily="monospace">FLOCCULATION BASIN</text>
            <Mixer status={coagulation.slowMixerStatus} label="M-202" id="hmi-slowMixer"
              onClick={() => setSelected('slowMixer')} x={360} y={175} size={22}
              selected={selected === 'slowMixer'} />
            <Mixer status={coagulation.slowMixerStatus} label="M-203" x={440} y={175} size={22} />
            <SvgInfo x={474} y={113} onClick={() => setInfoKey('slowMixer')} />

            {/* Floc turbidity */}
            <AnalyzerTag tag="COG-AIT-001" value={coagulation.flocBasinTurbidity} unit="NTU"
              label="Floc Turbidity" id="hmi-flocTurbidity" x={400} y={255}
              alarm={getAlarm('COG-AIT-001')} />
            <SvgInfo x={400} y={225} onClick={() => setInfoKey('flocTurbidity')} />

            <Pipe x1="480" y1="170" x2="550" y2="170" flowing={flowing} />

            {/* Alum feed */}
            <ChemFeed status={coagulation.alumPumpStatus} doseRate={coagulation.alumDoseRate}
              unit="mg/L" label="ALUM" id="hmi-alumDose" onClick={() => setSelected('alumDose')} x={200} y={55}
              selected={selected === 'alumDose'} />
            <SvgInfo x={237} y={35} onClick={() => setInfoKey('alumFeed')} />
            {/* Feed line to rapid mix */}
            <Pipe x1="200" y1="90" x2="200" y2="110" flowing={coagulation.alumPumpStatus.running} color="#7c3aed" strokeWidth={3} />

            {/* pH adjust */}
            <ChemFeed status={coagulation.alumPumpStatus} doseRate={coagulation.pHAdjustDoseRate}
              unit="mg/L" label="pH ADJ" x={400} y={55} />
            <SvgInfo x={437} y={35} onClick={() => setInfoKey('pHAdjust')} />
            <Pipe x1="400" y1="90" x2="400" y2="110" flowing={coagulation.alumPumpStatus.running} color="#7c3aed" strokeWidth={3} />

            {/* Outlet */}
            <text x="570" y="165" fill="#4b5563" fontSize="13" fontFamily="monospace">TO</text>
            <text x="570" y="175" fill="#4b5563" fontSize="13" fontFamily="monospace">SEDIM.</text>
          </svg>
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 self-stretch">
          {selected === 'rapidMixer' && (
            <EquipmentPanel title="Rapid Mixer" tag="M-201" onClose={() => setSelected(null)} onInfo={() => setInfoKey('rapidMixer')}>
              <PumpControl pumpId="rapidMixer" status={coagulation.rapidMixerStatus} label="COG-M-201" />
            </EquipmentPanel>
          )}
          {selected === 'slowMixer' && (
            <EquipmentPanel title="Slow Mixer" tag="M-202" onClose={() => setSelected(null)} onInfo={() => setInfoKey('slowMixer')}>
              <PumpControl pumpId="slowMixer" status={coagulation.slowMixerStatus} label="COG-M-202" />
            </EquipmentPanel>
          )}
          {selected === 'alumDose' && (
            <EquipmentPanel title="Alum Chemical Feed" tag="COG-FIT-001" onClose={() => setSelected(null)} onInfo={() => setInfoKey('alumFeed')}>
              <PumpControl pumpId="alumPump" status={coagulation.alumPumpStatus} label="COG-P-201" />
              <div className="mt-4 border-t border-gray-700 pt-4">
                <ChemDoseControl tagId="alumDoseSetpoint" currentSetpoint={coagulation.alumDoseSetpoint}
                  currentActual={coagulation.alumDoseRate} label="Alum Dose" unit="mg/L" min={0} max={80} step={0.5} />
              </div>
            </EquipmentPanel>
          )}
          {!selected && <EmptyPanel />}
        </div>
      </div>

      {infoKey && <InfoModal infoKey={infoKey} onClose={() => setInfoKey(null)} />}
    </div>
  );
}
