const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { spawnSync } = require('child_process');
const nodemailer = require('nodemailer');

function parseAttributes(attrText) {
  const attrs = {};
  const regex = /([\w:-]+)="([^"]*)"/g;
  let match;

  while ((match = regex.exec(attrText || '')) !== null) {
    attrs[match[1]] = decodeXml(match[2]);
  }

  return attrs;
}

function decodeXml(value) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function stripCdata(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '');
}

function stripTags(value) {
  return decodeXml(
    stripCdata(String(value || '')).replace(/<[^>]+>/g, ''),
  )
    .replace(/\r/g, '')
    .trim();
}

function extractBodyBetweenTags(xml, startIndex, closingTag) {
  const endIndex = xml.indexOf(closingTag, startIndex);
  return endIndex === -1 ? '' : xml.slice(startIndex, endIndex);
}

function formatDuration(seconds) {
  const value = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(value / 60).toString().padStart(2, '0');
  const secs = Math.floor(value % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function formatDurationHms(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds || 0)));
  const hours = Math.floor(value / 3600).toString().padStart(2, '0');
  const mins = Math.floor((value % 3600) / 60).toString().padStart(2, '0');
  const secs = Math.floor(value % 60).toString().padStart(2, '0');
  return `${hours}:${mins}:${secs}`;
}

function firstMatch(text, regex, formatter = (match) => match[0]) {
  const match = String(text || '').match(regex);
  return match ? formatter(match) : '';
}

