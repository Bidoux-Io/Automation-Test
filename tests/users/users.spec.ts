import { expect, test } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';

test('can open users in the existing organization', async ({ page }) => {
  await page.goto('/');
  await new LoginPage(page).selectOrganization(process.env.PERCEPT_ORGANIZATION_NAME ?? 'AutomatedOrg');
  await expect(page).toHaveURL(/\/devices/);
  await page.getByRole('navigation').getByText('Settings', { exact: true }).click();
  await page.getByRole('link', { name: 'Users', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/users/);
  await expect(page.getByRole('button', { name: 'Invite new user' })).toBeVisible();
});