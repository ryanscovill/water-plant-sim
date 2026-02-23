import { expect, type Page, type Locator } from '@playwright/test';

interface ElementRef {
  name: string;
  locator: Locator;
}

/**
 * Check that none of the given elements overlap each other.
 * Uses a 2px tolerance to avoid false positives from shared borders.
 */
export async function assertNoOverlaps(page: Page, elements: ElementRef[]) {
  const boxes: Array<{ name: string; box: { x: number; y: number; width: number; height: number } }> = [];

  for (const el of elements) {
    const box = await el.locator.boundingBox();
    if (box) {
      boxes.push({ name: el.name, box });
    }
  }

  const TOLERANCE = 2;
  const overlaps: string[] = [];

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].box;
      const b = boxes[j].box;

      const aRight = a.x + a.width - TOLERANCE;
      const aBottom = a.y + a.height - TOLERANCE;
      const bRight = b.x + b.width - TOLERANCE;
      const bBottom = b.y + b.height - TOLERANCE;

      const overlapX = a.x + TOLERANCE < bRight && aRight > b.x + TOLERANCE;
      const overlapY = a.y + TOLERANCE < bBottom && aBottom > b.y + TOLERANCE;

      if (overlapX && overlapY) {
        overlaps.push(
          `"${boxes[i].name}" overlaps "${boxes[j].name}": ` +
            `[${a.x.toFixed(0)},${a.y.toFixed(0)},${a.width.toFixed(0)}x${a.height.toFixed(0)}] ` +
            `vs [${b.x.toFixed(0)},${b.y.toFixed(0)},${b.width.toFixed(0)}x${b.height.toFixed(0)}]`
        );
      }
    }
  }

  if (overlaps.length > 0) {
    await page.screenshot({ path: `test-results/overlap-failure-${Date.now()}.png` });
    throw new Error(`Layout overlaps detected:\n${overlaps.join('\n')}`);
  }
}

/**
 * Check that a given element is fully within the viewport (not clipped or off-screen).
 */
export async function assertNotClipped(page: Page, locator: Locator, name: string) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(`Element "${name}" has no bounding box (not visible?)`);
  }

  const viewport = page.viewportSize();
  if (!viewport) return;

  const errors: string[] = [];

  if (box.x < 0) errors.push(`left edge clipped (x=${box.x.toFixed(0)})`);
  if (box.y < 0) errors.push(`top edge clipped (y=${box.y.toFixed(0)})`);
  if (box.x + box.width > viewport.width) {
    errors.push(`right edge clipped (x+w=${(box.x + box.width).toFixed(0)}, viewport=${viewport.width})`);
  }
  if (box.y + box.height > viewport.height) {
    errors.push(`bottom edge clipped (y+h=${(box.y + box.height).toFixed(0)}, viewport=${viewport.height})`);
  }

  if (errors.length > 0) {
    throw new Error(`Element "${name}" is clipped: ${errors.join('; ')}`);
  }
}
