import { useState } from 'react';
import type React from 'react';
import { useWWSimulationStore } from '../../../store/useWWSimulationStore';
import { useAlarmStore } from '../../../store/useAlarmStore';
import { ChemFeed } from '../svg/ChemFeed';
import { Pipe } from '../svg/Pipe';
import { AnalyzerTag } from '../svg/AnalyzerTag';
import { EquipmentPanel, EmptyPanel, UnsavedChangesDialog } from '../../equipment/EquipmentPanel';
import { WWPumpControl } from '../../equipment/WWPumpControl';
import { WWChemDoseControl } from '../../equipment/WWChemDoseControl';
import { WWPlantStagesGrid } from './WWPlantStagesGrid';

export function WWDisinfectionHMI() {
  const state = useWWSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const [selected, setSelected] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingSelect, setPendingSelect] = useState<string | null | undefined>(undefined);

  if (!state) return <div className="text-gray-500">Connecting...</div>;

  const { wwDisinfection, headworks } = state;
  const getAlarm = (tag: string) => alarms.find((a) => a.tag === tag && a.active)?.priority ?? null;
  const flowing = headworks.influentFlow > 0.5;

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
        <WWPlantStagesGrid activeStage="DISINFECTION" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-gray-300 font-bold text-sm font-mono">WW DISINFECTION / DECHLORINATION</h2>
      </div>
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0">
          <svg viewBox="0 0 720 340" width="100%" className="bg-gray-950 rounded border border-gray-800 max-h-[58vh]" onClick={handleSvgClick}>
            <style>{`text[font-size="11"],tspan[font-size="11"]{font-size:11px}text[font-size="12"]{font-size:12px}text[font-size="13"]{font-size:13px}text[font-size="14"]{font-size:14px}`}</style>

            {/* Inlet from secondary */}
            <text x="10" y="145" fill="#4b5563" fontSize="13" fontFamily="monospace">FROM</text>
            <text x="10" y="157" fill="#4b5563" fontSize="13" fontFamily="monospace">SEC.</text>
            <Pipe x1="55" y1="150" x2="80" y2="150" flowing={flowing} />

            {/* Chlorine feed */}
            <ChemFeed
              status={wwDisinfection.chlorinePump}
              doseRate={wwDisinfection.chlorineDoseRate}
              unit="mg/L"
              label="CHLORINE"
              id="hmi-wwChlorineDose"
              onClick={() => requestSelect('chlorine')}
              x={140}
              y={45}
              selected={selected === 'chlorine'}
            />
            <Pipe x1="140" y1="65" x2="140" y2="130" flowing={wwDisinfection.chlorinePump.running} color="#6d28d9" strokeWidth={3} />

            {/* Contact chamber (baffled basin) */}
            <rect x="80" y="130" width="260" height="60" rx="4" fill="#0c1a2e" stroke="#06b6d4" strokeWidth="2" />
            {/* Internal baffles */}
            <line x1="150" y1="130" x2="150" y2="175" stroke="#1e3a5f" strokeWidth="1.5" />
            <line x1="220" y1="155" x2="220" y2="190" stroke="#1e3a5f" strokeWidth="1.5" />
            <line x1="270" y1="130" x2="270" y2="175" stroke="#1e3a5f" strokeWidth="1.5" />
            <text x="210" y="157" textAnchor="middle" fill="#06b6d4" fontSize="13" fontFamily="monospace">CONTACT CHAMBER</text>

            {/* Contact time display */}
            <g>
              <rect x="90" y="195" width="80" height="30" rx="3" fill="#111827" />
              <text x="130" y="210" textAnchor="middle" fill="#22d3ee" fontSize="12" fontFamily="monospace" fontWeight="bold">
                {wwDisinfection.chlorineContactTime.toFixed(0)} min
              </text>
              <text x="130" y="222" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">Contact Time</text>
            </g>

            {/* Pipe from contact chamber to dechlorination */}
            <Pipe x1="340" y1="150" x2="400" y2="150" flowing={flowing} />

            {/* Cl2 residual after contact */}
            <AnalyzerTag
              tag="WDI-AIT-001"
              value={wwDisinfection.chlorineResidual}
              unit="mg/L"
              label="Cl2 Residual"
              id="hmi-wwCl2Res"
              x={260}
              y={250}
              alarm={getAlarm('WDI-AIT-001')}
            />

            {/* Dechlorination feed */}
            <ChemFeed
              status={wwDisinfection.dechlorinationPump}
              doseRate={wwDisinfection.dechlorinationDoseRate}
              unit="mg/L"
              label="DECHLOR"
              id="hmi-wwDechlorDose"
              onClick={() => requestSelect('dechlor')}
              x={440}
              y={45}
              selected={selected === 'dechlor'}
            />
            <Pipe x1="440" y1="65" x2="440" y2="130" flowing={wwDisinfection.dechlorinationPump.running} color="#16a34a" strokeWidth={3} />

            {/* Dechlorination mixing zone */}
            <rect x="400" y="130" width="100" height="60" rx="4" fill="#0c1a2e" stroke="#16a34a" strokeWidth="2" />
            <text x="450" y="157" textAnchor="middle" fill="#16a34a" fontSize="11" fontFamily="monospace">DECHLOR.</text>
            <text x="450" y="170" textAnchor="middle" fill="#16a34a" fontSize="11" fontFamily="monospace">MIXING</text>

            {/* Pipe from dechlorination to effluent */}
            <Pipe x1="500" y1="150" x2="560" y2="150" flowing={flowing} />

            {/* TRC after dechlorination */}
            <AnalyzerTag
              tag="WDI-AIT-002"
              value={wwDisinfection.totalResidualChlorine}
              unit="mg/L"
              label="TRC"
              id="hmi-wwTRC"
              x={440}
              y={250}
              alarm={getAlarm('WDI-AIT-002')}
              decimals={3}
            />

            {/* Effluent analyzers */}
            {/* pH */}
            <AnalyzerTag
              tag="WDI-AIT-003"
              value={wwDisinfection.effluentPH}
              unit=""
              label="Effluent pH"
              id="hmi-wwEffPH"
              x={590}
              y={70}
              alarm={getAlarm('WDI-AIT-003')}
              decimals={2}
            />

            {/* Effluent BOD */}
            <g>
              <rect x="555" y="122" width="100" height="40" rx="3" fill="#111827" />
              <text x="605" y="140" textAnchor="middle" fill="#6ee7b7" fontSize="13" fontFamily="monospace" fontWeight="bold">
                {wwDisinfection.effluentBOD.toFixed(1)}<tspan fontSize="11" fill="#9ca3af"> mg/L</tspan>
              </text>
              <text x="605" y="155" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">Eff. BOD</text>
            </g>

            {/* Effluent TSS */}
            <g>
              <rect x="555" y="168" width="100" height="40" rx="3" fill="#111827" />
              <text x="605" y="186" textAnchor="middle" fill="#6ee7b7" fontSize="13" fontFamily="monospace" fontWeight="bold">
                {wwDisinfection.effluentTSS.toFixed(1)}<tspan fontSize="11" fill="#9ca3af"> mg/L</tspan>
              </text>
              <text x="605" y="201" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">Eff. TSS</text>
            </g>

            {/* Effluent NH3 */}
            <AnalyzerTag
              tag="WDI-AIT-004"
              value={wwDisinfection.effluentNH3}
              unit="mg/L"
              label="Eff. NH3"
              id="hmi-wwEffNH3"
              x={610}
              y={265}
              alarm={getAlarm('WDI-AIT-004')}
              decimals={1}
            />

            {/* Effluent flow */}
            <g>
              <rect x="555" y="215" width="100" height="30" rx="3" fill="#111827" />
              <text x="605" y="233" textAnchor="middle" fill="#60a5fa" fontSize="12" fontFamily="monospace" fontWeight="bold">
                {wwDisinfection.effluentFlow.toFixed(2)} MGD
              </text>
              <text x="605" y="244" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">Eff. Flow</text>
            </g>

            {/* Effluent discharge label */}
            <text x="570" y="310" fill="#4b5563" fontSize="13" fontFamily="monospace">EFFLUENT</text>
            <text x="570" y="322" fill="#4b5563" fontSize="13" fontFamily="monospace">DISCHARGE</text>
          </svg>
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 self-stretch">
          {selected === 'chlorine' && (
            <EquipmentPanel title="Chlorine Feed System" tag="WDI-AIT-001" onClose={() => requestSelect(null)}>
              <WWPumpControl pumpId="chlorinePump" status={wwDisinfection.chlorinePump} label="WDI-P-501" />
              <div className="mt-4 border-t border-gray-700 pt-4">
                <WWChemDoseControl tagId="chlorineDoseSetpoint" currentSetpoint={wwDisinfection.chlorineDoseSetpoint}
                  currentActual={wwDisinfection.chlorineDoseRate} label="Chlorine Dose" unit="mg/L" min={0} max={15} step={0.1}
                  onDirtyChange={setIsDirty} />
              </div>
            </EquipmentPanel>
          )}
          {selected === 'dechlor' && (
            <EquipmentPanel title="Dechlorination System" tag="WDI-AIT-002" onClose={() => requestSelect(null)}>
              <WWPumpControl pumpId="dechlorinationPump" status={wwDisinfection.dechlorinationPump} label="WDI-P-502" />
              <div className="mt-4 border-t border-gray-700 pt-4">
                <WWChemDoseControl tagId="dechlorinationSetpoint" currentSetpoint={wwDisinfection.dechlorinationSetpoint}
                  currentActual={wwDisinfection.dechlorinationDoseRate} label="Dechlor. Dose" unit="mg/L" min={0} max={10} step={0.1}
                  onDirtyChange={setIsDirty} />
              </div>
            </EquipmentPanel>
          )}
          {!selected && <EmptyPanel />}
        </div>
      </div>

      {pendingSelect !== undefined && (
        <UnsavedChangesDialog
          onDiscard={() => { setSelected(pendingSelect ?? null); setIsDirty(false); setPendingSelect(undefined); }}
          onCancel={() => setPendingSelect(undefined)}
        />
      )}
    </div>
  );
}
