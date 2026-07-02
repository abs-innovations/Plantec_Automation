import { Page, expect } from '@playwright/test';

/**
 * Common helper functions for tests
 */

/**
 * Wait for a condition to be true
 * @param condition Function that returns a boolean
 * @param timeout Max time to wait in milliseconds
 * @param interval Check interval in milliseconds
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Verify element is visible
 * @param page Playwright page
 * @param selector Element selector
 */
export async function verifyElementVisible(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
}

/**
 * Verify element text content
 * @param page Playwright page
 * @param selector Element selector
 * @param text Expected text content
 */
export async function verifyElementText(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toContainText(text);
}

/**
 * Get current URL
 * @param page Playwright page
 * @returns Current URL
 */
export function getCurrentUrl(page: Page): string {
  return page.url();
}

/**
 * Verify URL contains text
 * @param page Playwright page
 * @param urlPart Expected URL part
 */
export async function verifyUrlContains(page: Page, urlPart: string): Promise<void> {
  await page.waitForURL(`**/*${urlPart}*`);
}

/**
 * Clear all browser data
 * @param page Playwright page
 */
export async function clearBrowserData(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Log test information for debugging
 * @param message Message to log
 * @param data Optional data to log
 */
export function logTestInfo(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param delay Initial delay in milliseconds
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      logTestInfo(`Attempt ${i + 1} failed, retrying in ${delay}ms`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}
