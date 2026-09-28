import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Reporter } from '@playwright/test/reporter';

let reportServer: ChildProcess | undefined;

export default class OpenUiReport implements Reporter {
  async onExit(): Promise<void> {
    const reportPath = resolve('playwright-report');
    if (!existsSync(resolve(reportPath, 'index.html'))) return;

    reportServer?.kill();
    const playwrightCli = resolve(dirname(require.resolve('playwright/package.json')), 'cli.js');
    reportServer = spawn(process.execPath, [playwrightCli, 'show-report', reportPath], {
      stdio: 'ignore',
      windowsHide: true,
    });
    reportServer.on('error', (error) => console.error('Could not open the HTML report:', error));
    reportServer.unref();
  }
}

process.once('exit', () => reportServer?.kill());