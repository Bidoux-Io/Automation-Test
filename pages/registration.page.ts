import { Page } from '@playwright/test';

export class RegistrationPage {
  constructor(private readonly page: Page) {}

  async open(email: string): Promise<void> {
    await this.page.goto('/');
    await this.page.getByRole('textbox', { name: 'Email' }).fill(email);
    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
    await this.page.getByRole('link', { name: 'Register' }).click();
  }

  async register(email: string, password: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Email' }).fill(email);
    await this.page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
    await this.page.getByRole('textbox', { name: 'Confirm Password' }).fill(password);
    await this.page.getByRole('textbox', { name: 'First name' }).fill('Automation');
    await this.page.getByRole('textbox', { name: 'Last name' }).fill('Tester');
    await this.page.getByRole('button', { name: 'Register', exact: true }).click();
    await this.page.getByRole('heading', { name: 'End User Licence Agreement' }).evaluate((heading) => {
      let container = heading.parentElement;
      while (container && container.scrollHeight <= container.clientHeight) {
        container = container.parentElement;
      }
      if (!container) {
        throw new Error('Could not find the scrollable EULA container');
      }
      container.scrollTop = container.scrollHeight;
    });
    await this.page.getByRole('button', { name: 'Accept', exact: true }).click();
    await this.page.waitForURL(/login-actions\/required-action\?execution=VERIFY_EMAIL/);
  }
}
