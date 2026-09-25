import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

const authFile = 'playwright/.auth/user.json';

test.setTimeout(120_000);

test('sign in to the existing QA organization', async ({ page }) => {
  const username = process.env.PERCEPT_USERNAME;
  const password = process.env.PERCEPT_PASSWORD;
  const organizationName = process.env.PERCEPT_ORGANIZATION_NAME ?? 'AutomatedOrg';
  if (!username || !password) {
    throw new Error('Set PERCEPT_USERNAME and PERCEPT_PASSWORD in .env to run authenticated tests.');
  }

  await page.goto('/');
  const loginPage = new LoginPage(page);
  await loginPage.authenticate(username, password);
  if (!/\/devices/.test(page.url())) {
    await expect(page.getByRole('heading', { name: 'Organization Picker' })).toBeVisible({ timeout: 60_000 });
    await loginPage.selectOrganization(organizationName);
  }
  await expect(page).toHaveURL(/\/devices/, { timeout: 60_000 });
  await expect(page.getByRole('navigation').getByRole('link', { name: organizationName })).toBeVisible();

  await mkdir(dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});