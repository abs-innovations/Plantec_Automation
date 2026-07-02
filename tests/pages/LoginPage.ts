import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object
 * Handles all login-related interactions and selectors
 */
export class LoginPage extends BasePage {
  // Selectors
  readonly usernameField = () => this.page.getByRole('textbox', { name: 'Username' });
  readonly passwordField = () => this.page.getByRole('textbox', { name: 'Password' });
  readonly signInButton = () => this.page.getByRole('button', { name: 'sign in' });

  constructor(page: Page) {
    super(page);
  }

  /**
   * Perform login with username and password
   * @param username Username to login with
   * @param password Password to login with
   */
  async login(username: string, password: string) {
    await this.usernameField().click();
    await this.usernameField().fill(username);
    await this.usernameField().press('Tab');
    
    await this.passwordField().fill(password);
    
    // Wait for sign in button to be enabled (form validation)
    await this.signInButton().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(500); // Brief wait for button to enable
    
    // Click the sign in button
    await this.signInButton().click();
    
    // Wait for navigation to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill only username field
   * @param username Username to enter
   */
  async enterUsername(username: string) {
    await this.usernameField().click();
    await this.usernameField().fill(username);
  }

  /**
   * Fill only password field
   * @param password Password to enter
   */
  async enterPassword(password: string) {
    await this.passwordField().click();
    await this.passwordField().fill(password);
  }

  /**
   * Click sign in button
   */
  async clickSignIn() {
    await this.signInButton().click();
  }
}
