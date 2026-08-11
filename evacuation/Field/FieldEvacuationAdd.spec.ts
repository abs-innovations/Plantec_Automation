import { expect, Page, test } from '@playwright/test';
import { LoginPage } from '../../tests/pages/LoginPage';
import { EvacuationPage } from '../../tests/pages/EvacuationPage';
import { BASE_URL, EVACUATION_DATA, LOGIN_CREDENTIALS } from '../../testData';

async function verifySaveCompleted(page: Page) {
  await Promise.race([
    page.getByText(/success|saved|created/i).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined),
    page.getByRole('button', { name: /back to list/i }).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined),
    page.waitForURL(/evacuation(\?|$)/i, { timeout: 15000 }).catch(() => undefined),
  ]);

  const saveButton = page.getByRole('button', { name: /save/i }).first();
  if (await saveButton.isVisible().catch(() => false)) {
    await expect(page.getByText(/success|saved|created/i).first()).toBeVisible({ timeout: 10000 });
  }
}

async function selectEvacuationType(page: Page, typeLabel: RegExp) {
  const labelCandidate = page.getByText(typeLabel).first();
  if (await labelCandidate.isVisible().catch(() => false)) {
    await labelCandidate.click();
    return;
  }

  const radioCandidate = page.getByRole('radio', { name: typeLabel }).first();
  if (await radioCandidate.isVisible().catch(() => false)) {
    await radioCandidate.check();
    return;
  }

  throw new Error('Unable to select requested evacuation type.');
}

async function trySelectSearchByFfbRecordDate(page: Page) {
  const searchBySelect = page.locator('label:has-text("Search By")').locator('xpath=following::select[1]').first();
  if (await searchBySelect.isVisible().catch(() => false)) {
    const options = await searchBySelect.locator('option').allTextContents();
    const target = options.find((text) => /ffb\s*record\s*date/i.test(text));
    if (target) {
      await searchBySelect.selectOption({ label: target.trim() }).catch(() => undefined);
    }
    return;
  }

  const searchByDropdownButton = page
    .locator('label:has-text("Search By")')
    .locator('xpath=following::button[1]')
    .first();

  if (await searchByDropdownButton.isVisible().catch(() => false)) {
    await searchByDropdownButton.click();
    const option = page.locator('a, li, span').filter({ hasText: /ffb\s*record\s*date/i }).first();
    await option.click().catch(() => undefined);
  }
}

async function trySelectMill(page: Page) {
  const millSelect = page.locator('label:has-text("Mill")').locator('xpath=following::select[1]').first();

  if (await millSelect.isVisible().catch(() => false)) {
    const options = await millSelect.locator('option').all();
    for (const option of options) {
      const label = ((await option.textContent()) ?? '').trim();
      const value = (await option.getAttribute('value')) ?? '';
      if (!label || !value || /please\s*select/i.test(label)) {
        continue;
      }
      await millSelect.selectOption({ value }).catch(() => undefined);
      return;
    }
  }
}

async function selectFirstFfbRecordFromFoundList(page: Page) {
  const foundRows = page.locator('table tbody tr').filter({ hasNotText: /no data available|no records/i });
  await expect(foundRows.first()).toBeVisible({ timeout: 15000 });

  const firstRow = foundRows.first();
  const addCandidates = [
    firstRow.locator('td:last-child button, td:last-child a').first(),
    firstRow.locator('button:has(i.fa-plus), a:has(i.fa-plus), i.fa-plus').first(),
    firstRow.getByRole('button').last(),
  ];

  for (const action of addCandidates) {
    if (await action.isVisible().catch(() => false)) {
      await action.click();
      return;
    }
  }

  throw new Error('Unable to find action control to select FFB record from found list.');
}

async function assertSelectedFfbRecordsUpdated(page: Page) {
  const selectedSection = page.getByText(/Selected FFB Records/i).first();
  await expect(selectedSection).toBeVisible({ timeout: 10000 });

  const noRecordsMsg = page.getByText(/No FFB records selected/i).first();
  await expect(noRecordsMsg).toBeHidden({ timeout: 10000 }).catch(async () => {
    const selectedRows = page.locator('table tbody tr').filter({ hasNotText: /No FFB records selected|No data available/i });
    await expect(selectedRows.first()).toBeVisible({ timeout: 10000 });
  });
}

test('[Field Evacuation] Add record with FFB date filter selection', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);
  const evacuationPage = new EvacuationPage(page);

  await test.step('Login and open Add Evacuation form', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
    await evacuationPage.navigateToEvacuation();
    await evacuationPage.clickAddEvacuation();
  });

  await test.step('Select estate and Field evacuation type', async () => {
    await evacuationPage.selectEstateByValue(EVACUATION_DATA.estateValue);
    await selectEvacuationType(page, /field\s*evacuation/i);
  });

  await test.step('Populate Vehicle, Driver, Loader and select one FFB record', async () => {
    // Field evacuation does not require a subtype dropdown before Vehicle selection.
    await evacuationPage.selectVehicleByValue(EVACUATION_DATA.vehicleValue);
    await evacuationPage.selectDriverGroup(EVACUATION_DATA.driverGroup);
    await evacuationPage.selectDriver(EVACUATION_DATA.driver);
    await evacuationPage.selectLoaderGroup(EVACUATION_DATA.loaderGroup);
    await evacuationPage.selectLoader(EVACUATION_DATA.loader);
    await trySelectSearchByFfbRecordDate(page);
    await trySelectMill(page);
    await evacuationPage.setDateRangeAndSearch(EVACUATION_DATA.rangeStartDay, EVACUATION_DATA.rangeEndDay);
    await selectFirstFfbRecordFromFoundList(page);
    await assertSelectedFfbRecordsUpdated(page);
  });

  await test.step('Save and verify submit flow', async () => {
    await evacuationPage.save();
    await verifySaveCompleted(page);
  });
});
