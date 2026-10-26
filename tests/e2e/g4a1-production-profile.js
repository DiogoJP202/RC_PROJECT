/** New G4A.1 production measurement; independently collected Flow and Tracking runs. Build/preview first; run profiles sequentially.
 * node tests/e2e/g4a1-production-profile.js --count=100|500|2000 [--tracking] [--mobile] [--label=before|after]
 * Optional --output=artifacts/g4a1/production-after-flow-500.json and ATLAS_PROFILE_URL. Baseline: --label=before with URL4176; current URL4173.
 */
/* global window, document, requestAnimationFrame, innerWidth, innerHeight, devicePixelRatio */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import os from 'node:os';

const count = Number(process.argv.find((arg) => arg.startsWith('--count='))?.slice(8) ?? 500);
if (![100, 500, 2000].includes(count)) throw new Error('Expected --count=100, --count=500 or --count=2000.');
const mobile = process.argv.includes('--mobile');
const tracking = process.argv.includes('--tracking');
const cameraMode = tracking ? 'tracking' : 'flow';
const label = process.argv.find((arg) => arg.startsWith('--label='))?.slice(8) ?? 'after';
if (!['before', 'after'].includes(label)) throw new Error('Expected --label=before or --label=after.');
const output = process.argv.find((arg) => arg.startsWith('--output='))?.slice(9)
  ?? `artifacts/g4a1/production-${label}-${cameraMode}-${mobile ? 'emulated-mobile-' : ''}${count}.json`;
const url = process.env.ATLAS_PROFILE_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
  args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, reducedMotion: 'no-preference', serviceWorkers: 'block' });
