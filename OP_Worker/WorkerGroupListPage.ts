import { Page, Locator, expect } from '@playwright/test';

export class WorkerGroupListPage {
  readonly page: Page;
  readonly estateDropdown: Locator;
  readonly workerGroupNameFilter: Locator;
  readonly showDeletedCheckbox: Locator;
  readonly searchButton: Locator;
  readonly addWorkerGroupButton: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    // Estate context dropdown at top of the list (org-level users only)
    this.estateDropdown = page.locator('select').first()
      .or(page.getByRole('combobox').first());
    this.workerGroupNameFilter = page.getByPlaceholder('Worker Group Name');
    this.showDeletedCheckbox = page.getByLabel('Show deleted groups')
      .or(page.getByText('Show deleted groups').locator('xpath=preceding-sibling::input | ./input'));
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.addWorkerGroupButton = page.getByRole('button', { name: 'Add Worker Group' })
      .or(page.getByRole('link', { name: 'Add Worker Group' }));
    this.table = page.locator('table');
  }

  async goto() {
    await this.page.goto('/maintain_worker_group');
  }

  async searchWorkerGroup(name: string) {
    await this.workerGroupNameFilter.fill(name);
    await this.searchButton.click();
  }

  async clickAddWorkerGroup() {
    await this.addWorkerGroupButton.click();
  }

  /** Row locator for a given worker group name, useful for scoping view/delete actions */
  rowFor(workerGroupName: string): Locator {
    return this.page.locator('tr', { hasText: workerGroupName });
  }

  /**
   * ACTIONS column icons have no visible text (just eye/trash icons), so we
   * target them positionally: 1st icon = view, 2nd icon = delete.
   * !! VERIFY NEEDED !! Confirm this order/selector against the real DOM
   * (e.g. the icons might be <button>, <a>, or <i> tags with a class like
   * "icon-eye" / "icon-trash" - swap in a more specific selector if so).
   */
  private actionIcons(workerGroupName: string): Locator {
    const row = this.rowFor(workerGroupName);
    return row.locator('td').last().locator('button, a, i, svg');
  }

  async viewWorkerGroup(workerGroupName: string) {
    await this.actionIcons(workerGroupName).nth(0).click();
  }

  async expectWorkerGroupVisible(workerGroupName: string) {
    await expect(this.rowFor(workerGroupName)).toBeVisible();
  }

  async deleteWorkerGroup(workerGroupName: string) {
    await this.actionIcons(workerGroupName).nth(1).click();
    // If a confirmation dialog appears, confirm it
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }
  }
}
