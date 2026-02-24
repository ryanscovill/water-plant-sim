export interface EquipmentStatus {
  running: boolean;
  fault: boolean;
  speed: number;
  runHours: number;
}

export interface ValveStatus {
  open: boolean;
  fault: boolean;
  position: number;
}

export interface IntakeState {
  rawWaterFlow: number;
  intakePump1: EquipmentStatus;
  intakePump2: EquipmentStatus;
  screenDiffPressure: number;
  rawTurbidity: number;
  rawWaterLevel: number;
  intakeValve: ValveStatus;
  sourceTurbidityBase: number;
  sourceTemperature: number;
  sourcePH: number;
  sourceColor: number;
  naturalInflow: number;
}

export interface CoagulationState {
  alumDoseRate: number;
  alumDoseSetpoint: number;
  rapidMixerSpeed: number;
  slowMixerSpeed: number;
  flocBasinTurbidity: number;
  alumPumpStatus: EquipmentStatus;
  rapidMixerStatus: EquipmentStatus;
  slowMixerStatus: EquipmentStatus;
  pHAdjustDoseRate: number;
  pHAdjustDoseSetpoint: number;
  pHAdjustPumpStatus: EquipmentStatus;
}

export interface SedimentationState {
  clarifierTurbidity: number;
  sludgeBlanketLevel: number;
  filterHeadLoss: number;
  filterEffluentTurbidity: number;
  filterRunTime: number;
  backwashInProgress: boolean;
  backwashTimeRemaining: number;
  sludgePumpStatus: EquipmentStatus;
  clarifierRakeStatus: EquipmentStatus;
}

export interface DisinfectionState {
  chlorineDoseRate: number;
  chlorineDoseSetpoint: number;
  chlorineResidualPlant: number;
  chlorineResidualDist: number;
  finishedWaterPH: number;
  clearwellLevel: number;
  distributionDemand: number;
  chlorinePumpStatus: EquipmentStatus;
  uvSystemStatus: EquipmentStatus;
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

export interface Alarm {
  id: string;
  tag: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  value: number;
  setpoint: number;
  condition: 'HH' | 'H' | 'L' | 'LL';
  active: boolean;
  timestamp: string;
  clearedAt?: string;
}
