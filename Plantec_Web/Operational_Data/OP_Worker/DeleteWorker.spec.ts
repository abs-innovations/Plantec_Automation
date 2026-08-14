import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS, OP_WORKER_DATA } from '../../../testData';
import { LoginPage } from '../../../tests/pages/LoginPage';

const TARGET_WORKER_GROUP = OP_WORKER_DATA.workerGroup;
const TARGET_EMPLOYEE_CODE = OP_WORKER_DATA.targetEmployeeCode;

async function navigateToWorkerGroupList(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/maintain_worker_group`);
}

async function openWorkerGroupDetails(page: Page, groupName: string) {
  const row = page.getByRole('row', { name: new RegExp(groupName, 'i') });
  await row.getByTitle('View Details').click();
}

async function deleteWorker(page: Page, employeeCode: string) {
  const row = page.getByRole('row', { name: new RegExp(employeeCode, 'i') });
  await row.getByTitle('Delete').click();
}

async function confirmDeletion(page: Page) {
  page.once('dialog', (dialog) => dialog.accept());
  const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
  const isVisible = await confirmButton.isVisible().catch(() => false);
  if (isVisible) await confirmButton.click();
}

async function verifyWorkerDeleted(page: Page, employeeCode: string) {
  const successToast = page.getByText(/success|deleted|removed/i).first();
  const deletedCell = page.getByRole('cell', { name: employeeCode });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    deletedCell.waitFor({ state: 'hidden', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const recordGone = !(await deletedCell.isVisible().catch(() => false));

  expect(hasSuccessToast || recordGone).toBeTruthy();
}

test('[OP Worker] Delete Worker - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Worker Group and find worker', async () => {
    await navigateToWorkerGroupList(page);
    await openWorkerGroupDetails(page, TARGET_WORKER_GROUP);
    await expect(page.getByRole('heading', { name: 'Worker Management' })).toBeVisible({ timeout: 15000 });
  });

  await test.step('Delete worker', async () => {
    await deleteWorker(page, TARGET_EMPLOYEE_CODE);
    await confirmDeletion(page);
  });

  await test.step('Verify deletion result', async () => {
    await verifyWorkerDeleted(page, TARGET_EMPLOYEE_CODE);
  });
});
