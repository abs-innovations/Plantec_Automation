# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ffb_harvesting\EditFFB.spec.ts >> FFB-102 - Edit FFB
- Location: Plantec_Web\ffb_harvesting\EditFFB.spec.ts:301:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button:has-text("Back to list"):visible, a:has-text("Back to list"):visible').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('button:has-text("Back to list"):visible, a:has-text("Back to list"):visible').first()

```

```yaml
- navigation:
  - link "brand plantec":
    - /url: dashboard
    - img "brand"
    - text: plantec
  - link "":
    - /url: javascript:void(0);
  - search:
    - list:
      - listitem:
        - link:
          - /url: "#"
  - list:
    - listitem:
      - link "":
        - /url: "#"
    - listitem:
      - link "user_auth":
        - /url: "#"
        - img "user_auth"
- list:
  - listitem:
    - text: Master
    - link " Change Organization":
      - /url: organization
  - listitem:
    - link " Sabah Land Development Board":
      - /url: organization_details
  - listitem:
    - link " Area Statement":
      - /url: estate_relationship
  - listitem:
    - link " Modules":
      - /url: modules?firTabType=2
  - listitem:
    - link " Setup":
      - /url: javascript:void(0);
  - listitem:
    - link " Upkeep Setup":
      - /url: javascript:void(0);
  - listitem:
    - link " Users":
      - /url: user
  - listitem:
    - link " Job Position":
      - /url: job_position
  - listitem:
    - link " License":
      - /url: finance_license
  - listitem:
    - link " Worker Roles":
      - /url: worker_roles
  - listitem:
    - link " Language Setup":
      - /url: javascript:void(0);
  - listitem:
    - link " General Configuration":
      - /url: javascript:void(0);
  - listitem:
    - separator
  - listitem: Sabah Land Development Board
  - listitem:
    - link " Dashboard":
      - /url: dashboard
  - listitem:
    - link " Area Statement":
      - /url: area_statement
  - listitem:
    - link " Attendance":
      - /url: attendance
  - listitem:
    - link " FFB Harvesting" [expanded]:
      - /url: javascript:void(0);
    - list:
      - listitem:
        - link " Productivity":
          - /url: productivity
      - listitem:
        - link " FFB Harvesting":
          - /url: harvesting
      - listitem:
        - link " Evacuation":
          - /url: evacuation
      - listitem:
        - link " Weighbridge":
          - /url: weighbridge
      - listitem:
        - link " Harvesting Round":
          - /url: harvesting_round
      - listitem:
        - link " Yield Performance":
          - /url: yield_performance
  - listitem:
    - link " Field Inspection":
      - /url: javascript:void(0);
  - listitem:
    - link " Upkeep":
      - /url: javascript:void(0);
  - listitem: Upload
  - listitem:
    - link " Upload":
      - /url: upload
  - listitem: Download App
  - listitem:
    - link " Download App":
      - /url: download_app
  - listitem: Map / Photo
  - listitem:
    - link " Map":
      - /url: map_photo
  - listitem:
    - link " Gallery":
      - /url: photo
  - listitem: Operational Data
  - listitem:
    - link " Operational Data":
      - /url: javascript:void(0);
- list:
  - listitem:
    - tabpanel:
      - term: Search
      - text: Location
      - listbox
      - text: Designation
      - button "All"
      - listbox:
        - option "All Designations"
        - option "Manager"
        - option "Asst Manager"
        - option "Supervisor"
        - option "Mandore"
      - text: Inspector
      - button "All"
      - listbox:
        - option "All Inspectors"
        - option "Mr James Bond"
        - option "John Wick"
        - option "Bumble Bee"
      - text: Date Range
      - combobox:
        - option "Inspection Date" [selected]
        - option "Recovery Date"
        - option "Uploaded Date"
      - textbox: 19-09-2024 to 18-10-2024
      - checkbox "With Losses"
      - text: With Losses
      - button " Search"
      - text: Palm Range
      - spinbutton: "1"
      - spinbutton: "200"
- heading "Edit FFB Record" [level=5]
- list:
  - listitem:
    - link "Dashboard":
      - /url: dashboard
  - listitem:
    - text: 
    - link "FFB Harvesting":
      - /url: harvesting
  - listitem: Edit FFB Record
