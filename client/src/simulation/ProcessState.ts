export interface EquipmentStatus {
  running: boolean;
  fault: boolean;
  speed: number; // 0-100%
  runHours: number;
}

export interface ValveStatus {
  open: boolean;
  fault: boolean;
  position: number; // 0-100%
}

export interface IntakeState {
  rawWaterFlow: number;        // MGD
  intakePump1: EquipmentStatus;
  intakePump2: EquipmentStatus;
  screenDiffPressure: number;  // PSI
  rawTurbidity: number;        // NTU
  rawWaterLevel: number;       // feet
  intakeValve: ValveStatus;
  // Source water quality parameters (operator-configurable)
  sourceTurbidityBase: number; // NTU — base turbidity of the river source
  sourceTemperature: number;   // °C  — affects coagulation efficiency
  sourcePH: number;            // S.U. — raw water pH
  sourceColor: number;         // PCU — apparent color / organic load indicator
  naturalInflow: number;       // dimensionless — wet well inflow rate multiplier
}

export interface CoagulationState {
  alumDoseRate: number;        // mg/L
  alumDoseSetpoint: number;    // mg/L
  rapidMixerSpeed: number;     // RPM
  slowMixerSpeed: number;      // RPM
  flocBasinTurbidity: number;  // NTU
  alumPumpStatus: EquipmentStatus;
  rapidMixerStatus: EquipmentStatus;
  slowMixerStatus: EquipmentStatus;
  pHAdjustDoseRate: number;    // mg/L
  pHAdjustDoseSetpoint: number; // mg/L
  pHAdjustPumpStatus: EquipmentStatus;
}

export interface SedimentationState {
  clarifierTurbidity: number;  // NTU
  sludgeBlanketLevel: number;  // feet
  filterHeadLoss: number;      // feet
  filterEffluentTurbidity: number; // NTU
  filterRunTime: number;       // hours
  backwashInProgress: boolean;
  backwashTimeRemaining: number; // seconds
  sludgePumpStatus: EquipmentStatus;
  clarifierRakeStatus: EquipmentStatus;
}

export interface DisinfectionState {
  chlorineDoseRate: number;    // mg/L
  chlorineDoseSetpoint: number; // mg/L
  chlorineResidualPlant: number; // mg/L
  chlorineResidualDist: number;  // mg/L
  finishedWaterPH: number;
  clearwellLevel: number;      // feet (0-20)
  chlorinePumpStatus: EquipmentStatus;
  uvSystemStatus: EquipmentStatus;
}

export interface Alarm {
  id: string;
  tag: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  value: number;
  setpoint: number;
  condition: 'HH' | 'H' | 'L' | 'LL';
  active: boolean;
  acknowledged: boolean;
  timestamp: string;
  acknowledgedAt?: string;
  clearedAt?: string;
}

export interface ProcessState {
  timestamp: string;
  running: boolean;
  simSpeed: number;
  intake: IntakeState;
  coagulation: CoagulationState;
  sedimentation: SedimentationState;
  disinfection: DisinfectionState;
  alarms: Alarm[];
  activeScenario: string | null;
}

export function createInitialState(): ProcessState {
  return {
    timestamp: new Date().toISOString(),
    running: true,
    simSpeed: 1,
    intake: {
      rawWaterFlow: 3.375,  // pump1 at 75% × 4.5 MGD max
      intakePump1: { running: true, fault: false, speed: 75, runHours: 1240 },
      intakePump2: { running: false, fault: false, speed: 0, runHours: 860 },
      screenDiffPressure: 1.8,
      rawTurbidity: 15.0,
      rawWaterLevel: 8.5,
      intakeValve: { open: true, fault: false, position: 100 },
      sourceTurbidityBase: 15,
      sourceTemperature: 16,
      sourcePH: 7.2,
      sourceColor: 5,
      naturalInflow: 0.07,  // ft/s equivalent; equilibrium at rawWaterFlow ≈ 3.5 MGD
    },
    coagulation: {
      alumDoseRate: 18.0,
      alumDoseSetpoint: 18.0,
      rapidMixerSpeed: 120,
      slowMixerSpeed: 45,
      flocBasinTurbidity: 8.5,
      alumPumpStatus: { running: true, fault: false, speed: 60, runHours: 2100 },
      rapidMixerStatus: { running: true, fault: false, speed: 100, runHours: 5200 },
      slowMixerStatus: { running: true, fault: false, speed: 100, runHours: 5200 },
      pHAdjustDoseRate: 2.8,
      pHAdjustDoseSetpoint: 2.8,
      pHAdjustPumpStatus: { running: true, fault: false, speed: 40, runHours: 1800 },
    },
    sedimentation: {
      clarifierTurbidity: 2.1,
      sludgeBlanketLevel: 1.5,
      filterHeadLoss: 2.3,
      filterEffluentTurbidity: 0.08,
      filterRunTime: 18.5,
      backwashInProgress: false,
      backwashTimeRemaining: 0,
      sludgePumpStatus: { running: true, fault: false, speed: 50, runHours: 3400 },
      clarifierRakeStatus: { running: true, fault: false, speed: 100, runHours: 8900 },
    },
    disinfection: {
      chlorineDoseRate: 2.0,
      chlorineDoseSetpoint: 2.0,
      chlorineResidualPlant: 1.7,
      chlorineResidualDist: 1.5,
      finishedWaterPH: 7.4,
      clearwellLevel: 14.0,
      chlorinePumpStatus: { running: true, fault: false, speed: 65, runHours: 4200 },
      uvSystemStatus: { running: true, fault: false, speed: 100, runHours: 6100 },
    },
    alarms: [],
    activeScenario: null,
  };
}
