import { test, expect } from '@playwright/test';
import { waitForLive, waitForProcessData } from '../helpers/wait-for-live';

/** Navigate to /history via the sidebar link (SPA nav — preserves Zustand store). */
async function goToHistory(page: import('@playwright/test').Page) {
  await page.locator('#nav-history').click();
  await expect(page.locator('h2').first()).toContainText('OPERATOR HISTORY');
}

test.describe('Operator History', () => {
  test('History nav link is visible in sidebar', async ({ page }) => {
    await waitForLive(page, '/');
    await expect(page.locator('#nav-history')).toBeVisible();
  });

  test('History nav link navigates to /history', async ({ page }) => {
    await waitForLive(page, '/');
    await page.locator('#nav-history').click();
    await expect(page).toHaveURL(/\/history/);
  });

  test('page heading is OPERATOR HISTORY', async ({ page }) => {
    await waitForLive(page, '/history');
    await expect(page.locator('h2').first()).toContainText('OPERATOR HISTORY');
  });

  test('CLEAR button is visible', async ({ page }) => {
    await waitForLive(page, '/history');
    await expect(page.getByRole('button', { name: 'CLEAR' })).toBeVisible();
  });

  test('empty state message appears after clearing', async ({ page }) => {
    await waitForLive(page, '/history');
    await page.getByRole('button', { name: 'CLEAR' }).click();
    await expect(page.getByText('No operator actions recorded yet.')).toBeVisible();
  });

  test('stopping a running pump records event with before→after state', async ({ page }) => {
    // Pump 1 starts running — stop it
    await waitForLive(page, '/intake');
    await waitForProcessData(page);
    await page.locator('#hmi-intakePump1').click();
    await page.getByRole('button', { name: 'STOP' }).click();

    // SPA navigate to history so the Zustand store is preserved
    await goToHistory(page);

    // Description: "Intake Pump 1 (P-101): running → stopped"
    await expect(page.getByText(/Intake Pump 1 \(P-101\): running → stopped/)).toBeVisible({ timeout: 5_000 });
  });

  test('starting a stopped pump records event with before→after state', async ({ page }) => {
    // Pump 2 starts stopped — start it
    await waitForLive(page, '/intake');
    await waitForProcessData(page);
    await page.locator('#hmi-intakePump2').click();
    await page.locator('#ctrl-pump-start').click();

    await goToHistory(page);

    // Description: "Intake Pump 2 (P-102): stopped → running"
    await expect(page.getByText(/Intake Pump 2 \(P-102\): stopped → running/)).toBeVisible({ timeout: 5_000 });
  });

  test('pump event has "pump" type badge', async ({ page }) => {
    await waitForLive(page, '/intake');
    await waitForProcessData(page);
    await page.locator('#hmi-intakePump1').click();
    await page.getByRole('button', { name: 'STOP' }).click();

    await goToHistory(page);
    await expect(page.getByText('pump').first()).toBeVisible({ timeout: 5_000 });
  });

  test('valve close records event with before→after state', async ({ page }) => {
    // Intake valve starts open
    await waitForLive(page, '/intake');
    await waitForProcessData(page);
    await page.locator('#hmi-intakeValve').click();
    await page.getByRole('button', { name: 'CLOSE' }).click();

    await goToHistory(page);
    await expect(page.getByText(/Intake Valve \(XV-101\):.*→ closed/)).toBeVisible({ timeout: 5_000 });
  });

  test('valve open records event with before→after state', async ({ page }) => {
    // Close the valve first, then open it
    await waitForLive(page, '/intake');
    await waitForProcessData(page);
    await page.locator('#hmi-intakeValve').click();
    await page.getByRole('button', { name: 'CLOSE' }).click();
    await page.locator('#hmi-intakeValve').click();
    await page.getByRole('button', { name: 'OPEN' }).click();

    await goToHistory(page);
    await expect(page.getByText(/Intake Valve \(XV-101\):.*→ open/)).toBeVisible({ timeout: 5_000 });
  });

  test('valve event has "valve" type badge', async ({ page }) => {
    // Valve may be open from a prior test — just close it (CLOSE works when open)
    await waitForLive(page, '/intake');
    await waitForProcessData(page);
    await page.locator('#hmi-intakeValve').click();
    await page.getByRole('button', { name: 'CLOSE' }).click();

    await goToHistory(page);
    await expect(page.getByText('valve').first()).toBeVisible({ timeout: 5_000 });
  });

  test('alum dose setpoint change records before and after values', async ({ page }) => {
    // ChemDoseControl: change number input value → click APPLY
    await waitForLive(page, '/coagulation');
    await waitForProcessData(page);
    await page.locator('#hmi-alumDose').click();

    // Fill the number input directly — reliably triggers React onChange
    const numberInput = page.locator('input[type="number"]').first();
    await numberInput.fill('20');
    await page.getByRole('button', { name: 'APPLY' }).click();

    await goToHistory(page);
    // Description: "Alum dose setpoint: X.X → Y.Y mg/L"
    await expect(page.getByText(/Alum dose setpoint:.*→.*mg\/L/)).toBeVisible({ timeout: 5_000 });
  });

  test('setpoint event has "setpoint" type badge', async ({ page }) => {
    await waitForLive(page, '/coagulation');
    await waitForProcessData(page);
    await page.locator('#hmi-alumDose').click();

    const numberInput = page.locator('input[type="number"]').first();
    await numberInput.fill('16');
    await page.getByRole('button', { name: 'APPLY' }).click();

    await goToHistory(page);
    await expect(page.getByText('setpoint').first()).toBeVisible({ timeout: 5_000 });
  });

  test('CLEAR button empties the history list', async ({ page }) => {
    // Trigger at least one event
    await waitForLive(page, '/intake');
    await waitForProcessData(page);
    await page.locator('#hmi-intakePump1').click();
    await page.getByRole('button', { name: 'STOP' }).click();

    await goToHistory(page);
    await expect(page.getByText(/Intake Pump 1/)).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: 'CLEAR' }).click();
    await expect(page.getByText('No operator actions recorded yet.')).toBeVisible({ timeout: 3_000 });
  });

  test('newest event appears at the top of the list', async ({ page }) => {
    await waitForLive(page, '/intake');
    await waitForProcessData(page);

    // Stop pump 1, then start pump 2 (was stopped)
    await page.locator('#hmi-intakePump1').click();
    await page.getByRole('button', { name: 'STOP' }).click();
    await page.locator('#hmi-intakePump2').click();
    await page.locator('#ctrl-pump-start').click();

    await goToHistory(page);
    const rows = page.locator('div.divide-y > div');
    // Pump 2 action is most recent — should appear first
    await expect(rows.first()).toContainText('Intake Pump 2', { timeout: 5_000 });
  });
});
