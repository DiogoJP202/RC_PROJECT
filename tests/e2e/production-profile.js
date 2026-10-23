/**
 * Reproduce ADR-011 on a built preview, with no development server payload:
 *   npm run build
 *   npm run preview -- --port 4173
 *   node tests/e2e/production-profile.js
 * Optional: ATLAS_PROFILE_URL, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
 * CDP latency=50 is reported as a CDP setting, never as symmetric network RTT.
 */
/* global window, requestAnimationFrame, innerWidth, innerHeight, devicePixelRatio, document */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

const url = process.env.ATLAS_PROFILE_URL ?? 'http://127.0.0.1:4173';
const chrome = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? join(process.env.ProgramFiles ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe');
const browser = await chromium.launch({
  ...(existsSync(chrome) ? { executablePath: chrome } : {}),
  headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
  reducedMotion: 'no-preference', serviceWorkers: 'block',
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
const errors = [], warnings = [], failedRequests = [], httpErrors = [];
const transferred = new Map();
const responseEncodings = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
  if (message.type() === 'warning') warnings.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));
page.on('requestfailed', (request) => {
  const failure = request.failure()?.errorText ?? '';
  if (!failure.includes('ERR_ABORTED')) failedRequests.push({ url: request.url(), failure });
});
page.on('response', (response) => {
  if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() });
});
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
const throttle = { offline: false, latency: 50, downloadThroughput: 2_500_000, uploadThroughput: 2_500_000, connectionType: 'ethernet' };
await cdp.send('Network.emulateNetworkConditions', throttle);
await cdp.send('Performance.enable');
cdp.on('Network.loadingFinished', ({ requestId, encodedDataLength }) => transferred.set(requestId, encodedDataLength));
cdp.on('Network.responseReceived', ({ response }) => {
  const headers = Object.fromEntries(Object.entries(response.headers).map(([key, value]) => [key.toLowerCase(), value]));
  responseEncodings.push({ url: response.url, status: response.status, contentEncoding: headers['content-encoding'] ?? 'identity', contentLength: headers['content-length'] ?? null, mimeType: response.mimeType });
});

let result;
try {
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => performance.getEntriesByName('atlas-interactive').length > 0, undefined, { timeout: 30_000 });
  const coldLoad = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    return {
      interactiveMs: performance.getEntriesByName('atlas-interactive')[0].startTime,
      navigationTransferBytes: navigation.transferSize,
      resourceTransferBytes: resources.reduce((sum, entry) => sum + entry.transferSize, 0),
      encodedBodyBytes: navigation.encodedBodySize + resources.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
      resourceCount: resources.length,
      resources: resources.map((entry) => ({ url: entry.name, transferBytes: entry.transferSize, encodedBodyBytes: entry.encodedBodySize, durationMs: entry.duration })),
    };
  });
  const networkBytes = [...transferred.values()].reduce((sum, bytes) => sum + bytes, 0);
  // Ten seconds after the interactive mark. This wait is separate from sampling.
  await page.waitForTimeout(10_000);
  const beforeMemory = await cdp.send('Performance.getMetrics');
  const sampled = await page.evaluate(async () => {
    const start = performance.now();
    const initial = window.__ATLAS_SCENE__.snapshot();
    const frameDurations = [];
    const renderSamples = [];
    let previous = start, nextMetricsAt = 0;
    await new Promise((resolve) => {
      const frame = (now) => {
        if (previous !== start) frameDurations.push(now - previous);
        previous = now;
        if (now - start >= nextMetricsAt) {
          const sample = window.__ATLAS_SCENE__.snapshot();
          renderSamples.push({ elapsedMs: now - start, ...sample.metrics });
          nextMetricsAt += 1_000;
        }
        if (now - start < 30_000) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
    const fps = frameDurations.map((duration) => 1_000 / duration).sort((a, b) => a - b);
    const end = window.__ATLAS_SCENE__.snapshot();
    const memory = performance.memory;
    return {
      durationMs: performance.now() - start, frames: frameDurations.length,
      fpsP50: fps[Math.floor(fps.length * 0.5)], fpsP10: fps[Math.floor(fps.length * 0.1)],
      fpsMin: fps[0], fpsMax: fps.at(-1),
      startFrames: initial.frames, endFrames: end.frames,
      scene: end, renderSamples,
      browserMemory: memory ? { usedJSHeapSize: memory.usedJSHeapSize, totalJSHeapSize: memory.totalJSHeapSize, jsHeapSizeLimit: memory.jsHeapSizeLimit } : null,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      documentVisibility: document.visibilityState,
    };
  });
  const afterMemory = await cdp.send('Performance.getMetrics');
  const metricMap = ({ metrics }) => Object.fromEntries(metrics.map(({ name, value }) => [name, value]));
  const compressedBytes = coldLoad.navigationTransferBytes + coldLoad.resourceTransferBytes;
  const calls = sampled.renderSamples.map((sample) => sample.calls).filter(Number.isFinite);
  result = {
    measuredAt: new Date().toISOString(), target: url, build: 'production Vite preview; fresh browser context; HTTP cache disabled',
    environment: { os: `${os.platform()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model, ramBytes: os.totalmem(), browser: `Chrome ${browser.version()}`, headless: true, renderer: sampled.scene.metrics?.renderer, viewport: sampled.viewport },
    network: { method: 'Chromium DevTools Protocol Network.emulateNetworkConditions', cdp: throttle, nominalDownloadMbps: 20, nominalUploadMbps: 20, latencyNote: 'latency=50ms is the CDP request latency setting; this does not certify a symmetric physical 50ms RTT.', transferredCdpBytes: networkBytes, transferredPerformanceBytes: compressedBytes, responseEncodings, encodingNote: 'Measured encoded transfer bytes include server compression and protocol overhead. GET response headers identify the actual content encoding; raw dist file sizes are a separate quantity.' },
    coldLoad, protocol: { warmupAfterInteractiveMs: 10_000, requestedSamplingMs: 30_000, fpsMethod: 'Percentiles of reciprocal requestAnimationFrame intervals; same visible desktop page renders R3F every frame.', sceneSampleIntervalMs: 1_000 },
    sample: sampled, memory: { before: metricMap(beforeMemory), after: metricMap(afterMemory), note: 'Chromium process/JS heap counters; geometries/textures separately from renderer.info. No estimate of GPU VRAM is claimed.' },
    budgets: { interactionUnder5s: coldLoad.interactiveMs <= 5_000, fpsP50AtLeast50: sampled.fpsP50 >= 50, fpsP10AtLeast30: sampled.fpsP10 >= 30, drawsUnder150: Math.max(...calls) < 150, measuredInitialPayloadUnder8MiB: compressedBytes <= 8 * 1024 * 1024 },
    runtime: { errors, warnings: [...new Set(warnings)], failedRequests, httpErrors },
    limitations: ['Single desktop run on this workstation, no claim about other GPUs.', 'Mobile layout is emulated separately; no physical mobile FPS measured.', 'Production anatomy/rig fidelity remains blocked by missing final licensed assets.'],
  };
  await mkdir('artifacts/gates', { recursive: true });
  await writeFile('artifacts/gates/G1-production-metrics.json', `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ environment: result.environment, network: result.network, interactiveMs: coldLoad.interactiveMs, sampleMs: sampled.durationMs, frames: sampled.frames, fpsP50: sampled.fpsP50, fpsP10: sampled.fpsP10, renderer: sampled.scene.metrics, budgets: result.budgets, runtime: result.runtime }, null, 2));
  if (errors.length || failedRequests.length || httpErrors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