- form:
  - heading " FFB Harvesting Details" [level=6]
  - separator
  - text: Harvesting Date
  - textbox: 04/Aug/2026
  - text: Harvesting Type
  - textbox: Harvesting
  - heading " Location" [level=6]
  - separator
  - text: Estate
  - textbox: KAV - Punteh
  - text: Phase
  - textbox: Phase 1
  - text: Block
  - textbox: Block 1
  - text: Planting Year
  - textbox: "2012"
  - text: Lot
  - textbox: Lot 1
  - text: Task
  - textbox: T01
  - text: Platform
  - textbox: Platform 1
  - heading " Inspector Details" [level=6]
  - separator
  - text: Inspector
  - textbox: Syukri m (Assistant Manager)
  - heading " Worker Details" [level=6]
  - separator
  - text: Worker Group
  - button "Harvester - Punteh"
  - listbox:
    - option "Harvester - Punteh" [selected]
    - option "Driver - Punteh"
    - option "Loader - Punteh"
    - option "Harvester - PM01"
    - option "Harvester Block 3"
    - option "General Worker"
    - option "test iw"
    - option "Field PH Group"
    - option "Pruning & Weeding Group"
  - text: Worker *
  - button "HAV001 - Hilmi"
  - listbox:
    - group:
      - option "HAV001 - Hilmi" [selected]
      - option "HAV002 - Ali"
      - option "HAV004 - Zara"
      - option "HAV005 - Fatin"
      - option "HAV008 - Fikri"
      - option "HAV009 - Yusri"
      - option "HAV010 - Yati"
      - option "HAV011 - Nurin"
      - option "HAV006 - Joe"
      - option "HAV007 - Zulhilmi"
      - option "HV001 - Estor"
  - checkbox "Select Worker From Other Estate"
  - text: Select Worker From Other Estate
  - heading " FFB Harvesting" [level=6]
  - separator
  - text: Total Harvested Bunches *
  - button "-"
  - textbox "Total Harvested Bunches": "500"
  - button "+"
  - text: Bunches Total Ripe *
  - textbox "Total Ripe" [disabled]: "494"
  - text: Bunches Rotten
  - button "-"
  - textbox "Rotten"
  - button "+"
  - text: Bunches Unripe *
  - button "-"
  - textbox "Unripe": "1"
  - button "+"
  - text: Bunches Under Ripe *
  - button "-"
  - textbox "Under Ripe": "5"
  - button "+"
  - text: Bunches Over Ripe *
  - button "-"
  - textbox "Over Ripe": "0"
  - button "+"
  - text: Bunches Empty Bunch *
  - button "-"
  - textbox "Empty Bunch": "0"
  - button "+"
  - text: Bunches Loose Fruit *
  - button "-"
  - textbox "Loose Fruit": "15"
  - button "+"
  - text: Bag
  - heading " Remarks" [level=6]
  - separator
  - text: Remarks
  - textbox: tash
  - button " Save"
- contentinfo:
  - paragraph: 2026 © . plantec
