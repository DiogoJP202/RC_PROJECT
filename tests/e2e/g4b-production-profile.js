/* global window, document, innerWidth, innerHeight, devicePixelRatio, requestAnimationFrame */
import assert from 'node:assert/strict';
import os from 'node:os';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, expect } from '@playwright/test';

const flag = (name) => process.argv.find((value) => value.startsWith(name + '='))?.split('=')[1];
const mode = flag('--mode') ?? 'surface';
assert.ok(['surface', 'cut', 'compare'].includes(mode));
const mobile = process.argv.includes('--mobile');
const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const mobileWidth = Number(flag('--mobile-width') ?? 390);
assert.ok([390, 430].includes(mobileWidth));
const viewport = mobile ? { width: mobileWidth, height: mobileWidth === 390 ? 844 : 932 } : { width: 1440, height: 900 };
const output = flag('--output') ?? `artifacts/local/g4b/perf-${mode}${mobile ? `-mobile-${mobileWidth}` : ''}.json`;
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
const network = { offline: false, latency: 50, downloadThroughput: 2_500_000, uploadThroughput: 2_500_000, connectionType: 'ethernet' };
const errors = [], httpErrors = [], failedRequests = [];
const chunks = /\/(?:CellWorkspace|InspectionScene)-[\w-]+\.(?:js|css)(?:\?|$)/;
const directRoute = '/atlas/cell/rc%3A17%3A0';
async function openContext() {
  const context = await browser.newContext({ viewport, isMobile: mobile, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', network);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() }); });
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  return { page, context };
}
const status = (page) => expect(page.getByTestId('cell-status')).toHaveText('Cena 3D pronta');
const reportTiming = (page) => page.evaluate(() => {
  const entries = performance.getEntriesByType('resource').map(({ name, transferSize }) => ({ path: new URL(name).pathname, transferSize }));
  return { bytes: entries.reduce((sum, entry) => sum + entry.transferSize, 0)
    + (performance.getEntriesByType('navigation')[0]?.transferSize ?? 0), entries };
});

try {
  const cold = await openContext();
  await cold.page.goto(base + '/');
  await expect(cold.page.getByRole('heading', { name: 'Atlas anatômico ghoul' })).toBeVisible();
  await cold.page.locator('.ga-hero img').evaluate((image) => image.decode());
  await cold.page.evaluate(() => document.fonts.ready);
  const home = await reportTiming(cold.page);
  assert.equal(await cold.page.locator('canvas').count(), 0);
  assert.ok(home.bytes <= 500 * 1024);
  assert.ok(!home.entries.some(({ path }) => chunks.test(path) || /catalog\.json|\.glb$|three\.core|ObservatoryScene|VascularScene/.test(path)));
  await cold.page.goto(base + directRoute);
  await status(cold.page);
  const direct = await reportTiming(cold.page);
  const directMs = await cold.page.evaluate(() => performance.getEntriesByName('atlas-cell-interactive')[0].startTime);
  assert.equal(await cold.page.getByTestId('micro-stage').count(), 0);
  await cold.context.close();

  const { page, context } = await openContext();
  await page.goto(base + '/atlas/vascular');
  await expect(page.getByTestId('micro-status')).toHaveText('Cena 3D pronta');
  await page.getByTestId('micro-controls-toggle').click();
  await page.getByTestId('micro-entity').selectOption('rc:17:0');
  await page.getByTestId('micro-panel-close').click();
  const micro = await reportTiming(page);
  assert.ok(!micro.entries.some(({ path }) => chunks.test(path)));
  await page.evaluate(() => {
    performance.mark('atlas-cell-profile-begin');
    performance.clearResourceTimings();
  });
  await page.getByTestId('micro-inspect-cell').click();
  await status(page);
  const incremental = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource').map(({ name, transferSize }) => ({ path: new URL(name).pathname, transferSize }));
    return {
      entries, bytes: entries.reduce((sum, entry) => sum + entry.transferSize, 0),
      milliseconds: performance.getEntriesByName('atlas-cell-interactive')[0].startTime
        - performance.getEntriesByName('atlas-cell-profile-begin')[0].startTime,
    };
  });
  assert.ok(incremental.entries.some(({ path }) => chunks.test(path)));
  if (mode === 'cut') {
    await page.getByRole('button', { name: 'Corte', exact: true }).click();
    await page.getByTestId('cell-panel-close').click();
  } else if (mode === 'compare') {
    await page.getByTestId('cell-compare').click();
    if (mobile) await page.getByRole('button', { name: 'Hemácia humana', exact: true }).click();
  }
  await page.waitForTimeout(400);
  const resting = await page.evaluate(() => window.__ATLAS_CELL__?.().frames);
  await page.waitForTimeout(600);
  const restingAfter = await page.evaluate(() => window.__ATLAS_CELL__?.().frames);

  const stage = await page.getByTestId('cell-stage').locator('canvas').boundingBox();
  assert.ok(stage);
  const center = [stage.x + stage.width / 2, stage.y + stage.height / 2];
  const orbit = async (durationMs) => {
    const start = performance.now();
    while (performance.now() - start < durationMs) {
      const phase = (performance.now() - start) * .0018;
      await page.mouse.move(center[0] + 42 * Math.sin(phase), center[1] + 15 * Math.sin(phase * .7));
      await delay(10);
    }
  };
  await page.mouse.move(...center);
  await page.mouse.down();
  await orbit(10_000);
  const measurement = page.evaluate(() => new Promise((resolve) => {
    const intervals = [], rendering = [];
    let started = 0, last = 0, next = 0;
    let firstFrames = 0;
    function sample(now) {
      if (!last) {
        started = now; next = now;
        firstFrames = window.__ATLAS_CELL__().frames;
      } else intervals.push(now - last);
      last = now;
      if (now >= next) {
        const { frames, draws, triangles, surface } = window.__ATLAS_CELL__();
        rendering.push({ frames, draws, triangles, geometries: surface.geometries });
        next += 1_000;
      }
      if (now - started < 30_000) requestAnimationFrame(sample);
      else {
        const fps = intervals.map((duration) => 1000 / duration).sort((a, b) => a - b);
        resolve({ sampleMs: now - started, intervals: fps.length, renderedFrames: window.__ATLAS_CELL__().frames - firstFrames,
          p10: fps[Math.floor(fps.length * .1)], p50: fps[Math.floor(fps.length * .5)], rendering,
          state: window.__ATLAS_CELL__(), viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
          jsHeapBytes: performance.memory?.usedJSHeapSize ?? null,
        });
      }
    }
    requestAnimationFrame(sample);
  }));
  await orbit(30_200);
  const sample = await measurement;
  await page.mouse.up();
  const maxDraws = Math.max(...sample.rendering.map((part) => part.draws));
  const budgets = {
    homeColdUnder500KiB: home.bytes <= 500 * 1024,
    incrementalUnder250KiB: incremental.bytes <= 250 * 1024,
    entryUnder5s: incremental.milliseconds <= 5000,
    directUnder5s: directMs <= 5000,
    directUnder8MiB: direct.bytes <= 8 * 1024 * 1024,
    p50: sample.p50 >= 50, p10: sample.p10 >= 30, drawsAtMost30: maxDraws <= 30,
    actualRendererDoesWork: sample.renderedFrames > 150,
    restingInvalidationsStopped: resting === restingAfter,
  };
  const result = {
    mode, mobile, browser: browser.version(), cpu: os.cpus()[0]?.model, ramBytes: os.totalmem(),
    network, warmupMs: 10000,
    homeBytes: home.bytes, microBytes: micro.bytes, direct: { bytes: direct.bytes, milliseconds: directMs },
    incremental, sample, maxDraws, budgets, errors, httpErrors, failedRequests,
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ mode, mobile, direct: result.direct, incremental: incremental.bytes, entry: incremental.milliseconds,
    p10: sample.p10, p50: sample.p50, renderedFrames: sample.renderedFrames, maxDraws, budgets }));
  await context.close();
  if (errors.length || httpErrors.length || failedRequests.length || Object.values(budgets).some((ok) => !ok)) process.exitCode = 1;
} finally {
  await browser.close();
}
