import { Page, Locator, expect } from '@playwright/test';
import { Account } from '../utils/accountLoader';

/**
 * !! VERIFY NEEDED !!
 * I don't have a screenshot of the actual login screen, so these locators
 * are best-effort guesses based on common patterns (label text / placeholder).
 * Please open the real login page, inspect the username/password fields and
 * login button, and update the locators below if they don't match.
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByPlaceholder(/username|email/i)
      .or(page.getByLabel(/username|email/i));
    this.passwordInput = page.getByPlaceholder(/password/i)
      .or(page.getByLabel(/password/i));
    this.loginButton = page.getByRole('button', { name: /log ?in|sign ?in/i });
  }

  async goto() {
    await this.page.goto('/index');
  }

  async login(account: Account) {
    await this.goto();
    await this.usernameInput.fill(account.username);
    await this.passwordInput.fill(account.password);
    await this.loginButton.click();
    // Confirm we've landed on the dashboard/home after login
    await expect(this.page).not.toHaveURL(/index|login/i, { timeout: 15000 });
  }
}
