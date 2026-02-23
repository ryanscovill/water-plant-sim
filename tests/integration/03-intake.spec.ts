import { test, expect } from '@playwright/test';
import { waitForLive, waitForProcessData } from '../helpers/wait-for-live';

test.describe('Intake HMI', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/intake');
    await waitForProcessData(page);
  });

  test('page heading is correct', async ({ page }) => {
    await expect(page.locator('h2').first()).toContainText('INTAKE');
  });

  test('SVG HMI is rendered', async ({ page }) => {
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('pump 1 SVG element is visible', async ({ page }) => {
    await expect(page.locator('#hmi-intakePump1')).toBeVisible();
  });

  test('pump 2 SVG element is visible', async ({ page }) => {
    await expect(page.locator('#hmi-intakePump2')).toBeVisible();
  });

  test('intake valve SVG element is visible', async ({ page }) => {
    await expect(page.locator('#hmi-intakeValve')).toBeVisible();
  });

  test('flow meter SVG element is visible', async ({ page }) => {
    await expect(page.locator('#hmi-rawFlow')).toBeVisible();
  });

  test('turbidity analyzer SVG element is visible', async ({ page }) => {
    await expect(page.locator('#hmi-rawTurbidity')).toBeVisible();
  });

  test('screen diff pressure element is visible', async ({ page }) => {
    await expect(page.locator('#hmi-screenDP')).toBeVisible();
  });

  test('clicking pump 1 opens equipment modal with correct title', async ({ page }) => {
    await page.locator('#hmi-intakePump1').click();

    // Modal title shows pump name and tag
    await expect(page.getByText('Intake Pump 1')).toBeVisible();
    await expect(page.getByText('P-101')).toBeVisible();
  });

  test('pump modal has START and STOP buttons', async ({ page }) => {
    await page.locator('#hmi-intakePump1').click();

    await expect(page.locator('#ctrl-pump-start')).toBeVisible();
    await expect(page.getByRole('button', { name: 'STOP' })).toBeVisible();
  });

  test('pump modal has a speed slider', async ({ page }) => {
    await page.locator('#hmi-intakePump1').click();

    await expect(page.locator('input[type="range"]')).toBeVisible();
  });

  test('clicking backdrop closes the pump modal', async ({ page }) => {
    await page.locator('#hmi-intakePump1').click();
    await expect(page.getByText('Intake Pump 1')).toBeVisible();

    // The modal is a right-side panel; clicking top-left backdrop closes it
    await page.mouse.click(50, 50);
    await expect(page.getByText('Intake Pump 1')).not.toBeVisible({ timeout: 5_000 });
  });

  test('clicking pump 2 opens correct modal', async ({ page }) => {
    await page.locator('#hmi-intakePump2').click();

    await expect(page.getByText('Intake Pump 2')).toBeVisible();
    await expect(page.getByText('P-102')).toBeVisible();
  });

  test('clicking intake valve opens valve modal', async ({ page }) => {
    await page.locator('#hmi-intakeValve').click();

    await expect(page.getByText('Intake Valve')).toBeVisible();
    await expect(page.getByText('XV-101')).toBeVisible();
  });

  test('valve modal has OPEN and CLOSE buttons', async ({ page }) => {
    await page.locator('#hmi-intakeValve').click();

    await expect(page.getByRole('button', { name: 'OPEN' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'CLOSE' })).toBeVisible();
  });

  test('close button (X) in modal header closes the modal', async ({ page }) => {
    await page.locator('#hmi-intakePump1').click();
    await expect(page.getByText('Intake Pump 1')).toBeVisible();

    // Click the X close button in the modal header
    await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();
    await expect(page.getByText('Intake Pump 1')).not.toBeVisible({ timeout: 5_000 });
  });
});
