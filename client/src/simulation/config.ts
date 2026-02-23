export const config = {
  port: 3001,
  simulationInterval: 500, // ms
  simulationSpeedMultiplier: 1,
  historian: {
    maxPoints: 172800, // 24h at 500ms intervals
    retentionHours: 24,
  },
  alarmThresholds: {
    'INT-FIT-001': { ll: 0.5, l: 1.0, h: 8.5, hh: 9.5 },
    'INT-AIT-001': { h: 200, hh: 500 },
    'INT-PDT-001': { h: 5, hh: 8 },
    'COG-AIT-001': { h: 50, hh: 100 },
    'SED-AIT-001': { h: 5, hh: 10 },
    'SED-LIT-001': { h: 4, hh: 6 },
    'FLT-PDT-001': { h: 7, hh: 9 },
    'FLT-AIT-001': { h: 0.3, hh: 0.5 },
    'DIS-AIT-001': { ll: 0.3, l: 0.5, h: 3.0, hh: 4.0 }, // HH = EPA MRDL (40 CFR 141.65)
    'DIS-AIT-002': { ll: 0.2, l: 0.3, h: 2.0 },
    'DIS-AIT-003': { ll: 6.5, l: 6.8, h: 8.0, hh: 8.5 }, // LL = EPA SMCL lower bound
    'DIS-AIT-004': { ll: 0.5, l: 0.7, h: 1.0, hh: 1.2 },
  },
};
