import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS, OP_WORKER_DATA } from '../../testData';
import { LoginPage } from '../../tests/pages/LoginPage';
import { WorkerConfigurationPage } from './WorkerPage';

const TARGET_WORKER_GROUP = OP_WORKER_DATA.workerGroup;
const TARGET_EMPLOYEE_CODE = OP_WORKER_DATA.targetEmployeeCode;
const updatedWorkerName = `Edited Worker ${Date.now().toString().slice(-6)}`;

async function navigateToWorkerGroupList(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/maintain_worker_group`);
}

async function openWorkerGroupDetails(page: Page, groupName: string) {
  const row = page.getByRole('row', { name: new RegExp(groupName, 'i') });
  await row.getByTitle('View Details').click();
}

async function openEditWorker(page: Page, employeeCode: string) {
  const row = page.getByRole('row', { name: new RegExp(employeeCode, 'i') });
  await row.getByTitle('Edit').click();
}

async function verifyWorkerUpdated(page: Page, workerName: string) {
  const successToast = page.getByText(/success|saved|updated/i).first();
  const listHeading = page.getByRole('heading', { name: 'Worker Management' });
  const updatedCell = page.getByRole('cell', { name: workerName });

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

test('[OP Worker] Edit Worker - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const workerConfigPage = new WorkerConfigurationPage(page);

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Worker Group and find worker', async () => {
    await navigateToWorkerGroupList(page);
    await openWorkerGroupDetails(page, TARGET_WORKER_GROUP);
    await expect(page.getByRole('heading', { name: 'Worker Management' })).toBeVisible({ timeout: 15000 });
  });

  await test.step('Open Edit Worker form', async () => {
    await openEditWorker(page, TARGET_EMPLOYEE_CODE);
    await expect(workerConfigPage.workerNameInput).toBeVisible({ timeout: 15000 });
  });

  await test.step('Update worker name and save', async () => {
    await workerConfigPage.workerNameInput.fill(updatedWorkerName);
    await workerConfigPage.saveButton.click();
  });

  await test.step('Verify update result', async () => {
    await verifyWorkerUpdated(page, updatedWorkerName);
  });
});
