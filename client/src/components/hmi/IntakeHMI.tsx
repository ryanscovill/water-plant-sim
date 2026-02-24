import { useState } from 'react';
import type React from 'react';
import { Info } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useAlarmStore } from '../../store/useAlarmStore';
import { Pump } from './svg/Pump';
import { Valve } from './svg/Valve';
import { Tank } from './svg/Tank';
import { Pipe } from './svg/Pipe';
import { FlowMeter } from './svg/FlowMeter';
import { AnalyzerTag } from './svg/AnalyzerTag';
import { EquipmentPanel, EmptyPanel } from '../equipment/EquipmentPanel';
import { PumpControl } from '../equipment/PumpControl';
import { ValveControl } from '../equipment/ValveControl';
import { SourceWaterControl } from '../equipment/SourceWaterControl';
import { InfoModal } from '../common/InfoModal';
import { PlantStagesGrid } from './OverviewHMI';
import { getEngine } from '../../simulation/engine';

function SvgInfo({ x, y, onClick }: { x: number; y: number; onClick: () => void }) {
  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ cursor: 'pointer' }}>
      <circle cx={x} cy={y} r={9} fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" opacity="0.95" />
      <text x={x} y={y + 4} textAnchor="middle" fill="#60a5fa" fontSize="12" fontFamily="sans-serif" fontWeight="bold">i</text>
    </g>
  );
}

