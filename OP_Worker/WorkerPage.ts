import { Locator, Page } from '@playwright/test';

export interface NewWorkerConfigurationInput {
  employeeCode: string;
  workerName: string;
  primaryRole: string;
  labourType: string;
  rateType: string;
  otherRole?: string;
}

export class WorkerConfigurationPage {
  readonly page: Page;
  readonly employeeCodeInput: Locator;
  readonly workerNameInput: Locator;
  readonly primaryRoleSelect: Locator;
  readonly otherRoleSelect: Locator;
  readonly labourTypeSelect: Locator;
  readonly rateTypeSelect: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.employeeCodeInput = page.getByRole('textbox', { name: 'Employee Code' });
    this.workerNameInput = page.getByRole('textbox', { name: "Worker's Name" });
    // Organization / Estate / Worker Group Name are read-only/pre-filled on this page,
    // so no locators needed for those - only the editable fields below.
    // These 4 dropdowns render as native <select> in form order: Primary Role, Other Role, Labour Type, Rate Type.
    this.primaryRoleSelect = page.locator('form select').nth(0);
    this.otherRoleSelect = page.locator('form select').nth(1);
    this.labourTypeSelect = page.locator('form select').nth(2);
    this.rateTypeSelect = page.locator('form select').nth(3);
    this.saveButton = page.getByRole('button', { name: /\bSave\b/i });
  }

  async fillAndSave(input: NewWorkerConfigurationInput) {
    await this.employeeCodeInput.fill(input.employeeCode);
    await this.workerNameInput.fill(input.workerName);
    await this.primaryRoleSelect.selectOption({ label: input.primaryRole });
    if (input.otherRole) {
      await this.otherRoleSelect.selectOption({ label: input.otherRole });
    }
    await this.labourTypeSelect.selectOption({ label: input.labourType });
    await this.rateTypeSelect.selectOption({ label: input.rateType });
    // Last Employment Date left blank - optional field, not needed for basic flow.
    await this.saveButton.click();
  }
}