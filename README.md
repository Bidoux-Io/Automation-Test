# Percept Cloud Smoke Tests

This project contains Playwright smoke tests for the Percept Cloud QA environment.

## What the test does

The onboarding flow verifies a new account, creates an organization, optionally adds a QA device, then invites and removes an administrator.

## Project structure

```text
Automation Test/
├── pages/
│   ├── mailtm.inbox.ts
│   ├── registration.page.ts
│   └── organization.page.ts
├── tests/
│   ├── Full Smoke Test.spec.ts
│   ├── Individual Tests.spec.ts
│   ├── fixtures/
│   └── onboarding/
│       └── account-register.ts
├── .gitignore
├── package.json
├── playwright.config.ts
├── README.md
└── tsconfig.json
```

- `tests/Full Smoke Test.spec.ts` contains one full smoke test with named steps.
- `tests/Individual Tests.spec.ts` contains four independently runnable scenarios.
- `tests/fixtures/` shares registration, login, and organization selection between tests.
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

To include device addition in the full flow, configure an available QA device MAC address and PIN in your local `.env` (or terminal environment). Keep the PIN out of source control. The full flow omits only the device step when either value is missing:

```dotenv
PERCEPT_DEVICE_MAC=your-device-mac
PERCEPT_DEVICE_PIN=your-device-pin
```

Organization, device, and user tests sign in with an existing QA account. Configure `PERCEPT_USERNAME` and `PERCEPT_PASSWORD` in your local `.env`. User and device tests select `PERCEPT_ORGANIZATION_NAME`, defaulting to the configured AutomatedOrg organization; the organization-creation test starts at the picker instead.

The independent device test uses the same `PERCEPT_DEVICE_MAC` and `PERCEPT_DEVICE_PIN` as the full smoke flow. It skips when those values are missing. The full smoke flow deletes its device immediately after opening it, before starting the user scenario. Both tests retain fixture teardown as cleanup, including after assertions fail or the test times out, with a separate 90-second cleanup budget. Cleanup verifies the exact device name and MAC, keeps factory reset disabled, and confirms the device is absent afterward so it can be reused. A cleanup failure fails the test; forcibly closing the browser or killing the runner can prevent cleanup. Do not run these tests concurrently against the same device. Organization-creation tests leave their uniquely named organizations in QA and record the owner credentials in the CSV.

The QA URL is already configured. To use another environment for one terminal session, set:

```powershell
$env:PERCEPT_BASE_URL = "https://qa.east-us.perceptcloud.net"
```

## Onboarding smoke flow

The full smoke spec reports one test, `Run full smoke test`, containing these steps:

1. Create a temporary mailbox through the public mail.tm API, register a new account, verify its email, and reach the empty Organization Picker.
2. Use that verified account to submit a new organization and verify its Devices screen.
3. If a device MAC and PIN are configured, add the device from Devices Overview, confirm success, close the dialog, open the device page, and delete the device before proceeding to Users. Fixture teardown remains a fallback if a step fails.
4. Open Settings > Users, invite `yukemmodiprou-5959@yopmail.com` as an Administrator, then remove that user and confirm the Users list no longer contains them.

Each full-flow run creates one real account and one real organization in QA, adds the configured device when available, then invites and removes the specified user. A failing step stops the remaining flow. No mailbox account or API key is required, but QA must accept the public domain returned by mail.tm; the external service may also be unavailable or rate-limited. Run the onboarding flow with:

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
3. Select `Run Onboarding Tests and Open Report` to run the full flow, or `Open Playwright Test UI` to select individual tests. Both open an HTML report when a run finishes.

The task loads the local `.env` file automatically.

### Full And Individual Tests In The UI

`Open-Test-UI.cmd` and `npm run test:ui` open two top-level files: `Full Smoke Test.spec.ts` first, then `Individual Tests.spec.ts`. Expand a file to select a test directly; there are no scenario folders or extra describe groups. If an old project filter hides tests, clear it or select both `Full Smoke Test` and `Individual Tests`.

| Project | Selectable Tests |
| --- | --- |
| `Full Smoke Test` | Run full smoke test |
| `Individual Tests` | Create and verify an account; create an organization; add, open, and delete a device; invite and remove an administrator |

Click the run arrow beside `Run full smoke test` for the complete flow, or beside an individual test for just that scenario. Running all tests runs both modes and creates extra accounts and organizations.

Individual account tests create and verify a new account but do not create an organization. The other individual tests use the reusable QA account and do not run onboarding. Each user test prepares and cleans up its own invitation, refusing to change an invitee who already belongs to the organization. Override the invitee with `PERCEPT_INVITE_EMAIL` when needed.

UI and CLI individual tests log in automatically as needed without a separate authentication setup test. The Users helper waits for refresh to finish and member rows to load before interacting, rather than relying on fixed delays.

To open only the full flow, use `npm run test:ui:onboarding`. To run an individual test from the terminal, use its file and project, for example:

```powershell
npx playwright test "tests/Individual Tests.spec.ts" --project="Individual Tests" --grep="Invite and remove an administrator"
```

Run the onboarding tests in headed mode:

```powershell
npm test
```

The browser remains visible because `headless: false` is configured in `playwright.config.ts`. Both `npm test` and `npm run test:onboarding` create a new account and organization in QA. CLI runs open the HTML report at the end; click a test to see its named steps and Playwright actions. Failures include a screenshot and trace. UI mode lets you select tests and opens the HTML report after each run.
`npm test -- --list` only lists discovered tests; it does not run them or update the HTML report. If the report shows only skipped tests, run `npm test` without `--list`.

Run with Playwright's interactive debugger:

```powershell
npm run test:debug
```

Reopen the last HTML report:

```powershell
npm run report
```

The CLI report opens automatically after passed or failed runs. Close the report server with `Ctrl+C` in the terminal when finished.

## Created Accounts

Open `smoke-accounts.csv` in the project folder with Excel or VS Code to find accounts created by the smoke flow. The file is created when an account is first registered and keeps its history across runs.

Each row records the run start date (UTC), environment URL, account email, registration password, organization name, and progress status. A row is appended after registration, email verification, and successful organization creation; the latest row for an email shows its last confirmed status. Earlier rows remain available if a later step fails. Retries of new-account tests create separate accounts and records. The standalone organization test records the existing owner's credentials and the new organization.

The corresponding Playwright tests also include these details under Attachments in the HTML report. The saved password is the exact password used for that run, including any `PERCEPT_REGISTRATION_PASSWORD` override. Passwords are stored in plaintext in both the CSV and report attachments; keep these files private and do not publish reports containing them. The CSV and generated reports are excluded from Git.

## Common issues

- If individual tests are missing from the UI, clear the project filter or reopen the UI with `Open-Test-UI.cmd`.
- mail.tm can rate-limit requests or change its available domains; the test does not bypass CAPTCHA.
- The QA environment must accept the chosen temporary email domain.
- Install Chromium with `npx playwright install chromium` on a new machine.

## Troubleshooting

If a locator fails, run `npm run test:debug`, pause the browser, and inspect the visible label or button text. Prefer updating the locator to match the application's accessible name rather than immediately using a long CSS or XPath selector.

If the page loads slowly, inspect the failure screenshot and trace in `test-results`. Avoid adding arbitrary sleeps. Playwright automatically waits for elements to become actionable, and explicit assertions provide better diagnostics.

If organization creation fails after account verification, inspect the page screenshot and the test steps in the Playwright report.
