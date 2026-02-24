# Simulation Cause-and-Effect Reference

All cause-and-effect relationships in the waterworks SCADA simulation pipeline.
Stages run in cascade order every 500 ms tick: Intake → Coagulation → Sedimentation → Disinfection.

---

## Pipeline Overview

```
[Operator Controls]
        │
        ▼
┌───────────────┐
│  INTAKE STAGE │  rawWaterFlow, rawTurbidity, rawWaterLevel, screenDiffPressure
└───────┬───────┘
        │ rawWaterFlow, rawTurbidity, sourceTemperature, sourcePH
        ▼
┌──────────────────────┐
│  COAGULATION STAGE   │  alumDoseRate, pHAdjustDoseRate, flocBasinTurbidity
└──────────┬───────────┘
           │ flocBasinTurbidity, alumDoseRate, pHAdjustDoseRate
           ▼
┌───────────────────────────┐
│  SEDIMENTATION STAGE      │  clarifierTurbidity, sludgeBlanketLevel,
│                           │  filterHeadLoss, filterEffluentTurbidity,
└─────────────┬─────────────┘  backwashInProgress
              │ filterEffluentTurbidity, backwashInProgress
              │              + rawWaterFlow, alumDoseRate, sourcePH (passed through)
              ▼
┌────────────────────────┐
│  DISINFECTION STAGE    │  chlorineResidualPlant, chlorineResidualDist,
│                        │  finishedWaterPH, clearwellLevel
└────────────────────────┘
```

---

## Cause-and-Effect Matrix

Legend: `↑` increases / worsens, `↓` decreases / improves, `→` directly sets, `~` changes (direction depends on context), `·` no effect, delayed effects shown with `(lag)`

### Operator Controls

| Change (cause) | rawWaterFlow | rawWaterLevel | rawTurbidity | flocBasinTurbidity | clarifierTurbidity | filterHeadLoss | filterEffluentTurbidity | chlorineResidualPlant | chlorineResidualDist | finishedWaterPH | clearwellLevel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **intakePump1/2 start** | ↑ | ↓ | · | (lag) ↓ | (lag) ↓ | · | (lag) ↓ | (lag) ↑ | (lag) ↑ | · | ↑ |
| **intakePump1/2 stop** | ↓→0 | ↑ | · | (lag) ↑ | (lag) ↑ | · | (lag) ↑ | (lag) ↓ | (lag) ↓ | · | ↓ |
| **intakePump speed ↑** | ↑ | ↓ | · | · | · | · | · | · | · | · | ↑ |
| **intakeValve close** | ↓→0 | ↑ | · | (lag) ↑ | (lag) ↑ | · | · | · | · | · | ↓ |
| **intakeValve position ↓** | ↓ (linear) | ↑ | · | · | · | · | · | · | · | · | ↓ |
| **sourceTurbidityBase ↑** | · | · | ↑ | ↑ | ↑ | ↑ (faster) | ↑ | ↓ | ↓ | · | · |
| **sourceTemperature ↓** | · | · | · | ↑ (cold reduces alum effectiveness) | ↑ | ↑ (faster) | ↑ | ↓ | ↓ | · | · |
| **sourcePH ↑** | · | · | · | · | · | · | · | · | · | ↑ | · |
| **naturalInflow ↑** | · | ↑ | · | · | · | · | · | · | · | · | · |
| **alumDoseSetpoint ↑** | · | · | · | ↓ | ↓ | ↓ (slower) | ↓ | ↑ (less demand) | ↑ | ↓ (alum acidifies) | · |
| **alumDoseSetpoint ↓ / pump off** | · | · | · | ↑ | ↑ | ↑ (faster) | ↑ | ↓ | ↓ | ↑ | · |
| **pHAdjustDoseSetpoint ↑** | · | · | · | · | · | · | · | · | · | ↑ | · |
| **pHAdjustDoseSetpoint ↓ / pump off** | · | · | · | · | · | · | · | · | · | ↓ | · |
| **rapidMixer stop** | · | · | · | ↑ (less mixing energy) | ↑ | ↑ (faster) | ↑ | ↓ | ↓ | · | · |
| **slowMixer stop** | · | · | · | ↑ (less mixing energy) | ↑ | ↑ (faster) | ↑ | ↓ | ↓ | · | · |
| **chlorineDoseSetpoint ↑** | · | · | · | · | · | · | · | ↑ | ↑ | · | · |
| **chlorineDoseSetpoint ↓ / pump off** | · | · | · | · | · | · | · | ↓ | ↓ | · | · |
| **sludgePump stop** | · | · | · | · | ↑ (blanket rises→efficiency drops) | ↑ (faster) | ↑ | ↓ | ↓ | · | · |
| **sludgePump speed ↑** | · | · | · | · | ↓ (blanket decreases) | ↓ (slower) | ↓ | ↑ | ↑ | · | · |
| **backwash start** | · | · | · | · | · | ↓→0.5 (on complete) | · | · | · | · | ↓ (inflow stops) |
| **clearScreen** | · | · | · | · | · | · | · | · | · | · | · |

