// Checkpoint endpoint inspection through actual UI; no diagnostic mutation.
import { chromium } from '@playwright/test';
import { mkdir, writeFile, rename, rmdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const translucent = process.argv.includes('--translucent');
const revision = (process.argv.includes('--before') ? 'before' : 'after') + (translucent ? '-translucent' : '');
const output = `artifacts/gates/G3A1-review/checkpoint/${revision}`;
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const captures = [];
try {
  await page.goto('http://127.0.0.1:4173/');
  await page.getByTestId('scene-status').filter({ hasText: '3D conectado' }).waitFor();
  await page.getByRole('slider', { name: 'Opacidade da superfície', exact: true }).fill(translucent ? '0.2' : '1');
  await page.getByTestId('rinkaku-toggle').click();
  await page.waitForFunction(() => Boolean(window.__ATLAS_SCENE__?.snapshot().rinkaku.adapter));
  for (const view of ['focus', 'lateral']) {
    await page.getByTestId(`rinkaku-${view}`).click();
    await page.waitForFunction(() => !window.__ATLAS_SCENE__.snapshot().camera.moving);
    for (const t of [0, .995, .998, .999, 1]) {
      await page.getByTestId('rinkaku-time').fill(String(t));
      await page.waitForFunction(t => window.__ATLAS_SCENE__.snapshot().rinkaku.adapter.t === t, t);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const file = `${output}/${view}-t${t.toFixed(3)}.png`;
      const pixels = await page.getByTestId('stage').screenshot({ path: file });
      const state = await page.evaluate(() => window.__ATLAS_SCENE__.snapshot());
      captures.push({ file, t, view, camera: state.camera, config: state.rinkaku.config, bodyOpacity: state.surfaceOpacity,
        adapter: state.rinkaku.adapter, snapshot: state.rinkaku.snapshot, sha256: createHash('sha256').update(pixels).digest('hex') });
    }
  }
  let recording;
  if (!process.argv.includes('--before')) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
      reducedMotion: 'no-preference', recordVideo: { dir: `${output}/recording`, size: { width: 1440, height: 900 } } });
    const live = await context.newPage(), video = live.video(), sequences = [];
    await live.goto('http://127.0.0.1:4173/');
    await live.getByTestId('scene-status').filter({ hasText: '3D conectado' }).waitFor();
    await live.getByRole('slider', { name: 'Opacidade da superfície', exact: true }).fill(translucent ? '0.2' : '1');
    await live.getByTestId('rinkaku-toggle').click();
    await live.waitForFunction(() => Boolean(window.__ATLAS_SCENE__?.snapshot().rinkaku.adapter));
    for (const view of ['focus', 'lateral']) {
      await live.getByTestId(`rinkaku-${view}`).click();
      await live.waitForFunction(() => !window.__ATLAS_SCENE__.snapshot().camera.moving);
      await live.getByTestId('rinkaku-time').fill('0.98');
      await live.getByTestId('rinkaku-play').click();
      const started = Date.now(), samples = [];
      do {
        const state = await live.evaluate(() => window.__ATLAS_SCENE__.snapshot().rinkaku);
        samples.push({ elapsedMs: Date.now() - started, t: state.t, playing: state.playing, snapshot: state.snapshot,
          visible: state.adapter.visible, particleCount: state.adapter.particleCount });
        if (state.t === 1 && !state.playing) break;
        if (Date.now() - started > 10000) throw new Error('Terminal playback exceeded timeout');
        await live.waitForTimeout(20);
      } while (true);
      await live.waitForTimeout(700);
      sequences.push({ view, samples });
    }
    await context.close();
    const file = `${output}/retraction-final.webm`;
    await rename(await video.path(), file); await rmdir(`${output}/recording`);
    recording = { file, sha256: createHash('sha256').update(await readFile(file)).digest('hex'), sequences,
      method: 'Actual UI playback .98 to1, focus and lateral, plus a stationary endpoint hold. No time injection or synthetic frames.' };
  }
  await writeFile(`${output}/captures.json`, JSON.stringify({ revision, captures, recording }, null, 2) + '\n');
  console.log(JSON.stringify({ revision, captures: captures.length }));
} finally { await browser.close(); }
