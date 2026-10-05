import { OrganizationPage } from '../pages/organization.page';
import { UsersPage } from '../pages/users.page';
import { expect, test } from './fixtures/account.fixture';
import { recordSmokeAccount } from './onboarding/account-register';

test.setTimeout(240_000);

test('Run full smoke test', async ({ verifiedAccount, devices }) => {
  const { cloudPage, email, accountRecord } = verifiedAccount;
  await test.step('Verify the new account starts without organizations', async () => {
    await expect(cloudPage.getByRole('heading', { name: 'Organization Picker' })).toBeVisible();
    await expect(cloudPage.getByText('No Organizations')).toBeVisible();
  });

  await test.step('Create an organization', async () => {
    const runId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const organizationName = `Automation Org ${runId}`;

    await test.step('Fill and review organization details', async () => {
      await new OrganizationPage(cloudPage).create(organizationName, email, Math.floor(Math.random() * 3));
      await expect(cloudPage.getByText('Review your information before submitting')).toBeVisible({ timeout: 30_000 });
      await expect(cloudPage.getByText(organizationName, { exact: true })).toBeVisible();
      await expect(cloudPage.getByText(email, { exact: true })).toBeVisible();
    });

    await test.step('Submit organization and open Devices', async () => {
      await cloudPage.getByRole('button', { name: 'Submit', exact: true }).click();
      await expect(cloudPage).toHaveURL(/\/devices/, { timeout: 60_000 });
      accountRecord.organization = organizationName;
      accountRecord.status = 'organization created';
      await recordSmokeAccount(accountRecord, test.info());
      await expect(cloudPage.getByRole('navigation').getByRole('link', { name: organizationName })).toBeVisible();
    });
  });

  const deviceMac = process.env.PERCEPT_DEVICE_MAC?.trim() ?? '';
  const devicePin = process.env.PERCEPT_DEVICE_PIN?.trim() ?? '';
  if (deviceMac && devicePin) {
    await test.step('Add, open, and delete a device', async () => {
      const displayName = `Automation Device ${Date.now()}`;
      await test.step('Add a device from Devices Overview', () => devices.add(displayName, deviceMac, devicePin));
      await test.step('Open the added device page', () => devices.open(displayName));
      await test.step('Delete the added device before continuing to Users', () => devices.removeIfPresent());
    });
  } else {
    test.info().annotations.push({
      type: 'Device addition omitted',
      description: 'Set PERCEPT_DEVICE_MAC and PERCEPT_DEVICE_PIN to include the device step.',
    });
  }

  await test.step('Invite and remove an administrator', async () => {
    const inviteEmail = 'yukemmodiprou-5959@yopmail.com';
    const users = new UsersPage(cloudPage);
    await test.step('Open the organization users page', () => users.open());
    await test.step('Verify and invite the administrator', () => users.inviteAdministrator(inviteEmail));
    await test.step('Remove the invited administrator', () => users.remove(inviteEmail));
  });
});