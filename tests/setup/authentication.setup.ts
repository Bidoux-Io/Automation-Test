import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test as setup } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';

setup('sign in with the reusable QA account', async ({ page }) => {
  const email = process.env.PERCEPT_USERNAME?.trim();
  const password = process.env.PERCEPT_PASSWORD;
  if (!email || !password) {
    throw new Error('Set PERCEPT_USERNAME and PERCEPT_PASSWORD in your local .env for independent tests.');
  }

  await new LoginPage(page).signIn(email, password);
  const statePath = resolve(__dirname, '../../playwright/.auth/qa-user.json');
  await mkdir(dirname(statePath), { recursive: true });
  await page.context().storageState({ path: statePath });
});