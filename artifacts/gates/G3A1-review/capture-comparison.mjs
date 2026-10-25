// Real UI only. Run after build, outside benchmarks and other GPU validation.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const output = 'artifacts/gates/G3A1-review';
const browser = await chromium.launch({ headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
  args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
const captures = [], runtime = { errors: [], warnings: [] };
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const scene = page => page.evaluate(() => window.__ATLAS_SCENE__.snapshot());
async function settle(page) {
  await page.waitForFunction(() => !window.__ATLAS_SCENE__.snapshot().camera.moving);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function enter(page, url) {
  page.on('pageerror', error => runtime.errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') runtime.errors.push(msg.text()); if (msg.type() === 'warning') runtime.warnings.push(msg.text()); });
  await page.goto(url);
  await page.getByTestId('scene-status').filter({ hasText: '3D conectado' }).waitFor();
  await page.getByRole('slider', { name: 'Opacidade da superfície', exact: true }).fill('1');
  await page.getByTestId('rinkaku-toggle').click();
  await page.waitForFunction(() => Boolean(window.__ATLAS_SCENE__.snapshot().rinkaku.adapter));
  await settle(page);
}
async function scrub(page, t) {
  await page.getByTestId('rinkaku-time').fill(String(t));
  await page.waitForFunction(t => Math.abs(window.__ATLAS_SCENE__.snapshot().rinkaku.adapter.t - t) < 1e-6, t);
  await settle(page);
}
async function capture(page, file, revision) {
  const state = await scene(page);
  const stageRect = await page.getByTestId('stage').boundingBox();
  await fs.mkdir(path.dirname(`${output}/${file}`), { recursive: true });
  const bytes = await page.screenshot({ path: `${output}/${file}` });
  captures.push({ file, revision, captureArea: 'viewport', viewport: page.viewportSize(), stageRect,
    t: state.rinkaku.t, phase: state.rinkaku.snapshot.phase, config: state.rinkaku.config, camera: state.camera, bodyOpacity: state.surfaceOpacity,
    bodyHeightFraction: state.bounds.heightFraction, sha256: sha(bytes) });
}
try {
  for (const revision of ['before', 'after']) {
    const url = revision === 'before' ? 'http://127.0.0.1:4175' : 'http://127.0.0.1:4173';
    for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await enter(page, url);
      for (const [phase, t] of [['growth', .53], ['active', .9]]) {
        await scrub(page, t);
        await page.getByTestId('stage').scrollIntoViewIfNeeded();
        await capture(page, `${revision}/mobile/${viewport.width}-${phase}.png`, revision);
      }
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference',
    recordVideo: { dir: `${output}/recording`, size: { width: 1440, height: 900 } } });
  const page = await context.newPage(), video = page.video();
  await enter(page, 'http://127.0.0.1:4173');
  const recordings = [];
  for (const [view, start, direction] of [['posterior', 0, 1], ['lateral', .93, 1], ['oblique', .93, 1], ['posterior', 1, -1]]) {
    await page.getByTestId(`rinkaku-${view}`).click(); await settle(page);
    await scrub(page, start);
    await page.getByTestId(direction === 1 ? 'rinkaku-play' : 'rinkaku-reverse').click();
    const started = Date.now(), samples = [];
    do {
      const s = await scene(page);
      samples.push({ elapsedMs: Date.now() - started, t: s.rinkaku.t, phase: s.rinkaku.snapshot.phase, playing: s.rinkaku.playing,
        playback: s.rinkaku.playback, positionHash: s.rinkaku.adapter.positionHash, camera: s.camera });
      if (!s.rinkaku.playing && Math.abs(s.rinkaku.t - (direction === 1 ? 1 : 0)) < 1e-6) break;
      if (Date.now() - started > 35000) throw new Error('Playback exceeded 35 s');
      await page.waitForTimeout(200);
    } while (true);
    recordings.push({ view, start, direction, elapsedMs: Date.now() - started, samples });
  }
  await context.close();
  await fs.rename(await video.path(), `${output}/playback-and-reverse.webm`);
  await fs.rmdir(`${output}/recording`);
  const result = { createdAt: new Date().toISOString(), browser: browser.version(), captures, recordings,
    video: { file: 'playback-and-reverse.webm', sha256: sha(await fs.readFile(`${output}/playback-and-reverse.webm`)) },
    runtime: { errors: runtime.errors, warnings: [...new Set(runtime.warnings)] },
    note: 'Mobile before/after intentionally changes camera and stage layout. t, configuration, opacity and viewport match. Actual production UI and real playback; no synthetic frames.' };
  await fs.writeFile(`${output}/comparison-captures.json`, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ captures: captures.length, recordings: recordings.map(({ view, start, direction, elapsedMs }) => ({ view, start, direction, elapsedMs })), runtime: result.runtime }, null, 2));
  if (runtime.errors.length) process.exitCode = 1;
} finally { await browser.close(); }
