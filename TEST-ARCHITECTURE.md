# Playwright Test Architecture Guide

## 📁 Project Structure

```
tests/
├── pages/                    # Page Object Model (POM)
│   ├── BasePage.ts          # Base class with common methods
│   ├── LoginPage.ts         # Login page selectors & methods
│   └── HarvestingPage.ts    # Harvesting page selectors & methods
│
├── utils/                   # Utilities & helpers
│   ├── testData.ts         # Test data, constants, scenarios
│   └── helpers.ts          # Common helper functions
│
├── test-3.spec.ts          # Original test (for reference)
├── test-3-refactored.spec.ts # Refactored test using POM
└── other test files...
```

## 🎯 Core Concepts

### Page Object Model (POM)
A design pattern where each page/feature is represented as a class with:
- **Selectors** - Element locators encapsulated as methods
- **Methods** - User actions (click, fill, select, etc.)
- **No assertions** - Tests handle assertions separately

**Benefits:**
- Single source of truth for selectors
- Easy to maintain when UI changes
- Reusable across multiple tests
- Clear separation of concerns

### Test Data Centralization
All constants and test data in `testData.ts`:
- Credentials
- URLs
- Test scenarios
- Timeout settings

**Benefits:**
- Change test data without touching test code
- Easy to create multiple test scenarios
- Quick environment switches

## 📝 Creating New Tests

### Option 1: Quick Single Test
```typescript
import { test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { HarvestingPage } from './pages/HarvestingPage';
import { LOGIN_CREDENTIALS, BASE_URL, HARVESTING_DATA } from './utils/testData';

test('My new test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const harvestingPage = new HarvestingPage(page);

  // Use page objects with readable method names
  await loginPage.goto(BASE_URL);
  await loginPage.login(LOGIN_CREDENTIALS.username, LOGIN_CREDENTIALS.password);
  await harvestingPage.navigateToHarvesting();
  // ... more steps
});
```

### Option 2: Using Test Scenarios
```typescript
import { TEST_SCENARIOS } from './utils/testData';

test.describe('Multiple scenarios', () => {
  Object.entries(TEST_SCENARIOS).forEach(([scenarioName, scenario]) => {
    test(`Scenario: ${scenarioName}`, async ({ page }) => {
      const harvestingPage = new HarvestingPage(page);
      
      await harvestingPage.selectEstate(scenario.estate);
      await harvestingPage.selectPhase(scenario.phase);
      // Use scenario data...
    });
  });
});
```

### Option 3: Parameterized Tests
```typescript
const testCases = [
  { estate: 'Estate A', phase: 'Phase 1' },
  { estate: 'Estate B', phase: 'Phase 2' },
];

test.describe('Parameterized tests', () => {
  testCases.forEach((testCase) => {
    test(`Test for ${testCase.estate}`, async ({ page }) => {
      const harvestingPage = new HarvestingPage(page);
      
      await harvestingPage.selectEstate(testCase.estate);
      await harvestingPage.selectPhase(testCase.phase);
      // ...
    });
  });
});
```

## 🔧 Creating New Page Objects

### Step 1: Create the Page Object File
```typescript
// tests/pages/NewPage.ts
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class NewPage extends BasePage {
  // Define selectors as methods for encapsulation
  readonly submitButton = () => this.page.getByRole('button', { name: 'Submit' });
  readonly nameField = () => this.page.getByRole('textbox', { name: 'Name' });

  constructor(page: Page) {
    super(page);
  }

  // Create methods for user interactions
  async fillForm(name: string) {
    await this.nameField().fill(name);
  }

  async submit() {
    await this.submitButton().click();
  }
}
```

### Step 2: Use in Tests
```typescript
import { NewPage } from './pages/NewPage';

test('My test', async ({ page }) => {
  const newPage = new NewPage(page);
  await newPage.fillForm('John');
  await newPage.submit();
});
```

