import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  projects: [
    { name: 'onboarding', testMatch: '**/onboarding/*.spec.ts' },
  ],
  workers: 1,
  use: {
    baseURL: process.env.PERCEPT_BASE_URL ?? 'https://qa.east-us.perceptcloud.net',
    headless: false,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  reporter: process.argv.includes('--list') ? 'list' : [['html', { open: 'always' }]],
});
