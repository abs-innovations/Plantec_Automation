import { Locator, Page } from '@playwright/test';

export interface NewWorkerGroupInput {
  estate: string;
  groupName: string;
}

export class WorkerGroupPage {
  readonly page: Page;
  readonly estateSelect: Locator;
  readonly groupNameInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // "Please Select An Estate" - native <select> styled to look like a dropdown button,
    // same pattern as the Estate select on the FFB Harvesting Add form.
    this.estateSelect = page.locator('form select').first();
    this.groupNameInput = page.getByRole('textbox', { name: "Worker Group's Name" });
    this.saveButton = page.getByRole('button', { name: /\bSave\b/i });
  }

  async addWorkerGroup(input: NewWorkerGroupInput) {
    await this.estateSelect.selectOption({ label: input.estate });
    await this.groupNameInput.fill(input.groupName);
    await this.saveButton.click();
  }
}