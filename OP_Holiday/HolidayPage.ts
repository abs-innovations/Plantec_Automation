import { Locator, Page } from '@playwright/test';

export interface NewHolidayInput {
  estate: string;
  holidayType: string;
  remark: string;
  // Start/End Date default to today on this form - only override if you need a specific date.
  startDate?: string;
  endDate?: string;
}

export class HolidayPage {
  readonly page: Page;
  readonly estateSelect: Locator;
  readonly holidayTypeSelect: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly remarkInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Both Estate and Holiday Type render as native <select> in form order.
    this.estateSelect = page.locator('form select').nth(0);
    this.holidayTypeSelect = page.locator('form select').nth(1);
    this.startDateInput = page.getByRole('textbox', { name: 'Start Date' });
    this.endDateInput = page.getByRole('textbox', { name: 'End Date' });
    this.remarkInput = page.getByRole('textbox', { name: 'Remark' });
    this.saveButton = page.getByRole('button', { name: /\bSave\b/i });
  }

  async fillAndSave(input: NewHolidayInput) {
    await this.estateSelect.selectOption({ label: input.estate });
    await this.holidayTypeSelect.selectOption({ label: input.holidayType });

    // Start/End Date are pre-filled with today's date - only touch them if an override was given.
    if (input.startDate) {
      await this.startDateInput.fill(input.startDate);
    }
    if (input.endDate) {
      await this.endDateInput.fill(input.endDate);
    }

    await this.remarkInput.fill(input.remark);
    await this.saveButton.click();
  }
}