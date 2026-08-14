import { Locator, Page } from '@playwright/test';

export interface NewHolidayTypeInput {
  code: string;
  name: string;
  // Both radio groups default to "Yes" on this form - only pass 'No' if you need to override.
  allowToWork?: 'Yes' | 'No';
  absentReason?: 'Yes' | 'No';
}

export class HolidayTypePage {
  readonly page: Page;
  readonly codeInput: Locator;
  readonly nameInput: Locator;
  readonly allowToWorkYesRadio: Locator;
  readonly allowToWorkNoRadio: Locator;
  readonly absentReasonYesRadio: Locator;
  readonly absentReasonNoRadio: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.codeInput = page.getByRole('textbox', { name: 'Holiday Type Code' });
    this.nameInput = page.getByRole('textbox', { name: 'Holiday Type Name' });
    // Radios render in form order: Allow To Work (Yes, No), then Absent Reason (Yes, No).
    const radios = page.getByRole('radio');
    this.allowToWorkYesRadio = radios.nth(0);
    this.allowToWorkNoRadio = radios.nth(1);
    this.absentReasonYesRadio = radios.nth(2);
    this.absentReasonNoRadio = radios.nth(3);
    this.saveButton = page.getByRole('button', { name: /\bSave\b/i });
  }

  async fillAndSave(input: NewHolidayTypeInput) {
    await this.codeInput.fill(input.code);
    await this.nameInput.fill(input.name);

    if (input.allowToWork === 'No') {
      await this.allowToWorkNoRadio.check();
    } else if (input.allowToWork === 'Yes') {
      await this.allowToWorkYesRadio.check();
    }
    // If omitted, leave the default "Yes" selection as-is.

    if (input.absentReason === 'No') {
      await this.absentReasonNoRadio.check();
    } else if (input.absentReason === 'Yes') {
      await this.absentReasonYesRadio.check();
    }

    await this.saveButton.click();
  }
}