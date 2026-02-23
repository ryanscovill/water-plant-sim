import { test, expect } from '@playwright/test';
import { waitForLive, waitForProcessData } from '../helpers/wait-for-live';
import { assertNoOverlaps, assertNotClipped } from '../helpers/overlap';

const pages = [
  { url: '/', name: 'Overview / Dashboard' },
  { url: '/intake', name: 'Intake' },
  { url: '/coagulation', name: 'Coagulation' },
  { url: '/sedimentation', name: 'Sedimentation' },
  { url: '/disinfection', name: 'Disinfection' },
  { url: '/alarms', name: 'Alarms' },
  { url: '/trends', name: 'Trends' },
  { url: '/scenarios', name: 'Scenarios' },
  { url: '/tutorials', name: 'Tutorials' },
];

test.describe('Layout — No Overlaps', () => {
  for (const p of pages) {
    test(`${p.name}: header, sidebar, and main do not overlap`, async ({ page }) => {
      await waitForLive(page, p.url);
      await waitForProcessData(page);

      // Allow time for page to fully render
      await page.waitForTimeout(500);

      const header = page.locator('header').first();
      const sidebar = page.locator('nav').first();
      const main = page.locator('main').first();

      await expect(header).toBeVisible();
      await expect(sidebar).toBeVisible();
      await expect(main).toBeVisible();

      await assertNoOverlaps(page, [
        { name: 'header', locator: header },
        { name: 'sidebar (nav)', locator: sidebar },
        { name: 'main', locator: main },
      ]);
    });

    test(`${p.name}: page heading (h2) is not clipped outside viewport`, async ({ page }) => {
      await waitForLive(page, p.url);
      await waitForProcessData(page);
      await page.waitForTimeout(500);

      const heading = page.locator('h2').first();
      await expect(heading).toBeVisible();

      await assertNotClipped(page, heading, 'h2 heading');
    });
  }
});

test.describe('Layout — Structural Checks', () => {
  test('sidebar is positioned to the left of main content', async ({ page }) => {
    await waitForLive(page, '/');
    await waitForProcessData(page);

    const sidebar = page.locator('nav').first();
    const main = page.locator('main').first();

    const sidebarBox = await sidebar.boundingBox();
    const mainBox = await main.boundingBox();

    expect(sidebarBox).not.toBeNull();
    expect(mainBox).not.toBeNull();

    // Sidebar right edge should be at or left of main left edge
    expect(sidebarBox!.x + sidebarBox!.width).toBeLessThanOrEqual(mainBox!.x + 2);
  });

  test('header is positioned above main content', async ({ page }) => {
    await waitForLive(page, '/');
    await waitForProcessData(page);

    const header = page.locator('header').first();
    const main = page.locator('main').first();

    const headerBox = await header.boundingBox();
    const mainBox = await main.boundingBox();

    expect(headerBox).not.toBeNull();
    expect(mainBox).not.toBeNull();

    // Header bottom edge should be at or above main top edge
    expect(headerBox!.y + headerBox!.height).toBeLessThanOrEqual(mainBox!.y + 2);
  });

  test('WATERWORKS SCADA TRAINER title is visible and not clipped', async ({ page }) => {
    await waitForLive(page, '/');

    const title = page.getByText('WATERWORKS SCADA TRAINER');
    await expect(title).toBeVisible();
    await assertNotClipped(page, title, 'navbar title');
  });

  test('LIVE indicator is visible and not clipped in header', async ({ page }) => {
    await waitForLive(page, '/');

    const liveIndicator = page.getByText('LIVE', { exact: true });
    await expect(liveIndicator).toBeVisible();
    await assertNotClipped(page, liveIndicator, 'LIVE indicator');
  });

  test('sim speed buttons are visible and not clipped', async ({ page }) => {
    await waitForLive(page, '/');

    for (const speed of ['1x', '5x', '10x']) {
      const btn = page.getByRole('button', { name: speed });
      await expect(btn).toBeVisible();
      await assertNotClipped(page, btn, `${speed} speed button`);
    }
  });
});
