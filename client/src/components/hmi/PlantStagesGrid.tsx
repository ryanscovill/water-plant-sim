import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useAlarmStore } from '../../store/useAlarmStore';
import { ValueDisplay } from '../common/ValueDisplay';
import { StatusIndicator } from '../common/StatusIndicator';

function useStages() {
  const state = useSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);

  if (!state) return null;

  const getAlarm = (tag: string) => alarms.find((a) => a.tag === tag && a.active)?.priority ?? null;
  const { intake, coagulation, sedimentation, disinfection } = state;

  return [
    {
      title: 'INTAKE',
      path: '/intake',
      color: 'border-blue-700',
      headerBg: 'bg-blue-900/30',
      values: [
        { label: 'Flow', value: intake.rawWaterFlow, unit: 'MGD', alarm: getAlarm('INT-FIT-001'), decimals: 2, tag: 'INT-FIT-001' },
        { label: 'Turbidity', value: intake.rawTurbidity, unit: 'NTU', alarm: getAlarm('INT-AIT-001'), decimals: 1, tag: 'INT-AIT-001' },
        { label: 'Wet Well', value: intake.rawWaterLevel, unit: 'ft', alarm: null, decimals: 1, tag: 'INT-LIT-001' },
        { label: 'Screen ΔP', value: intake.screenDiffPressure, unit: 'PSI', alarm: getAlarm('INT-PDT-001'), decimals: 1, tag: 'INT-PDT-001' },
      ],
      equipment: [
        { label: 'Pump 1', ...intake.intakePump1 },
        { label: 'Pump 2', ...intake.intakePump2 },
      ],
    },
    {
      title: 'COAGULATION',
      path: '/coagulation',
      color: 'border-purple-700',
      headerBg: 'bg-purple-900/30',
      values: [
        { label: 'Alum Dose', value: coagulation.alumDoseRate, unit: 'mg/L', alarm: null, decimals: 1, tag: 'COG-FIT-001' },
        { label: 'Floc Turb', value: coagulation.flocBasinTurbidity, unit: 'NTU', alarm: getAlarm('COG-AIT-001'), decimals: 1, tag: 'COG-AIT-001' },
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
        { label: 'Clarifr Turb', value: sedimentation.clarifierTurbidity, unit: 'NTU', alarm: getAlarm('SED-AIT-001'), decimals: 2, tag: 'SED-AIT-001' },
        { label: 'Sludge Blanket', value: sedimentation.sludgeBlanketLevel, unit: 'ft', alarm: getAlarm('SED-LIT-001'), decimals: 1, tag: 'SED-LIT-001' },
        { label: 'Filter HL', value: sedimentation.filterHeadLoss, unit: 'ft', alarm: getAlarm('FLT-PDT-001'), decimals: 1, tag: 'FLT-PDT-001' },
        { label: 'Effluent Turb', value: sedimentation.filterEffluentTurbidity, unit: 'NTU', alarm: getAlarm('FLT-AIT-001'), decimals: 3, tag: 'FLT-AIT-001' },
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
        { label: 'Plant Cl₂', value: disinfection.chlorineResidualPlant, unit: 'mg/L', alarm: getAlarm('DIS-AIT-001'), decimals: 2, tag: 'DIS-AIT-001' },
        { label: 'Dist Cl₂', value: disinfection.chlorineResidualDist, unit: 'mg/L', alarm: getAlarm('DIS-AIT-002'), decimals: 2, tag: 'DIS-AIT-002' },
        { label: 'pH', value: disinfection.finishedWaterPH, unit: '', alarm: getAlarm('DIS-AIT-003'), decimals: 2, tag: 'DIS-AIT-003' },
        { label: 'Clearwell', value: disinfection.clearwellLevel, unit: 'm', alarm: null, decimals: 2, tag: 'DIS-LIT-001' },
      ],
      equipment: [
        { label: 'Cl₂ Pump', ...disinfection.chlorinePumpStatus },
        { label: 'UV System', ...disinfection.uvSystemStatus },
      ],
    },
  ] as const;
}

export function PlantStagesGrid({ activeStage }: { activeStage?: string }) {
  const stages = useStages();
  const navigate = useNavigate();

  if (!stages) return (
    <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
      Connecting to simulation...
    </div>
  );

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {stages.map((stage) => (
        <div
          key={stage.title}
          className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
            activeStage === stage.title
              ? `${stage.color} ring-2 ring-offset-1 ring-offset-gray-950 brightness-125`
              : `${stage.color} hover:brightness-110`
          }`}
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
                  onTrendClick={'tag' in v ? () => navigate(`/trends?tag=${v.tag}`) : undefined}
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
  );
}
