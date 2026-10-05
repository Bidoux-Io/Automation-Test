import { expect, test as base, type Page } from '@playwright/test';
import { DevicePage } from '../../pages/device.page';
import { MailTmInbox } from '../../pages/mailtm.inbox';
import { RegistrationPage } from '../../pages/registration.page';
import { recordSmokeAccount, type SmokeAccountRecord } from '../onboarding/account-register';

export const test = base.extend<{
  verifiedAccount: { email: string; cloudPage: Page; accountRecord: SmokeAccountRecord };
  devices: DevicePage;
}>({
  verifiedAccount: [async ({ page, baseURL }, use, testInfo) => {
    const password = process.env.PERCEPT_REGISTRATION_PASSWORD ?? 'Cloud1234!';
    const accountRecord: SmokeAccountRecord = {
      createdAt: new Date().toISOString(),
      environment: baseURL ?? '',
      email: '',
      password,
      organization: '',
      status: 'account registered',
    };
    const inbox = new MailTmInbox(page);
    const email = await base.step('Create a temporary test mailbox', () => inbox.createMailbox());
    await base.step('Register a new account', async () => {
      const registration = new RegistrationPage(page);
      await registration.open(email);
      await registration.register(email, password);
      accountRecord.email = email;
      await recordSmokeAccount(accountRecord, testInfo);
    });
    const cloudPage = await base.step('Confirm the account through the test inbox', async () => {
      const confirmedPage = await inbox.confirmAccount();
      accountRecord.status = 'email verified';
      await recordSmokeAccount(accountRecord, testInfo);
      return confirmedPage;
    });
    await use({ email, cloudPage, accountRecord });
  }, { timeout: 240_000 }],
  devices: [async ({ verifiedAccount }, use) => {
    const devices = new DevicePage(verifiedAccount.cloudPage);
    try {
      await use(devices);
    } finally {
      await base.step('Delete the test device (cleanup)', () => devices.removeIfPresent());
    }
  }, { timeout: 90_000 }],
});

export { expect };