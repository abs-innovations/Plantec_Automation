import { Page, Locator } from '@playwright/test';
import { UserType } from '../utils/accountLoader';

export class AddWorkerGroupPage {
  readonly page: Page;
  readonly estateDropdown: Locator;
  readonly workerGroupNameInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.estateDropdown = page.getByText('Please Select An Estate').locator('..')
      .locator('select, [role="combobox"]')
      .or(page.getByRole('combobox').filter({ hasText: /select an estate/i }));
    this.workerGroupNameInput = page.getByPlaceholder('Name');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async goto() {
    await this.page.goto('/maintain_worker_group_add');
  }

  /**
   * Fills the form. `estate` is only required/used for organization-level
   * users - estate-level users don't see this dropdown at all, per Farrah's
   * note, so we skip it automatically based on userType.
   */
  async addWorkerGroup(name: string, userType: UserType, estate?: string) {
    if (userType === 'organization') {
      if (!estate) {
        throw new Error('estate is required for organization-level users');
      }
      await this.estateDropdown.selectOption({ label: estate }).catch(async () => {
        // Fallback if it's a custom (non-<select>) dropdown component
        await this.estateDropdown.click();
        await this.page.getByRole('option', { name: estate }).click();
      });
    }
    await this.workerGroupNameInput.fill(name);
    await this.saveButton.click();
  }
}