```

# Test source

```ts
  128 |   return editClassIcon.isVisible().catch(() => false);
  129 | }
  130 | 
  131 | async function clickFirstColumnToDrillDown(row: Locator) {
  132 |   const firstColumnCandidates = [
  133 |     row.locator('td').first().getByRole('link').first(),
  134 |     row.locator('td').first().getByRole('button').first(),
  135 |     row.locator('td:first-child a, td:first-child button').first(),
  136 |     row.locator('td').first(),
  137 |   ];
  138 | 
  139 |   for (const candidate of firstColumnCandidates) {
  140 |     if (await candidate.isVisible().catch(() => false)) {
  141 |       await candidate.click();
  142 |       return;
  143 |     }
  144 |   }
  145 | 
  146 |   throw new Error('Unable to click first column to drill down.');
  147 | }
  148 | 
  149 | async function drillDownToTransactionDetails(page: Page, maxDepth = 8) {
  150 |   for (let depth = 0; depth < maxDepth; depth += 1) {
  151 |     await getListRow(page);
  152 | 
  153 |     if ((await isDetailsPageTable(page)) && (await hasTransactionEditActions(page))) {
  154 |       return;
  155 |     }
  156 | 
  157 |     const currentFirstRow = await getListRow(page);
  158 |     await clickFirstColumnToDrillDown(currentFirstRow);
  159 | 
  160 |     await Promise.race([
  161 |       page.waitForLoadState('networkidle').catch(() => undefined),
  162 |       page.waitForTimeout(1000),
  163 |     ]);
  164 |   }
  165 | 
  166 |   throw new Error('Reached maximum drill-down depth before finding transaction Edit icon in details page.');
  167 | }
  168 | 
  169 | async function clickTransactionEditFromDetails(page: Page) {
  170 |   await scrollTableToRight(page);
  171 | 
  172 |   const txRow = await getDetailsRowWithHarvestedBunchesValue(page);
  173 | 
  174 |   const editCandidates = [
  175 |     txRow.locator('td:last-child a[title*="Edit" i], td:last-child button[title*="Edit" i]').first(),
  176 |     txRow.locator('td:last-child a:has(i.fa-pencil), td:last-child a:has(i.fa-edit), td:last-child button:has(i.fa-pencil), td:last-child button:has(i.fa-edit)').first(),
  177 |     txRow.locator('td:last-child a, td:last-child button').first(),
  178 |     txRow.getByRole('button', { name: /edit/i }).first(),
  179 |     txRow.getByRole('link', { name: /edit/i }).first(),
  180 |     txRow.locator('button[title*="Edit" i], a[title*="Edit" i]').first(),
  181 |     txRow.locator('button i.fa-edit, a i.fa-edit, i.fa-pencil, i.fa-edit').first(),
  182 |     txRow.locator('td:last-child button, td:last-child a').first(),
  183 |   ];
  184 | 
  185 |   for (const candidate of editCandidates) {
  186 |     if (await candidate.isVisible().catch(() => false)) {
  187 |       await candidate.click();
  188 |       return;
  189 |     }
  190 |   }
  191 | 
  192 |   throw new Error('Unable to find transaction Edit icon/button in Details page.');
  193 | }
  194 | 
  195 | async function fillTextboxByName(page: Page, fieldName: string, value: string) {
  196 |   const input = page.getByRole('textbox', { name: new RegExp(escapeForRegex(fieldName), 'i') }).first();
  197 |   await expect(input).toBeVisible({ timeout: 15000 });
  198 |   await input.fill(value);
  199 | }
  200 | 
  201 | async function clickSave(page: Page) {
  202 |   const saveCandidates = [
  203 |     page.getByRole('button', { name: /\bsave\b/i }).first(),
  204 |     page.locator('button:has-text("Save")').first(),
  205 |     page.locator('button[type="submit"]').first(),
  206 |   ];
  207 | 
  208 |   for (const candidate of saveCandidates) {
  209 |     if (await candidate.isVisible().catch(() => false)) {
  210 |       await candidate.click();
  211 |       return;
  212 |     }
  213 |   }
  214 | 
  215 |   throw new Error('Unable to find Save button on Edit FFB page.');
  216 | }
  217 | 
  218 | async function clickBackToListAfterSave(page: Page) {
  219 |   await Promise.race([
  220 |     page.getByRole('heading', { name: /success/i }).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined),
  221 |     page.getByText(/successfully updated harvesting record|success|updated|saved/i).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined),
  222 |   ]);
  223 | 
  224 |   const backToList = page
  225 |     .locator('button:has-text("Back to list"):visible, a:has-text("Back to list"):visible')
  226 |     .first();
  227 | 
