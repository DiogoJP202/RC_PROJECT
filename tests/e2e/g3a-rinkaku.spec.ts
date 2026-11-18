import { chooseStructure, openBodyTool } from './body-tools';
import { evidenceRoot } from './evidence-path';
import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

interface Camera { position: number[]; target: number[]; moving: boolean }
interface AdapterSnapshot {
  representation: string;
  disclosure: string;
  disposed: boolean;
  visible: boolean;
  t: number;
  phase: string;
  appendageCount: number;
  geometryCount: number;
  materialCount: number;
  vertexCount: number;
  triangleCount: number;
  particleCapacity: number;
  particleCount: number;
  positionHash: string | number;
  root: number[];
  tips: number[][];
  resourceIds: { geometry: string[]; material: string[] };
}
interface RinkakuSnapshot {
  enabled: boolean;
  playing: boolean;
  direction: 1 | -1;
  t: number;
  config: { appendageCount: number; seed: number; particles: boolean; quality: string };
  snapshot: { t: number; phase: string; appendageExtension: number; rootExposure: number; particleEmission: number };
  representation: string;
  connection: { source: string; matrix: number[] };
  adapter: AdapterSnapshot | null;
}
interface SceneSnapshot {
  selectedId: string;
  layers: Record<string, boolean>;
  surfaceOpacity: number;
  paused: boolean;
  scanT: number;
  reducedMotion: boolean;
  camera: Camera;
  rinkaku: RinkakuSnapshot;
  assets: { activeId: string; status: string; sockets: { id: string; worldPosition: number[] }[]; cache: { entries: number; refCount: number; inFlight: number } };
  metrics: { geometries: number; textures: number; calls: number; renderer: string } | null;
}
interface SceneApi { snapshot(): SceneSnapshot }

const scene = (page: Page): Promise<SceneSnapshot> => page.evaluate(() => (
  window as unknown as { __ATLAS_SCENE__: SceneApi }
).__ATLAS_SCENE__.snapshot());
const distance = (a: number[], b: number[]) => Math.hypot(...a.map((value, i) => value - b[i]));
const cameraDistance = (a: Camera, b: Camera) => distance(a.position, b.position) + distance(a.target, b.target);

async function open(page: Page, query = '') {
  await page.goto(`/atlas${query}`);
  await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => Boolean((window as unknown as { __ATLAS_SCENE__?: SceneApi }).__ATLAS_SCENE__));
}

async function enter(page: Page) {
  await page.getByTestId('rinkaku-toggle').click();
  await expect.poll(async () => (await scene(page)).rinkaku.enabled).toBe(true);
  await expect.poll(async () => (await scene(page)).rinkaku.adapter !== null).toBe(true);
  await expect.poll(async () => (await scene(page)).camera.moving).toBe(false);
}

async function scrub(page: Page, t: number) {
  await page.getByTestId('rinkaku-time').fill(String(t));
  await expect.poll(async () => (await scene(page)).rinkaku.adapter?.t).toBeCloseTo(t, 5);
  return scene(page);
}

