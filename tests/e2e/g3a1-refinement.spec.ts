import { changeRinkakuSelect, changeRinkakuView, closeStudyTool } from './study-tools';
import { chooseStructure, openBodyTool } from './body-tools';
import { evidenceRoot } from './evidence-path';
import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

interface Camera { position: number[]; target: number[]; moving: boolean }
interface NodeSnapshot { name: string; anatomyId: string; visible: boolean; worldPosition?: number[] }
interface AdapterSnapshot {
  disclosure: string; disposed: boolean; visible: boolean; t: number; appendageCount: number;
  positionHash: string; visibleAppendages: number; root: number[]; roots: number[][]; tips: number[][];
  geometryCount: number; materialCount: number; resourceIds: { geometry: string[]; material: string[] };
}
interface SceneSnapshot {
  selectedId: string; layers: Record<string, boolean>; surfaceOpacity: number; scanT: number;
  camera: Camera; nodes: NodeSnapshot[];
  bounds: { heightFraction: number; projected: { top: number; bottom: number; left: number; right: number } };
  rinkaku: {
    enabled: boolean; playing: boolean; direction: 1 | -1; t: number;
    config: { appendageCount: number; seed: number; particles: boolean; quality: string };
    snapshot: { phase: string; rootExposure: number; appendageExtension: number; visualStiffness: number; motionTime: number };
    adapter: AdapterSnapshot | null; connection: { source: string; matrix: number[] };
  };
  assets: { activeId: string; status: string; nodes: NodeSnapshot[]; sockets: { id: string; worldPosition: number[] }[]; cache: { entries: number; refCount: number } };
  metrics: { geometries: number; textures: number; calls: number } | null;
}
interface SceneApi { snapshot(): SceneSnapshot }

const REVIEW = `${evidenceRoot}/gates/G3A1-review`;
const RESULTS = `${evidenceRoot}/g3a1`;
const PHASES = [
  ['rest', .04], ['activation', .14], ['release', .275], ['growth', .53],
  ['fixation', .76], ['active', .9], ['retract', .98],
] as const;
const scene = (page: Page): Promise<SceneSnapshot> => page.evaluate(() => (
  window as unknown as { __ATLAS_SCENE__: SceneApi }
).__ATLAS_SCENE__.snapshot());
const distance = (a: number[], b: number[]) => Math.hypot(...a.map((value, index) => value - b[index]));
const cameraDistance = (a: Camera, b: Camera) => distance(a.position, b.position) + distance(a.target, b.target);
const lumbarNodes = (state: SceneSnapshot) => state.nodes.filter((node) => node.anatomyId === 'ghoul.kakuhou.rinkaku' && !node.name.startsWith('G3A'));

async function saveJson(file: string, value: unknown) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}
async function settle(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
async function open(page: Page, query = '') {
  await page.goto(`/atlas${query}`);
  await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => Boolean((window as unknown as { __ATLAS_SCENE__?: SceneApi }).__ATLAS_SCENE__));
}
async function enter(page: Page) {
  await page.getByTestId('rinkaku-toggle').click();
  await expect.poll(async () => Boolean((await scene(page)).rinkaku.adapter)).toBe(true);
  await expect.poll(async () => (await scene(page)).camera.moving).toBe(false);
  await settle(page);
}
async function scrub(page: Page, t: number) {
  await page.getByTestId('rinkaku-time').fill(String(t));
  await expect.poll(async () => (await scene(page)).rinkaku.adapter?.t).toBeCloseTo(t, 6);
  await settle(page);
  return scene(page);
}
async function view(page: Page, name: 'posterior' | 'lateral' | 'oblique' | 'focus') {
  await changeRinkakuView(page, `rinkaku-${name}`);
  await expect.poll(async () => (await scene(page)).camera.moving).toBe(false);
  await settle(page);
}
async function capture(page: Page, file: string, state: SceneSnapshot, full = false) {
  const path = `${REVIEW}/${file}`;
  await mkdir(dirname(path), { recursive: true });
  const rect = await page.getByTestId('stage').boundingBox();
  if (full) await page.screenshot({ path });
  else await page.getByTestId('stage').screenshot({ path });
  return { file: path, t: state.rinkaku.t, phase: state.rinkaku.snapshot.phase, config: state.rinkaku.config,
    camera: state.camera, bodyOpacity: state.surfaceOpacity, stageRect: rect, viewport: page.viewportSize(),
    adapter: state.rinkaku.adapter, connection: state.rinkaku.connection };
}

