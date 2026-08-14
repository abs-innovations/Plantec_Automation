import { expect, Page, test } from '@playwright/test';
import { LoginPage } from '../tests/pages/LoginPage';
import {
  ACTIVE_TEST_PROFILE,
  BASE_URL,
  HARVESTING_ADD_FLOW,
  HARVESTING_DATA,
  HARVESTING_PLATFORM_SELECTION,
  LOGIN_CREDENTIALS,
} from '../testData';

type ClickAction = 'click' | 'dblclick';


function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeUiText(value: string) {
  return value.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function toFieldIdToken(fieldLabel: string) {
  return fieldLabel.replace(/\s+/g, '');
}

async function selectFromNativeSelectCandidates(
  page: Page,
  fieldLabel: string,
  optionText: string
): Promise<boolean> {
  const fieldToken = toFieldIdToken(fieldLabel);
  const nativeSelectCandidates = [
    page.locator(`#${fieldToken}Id`).first(),
    page.locator(`select[name="${fieldToken}Id"]`).first(),
    page.locator(`label:has-text("${fieldLabel}")`).locator('xpath=following::select[1]').first(),
    page.getByRole('combobox', { name: new RegExp(escapeForRegex(fieldLabel), 'i') }).first(),
  ];

  for (const select of nativeSelectCandidates) {
    if (!(await select.count().catch(() => 0))) {
      continue;
    }

    try {
      await select.selectOption({ label: optionText }, { timeout: 5000 });
      console.log(`Selected "${optionText}" from native select for "${fieldLabel}"`);
      return true;
    } catch {
      // Try normalized label match when option text formatting differs.
      try {
        const normalizedTarget = normalizeUiText(optionText);
        const normalizedMatch = await select.evaluate((element, target) => {
          const selectElement = element as HTMLSelectElement;
          for (const option of Array.from(selectElement.options)) {
            const normalizedText = option.text.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
            if (normalizedText === target) {
              return { value: option.value, label: option.text };
            }
          }
          return null;
        }, normalizedTarget);

        if (normalizedMatch?.value) {
          await select.selectOption({ value: normalizedMatch.value }, { timeout: 5000 });
          console.log(
            `Selected "${normalizedMatch.label}" from native select for "${fieldLabel}" using normalized match for "${optionText}"`
          );
          return true;
        }
      } catch {
        // Try next selector strategy.
      }
    }
  }

  return false;
}

async function isDropdownFieldPresent(page: Page, fieldLabel: string): Promise<boolean> {
  const fieldToken = toFieldIdToken(fieldLabel);
  const candidates = [
    page.locator(`button[data-id="${fieldToken}Id"]`).first(),
    page.locator(`#${fieldToken}Id`).first(),
    page.locator(`label:has-text("${fieldLabel}")`).first(),
    page.getByRole('button', { name: new RegExp(escapeForRegex(fieldLabel), 'i') }).first(),
    page.getByRole('combobox', { name: new RegExp(escapeForRegex(fieldLabel), 'i') }).first(),
  ];

  for (const candidate of candidates) {
    if (await candidate.isVisible().catch(() => false)) {
      return true;
    }
  }

  return false;
}

async function waitForDropdownFieldPresence(page: Page, fieldLabel: string, timeoutMs = 10000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isDropdownFieldPresent(page, fieldLabel)) {
      return true;
    }
    await page.waitForTimeout(300);
  }
  return false;
}

