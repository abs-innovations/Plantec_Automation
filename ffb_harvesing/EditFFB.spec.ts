import { expect, Locator, Page, test } from '@playwright/test';
import { LoginPage } from '../tests/pages/LoginPage';
import { BASE_URL, LOGIN_CREDENTIALS } from '../testData';

const TEST_CASE_CODE = 'FFB-156';
const TEST_CASE_NAME = 'Edit FFB';

const UPDATED_VALUES = {
  harvestedBunches: '500',
  looseFruit: '15',
  underRipe: '5',
} as const;

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function selectOrganization(page: Page) {
  await page.locator('div').filter({ hasText: /^\[SLDB\]Sabah Land Development Board$/ }).first().click();
  await expect(page.getByText('Dashboard')).toBeVisible();
}

async function navigateToHarvestingList(page: Page) {
  const harvestingMenu = page.locator('a[href="javascript:void(0);"]', { hasText: 'FFB Harvesting' }).first();
  if ((await harvestingMenu.getAttribute('aria-expanded')) !== 'true') {
    await harvestingMenu.click();
  }

  await page.locator('a[href="harvesting"]').first().click();
  await expect(page).toHaveURL(/harvesting(\?|$)/i);
}

async function getListRow(page: Page): Promise<Locator> {
  const tableRows = page.locator('table tbody tr');
  await expect(tableRows.first()).toBeVisible({ timeout: 15000 });
  return tableRows.first();
}

async function getDetailsRowWithHarvestedBunchesValue(page: Page): Promise<Locator> {
  const headers = page.locator('table thead th');
  const headerCount = await headers.count();
  let harvestedBunchesColumnIndex = -1;

  for (let i = 0; i < headerCount; i += 1) {
    const headerText = (await headers.nth(i).innerText()).trim().replace(/\s+/g, ' ').toLowerCase();
    if (headerText.includes('total harvested bunches')) {
      harvestedBunchesColumnIndex = i + 1;
      break;
    }
  }

  if (harvestedBunchesColumnIndex === -1) {
    throw new Error('Unable to find Total Harvested Bunches column in details table.');
  }

  const rows = page.locator('table tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: 15000 });
  const rowCount = await rows.count();

  for (let i = 0; i < rowCount; i += 1) {
    const row = rows.nth(i);
    const bunchesCell = row.locator(`td:nth-child(${harvestedBunchesColumnIndex})`).first();
    const bunchesValue = (await bunchesCell.innerText()).trim();
    if (bunchesValue && bunchesValue !== '-' && bunchesValue !== '0') {
      return row;
    }
  }

  throw new Error('No transaction row with Total Harvested Bunches value was found.');
}

async function extractTransactionKeyword(row: Locator): Promise<string> {
  const rowText = (await row.innerText()).trim().replace(/\s+/g, ' ');
  const match = rowText.match(/[A-Z]{1,6}[-/]?\d{2,}|\d{6,}/);
  return match?.[0] ?? rowText.split(' ').slice(0, 3).join(' ');
}

async function scrollTableToRight(page: Page) {
  const scrollCandidates = [
    page.locator('.dataTables_scrollBody').first(),
    page.locator('.table-responsive').first(),
    page.locator('div').filter({ has: page.locator('table') }).first(),
  ];

  for (const container of scrollCandidates) {
    if (await container.isVisible().catch(() => false)) {
      await container.evaluate((el) => {
        el.scrollLeft = el.scrollWidth;
      }).catch(() => undefined);
      return;
    }
  }

  await page.mouse.wheel(5000, 0).catch(() => undefined);
}

async function isDetailsPageTable(page: Page): Promise<boolean> {
  const actionHeader = page.locator('table thead th').filter({ hasText: /^ACTION$/i }).first();
  if (await actionHeader.isVisible().catch(() => false)) {
    return true;
  }

  const ffbDocketHeader = page.locator('table thead th').filter({ hasText: /FFB DOCKET/i }).first();
  return ffbDocketHeader.isVisible().catch(() => false);
}

async function hasTransactionEditActions(page: Page): Promise<boolean> {
  await scrollTableToRight(page);

  const actionCellTargets = page.locator('table tbody tr td:last-child a, table tbody tr td:last-child button');
  if (await actionCellTargets.first().isVisible().catch(() => false)) {
    return true;
  }

  const editIcon = page.locator('table tbody tr button[title*="Edit" i], table tbody tr a[title*="Edit" i]').first();
  if (await editIcon.isVisible().catch(() => false)) {
    return true;
  }

  const editTextButton = page.getByRole('button', { name: /edit/i }).first();
  if (await editTextButton.isVisible().catch(() => false)) {
    return true;
  }

  const editClassIcon = page.locator('table tbody tr i.fa-edit, table tbody tr i.fa-pencil').first();
  return editClassIcon.isVisible().catch(() => false);
}

async function clickFirstColumnToDrillDown(row: Locator) {
  const firstColumnCandidates = [
    row.locator('td').first().getByRole('link').first(),
    row.locator('td').first().getByRole('button').first(),
    row.locator('td:first-child a, td:first-child button').first(),
    row.locator('td').first(),
  ];

  for (const candidate of firstColumnCandidates) {
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click();
      return;
    }
  }

  throw new Error('Unable to click first column to drill down.');
}