> 228 |   await expect(backToList).toBeVisible({ timeout: 15000 });
      |                            ^ Error: expect(locator).toBeVisible() failed
  229 |   await backToList.click();
  230 | 
  231 |   await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 20000 });
  232 | }
  233 | 
  234 | async function searchListByKeyword(page: Page, keyword: string) {
  235 |   const searchInputCandidates = [
  236 |     page.getByRole('searchbox').first(),
  237 |     page.getByPlaceholder(/search/i).first(),
  238 |     page.locator('input[type="search"], input[placeholder*="Search" i]').first(),
  239 |   ];
  240 | 
  241 |   for (const input of searchInputCandidates) {
  242 |     if (await input.isVisible().catch(() => false)) {
  243 |       await input.fill(keyword);
  244 |       await input.press('Enter').catch(() => undefined);
  245 |       return;
  246 |     }
  247 |   }
  248 | }
  249 | 
  250 | async function verifyUpdatedValuesInCurrentTable(page: Page, keyword: string) {
  251 |   await searchListByKeyword(page, keyword);
  252 |   const row = await getListRow(page);
  253 | 
  254 |   await expect(row).toContainText(UPDATED_VALUES.harvestedBunches);
  255 |   await expect(row).toContainText(UPDATED_VALUES.looseFruit);
  256 |   await expect(row).toContainText(UPDATED_VALUES.underRipe);
  257 | }
  258 | 
  259 | async function navigateToWebReport(page: Page) {
  260 |   const harvestingMenu = page.locator('a[href="javascript:void(0);"]', { hasText: 'FFB Harvesting' }).first();
  261 |   if ((await harvestingMenu.getAttribute('aria-expanded')) !== 'true') {
  262 |     await harvestingMenu.click();
  263 |   }
  264 | 
  265 |   const webReportCandidates = [
  266 |     page.getByRole('link', { name: /web report/i }).first(),
  267 |     page.locator('a[href*="report" i], a[href*="web" i]').filter({ hasText: /web report/i }).first(),
  268 |     page.locator('a').filter({ hasText: /web report/i }).first(),
  269 |   ];
  270 | 
  271 |   for (const candidate of webReportCandidates) {
  272 |     if (await candidate.isVisible().catch(() => false)) {
  273 |       await candidate.click();
  274 |       return;
  275 |     }
  276 |   }
  277 | 
  278 |   throw new Error('Unable to find Web Report menu in FFB Harvesting module.');
  279 | }
  280 | 
  281 | async function searchTransactionInWebReport(page: Page, keyword: string) {
  282 |   const searchInputCandidates = [
  283 |     page.getByRole('searchbox').first(),
  284 |     page.getByPlaceholder(/search/i).first(),
  285 |     page.locator('input[type="search"], input[placeholder*="Search" i], input[name*="search" i]').first(),
  286 |   ];
  287 | 
  288 |   for (const input of searchInputCandidates) {
  289 |     if (await input.isVisible().catch(() => false)) {
  290 |       await input.fill(keyword);
  291 |       await input.press('Enter').catch(() => undefined);
  292 |       break;
  293 |     }
  294 |   }
  295 | 
  296 |   await expect(
  297 |     page.getByText(new RegExp(`${escapeForRegex(keyword)}|${UPDATED_VALUES.harvestedBunches}`, 'i')).first(),
  298 |   ).toBeVisible({ timeout: 15000 });
  299 | }
  300 | 
  301 |   test(`${TEST_CASE.code} - ${TEST_CASE.name}`, async ({ page }) => {
  302 |     test.setTimeout(180000);
  303 |     test.info().annotations.push({ type: 'test_case', description: TEST_CASE.code });
  304 | 
  305 |   const loginPage = new LoginPage(page);
  306 | 
  307 |   await test.step('Login with valid credentials and select Sabah Land Development Board', async () => {
  308 |     await loginPage.goto(BASE_URL);
  309 |     await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  310 |     await expect(page.getByText('Dashboard')).toBeVisible();
  311 |     await selectOrganization(page);
  312 |   });
  313 | 
  314 |   await test.step('Navigate to FFB Harvesting list', async () => {
  315 |     await navigateToHarvestingList(page);
  316 |   });
  317 | 
  318 |   await test.step('Drill down using first column until transaction details page appears', async () => {
  319 |     await drillDownToTransactionDetails(page);
  320 |   });
  321 | 
  322 |   await test.step('At details page, click Edit icon for a transaction', async () => {
  323 |     await clickTransactionEditFromDetails(page);
  324 |     await expect(page.getByRole('button', { name: /\bsave\b/i }).first()).toBeVisible({ timeout: 15000 });
  325 |   });
  326 | 
  327 |   await test.step('Update values, save, and click Back To List', async () => {
  328 |     await fillTextboxByName(page, 'Total Harvested Bunches', UPDATED_VALUES.harvestedBunches);
```