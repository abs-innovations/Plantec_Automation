import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS } from '../../../testData';
import { LoginPage } from '../../../tests/pages/LoginPage';
import { NewWorkerConfigurationInput, WorkerConfigurationPage } from './WorkerPage';

// TODO: swap for whichever Worker Group you want this test to add a worker into.
const TARGET_WORKER_GROUP = 'Harvester Oil Palm';

function buildNewWorker(): NewWorkerConfigurationInput {
  const uniqueId = Date.now().toString().slice(-6);
  return {
    employeeCode: `AUTO${uniqueId}`,
    workerName: `Auto Worker ${uniqueId}`,
    primaryRole: 'Driver',
    labourType: 'Checkroll',
    rateType: 'Daily Rate',
  };
}

async function navigateToWorkerGroupList(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/maintain_worker_group`);
}

async function openWorkerGroupDetails(page: Page, groupName: string) {
  const row = page.getByRole('row', { name: new RegExp(groupName, 'i') });
  // Eye icon in the Actions column shows a "View Details" tooltip - assumed to be a title attribute.
  await row.getByTitle('View Details').click();
}

async function openAddWorker(page: Page) {
  // exact: true avoids matching "Add Worker From Database" which also contains "Add Worker".
  await page.getByRole('button', { name: 'Add Worker', exact: true }).click();
}

async function verifyWorkerSaved(page: Page, employeeCode: string) {
  const successToast = page.getByText(/success|saved/i).first();
  const workerManagementHeading = page.getByRole('heading', { name: 'Worker Management' });
  const newWorkerCell = page.getByRole('cell', { name: employeeCode });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    workerManagementHeading.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    newWorkerCell.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const backOnWorkerManagement = await workerManagementHeading.isVisible().catch(() => false);
  const hasNewWorkerRow = await newWorkerCell.isVisible().catch(() => false);

  expect(hasSuccessToast || backOnWorkerManagement || hasNewWorkerRow).toBeTruthy();
}

test('[OP Worker] Add Worker via Worker Group - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const workerConfigPage = new WorkerConfigurationPage(page);
  const worker = buildNewWorker();

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open a Worker Group and view its workers', async () => {
    await navigateToWorkerGroupList(page);
    await openWorkerGroupDetails(page, TARGET_WORKER_GROUP);
    await expect(page.getByRole('heading', { name: 'Worker Management' })).toBeVisible({ timeout: 15000 });
  });

  await test.step('Open Add Worker form', async () => {
    await openAddWorker(page);
    await expect(workerConfigPage.employeeCodeInput).toBeVisible({ timeout: 15000 });
  });

  await test.step('Fill and save worker configuration', async () => {
    await workerConfigPage.fillAndSave(worker);
  });

  await test.step('Verify save result', async () => {
    await verifyWorkerSaved(page, worker.employeeCode);
  });
});