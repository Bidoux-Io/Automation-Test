import { Page } from '@playwright/test';

export class YopmailPage {
  constructor(private readonly page: Page) {}

  async generateRandomEmail(): Promise<string> {
    await this.page.goto('https://yopmail.com/en/email-generator');
    await this.page.getByRole('heading', { name: /Your auto-generated email address/i }).waitFor();

    const pageText = await this.page.locator('main').innerText();
    const email = pageText.match(/[a-z0-9-]+@yopmail\.com/i)?.[0];
    if (!email) {
      throw new Error('Yopmail did not provide a generated email address.');
    }

    return email;
  }

  async createMailbox(email: string): Promise<void> {
    const [mailbox] = this.parseEmail(email);
    await this.openMailbox(mailbox);
    await this.checkForCaptcha();
    await this.page.locator('#ifinbox').waitFor({ state: 'attached' });
  }

  async confirmAccount(email: string): Promise<Page> {
    const [mailbox] = this.parseEmail(email);
    await this.openMailbox(mailbox);

    const deadline = Date.now() + 180_000;

    while (Date.now() < deadline) {
      await this.checkForCaptcha();
      const inbox = this.page.frameLocator('#ifinbox');
      const verificationEmail = inbox.getByText(/verify email/i).first();
      if (await verificationEmail.isVisible().catch(() => false)) {
        await verificationEmail.click();
        const message = this.page.frameLocator('#ifmail');
        const [cloudPage] = await Promise.all([
          this.page.context().waitForEvent('page'),
          message.getByRole('link', { name: /^confirm$/i }).click({ timeout: 15_000 }),
        ]);
        await cloudPage.waitForLoadState('domcontentloaded');
        await cloudPage.getByText('Create New Organization', { exact: true }).waitFor({ timeout: 20_000 });
        return cloudPage;
      }

      await this.page.locator('#refresh').click({ force: true });
      await this.page.waitForTimeout(3_000);
    }

    throw new Error(`The Yopmail verification email did not arrive for ${email} within 3 minutes.`);
  }

  private async checkForCaptcha(): Promise<void> {
    if (await this.page.getByText('Complete the CAPTCHA to continue').isVisible()) {
      throw new Error('Yopmail requires a CAPTCHA (enterprise free quota). Complete it manually and rerun the test, or use an approved test inbox service.');
    }
  }

  private parseEmail(email: string): [string, string] {
    const [mailbox, domain] = email.split('@');
    if (!mailbox || !domain) {
      throw new Error(`Invalid temporary email address: ${email}`);
    }

    return [mailbox, domain];
  }

  private async openMailbox(mailbox: string): Promise<void> {
    await this.page.goto('https://yopmail.com/en/');
    await this.page.getByRole('textbox', { name: 'Login' }).fill(mailbox);
    await this.page.locator('button[onclick*="go()"]') .click();
    await this.page.locator('#ifinbox').waitFor({ state: 'attached' });
  }
}
