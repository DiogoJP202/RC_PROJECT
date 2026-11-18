import { mkdir, writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { chooseStructure, openBodyTool } from './body-tools';
import { evidenceRoot } from './evidence-path';

const capture = `${evidenceRoot}/ui-r2`;

async function snapshot(page: Page) {
  return page.evaluate(() => (window as unknown as { __ATLAS_SCENE__: { snapshot: () => {
    camera: { position: number[]; target: number[]; moving: boolean };
    bounds: { heightFraction: number };
    assets: { activeId: string; cache: { loads: number; refCount: number; acquired: number; released: number } };
    scanT: number; paused: boolean; selectedId: string;
  } } }).__ATLAS_SCENE__.snapshot());
}

test('Body stage dominates desktop and panels preserve the real canvas, camera and GLB lease', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const catalogRequests: string[] = [];
  page.on('request', (request) => { if (request.url().endsWith('/catalog.json')) catalogRequests.push(request.url()); });
  await page.goto('/atlas');
  await expect(page.getByTestId('scene-status')).toHaveText('3D conectado');
  await expect(page.getByRole('heading', { name: /Espécime 001/ })).toBeVisible();
  await expect(page.getByTestId('body-panel')).toHaveCount(0);
  await expect(page.getByTestId('scan-toggle')).toHaveCount(0);
  const stageElement = page.getByTestId('stage');
  const stage = await stageElement.boundingBox();
  expect(stage!.width).toBeGreaterThanOrEqual(936);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);
  const baseline = await snapshot(page);
  expect(baseline.bounds.heightFraction).toBeGreaterThanOrEqual(0.6);
  expect(baseline.bounds.heightFraction).toBeLessThanOrEqual(0.75);
  await mkdir(capture, { recursive: true });
  await page.screenshot({ path: `${capture}/UI-R2-desktop.png` });
  await chooseStructure(page, 'ghoul.kakuhou.rinkaku');
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'ghoul.kakuhou.rinkaku');
  await page.getByRole('tab', { name: /Evidências/ }).click();
  await expect(page.getByTestId('inspector').getByRole('link').first()).toHaveAttribute('href', /^https:\/\//);
  await page.screenshot({ path: `${capture}/UI-R2-ficha-desktop.png` });

  await page.goto('/atlas?assets=lab');
  await expect(page.getByTestId('scene-status')).toHaveText('3D conectado');
  await page.getByTestId('asset-select').selectOption('fixture.rigged.v1');
  await expect.poll(async () => (await snapshot(page)).assets.activeId).toBe('fixture.rigged.v1');
  await expect.poll(async () => (await snapshot(page)).camera.moving).toBe(false);
  const before = await snapshot(page);
  const box = await stageElement.boundingBox();
  const canvas = await stageElement.locator('canvas').elementHandle();
  for (const tool of ['structures', 'layers', 'inspect', 'scan'] as const) {
    await openBodyTool(page, tool);
    const panel = page.getByTestId('body-panel');
    await expect(panel).toBeVisible();
    const panelBounds = await panel.boundingBox();
    expect(panelBounds!.y + panelBounds!.height).toBeLessThanOrEqual(box!.y + box!.height);
    expect(await stageElement.boundingBox()).toEqual(box);
    expect(await stageElement.locator('canvas').evaluate((element, previous) => element === previous, canvas)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('body-panel')).toHaveCount(0);
    expect((await snapshot(page)).camera).toEqual(before.camera);
  }
  expect((await snapshot(page)).assets).toEqual(before.assets);
  expect(catalogRequests).toHaveLength(2);
  await writeFile(`${capture}/UI-R2-layout.json`, JSON.stringify({ viewport: page.viewportSize(), stage, view: baseline.bounds, stageWithLab: box, stablePanels: 4 }, null, 2));
});

test('scan rests without a dock and closing the tool pauses without resetting the sample', async ({ page }) => {
  await page.goto('/atlas');
  await expect(page.getByTestId('scene-status')).toHaveText('3D conectado');
  const initial = await snapshot(page);
  expect(initial.paused).toBe(true);
  await expect(page.getByTestId('scan-toggle')).toHaveCount(0);
  await openBodyTool(page, 'scan');
  await page.getByRole('slider', { name: 'Progresso da inspeção' }).fill('0.42');
  await expect.poll(async () => (await snapshot(page)).scanT).toBeCloseTo(0.42, 3);
  await page.getByTestId('scan-toggle').click();
  await expect.poll(async () => (await snapshot(page)).scanT).toBeGreaterThan(0.42);
  await page.getByTestId('body-panel-close').click();
  await expect.poll(async () => (await snapshot(page)).paused).toBe(true);
  const paused = (await snapshot(page)).scanT;
  await openBodyTool(page, 'scan');
  await expect(page.getByTestId('scan-toggle')).toHaveAttribute('aria-pressed', 'false');
  expect((await snapshot(page)).scanT).toBe(paused);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`Body tools are a modal sheet on ${viewport.width}px without resizing the stage`, async ({ browser }) => {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    try {
      await page.goto('/atlas');
      await expect(page.getByTestId('scene-status')).toHaveText('3D conectado');
      const stage = await page.getByTestId('stage').boundingBox();
      expect(stage!.height / viewport.height).toBeGreaterThanOrEqual(0.55);
      expect(stage!.height / viewport.height).toBeLessThanOrEqual(0.65);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
      await expect(page.getByText('PROXY / CONCEPTUAL MODEL', { exact: true })).toBeInViewport();
      await mkdir(capture, { recursive: true });
      await page.screenshot({ path: `${capture}/UI-R2-mobile-${viewport.width}.png` });
      await page.getByTestId('body-structures').tap();
      const sheet = page.locator('dialog:modal');
      await expect(sheet).toBeVisible();
      await expect(page.getByTestId('body-panel-close')).toBeFocused();
      const structure = page.getByTestId('structure-ghoul.kakuhou.rinkaku');
      expect((await structure.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await structure.tap();
      await expect(sheet).toHaveCount(0);
      await expect(page.getByTestId('body-structures')).toBeFocused();
      expect((await snapshot(page)).selectedId).toBe('ghoul.kakuhou.rinkaku');
      await page.getByTestId('inspector-toggle').tap();
      await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'ghoul.kakuhou.rinkaku');
      await page.getByRole('tab', { name: /Evidências/ }).tap();
      await expect(page.getByTestId('inspector').getByRole('link').first()).toHaveAttribute('href', /^https:\/\//);
      await page.screenshot({ path: `${capture}/UI-R2-ficha-${viewport.width}.png` });
      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCount(0);
      await expect(page.getByTestId('inspector-toggle')).toBeFocused();
      expect((await page.getByTestId('stage').boundingBox())!.height).toBe(stage!.height);
    } finally { await page.close(); }
  });
}
