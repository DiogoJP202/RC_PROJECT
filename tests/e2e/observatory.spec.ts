import { chooseStructure, openBodyTool } from './body-tools';
import { evidenceRoot } from './evidence-path';
import { expect, test, type Page } from '@playwright/test';

interface CameraSnapshot { position: number[]; target: number[] }
interface Snapshot {
  camera: CameraSnapshot;
  layers: Record<string, boolean>;
  visibleNodes: string[];
  surfaceOpacity: number;
  scanT: number;
  paused: boolean;
  reducedMotion: boolean;
  lastHit: unknown;
  bounds: { heightFraction: number };
}
interface AtlasScene {
  snapshot(): Snapshot;
  project(id: string): { x: number; y: number } | null;
  raycast(x: number, y: number): unknown;
}

const scene = (page: Page): Promise<Snapshot> => page.evaluate(() => (
  window as unknown as { __ATLAS_SCENE__: AtlasScene }
).__ATLAS_SCENE__.snapshot());

const cameraDistance = (a: CameraSnapshot, b: CameraSnapshot) => Math.hypot(
  ...a.position.map((n, i) => n - b.position[i]), ...a.target.map((n, i) => n - b.target[i]),
);

async function openObservatory(page: Page, query = '') {
  await page.goto(`/atlas${query}`);
  await expect(page.getByTestId('observatory')).toBeVisible();
  await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => Boolean((window as unknown as { __ATLAS_SCENE__?: AtlasScene }).__ATLAS_SCENE__));
}

async function select(page: Page, id: string) {
  await chooseStructure(page, id);
  await openBodyTool(page, 'inspect');
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', id);
}

async function setRange(page: Page, name: string, value: string) {
  await openBodyTool(page, name === 'Opacidade da superfície' ? 'layers' : 'scan');
  await page.getByRole('slider', { name, exact: true }).fill(value);
}

test('catalog loading is real and delays anatomy UI until data arrives', async ({ page }) => {
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => { release = resolve; });
  let catalogRequested = false;
  await page.route('**/*catalog*.json*', async (route) => {
    catalogRequested = true;
    await held;
    await route.continue();
  });
  await page.goto('/atlas');
  await expect.poll(() => catalogRequested).toBe(true);
  await expect(page.getByRole('heading', { name: 'Preparando o observatório' })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  release?.();
  await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
});

test('3D click raycasts an actual scene structure and synchronizes the inspector', async ({ page }) => {
  await openObservatory(page);
  await select(page, 'human.surface');
  const projected = await page.evaluate(() => (window as unknown as { __ATLAS_SCENE__: AtlasScene }).__ATLAS_SCENE__.project('human.head'));
  expect(projected).not.toBeNull();
  const canvas = await page.locator('canvas').boundingBox();
  expect(canvas).not.toBeNull();
  const x = canvas!.x + (projected!.x + 1) * canvas!.width / 2;
  const y = canvas!.y + (1 - projected!.y) * canvas!.height / 2;
  await page.mouse.click(x, y);
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'human.head');
  const actual = await scene(page);
  expect(actual.lastHit).toBeTruthy();
  await select(page, 'ghoul.kakuhou.rinkaku');
  await expect(page.getByTestId('inspector')).toContainText(/kakuhou/i);
  await expect(page.getByTestId('inspector')).toContainText(/hip[oó]tese|reconstru[cç][aã]o|conceitual/i);
  await page.getByRole('tab', { name: /Evidências/ }).click();
  await expect(page.getByTestId('inspector').getByRole('link').first()).toHaveAttribute('href', /^https:\/\//);
});

test('independent scene layers can be toggled and isolation restores the prior combination', async ({ page }) => {
  await openObservatory(page);
  await openBodyTool(page, 'layers');
  await page.getByTestId('layer-muscular').click();
  await openBodyTool(page, 'layers');
  await page.getByTestId('layer-skeletal').click();
  await expect(page.getByTestId('layer-muscular')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('layer-skeletal')).toHaveAttribute('aria-pressed', 'true');
  const before = await scene(page);
  await select(page, 'human.muscular');
  await openBodyTool(page, 'inspect');
  await page.getByTestId('isolate-selection').click();
  await openBodyTool(page, 'layers');
  await expect(page.getByTestId('layer-surface')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('layer-skeletal')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('layer-muscular')).toHaveAttribute('aria-pressed', 'true');
  const isolated = await scene(page);
  expect(isolated.visibleNodes).not.toEqual(before.visibleNodes);
  await openBodyTool(page, 'inspect');
  await page.getByTestId('isolate-selection').click();
  await openBodyTool(page, 'layers');
  await expect(page.getByTestId('layer-surface')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('layer-skeletal')).toHaveAttribute('aria-pressed', 'true');
  const restored = await scene(page);
  expect(restored.layers).toEqual(before.layers);
  expect(restored.visibleNodes).toEqual(before.visibleNodes);
});

