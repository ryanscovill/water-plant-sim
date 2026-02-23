import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false, // single server, shared state
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { outputFolder: path.join(__dirname, '../screenshots/_report'), open: 'never' }], ['list']],
  outputDir: path.join(__dirname, '../screenshots/_artifacts'),
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'off',
    video: 'off',
    colorScheme: 'dark',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 10_000,
  },
  timeout: 60_000,
  webServer: [
    {
      command: 'npm run dev',
      cwd: path.join(__dirname, '../client'),
      port: 5173,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
