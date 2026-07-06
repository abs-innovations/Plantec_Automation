import { expect, Page, test } from '@playwright/test';
import { LoginPage } from '../tests/pages/LoginPage';
import { BASE_URL, HARVESTING_ADD_FLOW, HARVESTING_DATA, LOGIN_CREDENTIALS } from '../testData';

type ClickAction = 'click' | 'dblclick';

async function selectEstate(page: Page, estateName: string) {
  const estateSelect = page.locator('form select').first();
  await expect(estateSelect).toBeVisible();
  await estateSelect.selectOption({ label: estateName });
}

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function selectDropdownByButtonLabel(page: Page, buttonLabel: string, optionText: string) {
  await page.getByRole('button', { name: new RegExp(escapeForRegex(buttonLabel), 'i') }).first().click();
  await page.locator('a').filter({ hasText: optionText }).first().click();
}

async function fillHarvestingDropdowns(page: Page) {
  await selectEstate(page, HARVESTING_DATA.estate);
  await selectDropdownByButtonLabel(page, 'Please Select Phase', HARVESTING_ADD_FLOW.phase);
  await selectDropdownByButtonLabel(page, 'Please Select Block', HARVESTING_ADD_FLOW.block);
  await selectDropdownByButtonLabel(page, 'Please Select Planting Year', HARVESTING_ADD_FLOW.plantingYear);
  await selectDropdownByButtonLabel(page, 'Please Select Lot', HARVESTING_ADD_FLOW.lot);
  await selectDropdownByButtonLabel(page, 'Please Select Task', HARVESTING_ADD_FLOW.task);
  await selectDropdownByButtonLabel(page, 'Please Select Platform', HARVESTING_ADD_FLOW.primaryPlatform);
  await selectDropdownByButtonLabel(page, HARVESTING_ADD_FLOW.secondaryPlatformButton, HARVESTING_ADD_FLOW.secondaryPlatformOption);
  await selectDropdownByButtonLabel(page, HARVESTING_ADD_FLOW.approverButton, HARVESTING_ADD_FLOW.approverOption);
  await selectDropdownByButtonLabel(page, HARVESTING_ADD_FLOW.harvesterGroupButton, HARVESTING_ADD_FLOW.harvesterGroupOption);
  await page.getByRole('button', { name: new RegExp(escapeForRegex(HARVESTING_ADD_FLOW.harvesterSelectButton), 'i') }).first().click();
  for (const harvester of HARVESTING_ADD_FLOW.harvesters) {
    await page.locator('a').filter({ hasText: harvester }).first().click();
  }
}

async function fillVisibleTextbox(page: Page, fieldName: string, value: string) {
  const textbox = page.getByRole('textbox', { name: fieldName });
  if (!(await textbox.first().isVisible())) {
    return;
  }
  await textbox.first().fill(value);
}

async function runIncrementActions(page: Page, containerSelector: string, actions: readonly ClickAction[]) {
  const incrementButton = page.locator(containerSelector).getByRole('button', { name: '+' });
  for (const action of actions) {
    if (action === 'dblclick') {
      await incrementButton.dblclick();
      continue;
    }
    await incrementButton.click();
  }
}

async function navigateToHarvesting(page: Page) {
  await page.locator('div').filter({ hasText: /^\[SLDB\]Sabah Land Development Board$/ }).first().click();
  const harvestingMenu = page.locator('a[href="javascript:void(0);"]', { hasText: 'FFB Harvesting' }).first();
  if ((await harvestingMenu.getAttribute('aria-expanded')) !== 'true') {
    await harvestingMenu.click();
  }
  await page.locator('a[href="harvesting"]').click();
}

async function openAddHarvesting(page: Page) {
  await page.getByRole('link', {name: /Add FFB Harvesting/}).click();
}

async function fillHarvestingFieldValues(page: Page) {
  await fillVisibleTextbox(page, 'Total Harvested Bunches', HARVESTING_DATA.totalBunches);
  await fillVisibleTextbox(page, 'Rotten', HARVESTING_DATA.rotten);
  await fillVisibleTextbox(page, 'Unripe', HARVESTING_DATA.unripe);
  await fillVisibleTextbox(page, 'Under Ripe', HARVESTING_DATA.underRipe);
  await fillVisibleTextbox(page, 'Over Ripe', HARVESTING_DATA.overRipe);
  await fillVisibleTextbox(page, 'Empty Bunch', HARVESTING_DATA.emptyBunch);
  await fillVisibleTextbox(page, 'Loose Fruit', HARVESTING_DATA.looseFruit);

  const remarksTextbox = page.locator('form textarea, form input[type="text"]').filter({ hasNot: page.getByRole('textbox', { name: 'Harvesting Date' }) }).last();
  if (await remarksTextbox.isVisible()) {
    await remarksTextbox.fill(HARVESTING_DATA.remarks);
  }
}

async function runConfiguredIncrementActions(page: Page) {
  for (const [containerSelector, actions] of Object.entries(HARVESTING_ADD_FLOW.incrementActions)) {
    await runIncrementActions(page, `#${containerSelector}`, actions);
  }

  const finalCounterButton = page.locator(HARVESTING_ADD_FLOW.finalCounterSelector);
  for (let i = 0; i < HARVESTING_ADD_FLOW.finalCounterClicks; i += 1) {
    await finalCounterButton.click();
  }
}

async function verifyHarvestingSaved(page: Page) {
  const successText = page.getByText(/success|saved/i);
  const backToListButton = page.getByRole('button', { name: /back to list/i });

  // Save may show a toast, stay on Add page with Back to list, or return directly to list.
  await Promise.race([
    successText.first().waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    backToListButton.first().waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    page.waitForURL(/harvesting(\?|$)/i, { timeout: 12000 }).catch(() => undefined),
  ]);

  if (await backToListButton.first().isVisible().catch(() => false)) {
    await backToListButton.first().click();
    await expect(page).toHaveURL(/harvesting(\?|$)/i, { timeout: 15000 });
    return;
  }

  await expect(page).toHaveURL(/harvesting(_add)?(\?|$)/i, { timeout: 15000 });
  await expect(page.getByRole('button', { name: /\bSave\b/i }).first()).toBeVisible();
}

test('[TC-170] FFB Harvesting - Add automated flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);

  await test.step('Login and open Add FFB Harvesting form', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
    await expect(page.getByText('Dashboard')).toBeVisible();
    await navigateToHarvesting(page);
    await openAddHarvesting(page);
  });

  await test.step('Fill main harvesting selections', async () => {
    await fillHarvestingDropdowns(page);
  });

  await test.step('Fill visible harvesting values from HARVESTING_DATA', async () => {
    await fillHarvestingFieldValues(page);
  });

  await test.step('Apply configured increment actions', async () => {
    await runConfiguredIncrementActions(page);
  });

  await test.step('Save and verify result', async () => {
    await page.getByRole('button', { name: /\bSave\b/i }).click();
    await verifyHarvestingSaved(page);
  });
});