test('mouse orbit and wheel zoom change the real camera', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openObservatory(page);
  const overview = await scene(page);
  const canvas = await page.locator('canvas').boundingBox();
  const x = canvas!.x + canvas!.width * 0.25;
  const y = canvas!.y + canvas!.height * 0.56;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 90, y + 35, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => cameraDistance((await scene(page)).camera, overview.camera)).toBeGreaterThan(0.01);
  const orbited = await scene(page);
  await page.mouse.wheel(0, -250);
  await expect.poll(async () => cameraDistance((await scene(page)).camera, orbited.camera)).toBeGreaterThan(0.01);
  await page.getByTestId('camera-reset').click();
  await expect.poll(async () => cameraDistance((await scene(page)).camera, overview.camera)).toBeLessThan(0.0001);
});

test('camera focus changes its actual pose and reset restores an overview', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openObservatory(page);
  const overview = await scene(page);
  await select(page, 'ghoul.kakuhou.rinkaku');
  await page.getByTestId('focus-selection').click();
  await expect.poll(async () => cameraDistance((await scene(page)).camera, overview.camera)).toBeGreaterThan(0.1);
  await page.getByTestId('camera-reset').click();
  await expect.poll(async () => cameraDistance((await scene(page)).camera, overview.camera)).toBeLessThan(0.0001);
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'ghoul.kakuhou.rinkaku');
});

test('opacity and scan controls affect the renderer; pausing and scrub are stable', async ({ page }) => {
  await openObservatory(page);
  await setRange(page, 'Opacidade da superfície', '0.31');
  await expect.poll(async () => (await scene(page)).surfaceOpacity).toBeCloseTo(0.31, 2);
  await setRange(page, 'Progresso da inspeção', '0.22');
  await expect.poll(async () => (await scene(page)).scanT).toBeCloseTo(0.22, 2);
  const paused = await scene(page);
  await page.waitForTimeout(300);
  expect((await scene(page)).scanT).toBe(paused.scanT);
  await page.getByTestId('scan-toggle').click();
  await expect.poll(async () => (await scene(page)).scanT).not.toBe(paused.scanT);
  await page.getByTestId('scan-toggle').click();
  await expect.poll(async () => (await scene(page)).paused).toBe(true);
  const pausedAgain = await scene(page);
  await page.waitForTimeout(300);
  expect((await scene(page)).scanT).toBe(pausedAgain.scanT);
  await page.getByTestId('scan-toggle').click();
  await expect.poll(async () => (await scene(page)).scanT).not.toBe(pausedAgain.scanT);
  await page.getByRole('checkbox', { name: 'Movimento reduzido', exact: true }).check();
  await expect.poll(async () => (await scene(page)).paused).toBe(true);
  const reduced = await scene(page);
  expect(reduced.reducedMotion).toBe(true);
  expect(Number(await page.getByRole('slider', { name: 'Progresso da inspeção', exact: true }).inputValue())).toBeCloseTo(reduced.scanT, 2);
  await page.waitForTimeout(300);
  expect((await scene(page)).scanT).toBe(reduced.scanT);
});

test('micro and future comparison preserve context and canon filter never hides the reconstruction disclosure', async ({ page }) => {
  await openObservatory(page);
  await select(page, 'ghoul.kakuhou.rinkaku');
  await openBodyTool(page, 'layers');
  await page.getByTestId('layer-skeletal').click();
  await setRange(page, 'Opacidade da superfície', '0.18');
  await setRange(page, 'Progresso da inspeção', '0.48');
  await expect.poll(async () => (await scene(page)).scanT).toBeCloseTo(0.48, 2);
  const context = await scene(page);
  for (const mode of ['micro', 'compare']) {
    if (mode === 'micro') await page.getByTestId('mode-micro').click();
    else {
      await page.getByTestId('body-panel-close').click();
      await page.keyboard.press('3');
    }
    if (mode === 'micro') {
      // G4A replaces the informational placeholder with an actual lazy scene;
      // the original Body-context invariant remains the purpose of this test.
      await expect(page.getByTestId('micro-status')).toHaveText('3D conectado');
      await page.getByTestId('micro-return').click();
    } else {
      await expect(page.getByText(/em desenvolvimento/i).first()).toBeVisible();
      await page.getByTestId('mode-return').click();
    }
    await openBodyTool(page, 'inspect');
    await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'ghoul.kakuhou.rinkaku');
    const returned = await scene(page);
    expect(returned.layers).toEqual(context.layers);
    expect(returned.surfaceOpacity).toBeCloseTo(context.surfaceOpacity, 3);
    expect(returned.scanT).toBeCloseTo(context.scanT, 3);
  }
  await page.locator('label').filter({ has: page.getByTestId('canon-filter') }).click();
  await expect(page.getByText('PROXY / CONCEPTUAL MODEL', { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId('inspector')).toContainText(/reconstru[cç][aã]o|conceitual/i);
  await expect(page.getByTestId('inspector')).not.toContainText(/OFICIAL VERIFICADO/i);
});

test('keyboard alternatives work, range keys stay local and reduced motion pauses scan', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openObservatory(page);
  const initial = await scene(page);
  expect(initial.reducedMotion).toBe(true);
  expect(initial.paused).toBe(true);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ir para o observatório' })).toBeFocused();
  await openBodyTool(page, 'structures');
  const button = page.getByTestId('structure-human.thorax');
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'human.thorax');
  await openBodyTool(page, 'layers');
  const slider = page.getByRole('slider', { name: 'Opacidade da superfície', exact: true });
  await slider.focus();
  const before = await slider.inputValue();
  await page.keyboard.press('ArrowRight');
  expect(await slider.inputValue()).not.toBe(before);
  await page.keyboard.press('Space');
  expect((await scene(page)).paused).toBe(true);
  await page.getByTestId('camera-reset').focus();
  await page.keyboard.press('Enter');
  await expect.poll(async () => cameraDistance((await scene(page)).camera, initial.camera)).toBeLessThan(0.0001);
  await openBodyTool(page, 'structures');
  await button.focus();
  await page.keyboard.press('Enter');
  await expect.poll(async () => cameraDistance((await scene(page)).camera, initial.camera)).toBeGreaterThan(0.1);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('body-panel')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect.poll(async () => cameraDistance((await scene(page)).camera, initial.camera)).toBeLessThan(0.0001);
});

