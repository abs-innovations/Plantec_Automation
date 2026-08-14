import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS, OP_HOLIDAY_TYPE_DATA } from '../../../testData';
import { LoginPage } from '../../../tests/pages/LoginPage';

const TARGET_HOLIDAY_TYPE_NAME = OP_HOLIDAY_TYPE_DATA.targetName;

async function navigateToHolidayList(page: Page) {
  await page.goto(`${BASE_URL.replace('/index', '')}/holiday`);
}

async function openHolidayTypeTab(page: Page) {
  await page.getByRole('link', { name: 'Holiday Type', exact: true }).click();
}

async function deleteHolidayType(page: Page, name: string) {
  const row = page.getByRole('row', { name: new RegExp(name, 'i') });
  await row.getByTitle('Delete').click();
}

async function confirmDeletion(page: Page) {
  page.once('dialog', (dialog) => dialog.accept());
  const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
  const isVisible = await confirmButton.isVisible().catch(() => false);
  if (isVisible) await confirmButton.click();
}

async function verifyHolidayTypeDeleted(page: Page, name: string) {
  const successToast = page.getByText(/success|deleted|removed/i).first();
  const deletedCell = page.getByRole('cell', { name });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    deletedCell.waitFor({ state: 'hidden', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const recordGone = !(await deletedCell.isVisible().catch(() => false));

  expect(hasSuccessToast || recordGone).toBeTruthy();
}

test('[OP Holiday] Delete Holiday Type - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Holiday Type tab', async () => {
    await navigateToHolidayList(page);
    await openHolidayTypeTab(page);
  });

  await test.step('Delete holiday type', async () => {
    await deleteHolidayType(page, TARGET_HOLIDAY_TYPE_NAME);
    await confirmDeletion(page);
  });

  await test.step('Verify deletion result', async () => {
    await verifyHolidayTypeDeleted(page, TARGET_HOLIDAY_TYPE_NAME);
  });
});
