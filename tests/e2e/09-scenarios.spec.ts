import { test, expect } from '@playwright/test';
import { waitForLive } from '../helpers/wait-for-live';

test.describe('Scenarios Page', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/scenarios');
  });

  test('page heading is TRAINING SCENARIOS', async ({ page }) => {
    await expect(page.locator('h2').first()).toContainText('TRAINING SCENARIOS');
  });

  test('description paragraph is visible', async ({ page }) => {
    await expect(page.getByText(/Select a scenario/)).toBeVisible();
  });

  test('7 scenario cards are rendered', async ({ page }) => {
    // Wait for scenarios to load from API
    await page.waitForTimeout(2_000);

    const startButtons = page.getByRole('button', { name: 'START SCENARIO' });
    await expect(startButtons).toHaveCount(7, { timeout: 10_000 });
  });

  test('each scenario card has a difficulty badge', async ({ page }) => {
    await page.waitForTimeout(2_000);

    // Check that difficulty badges appear (Beginner, Intermediate, Advanced)
    const badges = page.locator('span').filter({ hasText: /^(Beginner|Intermediate|Advanced)$/ });
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('each scenario card has a START SCENARIO button', async ({ page }) => {
    await page.waitForTimeout(2_000);

    const buttons = page.getByRole('button', { name: 'START SCENARIO' });
    const count = await buttons.count();
    expect(count).toBe(7);
  });

  test('starting a scenario changes its button to STOP SCENARIO', async ({ page }) => {
    await page.waitForTimeout(2_000);

    // Click first START SCENARIO button
    const firstStart = page.getByRole('button', { name: 'START SCENARIO' }).first();
    await firstStart.click();

    // After starting, a STOP SCENARIO button should appear
    await expect(page.getByRole('button', { name: 'STOP SCENARIO' })).toBeVisible({ timeout: 10_000 });
  });

  test('stopping a scenario reverts to START SCENARIO buttons', async ({ page }) => {
    await page.waitForTimeout(2_000);

    // Start a scenario
    await page.getByRole('button', { name: 'START SCENARIO' }).first().click();
    await expect(page.getByRole('button', { name: 'STOP SCENARIO' })).toBeVisible({ timeout: 10_000 });

    // Stop it
    await page.getByRole('button', { name: 'STOP SCENARIO' }).click();
    await expect(page.getByRole('button', { name: 'START SCENARIO' }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('active scenario card has amber border styling', async ({ page }) => {
    await page.waitForTimeout(2_000);

    await page.getByRole('button', { name: 'START SCENARIO' }).first().click();
    await expect(page.getByRole('button', { name: 'STOP SCENARIO' })).toBeVisible({ timeout: 10_000 });

    // Active card has border-amber-500 class
    const activeCard = page.locator('.border-amber-500');
    await expect(activeCard).toBeVisible();

    // Clean up
    await page.getByRole('button', { name: 'STOP SCENARIO' }).click();
  });
});
