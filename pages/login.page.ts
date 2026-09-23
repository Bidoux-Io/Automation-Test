// Import the Page type so the page object can use Playwright's browser page API.
import { Page } from '@playwright/test';

// Represent the login and organization-selection screens as one readable page object.
export class LoginPage {
  // Store the browser page used by this page object.
  constructor(private readonly page: Page) {}

  // The `email` parameter is a string because the page needs text to type into the field.
  // It is not related to Node's `Dict` interface shown in the editor screenshot.
  async enterEmail(email: string): Promise<void> {
    // Locate the field by its visible Email label because labels are readable and user-facing.
    await this.page.getByLabel('Email').fill(email);
  }

  // Move from the first email screen to the password screen.
  async continueToPassword(): Promise<void> {
    // Locate the button by its visible Next name because this describes the user's action.
    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
  }

  // The password is also plain text from the test's point of view, so this method
  // accepts a string. The value still comes from the environment and is not stored here.
  async enterPassword(password: string): Promise<void> {
    // Locate the password field by its visible Password label rather than a fragile CSS path.
    await this.page.getByLabel('Password').fill(password);
  }

  // Submit the Keycloak sign-in form.
  async signIn(): Promise<void> {
    // Locate the form button by its visible Sign In name because this is the accessible button label.
    await this.page.getByRole('button', { name: 'Sign In', exact: true }).click();
  }

  // Select the organization that the test account should use.
  async selectOrganization(organizationName: string): Promise<void> {
    // Click the card's navigation link instead of its heading so the app enters the organization.
    const organizationLink = this.page.getByRole('link', {
      name: new RegExp(`^Select .*${organizationName}$`),
    });
    await organizationLink.click();
  }

  // The login method receives three strings: email, password, and organization name.
  // These are inputs for this page object; they are not dictionary keys or Node types.
  async login(email: string, password: string, organizationName: string): Promise<void> {
    // Fill the email field before moving to the password screen.
    await this.enterEmail(email);
    // Click Next so the application displays the Keycloak password screen.
    await this.continueToPassword();
    // Fill the password field on the Keycloak screen.
    await this.enterPassword(password);
    // Submit the credentials and wait for the next application screen.
    await this.signIn();
    // Select AutomatedOrg so the test enters the intended Percept Cloud organization.
    await this.selectOrganization(organizationName);
  }
}
