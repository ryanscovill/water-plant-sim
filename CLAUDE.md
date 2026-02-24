# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Meta

When the user says "remember" something, add it to this file immediately.

## Commands

**Client** (`cd client`)
```bash
npm run dev       # start Vite dev server on :5173
npm run build     # tsc + vite build
npm run lint      # ESLint
```

**Tests** (`cd tests`)

E2e tests — Playwright auto-starts the client dev server:
```bash
npm test                                   # all suites, headless
npm test -- e2e/03-intake.spec.ts          # single suite
npm run test:headed -- e2e/03-intake.spec.ts  # with browser visible
npm run test:ui                            # interactive UI mode
npm run test:report                        # open last HTML report
```

Unit tests — Vitest, no browser needed:
```bash
npm run test:unit          # single pass, CI-safe
npm run test:unit:watch    # watch mode during development
```

Tests are organized as:
```
tests/
  e2e/           Playwright e2e suites (browser, shared state)
  unit/          Vitest unit tests (pure TS, no DOM)
    simulation/  mirrors client/src/simulation/ layout
```

## TDD Mandate

**All new simulation logic must be test-driven.** The workflow:

1. Write a failing test that captures the required behaviour.
2. Implement the minimum code to make the test pass.
3. Refactor if needed, keeping tests green.

Applies to:
- New functions in `utils.ts`
- New or changed stage physics models
- New alarm thresholds added to `config.ts`
- New methods on `AlarmManager`, `Historian`, or `ScenarioEngine`

Do **not** add logic to the simulation layer without a corresponding unit test.

## Adding a new alarm

When adding a new alarm, all three of these must be updated together:

1. **`client/src/simulation/config.ts`** — add the tag and thresholds to `alarmThresholds`
2. **`client/src/simulation/AlarmManager.ts`** — add the tag/value/description to `getTagValues()`
3. **`client/src/components/settings/AlarmThresholdsTab.tsx`** — add an entry to `TAG_META` so the threshold is editable in the Settings UI

## Simulation standards reference

All alarm thresholds and process constants are verified against EPA SWTR (40 CFR 141), AWWA, and Ten States Standards (2022). The full reference table is in **`docs/water-treatment-standards.md`**.

Key regulatory limits encoded in `config.ts`:
- **Filter effluent H/HH**: 0.3 / 0.5 NTU — LT2ESWTR 95th-percentile limit / individual filter action level
- **Plant Cl₂ HH**: 4.0 mg/L — EPA MRDL (40 CFR 141.65)
- **Dist. Cl₂ LL**: 0.2 mg/L — EPA SWTR minimum (40 CFR 141.72)
- **pH LL/HH**: 6.5 / 8.5 — EPA Secondary MCL bounds
- **Clearwell Level LL**: 1.83 m — 30% of 6.1 m maximum

Shared calculation primitives (`clamp`, `firstOrderLag`, `accumulateRunHours`, `rampDoseRate`) live in `client/src/simulation/utils.ts`.

## Architecture

### Layout

```
client/   React 19 + Vite + Tailwind CSS — runs the full simulation in-browser
tests/    Playwright e2e (15 suites, single worker, shared state)
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

## UI Standards

### Cursor on interactive elements

Every clickable element **must** have `cursor-pointer` in its Tailwind class list. Tailwind's preflight resets `<button>` to `cursor: default`, so the pointer is never implicit — it must always be explicit.

This applies to: `<button>`, `<a>`, clickable `<div>`/`<tr>`/`<li>`, custom tab bars, toggle switches, icon buttons, and any other element with an `onClick` handler.

### Client: HMI screens

Each HMI (`OverviewHMI`, `IntakeHMI`, `CoagFloccHMI`, `SedimentationHMI`, `DisinfectionHMI`) follows the same pattern:
- SVG diagram built from reusable components in `components/hmi/svg/` (Pump, Valve, Tank, Pipe, FlowMeter, etc.)
- `viewBox="0 0 720 N"` with `width="100%"` for responsive scaling; a `<style>` block inside the SVG pins font sizes to fixed pixel values so text doesn't scale with the viewport
- `useState<string | null>` tracks which equipment item is selected
- `EquipmentPanel` renders inline to the right of the SVG (not as an overlay); `EmptyPanel` shown when nothing is selected

### Tests

- **Single worker, serial** — suites share simulation state in the browser session, so state can bleed between tests.
- `waitForLive(page, url)` (from `tests/helpers/`) navigates to a page and waits up to 15 s for the `LIVE` indicator before making assertions.
- Playwright launches only the Vite dev server; no backend needed.

### Test output — everything goes to `screenshots/`

All test artifacts are routed to the root-level `screenshots/` directory. Do **not** create extra output directories inside `tests/`.

```
screenshots/
  *.png              # HMI screenshots saved by spec 13 (human review)
  _artifacts/        # failure screenshots (created only on test failures)
  _report/           # HTML report (created by npm run test:report)
```

### SPA navigation in tests
When a test performs HMI actions and then needs to verify results on another page, use **SPA navigation** (clicking a sidebar/nav link) rather than `page.goto()`. `page.goto()` triggers a full page reload which wipes all in-memory Zustand store state. For example:

```typescript
// ✗ Wrong — reloads the page, clears Zustand store
await page.goto('/history');

// ✓ Correct — client-side navigation, store state is preserved
await page.locator('#nav-history').click();
await expect(page.locator('h2').first()).toContainText('OPERATOR HISTORY');
```
