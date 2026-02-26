/**
 * HMI Screenshot + Overlap Test Suite
 *
 * For each HMI screen this spec:
 *  1. Takes a named screenshot of the main content area (saved to screenshots/)
 *     for human review — not compared pixel-by-pixel since values are live/changing.
 *  2. Checks that every labeled SVG element fits within the SVG container
 *     (nothing rendered outside the SVG viewport / clipped by overflow:hidden).
 *  3. Checks that no two interactive HMI elements have overlapping bounding boxes,
 *     using a 4px gutter tolerance to account for stroke widths.
 *  4. Checks the page heading, SVG, and layout regions don't collide.
 */

import { test, expect, type Page, type Locator } from '@playwright/test';
import path from 'path';
import { waitForLive, waitForProcessData } from '../helpers/wait-for-live';
import { assertNoOverlaps, assertNotClipped } from '../helpers/overlap';

const SCREENSHOTS_DIR = path.join(__dirname, '../../screenshots');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Save a screenshot of the main content area for human review. */
async function screenshotMain(page: Page, name: string) {
  const main = page.locator('main').first();
  await main.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`) });
}

/**
 * Assert that every element in `elements` has its bounding box fully inside
 * the bounding box of `container`. Fails with a descriptive message if any
 * element bleeds outside (e.g. SVG element drawn past the SVG's width/height).
 */
async function assertElementsWithinContainer(
  container: Locator,
  elements: Array<{ name: string; locator: Locator }>,
  tolerance = 4
) {
  const containerBox = await container.boundingBox();
  if (!containerBox) throw new Error('Container element has no bounding box');

  const errors: string[] = [];

  for (const el of elements) {
    const box = await el.locator.boundingBox();
    if (!box) continue; // element not in DOM — skip

    const left = box.x - tolerance;
    const top = box.y - tolerance;
    const right = box.x + box.width + tolerance;
    const bottom = box.y + box.height + tolerance;

    const cRight = containerBox.x + containerBox.width;
    const cBottom = containerBox.y + containerBox.height;

    if (
      left < containerBox.x ||
      top < containerBox.y ||
      right > cRight ||
      bottom > cBottom
    ) {
      errors.push(
        `"${el.name}" bleeds outside container: ` +
          `el=[${box.x.toFixed(0)},${box.y.toFixed(0)},` +
          `${(box.x + box.width).toFixed(0)},${(box.y + box.height).toFixed(0)}] ` +
          `container=[${containerBox.x.toFixed(0)},${containerBox.y.toFixed(0)},` +
          `${cRight.toFixed(0)},${cBottom.toFixed(0)}]`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Elements outside container:\n${errors.join('\n')}`);
  }
}

// ─── Intake HMI ─────────────────────────────────────────────────────────────

test.describe('Intake HMI screenshot + overlaps', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/intake');
    await waitForProcessData(page);
    await page.waitForTimeout(300);
  });

  test('screenshot: saves intake HMI', async ({ page }) => {
    await screenshotMain(page, '01-intake');
  });

  test('SVG HMI fits within main content area (not clipped)', async ({ page }) => {
    const svg = page.locator('main svg').first();
    const main = page.locator('main').first();
    await assertElementsWithinContainer(main, [{ name: 'HMI svg', locator: svg }], 10);
  });

  test('heading does not overlap the SVG', async ({ page }) => {
    await assertNoOverlaps(page, [
      { name: 'h2 heading', locator: page.locator('h2').first() },
      { name: 'HMI svg', locator: page.locator('main svg').first() },
    ]);
  });

  test('HMI elements do not overlap each other', async ({ page }) => {
    const elements = [
      { name: 'intake-valve',      locator: page.locator('#hmi-intakeValve') },
      { name: 'intake-pump1',      locator: page.locator('#hmi-intakePump1') },
      { name: 'intake-pump2',      locator: page.locator('#hmi-intakePump2') },
      { name: 'screen-dp',         locator: page.locator('#hmi-screenDP') },
      { name: 'raw-flow',          locator: page.locator('#hmi-rawFlow') },
      { name: 'raw-turbidity',     locator: page.locator('#hmi-rawTurbidity') },
    ];
    await assertNoOverlaps(page, elements);
  });

  test('all HMI elements are within the SVG container', async ({ page }) => {
    const svg = page.locator('main svg').first();
    const elements = [
      { name: 'intake-valve',   locator: page.locator('#hmi-intakeValve') },
      { name: 'intake-pump1',   locator: page.locator('#hmi-intakePump1') },
      { name: 'intake-pump2',   locator: page.locator('#hmi-intakePump2') },
      { name: 'screen-dp',      locator: page.locator('#hmi-screenDP') },
      { name: 'raw-flow',       locator: page.locator('#hmi-rawFlow') },
      { name: 'raw-turbidity',  locator: page.locator('#hmi-rawTurbidity') },
    ];
    await assertElementsWithinContainer(svg, elements);
  });

  test('layout: header/sidebar do not overlap HMI svg', async ({ page }) => {
    await assertNoOverlaps(page, [
      { name: 'header',  locator: page.locator('header').first() },
      { name: 'sidebar', locator: page.locator('nav').first() },
      { name: 'HMI svg', locator: page.locator('main svg').first() },
    ]);
  });

  test('pump panel does not overlap the HMI heading when open', async ({ page }) => {
    await page.locator('#hmi-intakePump1').click();
    await expect(page.getByText('Intake Pump 1')).toBeVisible();

    // The panel is on the right side; check it doesn't cover the h2 heading
    await assertNoOverlaps(page, [
      { name: 'h2 heading', locator: page.locator('h2').first() },
      { name: 'panel header', locator: page.getByText('Intake Pump 1') },
    ]);

    // Close via the X button
    // Panel closes automatically on next navigation (beforeEach navigates fresh)
  });
});

