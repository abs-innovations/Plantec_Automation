import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS } from '../../testData';
import { LoginPage } from '../../tests/pages/LoginPage';
import { HolidayTypePage, NewHolidayTypeInput } from './HolidayTypePage';

function randomLetters(length: number) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += letters[Math.floor(Math.random() * letters.length)];
  }
  return result;
}

function buildNewHolidayType(): NewHolidayTypeInput {
  const uniqueId = Date.now().toString().slice(-6);
  return {
    code: randomLetters(2),
    name: `Auto Holiday Type ${uniqueId}`,
    // Left undefined so the form's default "Yes" / "Yes" selections are used.
  };
}

async function navigateToHolidayList(page: Page) {
  // TODO: confirm this matches your actual Holiday Management URL slug.
  await page.goto(`${BASE_URL.replace('/index', '')}/holiday`);
}

async function openHolidayTypeTab(page: Page) {
  await page.getByRole('link', { name: 'Holiday Type', exact: true }).click();
}

async function openAddHolidayType(page: Page) {
  await page.getByRole('link', { name: 'Add Holiday Type' }).click();
}

async function verifyHolidayTypeSaved(page: Page, name: string) {
  const successToast = page.getByText(/success|saved/i).first();
  const holidayTypeListHeading = page.getByRole('heading', { name: 'Holiday Type' });
  const newHolidayTypeCell = page.getByRole('cell', { name });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    holidayTypeListHeading.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    newHolidayTypeCell.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const backOnHolidayTypeList = await holidayTypeListHeading.isVisible().catch(() => false);
  const hasNewHolidayTypeRow = await newHolidayTypeCell.isVisible().catch(() => false);

  expect(hasSuccessToast || backOnHolidayTypeList || hasNewHolidayTypeRow).toBeTruthy();
}

test('[OP Holiday] Add Holiday Type - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const holidayTypePage = new HolidayTypePage(page);
  const holidayTypeData = buildNewHolidayType();

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Holiday Type tab and go to Add Holiday Type', async () => {
    await navigateToHolidayList(page);
    await openHolidayTypeTab(page);
    await openAddHolidayType(page);
    await expect(holidayTypePage.codeInput).toBeVisible({ timeout: 15000 });
  });

  await test.step('Fill and save holiday type form', async () => {
    await holidayTypePage.fillAndSave(holidayTypeData);
  });

  await test.step('Verify save result', async () => {
    await verifyHolidayTypeSaved(page, holidayTypeData.name);
  });
});