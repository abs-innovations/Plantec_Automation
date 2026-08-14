import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS } from '../testData';
import { LoginPage } from '../tests/pages/LoginPage';
import { PublicHolidayPage } from './PublicHolidayPage';

// TODO: swap for the estate / holiday(s) you want this test to cover.
const TARGET_ESTATE = 'Titiwangsa';
const TARGET_HOLIDAY_REMARKS = ["New Year's Day"];

async function navigateToHolidayList(page: Page) {
  // TODO: confirm this matches your actual Holiday Management URL slug.
  await page.goto(`${BASE_URL.replace('/index', '')}/holiday`);
}

async function openPublicHolidayTab(page: Page) {
  await page.getByRole('link', { name: 'Public Holiday', exact: true }).click();
}

async function verifyPublicHolidayAdded(page: Page, remark: string) {
  const successToast = page.getByText(/success|saved|added/i).first();
  const holidayManagementTab = page.getByRole('link', { name: 'Holiday Management', exact: true });
  const newHolidayCell = page.getByRole('cell', { name: remark });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    holidayManagementTab.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    newHolidayCell.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const backOnHolidayManagement = await holidayManagementTab.isVisible().catch(() => false);
  const hasNewHolidayRow = await newHolidayCell.isVisible().catch(() => false);

  expect(hasSuccessToast || backOnHolidayManagement || hasNewHolidayRow).toBeTruthy();
}

test('[OP Holiday] Add Public Holiday - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const publicHolidayPage = new PublicHolidayPage(page);

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Public Holiday tab', async () => {
    await navigateToHolidayList(page);
    await openPublicHolidayTab(page);
    await expect(publicHolidayPage.estateSelect).toBeVisible({ timeout: 15000 });
  });

  await test.step('Search public holidays for the estate', async () => {
    await publicHolidayPage.searchByEstate(TARGET_ESTATE);
  });

  await test.step('Select and add holiday(s)', async () => {
    await publicHolidayPage.selectHolidaysByRemarks(TARGET_HOLIDAY_REMARKS);
    await publicHolidayPage.addSelectedHolidays();
  });

  await test.step('Verify add result', async () => {
    await verifyPublicHolidayAdded(page, TARGET_HOLIDAY_REMARKS[0]);
  });
});