## 📊 Updating Selectors When UI Changes

**Before (Hard to maintain):**
If selector changes, search all test files for the string:
```bash
grep -r "getByRole('button', { name: 'Save' })" tests/
```

**After (Easy with POM):**
Update in ONE place (the page object):
```typescript
// tests/pages/HarvestingPage.ts
readonly saveButton = () => this.page.getByRole('button', { name: 'Save' }); // Updated!
```

All tests using `harvestingPage.save()` automatically use the new selector.

## 🧪 Using Helpers

```typescript
import { logTestInfo, retryWithBackoff, verifyElementVisible } from './utils/helpers';

test('Test with helpers', async ({ page }) => {
  logTestInfo('Test started');
  
  // Retry a flaky operation
  await retryWithBackoff(async () => {
    await page.click('button');
  });
  
  // Verify element state
  await verifyElementVisible(page, '.success-message');
});
```

## 🚀 Best Practices

### ✅ DO:
- Use page objects for all selector interactions
- Keep selectors in page objects
- Use test data from `testData.ts`
- Create reusable methods in page objects
- Add JSDoc comments to methods
- Use meaningful method names that describe actions
- Group related selectors and methods

### ❌ DON'T:
- Hardcode selectors in tests
- Hardcode test data (URLs, credentials, etc.)
- Mix multiple pages' concerns in one file
- Use inline assertions in page objects
- Create magic values - use testData instead

## 📚 Adding More Test Data Scenarios

```typescript
// tests/utils/testData.ts
export const TEST_SCENARIOS = {
  scenario1: { /* ... */ },
  scenario2: { /* ... */ },
  scenario3: {  // New scenario
    estate: 'KAV - Punteh',
    phase: 'Phase 2',
    block: 'Block 3',
    // ... other fields
  },
};
```

## 🔍 Debugging

### Use logTestInfo for debugging:
```typescript
const harvestingPage = new HarvestingPage(page);
logTestInfo('About to select estate', { estate: 'KAV - Punteh' });
await harvestingPage.selectEstate('KAV - Punteh');
logTestInfo('Estate selected successfully');
```

### Use takeScreenshot for visual debugging:
```typescript
const basePage = new BasePage(page);
await basePage.takeScreenshot('after-login');
```

## 🔄 Migration Path

### Moving existing tests to use POM:
1. Identify all unique selectors in your test
2. Create page object methods for them
3. Replace test code with method calls
4. Extract test data to `testData.ts`
5. Verify test still works

**Example transformation:**
```typescript
// Before
await page.getByRole('textbox', { name: 'Username' }).fill('user@example.com');
await page.getByRole('button', { name: 'Login' }).click();

// After
await loginPage.enterUsername('user@example.com');
await loginPage.clickLogin();
```

## 📞 Common Issues & Solutions

### Issue: Selector returns multiple elements
**Solution:** Make selector more specific in page object
```typescript
// ❌ Returns multiple buttons
readonly saveButton = () => this.page.getByRole('button', { name: 'Save' });

// ✅ More specific
readonly saveButton = () => this.page.locator('.form-actions').getByRole('button', { name: 'Save' });
```

### Issue: Test fails after UI change
**Solution:** Update selector in page object only
```typescript
// HarvestingPage.ts - The ONLY place to change
readonly saveButton = () => this.page.locator('button[data-testid="save-btn"]');
```

### Issue: Flaky tests
**Solution:** Use helpers and waits
```typescript
await retryWithBackoff(() => harvestingPage.save());
await waitForCondition(() => page.url().includes('success'));
```

## 🎓 Next Steps

1. **Run existing refactored test:**
   ```bash
   npx playwright test test-3-refactored.spec.ts
   ```

2. **Create a new test file** following the patterns above

3. **Gradually migrate** existing tests to use page objects

4. **Add more page objects** as your test suite grows

5. **Expand test data** with more scenarios and edge cases
