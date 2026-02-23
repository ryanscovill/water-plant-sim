import { test, expect } from '@playwright/test';
import { waitForLive, waitForProcessData } from '../helpers/wait-for-live';

test.describe('Coagulation / Flocculation HMI', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/coagulation');
    await waitForProcessData(page);
  });

  test('page heading is correct', async ({ page }) => {
    await expect(page.locator('h2').first()).toContainText('COAGULATION');
  });

  test('SVG HMI is rendered', async ({ page }) => {
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('RAPID MIX label is visible in SVG', async ({ page }) => {
    await expect(page.getByText('RAPID MIX')).toBeVisible();
  });

  test('FLOCCULATION BASIN label is visible in SVG', async ({ page }) => {
    await expect(page.getByText('FLOCCULATION BASIN')).toBeVisible();
  });

  test('rapid mixer HMI element is visible', async ({ page }) => {
    await expect(page.locator('#hmi-rapidMixer')).toBeVisible();
  });

  test('slow mixer HMI element is visible', async ({ page }) => {
    await expect(page.locator('#hmi-slowMixer')).toBeVisible();
  });

  test('alum dose HMI element is visible', async ({ page }) => {
    await expect(page.locator('#hmi-alumDose')).toBeVisible();
  });

  test('clicking rapid mixer opens equipment modal', async ({ page }) => {
    await page.locator('#hmi-rapidMixer').click();

    await expect(page.getByText('Rapid Mixer')).toBeVisible();
    await expect(page.getByText('M-201')).toBeVisible();
  });

  test('rapid mixer modal has START/STOP controls', async ({ page }) => {
    await page.locator('#hmi-rapidMixer').click();

    await expect(page.locator('#ctrl-pump-start')).toBeVisible();
    await expect(page.getByRole('button', { name: 'STOP' })).toBeVisible();
  });

  test('clicking backdrop closes rapid mixer modal', async ({ page }) => {
    await page.locator('#hmi-rapidMixer').click();
    await expect(page.getByText('Rapid Mixer')).toBeVisible();

    await page.mouse.click(50, 50);
    await expect(page.getByText('Rapid Mixer')).not.toBeVisible({ timeout: 5_000 });
  });

  test('clicking alum dose opens chemical feed modal', async ({ page }) => {
    await page.locator('#hmi-alumDose').click();

    await expect(page.getByText('Alum Chemical Feed')).toBeVisible();
    await expect(page.getByText('COG-FIT-001')).toBeVisible();
  });

  test('alum modal has ChemDoseControl setpoint input', async ({ page }) => {
    await page.locator('#hmi-alumDose').click();

    // ChemDoseControl renders a range or number input for the setpoint
    await expect(page.locator('input[type="range"]').first()).toBeVisible();
  });

  test('floc turbidity analyzer is visible', async ({ page }) => {
    await expect(page.locator('#hmi-flocTurbidity')).toBeVisible();
  });
});
