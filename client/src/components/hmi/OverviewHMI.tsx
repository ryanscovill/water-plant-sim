import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useAlarmStore } from '../../store/useAlarmStore';
import { ValueDisplay } from '../common/ValueDisplay';
import { StatusIndicator } from '../common/StatusIndicator';

export function OverviewHMI() {
  const state = useSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const navigate = useNavigate();

  if (!state) return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      Connecting to simulation...
    </div>
  );

  const getAlarm = (tag: string) => alarms.find((a) => a.tag === tag && a.active)?.priority ?? null;
  const { intake, coagulation, sedimentation, disinfection } = state;

  const stages = [
    {
      title: 'INTAKE',
      path: '/intake',
      color: 'border-blue-700',
      headerBg: 'bg-blue-900/30',
      values: [
        { label: 'Flow', value: intake.rawWaterFlow, unit: 'MGD', alarm: getAlarm('INT-FIT-001'), decimals: 2 },
        { label: 'Turbidity', value: intake.rawTurbidity, unit: 'NTU', alarm: getAlarm('INT-AIT-001'), decimals: 1 },
        { label: 'Wet Well', value: intake.rawWaterLevel, unit: 'ft', alarm: null, decimals: 1 },
        { label: 'Screen ΔP', value: intake.screenDiffPressure, unit: 'PSI', alarm: getAlarm('INT-PDT-001'), decimals: 1 },
      ],
      equipment: [
        { label: 'P-101', ...intake.intakePump1 },
        { label: 'P-102', ...intake.intakePump2 },
      ],
    },
    {
      title: 'COAGULATION',
      path: '/coagulation',
      color: 'border-purple-700',
      headerBg: 'bg-purple-900/30',
      values: [
        { label: 'Alum Dose', value: coagulation.alumDoseRate, unit: 'mg/L', alarm: null, decimals: 1 },
        { label: 'Floc Turb', value: coagulation.flocBasinTurbidity, unit: 'NTU', alarm: getAlarm('COG-AIT-001'), decimals: 1 },
        { label: 'Rapid Mix', value: coagulation.rapidMixerSpeed, unit: 'RPM', alarm: null, decimals: 0 },
        { label: 'Slow Mix', value: coagulation.slowMixerSpeed, unit: 'RPM', alarm: null, decimals: 0 },
      ],
      equipment: [
        { label: 'Alum Pump', ...coagulation.alumPumpStatus },
        { label: 'Rapid Mixer', ...coagulation.rapidMixerStatus },
      ],
    },
    {
      title: 'SEDIMENTATION',
      path: '/sedimentation',
      color: 'border-amber-700',
      headerBg: 'bg-amber-900/30',
      values: [
        { label: 'Clarifr Turb', value: sedimentation.clarifierTurbidity, unit: 'NTU', alarm: getAlarm('SED-AIT-001'), decimals: 2 },
        { label: 'Sludge Blanket', value: sedimentation.sludgeBlanketLevel, unit: 'ft', alarm: getAlarm('SED-LIT-001'), decimals: 1 },
        { label: 'Filter HL', value: sedimentation.filterHeadLoss, unit: 'ft', alarm: getAlarm('FLT-PDT-001'), decimals: 1 },
        { label: 'Effluent Turb', value: sedimentation.filterEffluentTurbidity, unit: 'NTU', alarm: getAlarm('FLT-AIT-001'), decimals: 3 },
      ],
      equipment: [
        { label: 'Sludge Pump', ...sedimentation.sludgePumpStatus },
        { label: sedimentation.backwashInProgress ? 'BACKWASH' : 'Filter OK', running: !sedimentation.backwashInProgress, fault: false, speed: 0, runHours: 0 },
      ],
    },
    {
      title: 'DISINFECTION',
      path: '/disinfection',
      color: 'border-cyan-700',
      headerBg: 'bg-cyan-900/30',
      values: [
        { label: 'Cl₂ Dose', value: disinfection.chlorineDoseRate, unit: 'mg/L', alarm: null, decimals: 2 },
        { label: 'Plant Cl₂', value: disinfection.chlorineResidualPlant, unit: 'mg/L', alarm: getAlarm('DIS-AIT-001'), decimals: 2 },
        { label: 'pH', value: disinfection.finishedWaterPH, unit: '', alarm: getAlarm('DIS-AIT-003'), decimals: 2 },
        { label: 'Clearwell', value: disinfection.clearwellLevel, unit: 'ft', alarm: null, decimals: 1 },
      ],
      equipment: [
        { label: 'Cl₂ Pump', ...disinfection.chlorinePumpStatus },
        { label: 'UV System', ...disinfection.uvSystemStatus },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-gray-300 font-bold text-sm font-mono">PLANT OVERVIEW</h2>

      {/* Process flow arrow */}
      <div className="flex items-center gap-2 text-xs text-gray-600 font-mono mb-2">
        <span>RIVER</span>
        <span>→→→</span>
        <span>INTAKE</span>
        <span>→→→</span>
        <span>COAG/FLOCC</span>
        <span>→→→</span>
        <span>SEDIM/FILT</span>
        <span>→→→</span>
        <span>DISINFECTION</span>
        <span>→→→</span>
        <span>DISTRIBUTION</span>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stages.map((stage) => (
          <div
            key={stage.title}
            className={`border ${stage.color} rounded-lg overflow-hidden cursor-pointer hover:brightness-110 transition-all`}
            onClick={() => navigate(stage.path)}
          >
            <div className={`${stage.headerBg} px-3 py-2 border-b ${stage.color}`}>
              <span className="text-xs font-bold text-gray-200 font-mono">{stage.title}</span>
            </div>
            <div className="p-3 space-y-2 bg-gray-900/60">
              <div className="grid grid-cols-2 gap-1.5">
                {stage.values.map((v) => (
                  <ValueDisplay
                    key={v.label}
                    label={v.label}
                    value={v.value}
                    unit={v.unit}
                    decimals={v.decimals}
                    alarm={v.alarm}
                  />
                ))}
              </div>
              <div className="space-y-1 pt-1 border-t border-gray-800">
                {stage.equipment.map((eq) => (
                  <StatusIndicator key={eq.label} running={eq.running} fault={eq.fault} label={eq.label} size="sm" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active alarms summary */}
      {alarms.filter(a => a.active).length > 0 && (
        <div className="bg-red-950/30 border border-red-800 rounded-lg p-3">
          <div className="text-red-400 font-bold text-xs mb-2 font-mono">ACTIVE ALARMS</div>
          <div className="space-y-1">
            {alarms.filter(a => a.active).slice(0, 5).map(alarm => (
              <div key={alarm.id} className="flex items-center gap-2 text-xs font-mono">
                <span className={`font-bold ${alarm.priority === 'CRITICAL' ? 'text-red-400' : alarm.priority === 'HIGH' ? 'text-amber-400' : 'text-yellow-300'}`}>
                  [{alarm.condition}]
                </span>
                <span className="text-gray-300">{alarm.description}</span>
                <span className="text-gray-500 ml-auto">{alarm.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