test('absolute manual timeline reproduces geometry, keeps resources and records the five phase captures', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await chooseStructure(page, 'ghoul.kakuhou.rinkaku');
  const before = await scene(page);
  await enter(page);
  const initial = await scene(page);
  expect(initial.selectedId).toBe(before.selectedId);
  expect(initial.layers).toEqual(before.layers);
  expect(initial.paused).toBe(true);
  expect(initial.rinkaku.config).toEqual({ appendageCount: 4, seed: 17, particles: true, quality: 'standard' });
  const first = await scrub(page, .7);
  await scrub(page, .2);
  await scrub(page, .3);
  const repeated = await scrub(page, .7);
  expect(repeated.rinkaku.snapshot).toEqual(first.rinkaku.snapshot);
  expect(repeated.rinkaku.adapter?.positionHash).toBe(first.rinkaku.adapter?.positionHash);
  expect(repeated.rinkaku.adapter?.tips).toEqual(first.rinkaku.adapter?.tips);
  expect(repeated.rinkaku.adapter?.root).toEqual(first.rinkaku.adapter?.root);
  expect(repeated.rinkaku.adapter?.resourceIds).toEqual(first.rinkaku.adapter?.resourceIds);
  expect(cameraDistance(repeated.camera, first.camera)).toBeLessThan(.0001);

  const captures = [];
  for (const [name, t, phase] of [
    ['rest', .04, 'rest'], ['activation', .14, 'activation'], ['growth', .53, 'growth'],
    ['active', .9, 'active'], ['retract', .98, 'retract'],
  ] as const) {
    const state = await scrub(page, t);
    expect(state.rinkaku.snapshot.phase).toBe(phase);
    expect(state.rinkaku.adapter?.disclosure).toContain('PROXY / CONCEPTUAL MODEL');
    expect(state.rinkaku.adapter?.disposed).toBe(false);
    await page.screenshot({ path: `${evidenceRoot}/gates/G3A1-regression-${name}.png` });
    captures.push({ file: `${evidenceRoot}/gates/G3A1-regression-${name}.png`, t, phase, config: state.rinkaku.config, camera: state.camera, adapter: state.rinkaku.adapter });
  }
  const sequence = [];
  await mkdir(`${evidenceRoot}/gates/G3A1-review/compat-sequence`, { recursive: true });
  for (const t of [.35, .4, .45, .5, .55, .6, .65, .7]) {
    const state = await scrub(page, t);
    const file = `${evidenceRoot}/gates/G3A1-review/compat-sequence/growth-t${Math.round(t * 1000).toString().padStart(3, '0')}.png`;
    await page.getByTestId('stage').screenshot({ path: file });
    sequence.push({ file, t, phase: state.rinkaku.snapshot.phase, config: state.rinkaku.config, positionHash: state.rinkaku.adapter?.positionHash });
  }
  await page.getByTestId('rinkaku-reset').click();
  await expect.poll(async () => (await scene(page)).rinkaku.t).toBe(0);
  const reset = await scene(page);
  expect(reset.rinkaku.snapshot.appendageExtension).toBe(0);
  expect(reset.rinkaku.snapshot.rootExposure).toBe(0);
  expect(reset.rinkaku.config).toEqual(initial.rinkaku.config);
  expect(reset.rinkaku.adapter?.resourceIds).toEqual(initial.rinkaku.adapter?.resourceIds);
  await mkdir(`${evidenceRoot}/g3a1`, { recursive: true });
  await writeFile(`${evidenceRoot}/g3a1/compat-visual-captures.json`, `${JSON.stringify({ viewport: { width: 1440, height: 900 }, reducedMotion: true, captures, sequence }, null, 2)}\n`);
});

test('play, pause, reverse and rapid scrubbing use one timeline while selection and the scan remain stable', async ({ page }) => {
  await open(page);
  await chooseStructure(page, 'human.thorax');
  await enter(page);
  const atStart = await scrub(page, .5);
  await page.getByTestId('rinkaku-play').click();
  await expect.poll(async () => (await scene(page)).rinkaku.playing).toBe(true);
  await expect.poll(async () => (await scene(page)).rinkaku.t).toBeGreaterThan(.505);
  await page.getByTestId('rinkaku-play').click();
  const paused = await scene(page);
  expect(paused.rinkaku.playing).toBe(false);
  await page.waitForTimeout(150);
  expect((await scene(page)).rinkaku.t).toBe(paused.rinkaku.t);
  await page.getByTestId('rinkaku-reverse').click();
  await expect.poll(async () => (await scene(page)).rinkaku.direction).toBe(-1);
  await expect.poll(async () => (await scene(page)).rinkaku.t).toBeLessThan(paused.rinkaku.t - .005);
  await page.getByTestId('rinkaku-play').click();
  const reversePaused = await scene(page);
  await page.getByTestId('rinkaku-play').click();
  await expect.poll(async () => (await scene(page)).rinkaku.t).toBeLessThan(reversePaused.rinkaku.t - .005);
  expect((await scene(page)).rinkaku.direction).toBe(-1);
  for (const t of [.23, .82, .31, .69]) {
    await page.getByTestId('rinkaku-play').click();
    await scrub(page, t);
    expect((await scene(page)).rinkaku.playing).toBe(false);
  }
  await page.getByTestId('rinkaku-reset').click();
  await scrub(page, .995);
  await page.getByTestId('rinkaku-play').click();
  await expect.poll(async () => (await scene(page)).rinkaku.t).toBe(1);
  expect((await scene(page)).rinkaku.playing).toBe(false);
  await scrub(page, .005);
  await page.getByTestId('rinkaku-reverse').click();
  await expect.poll(async () => (await scene(page)).rinkaku.t).toBe(0);
  const end = await scene(page);
  expect(end.rinkaku.playing).toBe(false);
  expect(end.selectedId).toBe('human.thorax');
  expect(end.layers).toEqual(atStart.layers);
  expect(end.scanT).toBe(atStart.scanT);
  expect(cameraDistance(end.camera, atStart.camera)).toBeLessThan(.0001);
  await page.getByTestId('rinkaku-toggle').click();
  await openBodyTool(page, 'inspect');
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'human.thorax');
  await expect.poll(async () => (await scene(page)).rinkaku.adapter).toBeNull();
});

