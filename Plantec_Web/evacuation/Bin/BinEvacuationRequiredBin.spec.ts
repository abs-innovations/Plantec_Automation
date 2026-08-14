import { expect, Page, test } from '@playwright/test';
import { LoginPage } from '../../../tests/pages/LoginPage';
import { EvacuationPage } from '../../../tests/pages/EvacuationPage';
import {
  BASE_URL,
  EVACUATION_DATA,
  LOGIN_CREDENTIALS,
} from '../../../testData';


/**
 * Generate a dynamic 2-week date range.
 *
 * Example:
 * Today = 13/Aug/2026
 * Start = 01/Aug/2026
 * End   = 13/Aug/2026
 *
 * This gives 14 calendar days including today.
 */
function getTwoWeekDateRange() {
  const today = new Date();

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 13);

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(today),
  };
}

async function selectEvacuationType(
  page: Page,
  type: 'field' | 'bin' | 'ramp'
) {
  const radio = page.getByRole('radio', {
    name: new RegExp(`${type}\\s*evacuation`, 'i'),
  });

  await expect(radio).toBeVisible();
  await radio.check();
}

async function selectFirstFfbRecordFromFoundList(page: Page) {
  const foundRows = page
    .locator('table tbody tr')
    .filter({
      hasNotText: /no data available|no records|no ffb records/i,
    });

  await expect(foundRows.first()).toBeVisible({
    timeout: 15000,
  });

  const firstRow = foundRows.first();

  // Based on the recording, the + button is used
  // to add the FFB record.
  const plusButton = firstRow
    .locator('button')
    .filter({
      has: page.locator('i.fa-plus'),
    })
    .first();

  if (await plusButton.isVisible().catch(() => false)) {
    await plusButton.click();
    return;
  }

  // Fallback if the plus icon cannot be detected
  const actionButton = firstRow
    .locator('td:last-child button, td:last-child a')
    .first();

  await expect(actionButton).toBeVisible();
  await actionButton.click();
}

async function assertSelectedFfbRecordsUpdated(page: Page) {
  await expect(
    page.getByText('Selected FFB Records', { exact: true }).first()
  ).toBeVisible({
    timeout: 10000,
  });

  const noRecordsMessage = page
    .getByText(/no ffb records selected/i)
    .first();

  if (await noRecordsMessage.count()) {
    await expect(noRecordsMessage).toBeHidden({
      timeout: 10000,
    });
  }

  const selectedRows = page
    .locator('table tbody tr')
    .filter({
      hasNotText: /no ffb records selected|no data available/i,
    });

  await expect(selectedRows.first()).toBeVisible({
    timeout: 10000,
  });
}

async function verifySaveCompleted(page: Page) {
  const successMessage = page
    .getByText(/success|saved|created successfully|successfully/i)
    .first();

  const backToList = page
    .getByRole('button', { name: /back to list/i })
    .first();

  await Promise.race([
    successMessage.waitFor({
      state: 'visible',
      timeout: 15000,
    }),

    backToList.waitFor({
      state: 'visible',
      timeout: 15000,
    }),

    page.waitForURL(/evacuation/i, {
      timeout: 15000,
    }),
  ]);
}

test(
  '[Bin Evacuation] Add evacuation record with FFB records',
  async ({ page }) => {
    test.setTimeout(180000);

    const loginPage = new LoginPage(page);
    const evacuationPage = new EvacuationPage(page);

    // Generate the date range when the test starts.
    const { startDate, endDate } = getTwoWeekDateRange();

    console.log(`FFB Record Date Range: ${startDate} - ${endDate}`);

    await test.step('Login and open Add Evacuation form', async () => {
      await loginPage.goto(BASE_URL);

      await loginPage.login(
        LOGIN_CREDENTIALS.username,
        LOGIN_CREDENTIALS.password
      );

      await evacuationPage.navigateToEvacuation();
      await evacuationPage.clickAddEvacuation();
    });

    await test.step('Select Estate and Bin Evacuation', async () => {
      await evacuationPage.selectEstateByValue(
        EVACUATION_DATA.estateValue
      );

      await selectEvacuationType(page, 'bin');

      await evacuationPage.selectBinByValue(
        EVACUATION_DATA.binValue
      );
    });

    await test.step('Select Vehicle', async () => {
      await evacuationPage.selectVehicleByValue(
        EVACUATION_DATA.vehicleValue
      );
    });

    await test.step('Select Driver Group and Driver', async () => {
      await evacuationPage.selectDriverGroup(
        EVACUATION_DATA.driverGroup
      );

      await evacuationPage.selectDriver(
        EVACUATION_DATA.driver
      );
    });

    await test.step('Select Loader Group and Loader', async () => {
      await evacuationPage.selectLoaderGroup(
        EVACUATION_DATA.loaderGroup
      );

      await evacuationPage.selectLoader(
        EVACUATION_DATA.loader
      );
    });

    await test.step(
      `Search FFB Records from ${startDate} to ${endDate}`,
      async () => {
        // Search By is already "FFB Records Date"
        // based on the recording.

        await evacuationPage.setDateRangeAndSearch(
          startDate,
          endDate
        );
      }
    );

    await test.step('Select FFB Record', async () => {
      await selectFirstFfbRecordFromFoundList(page);

      await assertSelectedFfbRecordsUpdated(page);
    });

    await test.step('Save evacuation record', async () => {
      await evacuationPage.save();

      await verifySaveCompleted(page);
    });
  }
);