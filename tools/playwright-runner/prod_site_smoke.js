const { chromium } = require('./node_modules/playwright');

const baseUrl = (process.env.MERIT_BASE_URL || 'https://meritlaunchers.com').replace(/\/+$/, '');

const routes = [
  {
    name: 'marketing home',
    path: '/',
    kind: 'marketing',
    expectText: 'Merit Launchers',
  },
  {
    name: 'faq',
    path: '/faq',
    kind: 'marketing',
    expectText: 'FAQ',
  },
  {
    name: 'contact',
    path: '/contact',
    kind: 'marketing',
    expectText: 'Contact',
  },
  {
    name: 'partner login',
    path: '/partner/login',
    kind: 'marketing',
    expectText: 'Partner',
  },
  {
    name: 'marketing admin login',
    path: '/marketing-admin/login',
    kind: 'marketing',
    expectText: 'Marketing',
  },
  {
    name: 'join admin',
    path: '/join/ADMIN',
    kind: 'marketing',
    expectText: 'ADMIN',
  },
  {
    name: 'student portal',
    path: '/portal/',
    kind: 'flutter',
  },
  {
    name: 'admin portal',
    path: '/admin/',
    kind: 'flutter',
  },
  {
    name: 'marketing console',
    path: '/marketing/',
    kind: 'flutter',
  },
];

function hasBadConsoleMessage(messages) {
  return messages.some((message) =>
    /prepareServiceWorker|Exception while loading service worker|Failed to fetch dynamically imported module|SyntaxError|ReferenceError|TypeError/i.test(
      message,
    ),
  );
}

function isRelevantFailedRequest(url) {
  return /^https:\/\/meritlaunchers\.com\//i.test(url);
}

async function checkFlutterSurface(page) {
  await page.waitForFunction(() => {
    const shell = document.getElementById('ml-startup-shell');
    return !!shell && shell.classList.contains('hidden');
  }, null, { timeout: 30000 });

  await page.waitForFunction(() => {
    return !!document.querySelector('flt-glass-pane, flutter-view, flt-semantics-host');
  }, null, { timeout: 30000 });
}

async function checkMarketingSurface(page, expectedText) {
  await page.waitForFunction(() => {
    const root = document.querySelector('#root');
    return !!root && (root.textContent || '').trim().length > 40;
  }, null, { timeout: 20000 });

  if (expectedText) {
    const bodyText = await page.locator('body').innerText();
    if (!bodyText.toLowerCase().includes(expectedText.toLowerCase())) {
      throw new Error(`Expected body to contain "${expectedText}"`);
    }
  }
}

async function checkRoute(browser, route) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', (message) => {
    const type = message.type();
    if (['error', 'warning'].includes(type)) {
      consoleMessages.push(`${type}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message || String(error));
  });
  page.on('requestfailed', (request) => {
    if (!isRelevantFailedRequest(request.url())) {
      return;
    }
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'unknown failure'}`);
  });

  const url = `${baseUrl}${route.path}`;
  try {
    const response = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    if (!response || !response.ok()) {
      throw new Error(`Navigation failed with status ${response ? response.status() : 'no-response'}`);
    }

    if (route.kind === 'flutter') {
      await checkFlutterSurface(page);
    } else {
      await checkMarketingSurface(page, route.expectText);
    }

    if (hasBadConsoleMessage(consoleMessages)) {
      throw new Error(`Bad console output detected: ${consoleMessages.join(' | ')}`);
    }
    if (pageErrors.length) {
      throw new Error(`Page errors detected: ${pageErrors.join(' | ')}`);
    }
    if (failedRequests.length) {
      throw new Error(`Failed requests detected: ${failedRequests.slice(0, 5).join(' | ')}`);
    }

    return { name: route.name, path: route.path, status: 'passed' };
  } catch (error) {
    const screenshotName = route.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    await page.screenshot({ path: `${screenshotName}.png`, fullPage: true }).catch(() => {});
    return {
      name: route.name,
      path: route.path,
      status: 'failed',
      detail: error.message,
      consoleMessages,
      pageErrors,
      failedRequests: failedRequests.slice(0, 10),
    };
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const results = [];
    for (const route of routes) {
      results.push(await checkRoute(browser, route));
    }

    const failed = results.filter((result) => result.status !== 'passed');
    console.log(JSON.stringify({
      ok: failed.length === 0,
      baseUrl,
      checked: results.length,
      failed: failed.length,
      results,
    }, null, 2));

    if (failed.length > 0) {
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
