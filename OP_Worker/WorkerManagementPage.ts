import { Page, Locator, expect } from '@playwright/test';

export class WorkerManagementPage {
  readonly page: Page;
  readonly addWorkerFromDatabaseButton: Locator;
  readonly addWorkerButton: Locator;
  readonly searchInput: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addWorkerFromDatabaseButton = page.getByRole('button', { name: 'Add Worker From Database' });
    this.addWorkerButton = page.getByRole('button', { name: 'Add Worker', exact: true });
    this.searchInput = page.getByPlaceholder('Search:').or(page.locator('input[type="search"]'));
    this.table = page.locator('table');
  }

  async clickAddWorker() {
    await this.addWorkerButton.click();
  }

  rowFor(employeeName: string): Locator {
    return this.page.locator('tr', { hasText: employeeName });
  }

  async expectWorkerVisible(employeeName: string) {
    await expect(this.rowFor(employeeName)).toBeVisible();
  }

  async searchWorker(name: string) {
    await this.searchInput.fill(name);
  }
}
