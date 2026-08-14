import { Locator, Page } from '@playwright/test';

export class PublicHolidayPage {
  readonly page: Page;
  readonly estateSelect: Locator;
  readonly searchButton: Locator;
  readonly addSelectedHolidayButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.estateSelect = page.locator('form select').first();
    this.searchButton = page.getByRole('button', { name: 'Search Public Holiday' });
    this.addSelectedHolidayButton = page.getByRole('button', { name: 'Add Selected Holiday' });
  }

  async searchByEstate(estate: string) {
    await this.estateSelect.selectOption({ label: estate });
    await this.searchButton.click();
  }

  /** Checks the row checkbox for a holiday by matching its Remark column text (e.g. "New Year's Day"). */
  async selectHolidayByRemark(remark: string) {
    const row = this.page.getByRole('row', { name: new RegExp(remark, 'i') });
    await row.getByRole('checkbox').check();
  }

  async selectHolidaysByRemarks(remarks: string[]) {
    for (const remark of remarks) {
      await this.selectHolidayByRemark(remark);
    }
  }

  async addSelectedHolidays() {
    await this.addSelectedHolidayButton.click();
  }
}