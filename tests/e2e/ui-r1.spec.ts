import { changeMicroSelect, changeRinkakuView } from './study-tools';
import { openBodyTool } from './body-tools';
import { expect, test, type Page } from '@playwright/test';

interface CameraSnapshot {
  position: number[];
  target: number[];
  quaternion: number[];
}

interface BodySnapshot {
  selectedId: string;
  layers: Record<string, boolean>;
  surfaceOpacity: number;
  frames: number;
  camera: CameraSnapshot & { moving: boolean };
  bodyContext: { entering: boolean; restoreRevision: number };
  rinkaku: {
    enabled: boolean;
    playing: boolean;
    t: number;
    adapter: { resourceIds: Record<string, unknown> } | null;
  };
}

interface MicroSnapshot {
  seconds: number;
  playing: boolean;
  selectedId: string | null;
  cameraMode: string;
  camera: CameraSnapshot;
  adapter: { positionHash: string; resourceIds: Record<string, unknown> };
  metrics: { frames: number };
}

function body(page: Page) {
  return page.evaluate(() => (window as unknown as {
    __ATLAS_SCENE__: { snapshot: () => BodySnapshot };
  }).__ATLAS_SCENE__.snapshot());
}

function micro(page: Page) {
  return page.evaluate(() => (window as unknown as {
    __ATLAS_MICRO__: { snapshot: () => MicroSnapshot };
  }).__ATLAS_MICRO__.snapshot());
}

function expectCamera(actual: CameraSnapshot, expected: CameraSnapshot) {
  for (const key of ['position', 'target', 'quaternion'] as const) {
    expect(Math.hypot(...actual[key].map((value, index) => value - expected[key][index])), key)
      .toBeLessThan(1e-7);
  }
}

test('cold vitrine renders real media without loading the atlas runtime', async ({ page }) => {
  const assetRequests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => assetRequests.push(new URL(request.url()).pathname));
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    const probe = { webglContextsRequested: 0 };
    Object.defineProperty(window, '__UI_R1_CANVAS_PROBE__', { value: probe });
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, attributes?: unknown) {
      if (/webgl/i.test(type)) probe.webglContextsRequested++;
      return Reflect.apply(original, this, [type, attributes]);
    } as typeof original;
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Atlas anatômico ghoul', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir observatório', exact: true })).toHaveAttribute('href', '/atlas');
  await expect(page.getByRole('link', { name: 'Ver estudos', exact: true })).toHaveAttribute('href', '/estudos');
  await expect(page.getByText('Modelo conceitual', { exact: true }).first()).toBeVisible();
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', '/assets/ui-r5/favicon.svg');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/assets\/ui-r5\/share\.jpg$/);
  const hero = page.locator('main picture img');
  await expect(hero).toBeVisible();
  await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as {
    __UI_R1_CANVAS_PROBE__: { webglContextsRequested: number };
  }).__UI_R1_CANVAS_PROBE__.webglContextsRequested)).toBe(0);
  expect(assetRequests.filter((path) => /catalog\.json|\.glb$|[/_.-](?:AtlasWorkspace|ObservatoryScene|VascularScene|VascularWorkspace|RinkakuScene|GLTFLoader|three|drei|fiber|simulation)(?:[/_.-]|$)/i.test(path)))
    .toEqual([]);
  expect(errors).toEqual([]);

  await page.getByRole('link', { name: 'Abrir observatório', exact: true }).click();
  await expect(page).toHaveURL(/\/atlas$/);
  await expect(page.getByTestId('scene-status')).toHaveText('Cena 3D pronta');
  expect(await page.evaluate(() => (window as unknown as {
    __UI_R1_CANVAS_PROBE__: { webglContextsRequested: number };
  }).__UI_R1_CANVAS_PROBE__.webglContextsRequested)).toBeGreaterThan(0);
});

test('study links navigate to the actual paused demonstration and browser Back returns to studies', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('link', { name: 'Ver estudos', exact: true }).click();
  await expect(page).toHaveURL(/\/estudos$/);
  await expect(page.getByRole('link', { name: 'Inspecionar o Corpo', exact: true })).toHaveAttribute('href', '/atlas');
  await expect(page.getByRole('link', { name: 'Explorar a circulação', exact: true })).toHaveAttribute('href', '/atlas/vascular');
  await expect(page.getByRole('link', { name: 'Comparar', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Inspecionar célula', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Abrir simulação Rinkaku', exact: true }).click();
  await expect(page).toHaveURL(/\/atlas\/rinkaku$/);
  await expect(page.getByTestId('rinkaku-time')).toHaveValue('0');
  await expect(page.getByTestId('scene-status')).toHaveText('Cena 3D pronta');
  expect((await body(page)).rinkaku).toMatchObject({ enabled: true, playing: false, t: 0 });
  await page.goBack();
  await expect(page).toHaveURL(/\/estudos$/);
  await expect(page.getByRole('link', { name: 'Abrir simulação Rinkaku', exact: true })).toBeVisible();
});

