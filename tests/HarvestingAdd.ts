import { test } from '@playwright/test';

test('FFB Harvesting - Add (recorded flow)', async ({ page }) => {
  test.setTimeout(180000);

  const actionDelayMs = 500;
  const runStep = async (action: () => Promise<void>) => {
    await action();
    await page.waitForTimeout(actionDelayMs);
  };

  await runStep(async () => {
    await page.goto('https://test.pmmp-abs.com/plantec/index');
  });

  await runStep(async () => {
    await page.getByRole('textbox', { name: 'Username' }).click();
  });

  await runStep(async () => {
    await page.getByRole('textbox', { name: 'Username' }).fill('cbi_estateb');
  });

  await runStep(async () => {
    await page.getByRole('textbox', { name: 'Password' }).click();
  });

  await runStep(async () => {
    await page.getByRole('textbox', { name: 'Password' }).fill('pmmp123');
  });

  await runStep(async () => {
    await page.getByRole('button', { name: 'sign in' }).click();
  });

  await runStep(async () => {
    await page.locator('div').filter({ hasText: /^\[SLDB\]Sabah Land Development Board$/ }).first().click();
  });

  await runStep(async () => {
    await page.getByRole('link', { name: ' FFB Harvesting' }).click();
  });

  await runStep(async () => {
    await page.getByRole('link', { name: ' FFB Harvesting' }).click();
  });

  await runStep(async () => {
    await page.getByRole('link', { name: ' Add FFB Harvesting' }).click();
  });

  await runStep(async () => {
    await page.getByRole('button', { name: 'Please Select Phase' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: 'Phase 1' }).click();
  });

  await runStep(async () => {
    await page.getByRole('button', { name: 'Please Select Block' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: /^Block 1$/ }).click();
  });

  await runStep(async () => {
    await page.getByRole('button', { name: 'Please Select Planting Year' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: /^2012$/ }).click();
  });

  await runStep(async () => {
    await page.getByRole('button', { name: 'Please Select Lot' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: 'Lot 1' }).click();
  });

  await runStep(async () => {
    await page.getByRole('button', { name: 'Please Select Task' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: 'T01' }).click();
  });

  await runStep(async () => {
    await page.getByRole('button', { name: 'Please Select Platform' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: /^Platform 1$/ }).click();
  });

  await runStep(async () => {
    await page.getByRole('button', { name: 'Platform' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: 'Platform 5' }).click();
  });

  await runStep(async () => {
    await page.getByRole('button', { name: 'User 04 (Regional Manager)' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: 'Hafizah user (Assistant' }).click();
  });

  await runStep(async () => {
    await page.getByRole('button', { name: 'Nothing Selected' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: 'Harvester - Punteh' }).click();
  });

  await runStep(async () => {
    await page.getByRole('button', { name: 'Please Select At Least 1' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: 'HAV006 - Joe' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: 'HAV007 - Zulhilmi' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: 'HAV007 - Zulhilmi' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: 'HAV009 - Yusri' }).click();
  });

  await runStep(async () => {
    await page.locator('a').filter({ hasText: 'HV001 - Estor' }).click();
  });

  await runStep(async () => {
    await page.getByRole('textbox', { name: 'Total Harvested Bunches' }).click();
  });

  await runStep(async () => {
    await page.getByRole('textbox', { name: 'Total Harvested Bunches' }).fill('100');
  });

  await runStep(async () => {
    await page.getByRole('textbox', { name: 'Rotten' }).click();
  });

  await runStep(async () => {
    await page.getByRole('textbox', { name: 'Rotten' }).fill('5');
  });

  await runStep(async () => {
    await page.locator('#formDynamicSetup15').getByRole('button', { name: '+' }).dblclick();
  });

  await runStep(async () => {
    await page.locator('#formDynamicSetup15').getByRole('button', { name: '+' }).click();
  });

  await runStep(async () => {
    await page.locator('#formDynamicSetup18').getByRole('button', { name: '+' }).dblclick();
  });

  await runStep(async () => {
    await page.locator('#formDynamicSetup18').getByRole('button', { name: '+' }).click();
  });

  await runStep(async () => {
    await page.locator('#formDynamicSetup18').getByRole('button', { name: '+' }).click();
  });

  await runStep(async () => {
    await page.locator('#formDynamicSetup17').getByRole('button', { name: '+' }).click();
  });

  await runStep(async () => {
    await page.locator('#formDynamicSetup17').getByRole('button', { name: '+' }).dblclick();
  });

  await runStep(async () => {
    await page.locator('#formDynamicSetup22 > .form-group > .input-group > span:nth-child(5) > .btn').click();
  });

  await runStep(async () => {
    await page.locator('#formDynamicSetup22 > .form-group > .input-group > span:nth-child(5) > .btn').click();
  });

  await runStep(async () => {
    await page.locator('#formDynamicSetup22 > .form-group > .input-group > span:nth-child(5) > .btn').click();
  });

  await runStep(async () => {
    await page.locator('#formDynamicSetup22 > .form-group > .input-group > span:nth-child(5) > .btn').click();
  });

  await runStep(async () => {
    await page.locator('#formDynamicSetup22 > .form-group > .input-group > span:nth-child(5) > .btn').click();
  });

  await runStep(async () => {
    await page.getByRole('button', { name: ' Save' }).click();
  });

  await runStep(async () => {
    await page.getByRole('button', { name: 'Back to list' }).click();
  });
});
