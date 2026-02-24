/**
 * Suite 15 — Per-tutorial integration tests
 *
 * Tests the content, step progression, spotlight, and completion flow for
 * each of the four tutorials individually.
 *
 * Each describe block calls waitForLive(page, '/tutorials') in beforeEach,
 * which performs a full page reload and therefore resets the Zustand tutorial
 * store — no state bleeds between tests.
 *
 * AUTO-ADVANCE NOTE
 * -----------------
 * Steps that have a `waitFor` condition auto-advance as soon as the condition
 * evaluates to true against the current ProcessState.  Several conditions are
 * already satisfied by the default simulation initial state:
 *
 *   Plant Startup – step 3:  intake.intakePump1.running === true  (pump is on)
 *   Plant Startup – step 6:  disinfection.chlorinePumpStatus.running === true (pump is on)
 * These steps are invisible to the user; the overlay jumps over them instantly.
 * Tests that target steps at or after those positions account for this by using
 * the effective click counts listed below:
 *
 *   Plant Startup effective Next-clicks to reach:
 *     step 2 → 1 click
 *     step 4 → 2 clicks  (step 3 auto-advances)
 *     step 5 → 3 clicks
 *     step 7 → 4 clicks  (step 6 auto-advances)
 *     step 8 → 5 clicks
 *     Complete → 6 clicks
 *
 *   Chlorine Dose Adjustment effective Next-clicks:
 *     step 2 → 1 click
 *     step 3 → 2 clicks
 *     step 4 → 3 clicks  (onStart sets setpoint to 2.5; step 4 waitFor NOT pre-satisfied)
 *     step 5 → 4 clicks  (user must change setpoint to advance)
 *     Complete → 5 clicks
 */

import { test, expect, type Page } from '@playwright/test';
import { waitForLive } from '../helpers/wait-for-live';

// ── shared helpers ────────────────────────────────────────────────────────────

const overlay = (page: Page) => page.locator('.fixed.bottom-12.right-4');
const nextBtn  = (page: Page) => page.getByRole('button', { name: /^(Next|Finish)/ });
const backBtn  = (page: Page) => page.getByRole('button', { name: 'Back' });

/** Click the START TUTORIAL button on the card whose title matches. */
async function startTutorialByTitle(page: Page, title: string) {
  const card = page.locator('div.bg-gray-900').filter({ hasText: title });
  await card.getByRole('button', { name: 'START TUTORIAL' }).click();
  await expect(overlay(page)).toBeVisible({ timeout: 8_000 });
}

/**
 * Advance the tutorial by `n` steps.
 *
 * For normal steps the Next button is clicked.  For waitFor steps Next is
 * hidden (by design), so the step is advanced via the dev-mode window helper
 * `__tutorialNextStep` instead.  After each advance we wait for the overlay
 * content to change, then pause 400 ms for chained auto-advances to settle.
 */
async function advanceSteps(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    const before = await overlay(page).textContent();
    const next = nextBtn(page);
    if (await next.isVisible()) {
      await next.click();
    } else {
      // waitFor step — Next is hidden; advance via the exposed store helper
      await page.evaluate(() => (window as any).__tutorialNextStep?.());
    }
    // Wait until the overlay content differs from what it was pre-advance
    await page.waitForFunction(
      ([sel, prev]: [string, string | null]) => {
        const el = document.querySelector(sel);
        return el !== null && el.textContent !== prev;
      },
      ['.fixed.bottom-12.right-4', before] as [string, string | null],
      { timeout: 8_000 }
    );
    // Extra settle time for any chained auto-advances
    await page.waitForTimeout(400);
  }
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

