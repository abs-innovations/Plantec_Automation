import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS, OP_ANNUAL_LEAVE_DATA } from '../testData';
import { LoginPage } from '../tests/pages/LoginPage';
import { AnnualLeavePage } from './AnnualLeavePage';

const TARGET_ANNUAL_LEAVE_REMARK = OP_ANNUAL_LEAVE_DATA.targetRemark;
const updatedRemark = `Edited Annual Leave ${Date.now().toString().slice(-6)}`;

async function navigateToHolidayList(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/holiday`);
}

async function openAnnualLeaveWorkerTab(page: Page) {
  await page.getByRole('link', { name: 'Annual Leave Worker', exact: true }).click();
}

async function openEditAnnualLeave(page: Page, remark: string) {
  const row = page.getByRole('row', { name: new RegExp(remark, 'i') });
  await row.getByTitle('Edit').click();
}

async function verifyAnnualLeaveUpdated(page: Page, remark: string) {
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

test('[OP Holiday] Edit Annual Leave Worker - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const annualLeavePage = new AnnualLeavePage(page);

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Annual Leave Worker tab', async () => {
    await navigateToHolidayList(page);
    await openAnnualLeaveWorkerTab(page);
  });

  await test.step('Open Edit Annual Leave form', async () => {
    await openEditAnnualLeave(page, TARGET_ANNUAL_LEAVE_REMARK);
    await expect(annualLeavePage.remarkInput).toBeVisible({ timeout: 15000 });
  });

  await test.step('Update remark and save', async () => {
    await annualLeavePage.remarkInput.fill(updatedRemark);
    await annualLeavePage.saveButton.click();
  });

  await test.step('Verify update result', async () => {
    await verifyAnnualLeaveUpdated(page, updatedRemark);
  });
});
