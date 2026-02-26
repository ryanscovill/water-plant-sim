/**
 * Suite 15 — Per-tutorial e2e tests
 *
 * Tests the content, step progression, spotlight, and completion flow for each
 * of the four tutorials individually.
 *
 * Each describe block calls waitForLive(page, '/tutorials') in beforeEach,
 * which performs a full page reload and therefore resets the Zustand tutorial
 * store — no state bleeds between tests.
 *
 * OPERATOR ACTIONS
 * ----------------
 * Each test advances tutorial steps by performing the same actions a real
 * operator would take: clicking nav links, HMI element symbols, alarm ACK
 * buttons, and setpoint inputs. A per-tutorial `goTo(page, stepN)` helper
 * chains the correct operator actions to reach any given step.
 *
 * AUTO-ADVANCE STEPS
 * ------------------
 * The following steps auto-advance immediately because their waitFor condition
 * is already satisfied by the default simulation state:
 *
 *   Plant Startup step 3:  intake.intakePump1.running === true
 *   Plant Startup step 6:  disinfection.chlorinePumpStatus.running === true
 *
 * These steps are transparent in tests — actions that advance step 2 or 5
 * land on step 4 or 7 respectively without any additional operator input.
 */

import { test, expect, type Page } from '@playwright/test';
import { waitForLive } from '../helpers/wait-for-live';

// ── Shared helpers ──────────────────────────────────────────────────────────

const overlay = (page: Page) => page.locator('.fixed.bottom-12.right-4');
const nextBtn  = (page: Page) => page.getByRole('button', { name: /^(Next|Finish)/ });
const backBtn  = (page: Page) => page.getByRole('button', { name: 'Back' });

/** Click the START TUTORIAL button on the card whose title matches. */
async function startTutorialByTitle(page: Page, title: string) {
  const card = page.locator('div.bg-gray-900').filter({ hasText: title });
  await card.getByRole('button', { name: 'START TUTORIAL' }).click();
  await expect(overlay(page)).toBeVisible({ timeout: 8_000 });
}

/** Wait for the overlay to display a given step number. */
async function waitForStep(page: Page, stepNum: number) {
  await expect(overlay(page)).toContainText(`STEP ${stepNum} OF`, { timeout: 8_000 });
}

