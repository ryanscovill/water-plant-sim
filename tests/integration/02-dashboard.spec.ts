import { test, expect } from '@playwright/test';
import { waitForLive, waitForProcessData } from '../helpers/wait-for-live';

test.describe('Dashboard / Overview', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/');
    await waitForProcessData(page);
  });

  test('all 4 stage cards are visible', async ({ page }) => {
    await expect(page.getByText('INTAKE', { exact: true })).toBeVisible();
    await expect(page.getByText('COAGULATION', { exact: true })).toBeVisible();
    await expect(page.getByText('SEDIMENTATION', { exact: true })).toBeVisible();
    await expect(page.getByText('DISINFECTION', { exact: true })).toBeVisible();
  });

  test('clicking INTAKE card navigates to /intake', async ({ page }) => {
    await page.getByText('INTAKE', { exact: true }).click();
    await expect(page).toHaveURL(/\/intake/);
  });

  test('clicking COAGULATION card navigates to /coagulation', async ({ page }) => {
    await page.goto('/');
    await waitForProcessData(page);
    await page.getByText('COAGULATION', { exact: true }).click();
    await expect(page).toHaveURL(/\/coagulation/);
  });

  test('clicking SEDIMENTATION card navigates to /sedimentation', async ({ page }) => {
    await page.goto('/');
    await waitForProcessData(page);
    await page.getByText('SEDIMENTATION', { exact: true }).click();
    await expect(page).toHaveURL(/\/sedimentation/);
  });

  test('clicking DISINFECTION card navigates to /disinfection', async ({ page }) => {
    await page.goto('/');
    await waitForProcessData(page);
    await page.getByText('DISINFECTION', { exact: true }).click();
    await expect(page).toHaveURL(/\/disinfection/);
  });

  test('StatusBar shows all key process values', async ({ page }) => {
    // StatusBar renders at the bottom after live data arrives
    await expect(page.getByText(/Flow:/)).toBeVisible();
    await expect(page.getByText(/Cl₂:/)).toBeVisible();
    await expect(page.getByText(/Filter HL:/)).toBeVisible();
    await expect(page.getByText(/CW Level:/)).toBeVisible();
  });

  test('process flow arrow is displayed', async ({ page }) => {
    await expect(page.getByText('RIVER')).toBeVisible();
    await expect(page.getByText('DISTRIBUTION')).toBeVisible();
  });

  test('page heading is PLANT OVERVIEW', async ({ page }) => {
    await expect(page.locator('h2').first()).toContainText('PLANT OVERVIEW');
  });
});
