import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS, OP_HOLIDAY_DATA } from '../../testData';
import { LoginPage } from '../../tests/pages/LoginPage';
import { HolidayPage } from './HolidayPage';

const TARGET_HOLIDAY_REMARK = OP_HOLIDAY_DATA.targetRemark;
const updatedRemark = `Edited Holiday ${Date.now().toString().slice(-6)}`;

async function navigateToHolidayList(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/holiday`);
}

async function ensureHolidayManagementTab(page: Page) {
  await page.getByRole('link', { name: 'Holiday Management', exact: true }).click();
}

async function openEditHoliday(page: Page, remark: string) {
  const row = page.getByRole('row', { name: new RegExp(remark, 'i') });
  await row.getByTitle('Edit').click();
}

async function verifyHolidayUpdated(page: Page, remark: string) {
  const successToast = page.getByText(/success|saved|updated/i).first();
  const listHeading = page.getByRole('heading', { name: 'Holiday Management' });
  const updatedCell = page.getByRole('cell', { name: remark });

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

test('[OP Holiday] Edit Holiday - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const holidayPage = new HolidayPage(page);

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Holiday Management tab', async () => {
    await navigateToHolidayList(page);
    await ensureHolidayManagementTab(page);
  });

  await test.step('Open Edit Holiday form', async () => {
    await openEditHoliday(page, TARGET_HOLIDAY_REMARK);
    await expect(holidayPage.remarkInput).toBeVisible({ timeout: 15000 });
  });

  await test.step('Update remark and save', async () => {
    await holidayPage.remarkInput.fill(updatedRemark);
    await holidayPage.saveButton.click();
  });

  await test.step('Verify update result', async () => {
    await verifyHolidayUpdated(page, updatedRemark);
  });
});
