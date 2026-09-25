# Percept Cloud Smoke Tests

This project contains Playwright smoke tests for the Percept Cloud QA environment.

## What the test does

The onboarding flow verifies a new account, creates an organization, checks that its Devices page opens, then invites and removes an administrator.

## Project structure

```text
Automation Test/
├── pages/
│   ├── mailtm.inbox.ts
│   ├── registration.page.ts
│   └── organization.page.ts
├── tests/
│   └── onboarding/
│       └── create-account-and-organization.spec.ts
├── .gitignore
├── package.json
├── playwright.config.ts
├── README.md
└── tsconfig.json
```

- `tests/onboarding/create-account-and-organization.spec.ts` contains the three ordered smoke tests.
- `pages/` contains the mailbox, registration, and organization actions.
- `playwright.config.ts` contains browser, URL, reporting, and headed-mode settings.
- `package.json` lists dependencies and commands.
- `tsconfig.json` enables TypeScript checking.
- `.gitignore` prevents dependencies, reports, results, and local secrets from being committed.

## Installation

Open a PowerShell terminal in this folder and run:

```powershell
npm install
npx playwright install chromium
```

`npm install` downloads Playwright Test, TypeScript, and Node.js type definitions. The browser installation downloads the Chromium browser that Playwright controls.

## Configure the environment

The onboarding flow needs no existing account credentials. It uses a temporary mail.tm mailbox and the registration password from `PERCEPT_REGISTRATION_PASSWORD` (or the test default). Set a password in your local `.env` if needed; do not commit it:

```powershell
$env:PERCEPT_REGISTRATION_PASSWORD = "your-test-password"
```

The QA URL is already configured. To use another environment for one terminal session, set:

```powershell
$env:PERCEPT_BASE_URL = "https://qa.east-us.perceptcloud.net"
```

## Onboarding smoke flow

The onboarding spec reports three separate, ordered tests:

1. Create a temporary mailbox through the public mail.tm API, register a new account, verify its email, and reach the empty Organization Picker.
2. Use that verified account to submit a new organization and verify its Devices screen.
3. Open Settings > Users, invite `yukemmodiprou-5959@yopmail.com` as an Administrator, then remove that user and confirm the Users list no longer contains them.

Run the entire spec together: the later tests depend on the browser session created by the first. If account creation fails, the later tests are skipped. Each run creates one real account and one real organization in QA, then invites and removes the specified user. No mailbox account or API key is required, but QA must accept the public domain returned by mail.tm; the external service may also be unavailable or rate-limited. Run the onboarding flow with:

```powershell
npm run test:onboarding
```

## Run the test

### Launch without commands

These are Playwright tests; run them through the Playwright runner, not the Python play button.

For the simplest launch, double-click `Open-Test-UI.cmd` in the project folder. To put it on your desktop, right-click the file, choose `Show more options`, then choose `Send to > Desktop (create shortcut)`.

To open the visual test runner in VS Code:

1. Press `Ctrl+Shift+P`.
2. Select `Tasks: Run Task`.
3. Select `Open Playwright Test UI`.
4. In the Playwright window, select the test and click the run button.

The task loads the local `.env` file automatically.

Run the onboarding tests in headed mode:

```powershell
npm test
```

The browser remains visible because `headless: false` is configured in `playwright.config.ts`. Both `npm test` and `npm run test:onboarding` create a new account and organization in QA.

Run with Playwright's interactive debugger:

```powershell
npm run test:debug
```

Open the HTML report after a run:

```powershell
npm run report
```

The report does not open automatically after a failed CLI run, so the command exits promptly.

## Common issues

- Run the whole onboarding spec together; the organization test uses the verified account from the first test.
- mail.tm can rate-limit requests or change its available domains; the test does not bypass CAPTCHA.
- The QA environment must accept the chosen temporary email domain.
- Install Chromium with `npx playwright install chromium` on a new machine.

## Troubleshooting

If a locator fails, run `npm run test:debug`, pause the browser, and inspect the visible label or button text. Prefer updating the locator to match the application's accessible name rather than immediately using a long CSS or XPath selector.

If the page loads slowly, inspect the failure screenshot and trace in `test-results`. Avoid adding arbitrary sleeps. Playwright automatically waits for elements to become actionable, and explicit assertions provide better diagnostics.

If organization creation fails after account verification, inspect the page screenshot and the test steps in the Playwright report.