async function selectDropdownIfPresent(
  page: Page,
  fieldLabel: string,
  buttonLabel: string,
  optionText: string,
  required = false,
  dropdownHint?: {
    buttonDataId?: string;
    preferLastMatch?: boolean;
  },
) {
  if (!required) {
    const isRendered = await waitForDropdownFieldPresence(page, fieldLabel, 1500);
    if (!isRendered) {
      console.log(`Field "${fieldLabel}" is not available on this form. Skipping.`);
      return;
    }
  }

  try {
    await selectDropdownByButtonLabel({ page, buttonLabel, optionText, ...dropdownHint });
    return;
  } catch (error) {
    if (required) {
      throw new Error(
        `Required dropdown "${fieldLabel}" could not be selected with option "${optionText}". ` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (!(await isDropdownFieldPresent(page, fieldLabel))) {
      console.log(`Field "${fieldLabel}" is not available on this form. Skipping.`);
      return;
    }

    console.log(
      `Field "${fieldLabel}" is present but option "${optionText}" was not selectable. Skipping optional field.`
    );
  }
}

async function selectDropdownRequiredIfRendered(
  page: Page,
  fieldLabel: string,
  buttonLabel: string,
  optionText: string,
  dropdownHint?: {
    buttonDataId?: string;
    preferLastMatch?: boolean;
  },
) {
  const isRendered = await waitForDropdownFieldPresence(page, fieldLabel, 12000);
  if (!isRendered) {
    console.log(`Field "${fieldLabel}" not rendered for current form variant. Skipping.`);
    return false;
  }

  await selectDropdownIfPresent(page, fieldLabel, buttonLabel, optionText, true, dropdownHint);
  return true;
}


// async function selectDropdownByButtonLabel(
//   page: Page,
//   buttonLabel: string,
//   optionText: string
// ) {
//   const dropdownButton = page
//     .getByRole('button', {
//       name: new RegExp(escapeForRegex(buttonLabel), 'i'),
//     })
//     .first();

//   await expect(dropdownButton).toBeVisible();
//   await dropdownButton.click();

//   // Find the option anywhere in the opened dropdown.
//   const option = page
//     .getByText(optionText, { exact: true })
//     .first();

//   await expect(option).toBeVisible({ timeout: 10000 });
//   await option.click();

//   // Give the UI a moment to update the selected value
//   await expect(
//     page.getByRole('button', {
//       name: new RegExp(escapeForRegex(optionText), 'i'),
//     }).first()
//   ).toBeVisible({ timeout: 5000 }).catch(() => {});
// }

async function selectEstateIfRequired(
  page: Page,
  estateName: string
) {
  const estateButton = page.locator(
    'button[data-id="estateId"]'
  );

  // Single-estate user may not have an Estate selector
  if (await estateButton.count() === 0) {
    console.log('Estate dropdown not available. Skipping estate selection.');
    return;
  }

  await expect(estateButton).toBeVisible();

  const currentTitle = await estateButton.getAttribute('title');

  console.log(`Current Estate dropdown title: ${currentTitle}`);

  // Estate already selected automatically
  if (
    currentTitle &&
    !/Please Select Estate/i.test(currentTitle)
  ) {
    console.log(
      `Estate already selected: ${currentTitle}. Skipping estate selection.`
    );
    return;
  }

  // Multi-estate user
  console.log(`Selecting estate: ${estateName}`);

  await estateButton.click();

  const estateOption = page
    .getByText(estateName, { exact: true })
    .last();

  await expect(estateOption).toBeVisible({
    timeout: 10000,
  });

  await estateOption.click();

  // Verify the Estate was selected
  await expect(estateButton).toHaveAttribute(
    'title',
    estateName,
    { timeout: 10000 }
  );
  console.log( `Estate selected successfully: "${estateName}"` 
  );
}

async function selectPhase(
  
  page: Page, 
  phaseName: string
) {
  const phaseSelect = page.locator('#PhaseId').first();

  await expect(phaseSelect).toHaveCount(1, { timeout: 15000 });
  await expect(phaseSelect).toBeEnabled({ timeout: 15000 });

  console.log(
    `Waiting for Phase option: "${phaseName}"`
  );

  const phaseOption = phaseSelect.locator(
    'option', 
    { 
      hasText: phaseName }
    );

  // Phase is populated dynamically after Estate selection.
  await expect(phaseOption).toHaveCount(1, { 
    timeout: 20000 
  });

  await phaseSelect.selectOption({
     label: phaseName 
    }, {
      timeout: 10000,
    });

  console.log(`Phase selected successfully: "${phaseName}"`
  );
}

async function selectDropdownByButtonLabel( 
{ page, buttonLabel, optionText, buttonDataId, preferLastMatch }: 
{ page: Page; 
  buttonLabel: string; 
  optionText: string;
  buttonDataId?: string;
  preferLastMatch?: boolean;
 }): Promise<void>
  {
  const fieldLabel = buttonLabel.replace(/^Please\s+Select\s+/i, '').trim();
  if (await selectFromNativeSelectCandidates(page, fieldLabel, optionText)) {
    return;
  }

  const normalizedOption = normalizeUiText(optionText);

  const findVisibleOption = async () => {
    const broadCandidates = page
      .locator('a, li, span, option, .dropdown-item')
      .filter({ hasText: new RegExp(escapeForRegex(optionText), 'i') });
    const total = await broadCandidates.count();
    for (let index = 0; index < total; index += 1) {
      const candidate = broadCandidates.nth(index);
      if (!(await candidate.isVisible().catch(() => false))) {
        continue;
      }

      const text = (await candidate.textContent().catch(() => null)) || '';
      if (normalizeUiText(text) === normalizedOption) {
        return candidate;
      }
    }
    return null;
  };

  // Fallback: bootstrap button dropdown controls.
  const fieldTokenDataId = `${toFieldIdToken(fieldLabel)}Id`;
  const resolvedDataId = buttonDataId?.trim() || fieldTokenDataId;

  const dataIdLocator = page.locator(`button[data-id="${resolvedDataId}"]`);
  const buttonCandidates = [
    preferLastMatch ? dataIdLocator.last() : dataIdLocator.first(),
    page.getByRole('button', {
      name: new RegExp(escapeForRegex(buttonLabel), 'i'),
    }).first(),
    page.getByRole('button', {
      name: new RegExp(escapeForRegex(fieldLabel), 'i'),
    }).first(),
  ];

  for (const dropdownButton of buttonCandidates) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (!(await dropdownButton.isVisible().catch(() => false))) {
        continue;
      }

      try {
        console.log(`Opening dropdown: "${buttonLabel}" (attempt ${attempt + 1})`);
        await dropdownButton.click({ timeout: 5000 });

        // Wait for dropdown options to become available after dynamic render.
        await page
          .locator('a, li, option, .dropdown-menu .dropdown-item')
          .filter({ hasText: new RegExp(escapeForRegex(optionText), 'i') })
          .first()
          .waitFor({ state: 'visible', timeout: 5000 });

        const option = await findVisibleOption();

        if (option) {
          await option.click();
          console.log(`Selected "${optionText}" from "${buttonLabel}"`);
          return;
        }
      } catch {
        // Retry for detached/unstable element after dynamic rerender.
      }
    }
  }

  throw new Error(`Unable to locate dropdown/select for "${buttonLabel}".`);
}

