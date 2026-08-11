# QA_Automation
QA Playright Automation

## Profile-Based Test Data

Test data is now loaded from JSON profile files instead of hardcoded values in specs.

Profiles are stored in:

- `test-data/profiles/default.json`
- `test-data/profiles/qa.json`
- `test-data/profiles/uat.json`

### Run with default profile

```powershell
npx playwright test --config=playwright.ffb.config.ts
```

### Run with a specific profile

```powershell
$env:TEST_PROFILE='qa'; npx playwright test --config=playwright.ffb.config.ts
```

### Override credentials or URL from environment

```powershell
$env:TEST_PROFILE='qa'
$env:BASE_URL='https://your-env-url/plantec/index'
$env:LOGIN_USERNAME='your-username'
$env:LOGIN_PASSWORD='your-password'
npx playwright test --config=playwright.ffb.config.ts
```

### Notes

- If `TEST_PROFILE` is missing, `default` is used.
- If a profile file fails to load, loader falls back to `default`.
- Loader validates required fields and throws clear errors when data shape is invalid.
