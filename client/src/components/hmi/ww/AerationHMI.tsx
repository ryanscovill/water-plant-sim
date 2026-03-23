import { useState } from 'react';
import type React from 'react';
import { useWWSimulationStore } from '../../../store/useWWSimulationStore';
import { useAlarmStore } from '../../../store/useAlarmStore';
import { Pump } from '../svg/Pump';
import { Pipe } from '../svg/Pipe';
import { AnalyzerTag } from '../svg/AnalyzerTag';
import { EquipmentPanel, EmptyPanel, UnsavedChangesDialog } from '../../equipment/EquipmentPanel';
import { WWPumpControl } from '../../equipment/WWPumpControl';
import { WWChemDoseControl } from '../../equipment/WWChemDoseControl';
import { WWPlantStagesGrid } from './WWPlantStagesGrid';

export function AerationHMI() {
  const state = useWWSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const [selected, setSelected] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingSelect, setPendingSelect] = useState<string | null | undefined>(undefined);

  if (!state) return <div className="text-gray-500">Connecting...</div>;

  const { aeration, headworks } = state;
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

  const blowerRunning = aeration.blower1.running || aeration.blower2.running;

  return (
    <div>
      <div className="mb-3">
        <WWPlantStagesGrid activeStage="AERATION" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-gray-300 font-bold text-sm font-mono">AERATION BASIN</h2>
      </div>
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0">
          <svg viewBox="0 0 720 380" width="100%" className="bg-gray-950 rounded border border-gray-800 max-h-[58vh]" onClick={handleSvgClick}>
            <style>{`text[font-size="11"],tspan[font-size="11"]{font-size:11px}text[font-size="12"]{font-size:12px}text[font-size="13"]{font-size:13px}text[font-size="14"]{font-size:14px}`}</style>

            {/* === BLOWERS at top === */}
            <Pump
              status={aeration.blower1}
              label="Blower 1"
              id="hmi-blower1"
              onClick={() => requestSelect('blower1')}
              x={180}
              y={40}
              selected={selected === 'blower1'}
            />
            <text x="180" y="68" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">B-301</text>

            <Pump
              status={aeration.blower2}
              label="Blower 2"
              id="hmi-blower2"
              onClick={() => requestSelect('blower2')}
              x={300}
              y={40}
              selected={selected === 'blower2'}
            />
            <text x="300" y="68" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">B-302</text>

            {/* Airflow display between blowers */}
            <g data-interactive="true" onClick={() => requestSelect('airflow')} style={{ cursor: 'pointer' }}>
              <rect x="214" y="17" width="72" height="28" rx="3" fill="#111827" stroke={selected === 'airflow' ? '#22d3ee' : '#374151'} strokeWidth="1.5" />
              <text x="250" y="30" textAnchor="middle" fill="#60a5fa" fontSize="12" fontFamily="monospace" fontWeight="bold">
                {aeration.airflowRate.toFixed(0)}
              </text>
              <text x="250" y="41" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">SCFM</text>
            </g>

            {/* Air pipes from blowers down to basin */}
            <Pipe x1="180" y1="58" x2="180" y2="108" flowing={aeration.blower1.running} color="#60a5fa" strokeWidth={3} />
            <Pipe x1="300" y1="58" x2="300" y2="108" flowing={aeration.blower2.running} color="#60a5fa" strokeWidth={3} />

            {/* === AERATION BASIN (large rectangle) === */}
            <rect x="80" y="108" width="420" height="110" rx="6" fill="#0c1a2e" stroke="#0ea5e9" strokeWidth="2" />
            <text x="290" y="125" textAnchor="middle" fill="#0ea5e9" fontSize="13" fontFamily="monospace">AERATION BASIN</text>

            {/* Animated bubbles when blowers running */}
            {blowerRunning && (
              <g opacity="0.6">
                {[140, 200, 260, 320, 380, 440].map((bx, i) => (
                  <g key={bx}>
                    <circle cx={bx} cy={190} r="3" fill="#38bdf8" opacity="0.7">
                      <animate attributeName="cy" values="200;130;200" dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0.2;0.8" dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
                    </circle>
                    <circle cx={bx + 15} cy={180} r="2" fill="#38bdf8" opacity="0.5">
                      <animate attributeName="cy" values="195;135;195" dur={`${1.8 + i * 0.15}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0.1;0.6" dur={`${1.8 + i * 0.15}s`} repeatCount="indefinite" />
                    </circle>
                  </g>
                ))}
              </g>
            )}

            {/* Inlet pipe from primary */}
            <text x="10" y="155" fill="#4b5563" fontSize="13" fontFamily="monospace">FROM</text>
            <text x="10" y="167" fill="#4b5563" fontSize="13" fontFamily="monospace">PRIMARY</text>
            <Pipe x1="60" y1="160" x2="80" y2="160" flowing={flowing} />

            {/* Outlet pipe to secondary */}
            <Pipe x1="500" y1="160" x2="560" y2="160" flowing={flowing} />
            <text x="565" y="155" fill="#4b5563" fontSize="13" fontFamily="monospace">TO</text>
            <text x="565" y="167" fill="#4b5563" fontSize="13" fontFamily="monospace">SEC.</text>

            {/* === ANALYZERS below basin === */}
            {/* DO probe */}
            <AnalyzerTag
              tag="AER-AIT-001"
              value={aeration.dissolvedOxygen}
              unit="mg/L"
              label="Dissolved O2"
              id="hmi-do"
              x={130}
              y={260}
              alarm={getAlarm('AER-AIT-001')}
            />

            {/* MLSS analyzer */}
            <AnalyzerTag
              tag="AER-AIT-002"
              value={aeration.mlss}
              unit="mg/L"
              label="MLSS"
              id="hmi-mlss"
              x={290}
              y={260}
              alarm={getAlarm('AER-AIT-002')}
              decimals={0}
            />

            {/* F:M ratio display */}
            <g>
              <rect x="390" y="242" width="80" height="40" rx="3" fill="#111827" />
              <text x="430" y="260" textAnchor="middle" fill="#a78bfa" fontSize="13" fontFamily="monospace" fontWeight="bold">
                {aeration.foodToMassRatio.toFixed(2)}
              </text>
              <text x="430" y="274" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">F:M Ratio</text>
            </g>

            {/* SRT display */}
            <g>
              <rect x="490" y="242" width="70" height="40" rx="3" fill="#111827" />
              <text x="525" y="260" textAnchor="middle" fill="#a78bfa" fontSize="13" fontFamily="monospace" fontWeight="bold">
                {aeration.srt.toFixed(1)}
              </text>
              <text x="525" y="274" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">SRT (days)</text>
            </g>

            {/* === RAS PUMP (bottom-left) === */}
            <Pump
              status={aeration.rasPump}
              label="RAS Pump"
              id="hmi-rasPump"
              onClick={() => requestSelect('rasPump')}
              x={130}
              y={340}
              selected={selected === 'rasPump'}
            />
            {/* RAS flow display */}
            <g>
              <rect x="168" y="325" width="70" height="30" rx="3" fill="#111827" />
              <text x="203" y="340" textAnchor="middle" fill="#22d3ee" fontSize="12" fontFamily="monospace" fontWeight="bold">
                {aeration.rasFlow.toFixed(1)}
              </text>
              <text x="203" y="351" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">MGD RAS</text>
            </g>
            {/* RAS return pipe (from secondary back) */}
            <Pipe x1="130" y1="318" x2="130" y2="218" flowing={aeration.rasPump.running && flowing} color="#22d3ee" strokeWidth={3} />
            <text x="95" y="355" textAnchor="middle" fill="#4b5563" fontSize="10" fontFamily="monospace">FROM</text>
            <text x="95" y="365" textAnchor="middle" fill="#4b5563" fontSize="10" fontFamily="monospace">SEC.</text>

            {/* === WAS PUMP (bottom-right) === */}
            <Pump
              status={aeration.wasPump}
              label="WAS Pump"
              id="hmi-wasPump"
              onClick={() => requestSelect('wasPump')}
              x={430}
              y={340}
              selected={selected === 'wasPump'}
            />
            {/* WAS flow display */}
            <g>
              <rect x="468" y="325" width="70" height="30" rx="3" fill="#111827" />
              <text x="503" y="340" textAnchor="middle" fill="#f59e0b" fontSize="12" fontFamily="monospace" fontWeight="bold">
                {aeration.wasFlow.toFixed(1)}
              </text>
              <text x="503" y="351" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">GPM WAS</text>
            </g>
            {/* WAS pipe down from basin */}
            <Pipe x1="430" y1="218" x2="430" y2="318" flowing={aeration.wasPump.running && flowing} color="#f59e0b" strokeWidth={3} />
            <text x="555" y="345" fill="#4b5563" fontSize="10" fontFamily="monospace">TO</text>
            <text x="555" y="355" fill="#4b5563" fontSize="10" fontFamily="monospace">DISPOSAL</text>

            {/* SVI indicator */}
            <g>
              <rect x="580" y="242" width="70" height="40" rx="3" fill="#111827"
                stroke={aeration.svi > 150 ? '#f59e0b' : 'none'} strokeWidth={aeration.svi > 150 ? 1.5 : 0} />
              <text x="615" y="260" textAnchor="middle"
                fill={aeration.svi > 150 ? '#f59e0b' : '#a78bfa'} fontSize="13" fontFamily="monospace" fontWeight="bold">
                {aeration.svi.toFixed(0)}
              </text>
              <text x="615" y="274" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">SVI mL/g</text>
            </g>

            {/* HRT display */}
            <g>
              <rect x="580" y="108" width="80" height="40" rx="3" fill="#111827" />
              <text x="620" y="126" textAnchor="middle" fill="#a78bfa" fontSize="13" fontFamily="monospace" fontWeight="bold">
                {aeration.hydraulicRetentionTime.toFixed(1)} hr
              </text>
              <text x="620" y="140" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">HRT</text>
            </g>

            {/* DO Setpoint indicator on basin */}
            <g data-interactive="true" onClick={() => requestSelect('doSetpoint')} style={{ cursor: 'pointer' }}>
              <rect x="82" y="188" width="78" height="28" rx="3" fill="#111827"
                stroke={selected === 'doSetpoint' ? '#22d3ee' : '#374151'} strokeWidth="1.5" />
              <text x="121" y="200" textAnchor="middle" fill="#fbbf24" fontSize="11" fontFamily="monospace">
                DO SP: {aeration.doSetpoint.toFixed(1)}
              </text>
              <text x="121" y="212" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">mg/L</text>
            </g>
          </svg>
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 self-stretch">
          {selected === 'blower1' && (
            <EquipmentPanel title="Blower 1" tag="B-301" onClose={() => requestSelect(null)}>
              <WWPumpControl pumpId="blower1" status={aeration.blower1} label="AER-B-301" />
            </EquipmentPanel>
          )}
          {selected === 'blower2' && (
            <EquipmentPanel title="Blower 2" tag="B-302" onClose={() => requestSelect(null)}>
              <WWPumpControl pumpId="blower2" status={aeration.blower2} label="AER-B-302" />
            </EquipmentPanel>
          )}
          {selected === 'rasPump' && (
            <EquipmentPanel title="RAS Pump" tag="AER-P-301" onClose={() => requestSelect(null)}>
              <WWPumpControl pumpId="rasPump" status={aeration.rasPump} label="AER-P-301" />
              <div className="mt-4 border-t border-gray-700 pt-4">
                <WWChemDoseControl tagId="rasSetpoint" currentSetpoint={aeration.rasSetpoint}
                  currentActual={aeration.rasFlow} label="RAS Flow" unit="MGD" min={0} max={10} step={0.1}
                  onDirtyChange={setIsDirty} />
              </div>
            </EquipmentPanel>
          )}
          {selected === 'wasPump' && (
            <EquipmentPanel title="WAS Pump" tag="AER-P-302" onClose={() => requestSelect(null)}>
              <WWPumpControl pumpId="wasPump" status={aeration.wasPump} label="AER-P-302" />
              <div className="mt-4 border-t border-gray-700 pt-4">
                <WWChemDoseControl tagId="wasSetpoint" currentSetpoint={aeration.wasSetpoint}
                  currentActual={aeration.wasFlow} label="WAS Flow" unit="GPM" min={0} max={100} step={1}
                  onDirtyChange={setIsDirty} />
              </div>
            </EquipmentPanel>
          )}
          {selected === 'doSetpoint' && (
            <EquipmentPanel title="DO Setpoint" tag="AER-AIC-001" onClose={() => requestSelect(null)}>
              <WWChemDoseControl tagId="doSetpoint" currentSetpoint={aeration.doSetpoint}
                currentActual={aeration.dissolvedOxygen} label="DO Setpoint" unit="mg/L" min={0} max={8} step={0.1}
                onDirtyChange={setIsDirty} />
            </EquipmentPanel>
          )}
          {selected === 'airflow' && (
            <EquipmentPanel title="Airflow Control" tag="AER-FIC-001" onClose={() => requestSelect(null)}>
              <WWChemDoseControl tagId="airflowSetpoint" currentSetpoint={aeration.airflowSetpoint}
                currentActual={aeration.airflowRate} label="Airflow" unit="SCFM" min={0} max={6000} step={50}
                onDirtyChange={setIsDirty} />
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
