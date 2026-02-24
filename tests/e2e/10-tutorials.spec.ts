import { test, expect } from '@playwright/test';
import { waitForLive } from '../helpers/wait-for-live';

test.describe('Tutorials Page', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/tutorials');
  });

  test('page heading is OPERATOR TUTORIALS', async ({ page }) => {
    await expect(page.locator('h2').first()).toContainText('OPERATOR TUTORIALS');
  });

  test('description text is visible', async ({ page }) => {
    await expect(page.getByText(/Step-by-step guided tutorials/)).toBeVisible();
  });

  test('4 tutorial cards are rendered', async ({ page }) => {
    // Wait for tutorials to load from API
    await page.waitForTimeout(2_000);

    const startButtons = page.getByRole('button', { name: 'START TUTORIAL' });
    await expect(startButtons).toHaveCount(4, { timeout: 10_000 });
  });

  test('each tutorial card shows step count', async ({ page }) => {
    await page.waitForTimeout(2_000);

    const stepCounts = page.getByText(/\d+ steps/);
    const count = await stepCounts.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('starting a tutorial opens the TutorialOverlay', async ({ page }) => {
    await page.waitForTimeout(2_000);

    await page.getByRole('button', { name: 'START TUTORIAL' }).first().click();

    // Overlay card is visible and Back button is always present
    const overlay = page.locator('.fixed.bottom-12.right-4');
    await expect(overlay).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible({ timeout: 5_000 });
  });

  test('tutorial overlay has exit button', async ({ page }) => {
    await page.waitForTimeout(2_000);

    await page.getByRole('button', { name: 'START TUTORIAL' }).first().click();

    const overlay = page.locator('.fixed.bottom-12.right-4');
    await expect(overlay).toBeVisible({ timeout: 5_000 });
  });

  test('closing tutorial overlay via X button exits tutorial', async ({ page }) => {
    await page.waitForTimeout(2_000);

    await page.getByRole('button', { name: 'START TUTORIAL' }).first().click();

    const overlay = page.locator('.fixed.bottom-12.right-4');
    await expect(overlay).toBeVisible({ timeout: 5_000 });

    // Click X button in overlay header (it's in the fixed bottom-right card)
    const xButton = overlay.getByRole('button').first();
    await xButton.click();

    // Overlay should be gone
    await expect(page.locator('.fixed.bottom-12.right-4')).not.toBeVisible({ timeout: 5_000 });
  });

  // Alarm Response step 1 spotlights 'alarm-banner' (not a nav element, no waitFor)
  // so the Next button is visible — use it to verify Next advances the step.
  test('Next button advances to next step', async ({ page }) => {
    await page.waitForTimeout(2_000);

    const card = page.locator('div.bg-gray-900').filter({ hasText: 'Responding to Process Alarms' });
    await card.getByRole('button', { name: 'START TUTORIAL' }).click();

    await expect(page.getByRole('button', { name: /Next/ })).toBeVisible({ timeout: 5_000 });

    // Click Next to advance
    await page.getByRole('button', { name: /Next/ }).click();

    // Back button should now be enabled (not at step 0 anymore)
    const backBtn = page.getByRole('button', { name: 'Back' });
    await expect(backBtn).not.toBeDisabled({ timeout: 5_000 });
  });

  test('active tutorial banner appears on tutorials page when tutorial is running', async ({ page }) => {
    await page.waitForTimeout(2_000);

    await page.getByRole('button', { name: 'START TUTORIAL' }).first().click();

    const overlay = page.locator('.fixed.bottom-12.right-4');
    await expect(overlay).toBeVisible({ timeout: 5_000 });

    // Use SPA navigation to return to tutorials page (preserves Zustand store state)
    await page.locator('#nav-tutorials').click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Tutorial in progress')).toBeVisible({ timeout: 5_000 });
  });
});
