import { expect, type Page } from '@playwright/test';

/**
 * Navigate to a URL and wait for the LIVE connection indicator to appear.
 * The app renders "Connecting..." until Socket.IO delivers the first state:update.
 * The server emits state immediately on connection, so LIVE typically appears in ~1s.
 */
export async function waitForLive(page: Page, url = '/') {
  await page.goto(url);
  await expect(page.getByText('LIVE', { exact: true })).toBeVisible({ timeout: 15_000 });
}

/**
 * Wait for any "Connecting" placeholder text to disappear, indicating
 * that process data has been received from the server.
 */
export async function waitForProcessData(page: Page) {
  await expect(page.getByText('Connecting', { exact: false })).not.toBeVisible({ timeout: 10_000 });
}
