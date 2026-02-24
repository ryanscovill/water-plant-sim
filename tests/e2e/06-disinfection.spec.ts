import { test, expect } from '@playwright/test';
import { waitForLive, waitForProcessData } from '../helpers/wait-for-live';

test.describe('Disinfection / Clearwell HMI', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/disinfection');
    await waitForProcessData(page);
  });

  test('page heading is correct', async ({ page }) => {
    await expect(page.locator('h2').first()).toContainText('DISINFECTION');
  });

  test('SVG HMI is rendered', async ({ page }) => {
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('chlorine dose feed element is visible', async ({ page }) => {
    await expect(page.locator('#hmi-chlorineDose')).toBeVisible();
  });

  test('chlorine residual analyzer is visible', async ({ page }) => {
    await expect(page.locator('#hmi-chlorineResidual')).toBeVisible();
  });

  test('finished pH analyzer is visible', async ({ page }) => {
    await expect(page.locator('#hmi-finishedPH')).toBeVisible();
  });

  test('distribution chlorine residual analyzer is visible', async ({ page }) => {
    await expect(page.locator('#hmi-distChlorine')).toBeVisible();
  });

  test('CONTACT CHAMBER label is visible', async ({ page }) => {
    await expect(page.getByText('CONTACT CHAMBER')).toBeVisible();
  });

  test('CLEARWELL label is visible', async ({ page }) => {
    await expect(page.getByText('CLEARWELL')).toBeVisible();
  });

  test('UV label is visible in contact chamber', async ({ page }) => {
    await expect(page.getByText('UV')).toBeVisible();
  });

  test('clicking chlorine dose opens chlorine feed modal', async ({ page }) => {
    await page.locator('#hmi-chlorineDose').click();

    await expect(page.getByText('Chlorine Feed System')).toBeVisible();
    await expect(page.getByText('DIS-AIT-001')).toBeVisible();
  });

  test('chlorine modal has pump start/stop and dose setpoint', async ({ page }) => {
    await page.locator('#hmi-chlorineDose').click();

    await expect(page.locator('#ctrl-pump-start')).toBeVisible();
    await expect(page.getByRole('button', { name: 'STOP' })).toBeVisible();
    await expect(page.locator('input[type="range"]').first()).toBeVisible();
  });

  test('clicking backdrop closes chlorine modal', async ({ page }) => {
    await page.locator('#hmi-chlorineDose').click();
    await expect(page.getByText('Chlorine Feed System')).toBeVisible();

    await page.mouse.click(50, 50);
    await expect(page.getByText('Chlorine Feed System')).not.toBeVisible({ timeout: 5_000 });
  });

  test('DIST. SYSTEM label is visible', async ({ page }) => {
    await expect(page.getByText('DIST.')).toBeVisible();
  });
});
