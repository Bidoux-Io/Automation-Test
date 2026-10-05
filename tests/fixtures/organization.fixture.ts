import { expect, test as base } from '@playwright/test';
import { DevicePage } from '../../pages/device.page';
import { LoginPage } from '../../pages/login.page';
import { OrganizationPage } from '../../pages/organization.page';
import { UsersPage } from '../../pages/users.page';

export const authenticatedTest = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/');
    const picker = page.getByRole('heading', { name: 'Organization Picker' });
    const emailInput = page.getByRole('textbox', { name: 'Email', exact: true });
    await expect(picker.or(emailInput)).toBeVisible({ timeout: 60_000 });
    if (await emailInput.isVisible()) {
      const email = process.env.PERCEPT_USERNAME?.trim();
      const password = process.env.PERCEPT_PASSWORD;
      if (!email || !password) {
        throw new Error('Set PERCEPT_USERNAME and PERCEPT_PASSWORD to refresh an expired test session.');
      }
      await new LoginPage(page).signIn(email, password);
    }
    await expect(picker).toBeVisible();
    await use(page);
  },
});

export const test = authenticatedTest.extend({
  page: async ({ page }, use, testInfo) => {
    const organizationName = process.env.PERCEPT_ORGANIZATION_NAME?.trim()
      || testInfo.project.metadata.organizationName;
    if (!organizationName) {
      throw new Error('Set PERCEPT_ORGANIZATION_NAME in your local .env for independent organization tests.');
    }
    await new OrganizationPage(page).select(organizationName);
    await expect(page).toHaveURL(/\/devices\/?$/, { timeout: 60_000 });
    await use(page);
  },
});

export const deviceTest = test.extend<{ devices: DevicePage }>({
  devices: [async ({ page }, use) => {
    const devices = new DevicePage(page);
    try {
      await use(devices);
    } finally {
      await test.step('Delete the test device (cleanup)', () => devices.removeIfPresent());
    }
  }, { timeout: 90_000 }],
});

export const userTest = test.extend<{
  inviteeEmail: string;
  users: UsersPage;
}>({
  inviteeEmail: async ({}, use) => {
    await use(process.env.PERCEPT_INVITE_EMAIL?.trim() || 'yukemmodiprou-5959@yopmail.com');
  },
  users: [async ({ page, inviteeEmail }, use) => {
    const users = new UsersPage(page);
    await test.step('Setup: open Users and verify the test invitee is absent', async () => {
      await users.open();
      await expect(users.userRow(inviteeEmail), 'Use a test invitee who is not already in this organization.').toHaveCount(0);
    });
    try {
      await use(users);
    } finally {
      await test.step('Cleanup: remove the test invitation if it remains', () => users.removeIfPresent(inviteeEmail));
    }
  }, { timeout: 90_000 }],
});

export { expect };