export interface HmiInfo {
  title: string;
  category: 'Equipment' | 'Instrument' | 'Process' | 'Chemical' | 'Storage';
  description: string;
  whyItMatters: string;
  keyParameters: { name: string; range: string; note?: string }[];
  operatorTips?: string[];
}

export const hmiInfo: Record<string, HmiInfo> = {
  // ── INTAKE ──────────────────────────────────────────────────────────────
  sourceWater: {
    title: 'Raw Source Water',
    category: 'Process',
    description:
      'The raw water supply drawn from a river, reservoir, or lake before any treatment. Raw water quality varies with season, weather events, and upstream land use.',
    whyItMatters:
      'Understanding source water quality is the foundation of all treatment decisions. Rainfall events can spike turbidity ten-fold overnight, requiring rapid chemical dose adjustments. Seasonal algae blooms, agricultural runoff, and snowmelt each create distinct treatment challenges.',
    keyParameters: [
      { name: 'Turbidity', range: '1 – 500 NTU', note: 'Highly variable; drives coagulant demand' },
      { name: 'Temperature', range: '2 – 30 °C', note: 'Cold water slows flocculation; may need higher doses' },
      { name: 'pH', range: '6.5 – 8.5', note: 'Affects coagulant efficiency and disinfection' },
      { name: 'Alkalinity', range: '20 – 200 mg/L as CaCO₃', note: 'Buffering capacity; low alkalinity needs pH correction' },
    ],
    operatorTips: [
      'Check source water turbidity first thing every shift — it sets the baseline for the whole treatment train.',
      'After heavy rain, increase sample frequency and be ready to boost alum dose by 20–50%.',
      'Sudden taste/odor complaints often trace back to algae activity in the source; notify your supervisor.',
    ],
  },

  wetWell: {
    title: 'Wet Well (Raw Water Sump)',
    category: 'Storage',
    description:
      'A below-grade or in-ground basin that receives raw water from the intake structure and holds it temporarily before the intake pumps lift it into the treatment process.',
    whyItMatters:
      'The wet well decouples river flow variability from plant pump demand. It protects pumps from running dry, dampens surge pressures, and gives operators a buffer during rapid source fluctuations. Low level triggers automatic pump shutoff to prevent cavitation.',
    keyParameters: [
      { name: 'Normal operating range', range: '4 – 12 ft', note: 'Maintain within this band for best pump suction head' },
      { name: 'Low-level alarm', range: '< 3 ft', note: 'Pumps auto-stop below this level' },
      { name: 'High-level alarm', range: '> 13 ft', note: 'Indicates excessive inflow or pump failure' },
    ],
    operatorTips: [
      'Monitor wet well level during storms — rapid rise can overfill in minutes.',
      'A falling level with normal source flow usually indicates a pump running too fast or a valve partially closed.',
      'Never let the wet well run completely empty; restart carefully to avoid water hammer.',
    ],
  },

  intakeValve: {
    title: 'Intake Valve (XV-101)',
    category: 'Equipment',
    description:
      'A motor-operated butterfly or gate valve that controls the flow of raw water from the source into the wet well and intake piping. It is the primary isolation point for the entire intake system.',
    whyItMatters:
      'XV-101 is your first line of defense for shutting off raw water supply during emergencies, contamination events, or major maintenance. Partial closure can throttle flow to protect downstream equipment during flood conditions.',
    keyParameters: [
      { name: 'Normal position', range: '100% open', note: 'Full open during normal production' },
      { name: 'Throttle range', range: '40 – 100%', note: 'Do not throttle below 40% — risk of cavitation' },
      { name: 'Travel time (full open → closed)', range: '30 – 90 s', note: 'Depends on actuator model' },
    ],
    operatorTips: [
      'Never slam this valve closed quickly — use slow close to avoid water hammer through the intake piping.',
      'A valve that will not respond to open/close commands may have lost power or air supply to the actuator.',
      'Verify position feedback agrees with command before declaring a fault — limit switches can stick.',
    ],
  },

  intakePump1: {
    title: 'Intake Pump 1 (P-101)',
    category: 'Equipment',
    description:
      'A large vertical turbine or horizontal centrifugal pump that lifts raw water from the wet well and delivers it to the treatment plant headworks. P-101 is the lead pump in a lead/lag arrangement with P-102.',
    whyItMatters:
      'The intake pumps are the heart of plant supply. Without them, the plant stops producing water. The lead/lag configuration ensures continued operation if one pump trips on fault. Speed control (VFD) lets operators match pump output precisely to plant demand and maintain wet well level.',
    keyParameters: [
      { name: 'Design flow', range: '2 – 6 MGD per pump', note: 'Check pump curve for your plant' },
      { name: 'Motor speed', range: '30 – 60 Hz (VFD)', note: 'Lower Hz = lower flow and energy' },
      { name: 'Run hours (maintenance interval)', range: '4,000 – 8,000 hr', note: 'Check bearing and seal condition' },
      { name: 'Current draw', range: 'Per nameplate ± 10%', note: 'High amps = cavitation or mechanical issue' },
    ],
    operatorTips: [
      'Start pumps slowly (low Hz) and ramp up to avoid water hammer and motor inrush.',
      'A pump running at high speed but producing low flow is likely cavitating — check wet well level and suction strainer.',
      'Always investigate a fault before restarting; repeated resets can burn out motor windings.',
      'Log run hours each shift; pumps approaching their maintenance interval need scheduled service.',
    ],
  },

  intakePump2: {
    title: 'Intake Pump 2 (P-102)',
    category: 'Equipment',
    description:
      'The lag (standby) intake pump paired with P-101. It starts automatically when demand exceeds P-101\'s capacity or when P-101 faults. Both pumps can run simultaneously at high plant demand.',
    whyItMatters:
      'Redundancy is critical for continuous plant production. P-102 ensures that a single pump failure does not shut down the water supply. Regular rotation between lead and lag pumps prevents one from sitting idle too long and developing seal or bearing problems.',
    keyParameters: [
      { name: 'Design flow', range: '2 – 6 MGD per pump', note: 'Identical to P-101' },
      { name: 'Lag start setpoint (wet well)', range: 'When P-101 at max speed and level still falling' },
      { name: 'Rotation schedule', range: 'Weekly lead/lag swap', note: 'Keeps both pumps exercised' },
    ],
    operatorTips: [
      'Rotate lead/lag pumps weekly to equalize run hours and keep the standby pump ready.',
      'Test the lag pump weekly by briefly running it and verifying flow and pressure.',
      'If both pumps fault simultaneously, check for power supply issues before resetting.',
    ],
  },

  intakeScreen: {
    title: 'Intake Bar/Mesh Screen (INT-SCR-001)',
    category: 'Equipment',
    description:
      'A coarse physical screen (typically 1/4″ to 1/2″ openings) installed at the intake that removes large debris such as leaves, fish, sticks, and trash from the raw water before it enters the pumps and treatment process.',
    whyItMatters:
      'A plugged screen starves the pumps of water, causing wet well depletion, pump cavitation, and potential plant shutdown. Screen differential pressure (DP) is the best indicator of plugging. High DP after storms is very common and requires prompt attention.',
    keyParameters: [
      { name: 'Normal differential pressure', range: '< 3 PSI', note: 'Clean screen' },
      { name: 'Warning threshold', range: '3 – 5 PSI', note: 'Plan to clean soon' },
      { name: 'Alarm / action threshold', range: '> 5 PSI', note: 'Clean immediately to protect pumps' },
    ],
    operatorTips: [
      'Check screen DP at the start of every shift and after heavy rain or windstorms.',
      'Use the CLEAR SCREEN button to simulate cleaning during training; in the field, this involves physical cleaning or a rotating drum screen backwash cycle.',
      'Keep a log of screen cleaning events — frequent plugging suggests the source screen may need replacement or a larger mesh.',
    ],
  },

  rawFlowMeter: {
    title: 'Raw Water Flow Meter (INT-FIT-001)',
    category: 'Instrument',
    description:
      'An electromagnetic or ultrasonic flow meter measuring the total volume of raw water entering the plant per unit time. This is the primary plant influent flow measurement.',
    whyItMatters:
      'All chemical feed rates are calculated as a ratio to plant flow (mg/L = dose per unit of water). If the flow meter reads incorrectly, every chemical dose will be wrong. This meter is also used for daily production reporting and regulatory compliance.',
    keyParameters: [
      { name: 'Typical plant flow', range: '1 – 10 MGD', note: 'Depends on plant design capacity' },
      { name: 'Units', range: 'MGD (million gallons per day)' },
      { name: 'Calibration frequency', range: 'Annually or per manufacturer', note: 'Verify against totalized meter' },
    ],
    operatorTips: [
      'Compare this meter reading to the pump motor load — if they disagree significantly, suspect a meter or valve issue.',
      'Totalizer readings are used for daily production logs; record at the start and end of each shift.',
      'A sudden drop to zero with pumps still running may indicate a broken signal cable or dead transmitter — not necessarily zero flow.',
    ],
  },

  rawTurbidity: {
    title: 'Raw Water Turbidity Analyzer (INT-AIT-001)',
    category: 'Instrument',
    description:
      'An online nephelometric turbidity unit (NTU) analyzer that continuously measures the cloudiness of raw incoming water caused by suspended particles, sediment, algae, and colloidal material.',
    whyItMatters:
      'Raw turbidity is the single most important trigger for adjusting coagulant dose. High turbidity means more particles to remove, requiring more alum. This measurement drives jar test decisions and feedforward chemical control. It is also a leading indicator of source water quality events.',
    keyParameters: [
      { name: 'Low turbidity (lake/groundwater blend)', range: '< 5 NTU', note: 'Lower alum dose required' },
      { name: 'Moderate turbidity', range: '5 – 50 NTU', note: 'Normal range for river sources' },
      { name: 'High turbidity (storm event)', range: '50 – 500 NTU', note: 'Significantly increase alum dose; consider slower flow rate' },
      { name: 'Regulatory note', range: 'No direct limit on raw water', note: 'Finished water must be < 0.3 NTU' },
    ],
    operatorTips: [
      'Run a jar test whenever raw turbidity changes by more than 20%  — bench results tell you the optimal alum dose for current conditions.',
      'Rising raw turbidity often leads rising clarifier turbidity by 15–30 minutes; adjust dose proactively.',
      'Clean the turbidity probe sensor cell weekly — a dirty cell reads falsely high.',
    ],
  },

  // ── COAGULATION / FLOCCULATION ──────────────────────────────────────────
  rapidMixer: {
    title: 'Rapid Mixer (M-201)',
    category: 'Equipment',
    description:
      'A high-speed impeller mixer located in the rapid mix basin where coagulant (alum) is injected. It violently agitates the water for 30–60 seconds to uniformly disperse the coagulant throughout the water volume.',
    whyItMatters:
      'Proper rapid mixing is critical for coagulation efficiency. If mixing is inadequate, some water receives too much coagulant and some too little, leading to poor floc formation and high settled turbidity. The velocity gradient (G-value) controls mixing intensity.',
    keyParameters: [
      { name: 'Typical speed', range: '300 – 800 RPM' },
      { name: 'Velocity gradient (G)', range: '300 – 1,000 s⁻¹', note: 'G = measure of mixing intensity' },
      { name: 'Detention time', range: '30 – 120 seconds' },
    ],
    operatorTips: [
      'Never inject coagulant with the mixer stopped — you will get clumping and extremely poor treatment.',
      'Reduce mixer speed during low-flow periods to maintain proper G-value; consult your plant O&M manual for the formula.',
      'A tripped mixer during operation requires immediate dose reduction until it is restarted.',
    ],
  },

  slowMixer: {
    title: 'Flocculation Mixers (M-202 / M-203)',
    category: 'Equipment',
    description:
      'Low-speed paddle or impeller mixers in the flocculation basin that provide gentle, sustained agitation to help destabilized particles gently collide and grow into larger, visible floc particles (like fluffy snowflakes) over 15–30 minutes.',
    whyItMatters:
      'Flocculation bridges the gap between chemical treatment and settling. Too little mixing: particles do not collide and stay small. Too much mixing: floc breaks apart (shear). The right gentle mixing produces large, dense floc that settles quickly in the clarifier.',
    keyParameters: [
      { name: 'Typical speed', range: '5 – 40 RPM' },
      { name: 'Velocity gradient (G)', range: '10 – 75 s⁻¹', note: 'Much lower than rapid mix' },
      { name: 'Flocculation time', range: '15 – 30 minutes' },
    ],
    operatorTips: [
      'Visually inspect the floc basin for good floc formation — you should see visible, distinct floc particles floating in the basin.',
      'Pin floc (tiny, dispersed particles) usually means mixer speed is too high or coagulant dose is too low.',
      'Increase tapered flocculation by running early stage mixers faster and later stage mixers slower.',
    ],
  },

  alumFeed: {
    title: 'Alum Chemical Feed (COG-P-201)',
    category: 'Chemical',
    description:
      'A metering pump system that delivers aluminum sulfate (alum, Al₂(SO₄)₃) — or sometimes polyaluminum chloride (PACl) — to the rapid mix basin. Alum neutralizes the negative surface charge on suspended particles, allowing them to stick together.',
    whyItMatters:
      'Alum is the primary coagulant for most surface water plants and the single most important chemical treatment decision an operator makes each day. Too little alum leaves particles in the water; too much wastes chemical, drops pH, and produces excess sludge. Finding the optimal dose through jar testing is a core daily operator skill.',
    keyParameters: [
      { name: 'Typical dose range', range: '5 – 40 mg/L', note: 'Highly dependent on raw water turbidity and alkalinity' },
      { name: 'Jar test optimal dose', range: 'Determined daily', note: 'Best tool for setting dose' },
      { name: 'pH impact', range: 'Lowers pH by 0.1 – 0.5 units', note: 'High doses may need caustic supplementation' },
      { name: 'Alum concentration (bulk)', range: '48 – 50% solution', note: 'Verify before calculating pump rates' },
    ],
    operatorTips: [
      'Perform a jar test at the start of every shift and whenever raw turbidity changes significantly.',
      'Alum dose should roughly track turbidity: double the turbidity often means 1.5× the dose (not exactly double).',
      'A sudden rise in filter head loss or effluent turbidity often means your alum dose is too low — increase and watch for improvement.',
      'Check the alum day tank level every shift; empty tank = no coagulation = plant upset.',
    ],
  },

  pHAdjust: {
    title: 'pH Adjustment Chemical Feed',
    category: 'Chemical',
    description:
      'A metering pump system that adds caustic soda (NaOH), lime (Ca(OH)₂), or soda ash (Na₂CO₃) to compensate for pH depression caused by alum addition and to optimize the coagulation pH window. Some plants add CO₂ or acid to lower pH instead.',
    whyItMatters:
      'Alum coagulation works best between pH 6.0–7.5. Low-alkalinity source waters can see pH drop to 5.5 or below with high alum doses, significantly reducing treatment effectiveness and causing corrosive finished water. pH control also affects chlorine chemistry and regulatory corrosion control requirements.',
    keyParameters: [
      { name: 'Target coagulation pH', range: '6.0 – 7.5', note: 'Confirm optimal pH via jar test' },
      { name: 'Caustic (50% NaOH) dose', range: '1 – 20 mg/L', note: 'Highly corrosive — follow PPE protocols' },
      { name: 'Lime dose', range: '5 – 50 mg/L as Ca(OH)₂', note: 'Also adds alkalinity and hardness' },
    ],
    operatorTips: [
      'Always add caustic slowly and downstream of alum injection — never add them together before dilution.',
      'Caustic is a severe burn hazard; always wear face shield, gloves, and apron when handling.',
      'If pH is drifting low consistently, check your source alkalinity — you may need to permanently increase lime dose.',
    ],
  },

  flocTurbidity: {
    title: 'Floc Basin Turbidity Analyzer (COG-AIT-001)',
    category: 'Instrument',
    description:
      'An online turbidity analyzer measuring the cloudiness of water at the exit of the flocculation basin, just before it enters the sedimentation clarifier. This reading reflects how well coagulation and flocculation have worked.',
    whyItMatters:
      'If floc basin turbidity is unexpectedly high, there is a problem upstream — either insufficient coagulant, wrong pH, mixer failure, or shock turbidity from the source. Catching it here allows correction before poor water loads the clarifier and filters.',
    keyParameters: [
      { name: 'Expected turbidity (good coagulation)', range: '< 20 NTU after settling visible floc', note: 'Raw turbidity determines starting point' },
      { name: 'Poor coagulation indicator', range: 'Turbidity not significantly below raw water', note: 'Adjust dose immediately' },
    ],
    operatorTips: [
      'Compare floc basin turbidity to raw turbidity — good coagulation should reduce it significantly.',
      'Look for visible, cottony floc particles in the basin during rounds; absence suggests poor chemistry.',
      'A spike in floc basin turbidity that tracks raw turbidity 20 minutes later confirms you need to adjust dose proactively.',
    ],
  },

  // ── SEDIMENTATION / FILTRATION ──────────────────────────────────────────
  clarifier: {
    title: 'Sedimentation Clarifier',
    category: 'Process',
    description:
      'A large circular or rectangular settling basin where coagulated and flocculated water is held for 2–4 hours, allowing floc particles to slowly sink to the bottom by gravity, producing clarified water that overflows the effluent weir.',
    whyItMatters:
      'The clarifier is the primary solids-removal step, typically removing 60–90% of suspended solids. A well-operated clarifier dramatically reduces the loading on the filters, extending filter run times and producing lower effluent turbidity. Poor clarifier performance directly stresses filters and risks turbidity breakthrough.',
    keyParameters: [
      { name: 'Surface overflow rate', range: '0.5 – 1.0 gal/min/ft²', note: 'Exceeding this causes carryover' },
      { name: 'Effluent turbidity (ideal)', range: '< 5 NTU', note: 'Less than 2 NTU is excellent' },
      { name: 'Hydraulic detention time', range: '2 – 4 hours' },
    ],
    operatorTips: [
      'A good clarifier requires good floc. If clarifier performance is poor, investigate coagulation first.',
      'High winds can disrupt surface settling in open rectangular basins — be alert on windy days.',
      'Reduce plant flow rate during very high turbidity events to give particles more settling time.',
    ],
  },

  clarifierTurbidity: {
    title: 'Clarifier Effluent Turbidity (SED-AIT-001)',
    category: 'Instrument',
    description:
      'An online turbidity analyzer measuring the clarity of water leaving the clarifier settling basin and entering the filter. This is a key intermediate quality indicator for the sedimentation process.',
    whyItMatters:
      'High clarifier effluent turbidity is a leading indicator of filter stress. Filters are designed to handle low turbidity (< 5 NTU) effectively; higher loading shortens run time, increases head loss buildup rate, and risks turbidity breakthrough. This value should continuously decline after a treatment upset.',
    keyParameters: [
      { name: 'Excellent', range: '< 2 NTU' },
      { name: 'Good', range: '2 – 5 NTU' },
      { name: 'Marginal — investigate', range: '5 – 10 NTU' },
      { name: 'Poor — take action', range: '> 10 NTU', note: 'Adjust coagulation immediately' },
    ],
    operatorTips: [
      'If clarifier turbidity spikes suddenly, check alum pump operation and flow meter — dose interruption is the most common cause.',
      'Gradual creep in clarifier turbidity over a shift often means rising raw turbidity with dose that has not been updated.',
      'Record clarifier turbidity at least once per hour; regulatory compliance relies on continuous treatment effectiveness.',
    ],
  },

  sludgeBlanket: {
    title: 'Sludge Blanket Level (SED-LIT-001)',
    category: 'Instrument',
    description:
      'A level instrument (typically an ultrasonic or suspended solids sensor) measuring the depth of the accumulated sludge/floc layer at the bottom of the clarifier. The sludge blanket must be maintained within a narrow operating range.',
    whyItMatters:
      'Too high: sludge overflows the effluent weir, causing high turbidity and sludge carryover to the filters. Too low: treatment capacity is wasted and the sludge pump wastes energy pumping dilute water. Correct sludge blanket management is a routine but critical daily task.',
    keyParameters: [
      { name: 'Target operating range', range: '3 – 7 ft from bottom' },
      { name: 'High alarm', range: '> 8 ft', note: 'Increase sludge pump run time immediately' },
      { name: 'Low alarm', range: '< 2 ft', note: 'Reduce sludge withdrawal to allow blanket to build' },
    ],
    operatorTips: [
      'Trend sludge blanket level over your shift — a rising trend means you need to increase withdrawal; declining means reduce it.',
      'High turbidity events mean more floc, meaning faster blanket rise — increase sludge pumping frequency proactively.',
      'Some clarifiers use a sludge blanket as part of their treatment (blanket clarifiers) — know your specific process.',
    ],
  },

  sludgePump: {
    title: 'Sludge Withdrawal Pump (P-301)',
    category: 'Equipment',
    description:
      'A pump (typically progressive cavity or submersible centrifugal) that continuously or intermittently withdraws settled sludge from the clarifier bottom to maintain the sludge blanket at the correct depth. Sludge is pumped to a lagoon, thickener, or dewatering facility.',
    whyItMatters:
      'Without regular sludge withdrawal, the blanket rises uncontrolled until sludge carries over into the effluent, contaminating the filters and potentially causing a turbidity violation. Sludge disposal is also a regulated activity at most plants.',
    keyParameters: [
      { name: 'Sludge solids concentration', range: '1 – 5% (10,000 – 50,000 mg/L)' },
      { name: 'Pump run schedule', range: 'Continuous or timed cycles', note: 'Adjust based on blanket level trend' },
      { name: 'Sludge volume', range: 'Varies with raw water turbidity' },
    ],
    operatorTips: [
      'Increase sludge pump run time during high turbidity events to keep up with accelerated floc accumulation.',
      'If the pump faults, manually increase run time on the backup before the blanket rises to alarm level.',
      'Track daily sludge volume removed — a sudden drop may indicate a pump, valve, or pipe blockage.',
    ],
  },

  filterBed: {
    title: 'Rapid Sand Filter (FLT-F-301)',
    category: 'Process',
    description:
      'A gravity or pressure filter containing media layers — typically anthracite coal over sand over gravel — that physically traps and removes fine particles, floc, and microorganisms that escaped sedimentation. This is the last particle removal step before disinfection.',
    whyItMatters:
      'Filtered water turbidity is a primary regulatory requirement under the Surface Water Treatment Rule (SWTR): finished water must be < 0.3 NTU (with a target of < 0.1 NTU). The filter is the safety net for the entire treatment process. A turbidity breakthrough can trigger public notification requirements.',
    keyParameters: [
      { name: 'Filter rate', range: '2 – 5 gal/min/ft²', note: 'Check your plant design rate' },
      { name: 'Terminal head loss (backwash trigger)', range: '8 – 10 ft water column' },
      { name: 'Maximum run time (backwash trigger)', range: '24 – 72 hours', note: 'Even if head loss is low' },
      { name: 'Effluent turbidity limit', range: '< 0.3 NTU (regulatory maximum)' },
    ],
    operatorTips: [
      'Record filter head loss and run time at each shift change — these are often required by your operating permit.',
      'A filter showing high effluent turbidity immediately after backwash (filter ripening period) is normal — give it 15–30 minutes.',
      'Never bring a filter online after a very long idle period without running it to waste first.',
      'If effluent turbidity rises suddenly mid-run, check coagulation — a chemical dose interruption is usually the cause.',
    ],
  },

  filterHeadLoss: {
    title: 'Filter Head Loss / Differential Pressure (FLT-PDT-001)',
    category: 'Instrument',
    description:
      'A differential pressure transmitter measuring the water pressure drop across the filter bed from the top (influent header) to the bottom (effluent underdrain). As the filter collects particles, resistance increases and head loss grows.',
    whyItMatters:
      'Head loss is the primary indicator of how "full" (loaded) a filter is. Once head loss reaches the terminal limit, the filter loses hydraulic capacity and must be backwashed to restore clean-bed performance. Ignoring head loss alarms risks losing filter production entirely.',
    keyParameters: [
      { name: 'Clean bed head loss', range: '1 – 2 ft', note: 'Just after backwash' },
      { name: 'Warning threshold', range: '6 – 7 ft', note: 'Plan backwash in next 2–4 hours' },
      { name: 'Terminal head loss (backwash now)', range: '8 – 10 ft' },
      { name: 'Rate of head loss rise', range: '< 1 ft/hr normal', note: 'Faster rise = more particulate loading' },
    ],
    operatorTips: [
      'Head loss rising faster than normal usually means high clarifier turbidity is loading the filter harder than usual — fix coagulation.',
      'Track head loss rate over your shift: if it doubled since last shift, investigate upstream treatment.',
      'Very slow head loss rise may indicate channeling in the filter media — schedule media inspection.',
    ],
  },

  filterEffluent: {
    title: 'Filter Effluent Turbidity (FLT-AIT-001)',
    category: 'Instrument',
    description:
      'An online continuous turbidity analyzer on the filter effluent (filtered water) line. This is one of the most critical measurements in the plant — it directly measures whether the treatment process is producing safe, clear water.',
    whyItMatters:
      'Under the Safe Drinking Water Act (SDWA) Surface Water Treatment Rule, filtered water turbidity must not exceed 0.3 NTU in 95% of measurements each month. A reading above this limit can trigger reporting requirements, public notification, or a boil water advisory. This is the final check before water enters the clearwell.',
    keyParameters: [
      { name: 'Regulatory maximum (SWTR)', range: '0.3 NTU' },
      { name: 'Operational target', range: '< 0.1 NTU' },
      { name: 'Action level (investigate immediately)', range: '> 0.2 NTU' },
      { name: 'Post-backwash ripening period', range: '0.1 – 0.5 NTU (normal, < 30 min)' },
    ],
    operatorTips: [
      'Never ignore a filter effluent turbidity above 0.2 NTU — investigate cause immediately and document your actions.',
      'If turbidity rises rapidly after starting a filter, check that the backwash was complete and the filter was adequately rinsed.',
      'Calibrate this analyzer at least quarterly; a miscalibrated instrument giving false comfort is dangerous.',
      'Consider taking that filter offline and routing to waste if effluent turbidity exceeds 0.3 NTU for more than a few minutes.',
    ],
  },

  backwash: {
    title: 'Filter Backwash Process',
    category: 'Process',
    description:
      'A periodic cleaning cycle in which flow through the filter is reversed at high velocity to expand and fluidize the filter media bed, dislodging and washing away accumulated particles and floc. Typically takes 10–20 minutes. The backwash waste water is recycled to the plant headworks.',
    whyItMatters:
      'Backwashing is essential to restore filter capacity and remove the solids that build up during the filter run. Inadequate backwashing causes mud balls to form in the media, reducing effective filter life and causing channeling. A well-executed backwash is the most important maintenance task for filter performance.',
    keyParameters: [
      { name: 'Backwash rate', range: '15 – 20 gal/min/ft²', note: 'Must be sufficient to expand bed 25–50%' },
      { name: 'Duration', range: '10 – 20 minutes', note: 'Until waste turbidity clears' },
      { name: 'Air scour (if equipped)', range: '3 – 5 scfm/ft²', note: 'Before water backwash to break up mud balls' },
      { name: 'Filter-to-waste (ripening) period', range: '5 – 15 minutes after restart', note: 'Do not send to clearwell until turbidity stabilizes' },
    ],
    operatorTips: [
      'Always backwash when head loss reaches the terminal limit, not just when run time exceeds a set number of hours.',
      'Watch the backwash waste turbidity — if it does not clear after 20 minutes, consider an extended air scour.',
      'After backwash, run filter to waste until effluent turbidity is < 0.1 NTU before routing to the clearwell.',
      'Log every backwash: date, time, trigger (head loss or time), duration, and visual observations.',
    ],
  },

  // ── DISINFECTION / CLEARWELL ────────────────────────────────────────────
  chlorineFeed: {
    title: 'Chlorine Feed System (DIS-P-401)',
    category: 'Chemical',
    description:
      'A metering pump system delivering sodium hypochlorite (bleach, NaOCl) or gaseous chlorine (Cl₂) to the contact chamber inlet. Chlorine is the most widely used drinking water disinfectant in the United States, providing both primary disinfection and a protective residual through the distribution system.',
    whyItMatters:
      'Proper chlorination is the last and most critical barrier to waterborne disease. Operators must achieve a minimum CT value (concentration × contact time) to inactivate Giardia, Cryptosporidium, and viruses per the SWTR. Underdosing risks public health. Overdosing creates taste/odor complaints, disinfection byproduct (DBP) violations, and pipe corrosion.',
    keyParameters: [
      { name: 'Typical dose range', range: '0.5 – 3 mg/L', note: 'Depends on demand and CT requirement' },
      { name: 'Minimum plant residual', range: '≥ 0.2 mg/L free chlorine', note: 'Regulatory minimum before distribution' },
      { name: 'Target residual', range: '0.5 – 1.5 mg/L', note: 'Maintains residual to distribution system edge' },
      { name: 'CT required (Giardia at 15°C, pH 7)', range: '≈ 73 mg·min/L', note: 'Confirm with state regulations' },
      { name: 'DBP formation concern', range: '> 2 mg/L dose at high TOC', note: 'May cause THM/HAA5 limit exceedances' },
    ],
    operatorTips: [
      'Check chlorine residual at the plant and at representative distribution points every shift.',
      'Sodium hypochlorite degrades over time — verify tank concentration via titration monthly and after long storage.',
      'During high-temperature summer months, chlorine demand increases and residuals may drop faster — increase monitoring frequency.',
      'A sudden loss of chlorine residual is an emergency — check pump operation, day tank level, and bulk supply immediately.',
    ],
  },

  fluorideFeed: {
    title: 'Fluoride Feed System (DIS-P-402)',
    category: 'Chemical',
    description:
      'A metering pump system delivering fluorosilicic acid (H₂SiF₆) or sodium fluoride (NaF) to the finished water to achieve the EPA-recommended fluoride concentration for public health benefit. Fluoridation prevents dental caries (tooth decay) in the community.',
    whyItMatters:
      'Community water fluoridation is a public health mandate at many utilities, endorsed by the CDC as one of the ten great public health achievements of the 20th century. Operators must maintain the concentration within a tight band: too low loses the health benefit; exceeding 4 mg/L (MCL) can cause dental and skeletal fluorosis and is a regulatory violation.',
    keyParameters: [
      { name: 'EPA recommended level', range: '0.7 mg/L' },
      { name: 'Acceptable operating range', range: '0.6 – 0.8 mg/L' },
      { name: 'Maximum Contaminant Level (MCL)', range: '4.0 mg/L', note: 'Never exceed this level' },
      { name: 'Secondary MCL (cosmetic/taste)', range: '2.0 mg/L', note: 'Above this is reportable' },
    ],
    operatorTips: [
      'Verify fluoride residual with a grab sample and ion meter or colorimetric test every shift — do not rely solely on the online analyzer.',
      'Fluorosilicic acid is highly corrosive and dangerous; always wear full PPE and have an eyewash station immediately accessible.',
      'If fluoride drops below 0.6 mg/L, increase dose immediately and record the deviation in your operations log.',
      'Fluoride pumps should have a redundant (backup) pump that automatically engages if the primary fails.',
    ],
  },

  contactChamber: {
    title: 'Chlorine Contact Chamber',
    category: 'Process',
    description:
      'A baffled concrete chamber designed to ensure that every volume of water receives adequate contact time with disinfectant (chlorine) before leaving the plant. The baffles force water to travel a long, tortuous path, preventing short-circuiting.',
    whyItMatters:
      'Regulatory compliance under the Surface Water Treatment Rule requires achieving a minimum CT value — the product of the chlorine residual concentration (C, in mg/L) and the T10 contact time (the time at which 10% of the water has passed through). Without adequate CT, pathogens may survive and enter the distribution system.',
    keyParameters: [
      { name: 'Baffling factor (T10/T)', range: '0.5 – 0.7 for baffled chamber', note: 'Higher = more efficient contact' },
      { name: 'CT required (Giardia, 1-log inactivation)', range: '≈ 7 mg·min/L at 15°C pH 7' },
      { name: 'Detention time', range: '15 – 60 minutes', note: 'Depends on flow rate and tank volume' },
    ],
    operatorTips: [
      'CT credit is calculated from the measured chlorine residual at the exit of the contact chamber and the T10 time from tracer studies.',
      'At peak flow rates, detention time is shortest — check that CT is still achieved before increasing plant flow.',
      'Maintain the contact chamber completely covered to prevent sunlight from degrading chlorine residual.',
    ],
  },

  uvSystem: {
    title: 'UV Disinfection System',
    category: 'Equipment',
    description:
      'A bank of ultraviolet (UV) lamps that exposes water to UV light at 254 nm wavelength, damaging the DNA of microorganisms and preventing them from reproducing. UV is particularly effective against Cryptosporidium and Giardia, which are resistant to normal chlorine concentrations.',
    whyItMatters:
      'Cryptosporidium is the causative agent of the 1993 Milwaukee outbreak that sickened 400,000 people and killed over 100. It is highly resistant to chlorine. UV provides reliable inactivation of Crypto without chemical addition. Plants that rely on UV for Crypto credit must monitor UV dose continuously.',
    keyParameters: [
      { name: 'UV dose (target)', range: '≥ 40 mJ/cm²', note: 'For 3-log Crypto inactivation per LT2 Rule' },
      { name: 'Minimum validated dose', range: 'Per reactor validation test results' },
      { name: 'Lamp transmittance requirement', range: 'UVT > 70%', note: 'High turbidity or TOC reduces transmittance' },
      { name: 'Lamp replacement interval', range: '9,000 – 12,000 hours' },
    ],
    operatorTips: [
      'UV systems must be online and confirmed operating before taking CT credit for Crypto inactivation — verify sensor readings, not just lamp status.',
      'Check and record UV dose and transmittance every shift; a declining trend may indicate lamp aging or fouling.',
      'Clean UV sensor windows and quartz sleeves per manufacturer schedule — fouling directly reduces dose delivery.',
      'Have spare lamps and ballasts on hand; UV lamp failures can cause compliance issues if the system goes offline.',
    ],
  },

  clearwell: {
    title: 'Clearwell / Finished Water Storage',
    category: 'Storage',
    description:
      'A large covered concrete or steel tank that stores finished (fully treated and disinfected) water ready for distribution. The clearwell serves as a hydraulic buffer between the treatment plant\'s constant production rate and the variable demand of the distribution system.',
    whyItMatters:
      'The clearwell provides additional contact time for CT compliance, equalizes plant production vs. demand fluctuations, and provides reserve storage for firefighting flows and peak demand periods. Low clearwell levels during peak demand may require reducing flow to the distribution system, impacting customer pressure.',
    keyParameters: [
      { name: 'Minimum operating level', range: '30% full', note: 'Below this, distribution pressure may drop' },
      { name: 'Typical operating range', range: '40 – 85% full' },
      { name: 'Storage volume', range: 'Typically 12 – 24 hours of average daily demand' },
      { name: 'Chlorine residual in clearwell', range: '≥ 0.2 mg/L at all times' },
    ],
    operatorTips: [
      'A dropping clearwell level during your shift means demand is exceeding production — notify the distribution team and consider increasing plant flow rate.',
      'A full clearwell with all filters running is inefficient; consider holding one filter in standby.',
      'The clearwell should be inspected and cleaned annually; proper coverage prevents light degradation of chlorine residual.',
      'Never let the clearwell drop below minimum — this can cause loss of system pressure and contamination events.',
    ],
  },

  plantChlorineResidual: {
    title: 'Plant Chlorine Residual Analyzer (DIS-AIT-001)',
    category: 'Instrument',
    description:
      'An online amperometric or colorimetric analyzer measuring free chlorine concentration in the treated water leaving the plant (at the clearwell discharge or distribution entry point). This is the primary compliance measurement for disinfection residual.',
    whyItMatters:
      'Federal regulations (SWTR/Disinfection Profiling rule) require utilities to demonstrate that an adequate chlorine residual leaves the plant at all times. A reading below 0.2 mg/L free chlorine triggers immediate investigation and may require issuing a boil water advisory if the cause cannot be quickly corrected.',
    keyParameters: [
      { name: 'Regulatory minimum (free Cl₂)', range: '0.2 mg/L at entry to distribution' },
      { name: 'Typical plant target', range: '0.5 – 1.5 mg/L', note: 'Higher values needed for long distribution systems' },
      { name: 'High residual concern', range: '> 2.0 mg/L', note: 'Customer taste/odor complaints; may increase DBP formation' },
    ],
    operatorTips: [
      'Verify online analyzer reading with a DPD drop count or colorimetric test at least once per shift — do not rely solely on the online reading.',
      'Residual dropping slowly over your shift usually means chlorine demand increased — check source water TOC, or increase dose.',
      'A sudden drop to near zero is an emergency: immediately check chlorine pump, day tank, and bulk supply before calling for help.',
      'Document every residual reading — these records are reviewed during state sanitary surveys.',
    ],
  },

  finishedPH: {
    title: 'Finished Water pH Analyzer (DIS-AIT-003)',
    category: 'Instrument',
    description:
      'An online pH sensor measuring the acidity or alkalinity of fully treated water leaving the plant. Finished water pH affects chlorine effectiveness, pipe corrosion, and customer perception, and is directly regulated under the Lead and Copper Rule.',
    whyItMatters:
      'The Lead and Copper Rule (LCR) requires utilities to optimize corrosion control, typically targeting a finished water pH and alkalinity that minimize lead and copper leaching from distribution pipes and plumbing fixtures. Low pH water is corrosive; high pH water can deposit scale. pH also controls how chlorine is distributed between effective hypochlorous acid and less effective hypochlorite ion.',
    keyParameters: [
      { name: 'Regulatory target (LCR corrosion control)', range: '7.0 – 8.5' },
      { name: 'Optimal disinfection pH (free Cl₂)', range: '6.5 – 7.5', note: 'More HOCl (effective form) at lower pH' },
      { name: 'Typical finished water target', range: '7.4 – 7.8', note: 'Balances corrosion control and disinfection' },
    ],
    operatorTips: [
      'Verify pH analyzer with a calibrated bench meter and fresh buffer standards at least weekly.',
      'If pH drops below 7.0, increase caustic or lime addition; investigate the cause — a coagulant overdose is common.',
      'Track pH trend over your shift; slow drift often means a chemical feed pump is drifting or a reagent is depleted.',
    ],
  },

  fluorideResidual: {
    title: 'Fluoride Residual Analyzer (DIS-AIT-004)',
    category: 'Instrument',
    description:
      'An online or grab-sample analyzer measuring the fluoride concentration in finished water leaving the plant. Fluoride is intentionally added to water to prevent dental cavities, but must be maintained within a precise regulatory range.',
    whyItMatters:
      'Fluoride must be maintained at or near 0.7 mg/L per EPA recommendations. Chronic exposure above 4 mg/L (the MCL) can cause dental and skeletal fluorosis, making this measurement safety-critical. Under-fluoridation wastes the public health benefit and may expose the utility to community concerns.',
    keyParameters: [
      { name: 'EPA recommended level', range: '0.7 mg/L' },
      { name: 'Acceptable range', range: '0.6 – 0.8 mg/L' },
      { name: 'MCL (Maximum Contaminant Level)', range: '4.0 mg/L', note: 'Violation if exceeded at entry point' },
      { name: 'SMCL (Secondary / cosmetic)', range: '2.0 mg/L' },
    ],
    operatorTips: [
      'Take a daily grab sample and verify with a calibrated ion-selective electrode (ISE) meter — online analyzers can drift.',
      'Document every daily reading in the fluoride log as required by your operating permit.',
      'High fluoride can be diluted by lowering the pump rate; do not shut off the pump entirely without supervisor approval.',
    ],
  },

  distChlorineResidual: {
    title: 'Distribution Chlorine Residual (DIS-AIT-002)',
    category: 'Instrument',
    description:
      'A chlorine residual analyzer or grab-sampling point measuring free or total chlorine at a point within the distribution system (downstream of the plant, typically at a representative far-end location). This confirms that disinfection protection persists throughout the distribution network.',
    whyItMatters:
      'Chlorine naturally decays as water travels through distribution pipes due to reactions with organic matter, pipe biofilm, and minerals. If chlorine reaches zero in any part of the system, that area is vulnerable to microbial regrowth and contamination. The SWTR requires a detectable chlorine residual throughout the distribution system at all times.',
    keyParameters: [
      { name: 'Minimum detectable residual', range: '> 0.0 mg/L at all locations', note: 'Zero is a compliance violation' },
      { name: 'Practical minimum target', range: '> 0.2 mg/L', note: 'Provides a safety margin against decay' },
      { name: 'Typical distribution range', range: '0.2 – 1.0 mg/L' },
    ],
    operatorTips: [
      'Consistently low residuals in one zone of the distribution system may indicate high demand (e.g., industrial user) or a dead-end main with excessive detention time — investigate.',
      'If distribution residual drops to zero, issue a precautionary boil water advisory per your emergency response plan and immediately notify your supervisor.',
      'Distribution residual monitoring locations should cover the hydraulically farthest points from the plant — these are most likely to have the lowest residuals.',
    ],
  },
};
