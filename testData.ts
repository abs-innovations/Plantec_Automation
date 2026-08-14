import fs from 'fs';
import path from 'path';
import process from 'process';

type ClickAction = 'click' | 'dblclick';

type TestDataBundle = {
  baseUrl: string;
  loginCredentials: {
    username: string;
    password: string;
  };
  harvestingData: {
    estate: string;
    phase: string;
    block: string;
    plantingYear: string;
    lot: string;
    loader: string;
    loaderStaff: string;
    task: string;
    platform: string;
    totalBunches: string;
    rotten: string;
    unripe: string;
    overRipe: string;
    underRipe: string;
    emptyBunch: string;
    looseFruit: string;
    remarks: string;
  };
  harvestingAddFlow: {
    phase: string;
    block: string;
    plantingYear: string;
    lot: string;
    task: string;
    primaryPlatform: string;
    secondaryPlatformButton: string;
    secondaryPlatformDataId?: string;
    secondaryPlatformOption: string;
    approverButton: string;
    approverOption: string;
    harvesterGroupButton: string;
    harvesterGroupOption: string;
    harvesterSelectButton: string;
    harvesters: string[];
    incrementActions: Record<string, ClickAction[]>;
    finalCounterSelector: string;
    finalCounterClicks: number;
  };
  evacuationData: {
    estate: string;
    estateValue: string;
    phase: string;
    block: string;
    lot: string;
    binValue: string;
    vehicleValue: string;
    driverGroup: string;
    driver: string;
    loaderGroup: string;
    loader: string;
    vehicleNo: string;
    driverName: string;
    totalBunches: string;
    rangeStartDay: string;
    rangeEndDay: string;
  };
  alternativeLoader: string;
  timeouts: {
    short: number;
    medium: number;
    long: number;
  };
  platformOptions: string[];
  testScenarios: Record<string, Record<string, string>>;
  opJobCodeData: {
    moduleName: string;
    targetJobCode: string;
  };
  opWorkerData: {
    workerGroup: string;
    primaryRole: string;
    labourType: string;
    rateType: string;
    targetEmployeeCode: string;
  };
  opWorkerGroupData: {
    estate: string;
    targetGroupName: string;
  };
  opHolidayData: {
    estate: string;
    holidayType: string;
    targetRemark: string;
  };
  opPublicHolidayData: {
    estate: string;
    holidayRemarks: string[];
  };
  opHolidayTypeData: {
    targetName: string;
  };
  opAnnualLeaveData: {
    estate: string;
    workerGroup: string;
    worker: string;
    targetRemark: string;
  };
};

function readJson(profileName: string): unknown {
  const profilePath = path.join(__dirname, 'test-data', 'profiles', `${profileName}.json`);
  const content = fs.readFileSync(profilePath, 'utf-8');
  return JSON.parse(content);
}

function requireObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid test data: '${field}' must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid test data: '${field}' must be a non-empty string.`);
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid test data: '${field}' must be a valid number.`);
  }
  return value;
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`Invalid test data: '${field}' must be an array of strings.`);
  }
  return value as string[];
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
}

