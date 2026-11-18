/**
 * Fresh G3A production measurement; keeps the G1/G2A profiler unchanged.
 * Build, start preview:4173, then run node tests/e2e/g3a-production-profile.js.
 * Optional --quality=low, --output=test-results/atlas-evidence/g3a/production-standard.json.
 */
/* global window, document, requestAnimationFrame, innerWidth, innerHeight, devicePixelRatio */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import os from 'node:os';

const quality = process.argv.includes('--quality=low') ? 'low' : 'standard';
const output = process.argv.find((arg) => arg.startsWith('--output='))?.slice('--output='.length)
  ?? `test-results/atlas-evidence/g3a/production-${quality}.json`;
const url = process.env.ATLAS_PROFILE_URL ?? 'http://127.0.0.1:4173/atlas';
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
  headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference', serviceWorkers: 'block' });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
const errors = [], warnings = [], failedRequests = [], httpErrors = [], responseEncodings = [];
const transferred = new Map();
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
  if (message.type() === 'warning') warnings.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));
page.on('requestfailed', (request) => {
  const failure = request.failure()?.errorText ?? '';
  if (!failure.includes('ERR_ABORTED')) failedRequests.push({ url: request.url(), failure });
});
page.on('response', (response) => { if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() }); });
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
const throttle = { offline: false, latency: 50, downloadThroughput: 2_500_000, uploadThroughput: 2_500_000, connectionType: 'ethernet' };
await cdp.send('Network.emulateNetworkConditions', throttle);
await cdp.send('Performance.enable');
cdp.on('Network.loadingFinished', ({ requestId, encodedDataLength }) => transferred.set(requestId, encodedDataLength));
cdp.on('Network.responseReceived', ({ response }) => {
  const headers = Object.fromEntries(Object.entries(response.headers).map(([key, value]) => [key.toLowerCase(), value]));
  responseEncodings.push({ url: response.url, status: response.status, contentEncoding: headers['content-encoding'] ?? 'identity', mimeType: response.mimeType });
});

