import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Evacuation Page Object
 * Handles Evacuation module navigation and form interactions
 */
export class EvacuationPage extends BasePage {
  readonly moduleRoot = () => this.page.getByText('[SLDB]');
  readonly evacuationLink = () => this.page.getByRole('link', { name: ' Evacuation' });
  readonly addEvacuationLink = () => this.page.getByRole('link', { name: ' Add Evacuation' });
  readonly saveButton = () => this.page.getByRole('button', { name: /save/i });
  readonly backToListButton = () => this.page.getByRole('button', { name: /back to list/i });

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to Evacuation module from main menu.
   * Steps: Click [SLDB] menu → Click FFB Harvesting to open dropdown → Click Evacuation
   */
  async navigateToEvacuation() {
    // Step 1: Click [SLDB] sidebar menu
    await this.moduleRoot().click();
    
    // Step 2: Click FFB Harvesting link to expand submenu
    await this.page.getByRole('link', { name: ' FFB Harvesting' }).click();
    
    // Step 3: Click Evacuation from submenu
    await this.evacuationLink().click();
    
    // Wait for page to load
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open Add Evacuation form.
   */
  async clickAddEvacuation() {
    await this.addEvacuationLink().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select option from dropdown by button label and option text.
   */
  async selectDropdown(buttonLabel: string, optionText: string) {
    await this.page.getByRole('button', { name: new RegExp(buttonLabel, 'i') }).click();
    await this.page.locator('a').filter({ hasText: optionText }).first().click();
  }

  /**
   * Fill text field by accessible label.
   */
  async fillFieldByLabel(fieldLabel: string, value: string) {
    const field = this.page.getByRole('textbox', { name: new RegExp(fieldLabel, 'i') });
    await field.click();
    await field.fill(value);
  }

  /**
   * Select estate by option value from native select.
   */
  async selectEstateByValue(estateValue: string) {
    await this.page.locator('#estateId').selectOption(estateValue);
  }

  /**
   * Open Bin Evacuation section/tab.
   */
  async openBinEvacuationSection() {
    await this.page.getByText('Bin Evacuation').click();
  }

  /**
   * Select bin by option value.
   */
  async selectBinByValue(binValue: string) {
    await this.page.locator('#binId').selectOption(binValue);
  }

  /**
   * Select vehicle by option value.
   */
  async selectVehicleByValue(vehicleValue: string) {
    await this.page.locator('#vehicleId').selectOption(vehicleValue);
  }

  /**
   * Select driver group from driver group dropdown.
   */
  async selectDriverGroup(groupName: string) {
    await this.page
      .locator('#formdriverGroup')
      .getByRole('button', { name: /nothing selected/i })
      .click();
    await this.page.getByRole('option', { name: groupName }).nth(2).click();
  }

  /**
   * Select driver from driver dropdown.
   */
  async selectDriver(driverName: string) {
    await this.page
      .locator('#formdriver')
      .getByRole('button', { name: /nothing selected/i })
      .click();
    await this.page.locator('a').filter({ hasText: driverName }).first().click();
  }

  /**
   * Select loader group from generic dropdown.
   */
  async selectLoaderGroup(loaderGroupName: string) {
    await this.page.getByRole('button', { name: /nothing selected/i }).nth(0).click();
    await this.page.locator('a').filter({ hasText: loaderGroupName }).first().click();
  }

  /**
   * Select loader from generic dropdown.
   */
  async selectLoader(loaderName: string) {
    await this.page.getByRole('button', { name: /nothing selected/i }).nth(1).click();
    await this.page.locator('a').filter({ hasText: loaderName }).first().click();
  }

  /**
   * Set date range filter using day cells from datepicker and run search.
   */
  async setDateRangeAndSearch(startDay: string, endDay: string) {
    await this.page.locator('#ffbRecordFilterFirstRow input[name="daterange"]').click();
    await this.page.getByRole('cell', { name: startDay, exact: true }).nth(2).click();
    await this.page.getByRole('cell', { name: endDay, exact: true }).nth(1).click();
    await this.page.getByRole('button', { name: /search/i }).click();
  }

  /**
   * Select first returned row/action after search.
   */
  async selectFirstSearchResult() {
    await this.page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
  }

  /**
   * Save current evacuation form.
   */
  async save() {
    await this.saveButton().click();
  }

  /**
   * Return to list view.
   */
  async goBackToList() {
    await this.backToListButton().click();
  }
}
