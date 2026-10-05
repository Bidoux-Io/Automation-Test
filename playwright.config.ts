import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  projects: [
    { name: 'Full Smoke Test', testMatch: '**/Full Smoke Test.spec.ts', timeout: 240_000 },
    {
      name: 'Individual Tests',
      testMatch: '**/Individual Tests.spec.ts',
      timeout: 120_000,
      metadata: { organizationName: '\u2699\uFE0F AutomatedOrg' },
    },
  ],
  workers: 1,
  use: {
    baseURL: process.env.PERCEPT_BASE_URL ?? 'https://qa.east-us.perceptcloud.net',
    headless: false,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  reporter: process.argv.includes('--list') ? 'list' : [
    ['html', { open: 'always' }],
    ...(process.argv.includes('--ui') ? [['./reporters/open-ui-report.ts'] as [string]] : []),
  ],
});
