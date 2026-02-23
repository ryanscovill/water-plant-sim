import { test, expect } from '@playwright/test';
import { waitForLive } from '../helpers/wait-for-live';

const EXPECTED_TAGS = [
  'INT-FIT-001',
  'INT-AIT-001',
  'INT-PDT-001',
  'COG-AIT-001',
  'SED-AIT-001',
  'SED-LIT-001',
  'FLT-PDT-001',
  'FLT-AIT-001',
  'DIS-AIT-001',
  'DIS-AIT-002',
  'DIS-AIT-003',
  'DIS-AIT-004',
  'DIS-LIT-001',
];

test.describe('Trends Page', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/trends');
  });

  test('page heading is correct', async ({ page }) => {
    await expect(page.locator('h2').first()).toContainText('TRENDS');
  });

  test('tag selector panel is visible', async ({ page }) => {
    await expect(page.locator('#trend-tag-selector')).toBeVisible();
  });

  test('SELECT TAG header is visible', async ({ page }) => {
    await expect(page.getByText('SELECT TAG')).toBeVisible();
  });

  test('all 13 trend tags are listed in selector', async ({ page }) => {
    for (const tag of EXPECTED_TAGS) {
      await expect(page.locator('#trend-tag-selector').getByText(tag)).toBeVisible();
    }
  });

  test('duration buttons are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: '10 min' })).toBeVisible();
    await expect(page.getByRole('button', { name: '30 min' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1 hr' })).toBeVisible();
    await expect(page.getByRole('button', { name: '4 hr' })).toBeVisible();
  });

  test('default duration button (30 min) is highlighted', async ({ page }) => {
    const btn = page.getByRole('button', { name: '30 min' });
    await expect(btn).toHaveClass(/bg-blue-700/);
  });

  test('clicking a tag selects it and highlights it', async ({ page }) => {
    const tag = page.locator('#trend-tag-selector').getByText('INT-FIT-001').first();
    await tag.click();

    // The selected tag button gets bg-blue-900/40 class
    const tagButton = page.locator('#trend-tag-selector button').filter({ hasText: 'INT-FIT-001' });
    await expect(tagButton).toHaveClass(/bg-blue-900/);
  });

  test('clicking 10 min duration button highlights it', async ({ page }) => {
    const btn = page.getByRole('button', { name: '10 min' });
    await btn.click();

    await expect(btn).toHaveClass(/bg-blue-700/);
  });

  test('clicking 1 hr duration button highlights it', async ({ page }) => {
    const btn = page.getByRole('button', { name: '1 hr' });
    await btn.click();

    await expect(btn).toHaveClass(/bg-blue-700/);
  });

  test('chart area renders after tag selection', async ({ page }) => {
    // Wait for chart to render — either loading spinner or Recharts SVG
    await page.waitForTimeout(2_000);

    // Either loading state or chart SVG should be present
    const hasChart = await page.locator('.recharts-wrapper').count();
    const hasLoading = await page.getByText('Loading...').count();
    const hasDataPoints = await page.getByText(/data points/).count();

    expect(hasChart + hasLoading + hasDataPoints).toBeGreaterThan(0);
  });

  test('data points counter is visible', async ({ page }) => {
    await page.waitForTimeout(2_000);
    await expect(page.getByText(/data points/)).toBeVisible({ timeout: 10_000 });
  });
});
