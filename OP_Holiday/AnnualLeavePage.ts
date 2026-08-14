import { Locator, Page } from '@playwright/test';

export interface NewAnnualLeaveInput {
  estate: string;
  workerGroup: string;
  worker: string;
  remark: string;
  // Absent Reason defaults to "Public Holiday (PH)" - only override if you need a different reason.
  absentReason?: string;
  // Start/End Date default to today on this form - only override if you need a specific date.
  startDate?: string;
  endDate?: string;
}

export class AnnualLeavePage {
  readonly page: Page;
  readonly estateSelect: Locator;
  readonly workerGroupSelect: Locator;
  readonly workerSelect: Locator;
  readonly absentReasonSelect: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly remarkInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // All 4 dropdowns render as native <select> in form order.
    const selects = page.locator('form select');
    this.estateSelect = selects.nth(0);
    this.workerGroupSelect = selects.nth(1);
    this.workerSelect = selects.nth(2);
    this.absentReasonSelect = selects.nth(3);
    this.startDateInput = page.getByRole('textbox', { name: 'Start Date' });
    this.endDateInput = page.getByRole('textbox', { name: 'End Date' });
    this.remarkInput = page.getByRole('textbox', { name: 'Remark' });
    this.saveButton = page.getByRole('button', { name: /\bSave\b/i });
  }

  async fillAndSave(input: NewAnnualLeaveInput) {
    await this.estateSelect.selectOption({ label: input.estate });

    // Worker Group -> Worker is a cascading dropdown: the Worker list only populates
    // after a Worker Group is chosen, so wait for the specific option before selecting it.
    await this.workerGroupSelect.selectOption({ label: input.workerGroup });
    await this.workerSelect.locator(`option:text-is("${input.worker}")`).waitFor({ state: 'attached', timeout: 10000 });
    await this.workerSelect.selectOption({ label: input.worker });

    if (input.absentReason) {
      await this.absentReasonSelect.selectOption({ label: input.absentReason });
    }
    // If omitted, leave the default "Public Holiday (PH)" selection as-is.

    if (input.startDate) {
      await this.startDateInput.fill(input.startDate);
    }
    if (input.endDate) {
      await this.endDateInput.fill(input.endDate);
    }
    // If omitted, Start/End Date keep their default (today).

    await this.remarkInput.fill(input.remark);
    await this.saveButton.click();
  }
}