test.describe('Tutorial: Plant Startup Procedure', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/tutorials');
    await page.waitForTimeout(500);
  });

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

  test('Next advances to step 2 and enables Back', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 1);
    await expect(overlay(page)).toContainText('STEP 2 OF 8');
    await expect(backBtn(page)).not.toBeDisabled();
  });

  test('step 2 instruction mentions Intake Pump 1', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 1);
    await expect(overlay(page)).toContainText('Intake Pump 1');
  });

  test('step 2 spotlights hmi-intakePump1', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 1);
    expect(await spotlightTargets(page, 'hmi-intakePump1')).toBe(true);
  });

  test('Back returns from step 2 to step 1', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 1);
    await backBtn(page).click();
    await expect(overlay(page)).toContainText('STEP 1 OF 8');
    await expect(backBtn(page)).toBeDisabled();
  });

  // Step 3 (waitFor: intake.intakePump1.running === true) auto-advances
  // immediately because the pump is already running in the default state.
  // Two Next-clicks from step 1 therefore land on step 4, not step 3.
  test('step 3 auto-advances to step 4 (pump already running)', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 2); // 1→2→[3 auto→4]
    await expect(overlay(page)).toContainText('STEP 4 OF 8');
  });

  test('step 4 instruction mentions Coagulation screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 2);
    await expect(overlay(page)).toContainText('Coagulation');
  });

  test('step 4 spotlights nav-coagulation', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 2);
    expect(await spotlightTargets(page, 'nav-coagulation')).toBe(true);
  });

  test('step 5 shows STEP 5 OF 8', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 3); // 1→2→[3 auto→4]→5
    await expect(overlay(page)).toContainText('STEP 5 OF 8');
  });

  test('step 5 instruction mentions alum dose setpoint', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 3);
    await expect(overlay(page)).toContainText('alum dose');
  });

  test('step 5 spotlights hmi-alumDose', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 3);
    expect(await spotlightTargets(page, 'hmi-alumDose')).toBe(true);
  });

  // Step 6 (waitFor: disinfection.chlorinePumpStatus.running === true) also
  // auto-advances because the chlorine pump is on in the default state.
  // Four Next-clicks therefore land on step 7, not step 6.
  test('step 6 auto-advances to step 7 (chlorine pump already running)', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 4); // 1→2→[3 auto→4]→5→[6 auto→7]
    await expect(overlay(page)).toContainText('STEP 7 OF 8');
  });

  test('step 7 instruction mentions chlorine residual and Trends', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 4);
    await expect(overlay(page)).toContainText('chlorine residual');
    await expect(overlay(page)).toContainText('Trends');
  });

  test('step 7 spotlights nav-trends', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 4);
    expect(await spotlightTargets(page, 'nav-trends')).toBe(true);
  });

  test('final step (step 8) shows "Finish" button instead of "Next"', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 5); // reach step 8
    await expect(overlay(page)).toContainText('STEP 8 OF 8');
    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
  });

  test('step 8 instruction mentions Overview screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 5);
    await expect(overlay(page)).toContainText('Overview');
  });

  test('step 8 spotlights nav-overview', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 5);
    expect(await spotlightTargets(page, 'nav-overview')).toBe(true);
  });

  test('clicking Finish on last step shows Tutorial Complete screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 6); // step 8 → Finish → Complete
    await expect(overlay(page)).toContainText('Tutorial Complete!');
    await expect(overlay(page)).toContainText('Plant Startup Procedure');
  });

  test('FINISH button on completion screen dismisses the overlay', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await advanceSteps(page, 6);
    await page.getByRole('button', { name: 'FINISH' }).click();
    await expect(overlay(page)).not.toBeVisible({ timeout: 5_000 });
  });

  test('overlay stays visible after SPA navigation during tutorial', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await page.locator('#nav-intake').click();
    await expect(overlay(page)).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial 2 — Responding to Process Alarms (7 steps)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Tutorial: Responding to Process Alarms', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/tutorials');
    await page.waitForTimeout(500);
  });

  test('card displays correct title, description, and step count', async ({ page }) => {
    const card = page.locator('div.bg-gray-900').filter({ hasText: 'Responding to Process Alarms' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('acknowledging and responding');
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
    await advanceSteps(page, 1);
    expect(await spotlightTargets(page, 'nav-alarms')).toBe(true);
  });

  // Step 3 waitFor: alarms.some(a => a.acknowledged) — no alarms are
  // acknowledged in the initial state, so this step stays and shows the indicator.
  test('step 3 shows "Waiting for action" indicator (has waitFor)', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await advanceSteps(page, 2);
    await expect(overlay(page)).toContainText('STEP 3 OF 7');
    await expect(overlay(page)).toContainText('Waiting for action');
  });

  test('step 3 spotlights alarm-ack-button', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await advanceSteps(page, 2);
    expect(await spotlightTargets(page, 'alarm-ack-button')).toBe(true);
  });

  test('step 4 spotlights nav-intake', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await advanceSteps(page, 3);
    expect(await spotlightTargets(page, 'nav-intake')).toBe(true);
  });

  test('step 5 instruction mentions raw turbidity', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await advanceSteps(page, 4);
    await expect(overlay(page)).toContainText('raw turbidity');
  });

  test('step 5 spotlights hmi-rawTurbidity', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await advanceSteps(page, 4);
    expect(await spotlightTargets(page, 'hmi-rawTurbidity')).toBe(true);
  });

  // Step 6 waitFor: coagulation.alumDoseSetpoint > 20 — initial setpoint is 18,
  // so the condition is not met and the "Waiting" indicator is shown.
  test('step 6 shows "Waiting for action" indicator (has waitFor)', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await advanceSteps(page, 5);
    await expect(overlay(page)).toContainText('STEP 6 OF 7');
    await expect(overlay(page)).toContainText('Waiting for action');
  });

  test('step 6 spotlights hmi-alumDose', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await advanceSteps(page, 5);
    expect(await spotlightTargets(page, 'hmi-alumDose')).toBe(true);
  });

  test('step 7 instruction mentions floc turbidity', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await advanceSteps(page, 6);
    await expect(overlay(page)).toContainText('STEP 7 OF 7');
    await expect(overlay(page)).toContainText('floc turbidity');
  });

  test('step 7 spotlights hmi-flocTurbidity', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await advanceSteps(page, 6);
    expect(await spotlightTargets(page, 'hmi-flocTurbidity')).toBe(true);
  });

  test('final step (step 7) shows "Finish" button', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await advanceSteps(page, 6);
    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
  });

  test('completing all steps shows Tutorial Complete screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await advanceSteps(page, 7);
    await expect(overlay(page)).toContainText('Tutorial Complete!');
    await expect(overlay(page)).toContainText('Responding to Process Alarms');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial 3 — Filter Backwash Procedure (6 steps)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Tutorial: Filter Backwash Procedure', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/tutorials');
    await page.waitForTimeout(500);
  });

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
    await advanceSteps(page, 1);
    await expect(overlay(page)).toContainText('Filter Head Loss');
    await expect(overlay(page)).toContainText('8 feet');
  });

  test('step 2 spotlights hmi-filterHeadLoss', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await advanceSteps(page, 1);
    expect(await spotlightTargets(page, 'hmi-filterHeadLoss')).toBe(true);
  });

  test('step 3 instruction mentions Filter Run Time and 72 hours', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await advanceSteps(page, 2);
    await expect(overlay(page)).toContainText('Filter Run Time');
    await expect(overlay(page)).toContainText('72 hours');
  });

  test('step 3 spotlights hmi-filterRunTime', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await advanceSteps(page, 2);
    expect(await spotlightTargets(page, 'hmi-filterRunTime')).toBe(true);
  });

  test('step 4 instruction mentions the Filter Bed symbol', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await advanceSteps(page, 3);
    await expect(overlay(page)).toContainText('Filter Bed');
  });

  test('step 4 spotlights hmi-filterBed', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await advanceSteps(page, 3);
    expect(await spotlightTargets(page, 'hmi-filterBed')).toBe(true);
  });

  // Step 5 waitFor: sedimentation.backwashInProgress === true — no backwash
  // running in the default state, so the "Waiting" indicator is shown.
  test('step 5 shows "Waiting for action" indicator (has waitFor)', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await advanceSteps(page, 4);
    await expect(overlay(page)).toContainText('STEP 5 OF 6');
    await expect(overlay(page)).toContainText('Waiting for action');
  });

  test('step 5 spotlights ctrl-backwash-start', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await advanceSteps(page, 4);
    expect(await spotlightTargets(page, 'ctrl-backwash-start')).toBe(true);
  });

  test('step 6 instruction mentions the backwash timer and 10 minutes', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await advanceSteps(page, 5);
    await expect(overlay(page)).toContainText('timer');
    await expect(overlay(page)).toContainText('10 minutes');
  });

  test('step 6 spotlights hmi-backwashTimer', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await advanceSteps(page, 5);
    expect(await spotlightTargets(page, 'hmi-backwashTimer')).toBe(true);
  });

  test('final step (step 6) shows "Finish" button', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await advanceSteps(page, 5);
    await expect(overlay(page)).toContainText('STEP 6 OF 6');
    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
  });

  test('completing all steps shows Tutorial Complete screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await advanceSteps(page, 6);
    await expect(overlay(page)).toContainText('Tutorial Complete!');
    await expect(overlay(page)).toContainText('Filter Backwash Procedure');
  });

  test('FINISH button on completion screen dismisses the overlay', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await advanceSteps(page, 6);
    await page.getByRole('button', { name: 'FINISH' }).click();
    await expect(overlay(page)).not.toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial 4 — Chlorine Dose Adjustment (5 steps)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Tutorial: Chlorine Dose Adjustment', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/tutorials');
    await page.waitForTimeout(500);
  });

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
    await advanceSteps(page, 1);
    await expect(overlay(page)).toContainText('DIS-AIT-001');
  });

  test('step 2 spotlights trend-tag-selector', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await advanceSteps(page, 1);
    expect(await spotlightTargets(page, 'trend-tag-selector')).toBe(true);
  });

  test('step 3 instruction mentions Disinfection screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await advanceSteps(page, 2);
    await expect(overlay(page)).toContainText('Disinfection');
  });

  test('step 3 spotlights nav-disinfection', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await advanceSteps(page, 2);
    expect(await spotlightTargets(page, 'nav-disinfection')).toBe(true);
  });

  // Step 4 waitFor: disinfection.chlorineDoseSetpoint !== 2.5 — onStart sets
  // the setpoint to exactly 2.5, so the condition is NOT pre-satisfied.
  // Three clicks land on step 4 and the "Waiting for action" indicator shows.
  test('step 4 shows "Waiting for action" indicator (has waitFor)', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await advanceSteps(page, 3); // 1→2→3→4
    await expect(overlay(page)).toContainText('STEP 4 OF 5');
    await expect(overlay(page)).toContainText('Waiting for action');
  });

  test('step 4 spotlights hmi-chlorineDose', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await advanceSteps(page, 3);
    expect(await spotlightTargets(page, 'hmi-chlorineDose')).toBe(true);
  });

  test('step 5 instruction mentions residual monitoring', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await advanceSteps(page, 4); // 1→2→3→4→5 (Next skips waitFor)
    await expect(overlay(page)).toContainText('residual');
  });

  test('step 5 spotlights hmi-chlorineResidual', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await advanceSteps(page, 4);
    expect(await spotlightTargets(page, 'hmi-chlorineResidual')).toBe(true);
  });

  test('final step (step 5) shows "Finish" button', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await advanceSteps(page, 4);
    await expect(overlay(page)).toContainText('STEP 5 OF 5');
    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
  });

  test('completing all steps shows Tutorial Complete screen', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await advanceSteps(page, 5); // step 5 → Finish → Complete
    await expect(overlay(page)).toContainText('Tutorial Complete!');
    await expect(overlay(page)).toContainText('Chlorine Dose Adjustment');
  });

  test('FINISH button exits the tutorial overlay', async ({ page }) => {
    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await advanceSteps(page, 5);
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
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await expect(overlay(page)).toContainText('Plant Startup Procedure');

    // Use SPA navigation to return to the tutorials page
    await page.locator('#nav-tutorials').click();
    await page.waitForTimeout(300);

    await startTutorialByTitle(page, 'Chlorine Dose Adjustment');
    await expect(overlay(page)).toContainText('Chlorine Dose Adjustment');
    await expect(overlay(page)).toContainText('STEP 1 OF 5');
  });

  test('progress indicator updates correctly across manual Next clicks', async ({ page }) => {
    await startTutorialByTitle(page, 'Responding to Process Alarms');
    await expect(overlay(page)).toContainText('STEP 1 OF 7');
    await nextBtn(page).click();
    await page.waitForTimeout(400);
    await expect(overlay(page)).toContainText('STEP 2 OF 7');
    await nextBtn(page).click();
    await page.waitForTimeout(400);
    await expect(overlay(page)).toContainText('STEP 3 OF 7');
  });

  test('overlay persists across SPA navigation between HMI screens', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    await page.locator('#nav-sedimentation').click();
    await expect(overlay(page)).toBeVisible({ timeout: 5_000 });
    await page.locator('#nav-overview').click();
    await expect(overlay(page)).toBeVisible({ timeout: 5_000 });
  });

  test('tutorials page shows active tutorial banner while a tutorial runs', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await page.locator('#nav-tutorials').click();
    await expect(page.getByText('Tutorial in progress')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('div').filter({ hasText: 'Plant Startup Procedure' }).first()).toBeVisible();
  });

  test('tutorials page Exit button dismisses the active tutorial', async ({ page }) => {
    await startTutorialByTitle(page, 'Plant Startup Procedure');
    await page.locator('#nav-tutorials').click();
    await page.getByRole('button', { name: 'Exit' }).click();
    await expect(overlay(page)).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Tutorial in progress')).not.toBeVisible({ timeout: 3_000 });
  });

  test('X button in overlay header exits the tutorial', async ({ page }) => {
    await startTutorialByTitle(page, 'Filter Backwash Procedure');
    const xBtn = overlay(page).getByRole('button').first();
    await xBtn.click();
    await expect(overlay(page)).not.toBeVisible({ timeout: 5_000 });
  });
});
