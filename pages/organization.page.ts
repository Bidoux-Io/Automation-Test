import { expect, type Page } from '@playwright/test';

export class OrganizationPage {
  constructor(private readonly page: Page) {}

  async create(
    organizationName: string,
    email: string,
    residencyIndex = 0,
  ): Promise<void> {
    await this.page.getByRole('link', { name: 'Create New Organization', exact: true }).click();
    await expect(this.page).toHaveURL(/\/new-organization\/?$/, { timeout: 30_000 });
    await expect(this.page.getByLabel('Organization Name')).toBeVisible({ timeout: 30_000 });
    await this.page.getByLabel('Organization Name').fill(organizationName);

    await this.page.getByPlaceholder('Search Address...').fill('12345 Rue Jeanne-Mance Montreal, H3L 3C8, Quebec, CA');
    await this.page.getByText(/12345 Rue Jeanne-Mance/i).last().click();
    await this.page.getByLabel('First Name').fill('Automation');
    await this.page.getByLabel('Last Name').fill('Tester');
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Phone Number').fill('4501111111');

    const residency = this.page.getByRole('combobox', { name: 'Data residency region' });
    await residency.click();
    const residencyOptions = this.page.getByRole('listbox').getByRole('option');
    await expect(residencyOptions).toHaveCount(3);
    await residencyOptions.nth(residencyIndex % 3).click();

    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
  }

  async select(organizationName: string): Promise<void> {
    const escapedName = organizationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await this.page.getByRole('link', {
      name: new RegExp(`^Select .*${escapedName}$`),
    }).click();
  }
}
