export const DW_PREFIX = '/dw';
export const WW_PREFIX = '/ww';

export const DW_PATHS = {
  intake: `${DW_PREFIX}/intake`,
  coagulation: `${DW_PREFIX}/coagulation`,
  sedimentation: `${DW_PREFIX}/sedimentation`,
  disinfection: `${DW_PREFIX}/disinfection`,
  alarms: `${DW_PREFIX}/alarms`,
  trends: `${DW_PREFIX}/trends`,
  history: `${DW_PREFIX}/history`,
  scenarios: `${DW_PREFIX}/scenarios`,
  tutorials: `${DW_PREFIX}/tutorials`,
  settings: `${DW_PREFIX}/settings`,
} as const;

export const WW_PATHS = {
  headworks: `${WW_PREFIX}/headworks`,
  primary: `${WW_PREFIX}/primary`,
  aeration: `${WW_PREFIX}/aeration`,
  secondary: `${WW_PREFIX}/secondary`,
  disinfection: `${WW_PREFIX}/disinfection`,
  alarms: `${WW_PREFIX}/alarms`,
  trends: `${WW_PREFIX}/trends`,
  history: `${WW_PREFIX}/history`,
  scenarios: `${WW_PREFIX}/scenarios`,
  tutorials: `${WW_PREFIX}/tutorials`,
  settings: `${WW_PREFIX}/settings`,
} as const;

export function dwTagToRoute(tag: string): string {
  if (tag.startsWith('INT-')) return DW_PATHS.intake;
  if (tag.startsWith('COG-')) return DW_PATHS.coagulation;
  if (tag.startsWith('SED-') || tag.startsWith('FLT-')) return DW_PATHS.sedimentation;
  if (tag.startsWith('DIS-')) return DW_PATHS.disinfection;
  return DW_PATHS.intake;
}

export function wwTagToRoute(tag: string): string {
  if (tag.startsWith('HW-')) return WW_PATHS.headworks;
  if (tag.startsWith('PRI-')) return WW_PATHS.primary;
  if (tag.startsWith('AER-')) return WW_PATHS.aeration;
  if (tag.startsWith('SEC-')) return WW_PATHS.secondary;
  if (tag.startsWith('WDI-')) return WW_PATHS.disinfection;
  return WW_PATHS.headworks;
}
