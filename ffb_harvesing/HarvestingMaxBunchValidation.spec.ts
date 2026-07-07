import { expect, Page, test } from '@playwright/test';
import { LoginPage } from '../tests/pages/LoginPage';
import { BASE_URL, LOGIN_CREDENTIALS } from '../testData';

type ValidationData = {
  estate: string;
  phase: string;
  block: string;
  plantingYear: string;
  lot: string;
  task: string;
  primaryPlatform: string;
  secondaryPlatformButton: string;
  secondaryPlatformOption: string;
  approverButton: string;
  approverOption: string;
  harvesterGroupButton: string;
  harvesterGroupOption: string;
  harvesterSelectButton: string;
  harvester: string;
  looseFruit: string;
  underRipe: string;
  overRipe: string;
  emptyBunch: string;
};

const VALIDATION_DATA: ValidationData = {
  estate: 'KAV - Punteh',
  phase: 'Phase 1',
  block: 'Block 1',
  plantingYear: '2012',
  lot: 'Lot 1',
  task: 'T01',
  primaryPlatform: 'Platform 1',
  secondaryPlatformButton: 'Platform',
  secondaryPlatformOption: 'Platform 5',
  approverButton: 'User 04 (Regional Manager)',
  approverOption: 'Hafizah user (Assistant',
  harvesterGroupButton: 'Nothing Selected',
  harvesterGroupOption: 'Harvester - Punteh',
  harvesterSelectButton: 'Please Select At Least 1',
  harvester: 'HAV006 - Joe',
  looseFruit: '10',
  underRipe: '5',
  overRipe: '5',
  emptyBunch: '3',
};

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function selectEstate(page: Page, estateName: string) {
  const estateSelect = page.locator('form select').first();
  if (await estateSelect.isVisible().catch(() => false)) {
    await estateSelect.selectOption({ label: estateName });
    return;
  }

  const estateButton = page.getByRole('button', { name: /estate|please select estate/i }).first();
  await estateButton.click();
  await page.locator('a').filter({ hasText: estateName }).first().click();
}

async function selectOrganization(page: Page) {
  await page.locator('div').filter({ hasText: /^\[SLDB\]Sabah Land Development Board$/ }).first().click();
  await expect(page.getByText('Dashboard')).toBeVisible();
}

async function navigateToFfbHarvestingList(page: Page) {
  const harvestingMenu = page.locator('a[href="javascript:void(0);"]', { hasText: 'FFB Harvesting' }).first();
  if ((await harvestingMenu.getAttribute('aria-expanded')) !== 'true') {
    await harvestingMenu.click();
  }
  await page.locator('a[href="harvesting"]').click();
  await expect(page).toHaveURL(/harvesting(\?|$)/i);
}

async function openAddFfbHarvesting(page: Page) {
  await page.getByRole('link', { name: /Add FFB Harvesting/i }).click();
  await expect(page.getByRole('heading', { name: /Add FFB Record/i })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /Harvesting Date/i })).toBeVisible();
  await expect(page.getByText(/Estate/i).first()).toBeVisible();
}

async function fillTextFieldByLabel(page: Page, label: string, value: string) {
  const candidates = [
    page.getByRole('textbox', { name: new RegExp(escapeForRegex(label), 'i') }).first(),
    page.locator(`label:has-text("${label}")`).locator('xpath=following::input[1]').first(),
    page.locator(`input[placeholder*="${label}"]`).first(),
    page.locator(`input[name*="${label.toLowerCase().replace(/\s+/g, '_')}"]`).first(),
  ];

  for (const candidate of candidates) {
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.fill(value);
      return candidate;
    }
  }

  throw new Error(`Field '${label}' was not found with known selectors.`);
}

async function clickSave(page: Page) {
  const candidates = [
    page.getByRole('button', { name: /\bSave\b/i }).first(),
    page.locator('button:has-text("Save")').first(),
    page.locator('button[type="submit"]').first(),
    page.locator('input[type="submit"]').first(),
    page.locator('button.btn-primary').last(),
  ];

  for (const candidate of candidates) {
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click();
      return;
    }
  }

  throw new Error('Save button was not found with known selectors.');
}

