import { expect, Page, test } from '@playwright/test';
import { BASE_URL, LOGIN_CREDENTIALS } from '../../testData';
import { LoginPage } from '../../tests/pages/LoginPage';
import { JobCodePage, NewJobCodeInput } from './JobCodePage';

function randomLetters(length: number) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += letters[Math.floor(Math.random() * letters.length)];
  }
  return result;
}

function buildNewJobCode(): NewJobCodeInput {
  const uniqueId = Date.now().toString().slice(-6);
  return {
    // Any module works - swap this for whichever module you want covered.
    moduleName: 'FFB Harvesting',
    jobCode: randomLetters(4), // "Max 4 Letters Only"
    checkrollSymbol: randomLetters(2), // "Max 2 Letters Only"
    name: `Auto Job ${uniqueId}`,
  };
}

async function navigateToJobCodeList(page: Page) {
  // TODO: confirm this matches your actual Job Code Management URL slug.
  await page.goto(`${BASE_URL.replace('/index', '')}/job_code`);
}

async function openAddJobCode(page: Page) {
  await page.getByRole('link', { name: 'Add New Job Code' }).click();
}

async function verifyJobCodeSaved(page: Page, jobCode: string) {
  const successToast = page.getByText(/success|saved/i).first();
  const jobCodeListHeading = page.getByRole('heading', { name: 'Job Code Management' });
  const newJobCodeCell = page.getByRole('cell', { name: jobCode });

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    jobCodeListHeading.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    newJobCodeCell.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
  ]);

  const hasSuccessToast = await successToast.isVisible().catch(() => false);
  const backOnJobCodeList = await jobCodeListHeading.isVisible().catch(() => false);
  const hasNewJobCodeRow = await newJobCodeCell.isVisible().catch(() => false);

  expect(hasSuccessToast || backOnJobCodeList || hasNewJobCodeRow).toBeTruthy();
}

test('[OP Job Code] Add Job Code - basic flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const jobCodePage = new JobCodePage(page);
  const jobCodeData = buildNewJobCode();

  await test.step('Login', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Open Job Code list and go to Add New Job Code', async () => {
    await navigateToJobCodeList(page);
    await openAddJobCode(page);
    await expect(jobCodePage.moduleSelect).toBeVisible({ timeout: 15000 });
  });

  await test.step('Fill and save job code form', async () => {
    await jobCodePage.fillAndSave(jobCodeData);
  });

  await test.step('Verify save result', async () => {
    await verifyJobCodeSaved(page, jobCodeData.jobCode);
  });
});