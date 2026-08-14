import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS, OP_JOB_CODE_DATA } from '../testData';
import { LoginPage } from '../tests/pages/LoginPage';

const TARGET_JOB_CODE = OP_JOB_CODE_DATA.targetJobCode;

async function navigateToJobCodeList(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/job_code`);
}

async function deleteJobCode(page: Page, jobCode: string) {
  const row = page.getByRole('row', { name: new RegExp(jobCode, 'i') });
  await row.getByTitle('Delete').click();
}

async function confirmDeletion(page: Page) {
  page.once('dialog', (dialog) => dialog.accept());
  const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
  const isVisible = await confirmButton.isVisible().catch(() => false);
  if (isVisible) await confirmButton.click();
}

async function verifyJobCodeDeleted(page: Page, jobCode: string) {
  const successToast = page.getByText(/success|deleted|removed/i).first();
  const deletedCell = page.getByRole('cell', { name: jobCode });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    deletedCell.waitFor({ state: 'hidden', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const recordGone = !(await deletedCell.isVisible().catch(() => false));

  expect(hasSuccessToast || recordGone).toBeTruthy();
}

test('[OP Job Code] Delete Job Code - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Navigate to Job Code list and delete record', async () => {
    await navigateToJobCodeList(page);
    await deleteJobCode(page, TARGET_JOB_CODE);
    await confirmDeletion(page);
  });

  await test.step('Verify deletion result', async () => {
    await verifyJobCodeDeleted(page, TARGET_JOB_CODE);
  });
});
