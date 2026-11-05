import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type { Page, APIResponse } from '@playwright/test';

const provider = process.env.MAILBOX_PROVIDER ?? 'mail.tm';
const apiUrl = (provider === 'mail.tm'
  ? process.env.MAILTM_API_URL ?? 'https://api.mail.tm'
  : 'https://api.tempmail.lol/v2').replace(/\/$/, '');

export class MailTmInbox {
  private address = '';
  private token = '';

  constructor(private readonly page: Page) {}

  private async request(operation: string, send: () => Promise<APIResponse>): Promise<APIResponse> {
    const attempts = 3;
    for (let attempt = 0; attempt < attempts; attempt++) {
      let failure: string;
      try {
        const response = await send();
        if (response.ok()) {
          return response;
        }
        const status = response.status();
        const body = await response.text();
        await response.dispose();
        failure = `HTTP ${status}${body ? `: ${body}` : ''}`;
        if (![429, 500, 502, 503, 504].includes(status)) {
          throw new Error(`${operation} failed at ${apiUrl}: ${failure}`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.startsWith(`${operation} failed at`)) {
          throw error;
        }
        failure = error instanceof Error ? error.message : String(error);
      }
      if (attempt === attempts - 1) {
        throw new Error(`${operation} failed at ${apiUrl} after ${attempts} attempts: ${failure}`);
      }
      await delay(1_000 * 2 ** attempt);
    }
    throw new Error(`${operation} failed at ${apiUrl}`);
  }

  async createMailbox(): Promise<string> {
    if (!['mail.tm', 'tempmail.lol'].includes(provider)) {
      throw new Error(`Unsupported MAILBOX_PROVIDER: ${provider}`);
    }
    if (provider === 'tempmail.lol') {
      const response = await this.request('Mailbox creation', () =>
        this.page.request.post(`${apiUrl}/inbox/create`, { data: {}, timeout: 10_000 }));
      const mailbox = await response.json() as { address: string; token: string };
      if (!mailbox.address || !mailbox.token) {
        throw new Error('The mailbox provider returned no address or inbox token.');
      }
      this.address = mailbox.address;
      this.token = mailbox.token;
      return this.address;
    }
    const domainsResponse = await this.request('Mailbox domain lookup', () =>
      this.page.request.get(`${apiUrl}/domains`, { timeout: 10_000 }));
    const domains = await domainsResponse.json() as {
      'hydra:member': { domain: string; isActive: boolean; isPrivate: boolean }[];
    };
    const domain = domains['hydra:member'].find((entry) => entry.isActive && !entry.isPrivate)?.domain;
    if (!domain) {
      throw new Error('mail.tm has no available public email domain.');
    }

    const password = randomBytes(24).toString('hex');
    await this.request('Mailbox creation', () => {
      this.address = `at${randomBytes(8).toString('hex')}@${domain}`;
      return this.page.request.post(`${apiUrl}/accounts`, {
        data: { address: this.address, password },
        timeout: 10_000,
      });
    });
    const tokenResponse = await this.request('Mailbox login', () =>
      this.page.request.post(`${apiUrl}/token`, {
        data: { address: this.address, password },
        timeout: 10_000,
      }));
    this.token = (await tokenResponse.json() as { token: string }).token;
    return this.address;
  }

  private async verificationEmail(): Promise<string[] | undefined> {
    if (provider === 'tempmail.lol') {
      const response = await this.request('Mailbox inbox lookup', () =>
        this.page.request.get(`${apiUrl}/inbox`, { params: { token: this.token }, timeout: 10_000 }));
      const inbox = await response.json() as {
        expired: boolean;
        emails: { subject: string; html?: string | string[]; body?: string }[];
      };
      const verification = inbox.emails.find((message) => /verify email/i.test(message.subject));
      if (verification) {
        const html = verification.html ?? verification.body ?? '';
        return Array.isArray(html) ? html : [html];
      }
      if (inbox.expired) {
        throw new Error('The temporary mailbox expired before the verification email arrived.');
      }
      return undefined;
    }
    const headers = { Authorization: `Bearer ${this.token}` };
    const inboxResponse = await this.request('Mailbox inbox lookup', () =>
      this.page.request.get(`${apiUrl}/messages`, { headers, timeout: 10_000 }));
    const inbox = await inboxResponse.json() as {
      'hydra:member': { id: string; subject: string }[];
    };
    const verification = inbox['hydra:member'].find((message) => /verify email/i.test(message.subject));
    if (!verification) {
      return undefined;
    }
    const messageResponse = await this.request('Mailbox message lookup', () =>
      this.page.request.get(`${apiUrl}/messages/${verification.id}`, { headers, timeout: 10_000 }));
    const message = await messageResponse.json() as { html?: string[] };
    return message.html ?? [];
  }

  async confirmAccount(): Promise<Page> {
    if (!this.address || !this.token) {
      throw new Error('Create the temporary mailbox before waiting for verification.');
    }
    const deadline = Date.now() + 180_000;

    while (Date.now() < deadline) {
      const verificationHtml = await this.verificationEmail();
      if (verificationHtml) {
        const confirmUrl = await this.page.evaluate((html) => {
          const document = new DOMParser().parseFromString(html.join('\n'), 'text/html');
          return Array.from(document.querySelectorAll('a'))
            .find((link) => /^confirm$/i.test(link.textContent?.trim() ?? ''))?.getAttribute('href');
        }, verificationHtml);
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

    throw new Error(`The ${provider} verification email did not arrive for ${this.address} within 3 minutes.`);
  }
}