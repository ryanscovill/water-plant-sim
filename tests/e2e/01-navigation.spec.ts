import { test, expect } from '@playwright/test';
import { waitForLive } from '../helpers/wait-for-live';

const navItems = [
  { id: 'nav-intake', url: '/intake', heading: 'INTAKE' },
  { id: 'nav-coagulation', url: '/coagulation', heading: 'COAGULATION' },
  { id: 'nav-sedimentation', url: '/sedimentation', heading: 'SEDIMENTATION' },
  { id: 'nav-disinfection', url: '/disinfection', heading: 'DISINFECTION' },
  { id: 'nav-alarms', url: '/alarms', heading: 'ALARM MANAGEMENT' },
  { id: 'nav-trends', url: '/trends', heading: 'TRENDS' },
  { id: 'nav-scenarios', url: '/scenarios', heading: 'TRAINING SCENARIOS' },
  { id: 'nav-tutorials', url: '/tutorials', heading: 'OPERATOR TUTORIALS' },
];

test.describe('Navigation', () => {
  test('all 8 nav links are visible in the sidebar', async ({ page }) => {
    await waitForLive(page, '/alarms');

    for (const item of navItems) {
      await expect(page.locator(`#${item.id}`)).toBeVisible();
    }
  });

  test('each nav link navigates to the correct URL', async ({ page }) => {
    await waitForLive(page, '/alarms');

    for (const item of navItems) {
      await page.locator(`#${item.id}`).click();
      await expect(page).toHaveURL(new RegExp(`^http://localhost:5173${item.url}$`));
      await page.locator('h2').first().waitFor({ state: 'visible', timeout: 5_000 });
    }
  });

  test('each nav link shows the correct page heading', async ({ page }) => {
    await waitForLive(page, '/alarms');

    for (const item of navItems) {
      await page.locator(`#${item.id}`).click();
      await expect(page.locator('h2').first()).toContainText(item.heading.split('/')[0].trim(), { timeout: 5_000 });
    }
  });

  test('active nav link has the highlighted class', async ({ page }) => {
    await waitForLive(page, '/alarms');

    for (const item of navItems) {
      await page.locator(`#${item.id}`).click();
      await page.locator('h2').first().waitFor({ state: 'visible', timeout: 5_000 });

      const link = page.locator(`#${item.id}`);
      // Active link gets bg-blue-900/50 class
      await expect(link).toHaveClass(/bg-blue-900/);
    }
  });

  test('root URL redirects to /intake', async ({ page }) => {
    await waitForLive(page, '/');
    await expect(page).toHaveURL(/\/intake$/);
  });
});
