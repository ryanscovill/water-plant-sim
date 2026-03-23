import { useNavigate } from 'react-router-dom';
import { useWWSimulationStore } from '../../../store/useWWSimulationStore';
import { useAlarmStore } from '../../../store/useAlarmStore';
import { WW_PATHS } from '../../../routes';
import { ValueDisplay } from '../../common/ValueDisplay';
import { StatusIndicator } from '../../common/StatusIndicator';

function useWWStages() {
  const state = useWWSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);

  if (!state) return null;

  const getAlarm = (tag: string) => alarms.find((a) => a.tag === tag && a.active)?.priority ?? null;
  const { headworks, primary, aeration, secondary, wwDisinfection } = state;

  return [
    {
      title: 'HEADWORKS',
      path: WW_PATHS.headworks,
      color: 'border-emerald-700',
      headerBg: 'bg-emerald-900/30',
      values: [
        { label: 'Flow', value: headworks.influentFlow, unit: 'MGD', alarm: getAlarm('HW-FIT-001'), decimals: 2, tag: 'HW-FIT-001' },
        { label: 'BOD', value: headworks.influentBOD, unit: 'mg/L', alarm: getAlarm('HW-AIT-001'), decimals: 0, tag: 'HW-AIT-001' },
        { label: 'TSS', value: headworks.influentTSS, unit: 'mg/L', alarm: getAlarm('HW-AIT-002'), decimals: 0, tag: 'HW-AIT-002' },
        { label: 'NH3', value: headworks.influentNH3, unit: 'mg/L', alarm: getAlarm('HW-AIT-003'), decimals: 1, tag: 'HW-AIT-003' },
      ],
      equipment: [
        { label: 'Pump 1', ...headworks.influentPump1 },
        { label: 'Pump 2', ...headworks.influentPump2 },
        { label: 'Grit Coll.', ...headworks.gritCollectorStatus },
      ],
    },
    {
      title: 'PRIMARY',
      path: WW_PATHS.primary,
      color: 'border-amber-700',
      headerBg: 'bg-amber-900/30',
      values: [
        { label: 'Eff. BOD', value: primary.primaryEffluentBOD, unit: 'mg/L', alarm: getAlarm('PRI-AIT-001'), decimals: 0, tag: 'PRI-AIT-001' },
        { label: 'Eff. TSS', value: primary.primaryEffluentTSS, unit: 'mg/L', alarm: getAlarm('PRI-AIT-002'), decimals: 0, tag: 'PRI-AIT-002' },
        { label: 'Sludge Blkt', value: primary.sludgeBlanketLevel, unit: 'ft', alarm: getAlarm('PRI-LIT-001'), decimals: 1, tag: 'PRI-LIT-001' },
        { label: 'SOR', value: primary.surfaceOverflowRate, unit: 'gpd/ft\u00B2', alarm: null, decimals: 0 },
      ],
      equipment: [
        { label: 'Sludge Pump', ...primary.primarySludgePump },
        { label: 'Scraper', ...primary.scraperStatus },
      ],
    },
    {
      title: 'AERATION',
      path: WW_PATHS.aeration,
      color: 'border-sky-700',
      headerBg: 'bg-sky-900/30',
      values: [
        { label: 'DO', value: aeration.dissolvedOxygen, unit: 'mg/L', alarm: getAlarm('AER-AIT-001'), decimals: 2, tag: 'AER-AIT-001' },
        { label: 'MLSS', value: aeration.mlss, unit: 'mg/L', alarm: getAlarm('AER-AIT-002'), decimals: 0, tag: 'AER-AIT-002' },
        { label: 'Basin BOD', value: aeration.aerationBasinBOD, unit: 'mg/L', alarm: null, decimals: 1, tag: 'AER-AIT-004' },
        { label: 'NH3', value: aeration.aerationBasinNH3, unit: 'mg/L', alarm: null, decimals: 1, tag: 'AER-AIT-005' },
      ],
      equipment: [
        { label: 'Blower 1', ...aeration.blower1 },
        { label: 'Blower 2', ...aeration.blower2 },
        { label: 'RAS Pump', ...aeration.rasPump },
      ],
    },
    {
      title: 'SECONDARY',
      path: WW_PATHS.secondary,
      color: 'border-violet-700',
      headerBg: 'bg-violet-900/30',
      values: [
        { label: 'Eff. TSS', value: secondary.effluentTSS, unit: 'mg/L', alarm: getAlarm('SEC-AIT-001'), decimals: 1, tag: 'SEC-AIT-001' },
        { label: 'Eff. BOD', value: secondary.effluentBOD, unit: 'mg/L', alarm: getAlarm('SEC-AIT-002'), decimals: 1, tag: 'SEC-AIT-002' },
        { label: 'Sludge Blkt', value: secondary.sludgeBlanketLevel, unit: 'ft', alarm: getAlarm('SEC-LIT-001'), decimals: 1, tag: 'SEC-LIT-001' },
        { label: 'SVI', value: aeration.svi, unit: 'mL/g', alarm: getAlarm('AER-AIT-003'), decimals: 0, tag: 'AER-AIT-003' },
      ],
      equipment: [
        { label: 'Scraper', ...secondary.scraperStatus },
        { label: 'Rake', ...secondary.rakeStatus },
      ],
    },
    {
      title: 'DISINFECTION',
      path: WW_PATHS.disinfection,
      color: 'border-cyan-700',
      headerBg: 'bg-cyan-900/30',
      values: [
        { label: 'Cl2 Res.', value: wwDisinfection.chlorineResidual, unit: 'mg/L', alarm: getAlarm('WDI-AIT-001'), decimals: 2, tag: 'WDI-AIT-001' },
        { label: 'TRC', value: wwDisinfection.totalResidualChlorine, unit: 'mg/L', alarm: getAlarm('WDI-AIT-002'), decimals: 3, tag: 'WDI-AIT-002' },
        { label: 'Eff. pH', value: wwDisinfection.effluentPH, unit: '', alarm: getAlarm('WDI-AIT-003'), decimals: 2, tag: 'WDI-AIT-003' },
        { label: 'Eff. NH3', value: wwDisinfection.effluentNH3, unit: 'mg/L', alarm: getAlarm('WDI-AIT-004'), decimals: 1, tag: 'WDI-AIT-004' },
      ],
      equipment: [
        { label: 'Cl2 Pump', ...wwDisinfection.chlorinePump },
        { label: 'Dechlor Pump', ...wwDisinfection.dechlorinationPump },
      ],
    },
  ] as const;
}

export function WWPlantStagesGrid({ activeStage }: { activeStage?: string }) {
  const stages = useWWStages();
  const navigate = useNavigate();

  if (!stages) return (
    <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
      Connecting to simulation...
    </div>
  );

  return (
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
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
                  onTrendClick={'tag' in v && v.tag ? () => navigate(`${WW_PATHS.trends}?tag=${v.tag}`) : undefined}
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
