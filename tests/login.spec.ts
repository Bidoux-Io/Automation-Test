// Import Playwright's test runner and assertion library.
import { test, expect } from '@playwright/test';
// Import the page object that contains the Percept Cloud login actions.
import { LoginPage } from '../pages/login.page';

// Read credentials from the terminal so personal account details are not stored in code.
const username = process.env.PERCEPT_USERNAME;
const password = process.env.PERCEPT_PASSWORD;
// This is test data, not a credential: it tells the login flow which organization to enter.
const organizationName = 'AutomatedOrg';

// Stop before opening the browser if either required credential is missing.
if (!username || !password) {
  throw new Error('PERCEPT_USERNAME and PERCEPT_PASSWORD must be set before running the test.');
}

// Group the first Percept Cloud login test under a readable description.
test('user can log in and see the Devices page', async ({ page }) => {
  // Create the login page object using the browser page provided by Playwright.
  const loginPage = new LoginPage(page);
  // Open the QA environment configured as baseURL in playwright.config.ts.
  await page.goto('/');
  // Perform the email, password, sign-in, and organization-selection steps.
  await loginPage.login(username, password, organizationName);
  // Verify that the Devices navigation item is visible after successful login.
  await expect(page.getByText('Devices', { exact: true })).toBeVisible();
  // Verify that the application URL identifies the Devices area after organization selection.
  await expect(page).toHaveURL(/\/devices/);
});
