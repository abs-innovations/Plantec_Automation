import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS, OP_JOB_CODE_DATA } from '../../../testData';
import { LoginPage } from '../../../tests/pages/LoginPage';
import { JobCodePage } from './JobCodePage';

const TARGET_JOB_CODE = OP_JOB_CODE_DATA.targetJobCode;
const updatedName = `Edited Job ${Date.now().toString().slice(-6)}`;

async function navigateToJobCodeList(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/job_code`);
}

async function openEditJobCode(page: Page, jobCode: string) {
  const row = page.getByRole('row', { name: new RegExp(jobCode, 'i') });
  await row.getByTitle('Edit').click();
}

async function verifyJobCodeUpdated(page: Page, name: string) {
  const successToast = page.getByText(/success|saved|updated/i).first();
  const listHeading = page.getByRole('heading', { name: 'Job Code Management' });
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

test('[OP Job Code] Edit Job Code - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const jobCodePage = new JobCodePage(page);

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Navigate to Job Code list and open Edit form', async () => {
    await navigateToJobCodeList(page);
    await openEditJobCode(page, TARGET_JOB_CODE);
    await expect(jobCodePage.nameInput).toBeVisible({ timeout: 15000 });
  });

  await test.step('Update name and save', async () => {
    await jobCodePage.nameInput.fill(updatedName);
    await jobCodePage.saveButton.click();
  });

  await test.step('Verify update result', async () => {
    await verifyJobCodeUpdated(page, updatedName);
  });
});