test('all seven deterministic phases support 1–4 appendages and preserve the same absolute pose after arbitrary scrubbing', async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await openBodyTool(page, 'layers');
  await page.getByRole('slider', { name: 'Opacidade da superfície', exact: true }).fill('1');
  await enter(page);
  const camera = (await scene(page)).camera;
  const samples = [], captures = [];
  for (const count of [1, 2, 3, 4]) {
    await changeRinkakuSelect(page, 'rinkaku-count', String(count));
    const phaseHashes = [];
    for (const [phase, t] of PHASES) {
      const state = await scrub(page, t);
      expect(state.rinkaku.snapshot.phase).toBe(phase);
      expect(state.rinkaku.adapter?.appendageCount).toBe(count);
      expect(state.rinkaku.adapter?.disposed).toBe(false);
      expect(state.rinkaku.adapter?.disclosure).toContain('PROXY / CONCEPTUAL MODEL');
      expect(cameraDistance(state.camera, camera)).toBeLessThan(.0001);
      if (phase === 'rest') expect(state.rinkaku.adapter?.visibleAppendages).toBe(0);
      if (phase === 'active') expect(state.rinkaku.adapter?.visibleAppendages).toBe(count);
      const actual = state.rinkaku.adapter!;
      expect([...actual.root, ...actual.roots.flat(), ...actual.tips.flat()].every(Number.isFinite)).toBe(true);
      phaseHashes.push(actual.positionHash);
      samples.push({ count, t, phase, adapter: actual, snapshot: state.rinkaku.snapshot });
      if (count === 4) captures.push(await capture(page, `phases/${phase}.png`, state, true));
    }
    // Distinct buffers are necessary evidence for geometric phase changes; the
    // separate visual review decides whether those changes are readable.
    expect(new Set(phaseHashes).size).toBe(PHASES.length);
    const first = await scrub(page, .7);
    for (const t of [.2, .83, .14, .98, .3]) await scrub(page, t);
    const repeated = await scrub(page, .7);
    expect(repeated.rinkaku.adapter?.positionHash).toBe(first.rinkaku.adapter?.positionHash);
    expect(repeated.rinkaku.adapter?.roots).toEqual(first.rinkaku.adapter?.roots);
    expect(repeated.rinkaku.adapter?.tips).toEqual(first.rinkaku.adapter?.tips);
    expect(repeated.rinkaku.adapter?.resourceIds).toEqual(first.rinkaku.adapter?.resourceIds);
    expect(repeated.rinkaku.snapshot).toEqual(first.rinkaku.snapshot);
  }
  await saveJson(`${RESULTS}/phases-and-counts.json`, { method: 'All 28 count/phase combinations through the actual UI, fixed camera, body opacity 1. Geometric hashes are diagnostics, not an artistic approval.', samples, captures });
});

test('lumbar implantation is captured at growth, active and retraction for every count in posterior, lateral and oblique views', async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await openBodyTool(page, 'layers');
  await page.getByRole('slider', { name: 'Opacidade da superfície', exact: true }).fill('1');
  await enter(page);
  const captures = [];
  for (const count of [1, 2, 3, 4]) {
    await changeRinkakuSelect(page, 'rinkaku-count', String(count));
    for (const name of ['posterior', 'lateral', 'oblique'] as const) {
      await view(page, name);
      const camera = (await scene(page)).camera;
      for (const [phase, t] of [['growth', .53], ['active', .9], ['retract', .98]] as const) {
        const state = await scrub(page, t);
        expect(cameraDistance(state.camera, camera)).toBeLessThan(.0001);
        expect(state.surfaceOpacity).toBe(1);
        expect(state.rinkaku.adapter?.roots.length).toBe(count);
        expect(state.rinkaku.adapter?.root).toEqual([state.rinkaku.connection.matrix[12], state.rinkaku.connection.matrix[13], state.rinkaku.connection.matrix[14]]);
        captures.push(await capture(page, `counts/${count}/${name}-${phase}.png`, state));
      }
    }
  }
  await view(page, 'focus');
  for (const t of [.14, .275, .53, .76, .9, .98]) captures.push(await capture(page, `roots/t${Math.round(t * 1000)}.png`, await scrub(page, t)));
  await saveJson(`${RESULTS}/implantation-views.json`, { method: 'Opaque body; explicit camera controls. These are real application screenshots. Roots and connection remain attached; pixel review must assess overlap and contact.', captures });
});

