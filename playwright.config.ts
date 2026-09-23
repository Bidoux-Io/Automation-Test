// Load local test settings from .env before Playwright reads the configuration.
import 'dotenv/config';
// Import Playwright's configuration type so this file gets TypeScript checking.
import { defineConfig, devices } from '@playwright/test';

// Export the project-wide Playwright settings used by every test.
export default defineConfig({
  // Store test files in the tests folder.
  testDir: './tests',
  // Run tests in one worker while learning so browser behavior is easier to follow.
  workers: 1,
  // Keep the browser open and visible by default for this learning project.
  use: {
    // Start every test at the Percept Cloud QA environment.
    baseURL: process.env.PERCEPT_BASE_URL ?? 'https://qa.east-us.perceptcloud.net',
    // Run Chromium in headed mode unless a command-line option overrides it.
    headless: false,
    // Capture a trace only when a test retries, which helps investigate failures.
    trace: 'on-first-retry',
    // Use the installed desktop Chromium browser settings.
    ...devices['Desktop Chrome'],
  },
  // Show the HTML report after the test run completes.
  reporter: 'html',
});
