import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS } from '../../testData';
import { LoginPage } from '../../tests/pages/LoginPage';
import { WorkerGroupPage, NewWorkerGroupInput } from './WorkerGroup';

function buildNewWorkerGroup(): NewWorkerGroupInput {
  const uniqueId = Date.now().toString().slice(-6);
  return {
    // TODO: swap in an estate that exists in your test environment.
    estate: 'Banjaran Majusama',
    groupName: `Auto Worker Group ${uniqueId}`,
  };
}

async function navigateToAddWorkerGroup(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/maintain_worker_group_add`);
}

async function fillWorkerGroupForm(workerGroupPage: WorkerGroupPage, workerGroup: NewWorkerGroupInput) {
  await workerGroupPage.addWorkerGroup(workerGroup);
}

async function verifyWorkerGroupSaved(page: Page) {
  const successToast = page.getByText(/success|saved/i).first();
  const backToListButton = page.getByRole('button', { name: /back to list/i }).first();

  // Save may show a toast, stay on Add page with Back to list, or return directly to list.
  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    backToListButton.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    page.waitForURL(/maintain_worker_group(\?|$)/i, { timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const hasBackToList = await backToListButton.isVisible().catch(() => false);
  const onWorkerGroupListPage = /maintain_worker_group(\?|$)/i.test(page.url());

  expect(hasSuccessToast || hasBackToList || onWorkerGroupListPage).toBeTruthy();
}

test('[OP Worker Group] Add Worker Group - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const workerGroupPage = new WorkerGroupPage(page);
  const workerGroup = buildNewWorkerGroup();

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Add Worker Group page', async () => {
    await navigateToAddWorkerGroup(page);
    await expect(workerGroupPage.estateSelect).toBeVisible({ timeout: 15000 });
  });

  await test.step('Fill and save worker group form', async () => {
    await fillWorkerGroupForm(workerGroupPage, workerGroup);
  });

  await test.step('Verify save result', async () => {
    await verifyWorkerGroupSaved(page);
  });
});