async function drillDownToTransactionDetails(page: Page, maxDepth = 8) {
  for (let depth = 0; depth < maxDepth; depth += 1) {
    await getListRow(page);

    if ((await isDetailsPageTable(page)) && (await hasTransactionEditActions(page))) {
      return;
    }

    const currentFirstRow = await getListRow(page);
    await clickFirstColumnToDrillDown(currentFirstRow);

    await Promise.race([
      page.waitForLoadState('networkidle').catch(() => undefined),
      page.waitForTimeout(1000),
    ]);
  }

  throw new Error('Reached maximum drill-down depth before finding transaction Edit icon in details page.');
}

async function clickTransactionEditFromDetails(page: Page) {
  await scrollTableToRight(page);

  const txRow = await getDetailsRowWithHarvestedBunchesValue(page);

  const editCandidates = [
    txRow.locator('td:last-child a[title*="Edit" i], td:last-child button[title*="Edit" i]').first(),
    txRow.locator('td:last-child a:has(i.fa-pencil), td:last-child a:has(i.fa-edit), td:last-child button:has(i.fa-pencil), td:last-child button:has(i.fa-edit)').first(),
    txRow.locator('td:last-child a, td:last-child button').first(),
    txRow.getByRole('button', { name: /edit/i }).first(),
    txRow.getByRole('link', { name: /edit/i }).first(),
    txRow.locator('button[title*="Edit" i], a[title*="Edit" i]').first(),
    txRow.locator('button i.fa-edit, a i.fa-edit, i.fa-pencil, i.fa-edit').first(),
    txRow.locator('td:last-child button, td:last-child a').first(),
  ];

  for (const candidate of editCandidates) {
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click();
      return;
    }
  }

  throw new Error('Unable to find transaction Edit icon/button in Details page.');
}

async function fillTextboxByName(page: Page, fieldName: string, value: string) {
  const input = page.getByRole('textbox', { name: new RegExp(escapeForRegex(fieldName), 'i') }).first();
  await expect(input).toBeVisible({ timeout: 15000 });
  await input.fill(value);
}

async function clickSave(page: Page) {
  const saveCandidates = [
    page.getByRole('button', { name: /\bsave\b/i }).first(),
    page.locator('button:has-text("Save")').first(),
    page.locator('button[type="submit"]').first(),
  ];

  for (const candidate of saveCandidates) {
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click();
      return;
    }
  }

  throw new Error('Unable to find Save button on Edit FFB page.');
}

