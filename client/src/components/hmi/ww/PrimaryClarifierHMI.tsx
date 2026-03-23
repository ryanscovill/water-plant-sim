import { useState, useEffect } from 'react';
import type React from 'react';
import { useWWSimulationStore } from '../../../store/useWWSimulationStore';
import { useAlarmStore } from '../../../store/useAlarmStore';
import { Clarifier } from '../svg/Clarifier';
import { Pump } from '../svg/Pump';
import { Pipe } from '../svg/Pipe';
import { AnalyzerTag } from '../svg/AnalyzerTag';
import { EquipmentPanel, EmptyPanel } from '../../equipment/EquipmentPanel';
import { getWWEngine } from '../../../simulation/ww/wwEngine';
import type { EquipmentStatus } from '../../../simulation/ww/WWProcessState';

/* ---------- WW-specific inline controls ---------- */

function WWPumpControl({ pumpId, status, label, showSpeedControl = true }: {
  pumpId: string; status: EquipmentStatus; label: string; showSpeedControl?: boolean;
}) {
  const [speed, setSpeed] = useState(status.speed);
  useEffect(() => { setSpeed(status.speed); }, [status.speed]);

  const sendCommand = (command: string, value?: number) => {
    getWWEngine().applyControl('pump', { pumpId, command, value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${status.fault ? 'bg-red-500 animate-flash' : status.running ? 'bg-green-400' : 'bg-gray-500'}`} />
        <span className="text-sm font-mono text-gray-300">
          {status.fault ? 'FAULT' : status.running ? 'RUNNING' : 'STOPPED'}
        </span>
        <span className="text-xs text-gray-300 ml-auto">{status.runHours.toFixed(0)} hrs</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => sendCommand('start')} disabled={status.running && !status.fault}
          className="px-3 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded font-semibold cursor-pointer disabled:cursor-not-allowed">START</button>
        <button onClick={() => sendCommand('stop')} disabled={!status.running}
          className="px-3 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded font-semibold cursor-pointer disabled:cursor-not-allowed">STOP</button>
      </div>
      {showSpeedControl && (
        <div>
          <label className="text-xs text-gray-300 block mb-1">Speed: {speed}%</label>
          <input type="range" min="0" max="100" value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            onMouseUp={() => sendCommand('setSpeed', speed)}
            onTouchEnd={() => sendCommand('setSpeed', speed)}
            className="w-full accent-blue-500" />
        </div>
      )}
      <div className="text-xs text-gray-400 font-mono"><div>{label}</div></div>
    </div>
  );
}

function SludgeWastingControl({ currentSetpoint, currentActual }: {
  currentSetpoint: number; currentActual: number;
}) {
  const [value, setValue] = useState(currentSetpoint);
  useEffect(() => { setValue(currentSetpoint); }, [currentSetpoint]);

  const dirty = value !== currentSetpoint;

  const apply = () => {
    getWWEngine().applyControl('setpoint', { tagId: 'sludgeWastingSetpoint', value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
        <div className="bg-gray-900 rounded p-2">
          <div className="text-gray-300 text-xs">SETPOINT</div>
          <div className="text-yellow-300 font-bold">{currentSetpoint.toFixed(0)} GPM</div>
        </div>
        <div className="bg-gray-900 rounded p-2">
          <div className="text-gray-300 text-xs">ACTUAL</div>
          <div className="text-green-300 font-bold">{currentActual.toFixed(0)} GPM</div>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-300 block mb-1">
          Sludge Wasting: <span className={dirty ? 'text-yellow-300' : ''}>{value.toFixed(0)} GPM</span>
        </label>
        <input type="range" min={0} max={200} step={5} value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer" />
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-400">0 GPM</span>
          <span className="text-gray-400">200 GPM</span>
        </div>
      </div>
      <div className="flex gap-2">
        <input type="number" min={0} max={200} step={5} value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm font-mono" />
        <button onClick={apply} disabled={!dirty}
          className={`px-4 py-1 text-sm rounded font-semibold cursor-pointer disabled:cursor-not-allowed transition-colors ${
            dirty ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-gray-700 text-gray-500'
          }`}>APPLY</button>
      </div>
    </div>
  );
}

/* ---------- Main HMI ---------- */

export function PrimaryClarifierHMI() {
  const state = useWWSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const [selected, setSelected] = useState<string | null>(null);

  if (!state) return <div className="text-gray-500">Connecting...</div>;

  const { primary, headworks } = state;

  const getAlarm = (tag: string) => alarms.find((a) => a.tag === tag && a.active)?.priority ?? null;

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    let el: Element | null = e.target as Element;
    while (el && el !== e.currentTarget) {
      if (el.getAttribute('data-interactive') === 'true') return;
      el = el.parentElement;
    }
    setSelected(null);
  };

  const hasFlow = headworks.influentFlow > 0.5;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-gray-300 font-bold text-sm font-mono">PRIMARY CLARIFICATION — SOLIDS SETTLING</h2>
      </div>
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0">
          <svg viewBox="0 0 720 340" width="100%" className="bg-gray-950 rounded border border-gray-800 max-h-[58vh]" onClick={handleSvgClick}>
            <style>{`text[font-size="11"],tspan[font-size="11"]{font-size:11px}text[font-size="12"]{font-size:12px}text[font-size="13"]{font-size:13px}text[font-size="14"]{font-size:14px}`}</style>

            {/* FROM HEADWORKS label */}
            <text x="15" y="133" fill="#4b5563" fontSize="14" fontFamily="monospace">FROM</text>
            <text x="15" y="146" fill="#4b5563" fontSize="14" fontFamily="monospace">HEADWKS</text>

            {/* Inlet pipe to clarifier */}
            <Pipe x1="80" y1="140" x2="230" y2="140" flowing={hasFlow} flowRate={headworks.influentFlow} />

            {/* Clarifier (large, centered) */}
            <Clarifier
              turbidity={primary.primaryEffluentTSS / 25}
              sludgeLevel={primary.sludgeBlanketLevel}
              maxSludge={8}
              id="hmi-primaryClarifier"
              x={310}
              y={120}
              r={70}
            />

            {/* Scraper status indicator */}
            <g
              id="hmi-scraper"
              onClick={() => setSelected('scraper')}
              style={{ cursor: 'pointer' }}
              data-interactive="true"
              data-selected={selected === 'scraper' ? 'true' : undefined}
            >
              <rect x="282" y="60" width="56" height="36" rx="4" fill="transparent" stroke="#22d3ee"
                strokeWidth="2.5" strokeDasharray="5,3" className="interactive-ring" />
              <rect x="285" y="63" width="50" height="30" rx="3" fill="#111827" stroke="#374151" strokeWidth="1.5" />
              <text x="310" y="76" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">SCRAPER</text>
              <text x="310" y="88" textAnchor="middle"
                fill={primary.scraperStatus.running ? '#6ee7b7' : '#6b7280'}
                fontSize="11" fontFamily="monospace" fontWeight="bold">
                {primary.scraperStatus.running ? 'RUN' : 'OFF'}
              </text>
            </g>

            {/* Surface overflow rate display */}
            <g>
              <rect x="350" y="60" width="72" height="36" rx="3" fill="#111827" stroke="#374151" strokeWidth="1" />
              <text x="386" y="76" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">SOR</text>
              <text x="386" y="88" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="monospace" fontWeight="bold">
                {primary.surfaceOverflowRate.toFixed(0)} gpd/ft2
              </text>
            </g>

            {/* Effluent pipe from clarifier */}
            <Pipe x1="380" y1="140" x2="530" y2="140" flowing={hasFlow} flowRate={headworks.influentFlow} />

            {/* TO AERATION label */}
            <text x="660" y="133" fill="#4b5563" fontSize="14" fontFamily="monospace">TO</text>
            <text x="660" y="146" fill="#4b5563" fontSize="14" fontFamily="monospace">AERATION</text>

            {/* Pipe to exit */}
            <Pipe x1="600" y1="140" x2="655" y2="140" flowing={hasFlow} flowRate={headworks.influentFlow} />

            {/* Sludge pipe down from clarifier */}
            <Pipe x1="310" y1="180" x2="310" y2="260" flowing={primary.primarySludgePump.running} flowRate={primary.sludgeWastingRate} maxFlow={200} color="#78350f" />
            <Pipe x1="310" y1="260" x2="360" y2="260" flowing={primary.primarySludgePump.running} flowRate={primary.sludgeWastingRate} maxFlow={200} color="#78350f" />

            {/* Sludge pump */}
            <Pump
              status={primary.primarySludgePump}
              label="Sludge Pump"
              id="hmi-sludgePump"
              onClick={() => setSelected('sludgePump')}
              x={385}
              y={260}
              selected={selected === 'sludgePump'}
            />

            {/* Pipe from sludge pump to disposal */}
            <Pipe x1="405" y1="260" x2="470" y2="260" flowing={primary.primarySludgePump.running} flowRate={primary.sludgeWastingRate} maxFlow={200} color="#78350f" />
            <text x="475" y="258" fill="#4b5563" fontSize="12" fontFamily="monospace">TO SLUDGE</text>
            <text x="475" y="271" fill="#4b5563" fontSize="12" fontFamily="monospace">HANDLING</text>

            {/* Analyzer Tags — effluent quality */}
            <AnalyzerTag
              tag="PRI-AIT-001"
              value={primary.primaryEffluentBOD}
              unit="mg/L"
              label="Eff. BOD"
              x={535}
              y={80}
            />
            <AnalyzerTag
              tag="PRI-AIT-002"
              value={primary.primaryEffluentTSS}
              unit="mg/L"
              label="Eff. TSS"
              x={535}
              y={170}
            />
            <AnalyzerTag
              tag="PRI-LIT-001"
              value={primary.sludgeBlanketLevel}
              unit="ft"
              label="Sludge Blanket"
              x={160}
              y={260}
              alarm={getAlarm('PRI-LIT-001')}
              decimals={1}
            />

            {/* Sludge wasting rate display */}
            <g
              id="hmi-sludgeWasting"
              onClick={() => setSelected('sludgeWasting')}
              style={{ cursor: 'pointer' }}
              data-interactive="true"
              data-selected={selected === 'sludgeWasting' ? 'true' : undefined}
            >
              <rect x="332" y="290" width="106" height="36" rx="4" fill="transparent" stroke="#22d3ee"
                strokeWidth="2.5" strokeDasharray="5,3" className="interactive-ring" />
              <rect x="335" y="293" width="100" height="30" rx="3" fill="#111827" stroke="#374151" strokeWidth="1.5" />
              <text x="385" y="306" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">Wasting</text>
              <text x="385" y="318" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="monospace" fontWeight="bold">
                {primary.sludgeWastingRate.toFixed(0)} / {primary.sludgeWastingSetpoint.toFixed(0)} GPM
              </text>
            </g>
          </svg>
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 self-stretch">
          {selected === 'sludgePump' && (
            <EquipmentPanel title="Primary Sludge Pump" tag="PRI-SLP-001" onClose={() => setSelected(null)}>
              <WWPumpControl pumpId="primarySludgePump" status={primary.primarySludgePump} label="PRI-SLP-001" />
            </EquipmentPanel>
          )}
          {selected === 'scraper' && (
            <EquipmentPanel title="Clarifier Scraper" tag="PRI-SCR-001" onClose={() => setSelected(null)}>
              <WWPumpControl pumpId="scraper" status={primary.scraperStatus} label="PRI-SCR-001" showSpeedControl={false} />
            </EquipmentPanel>
          )}
          {selected === 'sludgeWasting' && (
            <EquipmentPanel title="Sludge Wasting Control" tag="PRI-FCV-001" onClose={() => setSelected(null)}>
              <SludgeWastingControl
                currentSetpoint={primary.sludgeWastingSetpoint}
                currentActual={primary.sludgeWastingRate}
              />
            </EquipmentPanel>
          )}
          {!selected && <EmptyPanel />}
        </div>
      </div>
    </div>
  );
}