### Equipment Faults

| Fault (cause) | Immediate effect | Cascade effects |
|---|---|---|
| **intakePump1 fault** | rawWaterFlow ↓ (pump1 contribution lost) | rawWaterLevel ↑, clearwellLevel ↓ |
| **intakePump2 fault** | rawWaterFlow ↓ (pump2 contribution lost) | rawWaterLevel ↑, clearwellLevel ↓ |
| **alumPump fault** | alumDoseRate → decays to 0 | flocBasinTurbidity ↑, clarifierTurbidity ↑, filterHeadLoss ↑ faster, filterEffluentTurbidity ↑, chlorineResidualPlant ↓, pH ↑ (alum depression removed) |
| **rapidMixer fault** | rapidMixerSpeed → decays to 0 | mixingFactor ↓, flocBasinTurbidity ↑, clarifierTurbidity ↑ |
| **slowMixer fault** | slowMixerSpeed → decays to 0 | mixingFactor ↓ (smaller effect than rapid), flocBasinTurbidity ↑ |
| **pHAdjustPump fault** | pHAdjustDoseRate → decays to 0 | finishedWaterPH ↓ (caustic removed) |
| **sludgePump fault** | sludge removal stops | sludgeBlanketLevel ↑, clarifierEfficiency ↓, clarifierTurbidity ↑ |
| **chlorinePump fault** | chlorineDoseRate → decays to 0 | chlorineResidualPlant ↓, chlorineResidualDist ↓ |

---

## Stage-by-Stage Relationships

### INTAKE STAGE

| Input | Formula / Logic | Output |
|---|---|---|
| pump1.speed (if running & !fault) | `4.5 MGD × (speed / 100)` | pump1Flow |
| pump2.speed (if running & !fault) | `4.5 MGD × (speed / 100)` | pump2Flow |
| valve.open, valve.position | `open ? position/100 : 0` | valveFactor |
| pump1Flow + pump2Flow, valveFactor | `(sum) × valveFactor` → first-order lag τ=5s | **rawWaterFlow** |
| naturalInflow, rawWaterFlow | `level += (naturalInflow − rawWaterFlow × 0.02) × dt` | **rawWaterLevel** |
| screenDiffPressure, dt | `+= 0.0005 × dt` (constant clog rate) | **screenDiffPressure** |
| clearScreen() | `→ 0.8 PSI` | **screenDiffPressure** |
| sourceTurbidityBase, phase | sinusoidal oscillation ± 30% around base → first-order lag τ=100s | **rawTurbidity** |

### COAGULATION STAGE

| Input | Formula / Logic | Output |
|---|---|---|
| alumDoseSetpoint, pump running | ramp toward setpoint τ=5s | **alumDoseRate** |
| alumDoseRate, pump off/fault | exponential decay τ=5s | **alumDoseRate** |
| pHAdjustDoseSetpoint, pump running | ramp toward setpoint τ=5s | **pHAdjustDoseRate** |
| pHAdjustDoseRate, pump off/fault | exponential decay τ=10s (slower than alum) | **pHAdjustDoseRate** |
| rapidMixerStatus.running | 1.2 if running, 0.5 if off | rapidMixFactor |
| slowMixerStatus.running | 1.1 if running, 0.7 if off | slowMixFactor |
| rapidMixFactor × slowMixFactor | product | **mixingFactor** |
| sourceTemperature | `clamp((T − 1) / 19, 0.35, 1.0)` | **tempFactor** |
| alumDoseRate, rawTurbidity, tempFactor | `clamp((dose / (turbidity × 0.12)) × tempFactor, 0, 1)` | **alumEffectiveness** |
| rawTurbidity, alumEffectiveness, mixingFactor | `(rawTurb × (1 − 0.85 × effectiveness)) / mixingFactor` → lag τ=25s | **flocBasinTurbidity** |
| rapidMixerStatus.running | ramp to 120 RPM τ=5s, or decay τ=5s | **rapidMixerSpeed** |
| slowMixerStatus.running | ramp to 45 RPM τ=5s, or decay τ=5s | **slowMixerSpeed** |

