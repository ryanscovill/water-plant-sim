import { useState } from 'react';
import type React from 'react';
import { useWWSimulationStore } from '../../../store/useWWSimulationStore';
import { useAlarmStore } from '../../../store/useAlarmStore';
import { Clarifier } from '../svg/Clarifier';
import { Pipe } from '../svg/Pipe';
import { AnalyzerTag } from '../svg/AnalyzerTag';
import { EquipmentPanel, EmptyPanel } from '../../equipment/EquipmentPanel';
import { WWPumpControl } from '../../equipment/WWPumpControl';
import { WWPlantStagesGrid } from './WWPlantStagesGrid';

export function SecondaryClarifierHMI() {
  const state = useWWSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const [selected, setSelected] = useState<string | null>(null);

  if (!state) return <div className="text-gray-500">Connecting...</div>;

  const { secondary, headworks, aeration } = state;
  const getAlarm = (tag: string) => alarms.find((a) => a.tag === tag && a.active)?.priority ?? null;
  const flowing = headworks.influentFlow > 0.5;

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
        <WWPlantStagesGrid activeStage="SECONDARY" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-gray-300 font-bold text-sm font-mono">SECONDARY CLARIFIER</h2>
      </div>
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0">
          <svg viewBox="0 0 720 340" width="100%" className="bg-gray-950 rounded border border-gray-800 max-h-[58vh]" onClick={handleSvgClick}>
            <style>{`text[font-size="11"],tspan[font-size="11"]{font-size:11px}text[font-size="12"]{font-size:12px}text[font-size="13"]{font-size:13px}text[font-size="14"]{font-size:14px}`}</style>

            {/* Inlet from aeration */}
            <text x="10" y="120" fill="#4b5563" fontSize="13" fontFamily="monospace">FROM</text>
            <text x="10" y="132" fill="#4b5563" fontSize="13" fontFamily="monospace">AERATION</text>
            <Pipe x1="75" y1="125" x2="230" y2="125" flowing={flowing} />

            {/* Large clarifier */}
            <Clarifier
              turbidity={secondary.effluentTSS}
              sludgeLevel={secondary.sludgeBlanketLevel}
              x={310}
              y={90}
              r={70}
              id="hmi-secondaryClarifier"
            />

            {/* Outlet to disinfection */}
            <Pipe x1="380" y1="125" x2="560" y2="125" flowing={flowing} />
            <text x="565" y="120" fill="#4b5563" fontSize="13" fontFamily="monospace">TO</text>
            <text x="565" y="132" fill="#4b5563" fontSize="13" fontFamily="monospace">DISINFECT.</text>

            {/* RAS return pipe (bottom of clarifier, going left) */}
            <Pipe x1="310" y1="146" x2="310" y2="200" flowing={aeration.rasPump.running && flowing} color="#22d3ee" strokeWidth={3} />
            <Pipe x1="120" y1="200" x2="310" y2="200" flowing={aeration.rasPump.running && flowing} color="#22d3ee" strokeWidth={3} />
            <text x="120" y="218" fill="#22d3ee" fontSize="11" fontFamily="monospace">RAS TO AERATION</text>
            <text x="120" y="230" fill="#6b7280" fontSize="11" fontFamily="monospace">
              {aeration.rasFlow.toFixed(1)} MGD
            </text>

            {/* Surface Overflow Rate display */}
            <g>
              <rect x="430" y="62" width="100" height="40" rx="3" fill="#111827" />
              <text x="480" y="78" textAnchor="middle" fill="#a78bfa" fontSize="12" fontFamily="monospace" fontWeight="bold">
                {secondary.surfaceOverflowRate.toFixed(0)}
              </text>
              <text x="480" y="94" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">SOR gpd/ft{'\u00B2'}</text>
            </g>

            {/* Scraper status */}
            <g data-interactive="true" data-selected={selected === 'scraper' ? 'true' : undefined}
              style={{ cursor: 'pointer' }} onClick={() => setSelected('scraper')}>
              <rect x="120" y="62" width="94" height="46" rx="5" fill="transparent" stroke="#22d3ee"
                strokeWidth="2.5" strokeDasharray="5,3" className="interactive-ring" />
              <text x="167" y="76" fill="#6b7280" fontSize="12" fontFamily="monospace" textAnchor="middle">SCRAPER</text>
              <rect x="123" y="80" width="88" height="22" rx="3" fill="#111827"
                stroke={secondary.scraperStatus.fault ? '#dc2626' : secondary.scraperStatus.running ? '#16a34a' : '#6b7280'} strokeWidth="1.5" />
              <text x="167" y="95" textAnchor="middle" fill={secondary.scraperStatus.fault ? '#dc2626' : secondary.scraperStatus.running ? '#4ade80' : '#6b7280'}
                fontSize="12" fontFamily="monospace">
                {secondary.scraperStatus.fault ? 'FAULT' : secondary.scraperStatus.running ? 'RUNNING' : 'STOPPED'}
              </text>
            </g>

            {/* Rake status */}
            <g data-interactive="true" data-selected={selected === 'rake' ? 'true' : undefined}
              style={{ cursor: 'pointer' }} onClick={() => setSelected('rake')}>
              <rect x="540" y="152" width="94" height="46" rx="5" fill="transparent" stroke="#22d3ee"
                strokeWidth="2.5" strokeDasharray="5,3" className="interactive-ring" />
              <text x="587" y="166" fill="#6b7280" fontSize="12" fontFamily="monospace" textAnchor="middle">RAKE</text>
              <rect x="543" y="170" width="88" height="22" rx="3" fill="#111827"
                stroke={secondary.rakeStatus.fault ? '#dc2626' : secondary.rakeStatus.running ? '#16a34a' : '#6b7280'} strokeWidth="1.5" />
              <text x="587" y="185" textAnchor="middle" fill={secondary.rakeStatus.fault ? '#dc2626' : secondary.rakeStatus.running ? '#4ade80' : '#6b7280'}
                fontSize="12" fontFamily="monospace">
                {secondary.rakeStatus.fault ? 'FAULT' : secondary.rakeStatus.running ? 'RUNNING' : 'STOPPED'}
              </text>
            </g>

            {/* Analyzer tags */}
            {/* Effluent TSS */}
            <AnalyzerTag
              tag="SEC-AIT-001"
              value={secondary.effluentTSS}
              unit="mg/L"
              label="Effluent TSS"
              id="hmi-secEffTSS"
              x={170}
              y={275}
              alarm={getAlarm('SEC-AIT-001')}
              decimals={1}
            />

            {/* Effluent BOD */}
            <AnalyzerTag
              tag="SEC-AIT-002"
              value={secondary.effluentBOD}
              unit="mg/L"
              label="Effluent BOD"
              id="hmi-secEffBOD"
              x={340}
              y={275}
              alarm={getAlarm('SEC-AIT-002')}
              decimals={1}
            />

            {/* Sludge Blanket Level */}
            <AnalyzerTag
              tag="SEC-LIT-001"
              value={secondary.sludgeBlanketLevel}
              unit="ft"
              label="Sludge Blanket"
              id="hmi-secSludge"
              x={510}
              y={275}
              alarm={getAlarm('SEC-LIT-001')}
              decimals={1}
              valueColor="#92400e"
            />
          </svg>
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 self-stretch">
          {selected === 'scraper' && (
            <EquipmentPanel title="Secondary Scraper" tag="SEC-SCR-001" onClose={() => setSelected(null)}>
              <WWPumpControl pumpId="secondaryScraper" status={secondary.scraperStatus} label="SEC-SCR-001" showSpeedControl={false} />
            </EquipmentPanel>
          )}
          {selected === 'rake' && (
            <EquipmentPanel title="Secondary Rake" tag="SEC-RAK-001" onClose={() => setSelected(null)}>
              <WWPumpControl pumpId="secondaryRake" status={secondary.rakeStatus} label="SEC-RAK-001" showSpeedControl={false} />
            </EquipmentPanel>
          )}
          {!selected && <EmptyPanel />}
        </div>
      </div>
    </div>
  );
}
