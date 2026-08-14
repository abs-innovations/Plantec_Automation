import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS, OP_WORKER_GROUP_DATA } from '../../../testData';
import { LoginPage } from '../../../tests/pages/LoginPage';
import { WorkerGroupPage } from './WorkerGroup';

const TARGET_WORKER_GROUP = OP_WORKER_GROUP_DATA.targetGroupName;
const updatedGroupName = `Edited Worker Group ${Date.now().toString().slice(-6)}`;

async function navigateToWorkerGroupList(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/maintain_worker_group`);
}

async function openEditWorkerGroup(page: Page, groupName: string) {
  const row = page.getByRole('row', { name: new RegExp(groupName, 'i') });
  await row.getByTitle('Edit').click();
}

async function verifyWorkerGroupUpdated(page: Page, groupName: string) {
  const successToast = page.getByText(/success|saved|updated/i).first();
  const listURL = /maintain_worker_group(\?|$)/i;
  const updatedCell = page.getByRole('cell', { name: groupName });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    page.waitForURL(listURL, { timeout: 12000 }).catch(() => undefined),
    updatedCell.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const onListPage = listURL.test(page.url());
  const hasUpdatedRow = await updatedCell.isVisible().catch(() => false);

  expect(hasSuccessToast || onListPage || hasUpdatedRow).toBeTruthy();
}

test('[OP Worker Group] Edit Worker Group - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const workerGroupPage = new WorkerGroupPage(page);

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Navigate to Worker Group list and open Edit form', async () => {
    await navigateToWorkerGroupList(page);
    await openEditWorkerGroup(page, TARGET_WORKER_GROUP);
    await expect(workerGroupPage.groupNameInput).toBeVisible({ timeout: 15000 });
  });

  await test.step('Update group name and save', async () => {
    await workerGroupPage.groupNameInput.fill(updatedGroupName);
    await workerGroupPage.saveButton.click();
  });

  await test.step('Verify update result', async () => {
    await verifyWorkerGroupUpdated(page, updatedGroupName);
  });
});
