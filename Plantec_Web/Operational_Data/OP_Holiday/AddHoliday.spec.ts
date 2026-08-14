import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS } from '../../testData';
import { LoginPage } from '../../tests/pages/LoginPage';
import { HolidayPage, NewHolidayInput } from './HolidayPage';

function buildNewHoliday(): NewHolidayInput {
  const uniqueId = Date.now().toString().slice(-6);
  return {
    // Any estate/holiday type works - swap these for whichever you want covered.
    estate: 'Banjaran Majusama',
    holidayType: 'Public Holiday (PH)',
    remark: `Auto Holiday ${uniqueId}`,
  };
}

async function navigateToHolidayList(page: Page) {
  // TODO: confirm this matches your actual Holiday Management URL slug.
  await page.goto(`${BASE_URL.replace('/index', '')}/holiday`);
}

async function ensureHolidayManagementTab(page: Page) {
  const tab = page.getByRole('link', { name: 'Holiday Management', exact: true });
  await tab.click();
}

async function openAddHoliday(page: Page) {
  await page.getByRole('link', { name: 'Add New Holiday' }).click();
}

async function verifyHolidaySaved(page: Page, remark: string) {
  const successToast = page.getByText(/success|saved/i).first();
  const holidayListHeading = page.getByRole('heading', { name: 'Holiday Management' });
  const newHolidayCell = page.getByRole('cell', { name: remark });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    holidayListHeading.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    newHolidayCell.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const backOnHolidayList = await holidayListHeading.isVisible().catch(() => false);
  const hasNewHolidayRow = await newHolidayCell.isVisible().catch(() => false);

  expect(hasSuccessToast || backOnHolidayList || hasNewHolidayRow).toBeTruthy();
}

test('[OP Holiday] Add Holiday - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const holidayPage = new HolidayPage(page);
  const holidayData = buildNewHoliday();

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Holiday Management tab', async () => {
    await navigateToHolidayList(page);
    await ensureHolidayManagementTab(page);
  });

  await test.step('Open Add New Holiday form', async () => {
    await openAddHoliday(page);
    await expect(holidayPage.estateSelect).toBeVisible({ timeout: 15000 });
  });

  await test.step('Fill and save holiday form', async () => {
    await holidayPage.fillAndSave(holidayData);
  });

  await test.step('Verify save result', async () => {
    await verifyHolidaySaved(page, holidayData.remark);
  });
});