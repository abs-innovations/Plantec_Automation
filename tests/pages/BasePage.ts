import { Page } from '@playwright/test';

/**
 * Base Page class with common methods for all pages
 * Handles navigation, waiting, and shared interactions
 */
export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a URL
   * @param url The URL to navigate to
   */
  async goto(url: string) {
    await this.page.goto(url);
  }

  /**
   * Wait for a specific element to be visible
   * @param selector The selector to wait for
   */
  async waitForElement(selector: string) {
    await this.page.waitForSelector(selector, { state: 'visible' });
  }

  /**
   * Wait for a specific timeout
   * @param ms Milliseconds to wait
   */
  async waitFor(ms: number) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Close the current page
   */
  async close() {
    await this.page.close();
  }

  /**
   * Take a screenshot for debugging
   * @param name Screenshot filename
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
