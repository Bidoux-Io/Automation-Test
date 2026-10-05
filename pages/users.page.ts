import { expect, type Page } from '@playwright/test';

export class UsersPage {
  private usersUrl = '';

  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.getByRole('navigation').getByText('Settings', { exact: true }).click();
    await this.page.getByRole('link', { name: 'Users', exact: true }).click();
    await expect(this.page).toHaveURL(/\/settings\/users\/?$/);
    this.usersUrl = this.page.url();
    await this.waitUntilLoaded();
  }

  private async waitUntilLoaded(): Promise<void> {
    await expect(this.page.getByRole('button', { name: 'Refresh', exact: true }),
      'Wait for the Users page to finish refreshing.').toBeEnabled({ timeout: 60_000 });
    const memberRows = this.page.getByRole('table').getByRole('row').filter({
      has: this.page.getByRole('link'),
    });
    await expect(memberRows.first(), 'Wait for organization members to finish loading.').toBeVisible({ timeout: 60_000 });
    await expect(this.page.getByRole('button', { name: 'Invite new user' })).toBeEnabled();
  }

  userRow(email: string) {
    return this.page.getByRole('table').getByRole('row').filter({
      has: this.page.getByText(email, { exact: true }),
    });
  }

  async inviteAdministrator(email: string): Promise<void> {
    await this.waitUntilLoaded();
    await this.page.getByRole('button', { name: 'Invite new user' }).click({ timeout: 15_000 });
    const dialog = this.page.getByRole('dialog', { name: 'Invite New User' });
    await expect(dialog, 'The invitation dialog must open after clicking Invite new user.').toBeVisible({ timeout: 15_000 });
    await this.page.getByRole('textbox', { name: /Email/ }).fill(email);
    await this.page.getByRole('button', { name: 'Verify User' }).click();
    await expect(this.page.getByText(email, { exact: true })).toBeVisible();
    const role = this.page.getByRole('dialog', { name: 'Invite New User' }).getByRole('combobox', { name: /Role/ });
    await role.fill('Administrator');
    const administrator = this.page.getByRole('option', { name: 'Administrator', exact: true });
    await expect(administrator, 'The role dropdown must offer Administrator.').toBeVisible({ timeout: 15_000 });
    await administrator.click();
    await expect(role).toHaveValue('Administrator');
    await this.page.getByRole('button', { name: 'Invite User', exact: true }).click();
    await expect(dialog.getByText('Invitation sent to')).toBeVisible();
    await expect(dialog.getByText(email, { exact: true })).toBeVisible();
    await dialog.getByText('Close', { exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(this.userRow(email)).toBeVisible();
  }

  async remove(email: string): Promise<void> {
    await this.userRow(email).getByRole('link').click();
    await expect(this.page).toHaveURL(/\/settings\/users\/[^/]+\/details/);
    await this.page.getByRole('button', { name: 'Remove User' }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Remove User' });
    await expect(dialog.getByText(email, { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(this.page).toHaveURL(/\/settings\/users\/?$/);
    await this.waitUntilLoaded();
    await expect(this.userRow(email)).toHaveCount(0);
  }

  async removeIfPresent(email: string): Promise<void> {
    await this.page.goto(this.usersUrl);
    await this.waitUntilLoaded();
    if (await this.userRow(email).count()) {
      await this.remove(email);
    }
  }
}