export function IntakeHMI() {
  const state = useSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const [selected, setSelected] = useState<string | null>(null);
  const [infoKey, setInfoKey] = useState<string | null>(null);

  if (!state) return <div className="text-gray-500">Connecting...</div>;

  const { intake } = state;

  const getAlarm = (tag: string) => alarms.find((a) => a.tag === tag && a.active)?.priority ?? null;

  const clearScreen = () => getEngine().applyControl('setpoint', { tagId: 'clearScreen', value: 1 });

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    let el: Element | null = e.target as Element;
    while (el && el !== e.currentTarget) {
      if (el.getAttribute('data-interactive') === 'true') return;
      el = el.parentElement;
    }
    setSelected(null);
  };

  return (
    <div>
      <div className="mb-3">
        <PlantStagesGrid activeStage="INTAKE" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-gray-300 font-bold text-sm font-mono">INTAKE — RAW WATER SUPPLY</h2>
        <button onClick={() => setInfoKey('intakePage')} className="text-blue-400 hover:text-blue-300 p-0.5 rounded hover:bg-gray-800 cursor-pointer" title="About this screen">
          <Info size={14} />
        </button>
      </div>
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0">
          <svg viewBox="0 0 720 320" width="100%" className="bg-gray-950 rounded border border-gray-800 max-h-[58vh]" onClick={handleSvgClick}>
            <style>{`text[font-size="11"],tspan[font-size="11"]{font-size:11px}text[font-size="12"]{font-size:12px}text[font-size="13"]{font-size:13px}text[font-size="14"]{font-size:14px}`}</style>
            {/* Source — clickable to open source water quality panel */}
            <g data-interactive="true" data-selected={selected === 'source' ? 'true' : undefined} style={{ cursor: 'pointer' }} onClick={() => setSelected('source')}>
              <rect x="8" y="140" width="62" height="36" rx="4" fill="transparent" stroke="#22d3ee"
                strokeWidth="1.5" strokeDasharray="5,3" className="interactive-ring" />
              <text x="39" y="155" textAnchor="middle" fill="#4b5563" fontSize="14" fontFamily="monospace">RIVER</text>
              <text x="39" y="169" textAnchor="middle" fill="#4b5563" fontSize="14" fontFamily="monospace">SOURCE</text>
            </g>
            <SvgInfo x={67} y={143} onClick={() => setInfoKey('sourceWater')} />

            {/* Pipes */}
            <Pipe x1="80" y1="160" x2="201" y2="160" flowing={intake.rawWaterFlow > 0.5} />
            <Pipe x1="229" y1="160" x2="270" y2="160" flowing={intake.rawWaterFlow > 0.5} />
            {/* Split: up to P-101, down to P-102 */}
            <Pipe x1="270" y1="160" x2="270" y2="100" flowing={intake.intakePump1.running} />
            <Pipe x1="270" y1="160" x2="270" y2="220" flowing={intake.intakePump2.running} />
            <Pipe x1="270" y1="100" x2="277" y2="100" flowing={intake.intakePump1.running} />
            <Pipe x1="270" y1="220" x2="277" y2="220" flowing={intake.intakePump2.running} />
            {/* Rejoin after pumps */}
            <Pipe x1="313" y1="100" x2="313" y2="160" flowing={intake.intakePump1.running} />
            <Pipe x1="313" y1="220" x2="313" y2="160" flowing={intake.intakePump2.running} />
            <Pipe x1="313" y1="160" x2="397" y2="160" flowing={intake.intakePump1.running || intake.intakePump2.running} />
            <Pipe x1="443" y1="160" x2="470" y2="160" flowing={intake.rawWaterFlow > 0.5} />
            <Pipe x1="520" y1="160" x2="660" y2="160" flowing={intake.rawWaterFlow > 0.5} />

            {/* Wet well (source tank) */}
            <Tank
              level={(intake.rawWaterLevel / 15) * 100}
              maxLevel={15}
              currentLevel={intake.rawWaterLevel}
              unit="ft"
              label="WET WELL"
              x={110}
              y={100}
              width={55}
              height={80}
            />
            <SvgInfo x={158} y={103} onClick={() => setInfoKey('wetWell')} />

            {/* Inlet valve */}
            <Valve
              status={intake.intakeValve}
              label="XV-101"
              id="hmi-intakeValve"
              onClick={() => setSelected('intakeValve')}
              x={215}
              y={160}
              selected={selected === 'intakeValve'}
            />
            <SvgInfo x={230} y={136} onClick={() => setInfoKey('intakeValve')} />

            {/* Pumps */}
            <Pump
              status={intake.intakePump1}
              label="P-101"
              id="hmi-intakePump1"
              onClick={() => setSelected('pump1')}
              x={295}
              y={100}
              selected={selected === 'pump1'}
            />
            <SvgInfo x={314} y={80} onClick={() => setInfoKey('intakePump1')} />
            <Pump
              status={intake.intakePump2}
              label="P-102"
              id="hmi-intakePump2"
              onClick={() => setSelected('pump2')}
              x={295}
              y={220}
              selected={selected === 'pump2'}
            />
            <SvgInfo x={314} y={200} onClick={() => setInfoKey('intakePump2')} />

            {/* Screen diff pressure */}
            <g id="hmi-screenDP" onClick={() => setSelected('screen')} style={{ cursor: 'pointer' }} data-interactive="true" data-selected={selected === 'screen' ? 'true' : undefined}>
              <rect x="391" y="127" width="58" height="34" rx="5" fill="transparent" stroke="#22d3ee"
                strokeWidth="1.5" strokeDasharray="5,3" className="interactive-ring" />
              <rect x="394" y="130" width="52" height="28" rx="3" fill="#111827" stroke={intake.screenDiffPressure > 5 ? '#f59e0b' : '#374151'} strokeWidth="1.5" />
              <text x="420" y="142" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">SCR</text>
              <text x="420" y="153" textAnchor="middle" fill={intake.screenDiffPressure > 5 ? '#f59e0b' : '#9ca3af'} fontSize="11" fontFamily="monospace">
                {intake.screenDiffPressure.toFixed(1)} PSI
              </text>
            </g>
            <SvgInfo x={440} y={130} onClick={() => setInfoKey('intakeScreen')} />

            {/* Flow meter */}
            <FlowMeter
              value={intake.rawWaterFlow}
              unit="MGD"
              tag="INT-FIT-001"
              id="hmi-rawFlow"
              x={490}
              y={160}
              alarm={getAlarm('INT-FIT-001')}
            />
            <SvgInfo x={511} y={139} onClick={() => setInfoKey('rawFlowMeter')} />

            {/* Turbidity analyzer */}
            <AnalyzerTag
              tag="INT-AIT-001"
              value={intake.rawTurbidity}
              unit="NTU"
              label="Raw Turbidity"
              id="hmi-rawTurbidity"
              x={590}
              y={115}
              alarm={getAlarm('INT-AIT-001')}
            />
            <SvgInfo x={647} y={97} onClick={() => setInfoKey('rawTurbidity')} />

            {/* To treatment label */}
            <text x="665" y="163" fill="#4b5563" fontSize="14" fontFamily="monospace">TO</text>
            <text x="665" y="174" fill="#4b5563" fontSize="14" fontFamily="monospace">COAG</text>
          </svg>
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 self-stretch">
          {selected === 'pump1' && (
            <EquipmentPanel title="Intake Pump 1" tag="P-101" onClose={() => setSelected(null)} onInfo={() => setInfoKey('intakePump1')}>
              <PumpControl pumpId="intakePump1" status={intake.intakePump1} label="INT-P-101" />
            </EquipmentPanel>
          )}
          {selected === 'pump2' && (
            <EquipmentPanel title="Intake Pump 2" tag="P-102" onClose={() => setSelected(null)} onInfo={() => setInfoKey('intakePump2')}>
              <PumpControl pumpId="intakePump2" status={intake.intakePump2} label="INT-P-102" />
            </EquipmentPanel>
          )}
          {selected === 'intakeValve' && (
            <EquipmentPanel title="Intake Valve" tag="XV-101" onClose={() => setSelected(null)} onInfo={() => setInfoKey('intakeValve')}>
              <ValveControl valveId="intakeValve" status={intake.intakeValve} label="INT-XV-101" />
            </EquipmentPanel>
          )}
          {selected === 'screen' && (
            <EquipmentPanel title="Intake Screen" tag="INT-SCR-001" onClose={() => setSelected(null)} onInfo={() => setInfoKey('intakeScreen')}>
              <div className="space-y-4">
                <div className="bg-gray-900 rounded p-3 flex justify-between items-center">
                  <span className="text-gray-400 text-xs font-mono">DIFF PRESSURE</span>
                  <span className={`text-sm font-mono font-bold ${intake.screenDiffPressure > 5 ? 'text-amber-400' : 'text-gray-200'}`}>
                    {intake.screenDiffPressure.toFixed(1)} PSI
                  </span>
                </div>
                <div className="bg-gray-900 rounded p-3 flex justify-between items-center">
                  <span className="text-gray-400 text-xs font-mono">STATUS</span>
                  <span className={`text-xs font-mono font-bold ${intake.screenDiffPressure > 5 ? 'text-amber-400' : 'text-green-400'}`}>
                    {intake.screenDiffPressure > 5 ? 'PLUGGED' : 'NORMAL'}
                  </span>
                </div>
                <button
                  onClick={clearScreen}
                  className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-mono font-bold rounded cursor-pointer"
                >
                  CLEAR SCREEN
                </button>
              </div>
            </EquipmentPanel>
          )}
          {selected === 'source' && (
            <EquipmentPanel title="Source Water Quality" tag="INT-SRC-001" onClose={() => setSelected(null)} onInfo={() => setInfoKey('sourceWater')}>
              <SourceWaterControl intake={intake} />
            </EquipmentPanel>
          )}
          {!selected && <EmptyPanel />}
        </div>
      </div>

      {infoKey && <InfoModal infoKey={infoKey} onClose={() => setInfoKey(null)} />}
    </div>
  );
}