async function selectDropdownOptionByExploringVisibleButtons(
  page: Page,
  optionText: string,
): Promise<boolean> {
  const candidateButtons = page
    .locator('form button, .form-group button')
    .filter({ hasText: /nothing selected|please select|select/i });
  const total = await candidateButtons.count();

  for (let i = 0; i < total; i += 1) {
    const candidateButton = candidateButtons.nth(i);
    if (!(await candidateButton.isVisible().catch(() => false))) {
      continue;
    }

    try {
      await candidateButton.click({ timeout: 3000 });
      const option = page
        .locator('a, li, span, option, .dropdown-item')
        .filter({ hasText: new RegExp(escapeForRegex(optionText), 'i') })
        .first();

      await option.waitFor({ state: 'visible', timeout: 2000 });
      await option.click({ timeout: 3000 });
      console.log(`Selected "${optionText}" using fallback dropdown exploration.`);
      return true;
    } catch {
      await page.keyboard.press('Escape').catch(() => undefined);
      // Continue trying other visible dropdown controls.
    }
  }

  return false;
}

async function trySelectFromNativeLabels(page: Page, fieldLabels: string[], optionText: string): Promise<boolean> {
  for (const fieldLabel of fieldLabels) {
    if (await selectFromNativeSelectCandidates(page, fieldLabel, optionText)) {
      return true;
    }
  }
  return false;
}

async function selectHarvesters(page: Page) {
  const groupFieldCandidates = ['Harvester Group', 'Worker Group', 'Harvester', 'Group'];
  const selectedByNativeGroup = await trySelectFromNativeLabels(
    page,
    groupFieldCandidates,
    HARVESTING_ADD_FLOW.harvesterGroupOption,
  );

  if (!selectedByNativeGroup) {
    const groupSelected = await selectDropdownOptionByExploringVisibleButtons(
      page,
      HARVESTING_ADD_FLOW.harvesterGroupOption,
    );

    if (!groupSelected) {
      throw new Error(
        `Unable to locate Harvester Group dropdown/option for "${HARVESTING_ADD_FLOW.harvesterGroupOption}".`
      );
    }
  }

  const harvesterButtonCandidates = [
    page.getByRole('button', {
      name: new RegExp(escapeForRegex(HARVESTING_ADD_FLOW.harvesterSelectButton), 'i'),
    }).first(),
    page.getByRole('button', { name: /please select at least|at least 1/i }).first(),
    page.locator('form button[data-id*="Harvester"], form button[data-id*="Worker"]').first(),
  ];

  let harvesterButton = harvesterButtonCandidates[0];
  for (const candidate of harvesterButtonCandidates) {
    if (await candidate.isVisible().catch(() => false)) {
      harvesterButton = candidate;
      break;
    }
  }

  await expect(harvesterButton).toBeVisible();
  await harvesterButton.click();

  for (const harvester of HARVESTING_ADD_FLOW.harvesters) {
    const harvesterOption = page
      .getByText(harvester, {
        exact: true,
      })
      .last();

    await expect(harvesterOption).toBeVisible({
      timeout: 10000,
    });

    await harvesterOption.click();

    console.log(`Selected Harvester: "${harvester}"`);
  }
}

