/**
 * Centralized test data and constants
 * Update these values to reflect your test environment and test cases
 */

// ===== LOGIN CREDENTIALS =====
export const LOGIN_CREDENTIALS = {
  username: 'cbi_estateb',
  password: 'pmmp123',
};

// ===== BASE URL =====
export const BASE_URL = 'https://test.pmmp-abs.com/plantec/index';

// ===== HARVESTING TEST DATA =====
export const HARVESTING_DATA = {
  estate: 'KAV - Punteh',
  phase: 'Phase 1',
  block: 'Block 1',
  plantingYear: '2012',
  lot: 'Lot 1',
  loader: 'Loader - Punteh',
  loaderStaff: 'LS02 - Loader Sarah',
  task: 'T01',
  platform: 'Platform 8',
  // Harvest input values
  totalBunches: '132',
  unripe: '021',
  overRipe: '01',
  underRipe: '012',
};

// ===== HARVESTING ADD AUTOMATED FLOW CONFIG =====
// Single source of truth for the recorded Add FFB Harvesting selections.
export const HARVESTING_ADD_FLOW = {
  phase: 'Phase 1',
  block: 'Block 1',
  plantingYear: '2012',
  lot: 'Lot 1',
  task: 'T01',
  primaryPlatform: 'Platform 1',
  secondaryPlatformButton: 'Platform',
  secondaryPlatformOption: 'Platform 5',
  approverButton: 'User 04 (Regional Manager)',
  approverOption: 'Hafizah user (Assistant',
  harvesterGroupButton: 'Nothing Selected',
  harvesterGroupOption: 'Harvester - Punteh',
  harvesterSelectButton: 'Please Select At Least 1',
  harvesters: [
    'HAV006 - Joe',
    'HAV007 - Zulhilmi',
    'HAV007 - Zulhilmi',
    'HAV009 - Yusri',
    'HV001 - Estor',
  ],
  incrementActions: {
    formDynamicSetup15: ['dblclick', 'click'],
    formDynamicSetup18: ['dblclick', 'click', 'click'],
    formDynamicSetup17: ['click', 'dblclick'],
  },
  finalCounterSelector: '#formDynamicSetup22 > .form-group > .input-group > span:nth-child(5) > .btn',
  finalCounterClicks: 5,
} as const;

// ===== EVACUATION TEST DATA =====
export const EVACUATION_DATA = {
  estate: 'KAV - Punteh',
  estateValue: '408',
  phase: 'Phase 1',
  block: 'Block 1',
  lot: 'Lot 1',
  binValue: '41',
  vehicleValue: '15',
  driverGroup: 'Driver - Punteh',
  driver: 'DS02 - Driver Hashim',
  loaderGroup: 'Loader - Punteh',
  loader: 'LS04 - Witar',
  vehicleNo: 'QAB1234',
  driverName: 'Driver Test',
  totalBunches: '120',
  rangeStartDay: '1',
  rangeEndDay: '18',
};

// ===== ALTERNATIVE LOADERS (for testing multiple selections) =====
export const ALTERNATIVE_LOADER = 'LS04 - Witar';

// ===== TIMEOUT SETTINGS =====
export const TIMEOUTS = {
  short: 3000,
  medium: 5000,
  long: 10000,
};

// ===== TEST SCENARIOS =====
// Define different test data sets for different scenarios
export const TEST_SCENARIOS = {
  scenario1: {
    estate: 'KAV - Punteh',
    phase: 'Phase 1',
    block: 'Block 1',
    plantingYear: '2012',
    lot: 'Lot 1',
    loaderStaff: 'LS02 - Loader Sarah',
    task: 'T01',
    platform: 'Platform 8',
    totalBunches: '132',
    unripe: '021',
    overRipe: '01',
    underRipe: '012',
  },
  scenario2: {
    // Add another scenario for testing different data
    estate: 'KAV - Punteh',
    phase: 'Phase 1',
    block: 'Block 2',
    plantingYear: '2012',
    lot: 'Lot 2',
    loaderStaff: 'LS04 - Witar',
    task: 'T02',
    platform: 'Platform 1',
    totalBunches: '150',
    unripe: '10',
    overRipe: '5',
    underRipe: '8',
  },
  evacuationScenario1: {
    estate: 'KAV - Punteh',
    phase: 'Phase 1',
    block: 'Block 1',
    lot: 'Lot 1',
    vehicleNo: 'QAB1234',
    driverName: 'Driver Test',
    totalBunches: '120',
  },
};
