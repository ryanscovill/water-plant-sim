import { useState } from 'react';
import type React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useAlarmStore } from '../../store/useAlarmStore';
import { Clarifier } from './svg/Clarifier';
import { FilterBed } from './svg/FilterBed';
import { Pipe } from './svg/Pipe';
import { AnalyzerTag } from './svg/AnalyzerTag';
import { EquipmentPanel, EmptyPanel } from '../equipment/EquipmentPanel';
import { PumpControl } from '../equipment/PumpControl';
import { InfoModal } from '../common/InfoModal';
import { getEngine } from '../../simulation/engine';

function SvgInfo({ x, y, onClick }: { x: number; y: number; onClick: () => void }) {
  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ cursor: 'pointer' }}>
      <circle cx={x} cy={y} r={9} fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" opacity="0.95" />
      <text x={x} y={y + 4} textAnchor="middle" fill="#60a5fa" fontSize="12" fontFamily="sans-serif" fontWeight="bold">i</text>
    </g>
  );
}

export function SedimentationHMI() {
  const state = useSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const [selected, setSelected] = useState<string | null>(null);
  const [infoKey, setInfoKey] = useState<string | null>(null);

  if (!state) return <div className="text-gray-500">Connecting...</div>;

  const { sedimentation } = state;
  const getAlarm = (tag: string) => alarms.find((a) => a.tag === tag && a.active)?.priority ?? null;
  const flowing = !sedimentation.backwashInProgress;

  const startBackwash = () => {
    getEngine().applyControl('backwash', { command: 'start' });
  };
  const abortBackwash = () => getEngine().applyControl('backwash', { command: 'abort' });

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
      <h2 className="text-gray-300 font-bold text-sm mb-3 font-mono">SEDIMENTATION / FILTRATION</h2>
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0">
          <svg viewBox="0 0 720 340" width="100%" className="bg-gray-950 rounded border border-gray-800" onClick={handleSvgClick}>
            <style>{`text[font-size="11"],tspan[font-size="11"]{font-size:11px}text[font-size="12"]{font-size:12px}text[font-size="13"]{font-size:13px}text[font-size="14"]{font-size:14px}`}</style>
            {/* Inlet */}
            <text x="10" y="85" fill="#4b5563" fontSize="13" fontFamily="monospace">FROM</text>
            <text x="10" y="95" fill="#4b5563" fontSize="13" fontFamily="monospace">COAG</text>
            <Pipe x1="60" y1="90" x2="190" y2="90" flowing={state.intake.rawWaterFlow > 0.5} />

            {/* Clarifier */}
            <Clarifier turbidity={sedimentation.clarifierTurbidity}
              sludgeLevel={sedimentation.sludgeBlanketLevel} x={230} y={75} r={40} />
            <SvgInfo x={267} y={62} onClick={() => setInfoKey('clarifier')} />

            {/* Clarifier turbidity */}
            <AnalyzerTag tag="SED-AIT-001" value={sedimentation.clarifierTurbidity} unit="NTU"
              label="Clarifier Turb" id="hmi-clarifierTurb" x={200} y={195}
              alarm={getAlarm('SED-AIT-001')} />
            <SvgInfo x={257} y={177} onClick={() => setInfoKey('clarifierTurbidity')} />

            {/* Sludge blanket */}
            <AnalyzerTag tag="SED-LIT-001" value={sedimentation.sludgeBlanketLevel} unit="ft"
              label="Sludge Blanket" id="hmi-sludgeLevel" x={130} y={270}
              alarm={getAlarm('SED-LIT-001')} />
            <SvgInfo x={187} y={252} onClick={() => setInfoKey('sludgeBlanket')} />

            {/* Sludge pump */}
            <g data-interactive="true" data-selected={selected === 'sludgePump' ? 'true' : undefined} style={{ cursor: 'pointer' }} onClick={() => setSelected('sludgePump')}>
              <rect x="283" y="207" width="94" height="46" rx="5" fill="transparent" stroke="#22d3ee"
                strokeWidth="1.5" strokeDasharray="5,3" className="interactive-ring" />
              <text x="330" y="221" fill="#6b7280" fontSize="12" fontFamily="monospace" textAnchor="middle">SLUDGE PUMP</text>
              <rect x="286" y="225" width="88" height="22" rx="3" fill="#111827"
                stroke={sedimentation.sludgePumpStatus.fault ? '#dc2626' : sedimentation.sludgePumpStatus.running ? '#16a34a' : '#6b7280'} strokeWidth="1.5" />
              <text x="330" y="240" textAnchor="middle" fill={sedimentation.sludgePumpStatus.fault ? '#dc2626' : sedimentation.sludgePumpStatus.running ? '#4ade80' : '#6b7280'}
                fontSize="12" fontFamily="monospace">
                {sedimentation.sludgePumpStatus.fault ? 'FAULT' : sedimentation.sludgePumpStatus.running ? 'RUNNING' : 'STOPPED'}
              </text>
            </g>
            <SvgInfo x={372} y={210} onClick={() => setInfoKey('sludgePump')} />

            {/* Pipe clarifier to filter */}
            <Pipe x1="270" y1="90" x2="440" y2="90" flowing={flowing} />

            {/* Filter bed */}
            <FilterBed headLoss={sedimentation.filterHeadLoss} runTime={sedimentation.filterRunTime}
              backwashInProgress={sedimentation.backwashInProgress}
              backwashTimeRemaining={sedimentation.backwashTimeRemaining}
              id="hmi-filterBed" onClick={() => setSelected('filter')} x={470} y={85}
              selected={selected === 'filter'} />
            <SvgInfo x={497} y={48} onClick={() => setInfoKey('filterBed')} />

            {/* Filter head loss */}
            <AnalyzerTag tag="FLT-PDT-001" value={sedimentation.filterHeadLoss} unit="ft"
              label="Filter Head Loss" id="hmi-filterHeadLoss" x={530} y={220}
              alarm={getAlarm('FLT-PDT-001')} decimals={1} />
            <SvgInfo x={587} y={202} onClick={() => setInfoKey('filterHeadLoss')} />

            {/* Filter run time */}
            <g id="hmi-filterRunTime">
              <rect x="490" y="275" width="80" height="32" rx="3" fill="#111827" stroke="#374151" strokeWidth="1" />
              <text x="530" y="288" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">Run Time</text>
              <text x="530" y="301" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="monospace">{sedimentation.filterRunTime.toFixed(1)} hrs</text>
            </g>

            {/* Filter effluent */}
            <Pipe x1="500" y1="90" x2="580" y2="90" flowing={flowing && !sedimentation.backwashInProgress} />
            <AnalyzerTag tag="FLT-AIT-001" value={sedimentation.filterEffluentTurbidity} unit="NTU"
              label="Effluent Turb" id="hmi-filterEffluent" x={600} y={60}
              alarm={getAlarm('FLT-AIT-001')} decimals={3} />
            <SvgInfo x={657} y={42} onClick={() => setInfoKey('filterEffluent')} />

            {/* Outlet */}
            <Pipe x1="600" y1="90" x2="680" y2="90" flowing={flowing} />
            <text x="685" y="85" fill="#4b5563" fontSize="13" fontFamily="monospace">TO</text>
            <text x="685" y="95" fill="#4b5563" fontSize="13" fontFamily="monospace">DIS.</text>

            {/* Backwash controls */}
            {!sedimentation.backwashInProgress ? (
              <g id="ctrl-backwash-start" data-interactive="true" style={{ cursor: 'pointer' }} onClick={() => setSelected('filter')}>
                <rect x="387" y="280" width="76" height="28" rx="5" fill="transparent" stroke="#2563eb"
                  strokeWidth="1.5" strokeDasharray="5,3" className="interactive-ring" />
                <rect x="390" y="283" width="70" height="22" rx="3" fill="#1e3a5f" stroke="#2563eb" strokeWidth="1.5" />
                <text x="425" y="298" textAnchor="middle" fill="#60a5fa" fontSize="12" fontFamily="monospace">
                  BACKWASH
                </text>
              </g>
            ) : (
              <g data-interactive="true" style={{ cursor: 'pointer' }} onClick={abortBackwash}>
                <rect x="387" y="280" width="76" height="28" rx="5" fill="transparent" stroke="#dc2626"
                  strokeWidth="1.5" strokeDasharray="5,3" className="interactive-ring" />
                <rect x="390" y="283" width="70" height="22" rx="3" fill="#7f1d1d" stroke="#dc2626" strokeWidth="1.5" />
                <text x="425" y="298" textAnchor="middle" fill="#fca5a5" fontSize="12" fontFamily="monospace">
                  ABORT BW
                </text>
              </g>
            )}
            <SvgInfo x={460} y={284} onClick={() => setInfoKey('backwash')} />
          </svg>
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 self-stretch">
          {selected === 'sludgePump' && (
            <EquipmentPanel title="Sludge Pump" tag="P-301" onClose={() => setSelected(null)} onInfo={() => setInfoKey('sludgePump')}>
              <PumpControl pumpId="sludgePump" status={sedimentation.sludgePumpStatus} label="SED-P-301" />
            </EquipmentPanel>
          )}
          {selected === 'filter' && (
            <EquipmentPanel title="Filter Bed" tag="FLT-F-301" onClose={() => setSelected(null)} onInfo={() => setInfoKey('filterBed')}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-gray-900 rounded p-2">
                    <div className="text-gray-500">Head Loss</div>
                    <div className={`font-bold ${sedimentation.filterHeadLoss >= 8 ? 'text-red-400' : sedimentation.filterHeadLoss >= 6 ? 'text-amber-400' : 'text-green-400'}`}>
                      {sedimentation.filterHeadLoss.toFixed(2)} ft
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded p-2">
                    <div className="text-gray-500">Run Time</div>
                    <div className={`font-bold ${sedimentation.filterRunTime >= 72 ? 'text-amber-400' : 'text-green-400'}`}>
                      {sedimentation.filterRunTime.toFixed(1)} hrs
                    </div>
                  </div>
                </div>
                {sedimentation.backwashInProgress ? (
                  <div className="text-center">
                    <div className="text-cyan-400 font-mono text-sm animate-slow-flash">BACKWASH IN PROGRESS</div>
                    <div className="text-cyan-300 font-mono text-lg font-bold">{Math.ceil(sedimentation.backwashTimeRemaining)}s</div>
                    <button onClick={abortBackwash}
                      className="mt-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded w-full">
                      ABORT BACKWASH
                    </button>
                  </div>
                ) : (
                  <button id="ctrl-backwash-start" onClick={startBackwash}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded w-full font-semibold">
                    START BACKWASH
                  </button>
                )}
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
