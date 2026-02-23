# Water Treatment SCADA Training Simulator

An interactive SCADA/HMI training simulator for water treatment plant operators. Practice monitoring, alarm response, and process control in a safe simulated environment. Runs entirely in the browser — no server required.

## Quick Start

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**

## Features

- **Live HMI Screens** — Intake, Coagulation, Sedimentation, and Disinfection with animated SVG equipment
- **Real-time simulation** — 500ms tick loop with realistic process physics and cascade effects, running in-browser
- **Alarm system** — Priority-based alarms (CRITICAL/HIGH/MEDIUM/LOW) with acknowledge flow and audio alerts
- **7 Training Scenarios** — Normal operations through advanced fault injection
- **4 Guided Tutorials** — Step-by-step procedures with spotlight highlighting
- **Process Trends** — Historical charting for 17 process tags up to 24 hours
- **Simulation speed** — 1x / 5x / 10x time acceleration

## Scenarios

| Name | Difficulty | Description |
|---|---|---|
| Normal Shift | Beginner | Steady-state monitoring practice |
| Storm Runoff Event | Intermediate | Turbidity spike, adjust alum dosing |
| Intake Pump Failure | Intermediate | P-101 trips, restore flow via P-102 |
| Filter Breakthrough | Advanced | High head loss, initiate backwash |
| Chlorine Pump Fault | Advanced | Cl₂ residual decay, restore dosing |
| Stuck Alum Valve | Intermediate | Alum overdose, monitor pH |
| Sludge Pump Failure | Intermediate | Blanket buildup, clarifier impact |

## Alarm Thresholds

| Tag | Description | LL | L | H | HH |
|---|---|---|---|---|---|
| INT-FIT-001 | Raw Water Flow (MGD) | 0.5 | 1.0 | 8.5 | 9.5 |
| INT-AIT-001 | Raw Turbidity (NTU) | — | — | 200 | 500 |
| DIS-AIT-001 | Plant Cl₂ Residual (mg/L) | 0.3 | 0.5 | 3.0 | 4.5 |

## Running Tests

```bash
cd tests
npm install
npm test
```

Playwright launches the Vite dev server automatically.
