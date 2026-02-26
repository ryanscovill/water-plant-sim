import { useState } from 'react';
import type React from 'react';
import { Info } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useAlarmStore } from '../../store/useAlarmStore';
import { Tank } from './svg/Tank';
import { Pipe } from './svg/Pipe';
import { ChemFeed } from './svg/ChemFeed';
import { AnalyzerTag } from './svg/AnalyzerTag';
import { EquipmentPanel, EmptyPanel, UnsavedChangesDialog } from '../equipment/EquipmentPanel';
import { PumpControl } from '../equipment/PumpControl';
import { ChemDoseControl } from '../equipment/ChemDoseControl';
import { InfoModal } from '../common/InfoModal';
import { PlantStagesGrid } from './OverviewHMI';

function SvgInfo({ x, y, onClick }: { x: number; y: number; onClick: () => void }) {
  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ cursor: 'pointer' }}>
      <circle cx={x} cy={y} r={9} fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" opacity="0.95" />
      <text x={x} y={y + 4} textAnchor="middle" fill="#60a5fa" fontSize="12" fontFamily="sans-serif" fontWeight="bold">i</text>
    </g>
  );
}

export function DisinfectionHMI() {
  const state = useSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const [selected, setSelected] = useState<string | null>(null);
  const [infoKey, setInfoKey] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingSelect, setPendingSelect] = useState<string | null | undefined>(undefined);

  if (!state) return <div className="text-gray-500">Connecting...</div>;

  const { disinfection } = state;
  const getAlarm = (tag: string) => alarms.find((a) => a.tag === tag && a.active)?.priority ?? null;
  const flowing = state.intake.rawWaterFlow > 0.5;

  const requestSelect = (key: string | null) => {
    if (isDirty && key !== selected) {
      setPendingSelect(key);
    } else {
      setSelected(key);
      setIsDirty(false);
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    let el: Element | null = e.target as Element;
    while (el && el !== e.currentTarget) {
      if (el.getAttribute('data-interactive') === 'true') return;
      el = el.parentElement;
    }
    requestSelect(null);
  };

  return (
    <div>
      <div className="mb-3">
        <PlantStagesGrid activeStage="DISINFECTION" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-gray-300 font-bold text-sm font-mono">DISINFECTION / CLEARWELL</h2>
        <button onClick={() => setInfoKey('disinfectionPage')} className="text-blue-400 hover:text-blue-300 p-0.5 rounded hover:bg-gray-800 cursor-pointer" title="About this screen">
          <Info size={14} />
        </button>
      </div>
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0">
          <svg viewBox="0 0 720 320" width="100%" className="bg-gray-950 rounded border border-gray-800 max-h-[58vh]" onClick={handleSvgClick}>
            <style>{`text[font-size="11"],tspan[font-size="11"]{font-size:11px}text[font-size="12"]{font-size:12px}text[font-size="13"]{font-size:13px}text[font-size="14"]{font-size:14px}`}</style>
            {/* Inlet */}
            <text x="10" y="165" fill="#4b5563" fontSize="13" fontFamily="monospace">FROM</text>
            <text x="10" y="175" fill="#4b5563" fontSize="13" fontFamily="monospace">FILTER</text>
            <Pipe x1="60" y1="170" x2="80" y2="170" flowing={flowing} />

            {/* Chlorine feed */}
            <ChemFeed status={disinfection.chlorinePumpStatus} doseRate={disinfection.chlorineDoseRate}
              unit="mg/L" label="CHLORINE" id="hmi-chlorineDose" onClick={() => requestSelect('chlorine')} x={140} y={55}
              selected={selected === 'chlorine'} />
            <SvgInfo x={156} y={27} onClick={() => setInfoKey('chlorineFeed')} />
            <Pipe x1="140" y1="75" x2="140" y2="150" flowing={disinfection.chlorinePumpStatus.running} color="#6d28d9" strokeWidth={3} />

            {/* Contact chamber */}
            <rect x="80" y="150" width="240" height="60" rx="4" fill="#0c1a2e" stroke="#1d4ed8" strokeWidth="2" />
            <text x="235" y="175" textAnchor="middle" fill="#3b82f6" fontSize="13" fontFamily="monospace">CONTACT CHAMBER</text>
            <SvgInfo x={313} y={153} onClick={() => setInfoKey('contactChamber')} />

            {/* UV indicator — left side of chamber to avoid label overlap */}
            <rect x="83" y="160" width="44" height="30" rx="2"
              fill={disinfection.uvSystemStatus.running ? '#fbbf24' : '#374151'} opacity="0.3" />
            <text x="105" y="178" textAnchor="middle" fill={disinfection.uvSystemStatus.running ? '#fbbf24' : '#6b7280'} fontSize="11">UV</text>
            <SvgInfo x={125} y={163} onClick={() => setInfoKey('uvSystem')} />

            <Pipe x1="320" y1="170" x2="360" y2="170" flowing={flowing} />

            {/* Cl2 residual at plant — below pipe to avoid overlap with chem feeds */}
            <AnalyzerTag tag="DIS-AIT-001" value={disinfection.chlorineResidualPlant} unit="mg/L"
              label="Plant Cl2 Res." id="hmi-chlorineResidual" x={250} y={235}
              alarm={getAlarm('DIS-AIT-001')} />
            <SvgInfo x={307} y={217} onClick={() => setInfoKey('plantChlorineResidual')} />

            {/* Clearwell */}
            <Tank
              id="hmi-clearwell"
              level={(disinfection.clearwellLevel / 6.1) * 100}
              maxLevel={6.1}
              currentLevel={disinfection.clearwellLevel}
              unit="m"
              label="CLEARWELL"
              x={360}
              y={110}
              width={70}
              height={100}
            />
            <SvgInfo x={428} y={113} onClick={() => setInfoKey('clearwell')} />

            {/* pH — positioned right of clearwell */}
            <AnalyzerTag tag="DIS-AIT-003" value={disinfection.finishedWaterPH} unit=""
              label="Finished pH" id="hmi-finishedPH" x={523} y={130}
              alarm={getAlarm('DIS-AIT-003')} decimals={2} />
            <SvgInfo x={580} y={112} onClick={() => setInfoKey('finishedPH')} />

            {/* Distribution outlet */}
            <Pipe x1="430" y1="170" x2="600" y2="170" flowing={flowing} />
            <g data-interactive="true" onClick={() => requestSelect('distribution')} style={{ cursor: 'pointer' }}>
              <rect x="597" y="147" width="82" height="46" rx="5" fill="transparent" stroke="#22d3ee"
                strokeWidth="2.5" strokeDasharray="5,3" className="interactive-ring" />
              <rect x="600" y="150" width="76" height="40" rx="4"
                fill={selected === 'distribution' ? '#1e3a5f' : '#0f172a'} />
              <text x="638" y="166" textAnchor="middle" fill={selected === 'distribution' ? '#93c5fd' : '#9ca3af'} fontSize="11" fontFamily="monospace">DIST.</text>
              <text x="638" y="179" textAnchor="middle" fill={selected === 'distribution' ? '#93c5fd' : '#9ca3af'} fontSize="11" fontFamily="monospace">SYSTEM</text>
            </g>

            {/* Dist Cl2 — vertically aligned with Finished pH */}
            <AnalyzerTag tag="DIS-AIT-002" value={disinfection.chlorineResidualDist} unit="mg/L"
              label="Dist Cl2 Res." id="hmi-distChlorine" x={583} y={245}
              alarm={getAlarm('DIS-AIT-002')} />
            <SvgInfo x={640} y={227} onClick={() => setInfoKey('distChlorineResidual')} />
          </svg>
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 self-stretch">
          {selected === 'chlorine' && (
            <EquipmentPanel title="Chlorine Feed System" tag="DIS-AIT-001" onClose={() => requestSelect(null)} onInfo={() => setInfoKey('chlorineFeed')}>
              <PumpControl pumpId="chlorinePump" status={disinfection.chlorinePumpStatus} label="DIS-P-401" />
              <div className="mt-4 border-t border-gray-700 pt-4">
                <ChemDoseControl tagId="chlorineDoseSetpoint" currentSetpoint={disinfection.chlorineDoseSetpoint}
                  currentActual={disinfection.chlorineDoseRate} label="Chlorine Dose" unit="mg/L" min={0} max={10} step={0.1}
                  onDirtyChange={setIsDirty} />
              </div>
            </EquipmentPanel>
          )}
          {selected === 'distribution' && (
            <EquipmentPanel title="Distribution System" tag="DIS-FIC-001" onClose={() => requestSelect(null)}>
              <div className="text-xs text-gray-400 font-mono mb-4">
                Simulated outflow demand to the distribution network. Increasing demand drains the clearwell faster; decreasing demand allows it to fill.
              </div>
              <ChemDoseControl tagId="distributionDemand" currentSetpoint={disinfection.distributionDemand}
                currentActual={disinfection.distributionDemand} label="Distribution Demand" unit="MGD" min={0} max={6} step={0.1}
                onDirtyChange={setIsDirty} />
            </EquipmentPanel>
          )}
          {!selected && <EmptyPanel />}
        </div>
      </div>

      {infoKey && <InfoModal infoKey={infoKey} onClose={() => setInfoKey(null)} />}
      {pendingSelect !== undefined && (
        <UnsavedChangesDialog
          onDiscard={() => { setSelected(pendingSelect ?? null); setIsDirty(false); setPendingSelect(undefined); }}
          onCancel={() => setPendingSelect(undefined)}
        />
      )}
    </div>
  );
}