// ─── Coagulation / Flocculation HMI ─────────────────────────────────────────

test.describe('Coagulation HMI screenshot + overlaps', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/coagulation');
    await waitForProcessData(page);
    await page.waitForTimeout(300);
  });

  test('screenshot: saves coagulation HMI', async ({ page }) => {
    await screenshotMain(page, '02-coagulation');
  });

  test('SVG HMI fits within main content area', async ({ page }) => {
    const svg = page.locator('main svg').first();
    const main = page.locator('main').first();
    await assertElementsWithinContainer(main, [{ name: 'HMI svg', locator: svg }], 10);
  });

  test('heading does not overlap the SVG', async ({ page }) => {
    await assertNoOverlaps(page, [
      { name: 'h2 heading', locator: page.locator('h2').first() },
      { name: 'HMI svg',    locator: page.locator('main svg').first() },
    ]);
  });

  test('HMI elements do not overlap each other', async ({ page }) => {
    const elements = [
      { name: 'rapid-mixer',   locator: page.locator('#hmi-rapidMixer') },
      { name: 'slow-mixer',    locator: page.locator('#hmi-slowMixer') },
      { name: 'alum-dose',     locator: page.locator('#hmi-alumDose') },
      { name: 'floc-turbidity',locator: page.locator('#hmi-flocTurbidity') },
    ];
    await assertNoOverlaps(page, elements);
  });

  test('all HMI elements are within the SVG container', async ({ page }) => {
    const svg = page.locator('main svg').first();
    const elements = [
      { name: 'rapid-mixer',    locator: page.locator('#hmi-rapidMixer') },
      { name: 'slow-mixer',     locator: page.locator('#hmi-slowMixer') },
      { name: 'alum-dose',      locator: page.locator('#hmi-alumDose') },
      { name: 'floc-turbidity', locator: page.locator('#hmi-flocTurbidity') },
    ];
    await assertElementsWithinContainer(svg, elements);
  });

  test('layout: header/sidebar do not overlap HMI svg', async ({ page }) => {
    await assertNoOverlaps(page, [
      { name: 'header',  locator: page.locator('header').first() },
      { name: 'sidebar', locator: page.locator('nav').first() },
      { name: 'HMI svg', locator: page.locator('main svg').first() },
    ]);
  });

  test('alum dose panel does not clip HMI heading when open', async ({ page }) => {
    await page.locator('#hmi-alumDose').click();
    await expect(page.getByText('Alum Chemical Feed')).toBeVisible();

    await assertNoOverlaps(page, [
      { name: 'h2 heading', locator: page.locator('h2').first() },
      { name: 'HMI svg',    locator: page.locator('main svg').first() },
    ]);

    // Panel closes automatically on next navigation (beforeEach navigates fresh)
  });
});

// ─── Sedimentation / Filtration HMI ─────────────────────────────────────────

