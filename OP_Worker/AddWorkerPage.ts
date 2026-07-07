import { Page, Locator } from '@playwright/test';

export interface NewWorkerInput {
  employeeCode: string;
  workerName: string;
  primaryRole: string;
  otherRole?: string;
  labourType: string;
  rateType: string;
  lastEmploymentDate?: string; // format as the date picker expects, e.g. 'DD/MM/YYYY'
}

export class AddWorkerPage {
  readonly page: Page;
  readonly employeeCodeInput: Locator;
  readonly workerNameInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.employeeCodeInput = page.getByPlaceholder('Employee Code');
    this.workerNameInput = page.getByPlaceholder('Name');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  /**
   * Selects an option from a custom dropdown identified by its field label
   * (e.g. "Primary Role", "Other Role", "Labour Type", "Rate Type").
   * !! VERIFY NEEDED !! These fields render as custom dropdowns, not native
   * <select> elements in the screenshot - adjust this helper once you can
   * inspect the real markup (it may need a different open/close interaction).
   */
  private async selectCustomDropdown(fieldLabel: string, optionText: string) {
    const dropdown = this.page
      .locator('text=' + fieldLabel)
      .locator('xpath=following::*[self::select or @role="combobox"][1]');
    await dropdown.click();
    await this.page.getByRole('option', { name: optionText }).click();
  }

  async fillForm(worker: NewWorkerInput) {
    await this.employeeCodeInput.fill(worker.employeeCode);
    await this.workerNameInput.fill(worker.workerName);
    await this.selectCustomDropdown('Primary Role', worker.primaryRole);
    if (worker.otherRole) {
      await this.selectCustomDropdown('Other Role', worker.otherRole);
    }
    await this.selectCustomDropdown('Labour Type', worker.labourType);
    await this.selectCustomDropdown('Rate Type', worker.rateType);
    if (worker.lastEmploymentDate) {
      await this.page.getByPlaceholder('Last Employment Date').fill(worker.lastEmploymentDate);
    }
  }

  async save() {
    await this.saveButton.click();
  }

  async addWorker(worker: NewWorkerInput) {
    await this.fillForm(worker);
    await this.save();
  }
}
