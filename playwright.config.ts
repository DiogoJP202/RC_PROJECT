import { chromium, defineConfig, devices } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Prefer the matching Playwright browser. The supplied workstation also has a
// installed Chrome and cached Chromium 151; use an existing binary when the new
// revision is absent. Chrome's hardware GPU avoids the old shell's SwiftShader.
const cacheRoot = process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'ms-playwright') : '';
const installedChrome = process.env.ProgramFiles ? join(process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe') : '';
const cachedChromium = cacheRoot && existsSync(cacheRoot)
  ? readdirSync(cacheRoot).filter((name) => /^chromium_headless_shell-\d+$/.test(name)).sort().reverse()
    .map((name) => join(cacheRoot, name, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe')).find(existsSync)
  : undefined;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? (!existsSync(chromium.executablePath()) ? existsSync(installedChrome) ? installedChrome : cachedChromium : undefined);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      args: ['--enable-webgl', '--ignore-gpu-blocklist'],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: baseURL.endsWith(':4173') ? 'npm run preview -- --port 4173' : 'npm run dev -- --port 5173',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