test('ten full manual cycles keep geometry identities and warmed renderer resources bounded', async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  await enter(page);
  // Prime all phase geometries/particles before establishing the resource baseline.
  await scrub(page, .9);
  await page.waitForTimeout(2200);
  const warmed = await scene(page);
  const samples = [];
  for (let cycle = 0; cycle < 10; cycle++) {
    for (const t of [0, .08, .2, .35, .53, .67, .85, .9, .95, .98, 1]) await scrub(page, t);
    const end = await scene(page);
    expect(end.rinkaku.snapshot.appendageExtension).toBe(0);
    expect(end.rinkaku.adapter?.positionHash).toBeDefined();
    expect(end.rinkaku.adapter?.resourceIds).toEqual(warmed.rinkaku.adapter?.resourceIds);
    await scrub(page, .9);
    const active = await scene(page);
    expect(active.rinkaku.adapter?.positionHash).toBe(warmed.rinkaku.adapter?.positionHash);
    expect(active.rinkaku.adapter?.geometryCount).toBe(warmed.rinkaku.adapter?.geometryCount);
    expect(active.rinkaku.adapter?.materialCount).toBe(warmed.rinkaku.adapter?.materialCount);
    expect(active.rinkaku.adapter?.vertexCount).toBe(warmed.rinkaku.adapter?.vertexCount);
    samples.push({ cycle: cycle + 1, adapter: active.rinkaku.adapter, metrics: active.metrics });
  }
  await page.waitForTimeout(2200);
  const final = await scene(page);
  expect(errors).toEqual([]);
  expect(final.metrics?.geometries).toBe(warmed.metrics?.geometries);
  expect(final.metrics?.textures).toBe(warmed.metrics?.textures);
  await page.getByTestId('rinkaku-toggle').click();
  await expect.poll(async () => (await scene(page)).rinkaku.adapter).toBeNull();
  await expect.poll(async () => (await scene(page)).metrics?.geometries).toBeLessThan(final.metrics!.geometries);
  const unmounted = await scene(page);
  for (let mount = 0; mount < 3; mount++) {
    await enter(page);
    await scrub(page, .9);
    await page.getByTestId('rinkaku-toggle').click();
    await expect.poll(async () => (await scene(page)).rinkaku.adapter).toBeNull();
    await page.waitForTimeout(2100);
    expect((await scene(page)).metrics?.geometries).toBe(unmounted.metrics?.geometries);
    expect((await scene(page)).metrics?.textures).toBe(unmounted.metrics?.textures);
  }
  await mkdir(`${evidenceRoot}/g3a1`, { recursive: true });
  await writeFile(`${evidenceRoot}/g3a1/compat-ten-cycles.json`, `${JSON.stringify({ method: 'Ten complete 0→1 timeline cycles, manually sampling every phase and all phase boundaries; active pose repeated between cycles. Three additional mount/unmount cycles check disposal. This is scrub validation, not ten wall-clock playback cycles.', warmed, samples, final, unmounted, errors, limitations: ['Renderer counters and resource identities do not measure VRAM or certify absence of all leaks.'] }, null, 2)}\n`);
});