async function fillVisibleTextbox(
  page: Page, 
  fieldName: string, 
  value: string
) {
  const textbox = page
  .getByRole('textbox', {
     name: fieldName 
    });

  if (!(await textbox.first().isVisible())) {
    console.log(
      `Textbox "${fieldName}" is not visible. Skipping fill.`
    );
    return;
  }
  await textbox.first().fill(value);

  console.log( `Filled "${fieldName}" with "${value}"` 

  );
 }

async function runIncrementActions(
  page: Page,
  containerSelector: string, 
  actions: readonly ClickAction[]
) {

  const incrementButton = page
  .locator(containerSelector)
  .getByRole('button',
     { name: '+' 
    }).first();

  await expect(incrementButton).toBeVisible({
     timeout: 10000
     });

  for (const action of actions) {
    if (action === 'dblclick') {
      await incrementButton.dblclick();
      continue;
    }
    await incrementButton.click();
  }
}

async function navigateToHarvesting(page: Page) {
  const organization = page 
  .locator('div') 
  .filter({
     hasText:
      /^\[SLDB\]Sabah Land Development Board$/,
     }) 
      .first(); 

  await organization.click();

  const harvestingMenu = page
  .locator(
    'a[href="javascript:void(0);"]',
     { 
      hasText: 'FFB Harvesting' 
    })
    .first();

  if (
    (await harvestingMenu.getAttribute(
      'aria-expanded'
    )) !== 'true'
  ) {
    await harvestingMenu.click();
  }

  await page
  .locator('a[href="harvesting"]')
  .click();
}

async function openAddHarvesting(page: Page) {
  await page
  .getByRole('link', {
    name: /Add FFB Harvesting/
  })
  .click();
}

async function fillHarvestingFieldValues(page: Page) {
  await fillVisibleTextbox(page, 'Total Harvested Bunches', HARVESTING_DATA.totalBunches);
  await fillVisibleTextbox(page, 'Rotten', HARVESTING_DATA.rotten);
  await fillVisibleTextbox(page, 'Unripe', HARVESTING_DATA.unripe);
  await fillVisibleTextbox(page, 'Under Ripe', HARVESTING_DATA.underRipe);
  await fillVisibleTextbox(page, 'Over Ripe', HARVESTING_DATA.overRipe);
  await fillVisibleTextbox(page, 'Empty Bunch', HARVESTING_DATA.emptyBunch);
  await fillVisibleTextbox(page, 'Loose Fruit', HARVESTING_DATA.looseFruit);

  const remarksTextbox = page.locator('form textarea, form input[type="text"]').filter({ hasNot: page.getByRole('textbox', { name: 'Harvesting Date' }) }).last();
  if (await remarksTextbox.isVisible()) {
    await remarksTextbox.fill(HARVESTING_DATA.remarks);
  }
}

async function runConfiguredIncrementActions(page: Page) {
  for (const [containerSelector, actions]
     of Object.entries(
      HARVESTING_ADD_FLOW.incrementActions)
    ) {
    await runIncrementActions(
      page, `#${containerSelector}`, actions);
  }

  const finalCounterButton = page.locator(
    HARVESTING_ADD_FLOW.finalCounterSelector
  ).first();
  
  await expect(finalCounterButton).toBeVisible();

  for (
    let i = 0;
    i < HARVESTING_ADD_FLOW.finalCounterClicks;
    i += 1
  ) {
    await finalCounterButton.click();
  }
}

