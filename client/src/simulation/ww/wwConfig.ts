export const wwConfig = {
  simulationInterval: 500, // ms — same tick rate as DW
  historian: {
    maxPoints: 172800, // 24h at 500ms intervals
    retentionHours: 24,
  },
  alarmThresholds: {
    // Headworks
    'HW-FIT-001':  { ll: 1.0, l: 2.0, h: 12.0, hh: 14.0 },      // Influent flow (MGD) — design capacity
    'HW-PDT-001':  { h: 15, hh: 24 },                              // Bar screen DP (in H2O)

    // Primary Clarifier
    'PRI-LIT-001': { h: 4.0, hh: 6.0 },                           // Primary sludge blanket (ft)

    // Aeration Basin
    'AER-AIT-001': { ll: 0.5, l: 1.0, h: 4.0, hh: 6.0 },        // DO (mg/L) — nitrification requires >1.0
    'AER-AIT-002': { l: 1500, h: 4000, hh: 5000 },                // MLSS (mg/L) — process control target 2000-4000
    'AER-AIT-003': { h: 150, hh: 200 },                            // SVI (mL/g) — >150 indicates bulking

    // Secondary Clarifier
    'SEC-AIT-001': { h: 25, hh: 30 },                              // Effluent TSS (mg/L) — NPDES limit 30 mg/L (40 CFR 133)
    'SEC-AIT-002': { h: 25, hh: 30 },                              // Effluent BOD (mg/L) — NPDES limit 30 mg/L (40 CFR 133)
    'SEC-LIT-001': { h: 3.0, hh: 5.0 },                           // Sec. sludge blanket (ft)

    // WW Disinfection
    'WDI-AIT-001': { ll: 0.2, l: 0.5, h: 2.0, hh: 3.0 },        // Cl2 residual (mg/L)
    'WDI-AIT-002': { h: 0.05, hh: 0.1 },                          // TRC after dechlor (mg/L) — NPDES
    'WDI-AIT-003': { ll: 6.0, l: 6.5, h: 9.0, hh: 9.5 },        // Effluent pH — EPA SMCL
    'WDI-AIT-004': { h: 5.0, hh: 10.0 },                          // Effluent NH3 (mg/L) — NPDES
  },
};

// ── Aeration kinetics (Monod model) ────────────────────────────────────────────
export const AERATION_CONSTANTS = {
  // BOD removal — heterotrophic growth
  MU_MAX_BOD: 5.0,           // d⁻¹  max specific substrate utilization rate
  KS_BOD: 60,                // mg/L  half-saturation constant for BOD
  KO_BOD: 0.5,               // mg/L  half-saturation constant for DO (heterotrophs)
  THETA_BOD: 1.047,           // dimensionless  Arrhenius temperature correction

  // Nitrification — autotrophic growth
  MU_MAX_NH3: 0.5,           // d⁻¹  max specific growth rate of nitrifiers
  KN_NH3: 1.0,               // mg/L  half-saturation constant for NH3
  KO_NH3: 0.5,               // mg/L  half-saturation constant for DO (nitrifiers)
  THETA_NH3: 1.08,            // Arrhenius correction for nitrification
  O2_PER_NH3: 4.57,          // mg O2 per mg NH3-N oxidized (stoichiometric)
  MIN_SRT_FOR_NITRIFICATION: 5, // days

  // Denitrification (simplified)
  DENIT_RATE: 0.15,           // mg NO3-N / mg VSS / d  when DO < 0.5
  DENIT_DO_THRESHOLD: 0.5,    // mg/L  DO below which denitrification occurs

  // Biomass dynamics
  YIELD: 0.5,                // mg VSS / mg BOD consumed (heterotrophic yield)
  KD: 0.06,                  // d⁻¹  endogenous decay coefficient
  VSS_FRACTION: 0.75,        // MLVSS / MLSS ratio

  // Oxygen transfer
  BLOWER_CAPACITY_SCFM: 3000, // SCFM per blower at 100% speed
  OTE: 0.08,                  // oxygen transfer efficiency (fraction, fine-bubble diffusers)
  O2_DENSITY: 0.0012,         // kg/L density of air at STP (approx)
  O2_FRACTION: 0.21,          // fraction of air that is O2
  DO_SATURATION: 8.0,         // mg/L at typical temp/elevation

  // Basin geometry
  BASIN_VOLUME_MG: 1.0,       // million gallons (1 MG ≈ 3785 m³)
  BASIN_VOLUME_L: 3_785_000,  // liters

  // Reference temperature
  REF_TEMP: 20,               // degrees C for kinetic rates
};

// ── Headworks constants ────────────────────────────────────────────────────────
export const HEADWORKS_CONSTANTS = {
  PUMP_MAX_FLOW_MGD: 5.0,     // MGD per pump at 100% speed
  SCREEN_DRIFT_RATE: 0.0015,  // in H2O / simulated second (reaches 24 in ~4.4 h sim-time)
  SCREEN_CLEAN_DP: 3.0,       // in H2O after cleaning
  GRIT_EFFICIENCY_ON: 0.85,
  GRIT_EFFICIENCY_OFF: 0.2,
};

// ── Primary clarifier constants ────────────────────────────────────────────────
export const PRIMARY_CONSTANTS = {
  CLARIFIER_AREA_FT2: 7854,   // 100 ft diameter circle
  BASE_BOD_REMOVAL: 0.30,     // 30% baseline BOD removal
  BASE_TSS_REMOVAL: 0.55,     // 55% baseline TSS removal
  SLUDGE_ACCUMULATION_RATE: 0.00007, // ft/s base sludge accumulation
  SLUDGE_PUMP_REMOVAL_RATE: 0.0004,  // ft/s removal when pump running (5× accumulation)
  MAX_SLUDGE_BLANKET: 8.0,    // ft maximum
};

// ── Secondary clarifier constants ──────────────────────────────────────────────
export const SECONDARY_CONSTANTS = {
  CLARIFIER_AREA_FT2: 7854,   // 100 ft diameter circle
  BASE_SETTLING_EFFICIENCY: 0.99,
  SVI_PENALTY_PER_UNIT: 0.002, // efficiency loss per SVI unit above 100
};

// ── WW Disinfection constants ──────────────────────────────────────────────────
export const WW_DISINFECTION_CONSTANTS = {
  CL_EFFICIENCY: 0.85,
  CL_DEMAND_BOD: 0.05,        // mg Cl2 per mg/L BOD
  CL_DEMAND_TSS: 0.02,        // mg Cl2 per mg/L TSS
  CL_DEMAND_NH3: 0.10,        // mg Cl2 per mg/L NH3 (breakpoint)
  CONTACT_VOLUME_GAL: 500_000, // gallons
  DECHLOR_EFFICIENCY: 0.9,    // fraction of bisulfite that neutralizes chlorine
};
