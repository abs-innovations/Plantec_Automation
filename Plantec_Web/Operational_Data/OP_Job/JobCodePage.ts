import { Locator, Page } from '@playwright/test';

export interface NewJobCodeInput {
  moduleName: string;
  jobCode: string;
  checkrollSymbol: string;
  name: string;
}

export class JobCodePage {
  readonly page: Page;
  readonly moduleSelect: Locator;
  readonly jobCodeInput: Locator;
  readonly checkrollSymbolInput: Locator;
  readonly nameInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Native <select> - "Please Select A Module" renders the browser's default option list.
    this.moduleSelect = page.locator('form select').first();
    this.jobCodeInput = page.getByRole('textbox', { name: 'Job Code' });
    this.checkrollSymbolInput = page.getByRole('textbox', { name: 'Checkroll Symbol' });
    this.nameInput = page.getByRole('textbox', { name: 'Name' });
    this.saveButton = page.getByRole('button', { name: /\bSave\b/i });
  }

  async fillAndSave(input: NewJobCodeInput) {
    await this.moduleSelect.selectOption({ label: input.moduleName });
    await this.jobCodeInput.fill(input.jobCode);
    await this.checkrollSymbolInput.fill(input.checkrollSymbol);
    await this.nameInput.fill(input.name);
    await this.saveButton.click();
  }
}