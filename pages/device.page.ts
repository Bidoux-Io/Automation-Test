import { expect, type Page } from '@playwright/test';

export class DevicePage {
  private addedDevice?: { displayName: string; mac: string; overviewUrl: string };

  constructor(private readonly page: Page) {}

  async add(displayName: string, mac: string, pin: string): Promise<void> {
    this.addedDevice = { displayName, mac, overviewUrl: this.page.url() };
    await this.page.getByRole('button', { name: 'Add', exact: true }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Add Devices' });
    await dialog.getByLabel('Display Name').fill(displayName);
    await dialog.getByLabel('Mac Address').fill(mac);
    await dialog.getByLabel('Device PIN').fill(pin);
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    const addDevices = dialog.getByRole('button', { name: 'Add 1 device' });
    await expect(addDevices).toBeEnabled();
    await addDevices.click();
    await expect(dialog.getByText('The following devices were successfully added:')).toBeVisible({ timeout: 60_000 });
    await expect(dialog.getByText(mac, { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  }

  async open(displayName: string): Promise<void> {
    const deviceLink = this.page.getByRole('table').getByRole('link', { name: displayName });
    await expect(deviceLink).toBeVisible({ timeout: 60_000 });
    await deviceLink.click();
    await expect(this.page).toHaveURL(/\/devices\/[^/]+(?:\/.*)?$/, { timeout: 30_000 });
  }

  async remove(displayName: string, mac: string): Promise<void> {
    await this.open(displayName);
    await expect(this.page.getByRole('heading', { name: displayName, exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(this.page.getByText(mac, { exact: true })).toBeVisible({ timeout: 30_000 });
    await this.page.getByRole('tab', { name: 'Settings', exact: true }).click();
    await this.page.getByRole('button', { name: 'Delete Device', exact: true }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Delete Device', exact: true });
    await dialog.getByRole('button', { name: 'Next', exact: true }).click();
    const factoryReset = dialog.getByRole('switch', { name: 'Enable Reset Device To Factory Settings', exact: true });
    await factoryReset.uncheck();
    await expect(factoryReset).not.toBeChecked();
    await dialog.getByRole('button', { name: 'Next', exact: true }).click();
    const settingsUnchanged = dialog.getByRole('alert', { name: "The device's settings will remain unchanged", exact: true });
    const deviceOffline = dialog.getByRole('alert', { name: 'Device Offline', exact: true });
    await expect(settingsUnchanged.or(deviceOffline)).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(dialog).toBeHidden({ timeout: 30_000 });
    await expect(this.page).toHaveURL(/\/devices\/?$/, { timeout: 30_000 });
    await expect(this.page.getByRole('button', { name: 'Refresh', exact: true })).toBeEnabled({ timeout: 60_000 });
    await expect(this.page.getByRole('table').getByRole('link', { name: displayName, exact: true })).toHaveCount(0);
  }

  async removeIfPresent(): Promise<void> {
    if (!this.addedDevice) {
      return;
    }
    const { displayName, mac, overviewUrl } = this.addedDevice;
    await this.page.goto(overviewUrl);
    await expect(this.page.getByRole('button', { name: 'Refresh', exact: true })).toBeEnabled({ timeout: 60_000 });
    const deviceLink = this.page.getByRole('table').getByRole('link', { name: displayName, exact: true });
    if (await deviceLink.count()) {
      await this.remove(displayName, mac);
    }
    this.addedDevice = undefined;
  }
}