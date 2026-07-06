import { test } from '@playwright/test';
import { LoginPage } from '../tests/pages/LoginPage';
import { EvacuationPage } from '../tests/pages/EvacuationPage';
import { BASE_URL, EVACUATION_DATA, LOGIN_CREDENTIALS } from './utils/testData';

test('Evacuation Module - Add Evacuation Record', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const evacuationPage = new EvacuationPage(page);

  await test.step('Step 1 - Login to system', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  });

  await test.step('Step 2 - Open Evacuation module', async () => {
    await evacuationPage.navigateToEvacuation();
    await evacuationPage.clickAddEvacuation();
  });

  await test.step('Step 3 - Fill main selection data', async () => {
    await evacuationPage.selectEstateByValue(EVACUATION_DATA.estateValue);
  });

  await test.step('Step 4 - Fill evacuation details', async () => {
    await evacuationPage.openBinEvacuationSection();
    await evacuationPage.selectBinByValue(EVACUATION_DATA.binValue);
    await evacuationPage.selectVehicleByValue(EVACUATION_DATA.vehicleValue);
    await evacuationPage.selectDriverGroup(EVACUATION_DATA.driverGroup);
    await evacuationPage.selectDriver(EVACUATION_DATA.driver);
    await evacuationPage.selectLoaderGroup(EVACUATION_DATA.loaderGroup);
    await evacuationPage.selectLoader(EVACUATION_DATA.loader);
  });

  await test.step('Step 5 - Add your custom module actions', async () => {
    await evacuationPage.setDateRangeAndSearch(
      EVACUATION_DATA.rangeStartDay,
      EVACUATION_DATA.rangeEndDay
    );
    await evacuationPage.selectFirstSearchResult();
  });

  await test.step('Step 6 - Save and go back to list', async () => {
    await evacuationPage.save();
    await evacuationPage.goBackToList();
  });
});