try {
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => performance.getEntriesByName('atlas-interactive').length > 0, undefined, { timeout: 30_000 });
  const coldLoad = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    return {
      interactiveMs: performance.getEntriesByName('atlas-interactive')[0].startTime,
      transferBytes: navigation.transferSize + resources.reduce((sum, entry) => sum + entry.transferSize, 0),
      encodedBodyBytes: navigation.encodedBodySize + resources.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
      resources: resources.map((entry) => ({ url: entry.name, transferBytes: entry.transferSize, encodedBodyBytes: entry.encodedBodySize, durationMs: entry.duration })),
    };
  });
  const activationStart = Date.now();
  await page.getByTestId('rinkaku-toggle').click();
  await page.waitForFunction(() => Boolean(window.__ATLAS_SCENE__?.snapshot().rinkaku?.adapter));
  const activationMs = Date.now() - activationStart;
  await page.getByTestId('rinkaku-quality').selectOption(quality);
  const manifestTransferBytes = await page.evaluate(() => performance.getEntriesByType('navigation')[0].transferSize
    + performance.getEntriesByType('resource').reduce((sum, entry) => sum + entry.transferSize, 0));
  await page.getByTestId('rinkaku-reset').click();
  await page.getByTestId('rinkaku-play').click();
  await page.waitForTimeout(10_000);
  const beforeMemory = await cdp.send('Performance.getMetrics');
  const sampled = await page.evaluate(async () => {
    const start = performance.now();
    const initial = window.__ATLAS_SCENE__.snapshot();
    const durations = [], renderSamples = [], phases = new Set();
    let previous = start, nextMetricAt = 0, nextControlAt = 0, replayCount = 0;
    await new Promise((resolve) => {
      const frame = (now) => {
        if (previous !== start) durations.push(now - previous);
        previous = now;
        if (now - start >= nextControlAt) {
          const state = window.__ATLAS_SCENE__.snapshot();
          phases.add(state.rinkaku.snapshot.phase);
          // Restart through the actual UI at 2 Hz. Expensive diagnostic snapshots
          // stay outside the per-frame path; no engine/scene state is injected.
          if (state.rinkaku.t >= 1 && !state.rinkaku.playing) {
            document.querySelector('[data-testid="rinkaku-reset"]').click();
            document.querySelector('[data-testid="rinkaku-play"]').click();
            replayCount++;
          }
          if (now - start >= nextMetricAt) {
            renderSamples.push({ elapsedMs: now - start, phase: state.rinkaku.snapshot.phase, t: state.rinkaku.t, ...state.metrics, adapter: state.rinkaku.adapter });
            nextMetricAt += 1_000;
          }
          nextControlAt += 500;
        }
        if (now - start < 30_000) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
    const fps = durations.map((duration) => 1_000 / duration).sort((a, b) => a - b);
    return {
      durationMs: performance.now() - start, frames: durations.length,
      fpsP50: fps[Math.floor(fps.length * .5)], fpsP10: fps[Math.floor(fps.length * .1)],
      fpsMin: fps[0], fpsMax: fps.at(-1), phases: [...phases], replayCount,
      initial, final: window.__ATLAS_SCENE__.snapshot(), renderSamples,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      documentVisibility: document.visibilityState,
    };
  });
  const afterMemory = await cdp.send('Performance.getMetrics');
  const metricMap = ({ metrics }) => Object.fromEntries(metrics.map(({ name, value }) => [name, value]));
  const calls = sampled.renderSamples.map((sample) => sample.calls).filter(Number.isFinite);
  const result = {
    measuredAt: new Date().toISOString(), target: url, build: 'Production Vite preview; fresh context; HTTP cache disabled.',
    scenario: { quality, appendageCount: 4, seed: 17, particlesSetting: true, particlesRendered: quality === 'standard', activationMs, activationAdditionalTransferBytes: manifestTransferBytes - coldLoad.transferBytes, bootPlusManifestTransferBytes: manifestTransferBytes, sequence: 'Full 18 s absolute timeline, restarted via reset/play UI; 10 s warm-up then 30 s rAF sample.' },
    environment: { os: `${os.platform()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model, ramBytes: os.totalmem(), browser: `Chromium ${browser.version()}`, headless: true, renderer: sampled.final.metrics?.renderer, viewport: sampled.viewport },
    network: { method: 'Chromium DevTools Protocol', cdp: throttle, nominalDownloadMbps: 20, latencyNote: 'latency=50 ms is a CDP request setting, not a measurement of symmetric physical RTT.', transferredCdpBytes: [...transferred.values()].reduce((sum, bytes) => sum + bytes, 0), transferredPerformanceBytes: coldLoad.transferBytes, transferScope: 'Performance initial bytes are Body boot; scenario separately reports the lazy manifestation activation and combined total. CDP total includes both.', responseEncodings },
    coldLoad, protocol: { warmupMs: 10_000, requestedSamplingMs: 30_000, fpsMethod: 'Percentiles of reciprocal visible desktop requestAnimationFrame intervals.', metricIntervalMs: 1_000, diagnosticReadIntervalMs: 500 },
    sample: sampled, memory: { before: metricMap(beforeMemory), after: metricMap(afterMemory), note: 'JS/process and renderer counters do not estimate GPU VRAM.' },
    budgets: { interactionUnder5s: coldLoad.interactiveMs <= 5_000, fpsP50AtLeast50: sampled.fpsP50 >= 50, fpsP10AtLeast30: sampled.fpsP10 >= 30, drawsUnder150: Math.max(...calls) < 150, measuredInitialPayloadUnder8MiB: coldLoad.transferBytes <= 8 * 1024 * 1024, bodyPlusManifestUnder8MiB: manifestTransferBytes <= 8 * 1024 * 1024 },
    runtime: { errors, warnings: [...new Set(warnings)], failedRequests, httpErrors },
    limitations: ['Single run for the declared profile on this workstation.', 'Emulated mobile layout does not certify physical mobile FPS.', 'Procedural art and renderer counters do not establish final GLB/anatomical fidelity or universal leak absence.'],
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ output, environment: result.environment, scenario: result.scenario, interactiveMs: coldLoad.interactiveMs, transferBytes: coldLoad.transferBytes, sampleMs: sampled.durationMs, frames: sampled.frames, fpsP50: sampled.fpsP50, fpsP10: sampled.fpsP10, phases: sampled.phases, replayCount: sampled.replayCount, maxCalls: Math.max(...calls), budgets: result.budgets, runtime: result.runtime }, null, 2));
  if (errors.length || failedRequests.length || httpErrors.length || Object.values(result.budgets).some((pass) => !pass)) process.exitCode = 1;
} finally { await browser.close(); }
