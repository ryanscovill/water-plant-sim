# Simulation Time Constants & Rate Calibration

All constants are calibrated so processes evolve at real-world rates at **simSpeed = 1×**.
Use **10×** or **60×** to compress time for training exercises.

At simSpeed = 1: each 500 ms real tick = 0.5 simulated seconds (`dt = 0.5 s`).
At simSpeed = 60: each 500 ms real tick = 30 simulated seconds (`dt = 30 s`).

---

## IntakeStage

| Constant | Value | Physical Process | Real-World Basis |
|---|---|---|---|
| `SCREEN_DRIFT_RATE` | 0.000037 PSI/s | Bar screen differential pressure build-up | Screen rises from clean (~0.5 PSI) to action level (~8 PSI) in ~3 days at 1× |
| Raw turbidity lag τ | 300 s | Turbidimeter response + river mixing inertia | 5-min instrument lag + upstream hydraulic mixing |
| Turbidity diurnal frequency | 0.0000727 rad/s | Sinusoidal diurnal river turbidity cycle | Period = 2π / 0.0000727 ≈ 86 400 s = 24-hour cycle |
| Pump/valve hydraulic lag τ | 5 s | Flow stabilisation after pump start/valve change | VFD-controlled centrifugal pumps: seconds to stabilise |

---

## CoagulationStage

| Constant | Value | Physical Process | Real-World Basis |
|---|---|---|---|
| Alum dose ramp τ | 5 s | Chemical metering pump response | Pump mechanism responds in 2–10 s |
| Alum dose decay τ | 5 s | Chemical injection line drain after pump stops | Short line drains quickly |
| pH adjust ramp τ | 5 s | Caustic metering pump response | Same as alum pump |
| pH adjust decay τ | 10 s | Caustic line drain (slightly slower) | Longer/more viscous line |
| **Floc basin turbidity τ** | **1500 s** | Flocculation basin HRT + mixing inertia | AWWA 20–30 min flocculation HRT; dose changes take ~25 min to show in effluent |
| Mixer spin-up/coast τ | 5 s | Electric motor acceleration/deceleration | Small mixer motors: 2–10 s to speed |

---

## SedimentationStage

| Constant | Value | Physical Process | Real-World Basis |
|---|---|---|---|
| **Clarifier turbidity τ** | **300 s** | Clarifier effluent turbidimeter response | 5-min instrument lag + basin mixing |
| **Sludge accumulation** | 0.0000694 ft/s × dt | Sludge blanket rise without pump running | Blanket reaches 6 ft (danger) in ~24 h at 1× |
| **Sludge removal (100%)** | 0.000347 ft/s × dt | Sludge pump removal rate at 100% speed | 5× accumulation rate — maintains blanket at ~17% pump speed |
| **Filter head loss rate** | 0.0000444 ft/s × dt | Head loss build-up at clean water turbidity | Accumulates ~11.5 ft over the 72-hour `FILTER_RUNTIME_TRIGGER` |
| Filter effluent turbidity τ | 120 s | Filter effluent turbidimeter response | 2-min instrument lag |
| Backwash duration | 600 s | Filter backwash cycle | AWWA/Ten States: 10-min backwash at normal flow |

The fouling multiplier `(1 + clarifierTurbidity / 5)` accelerates head loss accumulation when clarifier effluent is turbid, reducing filter run time below 72 h in upset conditions.

---

## DisinfectionStage

| Constant | Value | Physical Process | Real-World Basis |
|---|---|---|---|
| Chlorine pump ramp τ | 5 s | Chemical metering pump response | Pump mechanism responds in seconds |
| Chlorine pump decay τ | 10 s | Residual line drain after pump stops | Slightly longer line than alum |
| **Plant Cl₂ τ** | **120 s** | Chlorine analyser response + contact chamber mixing | 2-min analyser lag; contact chamber adds mixing delay |
| **Distribution Cl₂ τ** | **900 s** | Pipe transit from plant to distribution sample point + analyser | 15-min pipe transit to remote sample point |
| **pH τ** | **420 s** | Clearwell mixing lag + pH analyser response | ~7-min clearwell hydraulic mixing + analyser |
| **Clearwell `NOMINAL_INFLOW`** | **0.000283 m/s** | Level rise rate at nominal 3.375 MGD inflow | Based on ~6-hour storage clearwell: 3193 m³ ÷ 6.1 m height = 523 m² cross-section; 0.1479 m³/s ÷ 523 m² |

### Clearwell sizing basis

| Parameter | Value |
|---|---|
| Nominal plant flow | 3.375 MGD = 0.1479 m³/s |
| Storage target | ~6 hours |
| Clearwell volume | 3.375 MGD × 0.25 day × 3785 L/MG ≈ 3193 m³ |
| Clearwell height | 6.1 m |
| Cross-sectional area | 3193 ÷ 6.1 ≈ **523 m²** |
| Level rate at nominal flow | 0.1479 ÷ 523 ≈ **0.000283 m/s** |

Distribution demand outflow: `distributionDemand (MGD) × (0.000283 / 3.375) m/s per MGD`.
At 2.5 MGD demand: outflow ≈ 0.000210 m/s → net fill rate ≈ 0.0000733 m/s (~0.26 m/hr at 1×).

---

## Training Speed Guide

| simSpeed | 1 real minute = | Floc basin settles in | Filter run (72 h) compresses to | Clearwell drains (empty, 2.5 MGD demand) in |
|---|---|---|---|---|
| 1× | 1 sim-minute | ~25 real minutes | ~3 real days | ~8 real hours |
| 10× | 10 sim-minutes | ~2.5 real minutes | ~7.2 real hours | ~48 real minutes |
| 60× | 1 sim-hour | ~25 real seconds | ~72 real minutes | ~8 real minutes |