const page = await context.newPage(), cdp = await context.newCDPSession(page);
const errors = [], warnings = [], failedRequests = [], httpErrors = [], encodings = [];
const transfers = new Map();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()); });
page.on('requestfailed', (request) => { const failure = request.failure()?.errorText ?? ''; if (!failure.includes('ERR_ABORTED')) failedRequests.push({ url: request.url(), failure }); });
page.on('response', (response) => { if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() }); });
await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
const throttle = { offline: false, latency: 50, downloadThroughput: 2_500_000, uploadThroughput: 2_500_000, connectionType: 'ethernet' };
await cdp.send('Network.emulateNetworkConditions', throttle); await cdp.send('Performance.enable');
cdp.on('Network.loadingFinished', ({ requestId, encodedDataLength }) => transfers.set(requestId, encodedDataLength));
cdp.on('Network.responseReceived', ({ response }) => {
  const headers = Object.fromEntries(Object.entries(response.headers).map(([key, value]) => [key.toLowerCase(), value]));
  encodings.push({ url: response.url, status: response.status, contentEncoding: headers['content-encoding'] ?? 'identity', mimeType: response.mimeType });
});
try {
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => performance.getEntriesByName('atlas-interactive').length > 0, undefined, { timeout: 30_000 });
  const body = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0], entries = performance.getEntriesByType('resource');
    return { interactiveMs: performance.getEntriesByName('atlas-interactive')[0].startTime,
      transferBytes: nav.transferSize + entries.reduce((sum, item) => sum + item.transferSize, 0),
      encodedBodyBytes: nav.encodedBodySize + entries.reduce((sum, item) => sum + item.encodedBodySize, 0),
      resourceUrls: entries.map((entry) => entry.name) };
  });
  await page.evaluate(() => performance.mark('g4a1-profile-entry'));
  const entryStart = Date.now();
  await page.getByTestId('micro-entry').click();
  await page.getByTestId('micro-status').filter({ hasText: '3D conectado' }).waitFor({ timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.__ATLAS_MICRO__?.snapshot().adapter));
  const readyObservedMs = Date.now() - entryStart;
  const micro = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0], entries = performance.getEntriesByType('resource');
    return { readyMs: performance.getEntriesByName('atlas-micro-interactive').at(-1).startTime - performance.getEntriesByName('g4a1-profile-entry').at(-1).startTime,
      combinedTransferBytes: nav.transferSize + entries.reduce((sum, item) => sum + item.transferSize, 0),
      resourceUrls: entries.map((entry) => entry.name) };
  });
  await page.getByTestId('micro-profile').selectOption(String(count));
  await page.waitForFunction((expected) => window.__ATLAS_MICRO__.snapshot().adapter.counts.total === expected, count);
  await page.getByTestId('micro-reset').click();
  if (tracking) {
    await page.getByTestId('micro-entity').selectOption('rc:17:0');
    await page.getByTestId('micro-follow').click();
  } else await page.getByTestId('micro-camera-flow').click();
  await page.waitForFunction((mode) => window.__ATLAS_MICRO__.snapshot().cameraMode === mode, cameraMode);
  await page.getByTestId('micro-play').click();
  if (mobile) await page.getByTestId('micro-stage').scrollIntoViewIfNeeded();
  await page.waitForTimeout(10_000);
  const beforeMemory = await cdp.send('Performance.getMetrics');
  const sampled = await page.evaluate(async () => {
    const compact = () => {
      const value = window.__ATLAS_MICRO__.snapshot();
      const adapter = { ...value.adapter }; delete adapter.instanceIds;
      return { seconds: value.seconds, playing: value.playing, config: value.config, cameraMode: value.cameraMode,
        camera: value.camera, selectedId: value.selectedId, highlightRC: value.highlightRC, adapter, metrics: value.metrics };
    };
    const start = performance.now(), initial = compact(), durations = [], observations = [];
    let previous = start, nextRead = 0;
    await new Promise((resolve) => {
      const frame = (now) => {
        if (previous !== start) durations.push(now - previous);
        previous = now;
        if (now - start >= nextRead) {
          observations.push({ elapsedMs: now - start, ...compact(), readyText: document.querySelector('[data-testid="micro-status"]')?.textContent });
          nextRead += 1000;
        }
        if (now - start < 30_000) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
    const fps = durations.map((duration) => 1000 / duration).sort((a, b) => a - b);
    return { durationMs: performance.now() - start, frames: durations.length,
      fpsP50: fps[Math.floor(fps.length * .5)], fpsP10: fps[Math.floor(fps.length * .1)], fpsMin: fps[0], fpsMax: fps.at(-1),
      initial, final: compact(), observations, documentVisibility: document.visibilityState,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio } };
  });
  const afterMemory = await cdp.send('Performance.getMetrics');
  const memoryMap = ({ metrics }) => Object.fromEntries(metrics.map(({ name, value }) => [name, value]));
  const before = memoryMap(beforeMemory), after = memoryMap(afterMemory);
  const metrics = sampled.observations.map((item) => item.metrics);
  const range = (key) => { const values = metrics.map((item) => item[key]).filter(Number.isFinite); return { min: Math.min(...values), max: Math.max(...values) }; };
  const resourcesStable = sampled.observations.every((item) => JSON.stringify(item.adapter.resourceIds) === JSON.stringify(sampled.initial.adapter.resourceIds));
  const noSceneFailure = sampled.observations.every((item) => item.readyText?.includes('3D conectado') && item.playing && item.adapter.counts.total === count && item.cameraMode === cameraMode && (!tracking || item.selectedId === 'rc:17:0'));
  const result = { gate: 'G4A.1', comparisonLabel: label, measuredAt: new Date().toISOString(), target: url, build: 'Fresh production Vite preview; HTTP cache disabled; no previous gate measurements reused.',
    scenario: { count, seed: 17, cameraMode, selectedId: tracking ? 'rc:17:0' : null, highlightRC: false, normalizedSpeed: 3 / 7, mobileEmulation: mobile,
      bodyRemainsMountedForContext: true, microLazy: true, readyObservedMs, readyMs: micro.readyMs, readyInitialProfile: 500,
      microAdditionalTransferBytes: micro.combinedTransferBytes - body.transferBytes, bootPlusMicroTransferBytes: micro.combinedTransferBytes },
    environment: { os: `${os.platform()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model, ramBytes: os.totalmem(), browser: `Chromium ${browser.version()}`,
      headless: true, renderer: sampled.final.metrics.renderer, viewport: sampled.viewport },
    protocol: { warmupMs: 10_000, requestedSampleMs: 30_000, readDiagnosticsIntervalMs: 1000,
      fpsMethod: 'Percentiles of reciprocal visible requestAnimationFrame intervals. Diagnostics once per second, never every frame.',
      profileMeaning: 'Counts are rendered entities, not physiological concentrations; each count/mode is a separate fresh context.',
      readinessMeaning: 'Entry readyMs always measures DEFAULT500 before changing the measured population. Flow protocol matches G4A; Tracking is a separate cost scenario.',
      diagnosticScope: 'Renderer counters cover Micro only; Body remains resident. One owned bump texture is distinct from renderer texture count. Visibility raycasts are not sampled during FPS measurement.' },
    network: { method: 'Chromium DevTools Protocol', cdp: throttle, nominalDownloadMbps: 20, latencyNote: '50 ms is a CDP setting, not measured physical RTT.',
      transferredCdpBytes: [...transfers.values()].reduce((sum, bytes) => sum + bytes, 0), responseEncodings: encodings },
    bodyCold: body, microLoad: micro, sample: sampled,
    observables: { drawCalls: range('calls'), triangles: range('triangles'), geometries: range('geometries'), textures: range('textures'), resourceIdsStable: resourcesStable,
      materialAndEffects: 'Read adapter/resources and scene implementation: no claim that counts measure material cost or VRAM.' },
    memory: { before, after, jsHeapUsedDeltaBytes: after.JSHeapUsedSize - before.JSHeapUsedSize, note: 'GC can alter heap. Renderer counters and JS memory do not estimate GPU VRAM.' },
    budgets: { bodyInteractiveUnder5s: body.interactiveMs <= 5000, microReadyUnder5s: micro.readyMs <= 5000,
      fpsP50AtLeast50: sampled.fpsP50 >= 50, fpsP10AtLeast30: sampled.fpsP10 >= 30, drawsUnder150: range('calls').max < 150,
      initialPayloadUnder8MiB: body.transferBytes <= 8 * 1024 * 1024, bodyPlusMicroUnder8MiB: micro.combinedTransferBytes <= 8 * 1024 * 1024,
      resourceIdsStable: resourcesStable, noSceneFailure },
    runtime: { errors, warnings: [...new Set(warnings)], failedRequests, httpErrors },
    limitations: ['One run of this declared profile/mode/build on the workstation; before/after must use identical hardware, seed17, count and mode.', 'Emulated mobile uses workstation GPU and does not certify a physical phone.',
      'rAF percentiles are not GPU frame timings; heap/resource identities do not prove universal leak absence.', 'Artistic human review is independent of numeric budgets.'] };
  await mkdir(dirname(output), { recursive: true }); await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ output, environment: result.environment, scenario: result.scenario, sampleMs: sampled.durationMs, frames: sampled.frames,
    fpsP50: sampled.fpsP50, fpsP10: sampled.fpsP10, observables: result.observables, budgets: result.budgets, runtime: result.runtime }, null, 2));
  if (errors.length || failedRequests.length || httpErrors.length || Object.values(result.budgets).some((pass) => !pass)) process.exitCode = 1;
} finally { await browser.close(); }