test('ten complete automatic 21-second playback cycles retain stable resources without context loss', async ({ page }) => {
  // This intentionally takes approximately 210 real seconds: the actual UI/clock
  // runs every complete 21 s manifestation/retraction without timing shortcuts.
  test.setTimeout(260_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await open(page);
  await enter(page);
  await scrub(page, .9);
  await page.waitForTimeout(2200);
  const warmed = await scene(page);
  const cycles = [];
  for (let cycle = 1; cycle <= 10; cycle++) {
    await page.getByTestId('rinkaku-reset').click();
    const startedAt = Date.now();
    await page.getByTestId('rinkaku-play').click();
    await expect.poll(async () => {
      const state = await scene(page);
      return state.rinkaku.t === 1 && !state.rinkaku.playing;
    }, { timeout: 30_000, intervals: [500, 1000] }).toBe(true);
    const end = await scene(page);
    expect(end.rinkaku.snapshot.phase).toBe('retract');
    expect(end.rinkaku.snapshot.appendageExtension).toBe(0);
    expect(end.rinkaku.snapshot.rootExposure).toBe(0);
    expect(end.rinkaku.adapter?.resourceIds).toEqual(warmed.rinkaku.adapter?.resourceIds);
    expect(end.rinkaku.adapter?.geometryCount).toBe(warmed.rinkaku.adapter?.geometryCount);
    expect(end.rinkaku.adapter?.materialCount).toBe(warmed.rinkaku.adapter?.materialCount);
    expect(end.metrics?.geometries).toBe(warmed.metrics?.geometries);
    expect(end.metrics?.textures).toBe(warmed.metrics?.textures);
    expect(end.selectedId).toBe(warmed.selectedId);
    expect(end.layers).toEqual(warmed.layers);
    await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
    expect(errors).toEqual([]);
    const elapsedMs = Date.now() - startedAt;
    cycles.push({ cycle, elapsedMs, t: end.rinkaku.t, phase: end.rinkaku.snapshot.phase, adapter: end.rinkaku.adapter, metrics: end.metrics });
    console.log(`G3A automatic playback ${cycle}/10 complete in ${elapsedMs} ms; geometries=${end.metrics?.geometries}; textures=${end.metrics?.textures}`);
  }
  const final = await scene(page);
  await mkdir(`${evidenceRoot}/g3a1`, { recursive: true });
  await writeFile(`${evidenceRoot}/g3a1/compat-ten-playback-cycles.json`, `${JSON.stringify({ method: 'Ten real complete automatic 21-second timeline cycles through reset/play UI. No clock override, accelerated duration, scrub injection or synthetic advance API during playback.', warmed, cycles, final, errors, limitations: ['Resource identities and renderer geometry/texture counters are observable diagnostics, not a GPU VRAM measurement or universal proof of leak absence.'] }, null, 2)}\n`);
});

test('counts, particles and quality replace visual settings without detaching the root, and GLB sockets stay authoritative', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '?assets=lab');
  await enter(page);
  const proxy = await scrub(page, .7);
  for (const count of [1, 4, 2, 3, 4]) {
    await page.getByTestId('rinkaku-count').selectOption(String(count));
    await expect.poll(async () => (await scene(page)).rinkaku.adapter?.appendageCount).toBe(count);
    expect((await scene(page)).rinkaku.adapter?.root).toEqual(proxy.rinkaku.adapter?.root);
  }
  await page.getByTestId('rinkaku-particles').uncheck();
  await expect.poll(async () => (await scene(page)).rinkaku.adapter?.particleCount).toBe(0);
  expect((await scene(page)).rinkaku.snapshot.particleEmission).toBe(0);
  await page.getByTestId('rinkaku-particles').check();
  await page.getByTestId('rinkaku-quality').selectOption('low');
  await expect.poll(async () => (await scene(page)).rinkaku.config.quality).toBe('low');
  await expect.poll(async () => (await scene(page)).rinkaku.adapter?.particleCount).toBe(0);
  await page.getByTestId('rinkaku-quality').selectOption('standard');
  for (const asset of ['fixture.static.v1', 'fixture.rigged.v1', 'proxy']) {
    await page.getByTestId('asset-select').selectOption(asset);
    await expect.poll(async () => (await scene(page)).assets.activeId).toBe(asset);
    const changed = await scene(page);
    expect(changed.rinkaku.t).toBeCloseTo(.7, 6);
    expect(changed.selectedId).toBe(proxy.selectedId);
    expect(changed.layers).toEqual(proxy.layers);
    if (asset !== 'proxy') {
      await expect.poll(async () => (await scene(page)).rinkaku.connection.source).toBe('asset-socket');
      const socket = (await scene(page)).assets.sockets.find((item) => item.id === 'lumbar');
      expect(socket).toBeDefined();
      expect(distance((await scene(page)).rinkaku.adapter!.root, socket!.worldPosition)).toBeLessThan(.001);
    }
  }
  await expect.poll(async () => (await scene(page)).rinkaku.connection.source).toBe('proxy');
  await expect.poll(async () => (await scene(page)).assets.cache.refCount).toBe(0);
  expect((await scene(page)).assets.cache.entries).toBe(0);
});

