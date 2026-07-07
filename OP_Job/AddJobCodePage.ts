import { Page, Locator } from '@playwright/test';

export interface NewJobCodeInput {
  moduleName: string; // e.g. "FFB Harvesting(FFB)", "Field Inspection(FIR)", "Evacuation(E)", "Weighbridge(WB)"
  jobCode: string; // max 4 letters
  checkrollSymbol: string; // max 2 letters
  name: string;
}

export class AddJobCodePage {
  readonly page: Page;
  readonly moduleNameDropdown: Locator;
  readonly jobCodeInput: Locator;
  readonly checkrollSymbolInput: Locator;
  readonly nameInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.moduleNameDropdown = page.locator('select').first()
      .or(page.getByRole('combobox').first());
    this.jobCodeInput = page.getByPlaceholder('Max 4 Letters Only');
    this.checkrollSymbolInput = page.getByPlaceholder('Max 2 Letters Only');
    this.nameInput = page.getByPlaceholder('Name');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async goto() {
    await this.page.goto('/maintain_job_code_add');
  }

  async selectModule(moduleName: string) {
    await this.moduleNameDropdown.selectOption({ label: moduleName }).catch(async () => {
      // Fallback if it's a custom (non-<select>) dropdown component
      await this.moduleNameDropdown.click();
      await this.page.getByRole('option', { name: moduleName }).click();
    });
  }

  async fillForm(jobCode: NewJobCodeInput) {
    await this.selectModule(jobCode.moduleName);
    await this.jobCodeInput.fill(jobCode.jobCode);
    await this.checkrollSymbolInput.fill(jobCode.checkrollSymbol);
    await this.nameInput.fill(jobCode.name);
  }

  async save() {
    await this.saveButton.click();
  }

  async addJobCode(jobCode: NewJobCodeInput) {
    await this.fillForm(jobCode);
    await this.save();
  }
}
