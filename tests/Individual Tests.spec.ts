import { OrganizationPage } from '../pages/organization.page';
import { expect, test as accountTest } from './fixtures/account.fixture';
import { authenticatedTest, deviceTest, userTest } from './fixtures/organization.fixture';
import { recordSmokeAccount } from './onboarding/account-register';

accountTest('Create and verify an account', async ({ verifiedAccount }) => {
  await expect(verifiedAccount.cloudPage.getByRole('heading', { name: 'Organization Picker' })).toBeVisible();
  await expect(verifiedAccount.cloudPage.getByText('No Organizations')).toBeVisible();
});

authenticatedTest('Create an organization', async ({ page, baseURL }, testInfo) => {
  const email = process.env.PERCEPT_USERNAME?.trim();
  const password = process.env.PERCEPT_PASSWORD;
  if (!email || !password) {
    throw new Error('Set PERCEPT_USERNAME and PERCEPT_PASSWORD for the organization owner.');
  }
  const createdAt = new Date().toISOString();
  const organizationName = `Automation Org ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  await authenticatedTest.step('Fill and review organization details', async () => {
    await new OrganizationPage(page).create(organizationName, email, Math.floor(Math.random() * 3));
    await expect(page.getByText('Review your information before submitting')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(organizationName, { exact: true })).toBeVisible();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
  });
  await authenticatedTest.step('Submit the organization and confirm Devices opens', async () => {
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page).toHaveURL(/\/devices/, { timeout: 60_000 });
    await recordSmokeAccount({ createdAt, environment: baseURL ?? '', email, password, organization: organizationName, status: 'organization created' }, testInfo);
    await expect(page.getByRole('navigation').getByRole('link', { name: organizationName })).toBeVisible();
  });
});

deviceTest('Add, open, and delete a device', async ({ devices }) => {
  const mac = process.env.PERCEPT_DEVICE_MAC?.trim() ?? '';
  const pin = process.env.PERCEPT_DEVICE_PIN?.trim() ?? '';
  deviceTest.skip(!mac || !pin, 'Set PERCEPT_DEVICE_MAC and PERCEPT_DEVICE_PIN to an unassigned QA device.');
  const displayName = `Automation Device ${Date.now()}`;
  await deviceTest.step('Add the device to the configured organization', () => devices.add(displayName, mac, pin));
  await deviceTest.step('Open the added device page', () => devices.open(displayName));
});

userTest('Invite and remove an administrator', async ({ users, inviteeEmail }) => {
  await userTest.step('Invite an administrator and verify the assigned role', async () => {
    await users.inviteAdministrator(inviteeEmail);
    await expect(users.userRow(inviteeEmail)).toContainText('Administrator');
  });
  await userTest.step('Remove the administrator and verify it is absent from Users', async () => {
    await users.remove(inviteeEmail);
    await expect(users.userRow(inviteeEmail)).toHaveCount(0);
  });
});