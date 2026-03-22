import { test, expect } from '@playwright/test';
import { waitForLive } from '../helpers/wait-for-live';

test.describe('Simulation Speed Control', () => {
  test('speed button click is reflected in UI immediately', async ({ page }) => {
    await waitForLive(page, '/dw/intake');

    await page.getByRole('button', { name: '10x' }).click();
    await expect(page.getByRole('button', { name: '10x' })).toHaveClass(/bg-blue-700/, { timeout: 1_000 });

    await page.getByRole('button', { name: '1x' }).click();
    await expect(page.getByRole('button', { name: '1x' })).toHaveClass(/bg-blue-700/, { timeout: 1_000 });
  });
});

test.describe('Real-time Connection and UI', () => {
  test('LIVE indicator appears in the navbar', async ({ page }) => {
    await waitForLive(page, '/dw/intake');
    await expect(page.getByText('LIVE', { exact: true })).toBeVisible();
  });

  test('timestamp is displayed in navbar after connection', async ({ page }) => {
    await waitForLive(page, '/dw/intake');

    const timestamp = page.locator('header span.font-mono');
    await expect(timestamp).toBeVisible({ timeout: 5_000 });
  });

  test('sim speed buttons are functional — clicking 10x highlights it', async ({ page }) => {
    await waitForLive(page, '/dw/intake');

    const btn5x = page.getByRole('button', { name: '10x' });
    await btn5x.click();

    await expect(btn5x).toHaveClass(/bg-blue-700/, { timeout: 5_000 });
  });

  test('clicking 1x speed button highlights it and deselects 10x', async ({ page }) => {
    await waitForLive(page, '/dw/intake');

    await page.getByRole('button', { name: '10x' }).click();
    await expect(page.getByRole('button', { name: '10x' })).toHaveClass(/bg-blue-700/, { timeout: 5_000 });

    await page.getByRole('button', { name: '1x' }).click();
    await expect(page.getByRole('button', { name: '1x' })).toHaveClass(/bg-blue-700/, { timeout: 5_000 });
    await expect(page.getByRole('button', { name: '10x' })).not.toHaveClass(/bg-blue-700/);
  });

  test('clicking 60x speed button highlights it', async ({ page }) => {
    await waitForLive(page, '/dw/intake');

    const btn60x = page.getByRole('button', { name: '60x' });
    await btn60x.click();

    await expect(btn60x).toHaveClass(/bg-blue-700/, { timeout: 5_000 });

    await page.getByRole('button', { name: '1x' }).click();
  });

  test('StatusBar values update after connection', async ({ page }) => {
    await waitForLive(page, '/dw/intake');

    const flowText = page.getByText(/Flow:/);
    await expect(flowText).toBeVisible();

    const text = await flowText.textContent();
    expect(text).toMatch(/Flow:\s*[\d.]+\s*MGD/);
  });

  test('SIM speed label is visible in navbar', async ({ page }) => {
    await waitForLive(page, '/dw/intake');

    await expect(page.getByText('SIM:')).toBeVisible();
  });

  test('page continues to receive live data over time', async ({ page }) => {
    await waitForLive(page, '/dw/intake');

    const statusBar = page.locator('.bg-gray-950.border-t');

    await page.getByRole('button', { name: '10x' }).click();
    await page.waitForTimeout(3_000);

    await expect(statusBar).toBeVisible();

    await page.getByRole('button', { name: '1x' }).click();
  });
});