test('posterior, lateral and lumbar focus are explicit and reduced motion keeps manual keyboard inspection', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await enter(page);
  await expect(page.getByTestId('rinkaku-play')).toBeDisabled();
  const posterior = (await scene(page)).camera;
  await page.getByTestId('rinkaku-lateral').click();
  await expect.poll(async () => cameraDistance((await scene(page)).camera, posterior)).toBeGreaterThan(.1);
  const lateral = (await scene(page)).camera;
  await page.getByTestId('rinkaku-focus').click();
  await expect.poll(async () => cameraDistance((await scene(page)).camera, lateral)).toBeGreaterThan(.1);
  await page.getByTestId('rinkaku-posterior').click();
  await expect.poll(async () => cameraDistance((await scene(page)).camera, posterior)).toBeLessThan(.001);
  for (const phase of ['rest', 'activation', 'release', 'growth', 'fixation', 'active', 'retract']) {
    await page.getByTestId('rinkaku-phase').selectOption(phase);
    await expect.poll(async () => (await scene(page)).rinkaku.snapshot.phase).toBe(phase);
  }
  await scrub(page, .5);
  await page.getByTestId('rinkaku-step-forward').click();
  await expect.poll(async () => (await scene(page)).rinkaku.t).toBeCloseTo(.52, 5);
  await page.getByTestId('rinkaku-step-back').click();
  await expect.poll(async () => (await scene(page)).rinkaku.t).toBeCloseTo(.5, 5);
  await page.getByTestId('rinkaku-time').focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await scene(page)).rinkaku.t).toBeGreaterThan(.5);
  const still = await scene(page);
  await page.waitForTimeout(150);
  expect((await scene(page)).rinkaku.adapter?.positionHash).toBe(still.rinkaku.adapter?.positionHash);
  expect((await scene(page)).rinkaku.playing).toBe(false);
});

test('without WebGL the manifestation offers truthful static timeline controls and the original inspection remains available', async ({ page }) => {
  await page.goto('/atlas?webgl=off');
  await expect(page.getByTestId('scene-fallback')).toBeVisible();
  await page.getByTestId('rinkaku-toggle').click();
  await expect(page.getByTestId('rinkaku-inspector')).toBeVisible();
  await expect(page.getByTestId('rinkaku-play')).toBeDisabled();
  await page.getByTestId('rinkaku-phase').selectOption('active');
  await expect(page.getByTestId('rinkaku-time')).toHaveValue('0.9');
  await page.getByTestId('rinkaku-time').fill('0.53');
  await expect(page.getByTestId('rinkaku-time')).toHaveValue('0.53');
  await page.locator('#workspace').focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('rinkaku-play')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('scene-fallback')).toContainText(/textual|esquema/i);
  await page.getByTestId('rinkaku-toggle').click();
  await chooseStructure(page, 'ghoul.kakuhou.rinkaku');
  await openBodyTool(page, 'inspect');
  await expect(page.getByTestId('inspector')).toContainText(/kakuhou/i);
});

test('loss of the real WebGL context pauses an active manifestation and keeps manual inspection available', async ({ page }) => {
  await open(page);
  await chooseStructure(page, 'ghoul.kakuhou.rinkaku');
  await enter(page);
  await scrub(page, .7);
  await page.getByTestId('rinkaku-play').click();
  await expect.poll(async () => (await scene(page)).rinkaku.playing).toBe(true);
  const lost = await page.locator('canvas').evaluate((element) => {
    const extension = (element as HTMLCanvasElement).getContext('webgl2')?.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.loseContext();
    return true;
  });
  expect(lost).toBe(true);
  await expect(page.getByTestId('scene-fallback')).toBeVisible();
  await expect(page.getByTestId('rinkaku-play')).toBeDisabled();
  await expect(page.getByTestId('rinkaku-play')).toHaveAttribute('aria-pressed', 'false');
  await page.getByTestId('rinkaku-time').fill('0.53');
  await expect(page.getByTestId('rinkaku-phase-label')).toHaveText('Crescimento');
  await page.getByTestId('rinkaku-toggle').click();
  await openBodyTool(page, 'inspect');
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'ghoul.kakuhou.rinkaku');
});

test('mobile touch controls stay usable and capture the actual procedural manifestation', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await open(page);
    await enter(page);
    await scrub(page, .9);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const id of ['rinkaku-toggle', 'rinkaku-reset', 'rinkaku-step-back', 'rinkaku-step-forward', 'rinkaku-posterior', 'rinkaku-lateral', 'rinkaku-focus']) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByTestId('stage').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${evidenceRoot}/gates/G3A1-regression-mobile.png` });
    await page.getByTestId('rinkaku-time').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${evidenceRoot}/gates/G3A1-regression-mobile-controls.png` });
    await page.getByTestId('rinkaku-reset').tap();
    await expect.poll(async () => (await scene(page)).rinkaku.t).toBe(0);
  } finally { await context.close(); }
});