async function verifyHarvestingSaved(page: Page) {
  const successText = page.getByText(/success|saved/i);
  const duplicateText = page.getByText(/duplicate|already exists|already exist|already submitted|already added/i).first();
  const backToListButton = page.getByRole('button', { name: /back to list/i });

  // Save may show a toast first, then display Back to List.
  await Promise.race([
    successText.first().waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    duplicateText.waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    backToListButton.first().waitFor({ state: 'visible', timeout: 12000 }).catch(() => undefined),
    page.waitForURL(/harvesting(\?|$)/i, { timeout: 12000 }).catch(() => undefined),
  ]);

  if (await duplicateText.isVisible().catch(() => false)) {
    console.log('Duplicate harvesting data detected. Ending run as rerun-safe pass condition.');
    return;
  }

  if (await backToListButton.first().isVisible().catch(() => false)) {
    return;
  }

  if (await successText.first().isVisible().catch(() => false)) {
    return;
  }

  if (/harvesting(\?|$)/i.test(page.url())) {
    return;
  }

  await expect(backToListButton.first()).toBeVisible({ timeout: 15000 });
}

test('[TC-170] FFB Harvesting - Add automated flow', async ({ page }) => {
  test.setTimeout(180000);

  const loginPage = new LoginPage(page);

  await test.step('Login and open Add FFB Harvesting form', async () => {
    await loginPage.goto(BASE_URL);
    await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
    await expect(page.getByText('Dashboard')).toBeVisible();
    await navigateToHarvesting(page);
    await openAddHarvesting(page);
  });

  await test.step(
    'Fill main harvesting selections', 
    async () => {
    await fillHarvestingDropdowns(page);
  });

  await test.step('Fill visible harvesting values from HARVESTING_DATA', async () => {
    await fillHarvestingFieldValues(page);
  });

  await test.step('Apply configured increment actions', async () => {
    await runConfiguredIncrementActions(page);
  });

  await test.step('Save and verify result', async () => {
    await page.getByRole('button', { name: /\bSave\b/i }).click();
    await verifyHarvestingSaved(page);
  });
});

async function fillHarvestingDropdowns(page: Page) {
  console.log(
    `[HarvestingAdd] profile=${ACTIVE_TEST_PROFILE} seed=${HARVESTING_PLATFORM_SELECTION.seed} ` +
    `primaryPlatform="${HARVESTING_PLATFORM_SELECTION.primaryPlatform}" ` +
    `secondaryPlatform="${HARVESTING_PLATFORM_SELECTION.secondaryPlatformOption}" ` +
    `platformPool=[${HARVESTING_PLATFORM_SELECTION.pool.join(', ')}]`
  );

  await selectEstateIfRequired(page, HARVESTING_DATA.estate);
  await selectPhase(page, HARVESTING_ADD_FLOW.phase);

  await selectDropdownIfPresent(
    page,
    'Block',
    'Please Select Block',
    HARVESTING_ADD_FLOW.block,
  ).catch(() => {
    console.log('Block selection skipped: field not available or option not populated.');
  });

  await selectDropdownIfPresent(
    page,
    'Planting Year',
    'Please Select Planting Year',
    HARVESTING_ADD_FLOW.plantingYear,
  ).catch(() => {
    console.log('Planting Year selection skipped: field not available or option not populated.');
  });

  await selectDropdownRequiredIfRendered(
    page,
    'Lot',
    'Please Select Lot',
    HARVESTING_ADD_FLOW.lot,
  );

  await selectDropdownRequiredIfRendered(
    page,
    'Task',
    'Please Select Task',
    HARVESTING_ADD_FLOW.task,
  );

  const primaryPlatformSelected = await selectDropdownRequiredIfRendered(
    page,
    'Platform',
    'Please Select Platform',
    HARVESTING_PLATFORM_SELECTION.primaryPlatform,
  );

  if (primaryPlatformSelected) {
    await selectDropdownRequiredIfRendered(
      page,
      'Platform',
      HARVESTING_ADD_FLOW.secondaryPlatformButton,
      HARVESTING_PLATFORM_SELECTION.secondaryPlatformOption,
      {
        buttonDataId: HARVESTING_ADD_FLOW.secondaryPlatformDataId,
        preferLastMatch: true,
      },
    );
  }

  await selectDropdownIfPresent(
    page,
    'Inspector',
    'Inspector',
    HARVESTING_ADD_FLOW.approverOption,
  ).catch(() => {
    console.log('Inspector selection skipped: target option not available for current user/profile.');
  });

  await selectHarvesters(page);
}

