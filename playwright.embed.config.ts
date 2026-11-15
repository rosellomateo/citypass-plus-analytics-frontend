import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
    launchOptions: process.env.EMBED_CHROMIUM_PATH
      ? { executablePath: process.env.EMBED_CHROMIUM_PATH }
      : {},
  },
});
