import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS, OP_WORKER_GROUP_DATA } from '../../testData';
import { LoginPage } from '../../tests/pages/LoginPage';

const TARGET_WORKER_GROUP = OP_WORKER_GROUP_DATA.targetGroupName;

async function navigateToWorkerGroupList(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/maintain_worker_group`);
}

async function deleteWorkerGroup(page: Page, groupName: string) {
  const row = page.getByRole('row', { name: new RegExp(groupName, 'i') });
  await row.getByTitle('Delete').click();
}

async function confirmDeletion(page: Page) {
  page.once('dialog', (dialog) => dialog.accept());
  const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
  const isVisible = await confirmButton.isVisible().catch(() => false);
  if (isVisible) await confirmButton.click();
}

async function verifyWorkerGroupDeleted(page: Page, groupName: string) {
  const successToast = page.getByText(/success|deleted|removed/i).first();
  const deletedCell = page.getByRole('cell', { name: groupName });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    deletedCell.waitFor({ state: 'hidden', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const recordGone = !(await deletedCell.isVisible().catch(() => false));

  expect(hasSuccessToast || recordGone).toBeTruthy();
}

test('[OP Worker Group] Delete Worker Group - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Navigate to Worker Group list and delete record', async () => {
    await navigateToWorkerGroupList(page);
    await deleteWorkerGroup(page, TARGET_WORKER_GROUP);
    await confirmDeletion(page);
  });

  await test.step('Verify deletion result', async () => {
    await verifyWorkerGroupDeleted(page, TARGET_WORKER_GROUP);
  });
});
