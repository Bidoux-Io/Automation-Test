import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { parse } from 'csv-parse/sync';
import { chromium } from 'playwright';

const csvPath = process.env.CAMERA_CSV ?? path.join(process.env.USERPROFILE ?? '.', 'Downloads', 'R&Dsetup(Camera).csv');
const gatewayUrl = process.env.GATEWAY_URL;
const profileDir = path.resolve(process.env.PLAYWRIGHT_PROFILE ?? '.playwright-profile');
const dryRun = process.env.APPLY !== '1';
const requestedIp = process.argv[2];

if (!gatewayUrl) {
  console.error('Set GATEWAY_URL to the Gateway Cameras page URL.');
  process.exit(1);
}

if (gatewayUrl.includes('...')) {
  console.error('GATEWAY_URL still contains the placeholder "...". Use the complete URL.');
  process.exit(1);
}

const csvText = await fs.readFile(csvPath, 'utf8');
const cameras = parse(csvText, { columns: true, skip_empty_lines: true, relax_quotes: true, bom: true })
  .map((camera) => Object.fromEntries(Object.entries(camera).map(([key, value]) => [key.trim(), String(value ?? '').trim()])))
  .filter((camera) => camera['R&D IPv4'] && camera.Username && camera.Password);

const selected = requestedIp ? cameras.filter((camera) => camera['R&D IPv4'] === requestedIp) : cameras;
if (!selected.length) {
  throw new Error(requestedIp ? `No CSV camera found for ${requestedIp}.` : 'No usable cameras found in the CSV.');
}

const browser = await chromium.launchPersistentContext(profileDir, { headless: false });
const page = browser.pages()[0] ?? await browser.newPage();
await page.goto(gatewayUrl, { waitUntil: 'domcontentloaded' });

const terminal = readline.createInterface({ input, output });
await terminal.question('Log in if needed, open the Gateway Cameras page, then press Enter here... ');
await terminal.close();

for (const camera of selected) {
  await addCamera(page, camera);
}

console.log('Finished. The browser remains open for review.');

async function addCamera(page, camera) {
  const ip = camera['R&D IPv4'];
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Processing ${camera.Model || ip} at ${ip}`);

  await clickFirst(page, [page.getByRole('button', { name: /^Add$/i }), page.getByText(/^Add$/i)]);
  await clickFirst(page, [page.getByRole('button', { name: /Scan For Cameras/i })]);

  const cameraCard = page.locator('text=' + ip).first();
  await cameraCard.waitFor({ state: 'visible', timeout: 30_000 });
  await cameraCard.click();
  await clickFirst(page, [page.getByRole('button', { name: /^Next$/i })]);

  await page.getByLabel(/Username/i).fill(firstLine(camera.Username));
  await page.getByLabel(/Password/i).fill(firstLine(camera.Password));
  await clickFirst(page, [page.getByRole('button', { name: /Discover Camera Profiles/i })]);

  const profile = page.locator('text=/H264|H265|MJPEG/i').first();
  await profile.waitFor({ state: 'visible', timeout: 30_000 });
  await profile.click();
  await clickFirst(page, [page.getByRole('button', { name: /^Next$/i })]);

  await page.getByLabel(/Display Name/i).fill(camera.Model || ip);
  const description = page.getByLabel(/Description/i);
  if (await description.count()) await description.fill(`${camera.Brand || 'Camera'} ${ip}`);
  await clickFirst(page, [page.getByRole('button', { name: /^Next$/i })]);

  if (dryRun) {
    console.log(`  Ready to add ${ip}; stopping before the final Add button.`);
    await clickFirst(page, [page.getByRole('button', { name: /Back|Close/i })]);
    return;
  }

  await page.getByRole('button', { name: /^Add$/i }).click();
  await page.getByText(/Camera successfully added/i).waitFor({ state: 'visible', timeout: 30_000 });
  console.log(`  Added ${ip}`);
  await clickFirst(page, [page.getByRole('button', { name: /Close/i })]);
}

async function clickFirst(page, locators) {
  for (const locator of locators) {
    if (await locator.count() && await locator.first().isVisible()) {
      await locator.first().click();
      return;
    }
  }
  throw new Error('Could not find the expected button or control.');
}

function firstLine(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? '';
}
