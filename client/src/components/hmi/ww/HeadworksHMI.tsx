import { useState, useEffect } from 'react';
import type React from 'react';
import { useWWSimulationStore } from '../../../store/useWWSimulationStore';
import { useAlarmStore } from '../../../store/useAlarmStore';
import { Pump } from '../svg/Pump';
import { Valve } from '../svg/Valve';
import { Pipe } from '../svg/Pipe';
import { FlowMeter } from '../svg/FlowMeter';
import { AnalyzerTag } from '../svg/AnalyzerTag';
import { BarScreen } from '../svg/BarScreen';
import { EquipmentPanel, EmptyPanel } from '../../equipment/EquipmentPanel';
import { getWWEngine } from '../../../simulation/ww/wwEngine';
import type { EquipmentStatus, ValveStatus } from '../../../simulation/ww/WWProcessState';

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
        <button
          onClick={() => sendCommand('start')}
          disabled={status.running && !status.fault}
          className="px-3 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded font-semibold cursor-pointer disabled:cursor-not-allowed"
        >START</button>
        <button
          onClick={() => sendCommand('stop')}
          disabled={!status.running}
          className="px-3 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded font-semibold cursor-pointer disabled:cursor-not-allowed"
        >STOP</button>
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

function WWValveControl({ valveId, status, label }: {
  valveId: string; status: ValveStatus; label: string;
}) {
  const [position, setPosition] = useState(status.position);
  useEffect(() => { setPosition(status.position); }, [status.position]);

  const sendCommand = (command: string, value?: number) => {
    getWWEngine().applyControl('valve', { valveId, command, value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${status.fault ? 'bg-red-500 animate-flash' : status.open ? 'bg-green-400' : 'bg-gray-500'}`} />
        <span className="text-sm font-mono text-gray-300">
          {status.fault ? 'FAULT' : status.open ? `OPEN ${status.position}%` : 'CLOSED'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => sendCommand('open')} disabled={status.open && status.position === 100}
          className="px-3 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded font-semibold cursor-pointer disabled:cursor-not-allowed">OPEN</button>
        <button onClick={() => sendCommand('close')} disabled={!status.open}
          className="px-3 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded font-semibold cursor-pointer disabled:cursor-not-allowed">CLOSE</button>
      </div>
      <div>
        <label className="text-xs text-gray-300 block mb-1">Position: {position}%</label>
        <input type="range" min="0" max="100" value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          onMouseUp={() => sendCommand('setPosition', position)}
          onTouchEnd={() => sendCommand('setPosition', position)}
          className="w-full accent-blue-500" />
      </div>
      <div className="text-xs text-gray-400 font-mono"><div>{label}</div></div>
    </div>
  );
}

/* ---------- Main HMI ---------- */

export function HeadworksHMI() {
  const state = useWWSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const [selected, setSelected] = useState<string | null>(null);

  if (!state) return <div className="text-gray-500">Connecting...</div>;

  const { headworks } = state;

  const getAlarm = (tag: string) => alarms.find((a) => a.tag === tag && a.active)?.priority ?? null;

  const clearScreen = () => getWWEngine().applyControl('clearScreen', {});

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    let el: Element | null = e.target as Element;
    while (el && el !== e.currentTarget) {
      if (el.getAttribute('data-interactive') === 'true') return;
      el = el.parentElement;
    }
    setSelected(null);
  };

  const anyPumpRunning = headworks.influentPump1.running || headworks.influentPump2.running;
  const hasFlow = headworks.influentFlow > 0.5 && headworks.influentValve.open;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-gray-300 font-bold text-sm font-mono">HEADWORKS — INFLUENT RECEIVING</h2>
      </div>
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0">
          <svg viewBox="0 0 720 340" width="100%" className="bg-gray-950 rounded border border-gray-800 max-h-[58vh]" onClick={handleSvgClick}>
            <style>{`text[font-size="11"],tspan[font-size="11"]{font-size:11px}text[font-size="12"]{font-size:12px}text[font-size="13"]{font-size:13px}text[font-size="14"]{font-size:14px}`}</style>

            {/* INFLUENT label */}
            <text x="20" y="155" fill="#4b5563" fontSize="14" fontFamily="monospace">INFLUENT</text>
            <text x="20" y="168" fill="#4b5563" fontSize="14" fontFamily="monospace">SEWER</text>

            {/* Pipes: influent to valve */}
            <Pipe x1="80" y1="160" x2="143" y2="160" flowing={hasFlow} flowRate={headworks.influentFlow} />

            {/* Inlet valve */}
            <Valve
              status={headworks.influentValve}
              label="Influent"
              id="hmi-influentValve"
              onClick={() => setSelected('influentValve')}
              x={157}
              y={160}
              selected={selected === 'influentValve'}
            />

            {/* Pipe: valve to split */}
            <Pipe x1="171" y1="160" x2="210" y2="160" flowing={hasFlow} flowRate={headworks.influentFlow} />

            {/* Split to two pumps */}
            <Pipe x1="210" y1="160" x2="210" y2="105" flowing={headworks.influentPump1.running && hasFlow} flowRate={headworks.influentFlow} />
            <Pipe x1="210" y1="160" x2="210" y2="225" flowing={headworks.influentPump2.running && hasFlow} flowRate={headworks.influentFlow} />
            <Pipe x1="210" y1="105" x2="240" y2="105" flowing={headworks.influentPump1.running && hasFlow} flowRate={headworks.influentFlow} />
            <Pipe x1="210" y1="225" x2="240" y2="225" flowing={headworks.influentPump2.running && hasFlow} flowRate={headworks.influentFlow} />

            {/* Pumps */}
            <Pump
              status={headworks.influentPump1}
              label="P-501"
              id="hmi-influentPump1"
              onClick={() => setSelected('pump1')}
              x={260}
              y={105}
              selected={selected === 'pump1'}
            />
            <Pump
              status={headworks.influentPump2}
              label="P-502"
              id="hmi-influentPump2"
              onClick={() => setSelected('pump2')}
              x={260}
              y={225}
              selected={selected === 'pump2'}
            />

            {/* Rejoin after pumps */}
            <Pipe x1="280" y1="105" x2="310" y2="105" flowing={headworks.influentPump1.running && hasFlow} flowRate={headworks.influentFlow} />
            <Pipe x1="280" y1="225" x2="310" y2="225" flowing={headworks.influentPump2.running && hasFlow} flowRate={headworks.influentFlow} />
            <Pipe x1="310" y1="105" x2="310" y2="160" flowing={headworks.influentPump1.running && hasFlow} flowRate={headworks.influentFlow} />
            <Pipe x1="310" y1="225" x2="310" y2="160" flowing={headworks.influentPump2.running && hasFlow} flowRate={headworks.influentFlow} />

            {/* Pipe to bar screen */}
            <Pipe x1="310" y1="160" x2="352" y2="160" flowing={anyPumpRunning && hasFlow} flowRate={headworks.influentFlow} />

            {/* Bar Screen */}
            <BarScreen
              diffPressure={headworks.barScreenDiffPressure}
              rakeRunning={headworks.barScreenDiffPressure > 12}
              id="hmi-barScreen"
              onClick={() => setSelected('barScreen')}
              x={370}
              y={160}
              selected={selected === 'barScreen'}
            />

            {/* Pipe to grit chamber */}
            <Pipe x1="392" y1="160" x2="420" y2="160" flowing={anyPumpRunning && hasFlow} flowRate={headworks.influentFlow} />

            {/* Grit chamber (inline SVG rect) */}
            <g
              id="hmi-gritChamber"
              onClick={() => setSelected('gritCollector')}
              style={{ cursor: 'pointer' }}
              data-interactive="true"
              data-selected={selected === 'gritCollector' ? 'true' : undefined}
            >
              {/* Clickable ring */}
              <rect x="420" y="133" width="56" height="56" rx="4" fill="transparent" stroke="#22d3ee"
                strokeWidth="2.5" strokeDasharray="5,3" className="interactive-ring" />
              <rect x="424" y="137" width="48" height="48" rx="3" fill="#111827" stroke="#374151" strokeWidth="1.5" />
              {/* Grit settling lines */}
              <line x1="430" y1="170" x2="466" y2="170" stroke="#6b7280" strokeWidth="1" strokeDasharray="3,2" />
              <line x1="432" y1="177" x2="464" y2="177" stroke="#78350f" strokeWidth="1.5" />
              {/* Water fill */}
              <rect x="426" y="139" width="44" height="28" fill="#1e3a5f" opacity="0.4" />
              <text x="448" y="157" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="monospace">GRIT</text>
              <text x="448" y="198" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">
                {headworks.gritCollectorStatus.running ? 'RUN' : 'OFF'}
              </text>
            </g>

            {/* Pipe from grit to flow meter */}
            <Pipe x1="476" y1="160" x2="510" y2="160" flowing={anyPumpRunning && hasFlow} flowRate={headworks.influentFlow} />

            {/* Flow Meter */}
            <FlowMeter
              value={headworks.influentFlow}
              unit="MGD"
              tag="HW-FIT-001"
              id="hmi-influentFlow"
              x={535}
              y={160}
              alarm={getAlarm('HW-FIT-001')}
            />

            {/* Pipe from flow meter to analyzers */}
            <Pipe x1="557" y1="160" x2="660" y2="160" flowing={anyPumpRunning && hasFlow} flowRate={headworks.influentFlow} />

            {/* TO PRIMARY label */}
            <text x="665" y="155" fill="#4b5563" fontSize="14" fontFamily="monospace">TO</text>
            <text x="665" y="168" fill="#4b5563" fontSize="14" fontFamily="monospace">PRIMARY</text>

            {/* Analyzer Tags — stacked along bottom */}
            <AnalyzerTag
              tag="HW-AIT-001"
              value={headworks.influentBOD}
              unit="mg/L"
              label="Influent BOD"
              x={120}
              y={270}
            />
            <AnalyzerTag
              tag="HW-AIT-002"
              value={headworks.influentTSS}
              unit="mg/L"
              label="Influent TSS"
              x={260}
              y={270}
            />
            <AnalyzerTag
              tag="HW-AIT-003"
              value={headworks.influentNH3}
              unit="mg/L"
              label="Influent NH3-N"
              x={400}
              y={270}
            />
            <AnalyzerTag
              tag="HW-AIT-004"
              value={headworks.influentPH}
              unit="S.U."
              label="Influent pH"
              x={540}
              y={270}
            />
            <AnalyzerTag
              tag="HW-TIT-001"
              value={headworks.influentTemperature}
              unit={'\u00B0C'}
              label="Influent Temp"
              decimals={1}
              x={540}
              y={33}
            />
          </svg>
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 self-stretch">
          {selected === 'pump1' && (
            <EquipmentPanel title="Influent Pump 1" tag="P-501" onClose={() => setSelected(null)}>
              <WWPumpControl pumpId="influentPump1" status={headworks.influentPump1} label="HW-P-501" />
            </EquipmentPanel>
          )}
          {selected === 'pump2' && (
            <EquipmentPanel title="Influent Pump 2" tag="P-502" onClose={() => setSelected(null)}>
              <WWPumpControl pumpId="influentPump2" status={headworks.influentPump2} label="HW-P-502" />
            </EquipmentPanel>
          )}
          {selected === 'influentValve' && (
            <EquipmentPanel title="Influent Valve" tag="XV-501" onClose={() => setSelected(null)}>
              <WWValveControl valveId="influentValve" status={headworks.influentValve} label="HW-XV-501" />
            </EquipmentPanel>
          )}
          {selected === 'barScreen' && (
            <EquipmentPanel title="Bar Screen" tag="HW-SCR-001" onClose={() => setSelected(null)}>
              <div className="space-y-4">
                <div className="bg-gray-900 rounded p-3 flex justify-between items-center">
                  <span className="text-gray-400 text-xs font-mono">DIFF PRESSURE</span>
                  <span className={`text-sm font-mono font-bold ${headworks.barScreenDiffPressure > 15 ? 'text-amber-400' : 'text-gray-200'}`}>
                    {headworks.barScreenDiffPressure.toFixed(1)} inH2O
                  </span>
                </div>
                <div className="bg-gray-900 rounded p-3 flex justify-between items-center">
                  <span className="text-gray-400 text-xs font-mono">RAKE STATUS</span>
                  <span className={`text-xs font-mono font-bold ${headworks.barScreenDiffPressure > 12 ? 'text-green-400' : 'text-gray-400'}`}>
                    {headworks.barScreenDiffPressure > 12 ? 'RUNNING' : 'STANDBY'}
                  </span>
                </div>
                <div className="bg-gray-900 rounded p-3 flex justify-between items-center">
                  <span className="text-gray-400 text-xs font-mono">STATUS</span>
                  <span className={`text-xs font-mono font-bold ${headworks.barScreenDiffPressure > 15 ? 'text-amber-400' : headworks.barScreenDiffPressure > 24 ? 'text-red-400' : 'text-green-400'}`}>
                    {headworks.barScreenDiffPressure > 24 ? 'BLOCKED' : headworks.barScreenDiffPressure > 15 ? 'HIGH DP' : 'NORMAL'}
                  </span>
                </div>
                <button
                  onClick={clearScreen}
                  className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-mono font-bold rounded cursor-pointer"
                >
                  CLEAN BAR SCREEN
                </button>
              </div>
            </EquipmentPanel>
          )}
          {selected === 'gritCollector' && (
            <EquipmentPanel title="Grit Collector" tag="HW-GRT-001" onClose={() => setSelected(null)}>
              <WWPumpControl pumpId="gritCollector" status={headworks.gritCollectorStatus} label="HW-GRT-001" showSpeedControl={false} />
            </EquipmentPanel>
          )}
          {!selected && <EmptyPanel />}
        </div>
      </div>
    </div>
  );
}
