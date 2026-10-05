import { open } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { TestInfo } from '@playwright/test';
import { stringify } from 'csv-stringify/sync';

export interface SmokeAccountRecord {
  createdAt: string;
  environment: string;
  email: string;
  password: string;
  organization: string;
  status: 'account registered' | 'email verified' | 'organization created';
}

export async function recordSmokeAccount(record: SmokeAccountRecord, testInfo: TestInfo): Promise<void> {
  const registerPath = resolve(testInfo.config.rootDir, '..', 'smoke-accounts.csv');
  const register = await open(registerPath, 'a');
  try {
    const { size } = await register.stat();
    await register.writeFile(stringify([record], {
      header: size === 0,
      columns: ['createdAt', 'environment', 'email', 'password', 'organization', 'status'],
    }));
  } finally {
    await register.close();
  }

  await testInfo.attach(`Smoke account - ${record.status}`, {
    body: JSON.stringify(record, null, 2),
    contentType: 'application/json',
  });
}