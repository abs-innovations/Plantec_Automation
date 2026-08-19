# QA_Automation
QA Playwright Automation

The npm package files stay at the repository root. Web automation files, test data, Playwright configs, scripts, and generated reports live under `Plantec_Web`.

## Profile-Based Test Data

Test data is now loaded from JSON profile files instead of hardcoded values in specs.

Profiles are stored in:

- `test-data/profiles/default.json`
- `test-data/profiles/qa.json`
- `test-data/profiles/uat.json`

### Run with default profile

```powershell
npm run test:ffb
```

Tests use a shared login credential, so runs are configured to execute serially. Do not start multiple test scripts at the same time with the same credentials.

### Run by migrated folder

```powershell
npm run test:ffb
npm run test:evacuation
npm run test:operational
```

To check folder discovery without logging in or executing tests:

```powershell
npm run test:ffb:list
npm run test:evacuation:list
npm run test:operational:list
```

### Run with a specific profile

```powershell
$env:TEST_PROFILE='qa'; npm run test:ffb
```

### Override credentials or URL from environment

```powershell
$env:TEST_PROFILE='qa'
$env:BASE_URL='https://your-env-url/plantec/index'
$env:LOGIN_USERNAME='your-username'
$env:LOGIN_PASSWORD='your-password'
npm run test:ffb
```

### Notes

- If `TEST_PROFILE` is missing, `default` is used.
- If a profile file fails to load, loader falls back to `default`.
- Loader validates required fields and throws clear errors when data shape is invalid.
