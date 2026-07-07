import { Page, Locator, expect } from '@playwright/test';

export class JobCodeListPage {
  readonly page: Page;
  readonly jobNameFilter: Locator;
  readonly searchButton: Locator;
  readonly addNewJobCodeButton: Locator;
  readonly table: Locator;
  readonly nextPageButton: Locator;
  readonly previousPageButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.jobNameFilter = page.getByPlaceholder('Job Name');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.addNewJobCodeButton = page.getByRole('button', { name: 'Add New Job Code' })
      .or(page.getByRole('link', { name: 'Add New Job Code' }));
    this.table = page.locator('table');
    this.nextPageButton = page.getByRole('button', { name: 'Next' })
      .or(page.getByRole('link', { name: 'Next' }));
    this.previousPageButton = page.getByRole('button', { name: 'Previous' })
      .or(page.getByRole('link', { name: 'Previous' }));
  }

  async goto() {
    await this.page.goto('/maintain_job_code');
  }

  async searchJobName(name: string) {
    await this.jobNameFilter.fill(name);
    await this.searchButton.click();
  }

  async clickAddNewJobCode() {
    await this.addNewJobCodeButton.click();
  }

  rowFor(jobName: string): Locator {
    return this.page.locator('tr', { hasText: jobName });
  }

  async expectJobCodeVisible(jobName: string) {
    await expect(this.rowFor(jobName)).toBeVisible();
  }

  /**
   * ACTIONS column icons have no visible text (edit pencil, delete trash).
   * !! VERIFY NEEDED !! Positional guess: 1st icon = edit, 2nd = delete.
   */
  private actionIcons(jobName: string): Locator {
    const row = this.rowFor(jobName);
    return row.locator('td').last().locator('button, a, i, svg');
  }

  async editJobCode(jobName: string) {
    await this.actionIcons(jobName).nth(0).click();
  }

  async deleteJobCode(jobName: string) {
    await this.actionIcons(jobName).nth(1).click();
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }
  }
}