/** Check that the injected <style> block spotlights the given element id. */
async function spotlightTargets(page: Page, id: string): Promise<boolean> {
  return page.evaluate((targetId) =>
    Array.from(document.querySelectorAll('style')).some(
      (s) => s.textContent?.includes(`#${targetId}`)
    ), id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial 1 — Plant Startup Procedure (8 steps)
// ─────────────────────────────────────────────────────────────────────────────
//
// Operator action sequence (auto-advance steps shown in parentheses):
//   Step 1  nav-intake spotlight       → click #nav-intake
//   Step 2  hmi-intakePump1 clickAdv   → click #hmi-intakePump1
//  (Step 3  waitFor pump running       → auto-advances immediately)
//   Step 4  nav-coagulation spotlight  → click #nav-coagulation
//   Step 5  hmi-alumDose clickAdv      → click #hmi-alumDose
//  (Step 6  waitFor Cl₂ pump running   → auto-advances immediately)
//   Step 7  nav-trends spotlight       → click #nav-trends
//   Step 8  nav-intake, last step      → click Finish

test.describe('Tutorial: Plant Startup Procedure', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/tutorials');
    await page.waitForTimeout(500);
  });

  /**
   * Advance Plant Startup to the given step via real operator actions.
   * Call after startTutorialByTitle. Steps 3 and 6 are omitted because they
   * auto-advance immediately (pump already running in default state).
   */
  async function goTo(page: Page, step: 1 | 2 | 4 | 5 | 7 | 8) {
    if (step <= 1) return;
    // Step 1 → nav-intake spotlight: click Intake nav link
    await page.locator('#nav-intake').click();
    await waitForStep(page, 2);
    if (step <= 2) return;
    // Step 2 → hmi-intakePump1 clickToAdvance: click pump symbol
    // Step 3 (waitFor pump running) auto-advances immediately
    await page.locator('#hmi-intakePump1').click();
    await waitForStep(page, 4);
    if (step <= 4) return;
    // Step 4 → nav-coagulation spotlight: click Coagulation nav link
    await page.locator('#nav-coagulation').click();
    await waitForStep(page, 5);
    if (step <= 5) return;
    // Step 5 → hmi-alumDose clickToAdvance: click alum dose display
    // Step 6 (waitFor Cl₂ pump running) auto-advances immediately
    await page.locator('#hmi-alumDose').click();
    await waitForStep(page, 7);
    if (step <= 7) return;
    // Step 7 → nav-trends spotlight: click Trends nav link
    await page.locator('#nav-trends').click();
    await waitForStep(page, 8);
  }

  test('card displays correct title, description, and step count', async ({ page }) => {
    const card = page.locator('div.bg-gray-900').filter({ hasText: 'Plant Startup Procedure' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('bring the plant online');
    await expect(card).toContainText('8 steps');
  });

  test('overlay shows tutorial title after starting', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await expect(overlay(page)).toContainText('Plant Startup Procedure');
  });

  test('step 1 of 8 is shown on start', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await expect(overlay(page)).toContainText('STEP 1 OF 8');
  });

  test('step 1 instruction mentions the Intake screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await expect(overlay(page)).toContainText('Intake screen');
  });

  test('step 1 spotlights nav-intake', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    expect(await spotlightTargets(page, 'nav-intake')).toBe(true);
  });

  test('step 1 has a hint about clicking Intake in the sidebar', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await expect(overlay(page)).toContainText('Hint:');
    await expect(overlay(page)).toContainText('Intake');
  });

  test('Back button is disabled on step 1', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await expect(backBtn(page)).toBeDisabled();
  });

  test('clicking Intake nav link advances to step 2 and enables Back', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await page.locator('#nav-intake').click();
    await waitForStep(page, 2);
    await expect(backBtn(page)).not.toBeDisabled();
  });

  test('step 2 instruction mentions Intake Pump 1', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 2);
    await expect(overlay(page)).toContainText('Intake Pump 1');
  });

  test('step 2 spotlights hmi-intakePump1', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 2);
    expect(await spotlightTargets(page, 'hmi-intakePump1')).toBe(true);
  });

  test('Back returns from step 2 to step 1', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 2);
    await backBtn(page).click();
    await expect(overlay(page)).toContainText('STEP 1 OF 8');
    await expect(backBtn(page)).toBeDisabled();
  });

  // Step 3 auto-advances (pump already running), so clicking the pump symbol on
  // step 2 skips past step 3 and lands on step 4.
  test('clicking pump symbol skips auto-advance step 3 and lands on step 4', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 2);
    await page.locator('#hmi-intakePump1').click();
    await waitForStep(page, 4);
  });

  test('step 4 instruction mentions Coagulation screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 4);
    await expect(overlay(page)).toContainText('Coagulation');
  });

  test('step 4 spotlights nav-coagulation', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 4);
    expect(await spotlightTargets(page, 'nav-coagulation')).toBe(true);
  });

  test('step 5 shows STEP 5 OF 8', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 5);
    await expect(overlay(page)).toContainText('STEP 5 OF 8');
  });

  test('step 5 instruction mentions alum dose setpoint', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 5);
    await expect(overlay(page)).toContainText('alum dose');
  });

  test('step 5 spotlights hmi-alumDose', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 5);
    expect(await spotlightTargets(page, 'hmi-alumDose')).toBe(true);
  });

  // Step 6 auto-advances (Cl₂ pump already running), so clicking hmi-alumDose on
  // step 5 skips step 6 and lands on step 7.
  test('clicking alum dose skips auto-advance step 6 and lands on step 7', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 5);
    await page.locator('#hmi-alumDose').click();
    await waitForStep(page, 7);
  });

  test('step 7 instruction mentions chlorine residual and Trends', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 7);
    await expect(overlay(page)).toContainText('chlorine residual');
    await expect(overlay(page)).toContainText('Trends');
  });

  test('step 7 spotlights nav-trends', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 7);
    expect(await spotlightTargets(page, 'nav-trends')).toBe(true);
  });

  test('clicking Trends nav link advances to step 8 with Finish button', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 7);
    await page.locator('#nav-trends').click();
    await waitForStep(page, 8);
    await expect(overlay(page)).toContainText('STEP 8 OF 8');
    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
  });

  test('step 8 instruction mentions Intake screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 8);
    await expect(overlay(page)).toContainText('Intake screen');
  });

  test('step 8 spotlights nav-intake', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 8);
    expect(await spotlightTargets(page, 'nav-intake')).toBe(true);
  });

  test('clicking Finish on last step shows Tutorial Complete screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 8);
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(overlay(page)).toContainText('Tutorial Complete!');
    await expect(overlay(page)).toContainText('Plant Startup Procedure');
  });

  test('FINISH button on completion screen dismisses the overlay', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await goTo(page, 8);
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(overlay(page)).toContainText('Tutorial Complete!', { timeout: 5_000 });
    await page.getByRole('button', { name: 'FINISH' }).click();
    await expect(overlay(page)).not.toBeVisible({ timeout: 5_000 });
  });

  test('overlay stays visible after SPA navigation during tutorial', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    // Navigate to Intake (also advances step 1); overlay must persist
    await page.locator('#nav-intake').click();
    await expect(overlay(page)).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial 2 — Responding to Process Alarms (7 steps)
// ─────────────────────────────────────────────────────────────────────────────
//
// Operator action sequence:
//   Step 1  alarm-banner, observe      → click Next
//   Step 2  nav-alarms spotlight       → click #nav-alarms
//   Step 3  alarm-list, observe        → click Next
//   Step 4  nav-intake spotlight       → click #nav-intake
//   Step 5  hmi-rawTurbidity, observe  → click Next
//   Step 6  hmi-alumDose waitFor       → navigate to coagulation, set alum dose > 20, APPLY
//   Step 7  hmi-flocTurbidity, last    → click Finish
//
// onStart injects raw turbidity = 250, triggering INT-AIT-001 within the first
// engine tick (≤ 500 ms). Playwright's actionTimeout (10 s) covers the delay.

test.describe('Tutorial: Responding to Process Alarms', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/tutorials');
    await page.waitForTimeout(500);
  });

  /**
   * Advance Alarm Response to the given step via real operator actions.
   * Call after startTutorialByTitle.
   */
  async function goTo(page: Page, step: 1 | 2 | 3 | 4 | 5 | 6 | 7) {
    if (step <= 1) return;
    // Step 1 → alarm-banner observation: click Next
    await nextBtn(page).click();
    await waitForStep(page, 2);
    if (step <= 2) return;
    // Step 2 → nav-alarms spotlight: navigate to Alarms page
    await page.locator('#nav-alarms').click();
    await waitForStep(page, 3);
    if (step <= 3) return;
    // Step 3 → alarm-list observation: click Next after reviewing alarm details
    await nextBtn(page).click();
    await waitForStep(page, 4);
    if (step <= 4) return;
    // Step 4 → nav-intake spotlight: navigate to Intake to investigate
    await page.locator('#nav-intake').click();
    await waitForStep(page, 5);
    if (step <= 5) return;
    // Step 5 → hmi-rawTurbidity observation: click Next after observing
    await nextBtn(page).click();
    await waitForStep(page, 6);
    if (step <= 6) return;
    // Step 6 → hmi-alumDose waitFor (alumDoseSetpoint > 20):
    //   Navigate to Coagulation, open alum dose panel, raise setpoint to 25, apply
    await page.locator('#nav-coagulation').click();
    await page.locator('#hmi-alumDose').click();
    await page.locator('input[type="number"]').fill('25');
    await page.getByRole('button', { name: 'APPLY' }).click();
    await waitForStep(page, 7);
  }

  test('card displays correct title, description, and step count', async ({ page }) => {
    const card = page.locator('div.bg-gray-900').filter({ hasText: 'Responding to Process Alarms' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('identifying and responding');
    await expect(card).toContainText('7 steps');
  });

  test('overlay shows tutorial title after starting', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await expect(overlay(page)).toContainText('Responding to Process Alarms');
  });

  test('step 1 of 7 is shown on start', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await expect(overlay(page)).toContainText('STEP 1 OF 7');
  });

  test('step 1 instruction mentions the alarm banner', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await expect(overlay(page)).toContainText('alarm');
  });

  test('step 1 spotlights alarm-banner', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    expect(await spotlightTargets(page, 'alarm-banner')).toBe(true);
  });

  test('step 2 spotlights nav-alarms', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 2);
    expect(await spotlightTargets(page, 'nav-alarms')).toBe(true);
  });

  test('step 3 shows STEP 3 OF 7 and instruction mentions alarm details', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 3);
    await expect(overlay(page)).toContainText('STEP 3 OF 7');
    await expect(overlay(page)).toContainText('alarm');
  });

  test('step 3 spotlights alarm-list', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 3);
    expect(await spotlightTargets(page, 'alarm-list')).toBe(true);
  });

  test('clicking Next on step 3 advances to step 4', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 3);
    await nextBtn(page).click();
    await waitForStep(page, 4);
  });

  test('step 4 spotlights nav-intake', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 4);
    expect(await spotlightTargets(page, 'nav-intake')).toBe(true);
  });

  test('step 5 instruction mentions raw turbidity', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 5);
    await expect(overlay(page)).toContainText('raw turbidity');
  });

  test('step 5 spotlights hmi-rawTurbidity', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 5);
    expect(await spotlightTargets(page, 'hmi-rawTurbidity')).toBe(true);
  });

  // Step 6 waitFor: coagulation.alumDoseSetpoint > 20 — initial setpoint is 18,
  // so the condition is not met and the "Waiting for action" indicator shows.
  test('step 6 shows "Waiting for action" indicator (has waitFor)', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 6);
    await expect(overlay(page)).toContainText('STEP 6 OF 7');
    await expect(overlay(page)).toContainText('Waiting for action');
  });

  test('step 6 spotlights hmi-alumDose', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 6);
    expect(await spotlightTargets(page, 'hmi-alumDose')).toBe(true);
  });

  test('raising alum dose above 20 mg/L on step 6 advances to step 7', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 6);
    await page.locator('#nav-coagulation').click();
    await page.locator('#hmi-alumDose').click();
    await page.locator('input[type="number"]').fill('25');
    await page.getByRole('button', { name: 'APPLY' }).click();
    await waitForStep(page, 7);
  });

  test('step 7 instruction mentions floc turbidity', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 7);
    await expect(overlay(page)).toContainText('STEP 7 OF 7');
    await expect(overlay(page)).toContainText('floc turbidity');
  });

  test('step 7 spotlights hmi-flocTurbidity', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 7);
    expect(await spotlightTargets(page, 'hmi-flocTurbidity')).toBe(true);
  });

  test('final step (step 7) shows "Finish" button', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 7);
    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
  });

  test('completing all steps shows Tutorial Complete screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await goTo(page, 7);
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(overlay(page)).toContainText('Tutorial Complete!');
    await expect(overlay(page)).toContainText('Responding to Process Alarms');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial 3 — Filter Backwash Procedure (6 steps)
// ─────────────────────────────────────────────────────────────────────────────
//
// Operator action sequence:
//   Step 1  nav-sedimentation spot.    → click #nav-sedimentation
//   Step 2  hmi-filterHeadLoss, obs.   → click Next
//   Step 3  hmi-filterRunTime, obs.    → click Next
//   Step 4  hmi-filterBed clickAdv     → click #hmi-filterBed (opens filter panel)
//   Step 5  ctrl-backwash-start waitFor→ click button#ctrl-backwash-start
//   Step 6  hmi-backwashTimer, last    → click Finish

test.describe('Tutorial: Filter Backwash Procedure', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/tutorials');
    await page.waitForTimeout(500);
  });

  /**
   * Advance Filter Backwash to the given step via real operator actions.
   * Call after startTutorialByTitle.
   */
  async function goTo(page: Page, step: 1 | 2 | 3 | 4 | 5 | 6) {
    if (step <= 1) return;
    // Step 1 → nav-sedimentation spotlight: navigate to Sedimentation/Filtration
    await page.locator('#nav-sedimentation').click();
    await waitForStep(page, 2);
    if (step <= 2) return;
    // Step 2 → hmi-filterHeadLoss observation: click Next after reviewing
    await nextBtn(page).click();
    await waitForStep(page, 3);
    if (step <= 3) return;
    // Step 3 → hmi-filterRunTime observation: click Next after reviewing
    await nextBtn(page).click();
    await waitForStep(page, 4);
    if (step <= 4) return;
    // Step 4 → hmi-filterBed clickToAdvance: click filter bed symbol to open panel
    await page.locator('#hmi-filterBed').click();
    await waitForStep(page, 5);
    if (step <= 5) return;
    // Step 5 → ctrl-backwash-start waitFor: click START BACKWASH button in panel
    await page.locator('button#ctrl-backwash-start').click();
    await waitForStep(page, 6);
  }

  test('card displays correct title, description, and step count', async ({ page }) => {
    const card = page.locator('div.bg-gray-900').filter({ hasText: 'Filter Backwash Procedure' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('backwash');
    await expect(card).toContainText('6 steps');
  });

  test('overlay shows tutorial title after starting', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await expect(overlay(page)).toContainText('Filter Backwash Procedure');
  });

  test('step 1 of 6 is shown on start', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await expect(overlay(page)).toContainText('STEP 1 OF 6');
  });

  test('step 1 instruction mentions the Sedimentation/Filtration screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await expect(overlay(page)).toContainText('Sedimentation');
  });

  test('step 1 spotlights nav-sedimentation', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    expect(await spotlightTargets(page, 'nav-sedimentation')).toBe(true);
  });

  test('step 2 instruction mentions Filter Head Loss and 8 feet', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 2);
    await expect(overlay(page)).toContainText('Filter Head Loss');
    await expect(overlay(page)).toContainText('8 feet');
  });

  test('step 2 spotlights hmi-filterHeadLoss', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 2);
    expect(await spotlightTargets(page, 'hmi-filterHeadLoss')).toBe(true);
  });

  test('step 3 instruction mentions Filter Run Time and 72 hours', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 3);
    await expect(overlay(page)).toContainText('Filter Run Time');
    await expect(overlay(page)).toContainText('72 hours');
  });

  test('step 3 spotlights hmi-filterRunTime', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 3);
    expect(await spotlightTargets(page, 'hmi-filterRunTime')).toBe(true);
  });

  test('step 4 instruction mentions the Filter Bed symbol', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 4);
    await expect(overlay(page)).toContainText('Filter Bed');
  });

  test('step 4 spotlights hmi-filterBed', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 4);
    expect(await spotlightTargets(page, 'hmi-filterBed')).toBe(true);
  });

  test('clicking filter bed symbol opens panel and advances to step 5', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 4);
    await page.locator('#hmi-filterBed').click();
    await waitForStep(page, 5);
  });

  // Step 5 waitFor: sedimentation.backwashInProgress === true — no backwash
  // running in the default state, so the "Waiting" indicator is shown.
  test('step 5 shows "Waiting for action" indicator (has waitFor)', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 5);
    await expect(overlay(page)).toContainText('STEP 5 OF 6');
    await expect(overlay(page)).toContainText('Waiting for action');
  });

  test('step 5 spotlights ctrl-backwash-start', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 5);
    expect(await spotlightTargets(page, 'ctrl-backwash-start')).toBe(true);
  });

  test('clicking Start Backwash on step 5 initiates backwash and advances to step 6', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 5);
    await page.locator('button#ctrl-backwash-start').click();
    await waitForStep(page, 6);
  });

  test('step 6 instruction mentions the backwash timer and 10 minutes', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 6);
    await expect(overlay(page)).toContainText('timer');
    await expect(overlay(page)).toContainText('10 minutes');
  });

  test('step 6 spotlights hmi-backwashTimer', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 6);
    expect(await spotlightTargets(page, 'hmi-backwashTimer')).toBe(true);
  });

  test('final step (step 6) shows "Finish" button', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 6);
    await expect(overlay(page)).toContainText('STEP 6 OF 6');
    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
  });

  test('completing all steps shows Tutorial Complete screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 6);
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(overlay(page)).toContainText('Tutorial Complete!');
    await expect(overlay(page)).toContainText('Filter Backwash Procedure');
  });

  test('FINISH button on completion screen dismisses the overlay', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await goTo(page, 6);
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(overlay(page)).toContainText('Tutorial Complete!', { timeout: 5_000 });
    await page.getByRole('button', { name: 'FINISH' }).click();
    await expect(overlay(page)).not.toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial 4 — Chlorine Dose Adjustment (5 steps)
// ─────────────────────────────────────────────────────────────────────────────
//
// Operator action sequence:
//   Step 1  nav-trends spotlight       → click #nav-trends
//   Step 2  trend-tag-selector clickAdv→ click DIS-AIT-001 button in tag list
//   Step 3  nav-disinfection spotlight → click #nav-disinfection
//   Step 4  hmi-chlorineDose waitFor   → click #hmi-chlorineDose, change setpoint, APPLY
//   Step 5  hmi-chlorineResidual, last → click Finish
//
// onStart sets chlorineDoseSetpoint = 2.5 so the step 4 waitFor
// (setpoint !== 2.5) is not pre-satisfied and the operator must act.

test.describe('Tutorial: Chlorine Dose Adjustment', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/tutorials');
    await page.waitForTimeout(500);
  });

  /**
   * Advance Chlorine Dose Adjustment to the given step via real operator actions.
   * Call after startTutorialByTitle.
   */
  async function goTo(page: Page, step: 1 | 2 | 3 | 4 | 5) {
    if (step <= 1) return;
    // Step 1 → nav-trends spotlight: navigate to Trends
    await page.locator('#nav-trends').click();
    await waitForStep(page, 2);
    if (step <= 2) return;
    // Step 2 → trend-tag-selector clickToAdvance: select DIS-AIT-001 from tag list
    await page.locator('#trend-tag-selector button').filter({ hasText: 'DIS-AIT-001' }).click();
    await waitForStep(page, 3);
    if (step <= 3) return;
    // Step 3 → nav-disinfection spotlight: navigate to Disinfection
    await page.locator('#nav-disinfection').click();
    await waitForStep(page, 4);
    if (step <= 4) return;
    // Step 4 → hmi-chlorineDose waitFor (setpoint !== 2.5):
    //   Open chlorine dose panel, change setpoint from 2.5 to 3.0 mg/L, apply
    await page.locator('#hmi-chlorineDose').click();
    await page.locator('input[type="number"]').fill('3');
    await page.getByRole('button', { name: 'APPLY' }).click();
    await waitForStep(page, 5);
  }

  test('card displays correct title, description, and step count', async ({ page }) => {
    const card = page.locator('div.bg-gray-900').filter({ hasText: 'Chlorine Dose Adjustment' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('chlorine residual trends');
    await expect(card).toContainText('5 steps');
  });

  test('overlay shows tutorial title after starting', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await expect(overlay(page)).toContainText('Chlorine Dose Adjustment');
  });

  test('step 1 of 5 is shown on start', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await expect(overlay(page)).toContainText('STEP 1 OF 5');
  });

  test('step 1 instruction mentions the Trends page', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await expect(overlay(page)).toContainText('Trends');
  });

  test('step 1 spotlights nav-trends', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    expect(await spotlightTargets(page, 'nav-trends')).toBe(true);
  });

  test('step 2 instruction mentions DIS-AIT-001', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 2);
    await expect(overlay(page)).toContainText('DIS-AIT-001');
  });

  test('step 2 spotlights trend-tag-selector', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 2);
    expect(await spotlightTargets(page, 'trend-tag-selector')).toBe(true);
  });

  test('clicking DIS-AIT-001 in tag list advances to step 3', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 2);
    await page.locator('#trend-tag-selector button').filter({ hasText: 'DIS-AIT-001' }).click();
    await waitForStep(page, 3);
  });

  test('step 3 instruction mentions Disinfection screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 3);
    await expect(overlay(page)).toContainText('Disinfection');
  });

  test('step 3 spotlights nav-disinfection', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 3);
    expect(await spotlightTargets(page, 'nav-disinfection')).toBe(true);
  });

  // Step 4 waitFor: disinfection.chlorineDoseSetpoint !== 2.5 — onStart sets
  // the setpoint to 2.5, so the condition starts false and "Waiting" shows.
  test('step 4 shows "Waiting for action" indicator (has waitFor)', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 4);
    await expect(overlay(page)).toContainText('STEP 4 OF 5');
    await expect(overlay(page)).toContainText('Waiting for action');
  });

  test('step 4 spotlights hmi-chlorineDose', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 4);
    expect(await spotlightTargets(page, 'hmi-chlorineDose')).toBe(true);
  });

  test('changing chlorine dose setpoint on step 4 advances to step 5', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 4);
    await page.locator('#hmi-chlorineDose').click();
    await page.locator('input[type="number"]').fill('3');
    await page.getByRole('button', { name: 'APPLY' }).click();
    await waitForStep(page, 5);
  });

  test('step 5 instruction mentions residual monitoring', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 5);
    await expect(overlay(page)).toContainText('residual');
  });

  test('step 5 spotlights hmi-chlorineResidual', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 5);
    expect(await spotlightTargets(page, 'hmi-chlorineResidual')).toBe(true);
  });

  test('final step (step 5) shows "Finish" button', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 5);
    await expect(overlay(page)).toContainText('STEP 5 OF 5');
    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
  });

  test('completing all steps shows Tutorial Complete screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 5);
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(overlay(page)).toContainText('Tutorial Complete!');
    await expect(overlay(page)).toContainText('Chlorine Dose Adjustment');
  });

  test('FINISH button exits the tutorial overlay', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await goTo(page, 5);
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(overlay(page)).toContainText('Tutorial Complete!', { timeout: 5_000 });
    await page.getByRole('button', { name: 'FINISH' }).click();
    await expect(overlay(page)).not.toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-tutorial behaviour
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Cross-tutorial behaviour', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/tutorials');
    await page.waitForTimeout(500);
  });

  test('each tutorial card shows the correct step count', async ({ page }) => {
    const expected: Record<string, string> = {
      'Plant Startup Procedure':      '8 steps',
      'Responding to Process Alarms': '7 steps',
      'Filter Backwash Procedure':    '6 steps',
      'Chlorine Dose Adjustment':     '5 steps',
    };
    for (const [title, count] of Object.entries(expected)) {
      await expect(page.locator('div.bg-gray-900').filter({ hasText: title })).toContainText(count);
    }
  });

  test('starting a second tutorial replaces the active one', async ({ page }) => {
    const card1 = page.locator('div.bg-gray-900').filter({ hasText: 'Plant Startup Procedure' });
    await card1.getByRole('button', { name: 'START TUTORIAL' }).click();
    await expect(overlay(page)).toContainText('Plant Startup Procedure');

    // SPA navigate back to tutorials page (preserves Zustand store state)
    await page.locator('#nav-tutorials').click();
    await page.waitForTimeout(300);

    const card2 = page.locator('div.bg-gray-900').filter({ hasText: 'Chlorine Dose Adjustment' });
    await card2.getByRole('button', { name: 'START TUTORIAL' }).click();
    await expect(overlay(page)).toContainText('Chlorine Dose Adjustment');
    await expect(overlay(page)).toContainText('STEP 1 OF 5');
  });

  test('progress indicator updates correctly across operator actions', async ({ page }) => {
    const card = page.locator('div.bg-gray-900').filter({ hasText: 'Responding to Process Alarms' });
    await card.getByRole('button', { name: 'START TUTORIAL' }).click();
    await expect(overlay(page)).toContainText('STEP 1 OF 7');
    // Step 1 — alarm-banner observation: click Next
    await nextBtn(page).click();
    await expect(overlay(page)).toContainText('STEP 2 OF 7', { timeout: 5_000 });
    // Step 2 — nav-alarms spotlight: navigate to Alarms page (advances to step 3 observation)
    await page.locator('#nav-alarms').click();
    await expect(overlay(page)).toContainText('STEP 3 OF 7', { timeout: 5_000 });
  });

  test('overlay persists across SPA navigation between HMI screens', async ({ page }) => {
    const card = page.locator('div.bg-gray-900').filter({ hasText: 'Filter Backwash Procedure' });
    await card.getByRole('button', { name: 'START TUTORIAL' }).click();
    await expect(overlay(page)).toBeVisible({ timeout: 5_000 });
    await page.locator('#nav-sedimentation').click();
    await expect(overlay(page)).toBeVisible({ timeout: 5_000 });
    await page.locator('#nav-overview').click();
    await expect(overlay(page)).toBeVisible({ timeout: 5_000 });
  });

  test('tutorials page shows active tutorial banner while a tutorial runs', async ({ page }) => {
    const card = page.locator('div.bg-gray-900').filter({ hasText: 'Plant Startup Procedure' });
    await card.getByRole('button', { name: 'START TUTORIAL' }).click();
    await page.locator('#nav-tutorials').click();
    await expect(page.getByText('Tutorial in progress')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('div').filter({ hasText: 'Plant Startup Procedure' }).first()).toBeVisible();
  });

  test('tutorials page Exit button dismisses the active tutorial', async ({ page }) => {
    const card = page.locator('div.bg-gray-900').filter({ hasText: 'Plant Startup Procedure' });
    await card.getByRole('button', { name: 'START TUTORIAL' }).click();
    await page.locator('#nav-tutorials').click();
    await page.getByRole('button', { name: 'Exit' }).click();
    await expect(overlay(page)).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Tutorial in progress')).not.toBeVisible({ timeout: 3_000 });
  });

  test('X button in overlay header exits the tutorial', async ({ page }) => {
    const card = page.locator('div.bg-gray-900').filter({ hasText: 'Filter Backwash Procedure' });
    await card.getByRole('button', { name: 'START TUTORIAL' }).click();
    const xBtn = overlay(page).getByRole('button').first();
    await xBtn.click();
    await expect(overlay(page)).not.toBeVisible({ timeout: 5_000 });
  });
});