function requireClickActions(value: unknown, field: string): ClickAction[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid test data: '${field}' must be an array.`);
  }

  const actions = value as unknown[];
  for (const action of actions) {
    if (action !== 'click' && action !== 'dblclick') {
      throw new Error(`Invalid test data: '${field}' must contain only 'click' or 'dblclick'.`);
    }
  }

  return actions as ClickAction[];
}

function optionalStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((item) => !!item);
}

function parseBundle(raw: unknown): TestDataBundle {
  const root = requireObject(raw, 'root');

  const loginCredentials = requireObject(root.loginCredentials, 'loginCredentials');
  const harvestingData = requireObject(root.harvestingData, 'harvestingData');
  const harvestingAddFlow = requireObject(root.harvestingAddFlow, 'harvestingAddFlow');
  const evacuationData = requireObject(root.evacuationData, 'evacuationData');
  const timeouts = requireObject(root.timeouts, 'timeouts');
  const testScenarios = requireObject(root.testScenarios, 'testScenarios');
  const opJobCodeData = requireObject(root.opJobCodeData, 'opJobCodeData');
  const opWorkerData = requireObject(root.opWorkerData, 'opWorkerData');
  const opWorkerGroupData = requireObject(root.opWorkerGroupData, 'opWorkerGroupData');
  const opHolidayData = requireObject(root.opHolidayData, 'opHolidayData');
  const opPublicHolidayData = requireObject(root.opPublicHolidayData, 'opPublicHolidayData');
  const opHolidayTypeData = requireObject(root.opHolidayTypeData, 'opHolidayTypeData');
  const opAnnualLeaveData = requireObject(root.opAnnualLeaveData, 'opAnnualLeaveData');

  const incrementActionsRaw = requireObject(harvestingAddFlow.incrementActions, 'harvestingAddFlow.incrementActions');
  const incrementActions: Record<string, ClickAction[]> = {};
  for (const [key, value] of Object.entries(incrementActionsRaw)) {
    incrementActions[key] = requireClickActions(value, `harvestingAddFlow.incrementActions.${key}`);
  }

  const parsedScenarios: Record<string, Record<string, string>> = {};
  for (const [scenarioName, scenarioData] of Object.entries(testScenarios)) {
    const scenarioObj = requireObject(scenarioData, `testScenarios.${scenarioName}`);
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(scenarioObj)) {
      normalized[key] = requireString(value, `testScenarios.${scenarioName}.${key}`);
    }
    parsedScenarios[scenarioName] = normalized;
  }

  return {
    baseUrl: requireString(root.baseUrl, 'baseUrl'),
    loginCredentials: {
      username: requireString(loginCredentials.username, 'loginCredentials.username'),
      password: requireString(loginCredentials.password, 'loginCredentials.password'),
    },
    harvestingData: {
      estate: requireString(harvestingData.estate, 'harvestingData.estate'),
      phase: requireString(harvestingData.phase, 'harvestingData.phase'),
      block: requireString(harvestingData.block, 'harvestingData.block'),
      plantingYear: requireString(harvestingData.plantingYear, 'harvestingData.plantingYear'),
      lot: requireString(harvestingData.lot, 'harvestingData.lot'),
      loader: requireString(harvestingData.loader, 'harvestingData.loader'),
      loaderStaff: requireString(harvestingData.loaderStaff, 'harvestingData.loaderStaff'),
      task: requireString(harvestingData.task, 'harvestingData.task'),
      platform: requireString(harvestingData.platform, 'harvestingData.platform'),
      totalBunches: requireString(harvestingData.totalBunches, 'harvestingData.totalBunches'),
      rotten: requireString(harvestingData.rotten, 'harvestingData.rotten'),
      unripe: requireString(harvestingData.unripe, 'harvestingData.unripe'),
      overRipe: requireString(harvestingData.overRipe, 'harvestingData.overRipe'),
      underRipe: requireString(harvestingData.underRipe, 'harvestingData.underRipe'),
      emptyBunch: requireString(harvestingData.emptyBunch, 'harvestingData.emptyBunch'),
      looseFruit: requireString(harvestingData.looseFruit, 'harvestingData.looseFruit'),
      remarks: requireString(harvestingData.remarks, 'harvestingData.remarks'),
    },
    harvestingAddFlow: {
      phase: requireString(harvestingAddFlow.phase, 'harvestingAddFlow.phase'),
      block: requireString(harvestingAddFlow.block, 'harvestingAddFlow.block'),
      plantingYear: requireString(harvestingAddFlow.plantingYear, 'harvestingAddFlow.plantingYear'),
      lot: requireString(harvestingAddFlow.lot, 'harvestingAddFlow.lot'),
      task: requireString(harvestingAddFlow.task, 'harvestingAddFlow.task'),
      primaryPlatform: requireString(harvestingAddFlow.primaryPlatform, 'harvestingAddFlow.primaryPlatform'),
      secondaryPlatformButton: requireString(harvestingAddFlow.secondaryPlatformButton, 'harvestingAddFlow.secondaryPlatformButton'),
      secondaryPlatformDataId: optionalString(harvestingAddFlow.secondaryPlatformDataId),
      secondaryPlatformOption: requireString(harvestingAddFlow.secondaryPlatformOption, 'harvestingAddFlow.secondaryPlatformOption'),
      approverButton: requireString(harvestingAddFlow.approverButton, 'harvestingAddFlow.approverButton'),
      approverOption: requireString(harvestingAddFlow.approverOption, 'harvestingAddFlow.approverOption'),
      harvesterGroupButton: requireString(harvestingAddFlow.harvesterGroupButton, 'harvestingAddFlow.harvesterGroupButton'),
      harvesterGroupOption: requireString(harvestingAddFlow.harvesterGroupOption, 'harvestingAddFlow.harvesterGroupOption'),
      harvesterSelectButton: requireString(harvestingAddFlow.harvesterSelectButton, 'harvestingAddFlow.harvesterSelectButton'),
      harvesters: requireStringArray(harvestingAddFlow.harvesters, 'harvestingAddFlow.harvesters'),
      incrementActions,
      finalCounterSelector: requireString(harvestingAddFlow.finalCounterSelector, 'harvestingAddFlow.finalCounterSelector'),
      finalCounterClicks: requireNumber(harvestingAddFlow.finalCounterClicks, 'harvestingAddFlow.finalCounterClicks'),
    },
    evacuationData: {
      estate: requireString(evacuationData.estate, 'evacuationData.estate'),
      estateValue: requireString(evacuationData.estateValue, 'evacuationData.estateValue'),
      phase: requireString(evacuationData.phase, 'evacuationData.phase'),
      block: requireString(evacuationData.block, 'evacuationData.block'),
      lot: requireString(evacuationData.lot, 'evacuationData.lot'),
      binValue: requireString(evacuationData.binValue, 'evacuationData.binValue'),
      vehicleValue: requireString(evacuationData.vehicleValue, 'evacuationData.vehicleValue'),
      driverGroup: requireString(evacuationData.driverGroup, 'evacuationData.driverGroup'),
      driver: requireString(evacuationData.driver, 'evacuationData.driver'),
      loaderGroup: requireString(evacuationData.loaderGroup, 'evacuationData.loaderGroup'),
      loader: requireString(evacuationData.loader, 'evacuationData.loader'),
      vehicleNo: requireString(evacuationData.vehicleNo, 'evacuationData.vehicleNo'),
      driverName: requireString(evacuationData.driverName, 'evacuationData.driverName'),
      totalBunches: requireString(evacuationData.totalBunches, 'evacuationData.totalBunches'),
      rangeStartDay: requireString(evacuationData.rangeStartDay, 'evacuationData.rangeStartDay'),
      rangeEndDay: requireString(evacuationData.rangeEndDay, 'evacuationData.rangeEndDay'),
    },
    alternativeLoader: requireString(root.alternativeLoader, 'alternativeLoader'),
    timeouts: {
      short: requireNumber(timeouts.short, 'timeouts.short'),
      medium: requireNumber(timeouts.medium, 'timeouts.medium'),
      long: requireNumber(timeouts.long, 'timeouts.long'),
    },
    platformOptions: optionalStringArray(root.platformOptions),
    testScenarios: parsedScenarios,
    opJobCodeData: {
      moduleName: requireString(opJobCodeData.moduleName, 'opJobCodeData.moduleName'),
      targetJobCode: requireString(opJobCodeData.targetJobCode, 'opJobCodeData.targetJobCode'),
    },
    opWorkerData: {
      workerGroup: requireString(opWorkerData.workerGroup, 'opWorkerData.workerGroup'),
      primaryRole: requireString(opWorkerData.primaryRole, 'opWorkerData.primaryRole'),
      labourType: requireString(opWorkerData.labourType, 'opWorkerData.labourType'),
      rateType: requireString(opWorkerData.rateType, 'opWorkerData.rateType'),
      targetEmployeeCode: requireString(opWorkerData.targetEmployeeCode, 'opWorkerData.targetEmployeeCode'),
    },
    opWorkerGroupData: {
      estate: requireString(opWorkerGroupData.estate, 'opWorkerGroupData.estate'),
      targetGroupName: requireString(opWorkerGroupData.targetGroupName, 'opWorkerGroupData.targetGroupName'),
    },
    opHolidayData: {
      estate: requireString(opHolidayData.estate, 'opHolidayData.estate'),
      holidayType: requireString(opHolidayData.holidayType, 'opHolidayData.holidayType'),
      targetRemark: requireString(opHolidayData.targetRemark, 'opHolidayData.targetRemark'),
    },
    opPublicHolidayData: {
      estate: requireString(opPublicHolidayData.estate, 'opPublicHolidayData.estate'),
      holidayRemarks: requireStringArray(opPublicHolidayData.holidayRemarks, 'opPublicHolidayData.holidayRemarks'),
    },
    opHolidayTypeData: {
      targetName: requireString(opHolidayTypeData.targetName, 'opHolidayTypeData.targetName'),
    },
    opAnnualLeaveData: {
      estate: requireString(opAnnualLeaveData.estate, 'opAnnualLeaveData.estate'),
      workerGroup: requireString(opAnnualLeaveData.workerGroup, 'opAnnualLeaveData.workerGroup'),
      worker: requireString(opAnnualLeaveData.worker, 'opAnnualLeaveData.worker'),
      targetRemark: requireString(opAnnualLeaveData.targetRemark, 'opAnnualLeaveData.targetRemark'),
    },
  };
}

function loadBundle(): TestDataBundle {
  const requestedProfile = process.env.TEST_PROFILE?.trim() || 'default';
  try {
    const parsed = parseBundle(readJson(requestedProfile));
    return parsed;
  } catch (error) {
    if (requestedProfile === 'default') {
      throw error;
    }

    const fallback = parseBundle(readJson('default'));
    console.warn(
      `[testData] Failed to load TEST_PROFILE='${requestedProfile}', falling back to 'default'.`,
      error,
    );
    return fallback;
  }
}

const bundle = loadBundle();

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function normalizeRuntimeText(value: string): string {
  return value.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

function uniqueStrings(items: string[]): string[] {
  const normalized = items
    .map((item) => normalizeRuntimeText(item))
    .filter((item) => !!item);
  return Array.from(new Set(normalized));
}

function resolveHarvestingPlatformSelection() {
  const configuredPool = uniqueStrings([
    ...bundle.platformOptions,
    bundle.harvestingAddFlow.primaryPlatform,
    bundle.harvestingAddFlow.secondaryPlatformOption,
  ]);

  const envPrimary = process.env.PLATFORM_PRIMARY ? normalizeRuntimeText(process.env.PLATFORM_PRIMARY) : undefined;
  const envSecondary = process.env.PLATFORM_SECONDARY ? normalizeRuntimeText(process.env.PLATFORM_SECONDARY) : undefined;
  const seed = process.env.TEST_RUN_ID?.trim() || `${Date.now()}-${process.pid}`;

  const fallbackPrimary = normalizeRuntimeText(bundle.harvestingAddFlow.primaryPlatform);
  const fallbackSecondary =
    normalizeRuntimeText(bundle.harvestingAddFlow.secondaryPlatformOption) === fallbackPrimary
      ? configuredPool.find((platform) => platform !== fallbackPrimary) || fallbackPrimary
      : normalizeRuntimeText(bundle.harvestingAddFlow.secondaryPlatformOption);

  if (envPrimary && configuredPool.length > 0 && !configuredPool.includes(envPrimary)) {
    throw new Error(
      `[testData] PLATFORM_PRIMARY='${envPrimary}' is not present in platformOptions=[${configuredPool.join(', ')}].`
    );
  }

  if (envSecondary && configuredPool.length > 0 && !configuredPool.includes(envSecondary)) {
    throw new Error(
      `[testData] PLATFORM_SECONDARY='${envSecondary}' is not present in platformOptions=[${configuredPool.join(', ')}].`
    );
  }

  if (envPrimary) {
    const secondary = envSecondary || configuredPool.find((platform) => platform !== envPrimary) || fallbackSecondary;
    return {
      primaryPlatform: envPrimary,
      secondaryPlatformOption: secondary,
      seed,
      pool: configuredPool,
    };
  }

  if (configuredPool.length === 0) {
    return {
      primaryPlatform: fallbackPrimary,
      secondaryPlatformOption: fallbackSecondary,
      seed,
      pool: configuredPool,
    };
  }

  if (configuredPool.length === 1) {
    return {
      primaryPlatform: configuredPool[0],
      secondaryPlatformOption: envSecondary || fallbackSecondary,
      seed,
      pool: configuredPool,
    };
  }

  const primaryIndex = hashString(seed) % configuredPool.length;
  const rotatedPrimary = configuredPool[primaryIndex];
  const rotatedSecondary =
    envSecondary || configuredPool[(primaryIndex + 1) % configuredPool.length] || fallbackSecondary;

  return {
    primaryPlatform: rotatedPrimary,
    secondaryPlatformOption: rotatedSecondary === rotatedPrimary ? fallbackSecondary : rotatedSecondary,
    seed,
    pool: configuredPool,
  };
}

const HARVESTING_PLATFORM_SELECTION = resolveHarvestingPlatformSelection();

export const ACTIVE_TEST_PROFILE = process.env.TEST_PROFILE?.trim() || 'default';
export const BASE_URL = process.env.BASE_URL?.trim() || bundle.baseUrl;
export const LOGIN_CREDENTIALS = {
  username: process.env.LOGIN_USERNAME?.trim() || bundle.loginCredentials.username,
  password: process.env.LOGIN_PASSWORD?.trim() || bundle.loginCredentials.password,
};
export const HARVESTING_DATA = bundle.harvestingData;
export const HARVESTING_ADD_FLOW = bundle.harvestingAddFlow;
export { HARVESTING_PLATFORM_SELECTION };
export const EVACUATION_DATA = bundle.evacuationData;
export const ALTERNATIVE_LOADER = bundle.alternativeLoader;
export const TIMEOUTS = bundle.timeouts;
export const TEST_SCENARIOS = bundle.testScenarios;
export const OP_JOB_CODE_DATA = bundle.opJobCodeData;
export const OP_WORKER_DATA = bundle.opWorkerData;
export const OP_WORKER_GROUP_DATA = bundle.opWorkerGroupData;
export const OP_HOLIDAY_DATA = bundle.opHolidayData;
export const OP_PUBLIC_HOLIDAY_DATA = bundle.opPublicHolidayData;
export const OP_HOLIDAY_TYPE_DATA = bundle.opHolidayTypeData;
export const OP_ANNUAL_LEAVE_DATA = bundle.opAnnualLeaveData;

export function getTestData() {
  return {
    profile: ACTIVE_TEST_PROFILE,
    baseUrl: BASE_URL,
    loginCredentials: LOGIN_CREDENTIALS,
    harvestingData: HARVESTING_DATA,
    harvestingAddFlow: HARVESTING_ADD_FLOW,
    evacuationData: EVACUATION_DATA,
    alternativeLoader: ALTERNATIVE_LOADER,
    timeouts: TIMEOUTS,
    testScenarios: TEST_SCENARIOS,
    opJobCodeData: OP_JOB_CODE_DATA,
    opWorkerData: OP_WORKER_DATA,
    opWorkerGroupData: OP_WORKER_GROUP_DATA,
    opHolidayData: OP_HOLIDAY_DATA,
    opPublicHolidayData: OP_PUBLIC_HOLIDAY_DATA,
    opHolidayTypeData: OP_HOLIDAY_TYPE_DATA,
    opAnnualLeaveData: OP_ANNUAL_LEAVE_DATA,
  };
}
