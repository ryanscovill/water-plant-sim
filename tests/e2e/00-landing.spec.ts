import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('displays the app title', async ({ page }) => {
    await expect(page.getByText('WATERWORKS SCADA TRAINER')).toBeVisible();
  });

  test('displays Drinking Water and Wastewater simulator cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Drinking Water Treatment' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Wastewater Treatment' })).toBeVisible();
  });

  test('DW card navigates to /dw/intake', async ({ page }) => {
    await page.getByRole('heading', { name: 'Drinking Water Treatment' }).click();
    await expect(page).toHaveURL(/\/dw\/intake$/);
  });

  test('WW card navigates to /ww/headworks', async ({ page }) => {
    await page.getByRole('heading', { name: 'Wastewater Treatment' }).click();
    await expect(page).toHaveURL(/\/ww\/headworks$/);
  });

  test('no sidebar is visible on landing page', async ({ page }) => {
    await expect(page.locator('nav')).not.toBeVisible();
  });
});
