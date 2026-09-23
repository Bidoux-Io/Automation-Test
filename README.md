# Percept Cloud Playwright Learning Project

This small project contains the first automated test for the Percept Cloud QA environment.

## What the test does

The test opens Percept Cloud, enters the email address, continues to the Keycloak password screen, signs in, selects `AutomatedOrg`, and verifies that the Devices page appears.

## Project structure

```text
Automation Test/
├── pages/
│   └── login.page.ts
├── tests/
│   └── login.spec.ts
├── .env.example
├── .gitignore
├── package.json
├── playwright.config.ts
├── README.md
└── tsconfig.json
```

- `tests/login.spec.ts` contains the test scenario and its assertions.
- `pages/login.page.ts` contains reusable login actions in a small page object.
- `playwright.config.ts` contains browser, URL, reporting, and headed-mode settings.
- `package.json` lists dependencies and commands.
- `tsconfig.json` enables TypeScript checking.
- `.env.example` documents the required environment variable names without storing secrets.
- `.gitignore` prevents dependencies, reports, results, and local secrets from being committed.

## Installation

Open a PowerShell terminal in this folder and run:

```powershell
npm install
npx playwright install chromium
```

`npm install` downloads Playwright Test, TypeScript, and Node.js type definitions. The browser installation downloads the Chromium browser that Playwright controls.

## Configure credentials

Do not put the real password in a source file. Set the values only in the terminal that will run the test:

```powershell
$env:PERCEPT_USERNAME = "your-email@example.com"
$env:PERCEPT_PASSWORD = "your-password"
```

The QA URL is already configured. To use another environment for one terminal session, set:

```powershell
$env:PERCEPT_BASE_URL = "https://qa.east-us.perceptcloud.net"
```

## Run the test

### Launch without commands

Do not use the Python play button on `login.spec.ts`. This is a Playwright test, not a Python file.

For the simplest launch, double-click `Open-Test-UI.cmd` in the project folder. To put it on your desktop, right-click the file, choose `Show more options`, then choose `Send to > Desktop (create shortcut)`.

To open the visual test runner in VS Code:

1. Press `Ctrl+Shift+P`.
2. Select `Tasks: Run Task`.
3. Select `Open Playwright Test UI`.
4. In the Playwright window, select the test and click the run button.

The task loads the local `.env` file automatically, so you do not need to type the email or password.

Run the test in headed mode:

```powershell
npm test
```

The browser remains visible because `headless: false` is configured in `playwright.config.ts`.

Run with Playwright's interactive debugger:

```powershell
npm run test:debug
```

Open the HTML report after a run:

```powershell
npm run report
```

## How the test executes

1. Playwright starts Chromium using the settings in `playwright.config.ts`.
2. The test opens the configured QA base URL.
3. `getByLabel('Email')` finds the email input through its visible label.
4. `fill()` enters the environment-provided username.
5. `getByRole('button', { name: 'Next' })` finds the visible Next button.
6. `click()` advances to the password screen.
7. `getByLabel('Password')` finds the password input through its visible label.
8. `fill()` enters the environment-provided password.
9. The Sign In button is found by its accessible role and visible name.
10. The organization text is found exactly as `AutomatedOrg` and selected.
11. `expect(...).toBeVisible()` verifies that the Devices navigation item is displayed.
12. `expect(...).toHaveURL(/\\/devices/)` verifies that the browser is in the Devices area.

## Why these locators are used

- Labels are preferred for form fields because they describe the control to users and are usually more stable than CSS classes.
- Roles and accessible names are preferred for buttons because they model how a user or assistive technology identifies the control.
- Exact organization text prevents the test from accidentally matching a similarly named organization.
- The URL check provides a second, independent confirmation that navigation completed.

## Common mistakes

- Running the test before setting `PERCEPT_USERNAME` and `PERCEPT_PASSWORD`.
- Accidentally placing the password in `login.spec.ts` or committing a `.env` file.
- Selecting a different organization than `AutomatedOrg`.
- Running against an environment where the page text or login flow differs.
- Forgetting `npx playwright install chromium` on a new machine.
- Expecting the test to bypass MFA or CAPTCHA; this test assumes neither is required.

## Troubleshooting

If a locator fails, run `npm run test:debug`, pause the browser, and inspect the visible label or button text. Prefer updating the locator to match the application's accessible name rather than immediately using a long CSS or XPath selector.

If the page loads slowly, inspect the failure screenshot and trace in `test-results`. Avoid adding arbitrary sleeps. Playwright automatically waits for elements to become actionable, and explicit assertions provide better diagnostics.

If the test reaches the organization picker but cannot select `AutomatedOrg`, confirm that the account belongs to that organization and that the organization name has not changed.

## Useful next tests

1. Verify that the selected organization name appears in the navigation.
2. Search for a known device and verify its row is displayed.
3. Open a device and verify its details page.
4. Verify that the Devices page shows the expected table columns.
5. Verify logout and that the login page appears again.