test('credits deep links focus the section without waiting for the bibliography', async ({ page }) => {
  let releaseCatalog!: () => void;
  const catalogBlocked = new Promise<void>((resolve) => { releaseCatalog = () => resolve(); });
  await page.route('**/catalog.json', async (route) => {
    await catalogBlocked;
    await route.continue();
  });
  const footerLink = page.getByRole('link', { name: 'Fontes e créditos', exact: true });
  const credits = page.getByRole('region', { name: 'Créditos e licenças', exact: true });
  const heading = credits.getByRole('heading', { name: 'Créditos e licenças', exact: true });
  try {
    await page.goto('/');
    await footerLink.click();
    await expect(page).toHaveURL(/\/fontes#creditos$/);
    await expect(credits).toBeFocused();
    await expect(heading).toBeInViewport();
  } finally {
    releaseCatalog();
  }
  await expect(page.getByRole('link', { name: /OpenStax/i }).first()).toBeVisible();
  await expect(heading).toBeInViewport();
  const historyLength = await page.evaluate(() => history.length);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(heading).not.toBeInViewport();
  await footerLink.evaluate((link: HTMLElement) => link.focus({ preventScroll: true }));
  await page.keyboard.press('Enter');
  await expect(credits).toBeFocused();
  await expect(heading).toBeInViewport();
  expect(await page.evaluate(() => history.length)).toBe(historyLength);

  await page.reload();
  await expect(page).toHaveURL(/\/fontes#creditos$/);
  await expect(credits).toBeFocused();
  await expect(heading).toBeInViewport();
});

test('legacy route preserves diagnostics and keeps unreleased modes honest', async ({ page, request }) => {
  for (const path of ['/catalog-unavailable.json', '/assets/models/body/missing.glb']) {
    const missing = await request.get(path);
    expect(missing.status()).toBe(404);
    expect(missing.headers()['content-type'] ?? '').not.toContain('text/html');
  }
  await page.goto('/?mode=body&select=ghoul.kakuhou.rinkaku&webgl=off');
  await expect.poll(() => new URL(page.url()).pathname).toBe('/atlas');
  const params = new URL(page.url()).searchParams;
  expect(params.get('select')).toBe('ghoul.kakuhou.rinkaku');
  expect(params.get('webgl')).toBe('off');
  await expect(page.getByTestId('scene-fallback')).toBeVisible();
  await openBodyTool(page, 'inspect');
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'ghoul.kakuhou.rinkaku');

  await page.goto('/?mode=compare');
  await expect.poll(() => new URL(page.url()).pathname).toBe('/atlas/comparar');
  await expect(page.getByRole('heading', { name: 'Comparação indisponível', exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByTestId('mode-return').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/atlas');

  await page.goto('/atlas/cell/' + encodeURIComponent('rc:17:0'));
  await expect(page.getByRole('heading', { name: 'Observatório celular', exact: true })).toBeVisible();
  await expect(page.getByTestId('cell-status')).toHaveText('Cena 3D pronta');
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByTestId('micro-stage')).toHaveCount(0);
  await page.getByTestId('cell-return').click();
  await expect(page).toHaveURL(/\/atlas\/vascular\?microSeed=17&microSelect=rc%3A17%3A0$/);
  await expect(page.getByTestId('micro-selection')).toContainText('rc:17:0');
  await page.goto('/atlas/cell/rbc%3A17%3A1');
  await expect(page.getByRole('heading', { name: 'Célula indisponível' })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('leaving Rinkaku for Fontes suspends the same canvas and restores the exact inspected state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/atlas?select=ghoul.kakuhou.rinkaku');
  await expect(page.getByTestId('scene-status')).toHaveText('Cena 3D pronta');
  await openBodyTool(page, 'layers');
  await page.getByTestId('layer-skeletal').click();
  await openBodyTool(page, 'layers');
  await page.getByRole('slider', { name: 'Opacidade da superfície', exact: true }).fill('0.24');
  await page.getByTestId('rinkaku-toggle').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/atlas/rinkaku');
  await page.getByTestId('rinkaku-time').fill('0.64');
  await expect.poll(async () => (await body(page)).rinkaku.t).toBeCloseTo(.64, 6);
  await changeRinkakuView(page, 'rinkaku-lateral');
  await expect.poll(async () => (await body(page)).camera.moving).toBe(false);

  const canvas = page.getByTestId('stage').locator('canvas');
  const originalCanvas = await canvas.elementHandle();
  const before = await body(page);
  await page.getByRole('link', { name: 'Fontes', exact: true }).click();
  await expect(page).toHaveURL(/\/fontes$/);
  await expect(page.getByRole('heading', { name: /fontes/i, level: 1 })).toBeVisible();
  await expect(canvas).toBeHidden();
  const suspended = await body(page);
  // A bounded wall-clock observation distinguishes an actually stopped render loop
  // from a visually hidden renderer that is still issuing work.
  await page.waitForTimeout(350);
  expect((await body(page)).frames).toBe(suspended.frames);
  expect((await body(page)).rinkaku.t).toBeCloseTo(.64, 6);

  await page.goBack();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/atlas/rinkaku');
  await expect(canvas).toBeVisible();
  await expect.poll(async () => (await body(page)).frames).toBeGreaterThan(suspended.frames);
  const returned = await body(page);
  expect(await canvas.evaluate((current, previous) => current === previous, originalCanvas)).toBe(true);
  expect(returned.selectedId).toBe(before.selectedId);
  expect(returned.layers).toEqual(before.layers);
  expect(returned.surfaceOpacity).toBe(before.surfaceOpacity);
  expect(returned.rinkaku).toMatchObject({ enabled: true, playing: false, t: .64 });
  expect(returned.rinkaku.adapter?.resourceIds).toEqual(before.rinkaku.adapter?.resourceIds);
  expectCamera(returned.camera, before.camera);
  await originalCanvas.dispose();
});

test('editorial navigation pauses a playing Micro session without changing identity, pose or renderer', async ({ page }) => {
  await page.goto('/atlas/vascular?microSeed=17');
  await expect(page.getByTestId('micro-status')).toHaveText('Cena 3D pronta');
  const canvas = page.getByTestId('micro-stage').locator('canvas');
  const originalCanvas = await canvas.elementHandle();
  await changeMicroSelect(page, 'micro-entity', 'rc:17:0');
  await page.getByTestId('micro-follow').click();
  await page.getByTestId('micro-time').fill('11');
  await expect.poll(async () => (await micro(page)).adapter.positionHash).toBeTruthy();
  await page.getByTestId('micro-play').click();
  await expect.poll(async () => (await micro(page)).seconds).toBeGreaterThan(11.01);

  await page.getByRole('link', { name: 'Estudos', exact: true }).click();
  await expect(page).toHaveURL(/\/estudos$/);
  await expect(canvas).toBeHidden();
  await expect.poll(async () => (await micro(page)).playing).toBe(false);
  const suspended = await micro(page);
  await page.waitForTimeout(350);
  const still = await micro(page);
  expect(still.metrics.frames).toBe(suspended.metrics.frames);
  expect(still.seconds).toBe(suspended.seconds);
  expectCamera(still.camera, suspended.camera);

  await page.goBack();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/atlas/vascular');
  await expect(canvas).toBeVisible();
  await expect.poll(async () => (await micro(page)).metrics.frames).toBeGreaterThan(suspended.metrics.frames);
  const returned = await micro(page);
  expect(await canvas.evaluate((current, previous) => current === previous, originalCanvas)).toBe(true);
  expect(returned).toMatchObject({ selectedId: 'rc:17:0', cameraMode: 'tracking', playing: false, seconds: suspended.seconds });
  expect(returned.adapter.resourceIds).toEqual(suspended.adapter.resourceIds);
  expect(returned.adapter.positionHash).toBe(suspended.adapter.positionHash);
  expectCamera(returned.camera, suspended.camera);
  await page.getByTestId('micro-return').click();
  await expect(page).toHaveURL(/\/atlas(?:\?|$)/);
  await expect(page.getByTestId('scene-status')).toHaveText('Cena 3D pronta');
  await originalCanvas.dispose();
});

test('Back during the initial vascular transition cancels the pending entry', async ({ page }) => {
  await page.goto('/atlas');
  await expect(page.getByTestId('scene-status')).toHaveText('Cena 3D pronta');
  const before = await body(page);
  const requestedPath = await page.getByTestId('micro-entry').evaluate((button: HTMLElement) => {
    button.click();
    const requested = location.pathname;
    history.back();
    return requested;
  });
  expect(requestedPath).toBe('/atlas/vascular');
  await expect(page).toHaveURL(/\/atlas$/);
  await expect.poll(async () => (await body(page)).bodyContext.restoreRevision).toBeGreaterThan(before.bodyContext.restoreRevision);
  await expect(page.getByTestId('micro-status')).toHaveCount(0);
  expect((await body(page)).bodyContext.entering).toBe(false);
  expectCamera((await body(page)).camera, before.camera);
});

test('mobile vitrine puts the title and CTA before the real media without horizontal overflow', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  try {
    const page = await context.newPage();
    await page.goto('/');
    const title = page.getByRole('heading', { name: 'Atlas anatômico ghoul', exact: true });
    const cta = page.getByRole('link', { name: 'Abrir observatório', exact: true });
    const hero = page.locator('main picture img');
    await expect(title).toBeVisible();
    await expect(cta).toBeInViewport();
    await expect(hero).toBeVisible();
    const [buttonBox, heroBox] = await Promise.all([cta.boundingBox(), hero.boundingBox()]);
    expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(heroBox!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.getByText('Menu', { exact: true }).click();
    await expect(page.getByRole('link', { name: 'Fontes', exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});
