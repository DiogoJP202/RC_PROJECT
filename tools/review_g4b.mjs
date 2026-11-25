/* global window, document */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const directory = process.env.ATLAS_G4B_REVIEW ?? 'artifacts/local/g4b/review';
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
const report = { browser: browser.version(), generatedAt: new Date().toISOString(), captures: [], video: null };
await mkdir(directory, { recursive: true });
const digest = async (file) => createHash('sha256').update(await readFile(directory + '/' + file)).digest('hex');
const persist = () => writeFile(directory + '/visual.json', JSON.stringify(report, null, 2) + '\n');
const ready = (page, mode = 'cell') => expect(page.getByTestId(mode + '-status')).toHaveText('Cena 3D pronta');
const direct = '/atlas/cell/rc%3A17%3A0';
const choose = (page, name) => page.getByRole('button', { name, exact: true });
const sizes = [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 430, height: 932 }];
async function screenshot(page, viewport, name) {
  await page.evaluate(() => document.fonts.ready);
  const installed = await page.evaluate(() => document.documentElement.scrollWidth);
  assert.equal(installed, viewport.width, name);
  const file = `G4B-${name}.png`;
  await page.screenshot({ path: directory + '/' + file, animations: 'disabled' });
  report.captures.push({ file, route: page.url().slice(base.length), viewport, sha256: await digest(file),
    model: await page.evaluate(() => window.__ATLAS_CELL__?.() ?? null) });
}
async function enterFromVascular(page) {
  await page.goto(base + '/atlas/vascular');
  await ready(page, 'micro');
  await page.getByTestId('micro-controls-toggle').click();
  await page.getByTestId('micro-entity').selectOption('rc:17:0');
  await page.getByTestId('micro-panel-close').click();
  await page.getByTestId('micro-time').fill('11.25');
  await page.getByTestId('micro-follow').click();
  await expect(page.getByTestId('micro-follow')).toHaveAttribute('aria-pressed', 'true');
}
async function cut(page) {
  await choose(page, 'Corte').click();
  await page.getByTestId('cell-cut-position').fill('0.12');
  await expect.poll(() => page.evaluate(() => window.__ATLAS_CELL__?.().surface.contourVertices)).toBeGreaterThan(0);
  await page.getByTestId('cell-panel-close').click();
}

try {
  for (const viewport of sizes) {
    const desktop = viewport.width === 1440;
    const label = desktop ? 'desktop' : 'mobile-' + viewport.width;
    const page = await browser.newPage({ viewport, isMobile: !desktop, hasTouch: !desktop, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    if (desktop) {
      await enterFromVascular(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await screenshot(page, viewport, 'vascular-before');
      await page.getByTestId('micro-inspect-cell').click();
    } else await page.goto(base + direct);
    await ready(page);
    await screenshot(page, viewport, label);
    if (desktop) {
      await page.getByLabel('Representação').selectOption('schematic');
      await screenshot(page, viewport, 'esquematico-desktop');
      await page.getByLabel('Representação').selectOption('interpretive');
      await choose(page, 'Vista').click();
      await choose(page, 'Lateral').click();
      await page.getByTestId('cell-panel-close').click();
      await screenshot(page, viewport, 'lateral-desktop');
      await page.keyboard.press('r');
    }
    await cut(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await screenshot(page, viewport, 'corte-' + label);
    await page.getByTestId('cell-compare').click();
    if (!desktop) await choose(page, 'Hemácia humana').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await screenshot(page, viewport, 'comparacao-' + label);
    await choose(page, 'Ficha').click();
    await page.getByRole('tab', { name: 'Evidências' }).click();
    await screenshot(page, viewport, 'ficha-' + label);
    await page.getByTestId('cell-panel-close').click();
    await page.getByTestId('cell-return').click();
    await ready(page, 'micro');
    if (desktop) await screenshot(page, viewport, 'vascular-return');
    await page.goto(base + direct + '?webgl=off');
    await expect(page.getByTestId('cell-fallback')).toBeVisible();
    await screenshot(page, viewport, 'fallback-' + label);
    assert.deepEqual(errors, []);
    await page.close();
    await persist();
  }

  const context = await browser.newContext({ viewport: sizes[0], recordVideo: { dir: directory, size: { width: 1280, height: 800 } } });
  const page = await context.newPage();
  const video = page.video();
  try {
    await enterFromVascular(page);
    await page.getByTestId('micro-play').click();
    await expect.poll(() => page.evaluate(() => window.__ATLAS_MICRO__?.snapshot().seconds)).toBeGreaterThan(13);
    await page.getByTestId('micro-inspect-cell').click();
    await ready(page);
    const canvas = (await page.getByTestId('cell-stage').locator('canvas').boundingBox());
    await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
    await page.mouse.down();
    await page.mouse.move(canvas.x + canvas.width / 2 + 95, canvas.y + canvas.height / 2 + 46, { steps: 21 });
    await page.mouse.up();
    await page.waitForTimeout(650);
    await choose(page, 'Corte').click();
    await page.getByTestId('cell-cut-position').fill('0.12');
    await page.waitForTimeout(850);
    await page.getByTestId('cell-panel-close').click();
    await page.getByTestId('cell-compare').click();
    await page.waitForTimeout(1100);
    await choose(page, 'Ficha').click();
    await page.getByRole('tab', { name: 'Evidências' }).click();
    await page.waitForTimeout(1100);
    await page.getByTestId('cell-panel-close').click();
    await page.getByTestId('cell-return').click();
    await ready(page, 'micro');
    await expect(page.getByTestId('micro-inspect-cell')).toBeFocused();
    await page.waitForTimeout(1100);
    await page.getByRole('button', { name: 'Retomar reprodução' }).click();
    await page.waitForTimeout(1450);
  } finally { await context.close(); }
  const file = 'G4B-percurso.webm';
  await video.saveAs(directory + '/' + file);
  const bytes = (await readFile(directory + '/' + file)).length;
  assert.ok(bytes > 30_000);
  report.video = { file, bytes, frameSize: { width: 1280, height: 800 }, sha256: await digest(file) };
  await persist();
  console.log(JSON.stringify({ captures: report.captures.length, video: report.video.file, bytes }));
} finally {
  await browser.close();
}