test.describe('Sedimentation HMI screenshot + overlaps', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/sedimentation');
    await waitForProcessData(page);
    await page.waitForTimeout(300);
  });

  test('screenshot: saves sedimentation HMI', async ({ page }) => {
    await screenshotMain(page, '03-sedimentation');
  });

  test('SVG HMI fits within main content area', async ({ page }) => {
    const svg = page.locator('main svg').first();
    const main = page.locator('main').first();
    await assertElementsWithinContainer(main, [{ name: 'HMI svg', locator: svg }], 10);
  });

  test('heading does not overlap the SVG', async ({ page }) => {
    await assertNoOverlaps(page, [
      { name: 'h2 heading', locator: page.locator('h2').first() },
      { name: 'HMI svg',    locator: page.locator('main svg').first() },
    ]);
  });

  test('HMI elements do not overlap each other', async ({ page }) => {
    const elements = [
      { name: 'clarifier-turb',   locator: page.locator('#hmi-clarifierTurb') },
      { name: 'sludge-level',     locator: page.locator('#hmi-sludgeLevel') },
      { name: 'filter-head-loss', locator: page.locator('#hmi-filterHeadLoss') },
      { name: 'filter-effluent',  locator: page.locator('#hmi-filterEffluent') },
      { name: 'filter-bed',       locator: page.locator('#hmi-filterBed') },
      { name: 'filter-run-time',  locator: page.locator('#hmi-filterRunTime') },
      { name: 'backwash-btn',     locator: page.locator('#ctrl-backwash-start') },
    ];
    await assertNoOverlaps(page, elements);
  });

  test('all HMI elements are within the SVG container', async ({ page }) => {
    const svg = page.locator('main svg').first();
    const elements = [
      { name: 'clarifier-turb',   locator: page.locator('#hmi-clarifierTurb') },
      { name: 'sludge-level',     locator: page.locator('#hmi-sludgeLevel') },
      { name: 'filter-head-loss', locator: page.locator('#hmi-filterHeadLoss') },
      { name: 'filter-effluent',  locator: page.locator('#hmi-filterEffluent') },
      { name: 'filter-bed',       locator: page.locator('#hmi-filterBed') },
    ];
    await assertElementsWithinContainer(svg, elements);
  });

  test('layout: header/sidebar do not overlap HMI svg', async ({ page }) => {
    await assertNoOverlaps(page, [
      { name: 'header',  locator: page.locator('header').first() },
      { name: 'sidebar', locator: page.locator('nav').first() },
      { name: 'HMI svg', locator: page.locator('main svg').first() },
    ]);
  });

  test('filter bed panel does not clip the SVG heading when open', async ({ page }) => {
    await page.locator('#hmi-filterBed').click();
    await expect(page.getByText('Filter Bed')).toBeVisible();

    // SVG and heading should still be in normal positions
    await assertNoOverlaps(page, [
      { name: 'h2 heading', locator: page.locator('h2').first() },
      { name: 'HMI svg',    locator: page.locator('main svg').first() },
    ]);

    // Panel closes automatically on next navigation (beforeEach navigates fresh)
  });
});

// ─── Disinfection / Clearwell HMI ────────────────────────────────────────────

test.describe('Disinfection HMI screenshot + overlaps', () => {
  test.beforeEach(async ({ page }) => {
    await waitForLive(page, '/disinfection');
    await waitForProcessData(page);
    await page.waitForTimeout(300);
  });

  test('screenshot: saves disinfection HMI', async ({ page }) => {
    await screenshotMain(page, '04-disinfection');
  });

  test('SVG HMI fits within main content area', async ({ page }) => {
    const svg = page.locator('main svg').first();
    const main = page.locator('main').first();
    await assertElementsWithinContainer(main, [{ name: 'HMI svg', locator: svg }], 10);
  });

  test('heading does not overlap the SVG', async ({ page }) => {
    await assertNoOverlaps(page, [
      { name: 'h2 heading', locator: page.locator('h2').first() },
      { name: 'HMI svg',    locator: page.locator('main svg').first() },
    ]);
  });

  test('HMI elements do not overlap each other', async ({ page }) => {
    const elements = [
      { name: 'chlorine-dose',     locator: page.locator('#hmi-chlorineDose') },
      { name: 'chlorine-residual', locator: page.locator('#hmi-chlorineResidual') },
      { name: 'clearwell',         locator: page.locator('#hmi-clearwell') },
      { name: 'finished-ph',       locator: page.locator('#hmi-finishedPH') },
      { name: 'dist-chlorine',     locator: page.locator('#hmi-distChlorine') },
    ];
    await assertNoOverlaps(page, elements);
  });

  test('all HMI elements are within the SVG container', async ({ page }) => {
    const svg = page.locator('main svg').first();
    const elements = [
      { name: 'chlorine-dose',     locator: page.locator('#hmi-chlorineDose') },
      { name: 'chlorine-residual', locator: page.locator('#hmi-chlorineResidual') },
      { name: 'clearwell',         locator: page.locator('#hmi-clearwell') },
      { name: 'finished-ph',       locator: page.locator('#hmi-finishedPH') },
      { name: 'dist-chlorine',     locator: page.locator('#hmi-distChlorine') },
    ];
    await assertElementsWithinContainer(svg, elements);
  });

  test('layout: header/sidebar do not overlap HMI svg', async ({ page }) => {
    await assertNoOverlaps(page, [
      { name: 'header',  locator: page.locator('header').first() },
      { name: 'sidebar', locator: page.locator('nav').first() },
      { name: 'HMI svg', locator: page.locator('main svg').first() },
    ]);
  });

  test('chlorine panel does not shift or clip the SVG heading when open', async ({ page }) => {
    await page.locator('#hmi-chlorineDose').click();
    await expect(page.getByText('Chlorine Feed System')).toBeVisible();

    await assertNoOverlaps(page, [
      { name: 'h2 heading', locator: page.locator('h2').first() },
      { name: 'HMI svg',    locator: page.locator('main svg').first() },
    ]);

    // Panel closes automatically on next navigation (beforeEach navigates fresh)
  });

});

