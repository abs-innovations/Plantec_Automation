import { expect, Locator, Page, test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { BASE_URL, HARVESTING_ADD_FLOW, LOGIN_CREDENTIALS } from './utils/testData';

type ClickAction = 'click' | 'dblclick';

const createRunData = () => {
  const totalHarvestedBunches = (80 + Math.floor(Math.random() * 140)).toString();
  const rotten = Math.floor(Math.random() * 15).toString();
  return { totalHarvestedBunches, rotten };
};

async function selectDropdownOption(page: Page, buttonName: string, optionText: string) {
  await page.getByRole('button', { name: buttonName }).click();
  await page.getByRole('link', { name: optionText, exact: true }).click();
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
  await page.getByRole('link', { name: 'FFB Harvesting' }).click();
  await page.getByRole('link', { name: 'FFB Harvesting' }).click();
}

async function openAddHarvesting(page: Page) {
  await page.getByRole('link', {name: /Add FFB Harvesting/}).click();
}

test('[TC-170] FFB Harvesting - Add automated flow', async ({ page }) => {
  test.setTimeout(180000);

  const runData = createRunData();
  console.log('FFB Harvesting run data:', runData);

  const loginPage = new LoginPage(page);

  await test.step('Login and open Add FFB Harvesting form', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
    await expect(page.getByText('Dashboard')).toBeVisible();
    await navigateToHarvesting(page);
    await openAddHarvesting(page);
  });

  await test.step('Fill main harvesting selections', async () => {
    await selectDropdownOption(page, 'Please Select Phase', HARVESTING_ADD_FLOW.phase);
    await selectDropdownOption(page, 'Please Select Block', HARVESTING_ADD_FLOW.block);
    await selectDropdownOption(page, 'Please Select Planting Year', HARVESTING_ADD_FLOW.plantingYear);
    await selectDropdownOption(page, 'Please Select Lot', HARVESTING_ADD_FLOW.lot);
    await selectDropdownOption(page, 'Please Select Task', HARVESTING_ADD_FLOW.task);
    await selectDropdownOption(page, 'Please Select Platform', HARVESTING_ADD_FLOW.primaryPlatform);

    await selectDropdownOption(page, HARVESTING_ADD_FLOW.secondaryPlatformButton, HARVESTING_ADD_FLOW.secondaryPlatformOption);
    await selectDropdownOption(page, HARVESTING_ADD_FLOW.approverButton, HARVESTING_ADD_FLOW.approverOption);
    await selectDropdownOption(page, HARVESTING_ADD_FLOW.harvesterGroupButton, HARVESTING_ADD_FLOW.harvesterGroupOption);
    await page.getByRole('button', { name: HARVESTING_ADD_FLOW.harvesterSelectButton }).click();
  });

  await test.step('Select harvesters and enter random run data', async () => {
    for (const harvester of HARVESTING_ADD_FLOW.harvesters) {
      await page.getByRole('link', {name: harvester,exact: true}).click();
    }

    await page.getByRole('textbox', { name: 'Total Harvested Bunches' }).fill(runData.totalHarvestedBunches);
    await page.getByRole('textbox', { name: 'Rotten' }).fill(runData.rotten);
  });

  await test.step('Complete counters, save and return to list', async () => {
    await runIncrementActions(page, '#formDynamicSetup15', HARVESTING_ADD_FLOW.incrementActions.formDynamicSetup15);
    await runIncrementActions(page, '#formDynamicSetup18', HARVESTING_ADD_FLOW.incrementActions.formDynamicSetup18);
    await runIncrementActions(page, '#formDynamicSetup17', HARVESTING_ADD_FLOW.incrementActions.formDynamicSetup17);

    const lastCounterButton = page.locator(HARVESTING_ADD_FLOW.finalCounterSelector);
    for (let i = 0; i < HARVESTING_ADD_FLOW.finalCounterClicks; i++) {
      await lastCounterButton.click();
    }

    // await page.getByRole('button', { name: ' Save' }).click();
    // await page.getByRole('button', { name: 'Back to list' }).click();
    await page.getByRole('button', { name: ' Save' }).click();

    await expect(page.getByRole('button', { name: 'Back to list' })).toBeVisible();

    await page.getByRole('button', { name: 'Back to list' }).click();
  });
});

