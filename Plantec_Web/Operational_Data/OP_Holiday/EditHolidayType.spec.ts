import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS, OP_HOLIDAY_TYPE_DATA } from '../../testData';
import { LoginPage } from '../../tests/pages/LoginPage';
import { HolidayTypePage } from './HolidayTypePage';

const TARGET_HOLIDAY_TYPE_NAME = OP_HOLIDAY_TYPE_DATA.targetName;
const updatedName = `Edited Holiday Type ${Date.now().toString().slice(-6)}`;

async function navigateToHolidayList(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/holiday`);
}

async function openHolidayTypeTab(page: Page) {
  await page.getByRole('link', { name: 'Holiday Type', exact: true }).click();
}

async function openEditHolidayType(page: Page, name: string) {
  const row = page.getByRole('row', { name: new RegExp(name, 'i') });
  await row.getByTitle('Edit').click();
}

async function verifyHolidayTypeUpdated(page: Page, name: string) {
  const successToast = page.getByText(/success|saved|updated/i).first();
  const listHeading = page.getByRole('heading', { name: 'Holiday Management' });
  const updatedCell = page.getByRole('cell', { name });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    listHeading.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    updatedCell.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const backOnList = await listHeading.isVisible().catch(() => false);
  const hasUpdatedRow = await updatedCell.isVisible().catch(() => false);

  expect(hasSuccessToast || backOnList || hasUpdatedRow).toBeTruthy();
}

test('[OP Holiday] Edit Holiday Type - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const holidayTypePage = new HolidayTypePage(page);

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Holiday Type tab', async () => {
    await navigateToHolidayList(page);
    await openHolidayTypeTab(page);
  });

  await test.step('Open Edit Holiday Type form', async () => {
    await openEditHolidayType(page, TARGET_HOLIDAY_TYPE_NAME);
    await expect(holidayTypePage.nameInput).toBeVisible({ timeout: 15000 });
  });

  await test.step('Update name and save', async () => {
    await holidayTypePage.nameInput.fill(updatedName);
    await holidayTypePage.saveButton.click();
  });

  await test.step('Verify update result', async () => {
    await verifyHolidayTypeUpdated(page, updatedName);
  });
});