function summarizeFailure(value) {
  const text = stripTags(value);
  const parts = [];

  const timeout = firstMatch(
    text,
    /Test timeout of \d+ms exceeded\.?/i,
  );

  const error = firstMatch(
    text,
    /Error:\s*([^\n]+?)(?=\s+(?:Call log:|at [A-Z]:\\|attachment #|Retry #|$))/i,
    (match) => `Error: ${match[1].trim()}`,
  );

  const waiting = firstMatch(
    text,
    /-\s*waiting for\s+([^\n]+?)(?=\s+\d+\s*\||\s+at [A-Z]:\\|attachment #|Retry #|$)/i,
    (match) => `Waiting for ${match[1].trim()}`,
  );

  const source = firstMatch(
    text,
    /\bat\s+([A-Z]:\\[^\n]+?\.(?:ts|js|tsx|jsx):\d+:\d+)/i,
    (match) => `at ${match[1].trim()}`,
  );

  for (const item of [timeout, error, waiting, source]) {
    if (item && !parts.includes(item)) parts.push(item);
  }

  let summary = parts.join('; ');

  if (!summary) {
    summary = text
      .split(/attachment #\d+|Retry #\d+/i)[0]
      .replace(/^\s*\d+\s*\|.*$/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (!summary) return 'Test failed';

  const maxLength = 500;
  return summary.length > maxLength
    ? `${summary.slice(0, maxLength - 3).trim()}...`
    : summary;
}

function summarizeSkipped(value) {
  const text = stripTags(value).replace(/\s+/g, ' ').trim();
  if (!text) return 'Skipped';
  return text.length > 300 ? `${text.slice(0, 297).trim()}...` : text;
}

function parseJunitResults(xml) {
  const testResults = [];
  const testcaseRegex = /<testcase\b([^>]*?)(\/?)>/g;
  let match;

  while ((match = testcaseRegex.exec(xml || '')) !== null) {
    const attrs = parseAttributes(match[1] || '');
    const fullTag = match[0] || '';
    const isSelfClosing = /\/>$/.test(fullTag.trim());
    const body = isSelfClosing
      ? ''
      : extractBodyBetweenTags(
        xml,
        match.index + fullTag.length,
        '</testcase>',
      );

    let status = 'Passed';
    let remark = '-';

    if (/<failure\b/i.test(body) || /<error\b/i.test(body)) {
      status = 'Failed';

      const failureMatch = body.match(
        /<(failure|error)\b([^>]*)>([\s\S]*?)<\/\1>/i,
      );

      if (failureMatch) {
        const failureAttrs = parseAttributes(failureMatch[2] || '');
        remark = summarizeFailure(
          failureAttrs.message || failureMatch[3] || body,
        );
      } else {
        remark = summarizeFailure(body);
      }
    } else if (/<skipped\b/i.test(body)) {
      status = 'Skipped';

      const skippedMatch = body.match(
        /<skipped\b([^>]*)>([\s\S]*?)<\/skipped>/i,
      );
      const selfClosingSkipped = body.match(/<skipped\b([^>]*)\/>/i);

      if (skippedMatch) {
        const skippedAttrs = parseAttributes(skippedMatch[1] || '');
        remark = summarizeSkipped(
          skippedAttrs.message || skippedMatch[2] || 'Skipped',
        );
      } else if (selfClosingSkipped) {
        const skippedAttrs = parseAttributes(selfClosingSkipped[1] || '');
        remark = summarizeSkipped(skippedAttrs.message || 'Skipped');
      } else {
        remark = 'Skipped';
      }
    }

    const elapsedSeconds = Number(attrs.time || 0);

    testResults.push({
      name: attrs.name
        ? attrs.name.replace(/\s+/g, ' ').trim()
        : 'Unnamed Test',
      classname: attrs.classname || '',
      status,
      remark: remark || '-',
      elapsed: formatDuration(elapsedSeconds),
      elapsedSeconds,
    });
  }

  const totalDurationSeconds = testResults.reduce(
    (sum, test) => sum + Number(test.elapsedSeconds || 0),
    0,
  );

  return {
    totalTests: testResults.length,
    passed: testResults.filter((test) => test.status === 'Passed').length,
    failed: testResults.filter((test) => test.status === 'Failed').length,
    skipped: testResults.filter((test) => test.status === 'Skipped').length,
    totalDurationSeconds,
    testResults,
  };
}

function parseRecipients(value) {
  if (!value) return [];

  return String(value)
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTestmoTags(value) {
  if (!value) return [];

  return String(value)
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function appendTestmoRunLinkingArgs(args, env = process.env) {
  const milestoneId = String(env.TESTMO_MILESTONE_ID || '').trim();
  const milestoneName = String(
    env.TESTMO_MILESTONE_NAME || env.TESTMO_MILESTONE || '',
  ).trim();
  const configuredTags = parseTestmoTags(
    env.TESTMO_MILESTONE_TAG || env.TESTMO_TAGS,
  );

  let appliedTags = [];

  if (milestoneId) {
    args.push('--milestone-id', milestoneId);
  } else if (milestoneName) {
    args.push('--milestone', milestoneName);
  } else if (configuredTags.length) {
    appliedTags = configuredTags;
    args.push('--tags', ...appliedTags);
  }

  return {
    milestoneId,
    milestoneName,
    tags: appliedTags,
  };
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function buildTestmoRunUrl(runId, env = process.env) {
  if (!runId || !env.TESTMO_URL) return null;

  return (
    `${trimTrailingSlash(env.TESTMO_URL)}` +
    `/automation/runs/view/${runId}`
  );
}

function extractTestmoRunUrl(output, env = process.env) {
  const text = String(output || '');

  const urlMatch = text.match(
    /https?:\/\/[^\s"'<>]+\/automation\/runs(?:\/view)?\/\d+\b/i,
  );

  if (urlMatch) {
    let url = urlMatch[0].replace(/[)\].,;]+$/, '');

    if (
      /\/automation\/runs\/\d+\b/i.test(url) &&
      !/\/automation\/runs\/view\/\d+\b/i.test(url)
    ) {
      url = url.replace(
        '/automation/runs/',
        '/automation/runs/view/',
      );
    }

    return url;
  }

  const runId = extractTestmoRunId(output);
  return runId ? buildTestmoRunUrl(runId, env) : null;
}

function extractTestmoRunId(output) {
  const text = String(output || '')
    .replace(/\x1B\[[0-9;]*m/g, '')
    .trim();

  const urlMatch = text.match(
    /\/automation\/runs(?:\/view)?\/(\d+)\b/i,
  );

  if (urlMatch && urlMatch[1]) return urlMatch[1];

  const idPatterns = [
    /automation\s+run\s+(?:id\s*)?[:#]?\s*(\d{1,10})/i,
    /run\s+id\s*[:#]?\s*(\d{1,10})/i,
    /created\s+(?:automation\s+)?run\s*(?:id)?\s*[:#]?\s*(\d{1,10})/i,
    /run_id["'\s:=]+(\d{1,10})/i,
    /^\s*(\d{1,10})\s*$/m,
  ];

  for (const pattern of idPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
}

function withNpxPackage(testmoCmd, args) {
  return testmoCmd === 'npx'
    ? ['@testmo/testmo-cli', ...args]
    : args;
}

function findTestmoCmd(env = process.env) {
  if (env.TESTMO_CMD && fs.existsSync(env.TESTMO_CMD)) {
    return env.TESTMO_CMD;
  }

  if (env.NPM_GLOBAL_PREFIX) {
    const candidates = [
      path.join(env.NPM_GLOBAL_PREFIX, 'testmo.cmd'),
      path.join(env.NPM_GLOBAL_PREFIX, 'bin', 'testmo.cmd'),
      path.join(
        env.NPM_GLOBAL_PREFIX,
        'node_modules',
        '.bin',
        'testmo.cmd',
      ),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  return 'npx';
}

function quoteArg(value) {
  const text = String(value);

  if (/^[A-Za-z0-9_./:=@\\-]+$/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '\\"')}"`;
}

function runCommand(command, args, env = process.env) {
  const commandLine = [
    quoteArg(command),
    ...args.map(quoteArg),
  ].join(' ');

  console.log(`Executing: ${commandLine}`);

  const result = spawnSync(commandLine, {
    shell: true,
    env,
    encoding: 'utf8',
    windowsHide: true,
  });

  const stdout = String(result.stdout || '').trim();
  const stderr = String(result.stderr || '').trim();
  const output = [stdout, stderr].filter(Boolean).join('\n');

  if (output) console.log(output);

  if (result.error) {
    throw new Error(
      [
        `Unable to execute command: ${commandLine}`,
        result.error.message || String(result.error),
        output,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed with exit code ${result.status}: ${commandLine}`,
        output || 'Testmo CLI returned no console output.',
      ].join('\n'),
    );
  }

  return output;
}

function publishTestmoResults(env = process.env) {
  const junitFile =
    env.JUNIT_FILE || path.join('Plantec_Web', 'results', 'test-results.xml');

  if (!env.TESTMO_TOKEN) {
    throw new Error(
      'Missing TESTMO_TOKEN. Add Jenkins secret text credential ' +
      'with id: testmo-api-key.',
    );
  }

  if (
    !env.TESTMO_URL ||
    !env.TESTMO_PROJECT_ID ||
    !env.TESTMO_SOURCE
  ) {
    throw new Error(
      'Missing TESTMO_URL, TESTMO_PROJECT_ID, or TESTMO_SOURCE.',
    );
  }

  if (!fs.existsSync(junitFile)) {
    throw new Error(`JUnit file not found: ${junitFile}`);
  }

  const testmoCmd = findTestmoCmd(env);
  const childEnv = {
    ...process.env,
    ...env,
  };

  const instanceUrl = trimTrailingSlash(env.TESTMO_URL);
  const runName =
    `${env.TESTMO_RUN_NAME || 'Automation Run'} - ` +
    `Build #${env.BUILD_NUMBER || env.BUILD_ID || 'local'}`;

  console.log('Publishing one module to Testmo...');
  console.log(`Testmo instance: ${instanceUrl}`);
  console.log(`Project ID: ${env.TESTMO_PROJECT_ID}`);
  console.log(`Source: ${env.TESTMO_SOURCE}`);
  console.log(`Run name: ${runName}`);
  console.log(`JUnit file: ${junitFile}`);
  console.log('TESTMO_TOKEN: ***HIDDEN***');

  const submitArgs = [
    'automation:run:submit',
    '--instance',
    instanceUrl,
    '--project-id',
    env.TESTMO_PROJECT_ID,
    '--name',
    runName,
    '--source',
    env.TESTMO_SOURCE,
  ];

  const runLinking = appendTestmoRunLinkingArgs(
    submitArgs,
    env,
  );

  if (runLinking.milestoneId) {
    console.log(
      `Testmo milestone ID: ${runLinking.milestoneId}`,
    );
  } else if (runLinking.milestoneName) {
    console.log(
      `Testmo milestone name: ${runLinking.milestoneName}`,
    );
  } else {
    console.log('Testmo milestone: not configured directly');
  }

  console.log(
    `Testmo tags: ${
      runLinking.tags.length
        ? runLinking.tags.join(', ')
        : '-'
    }`,
  );

  submitArgs.push(
    '--results',
    junitFile,
    '--no-ansi',
  );

  const submitOutput = runCommand(
    testmoCmd,
    withNpxPackage(testmoCmd, submitArgs),
    childEnv,
  );

  const runId = extractTestmoRunId(submitOutput);
  const runUrl =
    extractTestmoRunUrl(submitOutput, env) ||
    buildTestmoRunUrl(runId, env) ||
    `${instanceUrl}/automation/runs`;

  console.log('Testmo publication completed successfully.');
  console.log(`Testmo run ID: ${runId || '-'}`);
  console.log(`Testmo run URL: ${runUrl}`);

  return {
    runId,
    runUrl,
  };
}

function getEmailConfig(env = process.env) {
  return {
    from:
      env.REPORT_EMAIL_FROM ||
      env.SMTP_USER ||
      'jenkins@company.com',
    to: parseRecipients(
      env.REPORT_EMAIL_TO || env.EMAIL_TO,
    ),
    cc: parseRecipients(
      env.REPORT_EMAIL_CC || env.EMAIL_CC,
    ),
    baseSubject:
      env.REPORT_EMAIL_SUBJECT ||
      env.EMAIL_SUBJECT ||
      'Automation Test Report',
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeKey(value) {
  return String(value || 'module')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'module';
}

function resolveFilePath(value, cwd = process.cwd()) {
  if (!value) return '';
  return path.isAbsolute(value)
    ? path.normalize(value)
    : path.resolve(cwd, value);
}

function readJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Invalid JSON in module configuration ${filePath}: ` +
      `${error.message || error}`,
    );
  }
}

function loadModuleDefinitions(env = process.env) {
  const cwd = process.cwd();
  let rawModules = null;

  if (env.TESTMO_MODULES_FILE) {
    const configPath = resolveFilePath(
      env.TESTMO_MODULES_FILE,
      cwd,
    );

    if (!fs.existsSync(configPath)) {
      throw new Error(
        `TESTMO_MODULES_FILE was not found: ${configPath}`,
      );
    }

    rawModules = readJsonFile(configPath);
  } else if (env.TESTMO_MODULES_JSON) {
    try {
      rawModules = JSON.parse(env.TESTMO_MODULES_JSON);
    } catch (error) {
      throw new Error(
        'TESTMO_MODULES_JSON is invalid JSON: ' +
        `${error.message || error}`,
      );
    }
  }

  if (!Array.isArray(rawModules) || !rawModules.length) {
    const junitFile =
      env.JUNIT_FILE ||
      path.join(cwd, 'Plantec_Web', 'results', 'test-results.xml');

    rawModules = [
      {
        key: safeKey(env.TESTMO_RUN_NAME || 'automation'),
        name: env.TESTMO_RUN_NAME || 'Automation Run',
        junitFile,
        source: env.TESTMO_SOURCE,
        milestoneId: env.TESTMO_MILESTONE_ID,
        milestoneName:
          env.TESTMO_MILESTONE_NAME ||
          env.TESTMO_MILESTONE,
        milestoneTag:
          env.TESTMO_MILESTONE_TAG ||
          env.TESTMO_TAGS,
      },
    ];
  }

  return rawModules
    .filter((module) => module && module.enabled !== false)
    .map((module, index) => {
      const name =
        String(module.name || `Module ${index + 1}`).trim();
      const key = safeKey(module.key || name);

      return {
        key,
        name,
        junitFile: resolveFilePath(
          module.junitFile ||
          module.junit ||
          module.results,
          cwd,
        ),
        source:
          String(
            module.source ||
            `${env.TESTMO_SOURCE || 'playwright'}-${key}`,
          ).trim(),
        milestoneId: String(
          module.milestoneId ||
          module.milestone_id ||
          '',
        ).trim(),
        milestoneName: String(
          module.milestoneName ||
          module.milestone ||
          '',
        ).trim(),
        milestoneTag: String(
          module.milestoneTag ||
          module.tags ||
          '',
        ).trim(),
      };
    });
}

function buildReportData({
  projectName,
  buildNumber,
  environment,
  executionDate,
  moduleResults,
  jenkinsBuildUrl,
  emailBaseSubject,
}) {
  const summary = moduleResults.reduce(
    (totals, module) => ({
      totalTestCases:
        totals.totalTestCases + module.parsed.totalTests,
      passed: totals.passed + module.parsed.passed,
      failed: totals.failed + module.parsed.failed,
      skipped: totals.skipped + module.parsed.skipped,
      durationSeconds:
        totals.durationSeconds +
        module.parsed.totalDurationSeconds,
    }),
    {
      totalTestCases: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      durationSeconds: 0,
    },
  );

  const hasIntegrationError = moduleResults.some(
    (module) => module.publishError,
  );

  const resolvedPrefix =
    summary.failed > 0 || hasIntegrationError
      ? '🔴 [FAILED]'
      : '🟢 [PASSED]';

  const testResults = [];

  for (const module of moduleResults) {
    for (const test of module.parsed.testResults) {
      testResults.push({
        ...test,
        moduleName: module.name,
      });
    }
  }

  return {
    subject:
      `${resolvedPrefix} ${emailBaseSubject} | ` +
      `Build #${buildNumber}`,
    projectName,
    buildNumber,
    environment,
    executionDate,
    duration: formatDurationHms(summary.durationSeconds),
    summary,
    moduleResults,
    testResults,
    jenkinsBuildUrl,
  };
}

function renderTextReport(data) {
  const lines = [];

  lines.push(data.subject);
  lines.push('');
  lines.push('Hello Team,');
  lines.push('');
  lines.push('The automation execution has been completed.');
  lines.push('');
  lines.push('Execution Information');
  lines.push(`Project          : ${data.projectName}`);
  lines.push(`Build            : ${data.buildNumber}`);
  lines.push(`Environment      : ${data.environment}`);
  lines.push(`Execution Date   : ${data.executionDate}`);
  lines.push(`Duration         : ${data.duration}`);
  lines.push(
    `Total Test Cases : ${data.summary.totalTestCases}`,
  );
  lines.push(`Passed           : ${data.summary.passed}`);
  lines.push(`Failed           : ${data.summary.failed}`);
  lines.push(`Skipped          : ${data.summary.skipped}`);

  if (data.jenkinsBuildUrl) {
    lines.push(`Jenkins Build    : ${data.jenkinsBuildUrl}`);
  }

  lines.push('');
  lines.push('Module Summary');
  lines.push(
    'Module | Total | Passed | Failed | Skipped | Testmo Report',
  );

  for (const module of data.moduleResults) {
    const report =
      module.publishError
        ? `FAILED - ${module.publishError}`
        : module.runUrl || '-';

    lines.push(
      `${module.name} | ` +
      `${module.parsed.totalTests} | ` +
      `${module.parsed.passed} | ` +
      `${module.parsed.failed} | ` +
      `${module.parsed.skipped} | ` +
      report,
    );
  }

  lines.push('');
  lines.push('Test Case Result');
  lines.push(
    'No | Module | Test Case | Status | Remark | Elapsed',
  );

  data.testResults.forEach((test, index) => {
    lines.push(
      `${index + 1} | ${test.moduleName} | ${test.name} | ` +
      `${test.status} | ${test.remark || '-'} | ` +
      `${test.elapsed || '00:00'}`,
    );
  });

  lines.push('');
  lines.push('Regards,');
  lines.push('Automation Bot');

  return lines.join('\n');
}

function renderHtmlReport(data) {
  const moduleRows = data.moduleResults
    .map((module) => {
      const report = module.publishError
        ? `<span style="color:#d93025;font-weight:700;">` +
          `${escapeHtml(module.publishError)}</span>`
        : module.runUrl
          ? `<a href="${escapeHtml(module.runUrl)}">Open run</a>`
          : '-';

      return `<tr>
        <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(module.name)}</td>
        <td style="padding:8px;border:1px solid #ddd;">${module.parsed.totalTests}</td>
        <td style="padding:8px;border:1px solid #ddd;color:#188038;font-weight:700;">${module.parsed.passed}</td>
        <td style="padding:8px;border:1px solid #ddd;color:#d93025;font-weight:700;">${module.parsed.failed}</td>
        <td style="padding:8px;border:1px solid #ddd;">${module.parsed.skipped}</td>
        <td style="padding:8px;border:1px solid #ddd;">${report}</td>
      </tr>`;
    })
    .join('');

  const testRows = data.testResults
    .map((test, index) => {
      const icon =
        test.status === 'Failed'
          ? '🔴'
          : test.status === 'Skipped'
            ? '🟡'
            : '🟢';

      const color =
        test.status === 'Failed'
          ? '#d93025'
          : test.status === 'Skipped'
            ? '#b06000'
            : '#188038';

      return `<tr>
        <td style="padding:8px;border:1px solid #ddd;">${index + 1}</td>
        <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(test.moduleName)}</td>
        <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(test.name)}</td>
        <td style="padding:8px;border:1px solid #ddd;color:${color};font-weight:700;">${icon} ${escapeHtml(test.status)}</td>
        <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(test.remark || '-')}</td>
        <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(test.elapsed || '00:00')}</td>
      </tr>`;
    })
    .join('');

  const jenkinsLink = data.jenkinsBuildUrl
    ? `<a href="${escapeHtml(data.jenkinsBuildUrl)}">Open Jenkins build</a>`
    : '-';

  return `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;color:#333;line-height:1.5;">
    <h2 style="margin-bottom:8px;">${escapeHtml(data.subject)}</h2>
    <p>Hello Team,</p>
    <p>The automation execution has been completed.</p>

    <h3>Execution Information</h3>
    <table style="border-collapse:collapse;width:100%;max-width:760px;">
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700;">Project</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(data.projectName)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700;">Build</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(data.buildNumber)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700;">Environment</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(data.environment)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700;">Execution Date</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(data.executionDate)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700;">Duration</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(data.duration)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700;">Total Test Cases</td><td style="padding:8px;border:1px solid #ddd;">${data.summary.totalTestCases}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700;">Passed</td><td style="padding:8px;border:1px solid #ddd;color:#188038;font-weight:700;">${data.summary.passed}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700;">Failed</td><td style="padding:8px;border:1px solid #ddd;color:#d93025;font-weight:700;">${data.summary.failed}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700;">Skipped</td><td style="padding:8px;border:1px solid #ddd;">${data.summary.skipped}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:700;">Jenkins Build</td><td style="padding:8px;border:1px solid #ddd;">${jenkinsLink}</td></tr>
    </table>

    <h3>Module Summary</h3>
    <table style="border-collapse:collapse;width:100%;max-width:980px;">
      <thead>
        <tr style="background:#f7f7f7;text-align:left;">
          <th style="padding:10px;border:1px solid #ddd;">Module</th>
          <th style="padding:10px;border:1px solid #ddd;">Total</th>
          <th style="padding:10px;border:1px solid #ddd;">Passed</th>
          <th style="padding:10px;border:1px solid #ddd;">Failed</th>
          <th style="padding:10px;border:1px solid #ddd;">Skipped</th>
          <th style="padding:10px;border:1px solid #ddd;">Testmo Report</th>
        </tr>
      </thead>
      <tbody>${moduleRows}</tbody>
    </table>

    <h3>Test Case Result</h3>
    <table style="border-collapse:collapse;width:100%;max-width:1100px;">
      <thead>
        <tr style="background:#f7f7f7;text-align:left;">
          <th style="padding:10px;border:1px solid #ddd;">No</th>
          <th style="padding:10px;border:1px solid #ddd;">Module</th>
          <th style="padding:10px;border:1px solid #ddd;">Test Case</th>
          <th style="padding:10px;border:1px solid #ddd;">Status</th>
          <th style="padding:10px;border:1px solid #ddd;">Remark</th>
          <th style="padding:10px;border:1px solid #ddd;">Elapsed</th>
        </tr>
      </thead>
      <tbody>${testRows}</tbody>
    </table>

    <p>Regards,<br/>Automation Bot</p>
  </body>
</html>`;
}

function writeReportFile(outputPath, content) {
  fs.mkdirSync(path.dirname(outputPath), {
    recursive: true,
  });
  fs.writeFileSync(outputPath, content, 'utf8');
}

function createTransport(env = process.env) {
  const isGmail =
    /(^|\.)gmail\.com$/i.test(env.SMTP_HOST || '') ||
    /@gmail\.com$/i.test(env.SMTP_USER || '');

  const pass = isGmail
    ? String(env.SMTP_PASS || '').replace(/\s+/g, '')
    : env.SMTP_PASS;

  if (!env.SMTP_USER || !pass) {
    throw new Error(
      'SMTP_USER or SMTP_PASS is missing. ' +
      'Add gmail-app-password credential in Jenkins.',
    );
  }

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.SMTP_USER,
        pass,
      },
      logger: env.SMTP_DEBUG === 'true',
      debug: env.SMTP_DEBUG === 'true',
    });
  }

  const secure = env.SMTP_SECURE === 'true';

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 587),
    secure,
    requireTLS: !secure,
    auth: {
      user: env.SMTP_USER,
      pass,
    },
    tls: {
      rejectUnauthorized:
        env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
    logger: env.SMTP_DEBUG === 'true',
    debug: env.SMTP_DEBUG === 'true',
  });
}

async function sendEmailReport(
  textContent,
  htmlContent,
  data,
  outputPath,
  moduleResults,
  env = process.env,
) {
  const emailConfig = getEmailConfig(env);

  if (!emailConfig.to.length) {
    throw new Error(
      'No email recipients configured. Set REPORT_EMAIL_TO.',
    );
  }

  const transporter = createTransport(env);

  console.log(
    `Email from=${emailConfig.from} ` +
    `to=${emailConfig.to.join(', ')} ` +
    `cc=${emailConfig.cc.join(', ') || '-'}`,
  );

  await transporter.verify();

  const attachments = [];
  const attachedPaths = new Set();

  for (const module of moduleResults) {
    if (
      module.junitFile &&
      fs.existsSync(module.junitFile) &&
      !attachedPaths.has(module.junitFile)
    ) {
      attachments.push({
        filename: `${module.key}-junit.xml`,
        path: module.junitFile,
      });
      attachedPaths.add(module.junitFile);
    }
  }

  if (
    outputPath &&
    fs.existsSync(outputPath) &&
    !attachedPaths.has(outputPath)
  ) {
    attachments.push({
      filename: path.basename(outputPath),
      path: outputPath,
    });
  }

  const info = await transporter.sendMail({
    from: emailConfig.from,
    to: emailConfig.to.join(','),
    cc: emailConfig.cc.join(',') || undefined,
    subject: data.subject,
    text: textContent,
    html: htmlContent,
    attachments,
  });

  console.log(
    `Email sent successfully. MessageId: ${info.messageId}`,
  );
}

function buildTeamsCardPayload(data) {
  const body = [
    {
      type: 'TextBlock',
      text: data.subject,
      size: 'Large',
      weight: 'Bolder',
      color: data.summary.failed > 0 ? 'Attention' : 'Good',
      wrap: true,
    },
    {
      type: 'TextBlock',
      text: 'Hello Team,',
      wrap: true,
      spacing: 'Medium',
    },
    {
      type: 'TextBlock',
      text: 'The automation execution has been completed.',
      wrap: true,
      spacing: 'Small',
    },
    {
      type: 'TextBlock',
      text: 'Execution Information',
      weight: 'Bolder',
      size: 'Medium',
      separator: true,
      spacing: 'Medium',
      wrap: true,
    },
    {
      type: 'FactSet',
      facts: [
        { title: 'Project', value: String(data.projectName) },
        { title: 'Build', value: String(data.buildNumber) },
        { title: 'Environment', value: String(data.environment) },
        { title: 'Duration', value: String(data.duration) },
        {
          title: 'Total Test Cases',
          value: String(data.summary.totalTestCases),
        },
        { title: 'Passed', value: String(data.summary.passed) },
        { title: 'Failed', value: String(data.summary.failed) },
        { title: 'Skipped', value: String(data.summary.skipped) },
      ],
    },
    {
      type: 'TextBlock',
      text: 'Module Summary',
      weight: 'Bolder',
      size: 'Medium',
      separator: true,
      spacing: 'Medium',
      wrap: true,
    },
  ];

  for (const module of data.moduleResults) {
    let reportText = 'Testmo report is not available.';

    if (module.publishError) {
      reportText = `Testmo publish failed: ${module.publishError}`;
    } else if (module.runUrl) {
      reportText = `[Open Testmo report](${module.runUrl})`;
    }

    body.push(
      {
        type: 'TextBlock',
        text: `**${module.name}**`,
        weight: 'Bolder',
        separator: true,
        spacing: 'Medium',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text:
          `Total: ${module.parsed.totalTests} | ` +
          `Passed: ${module.parsed.passed} | ` +
          `Failed: ${module.parsed.failed} | ` +
          `Skipped: ${module.parsed.skipped}\n\n` +
          reportText,
        wrap: true,
        spacing: 'Small',
      },
    );
  }

  if (data.jenkinsBuildUrl) {
    body.push({
      type: 'TextBlock',
      text: `[Open Jenkins build](${data.jenkinsBuildUrl})`,
      separator: true,
      spacing: 'Medium',
      wrap: true,
    });
  }

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.2',
          body,
        },
      },
    ],
  };
}

function postJson(urlValue, payload) {
  return new Promise((resolve, reject) => {
    let target;

    try {
      target = new URL(urlValue);
    } catch (error) {
      reject(new Error(`Invalid Teams webhook URL: ${error.message}`));
      return;
    }

    const body = JSON.stringify(payload);
    const client = target.protocol === 'http:' ? http : https;

    const request = client.request(
      {
        method: 'POST',
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || undefined,
        path: `${target.pathname}${target.search}`,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (response) => {
        let responseBody = '';

        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          responseBody += chunk;
        });

        response.on('end', () => {
          const statusCode = Number(response.statusCode || 0);

          if (statusCode >= 200 && statusCode < 300) {
            resolve({
              statusCode,
              body: responseBody,
            });
            return;
          }

          reject(
            new Error(
              `Teams webhook returned HTTP ${statusCode}. ` +
              `${responseBody || response.statusMessage || ''}`.trim(),
            ),
          );
        });
      },
    );

    request.setTimeout(30000, () => {
      request.destroy(
        new Error('Teams webhook request timed out after 30 seconds.'),
      );
    });

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

async function sendTeamsReport(data, env = process.env) {
  const webhookUrl = String(env.TEAMS_WEBHOOK_URL || '').trim();

  if (!webhookUrl) {
    throw new Error(
      'TEAMS_WEBHOOK_URL is missing. Add Jenkins Secret Text credential.',
    );
  }

  const payload = buildTeamsCardPayload(data);
  const result = await postJson(webhookUrl, payload);

  console.log(
    `Microsoft Teams report sent successfully. HTTP ${result.statusCode}`,
  );
}

function emptyParsedResult() {
  return {
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    totalDurationSeconds: 0,
    testResults: [],
  };
}

async function main() {
  const cwd = process.cwd();
  const outputPath =
    process.env.TESTMO_REPORT_OUTPUT ||
    path.join(
      cwd,
      'Plantec_Web',
      'test-results',
      'testmo-report.txt',
    );

  const moduleDefinitions = loadModuleDefinitions(
    process.env,
  );

  console.log(
    `Configured modules: ${moduleDefinitions.length}`,
  );

  const moduleResults = [];

  for (const module of moduleDefinitions) {
    console.log('========================================');
    console.log(`Processing module: ${module.name}`);
    console.log(`JUnit file: ${module.junitFile}`);
    console.log(`Source: ${module.source}`);
    console.log(
      `Milestone ID: ${module.milestoneId || '-'}`,
    );

    let parsed = emptyParsedResult();
    let runId = '';
    let runUrl = '';
    let publishError = '';

    if (!module.junitFile || !fs.existsSync(module.junitFile)) {
      publishError =
        `JUnit file not found: ` +
        `${module.junitFile || '(not configured)'}`;

      console.error(publishError);
    } else {
      const xml = fs.readFileSync(
        module.junitFile,
        'utf8',
      );

      parsed = parseJunitResults(xml);

      if (process.env.PUBLISH_TESTMO === 'false') {
        console.log(
          'PUBLISH_TESTMO=false; skipping Testmo submit.',
        );
      } else {
        try {
          const published = publishTestmoResults({
            ...process.env,
            JUNIT_FILE: module.junitFile,
            TESTMO_RUN_NAME: module.name,
            TESTMO_SOURCE: module.source,
            TESTMO_MILESTONE_ID: module.milestoneId,
            TESTMO_MILESTONE_NAME:
              module.milestoneName,
            TESTMO_MILESTONE_TAG:
              module.milestoneTag,
          });

          runId = published.runId || '';
          runUrl = published.runUrl || '';
        } catch (error) {
          publishError = error.message || String(error);
          console.error(
            `Testmo publish failed for ${module.name}:\n` +
            publishError,
          );
        }
      }
    }

    moduleResults.push({
      ...module,
      parsed,
      runId,
      runUrl,
      publishError,
    });
  }

  const projectName =
    process.env.TESTMO_PROJECT_NAME ||
    process.env.JOB_NAME ||
    'Automation Project';

  const buildNumber =
    process.env.BUILD_NUMBER ||
    process.env.BUILD_ID ||
    'local';

  const environment =
    process.env.TESTMO_ENVIRONMENT ||
    process.env.ENVIRONMENT ||
    'UAT';

  const executionDate =
    process.env.TESTMO_EXECUTION_DATE ||
    new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Jakarta',
    });

  const emailBaseSubject =
    getEmailConfig(process.env).baseSubject;

  const data = buildReportData({
    projectName,
    buildNumber,
    environment,
    executionDate,
    moduleResults,
    jenkinsBuildUrl:
      process.env.BUILD_URL || '',
    emailBaseSubject,
  });

  const textContent = renderTextReport(data);
  const htmlContent = renderHtmlReport(data);

  writeReportFile(outputPath, textContent);
  console.log(
    `Generated email report file: ${outputPath}`,
  );

  let emailError = '';
  let teamsError = '';

  if (process.env.SEND_EMAIL === 'true') {
    try {
      await sendEmailReport(
        textContent,
        htmlContent,
        data,
        outputPath,
        moduleResults,
        process.env,
      );
    } catch (error) {
      emailError = error.message || String(error);
      console.error(
        `Email delivery failed:\n${emailError}`,
      );
    }
  } else {
    console.log(
      'SEND_EMAIL is not true; skipping email send.',
    );
  }

  if (process.env.SEND_TEAMS === 'true') {
    try {
      await sendTeamsReport(data, process.env);
    } catch (error) {
      teamsError = error.message || String(error);
      console.error(
        `Microsoft Teams delivery failed:
${teamsError}`,
      );
    }
  } else {
    console.log(
      'SEND_TEAMS is not true; skipping Teams send.',
    );
  }

  const finalErrors = [];

  const publishErrors = moduleResults
    .filter((module) => module.publishError)
    .map(
      (module) =>
        `${module.name}: ${module.publishError}`,
    );

  if (
    publishErrors.length &&
    process.env.FAIL_ON_TESTMO_ERROR !== 'false'
  ) {
    finalErrors.push(
      'Testmo publication failed:\n' +
      publishErrors.join('\n'),
    );
  }

  if (emailError) {
    finalErrors.push(
      `Email delivery failed: ${emailError}`,
    );
  }

  if (
    teamsError &&
    process.env.FAIL_ON_TEAMS_ERROR !== 'false'
  ) {
    finalErrors.push(
      `Microsoft Teams delivery failed: ${teamsError}`,
    );
  }

  if (finalErrors.length) {
    throw new Error(finalErrors.join('\n\n'));
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  parseJunitResults,
  extractTestmoRunUrl,
  extractTestmoRunId,
  buildTestmoRunUrl,
  renderTextReport,
  renderHtmlReport,
  parseRecipients,
  parseTestmoTags,
  appendTestmoRunLinkingArgs,
  loadModuleDefinitions,
  summarizeFailure,
  buildTeamsCardPayload,
  sendTeamsReport,
  sendEmailReport,
};