// Actual application screenshots only. No scene, trajectory or camera injection.
// Baseline first: node artifacts/gates/G4A1-review/capture.mjs --label=before
// Current later: node artifacts/gates/G4A1-review/capture.mjs --label=after
// Optional: --label=both (default), --skip-video, --archive-existing.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { generateIndex } from './index.mjs';

const output = path.resolve('artifacts/gates/G4A1-review');
const label = process.argv.find((arg) => arg.startsWith('--label='))?.slice(8) ?? 'both';
if (!['before', 'after', 'both'].includes(label)) throw new Error('Expected --label=before, --label=after or --label=both.');
const urls = { before: process.env.ATLAS_BEFORE_URL ?? 'http://127.0.0.1:4176', after: process.env.ATLAS_AFTER_URL ?? 'http://127.0.0.1:4173' };
const rcId = 'rc:17:0', rbcId = 'rbc:17:1';
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const exists = async (file) => fs.access(file).then(() => true, () => false);
const settle = (page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const micro = (page) => page.evaluate(() => {
  const { particles, ...value } = window.__ATLAS_MICRO__.snapshot();
  return { ...value, particleCount: particles.length };
});
const basename = (file) => path.relative(output, file).replaceAll('\\', '/');
const runtime = { before: { errors: [], warnings: [], failedRequests: [], httpErrors: [] }, after: { errors: [], warnings: [], failedRequests: [], httpErrors: [] } };
function monitor(page, side) {
  const log = runtime[side];
  page.on('pageerror', (error) => log.errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') log.errors.push(message.text()); if (message.type() === 'warning') log.warnings.push(message.text()); });
  page.on('requestfailed', (request) => { const failure = request.failure()?.errorText ?? ''; if (!failure.includes('ERR_ABORTED')) log.failedRequests.push({ url: request.url(), failure }); });
  page.on('response', (response) => { if (response.status() >= 400) log.httpErrors.push({ url: response.url(), status: response.status() }); });
}
async function prepareFolder(side) {
  const folder = path.join(output, side), old = path.join(folder, 'captures.json');
  if (await exists(old)) {
    if (!process.argv.includes('--archive-existing')) throw new Error(`${side}/captures.json already exists. Preserve it, or explicitly archive this local G4A.1 run with --archive-existing.`);
    const destination = path.join(output, 'history', `${side}-${new Date().toISOString().replaceAll(':', '-')}`);
    for (const target of [folder, destination]) {
      if (!path.resolve(target).startsWith(`${output}${path.sep}`)) throw new Error('Archive target escaped G4A1-review.');
    }
    // OneDrive/preview handles can deny a directory rename on Windows. Copy and
    // verify every prior byte before reusing only our known output filenames.
    // No folder is deleted or moved, and symlinks are never followed.
    const records = [];
    async function archiveTree(source, target) {
      await fs.mkdir(target, { recursive: true });
      for (const entry of await fs.readdir(source, { withFileTypes: true })) {
        const input = path.join(source, entry.name), archived = path.join(target, entry.name);
        if (entry.isDirectory()) await archiveTree(input, archived);
        else if (entry.isFile()) {
          const bytes = await fs.readFile(input);
          await fs.writeFile(archived, bytes, { flag: 'wx' });
          if (sha(await fs.readFile(archived)) !== sha(bytes)) throw new Error('Capture archive hash mismatch.');
          records.push({ source: basename(input), archive: basename(archived), bytes: bytes.length, sha256: sha(bytes) });
        } else throw new Error('Capture archive requires regular files/directories.');
      }
    }
    await archiveTree(folder, destination);
    await fs.writeFile(path.join(destination, 'archive-manifest.json'), `${JSON.stringify({ method: 'Verified copy before replacing known generated outputs; no delete or move.', records }, null, 2)}\n`);
  }
  await fs.mkdir(folder, { recursive: true }); return folder;
}
async function open(page, side) {
  monitor(page, side);
  const response = await page.goto(`${urls[side]}/?microSeed=17`, { waitUntil: 'load' });
  if (!response?.ok()) throw new Error(`Failed ${side} document: ${response?.status()}`);
  const documentSha256 = sha(await response.body());
  await page.getByTestId('scene-status').filter({ hasText: '3D conectado' }).waitFor();
  await page.getByTestId('micro-entry').click();
  await page.getByTestId('micro-status').filter({ hasText: '3D conectado' }).waitFor();
  await page.waitForFunction(() => Boolean(window.__ATLAS_MICRO__?.snapshot().adapter));
  await page.getByTestId('micro-profile').selectOption('500');
  await page.waitForFunction(() => window.__ATLAS_MICRO__.snapshot().adapter.counts.total === 500);
  const state = await micro(page);
  if (state.config.seed !== 17) throw new Error(`Expected seed17, received ${state.config.seed}.`);
  return { documentSha256, servedScripts: await page.evaluate(() => performance.getEntriesByType('resource').map((item) => item.name).filter((name) => /\.js(?:\?|$)/.test(name))) };
}
async function scrub(page, seconds) {
  await page.getByTestId('micro-time').fill(String(seconds));
  await page.waitForFunction((seconds) => Math.abs(window.__ATLAS_MICRO__.snapshot().adapter.seconds - seconds) < 1e-8, seconds);
  await settle(page);
}
async function select(page, id) {
  await page.getByTestId('micro-entity').selectOption(id);
  await page.waitForFunction((id) => window.__ATLAS_MICRO__.snapshot().selectedId === (id || null), id);
}
async function follow(page, id = rcId) {
  await select(page, id);
  if ((await micro(page)).cameraMode !== 'tracking') await page.getByTestId('micro-follow').click();
  await page.waitForFunction(() => window.__ATLAS_MICRO__.snapshot().cameraMode === 'tracking'); await settle(page);
}
async function centerRay(page, id = rcId) {
  return page.evaluate((id) => {
    const api = window.__ATLAS_MICRO__, projected = api.project(id);
    const onScreen = projected && projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < .92 && Math.abs(projected.y) < .85;
    return { projected, onScreen: Boolean(onScreen), firstHit: onScreen ? api.raycast(projected.x, projected.y) : null };
  }, id);
}
async function visibility(page, side, id = rcId) {
  if (side === 'before') return null;
  return page.evaluate((id) => {
    if (typeof window.__ATLAS_MICRO__.visibility !== 'function') throw new Error('Current build must expose real visibility diagnostics.');
    return window.__ATLAS_MICRO__.visibility(id);
  }, id);
}
async function capture(page, folder, file, name, side, stageOnly = false) {
  const destination = path.join(folder, file); await fs.mkdir(path.dirname(destination), { recursive: true });
  const state = await micro(page), stage = page.getByTestId('micro-stage');
  const stageRect = await stage.boundingBox(), canvasRect = await stage.locator('canvas').boundingBox();
  const layout = await stage.evaluate((element) => {
    const title = element.querySelector('h1'), titleRect = title?.getBoundingClientRect();
    return { documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth,
      title: titleRect ? { width: titleRect.width, height: titleRect.height, fontSize: getComputedStyle(title).fontSize } : null };
  });
  const center = state.selectedId ? await centerRay(page, state.selectedId) : null;
  const visible = state.selectedId ? await visibility(page, side, state.selectedId) : null;
  const beforeScreenshotMs = Date.now();
  const bytes = stageOnly ? await stage.screenshot({ path: destination }) : await page.screenshot({ path: destination });
  const after = await micro(page);
  return { name, file: basename(destination), sha256: sha(bytes), capturedAt: new Date(beforeScreenshotMs).toISOString(),
    captureArea: stageOnly ? 'stage' : 'viewport', viewport: page.viewportSize(), stageRect, canvasRect, layout,
    state, secondsAfter: after.seconds, centerRay: center, visibility: visible,
    note: state.playing ? 'Actual automatic playback; screenshot and diagnostic times can differ slightly. No time injection.' : 'Actual static pose through UI scrub and reduced motion.' };
}
async function chooseOcclusionPose(page) {
  await follow(page); const probes = [];
  for (const seconds of [0, 5, 10, 15, 20, 25, 30, 35, 40, 11, ...Array.from({ length: 41 }, (_, index) => index)]) {
    if (probes.some((probe) => probe.seconds === seconds)) continue;
    await scrub(page, seconds); const ray = await centerRay(page);
    probes.push({ seconds, ...ray });
    // This is an actual baseline centre-ray occlusion, not a fabricated
    // visibility score. Partial surface visibility is measured separately.
    if (ray.onScreen && ray.firstHit && ray.firstHit !== rcId) return { seconds, foundCellOccluder: true, probes };
  }
  return { seconds: 20, foundCellOccluder: false, probes,
    note: 'No cell occluder intercepted the tested centre rays. Fixed20s is an inspection pose, not a claim of complete target visibility.' };
}

const browser = await chromium.launch({ headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
  args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
async function run(side, baseline) {
  const folder = await prepareFolder(side), captures = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage(), source = await open(page, side);
  let occlusion = baseline?.comparisonScenario?.occlusion;
  try {
    await page.getByTestId('micro-camera-reset').click(); await select(page, ''); await scrub(page, 4);
    captures.push(await capture(page, folder, 'overview.png', 'overview', side));
    await follow(page); await scrub(page, 11);
    captures.push(await capture(page, folder, 'rc-selected.png', 'rc-selected', side));
    if (side === 'before') occlusion = await chooseOcclusionPose(page);
    if (!occlusion) throw new Error('Capture the baseline first to preserve the identical occlusion timeline pose.');
    await follow(page); await scrub(page, occlusion.seconds);
    captures.push(await capture(page, folder, 'tracking-occlusion.png', 'tracking-occlusion', side));
    await follow(page, rbcId); await scrub(page, 11);
    captures.push(await capture(page, folder, 'rbc-closeup.png', 'rbc-closeup', side));
    await select(page, ''); await page.getByTestId('micro-camera-reset').click(); await scrub(page, 4);
    const canvas = page.getByTestId('micro-stage').locator('canvas'), box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas has no bounds for the actual wall orbit.');
    await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5); await page.mouse.down();
    await page.mouse.move(box.x + box.width * .66, box.y + box.height * .54, { steps: 12 }); await page.mouse.up(); await settle(page);
    captures.push(await capture(page, folder, 'wall.png', 'wall', side));
    await follow(page); await scrub(page, 11); await page.getByTestId('micro-highlight').check(); await settle(page);
    captures.push(await capture(page, folder, 'desktop.png', 'desktop', side));
  } finally { await context.close(); }

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  try {
    const mobile = await mobileContext.newPage(); await open(mobile, side); await follow(mobile); await scrub(mobile, 11);
    await mobile.getByTestId('micro-stage').scrollIntoViewIfNeeded();
    captures.push(await capture(mobile, folder, 'mobile.png', 'mobile', side));
  } finally { await mobileContext.close(); }

  const result = { gate: 'G4A.1', comparisonLabel: side, createdAt: new Date().toISOString(), target: urls[side], browser: browser.version(),
    source: { ...source, meaning: side === 'before' ? 'Frozen G4A local baseline dist in artifacts/local/g4a1-baseline; no historical evidence overwritten.' : 'Current local production build.' },
    comparisonScenario: { seed: 17, count: 500, rcId, rbcId, staticReducedMotion: true, occlusion,
      method: 'Identical public UI actions, viewport, seed, population, identities and timeline. Complete camera and canvas dimensions are recorded; changed tracking framing is disclosed by the index, never mislabeled as identical camera.' },
    captures, runtime: { ...runtime[side], warnings: [...new Set(runtime[side].warnings)] },
    limitations: ['Centre-ray occlusion differs from full surface visibility.', 'Current visibility diagnostics use real meshes but are not a physiological model.',
      'Paired captures freeze actual UI poses. The separate video uses real playback. Artistic approval remains human.', 'Mobile emulation uses the workstation GPU.'] };
  await fs.writeFile(path.join(folder, 'captures.json'), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
async function recordAfter() {
  const folder = path.join(output, 'after'), recording = path.resolve('artifacts/local/g4a1-video-recordings');
  await fs.mkdir(recording, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference',
    recordVideo: { dir: recording, size: { width: 1440, height: 900 } } });
  const page = await context.newPage(), video = page.video(), startedVideoAt = Date.now();
  const captures = [], samples = [], frameSeconds = [0, 6, 12, 18, 24, 30, 36, 42];
  let final, started;
  try {
    await open(page, 'after'); await follow(page); await scrub(page, 0); await page.getByTestId('micro-play').click();
    started = Date.now(); let nextFrame = 0;
    while (Date.now() - started < 65_000) {
      const current = await micro(page);
      if (!current.playing || current.cameraMode !== 'tracking' || current.selectedId !== rcId || current.config.seed !== 17 || current.config.count !== 500) throw new Error('Real video lost its tracking identity, profile or playback.');
      samples.push({ wallElapsedMs: Date.now() - started, seconds: current.seconds, camera: current.camera, selectedId: current.selectedId,
        positionHash: current.adapter.positionHash, centerRay: await centerRay(page), visibility: await visibility(page, 'after'), metrics: current.metrics });
      if (nextFrame < frameSeconds.length && current.seconds >= frameSeconds[nextFrame]) {
        captures.push(await capture(page, folder, `sequence/tracking-${String(nextFrame + 1).padStart(2, '0')}.png`, `playback-${frameSeconds[nextFrame]}s`, 'after', true)); nextFrame++;
      }
      if (current.seconds >= 42 && nextFrame === frameSeconds.length) { final = current; break; }
      await page.waitForTimeout(500);
    }
    if (!final) throw new Error('42 actual simulation seconds were not observed within65 real seconds.');
    await page.getByTestId('micro-play').click();
  } finally { await context.close(); }
  const file = path.join(folder, 'tracking-42s.webm'); await fs.copyFile(await video.path(), file);
  const result = { file: basename(file), sha256: sha(await fs.readFile(file)), bytes: (await fs.stat(file)).size,
    recordedAt: new Date(startedVideoAt).toISOString(), playbackStartOffsetWallMs: started - startedVideoAt,
    wallElapsedMs: samples.at(-1).wallElapsedMs, simulationSecondsObserved: final.seconds, captures, samples,
    method: 'Actual default-speed playback of rc:17:0, seed17, profile500 for at least42 simulation seconds. No accelerated clock, scrub or injected frame advance during the observed playback.',
    note: 'Video includes navigation. Sequence PNGs are real frames captured during that recorded playback, labeled with their observed timeline in metadata; this is not an FPS benchmark.' };
  await fs.writeFile(path.join(folder, 'playback.json'), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
try {
  let before = await exists(path.join(output, 'before', 'captures.json')) ? JSON.parse(await fs.readFile(path.join(output, 'before', 'captures.json'), 'utf8')) : null;
  if (label === 'before' || label === 'both' && !before) before = await run('before');
  if (label === 'after' || label === 'both') {
    if (!before) throw new Error('A completed before/captures.json is required for matched comparisons.');
    await run('after', before);
    if (!process.argv.includes('--skip-video')) await recordAfter();
  }
  await generateIndex(output);
  for (const side of ['before', 'after']) {
    const log = runtime[side];
    if (log.errors.length || log.failedRequests.length || log.httpErrors.length) process.exitCode = 1;
  }
  console.log(JSON.stringify({ output, label, runtime }, null, 2));
} finally { await browser.close(); }
