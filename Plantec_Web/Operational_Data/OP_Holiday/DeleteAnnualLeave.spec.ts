import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS, OP_ANNUAL_LEAVE_DATA } from '../../testData';
import { LoginPage } from '../../tests/pages/LoginPage';

const TARGET_ANNUAL_LEAVE_REMARK = OP_ANNUAL_LEAVE_DATA.targetRemark;

async function navigateToHolidayList(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/holiday`);
}

async function openAnnualLeaveWorkerTab(page: Page) {
  await page.getByRole('link', { name: 'Annual Leave Worker', exact: true }).click();
}

async function deleteAnnualLeave(page: Page, remark: string) {
  const row = page.getByRole('row', { name: new RegExp(remark, 'i') });
  await row.getByTitle('Delete').click();
}

async function confirmDeletion(page: Page) {
  page.once('dialog', (dialog) => dialog.accept());
  const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
  const isVisible = await confirmButton.isVisible().catch(() => false);
  if (isVisible) await confirmButton.click();
}

async function verifyAnnualLeaveDeleted(page: Page, remark: string) {
  const successToast = page.getByText(/success|deleted|removed/i).first();
  const deletedCell = page.getByRole('cell', { name: remark });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    deletedCell.waitFor({ state: 'hidden', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const recordGone = !(await deletedCell.isVisible().catch(() => false));

  expect(hasSuccessToast || recordGone).toBeTruthy();
}

test('[OP Holiday] Delete Annual Leave Worker - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Annual Leave Worker tab', async () => {
    await navigateToHolidayList(page);
    await openAnnualLeaveWorkerTab(page);
  });

  await test.step('Delete annual leave record', async () => {
    await deleteAnnualLeave(page, TARGET_ANNUAL_LEAVE_REMARK);
    await confirmDeletion(page);
  });

  await test.step('Verify deletion result', async () => {
    await verifyAnnualLeaveDeleted(page, TARGET_ANNUAL_LEAVE_REMARK);
  });
});
