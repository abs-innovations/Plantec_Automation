import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS } from '../../testData';
import { LoginPage } from '../../tests/pages/LoginPage';
import { AnnualLeavePage, NewAnnualLeaveInput } from './AnnualLeavePage';

// TODO: swap these for an estate / worker group / worker that actually exist in your test data.
const TARGET_ESTATE = 'Titiwangsa';
const TARGET_WORKER_GROUP = 'Harvester Oil Palm';
const TARGET_WORKER = 'Ahmad Hasan';

function buildNewAnnualLeave(): NewAnnualLeaveInput {
  const uniqueId = Date.now().toString().slice(-6);
  return {
    estate: TARGET_ESTATE,
    workerGroup: TARGET_WORKER_GROUP,
    worker: TARGET_WORKER,
    remark: `Auto Annual Leave ${uniqueId}`,
    // absentReason/startDate/endDate left undefined so the form's defaults are used.
  };
}

async function navigateToHolidayList(page: Page) {
  // TODO: confirm this matches your actual Holiday Management URL slug.
  await page.goto(`${BASE_URL.replace('/index', '')}/holiday`);
}

async function openAnnualLeaveWorkerTab(page: Page) {
  await page.getByRole('link', { name: 'Annual Leave Worker', exact: true }).click();
}

async function openAddAnnualLeave(page: Page) {
  await page.getByRole('link', { name: 'Add New Annual Leave' }).click();
}

async function verifyAnnualLeaveSaved(page: Page, remark: string) {
  const successToast = page.getByText(/success|saved/i).first();
  const holidayManagementHeading = page.getByRole('heading', { name: 'Holiday Management' });
  const newLeaveCell = page.getByRole('cell', { name: remark });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    holidayManagementHeading.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    newLeaveCell.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const backOnHolidayManagement = await holidayManagementHeading.isVisible().catch(() => false);
  const hasNewLeaveRow = await newLeaveCell.isVisible().catch(() => false);

  expect(hasSuccessToast || backOnHolidayManagement || hasNewLeaveRow).toBeTruthy();
}

test('[OP Holiday] Add Annual Leave Worker - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const annualLeavePage = new AnnualLeavePage(page);
  const annualLeaveData = buildNewAnnualLeave();

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Annual Leave Worker tab and go to Add New Annual Leave', async () => {
    await navigateToHolidayList(page);
    await openAnnualLeaveWorkerTab(page);
    await openAddAnnualLeave(page);
    await expect(annualLeavePage.estateSelect).toBeVisible({ timeout: 15000 });
  });

  await test.step('Fill and save annual leave form', async () => {
    await annualLeavePage.fillAndSave(annualLeaveData);
  });

  await test.step('Verify save result', async () => {
    await verifyAnnualLeaveSaved(page, annualLeaveData.remark);
  });
});