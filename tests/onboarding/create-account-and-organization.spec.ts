import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { MailTmInbox } from '../../pages/mailtm.inbox';
import { OrganizationPage } from '../../pages/organization.page';
import { RegistrationPage } from '../../pages/registration.page';

const registrationPassword = process.env.PERCEPT_REGISTRATION_PASSWORD ?? 'Cloud1234!';

test.setTimeout(240_000);

async function registerVerifiedAccount(page: Page): Promise<{ email: string; cloudPage: Page }> {
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

  return { email, cloudPage };
}

test.describe('onboarding smoke flow', () => {
  test.describe.configure({ mode: 'serial' });

  let context: BrowserContext;
  let page: Page;
  let cloudPage: Page;
  let email: string;

  test.beforeAll(async ({ browser, baseURL }) => {
    context = await browser.newContext({ baseURL });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('new user can create and verify an account', async () => {
    ({ email, cloudPage } = await registerVerifiedAccount(page));
    await expect(cloudPage.getByRole('heading', { name: 'Organization Picker' })).toBeVisible();
    await expect(cloudPage.getByText('No Organizations')).toBeVisible();
  });

  test('verified user can create an organization', async () => {
    const runId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const organizationName = `Automation Org ${runId}`;

    await test.step('Fill organization details and submit', async () => {
      const organizationPage = new OrganizationPage(cloudPage);
      await organizationPage.create(organizationName, email, Math.floor(Math.random() * 3));
      await expect(cloudPage.getByText('Review your information before submitting')).toBeVisible({ timeout: 30_000 });
      await expect(cloudPage.getByText(organizationName, { exact: true })).toBeVisible();
      await expect(cloudPage.getByText(email, { exact: true })).toBeVisible();
      await cloudPage.getByRole('button', { name: 'Submit', exact: true }).click();
      await expect(cloudPage).toHaveURL(/\/devices/, { timeout: 60_000 });
      await expect(cloudPage.getByRole('navigation').getByRole('link', { name: organizationName })).toBeVisible();
    });
  });

  test('organization owner can invite and remove an administrator', async () => {
    const inviteEmail = 'yukemmodiprou-5959@yopmail.com';

    await test.step('Open the organization users page', async () => {
      await cloudPage.getByRole('navigation').getByText('Settings', { exact: true }).click();
      await cloudPage.getByRole('link', { name: 'Users', exact: true }).click();
      await expect(cloudPage).toHaveURL(/\/settings\/users/);
    });

    await test.step('Verify and invite the administrator', async () => {
      await cloudPage.getByRole('button', { name: 'Invite new user' }).click();
      await cloudPage.getByRole('textbox', { name: /Email/ }).fill(inviteEmail);
      await cloudPage.getByRole('button', { name: 'Verify User' }).click();
      await expect(cloudPage.getByText(inviteEmail, { exact: true })).toBeVisible();
      await cloudPage.getByRole('combobox', { name: /Role/ }).click();
      await cloudPage.getByRole('option', { name: 'Administrator' }).click();
      await cloudPage.getByRole('button', { name: 'Invite User', exact: true }).click();
      const invitationDialog = cloudPage.getByRole('dialog', { name: 'Invite New User' });
      await expect(invitationDialog.getByText('Invitation sent to')).toBeVisible();
      await expect(invitationDialog.getByText(inviteEmail, { exact: true })).toBeVisible();
      await invitationDialog.getByText('Close', { exact: true }).click();
      await expect(invitationDialog).toBeHidden();
    });

    await test.step('Remove the invited administrator', async () => {
      const invitedUser = cloudPage.getByRole('row').filter({ hasText: inviteEmail });
      await expect(invitedUser).toBeVisible();
      await invitedUser.getByRole('link').click();
      await expect(cloudPage).toHaveURL(/\/settings\/users\/[^/]+\/details/);
      await cloudPage.getByRole('button', { name: 'Remove User' }).click();
      const removalDialog = cloudPage.getByRole('dialog', { name: 'Remove User' });
      await expect(removalDialog.getByText(inviteEmail, { exact: true })).toBeVisible();
      await removalDialog.getByRole('button', { name: 'Remove', exact: true }).click();
      await expect(cloudPage).toHaveURL(/\/settings\/users\/?$/);
      await expect(cloudPage.getByRole('table').getByRole('row').filter({ hasText: inviteEmail })).toHaveCount(0);
    });
  });
});
