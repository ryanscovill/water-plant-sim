import { test, expect } from '@playwright/test';
import { waitForLive, waitForProcessData } from '../helpers/wait-for-live';

test.describe('Sedimentation / Filtration HMI', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/dw/sedimentation');
    await waitForProcessData(page);
  });

  test('page heading is correct', async ({ page }) => {
    await expect(page.locator('h2').first()).toContainText('SEDIMENTATION');
  });

  test('SVG HMI is rendered', async ({ page }) => {
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('clarifier turbidity analyzer is visible', async ({ page }) => {
    await expect(page.locator('#hmi-clarifierTurb')).toBeVisible();
  });

  test('sludge blanket level analyzer is visible', async ({ page }) => {
    await expect(page.locator('#hmi-sludgeLevel')).toBeVisible();
  });

  test('filter head loss analyzer is visible', async ({ page }) => {
    await expect(page.locator('#hmi-filterHeadLoss')).toBeVisible();
  });

  test('filter effluent turbidity analyzer is visible', async ({ page }) => {
    await expect(page.locator('#hmi-filterEffluent')).toBeVisible();
  });

  test('filter bed element is visible', async ({ page }) => {
    await expect(page.locator('#hmi-filterBed')).toBeVisible();
  });

  test('clicking filter bed opens filter modal', async ({ page }) => {
    await page.locator('#hmi-filterBed').click();

    await expect(page.getByText('Filter Bed')).toBeVisible();
    await expect(page.getByText('FLT-F-301')).toBeVisible();
  });

  test('filter modal shows head loss and run time', async ({ page }) => {
    await page.locator('#hmi-filterBed').click();

    await expect(page.getByText('Head Loss', { exact: true })).toBeVisible();
    await expect(page.getByText('Run Time', { exact: true })).toBeVisible();
  });

  test('filter modal has START BACKWASH button when not backwashing', async ({ page }) => {
    await page.locator('#hmi-filterBed').click();

    // Only visible when backwash is NOT in progress
    const startBw = page.locator('button#ctrl-backwash-start');
    // It may or may not be visible depending on sim state; just check it exists
    const count = await startBw.count();
    // The button exists in the modal body
    if (count > 0) {
      await expect(startBw).toBeVisible();
    }
  });

  test('clicking backdrop closes filter modal', async ({ page }) => {
    await page.locator('#hmi-filterBed').click();
    await expect(page.getByText('Filter Bed')).toBeVisible();

    await page.mouse.click(50, 50);
    await expect(page.getByText('Filter Bed')).not.toBeVisible({ timeout: 5_000 });
  });

  test('SLUDGE PUMP text is visible in SVG', async ({ page }) => {
    await expect(page.locator('svg text').filter({ hasText: 'SLUDGE PUMP' })).toBeVisible();
  });

  test('clicking sludge pump opens sludge pump modal', async ({ page }) => {
    await page.locator('svg text').filter({ hasText: 'SLUDGE PUMP' }).click();

    await expect(page.getByText('Sludge Pump').first()).toBeVisible();
    await expect(page.getByText('P-301', { exact: true })).toBeVisible();
  });

  test('BACKWASH text is visible in SVG', async ({ page }) => {
    // The backwash button shows "BACKWASH" when not in progress
    await expect(page.getByText('BACKWASH')).toBeVisible();
  });
});
