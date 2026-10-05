import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async signIn(email: string, password: string): Promise<void> {
    await this.page.goto('/');
    const picker = this.page.getByRole('heading', { name: 'Organization Picker' });
    const emailInput = this.page.getByRole('textbox', { name: 'Email', exact: true });
    await expect(picker.or(emailInput)).toBeVisible({ timeout: 60_000 });
    if (await picker.isVisible()) {
      return;
    }
    await emailInput.fill(email);
    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
    const passwordInput = this.page.getByRole('textbox', { name: 'Password', exact: true });
    await expect(picker.or(passwordInput)).toBeVisible({ timeout: 60_000 });
    if (await picker.isVisible()) {
      return;
    }
    await passwordInput.fill(password);
    await this.page.getByRole('button', { name: /^(Sign in|Log in|Login)$/i }).click();
    await expect(picker).toBeVisible({ timeout: 60_000 });
  }
}