async function clickBackToListAfterSave(page: Page) {
  await Promise.race([
    page.getByRole('heading', { name: /success/i }).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined),
    page.getByText(/successfully updated harvesting record|success|updated|saved/i).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined),
  ]);

  const backToList = page
    .locator('button:has-text("Back to list"):visible, a:has-text("Back to list"):visible')
    .first();

  await expect(backToList).toBeVisible({ timeout: 15000 });
  await backToList.click();

  await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 20000 });
}

async function searchListByKeyword(page: Page, keyword: string) {
  const searchInputCandidates = [
    page.getByRole('searchbox').first(),
    page.getByPlaceholder(/search/i).first(),
    page.locator('input[type="search"], input[placeholder*="Search" i]').first(),
  ];

  for (const input of searchInputCandidates) {
    if (await input.isVisible().catch(() => false)) {
      await input.fill(keyword);
      await input.press('Enter').catch(() => undefined);
      return;
    }
  }
}

async function verifyUpdatedValuesInCurrentTable(page: Page, keyword: string) {
  await searchListByKeyword(page, keyword);
  const row = await getListRow(page);

  await expect(row).toContainText(UPDATED_VALUES.harvestedBunches);
  await expect(row).toContainText(UPDATED_VALUES.looseFruit);
  await expect(row).toContainText(UPDATED_VALUES.underRipe);
}

async function navigateToWebReport(page: Page) {
  const harvestingMenu = page.locator('a[href="javascript:void(0);"]', { hasText: 'FFB Harvesting' }).first();
  if ((await harvestingMenu.getAttribute('aria-expanded')) !== 'true') {
    await harvestingMenu.click();
  }

  const webReportCandidates = [
    page.getByRole('link', { name: /web report/i }).first(),
    page.locator('a[href*="report" i], a[href*="web" i]').filter({ hasText: /web report/i }).first(),
    page.locator('a').filter({ hasText: /web report/i }).first(),
  ];

  for (const candidate of webReportCandidates) {
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click();
      return;
    }
  }

  throw new Error('Unable to find Web Report menu in FFB Harvesting module.');
}

async function searchTransactionInWebReport(page: Page, keyword: string) {
  const searchInputCandidates = [
    page.getByRole('searchbox').first(),
    page.getByPlaceholder(/search/i).first(),
    page.locator('input[type="search"], input[placeholder*="Search" i], input[name*="search" i]').first(),
  ];

  for (const input of searchInputCandidates) {
    if (await input.isVisible().catch(() => false)) {
      await input.fill(keyword);
      await input.press('Enter').catch(() => undefined);
      break;
    }
  }

  await expect(
    page.getByText(new RegExp(`${escapeForRegex(keyword)}|${UPDATED_VALUES.harvestedBunches}`, 'i')).first(),
  ).toBeVisible({ timeout: 15000 });
}

test(TEST_CASE_NAME, async ({ page }) => {
  test.setTimeout(180000);
  test.info().annotations.push({ type: 'test_case', description: TEST_CASE_CODE });

  const loginPage = new LoginPage(page);

  await test.step('Login with valid credentials and select Sabah Land Development Board', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
    await expect(page.getByText('Dashboard')).toBeVisible();
    await selectOrganization(page);
  });

  await test.step('Navigate to FFB Harvesting list', async () => {
    await navigateToHarvestingList(page);
  });

  await test.step('Drill down using first column until transaction details page appears', async () => {
    await drillDownToTransactionDetails(page);
  });

  await test.step('At details page, click Edit icon for a transaction', async () => {
    await clickTransactionEditFromDetails(page);
    await expect(page.getByRole('button', { name: /\bsave\b/i }).first()).toBeVisible({ timeout: 15000 });
  });

  await test.step('Update values, save, and click Back To List', async () => {
    await fillTextboxByName(page, 'Total Harvested Bunches', UPDATED_VALUES.harvestedBunches);
    await fillTextboxByName(page, 'Loose Fruit', UPDATED_VALUES.looseFruit);
    await fillTextboxByName(page, 'Under Ripe', UPDATED_VALUES.underRipe);
    await clickSave(page);
    await clickBackToListAfterSave(page);
  });
});
