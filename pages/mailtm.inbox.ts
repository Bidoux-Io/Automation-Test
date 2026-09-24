import { randomBytes } from 'node:crypto';
import { Page } from '@playwright/test';

const apiUrl = 'https://api.mail.tm';

export class MailTmInbox {
  private address = '';
  private token = '';

  constructor(private readonly page: Page) {}

  async createMailbox(): Promise<string> {
    const domainsResponse = await this.page.request.get(`${apiUrl}/domains`);
    if (!domainsResponse.ok()) {
      throw new Error(`mail.tm domain lookup failed: ${domainsResponse.status()}`);
    }
    const domains = await domainsResponse.json() as {
      'hydra:member': { domain: string; isActive: boolean; isPrivate: boolean }[];
    };
    const domain = domains['hydra:member'].find((entry) => entry.isActive && !entry.isPrivate)?.domain;
    if (!domain) {
      throw new Error('mail.tm has no available public email domain.');
    }

    this.address = `at${randomBytes(8).toString('hex')}@${domain}`;
    const password = randomBytes(24).toString('hex');
    const accountResponse = await this.page.request.post(`${apiUrl}/accounts`, {
      data: { address: this.address, password },
    });
    if (!accountResponse.ok()) {
      throw new Error(`mail.tm mailbox creation failed: ${accountResponse.status()} ${await accountResponse.text()}`);
    }
    const tokenResponse = await this.page.request.post(`${apiUrl}/token`, {
      data: { address: this.address, password },
    });
    if (!tokenResponse.ok()) {
      throw new Error(`mail.tm mailbox login failed: ${tokenResponse.status()}`);
    }
    this.token = (await tokenResponse.json() as { token: string }).token;
    return this.address;
  }

  async confirmAccount(): Promise<Page> {
    if (!this.address || !this.token) {
      throw new Error('Create the mail.tm mailbox before waiting for verification.');
    }
    const headers = { Authorization: `Bearer ${this.token}` };
    const deadline = Date.now() + 180_000;

    while (Date.now() < deadline) {
      const inboxResponse = await this.page.request.get(`${apiUrl}/messages`, { headers });
      if (!inboxResponse.ok()) {
        throw new Error(`mail.tm inbox lookup failed: ${inboxResponse.status()}`);
      }
      const inbox = await inboxResponse.json() as {
        'hydra:member': { id: string; subject: string }[];
      };
      const verification = inbox['hydra:member'].find((message) => /verify email/i.test(message.subject));
      if (verification) {
        const messageResponse = await this.page.request.get(`${apiUrl}/messages/${verification.id}`, { headers });
        if (!messageResponse.ok()) {
          throw new Error(`mail.tm message lookup failed: ${messageResponse.status()}`);
        }
        const message = await messageResponse.json() as { html?: string[] };
        const confirmUrl = await this.page.evaluate((html) => {
          const document = new DOMParser().parseFromString(html.join('\n'), 'text/html');
          return Array.from(document.querySelectorAll('a'))
            .find((link) => /^confirm$/i.test(link.textContent?.trim() ?? ''))?.getAttribute('href');
        }, message.html ?? []);
        if (!confirmUrl) {
          throw new Error(`The verification email for ${this.address} has no CONFIRM link.`);
        }

        const cloudPage = await this.page.context().newPage();
        await cloudPage.goto(confirmUrl);
        await cloudPage.getByText('Create New Organization', { exact: true }).waitFor({ timeout: 20_000 });
        return cloudPage;
      }
      await this.page.waitForTimeout(3_000);
    }

    throw new Error(`The mail.tm verification email did not arrive for ${this.address} within 3 minutes.`);
  }
}