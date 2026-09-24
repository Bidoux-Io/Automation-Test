import { expect, test } from '@playwright/test';
import { MailTmInbox } from '../../pages/mailtm.inbox';
import { OrganizationPage } from '../../pages/organization.page';
import { RegistrationPage } from '../../pages/registration.page';

const registrationPassword = process.env.PERCEPT_REGISTRATION_PASSWORD ?? 'Cloud1234!';

test.setTimeout(240_000);

test('new user can create an organization', async ({ page }) => {
  const runId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const organizationName = `Automation Org ${runId}`;
  let email = '';

  const inbox = new MailTmInbox(page);
  await test.step('Create a temporary test mailbox', async () => {
    email = await inbox.createMailbox();
  });

  const registrationPage = new RegistrationPage(page);
  await test.step('Register a new account', async () => {
    await registrationPage.open(email);
    await registrationPage.register(email, registrationPassword);
  });

  const cloudPage = await test.step('Confirm the account through the test inbox', async () => {
    return await inbox.confirmAccount();
  });

  await test.step('Fill organization details and submit', async () => {
    const organizationPage = new OrganizationPage(cloudPage);
    await organizationPage.create(organizationName, email, Math.floor(Math.random() * 3));
    await expect(cloudPage.getByText('Review your information before submitting')).toBeVisible();
    await expect(cloudPage.getByText(organizationName, { exact: true })).toBeVisible();
    await expect(cloudPage.getByText(email, { exact: true })).toBeVisible();
    await cloudPage.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(cloudPage).toHaveURL(/\/devices/, { timeout: 60_000 });
    await expect(cloudPage.getByRole('navigation').getByRole('link', { name: organizationName })).toBeVisible();
  });
});
