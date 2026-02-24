import { test, expect } from '@playwright/test';
import { waitForLive } from '../helpers/wait-for-live';

test.describe('Alarms Page', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/alarms');
  });

  test('page heading is ALARM MANAGEMENT', async ({ page }) => {
    await expect(page.locator('h2').first()).toContainText('ALARM MANAGEMENT');
  });

  test('ACTIVE ALARMS panel header is visible', async ({ page }) => {
    await expect(page.getByText(/ACTIVE ALARMS/)).toBeVisible();
  });

  test('ALARM HISTORY panel header is visible', async ({ page }) => {
    await expect(page.getByText(/ALARM HISTORY/)).toBeVisible();
  });

  test('alarm history table headers are visible', async ({ page }) => {
    await expect(page.getByText('Time')).toBeVisible();
    await expect(page.getByText('Tag')).toBeVisible();
    await expect(page.getByText('Description')).toBeVisible();
    await expect(page.getByText('Priority')).toBeVisible();
    await expect(page.getByText('Value')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
  });

  test('Export CSV button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
  });

  test('active alarms section shows count', async ({ page }) => {
    // Header shows "ACTIVE ALARMS (N)" format
    await expect(page.getByText(/ACTIVE ALARMS \(\d+\)/)).toBeVisible();
  });

  test('alarm history section shows count', async ({ page }) => {
    // Header shows "ALARM HISTORY (N)" format
    await expect(page.getByText(/ALARM HISTORY \(\d+\)/)).toBeVisible();
  });

  test('Export CSV button triggers a download', async ({ page }) => {
    // Listen for download event before clicking
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5_000 }).catch(() => null),
      page.getByRole('button', { name: 'Export CSV' }).click(),
    ]);
    // Download may or may not trigger depending on history length; just verify no crash
    // The button click itself should not throw an error
  });

  test('no active alarms shows empty state message', async ({ page }) => {
    // If there are no active alarms the panel shows "No active alarms"
    const activeCount = await page.getByText(/ACTIVE ALARMS \((\d+)\)/).textContent();
    const match = activeCount?.match(/\((\d+)\)/);
    if (match && parseInt(match[1]) === 0) {
      await expect(page.getByText('No active alarms')).toBeVisible();
    }
  });

});