test('growth and retraction sequences, phase boundaries and timeline revisits keep a stable camera and preallocated resources', async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await openBodyTool(page, 'layers');
  await page.getByRole('slider', { name: 'Opacidade da superfície', exact: true }).fill('1');
  await enter(page);
  const initial = await scrub(page, .9);
  const captures = [], boundaries = [];
  for (const [group, times] of [
    ['growth', [.35, .4, .45, .5, .55, .6, .65, .7]],
    ['retraction', [.95, .96, .97, .98, .99, .995, 1]],
  ] as const) {
    for (const t of times) {
      const state = await scrub(page, t);
      expect(cameraDistance(state.camera, initial.camera)).toBeLessThan(.0001);
      expect(state.rinkaku.adapter?.resourceIds).toEqual(initial.rinkaku.adapter?.resourceIds);
      captures.push(await capture(page, `${group}/t${Math.round(t * 1000).toString().padStart(4, '0')}.png`, state));
    }
  }
  for (const boundary of [.08, .2, .35, .67, .85, .95]) {
    const before = await scrub(page, boundary - .001);
    const after = await scrub(page, boundary + .001);
    expect(before.rinkaku.snapshot.phase).not.toBe(after.rinkaku.snapshot.phase);
    expect(after.rinkaku.adapter?.resourceIds).toEqual(before.rinkaku.adapter?.resourceIds);
    expect(distance(before.rinkaku.adapter!.root, after.rinkaku.adapter!.root)).toBeLessThan(.000001);
    boundaries.push({ boundary, before: before.rinkaku, after: after.rinkaku });
  }
  const first = await scrub(page, .7);
  captures.push(await capture(page, 'revisit/t0700-before.png', first));
  for (const t of [.2, .7, .3, .7]) await scrub(page, t);
  const repeated = await scene(page);
  captures.push(await capture(page, 'revisit/t0700-after.png', repeated));
  expect(repeated.rinkaku.adapter?.positionHash).toBe(first.rinkaku.adapter?.positionHash);
  expect(repeated.rinkaku.snapshot).toEqual(first.rinkaku.snapshot);
  expect(cameraDistance(repeated.camera, first.camera)).toBeLessThan(.0001);
  await saveJson(`${RESULTS}/sequences-and-boundaries.json`, { captures, boundaries, note: 'Continuity at infinitesimal phase limits is covered by pure geometry/sampler units; these E2E samples exercise the actual rendered scene. Geometric equality is not an artistic assessment.' });
});

test('the existing kakuhou presentation is suppressed only during manifestation and restored for proxy and both GLB fixtures', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '?assets=lab');
  const samples = [];
  for (const asset of ['proxy', 'fixture.static.v1', 'fixture.rigged.v1']) {
    await page.getByTestId('asset-select').selectOption(asset);
    await expect.poll(async () => (await scene(page)).assets.activeId).toBe(asset);
    if (asset !== 'proxy') await expect.poll(async () => (await scene(page)).assets.status).toBe('ready');
    await settle(page);
    const before = await scene(page);
    const originals = lumbarNodes(before);
    expect(originals.some((node) => node.visible)).toBe(true);
    await enter(page);
    const active = await scrub(page, .9);
    expect(active.selectedId).toBe(before.selectedId);
    expect(active.layers).toEqual(before.layers);
    expect(lumbarNodes(active).map((node) => node.name)).toEqual(originals.map((node) => node.name));
    expect(lumbarNodes(active).every((node) => !node.visible)).toBe(true);
    if (asset !== 'proxy') {
      const socket = active.assets.sockets.find((node) => node.id === 'lumbar');
      expect(socket).toBeDefined();
      expect(active.rinkaku.connection.source).toBe('asset-socket');
      expect(distance(active.rinkaku.adapter!.root, socket!.worldPosition)).toBeLessThan(.001);
    }
    await page.getByTestId('rinkaku-toggle').click();
    await expect.poll(async () => (await scene(page)).rinkaku.adapter).toBeNull();
    const restored = await scene(page);
    expect(lumbarNodes(restored)).toEqual(originals);
    expect(restored.selectedId).toBe(before.selectedId);
    expect(restored.layers).toEqual(before.layers);
    samples.push({ asset, before: originals, during: lumbarNodes(active), restored: lumbarNodes(restored), connection: active.rinkaku.connection });
  }
  await page.getByTestId('asset-select').selectOption('proxy');
  await expect.poll(async () => (await scene(page)).assets.cache.refCount).toBe(0);
  await saveJson(`${RESULTS}/presentation-restoration.json`, { method: 'Existing anatomyId meshes observed before/during/after actual UI entry, retaining original bindings and authoritative lumbar socket.', samples });
});

