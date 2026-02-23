# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Client** (`cd client`)
```bash
npm run dev       # start Vite dev server on :5173
npm run build     # tsc + vite build
npm run lint      # ESLint
```

**Tests** (`cd tests`) — Playwright auto-starts the client dev server
```bash
npm test                              # all suites, headless
npm test -- 03-intake.spec.ts         # single suite
npm run test:headed -- 03-intake.spec.ts  # with browser visible
npm run test:ui                       # interactive UI mode
npm run test:report                   # open last HTML report
```

## Architecture

### Layout

```
client/   React 19 + Vite + Tailwind CSS — runs the full simulation in-browser
tests/    Playwright e2e (13 suites, single worker, shared state)
```

### Simulation pipeline (runs entirely in the browser)

All simulation logic lives in `client/src/simulation/`. A singleton `SimulationEngine` is created by `engine.ts` (`getEngine()`) and runs a 500 ms `setInterval` tick. Each tick:

1. Computes `dt = (500ms / 1000) × state.simSpeed` — the simulated seconds elapsed
2. Runs four stages in cascade, each taking the previous stage's output as input:
   - **IntakeStage** → pump flow, wet-well level, screen DP, raw turbidity
   - **CoagulationStage** → alum dose effectiveness, floc basin turbidity
   - **SedimentationStage** → clarifier, filter head loss, backwash sequencing
   - **DisinfectionStage** → chlorine/fluoride residual decay, pH
3. `AlarmManager.evaluate()` checks 12 process tags against LL/L/H/HH thresholds from `config.ts`
4. `Historian` records every tag (24 h ring buffer, max 172 800 points)
5. `ScenarioEngine.tick()` advances any active scenario
6. Emits `state:update` via an inline event emitter — consumed by `useSocket()` hook

`applyControl()` handles mutations for `pump`, `valve`, `setpoint`, `backwash`, `acknowledgeAlarm`, `acknowledgeAll`, and `clearScreen`. After any control it immediately emits `state:update` so the UI reflects changes without waiting for the next tick.

`simSpeed` only affects `dt` — the tick interval stays fixed at 500 ms. Increasing simSpeed makes each tick represent more simulated time.

### Client: state flow

```
SimulationEngine (singleton, browser)
  → useSocket() hook (AppShell)
    → useSimulationStore  (Zustand) — full ProcessState + connected flag
    → useAlarmStore       (Zustand) — alarm list
    → useScenarioStore    (Zustand) — active scenario id
  → React re-render of all subscribed components
```

Controls are sent via `getEngine().applyControl(type, payload)` — called directly from components, no network round-trip.

Trend data comes from `getEngine().historian.getTagHistory(tag, durationSeconds)` — synchronous, no fetch needed.

### Client: HMI screens

Each HMI (`IntakeHMI`, `CoagFloccHMI`, `SedimentationHMI`, `DisinfectionHMI`) follows the same pattern:
- SVG diagram built from reusable components in `components/hmi/svg/` (Pump, Valve, Tank, Pipe, FlowMeter, etc.)
- `viewBox="0 0 720 N"` with `width="100%"` for responsive scaling; a `<style>` block inside the SVG pins font sizes to fixed pixel values so text doesn't scale with the viewport
- `useState<string | null>` tracks which equipment item is selected
- `EquipmentPanel` renders inline to the right of the SVG (not as an overlay); `EmptyPanel` shown when nothing is selected

### Tests

- **Single worker, serial** — suites share simulation state in the browser session, so state can bleed between tests.
- `waitForLive(page, url)` (from `tests/helpers/`) navigates to a page and waits up to 15 s for the `LIVE` indicator before making assertions.
- Playwright launches only the Vite dev server; no backend needed.