### SEDIMENTATION STAGE

| Input | Formula / Logic | Output |
|---|---|---|
| sludgeBlanketLevel | `clamp(level / 6, 0, 0.5)` | sludgeImpact |
| sludgeImpact | `0.90 × (1 − sludgeImpact)` | clarifierEfficiency |
| flocBasinTurbidity, clarifierEfficiency | `flocTurb × (1 − efficiency)` → lag τ=10s | **clarifierTurbidity** |
| sludgePump running & !fault, speed | removal = `0.005 × (speed/100)` per tick | net blanket change |
| constant accumulation | `+0.001` per tick | net blanket change |
| accumulation − removal | integration | **sludgeBlanketLevel** |
| filterRunTime < 72h, clarifierTurbidity | `+= 0.0001 × (1 + clarifierTurbidity / 5)` per tick | **filterHeadLoss** |
| backwash complete | `→ 0.5 ft; filterRunTime → 0` | **filterHeadLoss**, **filterRunTime** |
| filterHeadLoss | `clamp((HL − 6) / (9 − 6), 0, 1)` | filterBreakthrough |
| clarifierTurbidity, filterBreakthrough | `clarifierTurb × 0.05 + breakthrough × 2` → lag τ=16s | **filterEffluentTurbidity** |
| backwashInProgress, dt | countdown 600s; on complete → reset filter | **backwashInProgress**, **filterHeadLoss**, **filterRunTime** |

### DISINFECTION STAGE

| Input | Formula / Logic | Output |
|---|---|---|
| chlorineDoseSetpoint, pump running | ramp τ=5s | **chlorineDoseRate** |
| chlorineDoseRate, pump off/fault | decay τ=10s | **chlorineDoseRate** |
| chlorineDoseRate, filterEffluentTurbidity | `dose × 0.85 − turbidity × 0.1` → lag τ=10s | **chlorineResidualPlant** |
| chlorineResidualPlant, dt | `plantResidual × exp(−0.05 × dt)` → lag τ=16s | **chlorineResidualDist** |
| sourcePH, alumDoseRate, pHAdjustDoseRate | `sourcePH − alumDose × 0.02 + caustic × 0.2` → lag τ=25s | **finishedWaterPH** |
| rawWaterFlow (when !backwash) | `(flow / 3.375) × 0.006 m/s` inflow vs `0.0046 m/s` outflow | **clearwellLevel** |
| backwashInProgress | inflow = 0 (filter not producing) | **clearwellLevel** |

---

## Alarm Thresholds

See `client/src/simulation/config.ts` → `alarmThresholds`.

---

## Key Feedback Chains

### 1. Turbidity event → chlorine alarm
`sourceTurbidityBase ↑` → `rawTurbidity ↑` → `alumEffectiveness ↓` → `flocBasinTurbidity ↑`
→ `clarifierTurbidity ↑` → `filterHeadLoss accumulates faster` → `filterEffluentTurbidity ↑`
→ `chlorineResidualPlant ↓` (turbidity exerts Cl₂ demand)

### 2. Alum pump failure cascade
`alumPump fault` → `alumDoseRate → 0` → `alumEffectiveness → 0` → `flocBasinTurbidity → rawTurbidity`
→ `clarifierTurbidity ↑` → `filterEffluentTurbidity ↑` → `chlorineResidualPlant ↓`
Also: `alumDoseRate → 0` → `finishedWaterPH ↑` (alum acidification removed)

### 3. Sludge blanket buildup cascade
`sludgePump off` → `sludgeBlanketLevel ↑` → `clarifierEfficiency ↓` → `clarifierTurbidity ↑`
→ `filterHeadLoss accumulates faster` → breakthrough earlier → `filterEffluentTurbidity ↑`

### 4. Filter cycle → backwash → clearwell
`filterRunTime ↑` → `filterHeadLoss ↑` → operator triggers backwash
→ `clearwellLevel ↓` (inflow stops during backwash)
→ backwash completes → `filterHeadLoss → 0.5 ft`, `filterRunTime → 0`

### 5. Intake pump shutdown → storage impact
`intakePump stop` → `rawWaterFlow → 0` → clearwell inflow = 0
→ `clearwellLevel ↓` at 0.0046 m/s until pumps restart

### 6. Cold weather coagulation failure
`sourceTemperature ↓ (<5°C)` → `tempFactor → 0.35` → `alumEffectiveness ↓` even at normal dose
→ need to increase `alumDoseSetpoint` to compensate → `flocBasinTurbidity` recovers
