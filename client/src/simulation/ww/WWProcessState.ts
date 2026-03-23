import type { EquipmentStatus, ValveStatus, Alarm } from '../ProcessState';

export type { EquipmentStatus, ValveStatus, Alarm };

export interface HeadworksState {
  influentFlow: number;           // MGD
  influentPump1: EquipmentStatus;
  influentPump2: EquipmentStatus;
  barScreenDiffPressure: number;  // inches H2O
  gritCollectorStatus: EquipmentStatus;
  influentBOD: number;            // mg/L
  influentTSS: number;            // mg/L
  influentNH3: number;            // mg/L as N
  influentTemperature: number;    // degrees C
  influentPH: number;             // S.U.
  influentValve: ValveStatus;
  // Operator-configurable source characteristics
  sourceBODBase: number;          // mg/L
  sourceTSSBase: number;          // mg/L
  sourceNH3Base: number;          // mg/L
  sourceFlowBase: number;         // MGD
}

export interface PrimaryClarifierState {
  primaryEffluentBOD: number;     // mg/L
  primaryEffluentTSS: number;     // mg/L
  sludgeBlanketLevel: number;     // feet
  surfaceOverflowRate: number;    // gpd/ft2
  primarySludgePump: EquipmentStatus;
  scraperStatus: EquipmentStatus;
  sludgeWastingRate: number;      // GPM
  sludgeWastingSetpoint: number;  // GPM
}

export interface AerationState {
  dissolvedOxygen: number;        // mg/L
  doSetpoint: number;             // mg/L
  mlss: number;                   // mg/L
  mlvss: number;                  // mg/L
  foodToMassRatio: number;        // dimensionless
  srt: number;                    // days
  svi: number;                    // mL/g
  blower1: EquipmentStatus;
  blower2: EquipmentStatus;
  airflowRate: number;            // SCFM
  airflowSetpoint: number;        // SCFM
  rasFlow: number;                // MGD
  rasSetpoint: number;            // MGD
  rasPump: EquipmentStatus;
  wasFlow: number;                // GPM
  wasSetpoint: number;            // GPM
  wasPump: EquipmentStatus;
  aerationBasinBOD: number;       // mg/L (soluble BOD in mixed liquor)
  aerationBasinNH3: number;       // mg/L as N
  aerationBasinNO3: number;       // mg/L as N
  hydraulicRetentionTime: number; // hours (display value)
  temperature: number;            // degrees C (from headworks, affects kinetics)
}

export interface SecondaryClarifierState {
  effluentTSS: number;           // mg/L
  effluentBOD: number;           // mg/L
  sludgeBlanketLevel: number;    // feet
  surfaceOverflowRate: number;   // gpd/ft2
  scraperStatus: EquipmentStatus;
  rakeStatus: EquipmentStatus;
}

export interface WWDisinfectionState {
  chlorineDoseRate: number;       // mg/L
  chlorineDoseSetpoint: number;   // mg/L
  chlorineResidual: number;       // mg/L (after contact chamber)
  chlorineContactTime: number;    // minutes
  effluentPH: number;             // S.U.
  effluentBOD: number;            // mg/L (final compliance)
  effluentTSS: number;            // mg/L (final compliance)
  effluentNH3: number;            // mg/L (final compliance)
  effluentFlow: number;           // MGD
  chlorinePump: EquipmentStatus;
  dechlorinationDoseRate: number; // mg/L (sodium bisulfite)
  dechlorinationSetpoint: number; // mg/L
  dechlorinationPump: EquipmentStatus;
  totalResidualChlorine: number;  // mg/L after dechlorination (target <0.1)
}

export interface WWProcessState {
  timestamp: string;
  running: boolean;
  simSpeed: number;
  headworks: HeadworksState;
  primary: PrimaryClarifierState;
  aeration: AerationState;
  secondary: SecondaryClarifierState;
  wwDisinfection: WWDisinfectionState;
  alarms: Alarm[];
  activeScenario: string | null;
}

export function createInitialWWState(): WWProcessState {
  return {
    timestamp: new Date().toISOString(),
    running: true,
    simSpeed: 1,
    headworks: {
      influentFlow: 8.0,
      influentPump1: { running: true, fault: false, speed: 75, runHours: 2400 },
      influentPump2: { running: true, fault: false, speed: 50, runHours: 1800 },
      barScreenDiffPressure: 6.0,
      gritCollectorStatus: { running: true, fault: false, speed: 100, runHours: 5000 },
      influentBOD: 220,
      influentTSS: 250,
      influentNH3: 28,
      influentTemperature: 18,
      influentPH: 7.1,
      influentValve: { open: true, fault: false, position: 100 },
      sourceBODBase: 220,
      sourceTSSBase: 250,
      sourceNH3Base: 28,
      sourceFlowBase: 8.0,
    },
    primary: {
      primaryEffluentBOD: 154,
      primaryEffluentTSS: 100,
      sludgeBlanketLevel: 1.5,
      surfaceOverflowRate: 1020,
      primarySludgePump: { running: true, fault: false, speed: 50, runHours: 3200 },
      scraperStatus: { running: true, fault: false, speed: 100, runHours: 7500 },
      sludgeWastingRate: 50,
      sludgeWastingSetpoint: 50,
    },
    aeration: {
      dissolvedOxygen: 2.0,
      doSetpoint: 2.0,
      mlss: 3000,
      mlvss: 2250,
      foodToMassRatio: 0.3,
      srt: 10,
      svi: 120,
      blower1: { running: true, fault: false, speed: 65, runHours: 8000 },
      blower2: { running: false, fault: false, speed: 0, runHours: 4000 },
      airflowRate: 1950,
      airflowSetpoint: 2000,
      rasFlow: 3.0,
      rasSetpoint: 3.0,
      rasPump: { running: true, fault: false, speed: 60, runHours: 6000 },
      wasFlow: 15,
      wasSetpoint: 15,
      wasPump: { running: true, fault: false, speed: 40, runHours: 2000 },
      aerationBasinBOD: 8,
      aerationBasinNH3: 2.0,
      aerationBasinNO3: 15.0,
      hydraulicRetentionTime: 6.0,
      temperature: 18,
    },
    secondary: {
      effluentTSS: 12,
      effluentBOD: 10,
      sludgeBlanketLevel: 1.0,
      surfaceOverflowRate: 600,
      scraperStatus: { running: true, fault: false, speed: 100, runHours: 8000 },
      rakeStatus: { running: true, fault: false, speed: 100, runHours: 8000 },
    },
    wwDisinfection: {
      chlorineDoseRate: 5.0,
      chlorineDoseSetpoint: 5.0,
      chlorineResidual: 0.8,
      chlorineContactTime: 30,
      effluentPH: 7.0,
      effluentBOD: 10,
      effluentTSS: 12,
      effluentNH3: 2.0,
      effluentFlow: 8.0,
      chlorinePump: { running: true, fault: false, speed: 60, runHours: 4500 },
      dechlorinationDoseRate: 0.7,
      dechlorinationSetpoint: 0.7,
      dechlorinationPump: { running: true, fault: false, speed: 40, runHours: 3000 },
      totalResidualChlorine: 0.03,
    },
    alarms: [],
    activeScenario: null,
  };
}