for (const query of ['?webgl=off', '?asset=missing']) {
  test(`failure ${query} preserves content and selection without WebGL`, async ({ page }) => {
    const assetRequest = query === '?asset=missing' ? page.waitForRequest('**/assets/models/body/missing.glb') : null;
    await page.goto(`/atlas${query}`);
    if (assetRequest) expect((await assetRequest).method()).toBe('GET');
    await expect(page.getByTestId('scene-fallback')).toBeVisible();
    await select(page, 'ghoul.kakuhou.rinkaku');
    await expect(page.getByTestId('inspector')).toContainText(/kakuhou/i);
    await expect(page.getByText('PROXY / CONCEPTUAL MODEL', { exact: true }).first()).toBeVisible();
    await page.getByTestId('scene-retry').click();
    await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
  });
}

test('a lost real WebGL context opens an accessible fallback', async ({ page }) => {
  await openObservatory(page);
  const lossRequested = await page.locator('canvas').evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('webgl2');
    const extension = context?.getExtension('WEBGL_lose_context');
    extension?.loseContext();
    return Boolean(extension);
  });
  expect(lossRequested).toBe(true);
  await expect(page.getByTestId('scene-fallback')).toBeVisible();
  await select(page, 'human.thorax');
  await expect(page.getByTestId('inspector')).toContainText(/t[oó]rax|tor[aá]cic/i);
});

test('catalog errors have a visible recovery action', async ({ page }) => {
  await page.goto('/atlas?catalog=missing');
  await expect(page.getByTestId('catalog-error')).toBeVisible();
  const retry = page.getByTestId('catalog-error').getByRole('button');
  await expect(retry).toBeEnabled();
  await retry.click();
  await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
});

test('desktop and silhouette gate captures include the real rendered scene', async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openObservatory(page);
  const bounds = (await scene(page)).bounds;
  expect(bounds.heightFraction).toBeGreaterThanOrEqual(0.6);
  expect(bounds.heightFraction).toBeLessThanOrEqual(0.75);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await page.screenshot({ path: `${evidenceRoot}/gates/G1-desktop.png` });
  await setRange(page, 'Progresso da inspeção', '0.2');
  await expect.poll(async () => (await scene(page)).scanT).toBeCloseTo(0.2, 2);
  await page.screenshot({ path: `${evidenceRoot}/gates/G1-scan-20.png` });
  await setRange(page, 'Progresso da inspeção', '0.75');
  await expect.poll(async () => (await scene(page)).scanT).toBeCloseTo(0.75, 2);
  await page.screenshot({ path: `${evidenceRoot}/gates/G1-scan-75.png` });
  await select(page, 'ghoul.kakuhou.rinkaku');
  await expect.poll(async () => (await scene(page)).camera.position[2]).toBeLessThan(0);
  await page.screenshot({ path: `${evidenceRoot}/gates/G1-focus.png` });
  await page.goto('/atlas?silhouette=1');
  await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
  await page.screenshot({ path: `${evidenceRoot}/gates/G1-silhouette.png` });
});

test('touch-sized mobile remains usable without hover or horizontal overflow', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await openObservatory(page);
  expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
  const stage = await page.getByTestId('stage').boundingBox();
  expect(stage!.height).toBeGreaterThanOrEqual(440);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${evidenceRoot}/gates/G1-mobile.png` });
  await page.screenshot({ path: `${evidenceRoot}/gates/G1-mobile-full.png`, fullPage: true });
  const inspectorToggle = page.getByTestId('inspector-toggle');
  if (await inspectorToggle.getAttribute('aria-expanded') === 'true') await inspectorToggle.click();
  await expect(inspectorToggle).toHaveAttribute('aria-expanded', 'false');
  await select(page, 'ghoul.kakuhou.rinkaku');
  await expect(page.getByTestId('inspector')).toBeVisible();
  await expect(inspectorToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('inspector')).toBeInViewport();
  await expect(page.getByTestId('inspector')).toContainText(/kakuhou/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${evidenceRoot}/gates/G1-mobile-selection.png` });
  await context.close();
});