async function selectDropdownByButtonLabel(page: Page, buttonLabel: string, optionText: string) {
  await page.getByRole('button', { name: new RegExp(escapeForRegex(buttonLabel), 'i') }).first().click();
  await page.locator('a').filter({ hasText: optionText }).first().click();
}

async function fillMandatoryFields(page: Page) {
  await selectEstate(page, VALIDATION_DATA.estate);

  await selectDropdownByButtonLabel(page, 'Please Select Phase', VALIDATION_DATA.phase);
  await selectDropdownByButtonLabel(page, 'Please Select Block', VALIDATION_DATA.block);
  await selectDropdownByButtonLabel(page, 'Please Select Planting Year', VALIDATION_DATA.plantingYear);
  await selectDropdownByButtonLabel(page, 'Please Select Lot', VALIDATION_DATA.lot);
  await selectDropdownByButtonLabel(page, 'Please Select Task', VALIDATION_DATA.task);
  await selectDropdownByButtonLabel(page, 'Please Select Platform', VALIDATION_DATA.primaryPlatform);
  await selectDropdownByButtonLabel(page, VALIDATION_DATA.secondaryPlatformButton, VALIDATION_DATA.secondaryPlatformOption);
  await selectDropdownByButtonLabel(page, VALIDATION_DATA.approverButton, VALIDATION_DATA.approverOption);
  await selectDropdownByButtonLabel(page, VALIDATION_DATA.harvesterGroupButton, VALIDATION_DATA.harvesterGroupOption);
  await selectDropdownByButtonLabel(page, VALIDATION_DATA.harvesterSelectButton, VALIDATION_DATA.harvester);
}

async function fillNumericValues(page: Page) {
  const totalBunchesInput = await fillTextFieldByLabel(page, 'Total Harvested Bunches', '1001');
  await expect(totalBunchesInput).toHaveValue('1001');

  await fillTextFieldByLabel(page, 'Loose Fruit', VALIDATION_DATA.looseFruit);
  await fillTextFieldByLabel(page, 'Under Ripe', VALIDATION_DATA.underRipe);
  await fillTextFieldByLabel(page, 'Over Ripe', VALIDATION_DATA.overRipe);
  await fillTextFieldByLabel(page, 'Empty Bunch', VALIDATION_DATA.emptyBunch);
}

async function assertCannotSaveAndValidationShown(page: Page) {
  await clickSave(page);

  const validationText = page.getByText(/total harvested bunches.*(must not exceed|cannot exceed).*(1000)/i);
  await expect(validationText.first()).toBeVisible({ timeout: 10000 });

  // User should remain on add form when validation fails.
  await expect(page).toHaveURL(/harvesting_add(\?|$)/i);
  await expect(page.getByRole('heading', { name: /Add FFB Record/i })).toBeVisible();
}

test('[TC-Validation] Prevent save when Total Harvested Bunches is more than 1000', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);

  await test.step('1. Login with valid credential and click Sign In', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  await test.step('2. Select organization: Sabah Land Development Board', async () => {
    await selectOrganization(page);
  });

  await test.step('3. Open FFB Harvesting module and sub-module', async () => {
    await navigateToFfbHarvestingList(page);
  });

  await test.step('4. Click Add FFB Harvesting and verify form is visible', async () => {
    await openAddFfbHarvesting(page);
  });

  await test.step('5. Fill mandatory fields with valid data', async () => {
    await fillMandatoryFields(page);
  });

  await test.step('6. Enter 1001 into Harvested Bunches field', async () => {
    const totalBunchesInput = await fillTextFieldByLabel(page, 'Total Harvested Bunches', '1001');
    await expect(totalBunchesInput).toHaveValue('1001');
  });

  await test.step('7. Fill other numeric fields and click Save. Verify validation blocks save', async () => {
    await fillNumericValues(page);
    await assertCannotSaveAndValidationShown(page);
  });
});