test('selection, layers and preexisting isolation stay functional while the original observer presentation is restored', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await chooseStructure(page, 'ghoul.kakuhou.rinkaku');
  await page.getByTestId('isolate-selection').click();
  const isolated = await scene(page);
  await enter(page);
  const active = await scrub(page, .9);
  expect(active.selectedId).toBe(isolated.selectedId);
  expect(active.layers).toEqual(isolated.layers);
  expect(active.rinkaku.adapter?.visible).toBe(true);
  await page.getByTestId('rinkaku-toggle').click();
  await expect(page.getByTestId('inspector-toggle')).toBeVisible();
  await openBodyTool(page, 'inspect');
  await expect(page.getByTestId('isolate-selection')).toHaveAttribute('aria-pressed', 'true');
  expect((await scene(page)).layers).toEqual(isolated.layers);
  await enter(page);
  await scrub(page, .9);
  await openBodyTool(page, 'layers');
  await page.getByTestId('layer-internal').click();
  await expect.poll(async () => (await scene(page)).rinkaku.adapter?.visible).toBe(false);
  await openBodyTool(page, 'layers');
  await page.getByTestId('layer-internal').click();
  await expect.poll(async () => (await scene(page)).rinkaku.adapter?.visible).toBe(true);
  await chooseStructure(page, 'human.thorax');
  expect((await scene(page)).selectedId).toBe('human.thorax');
  await page.getByTestId('rinkaku-toggle').click();
  await openBodyTool(page, 'inspect');
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'human.thorax');
  expect(lumbarNodes(await scene(page)).some((node) => node.visible)).toBe(true);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`mobile ${viewport.width}×${viewport.height} keeps a stable usable view and captures real growth playback`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    try {
      await open(page);
      await openBodyTool(page, 'layers');
      await page.getByRole('slider', { name: 'Opacidade da superfície', exact: true }).fill('1');
      await page.getByTestId('body-panel-close').tap();
      await enter(page);
      const initial = await scrub(page, .53);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const id of ['rinkaku-toggle', 'rinkaku-reset', 'rinkaku-step-back', 'rinkaku-step-forward', 'rinkaku-posterior', 'rinkaku-lateral', 'rinkaku-oblique', 'rinkaku-focus']) {
        if (['rinkaku-posterior', 'rinkaku-lateral', 'rinkaku-oblique', 'rinkaku-focus'].includes(id)) await openBodyTool(page, 'simulation');
        const box = await page.getByTestId(id).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        await closeStudyTool(page);
      }
      await scrub(page, .9);
      expect(cameraDistance((await scene(page)).camera, initial.camera)).toBeLessThan(.0001);
      await page.getByTestId('stage').scrollIntoViewIfNeeded();
      await capture(page, `mobile/${viewport.width}-active.png`, await scene(page), true);
      await view(page, 'oblique');
      const oblique = (await scene(page)).camera;
      expect(cameraDistance(oblique, initial.camera)).toBeGreaterThan(.1);
      await scrub(page, .53);
      expect(cameraDistance((await scene(page)).camera, oblique)).toBeLessThan(.0001);
      await view(page, 'posterior');
      await page.getByTestId('stage').scrollIntoViewIfNeeded();
      const still = await capture(page, `mobile/${viewport.width}-growth.png`, await scene(page), true);
      await page.getByTestId('rinkaku-play').tap();
      await expect.poll(async () => (await scene(page)).rinkaku.t).toBeGreaterThan(.54);
      await page.getByTestId('stage').scrollIntoViewIfNeeded();
      const before = await scene(page);
      const playing = await capture(page, `mobile/${viewport.width}-playing.png`, before, true);
      const after = await scene(page);
      expect(before.rinkaku.playing).toBe(true);
      expect(before.rinkaku.snapshot.phase).toBe('growth');
      await page.getByTestId('rinkaku-play').tap();
      await page.getByTestId('rinkaku-time').scrollIntoViewIfNeeded();
      const controls = await capture(page, `mobile/${viewport.width}-controls.png`, await scene(page), true);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.getByTestId('rinkaku-play')).toBeDisabled();
      await scrub(page, .275);
      expect((await scene(page)).rinkaku.playing).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await saveJson(`${RESULTS}/mobile-${viewport.width}.json`, { viewport, still, playing, playbackCaptureTAfter: after.rinkaku.t, controls, projectedBodyHeightFraction: initial.bounds.heightFraction, note: 'Real running screenshot: t may advance during capture. Emulated mobile layout is not a physical phone FPS or ergonomic certification.' });
    } finally { await context.close(); }
  });
}
