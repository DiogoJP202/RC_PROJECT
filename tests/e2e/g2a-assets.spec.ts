import { expect, test, type Page } from '@playwright/test';

type Point = number[];
interface Camera { position: Point; target: Point }
interface AssetSnapshot {
  requestedId: string;
  activeId: string;
  status: string;
  bindings: { anatomyId: string; nodeNames: string[]; meshCount: number }[];
  nodes: { name: string; type: string; anatomyId: string; worldPosition: Point; visible: boolean }[];
  bounds: { min: Point; max: Point };
  sockets: { id: string; nodeName: string; worldPosition: Point }[];
  animations: { name: string; duration: number }[];
  animation: { clip: string; time: number; playing: boolean };
  bones: { name: string; worldPosition: Point }[];
  cache: { loads: number; hits: number; disposed: number; acquired: number; released: number; entries: number; inFlight: number; refCount: number };
}
interface Snapshot {
  selectedId: string;
  lastHit: string | null;
  layers: Record<string, boolean>;
  surfaceOpacity: number;
  camera: Camera;
  reducedMotion: boolean;
  nodes: { name: string; anatomyId: string; visible: boolean }[];
  assets: AssetSnapshot;
}
interface SceneApi {
  snapshot(): Snapshot;
  project(id: string): { x: number; y: number; z: number };
  raycast(x: number, y: number): string | null;
}
const staticId = 'fixture.static.v1';
const riggedId = 'fixture.rigged.v1';
const staticPath = '**/assets/fixtures/atlas-static-v1.glb';
const anatomyIds = ['human.head', 'human.thorax', 'ghoul.kakuhou.rinkaku'];
const api = (page: Page): Promise<Snapshot> => page.evaluate(() => (
  window as unknown as { __ATLAS_SCENE__: SceneApi }
).__ATLAS_SCENE__.snapshot());
const distance = (a: Point, b: Point) => Math.hypot(...a.map((n, i) => n - b[i]));
const cameraDistance = (a: Camera, b: Camera) => distance(a.position, b.position) + distance(a.target, b.target);

async function openLab(page: Page) {
  await page.goto('/?assets=lab');
  await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByTestId('asset-select')).toBeVisible();
  await page.waitForFunction(() => Boolean((window as unknown as { __ATLAS_SCENE__?: SceneApi }).__ATLAS_SCENE__?.snapshot().assets));
}

async function chooseAsset(page: Page, id: string) {
  await page.getByTestId('asset-select').selectOption(id);
  await expect.poll(async () => (await api(page)).assets.activeId).toBe(id);
  await expect.poll(async () => (await api(page)).assets.status).toBe(id === 'proxy' ? 'proxy' : 'ready');
}

async function select(page: Page, id: string) {
  await page.getByTestId(`structure-${id}`).click();
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', id);
}

test('disk GLB loads asynchronously and replaces only its three stable anatomical bindings', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route(staticPath, async (route) => { await held; await route.continue(); });
  await openLab(page);
  const requested = page.waitForRequest(staticPath);
  const response = page.waitForResponse(staticPath);
  await page.getByTestId('asset-select').selectOption(staticId);
  await requested;
  try {
    await expect.poll(async () => (await api(page)).assets.status).toBe('loading');
    expect((await api(page)).assets.activeId).toBe('proxy');
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByTestId('scene-fallback')).toHaveCount(0);
  } finally { release?.(); }
  const loaded = await response;
  expect(loaded.status()).toBe(200);
  const body = await loaded.body();
  expect(body.readUInt32LE(0)).toBe(0x46546c67);
  expect(body.readUInt32LE(4)).toBe(2);
  expect(body.readUInt32LE(8)).toBe(body.length);
  await expect.poll(async () => (await api(page)).assets.activeId).toBe(staticId);
  const scene = await api(page);
  const snapshot = scene.assets;
  expect(snapshot.status).toBe('ready');
  expect(snapshot.bindings.map((binding) => binding.anatomyId).sort()).toEqual([...anatomyIds].sort());
  for (const binding of snapshot.bindings) {
    expect(binding.nodeNames.length).toBeGreaterThan(0);
    expect(binding.meshCount).toBeGreaterThan(0);
    expect(snapshot.nodes.some((node) => node.anatomyId === binding.anatomyId && node.type.includes('Mesh'))).toBe(true);
  }
  for (const id of ['human.surface', 'human.muscular', 'human.skeletal']) {
    expect(scene.nodes.some((node) => node.anatomyId === id)).toBe(true);
  }
  expect(snapshot.bounds.min.every(Number.isFinite)).toBe(true);
  expect(snapshot.bounds.max.every(Number.isFinite)).toBe(true);
  // Bounds are the three fixture pieces, not an asserted human body height.
  expect(snapshot.bounds.min[1]).toBeCloseTo(0.901, 2);
  expect(snapshot.bounds.max[1]).toBeCloseTo(1.85, 2);
  expect(snapshot.sockets.length).toBeGreaterThan(0);
  for (const socket of snapshot.sockets) {
    expect(socket.nodeName).toBeTruthy();
    expect(socket.worldPosition).toHaveLength(3);
    expect(socket.worldPosition.every(Number.isFinite)).toBe(true);
  }
  await expect(page.getByText('PROXY / CONCEPTUAL MODEL', { exact: true }).first()).toBeVisible();
});

test('a loaded mesh receives real pointer hits and keeps anatomical evidence identity', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLab(page);
  await chooseAsset(page, staticId);
  await page.getByTestId('camera-reset').click();
  const point = await page.evaluate(() => (window as unknown as { __ATLAS_SCENE__: SceneApi }).__ATLAS_SCENE__.project('human.head'));
  expect(point.z).toBeLessThan(1);
  expect(await page.evaluate(({ x, y }) => (window as unknown as { __ATLAS_SCENE__: SceneApi }).__ATLAS_SCENE__.raycast(x, y), point)).toBe('human.head');
  const canvas = await page.locator('canvas').boundingBox();
  expect(canvas).not.toBeNull();
  await page.mouse.click(canvas!.x + (point.x + 1) * canvas!.width / 2, canvas!.y + (1 - point.y) * canvas!.height / 2);
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'human.head');
  expect((await api(page)).lastHit).toBe('human.head');
  await select(page, 'ghoul.kakuhou.rinkaku');
  await page.getByRole('tab', { name: /Evidências/ }).click();
  await expect(page.getByTestId('inspector').getByRole('link').first()).toHaveAttribute('href', /^https:\/\//);
  await expect(page.getByTestId('inspector')).toContainText(/hip[oó]tese|reconstru[cç][aã]o|conceitual/i);
});

test('asset replacement preserves selection, layers, isolation, opacity and camera context', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLab(page);
  await chooseAsset(page, staticId);
  await page.getByTestId('layer-muscular').click();
  await page.getByTestId('layer-skeletal').click();
  await select(page, 'human.thorax');
  await page.getByRole('slider', { name: 'Opacidade da superfície', exact: true }).fill('0.27');
  const beforeIsolation = await api(page);
  await page.getByTestId('isolate-selection').click();
  await expect(page.getByTestId('isolate-selection')).toHaveAttribute('aria-pressed', 'true');
  const isolated = await api(page);
  await chooseAsset(page, riggedId);
  const replaced = await api(page);
  expect(replaced.selectedId).toBe(isolated.selectedId);
  expect(replaced.layers).toEqual(isolated.layers);
  expect(replaced.surfaceOpacity).toBeCloseTo(isolated.surfaceOpacity, 3);
  expect(cameraDistance(replaced.camera, isolated.camera)).toBeLessThan(0.0001);
  expect([...new Set(replaced.assets.nodes.filter((node) => node.visible).map((node) => node.anatomyId))]).toEqual(['human.thorax']);
  await expect(page.getByTestId('isolate-selection')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('isolate-selection').click();
  expect((await api(page)).layers).toEqual(beforeIsolation.layers);
  await chooseAsset(page, staticId);
  expect((await api(page)).selectedId).toBe('human.thorax');
  const focused = (await api(page)).camera;
  await page.getByTestId('camera-reset').click();
  await expect.poll(async () => cameraDistance((await api(page)).camera, focused)).toBeGreaterThan(0.1);
  expect((await api(page)).assets.activeId).toBe(staticId);
});

test('HTTP failure automatically shows available proxies and retry loads the real asset', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route(staticPath, (route) => route.fulfill({ status: 404, body: 'G2A controlled missing fixture' }));
  await openLab(page);
  await select(page, 'ghoul.kakuhou.rinkaku');
  const state = await api(page);
  const missing = page.waitForResponse(staticPath);
  await page.getByTestId('asset-select').selectOption(staticId);
  expect((await missing).status()).toBe(404);
  await expect.poll(async () => (await api(page)).assets.status).toBe('error');
  const failed = await api(page);
  expect(failed.assets.activeId).toBe('proxy');
  expect(failed.selectedId).toBe(state.selectedId);
  expect(failed.layers).toEqual(state.layers);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByTestId('scene-fallback')).toHaveCount(0);
  await expect(page.getByTestId('asset-retry')).toBeEnabled();
  await page.unroute(staticPath);
  const success = page.waitForResponse(staticPath);
  await page.getByTestId('asset-retry').click();
  expect((await success).status()).toBe(200);
  await expect.poll(async () => (await api(page)).assets.activeId).toBe(staticId);
  expect((await api(page)).selectedId).toBe(state.selectedId);
});

test('a slow superseded asset cannot overwrite the later model or anatomical selection', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route(staticPath, async (route) => { await held; await route.continue(); });
  await openLab(page);
  const requested = page.waitForRequest(staticPath);
  await page.getByTestId('asset-select').selectOption(staticId);
  await requested;
  try {
    await chooseAsset(page, riggedId);
    await select(page, 'human.thorax');
  } finally { release?.(); }
  await page.waitForTimeout(300);
  const snapshot = await api(page);
  expect(snapshot.assets.activeId).toBe(riggedId);
  expect(snapshot.assets.requestedId).toBe(riggedId);
  expect(snapshot.assets.status).toBe('ready');
  expect(snapshot.selectedId).toBe('human.thorax');
});

test('repeated GLB swaps release leases and dispose unused templates without retained cache entries', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLab(page);
  const before = (await api(page)).assets.cache;
  for (let cycle = 0; cycle < 3; cycle++) {
    await chooseAsset(page, staticId);
    await expect.poll(async () => (await api(page)).assets.cache.refCount).toBe(1);
    await chooseAsset(page, riggedId);
    await expect.poll(async () => (await api(page)).assets.cache.refCount).toBe(1);
    await chooseAsset(page, 'proxy');
    await expect.poll(async () => (await api(page)).assets.cache.entries).toBe(0);
    const released = (await api(page)).assets.cache;
    expect(released.refCount).toBe(0);
    expect(released.inFlight).toBe(0);
    expect(released.acquired).toBe(released.released);
  }
  const after = (await api(page)).assets.cache;
  expect(after.loads - before.loads).toBeGreaterThanOrEqual(6);
  expect(after.disposed - before.disposed).toBeGreaterThanOrEqual(6);
});

test('rigged GLB exposes skin and clip, moves a bone-attached socket and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLab(page);
  await chooseAsset(page, riggedId);
  const rig = (await api(page)).assets;
  expect(rig.nodes.some((node) => node.type === 'SkinnedMesh')).toBe(true);
  expect(rig.bones.length).toBeGreaterThanOrEqual(2);
  expect(rig.animations.length).toBeGreaterThan(0);
  expect(rig.animations[0].duration).toBeGreaterThan(0);
  await page.getByTestId('asset-animation-clip').selectOption(rig.animations[0].name);
  await page.getByTestId('asset-animation-time').fill('0');
  const rest = (await api(page)).assets;
  await page.getByTestId('asset-animation-time').fill('0.25');
  await expect.poll(async () => {
    const posed = (await api(page)).assets;
    return Math.max(...posed.sockets.map((socket, i) => distance(socket.worldPosition, rest.sockets[i].worldPosition)));
  }).toBeGreaterThan(0.001);
  await page.getByRole('checkbox', { name: 'Movimento reduzido', exact: true }).uncheck();
  await page.getByTestId('asset-animation-play').click();
  await expect.poll(async () => (await api(page)).assets.animation.playing).toBe(true);
  const playing = (await api(page)).assets.animation.time;
  await expect.poll(async () => (await api(page)).assets.animation.time).not.toBe(playing);
  await page.getByRole('checkbox', { name: 'Movimento reduzido', exact: true }).check();
  await expect.poll(async () => (await api(page)).assets.animation.playing).toBe(false);
  const paused = (await api(page)).assets;
  expect(Number(await page.getByTestId('asset-animation-time').inputValue())).toBeCloseTo(paused.animation.time / paused.animations[0].duration, 2);
  await page.waitForTimeout(250);
  const after = (await api(page)).assets;
  expect(after.animation.time).toBe(paused.animation.time);
  expect(after.bones).toEqual(paused.bones);
  expect(after.sockets).toEqual(paused.sockets);
});

test('G2A desktop capture preserves the observatory and labels the synthetic integration', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
  await expect(page.getByTestId('asset-select')).toHaveCount(0);
  await page.screenshot({ path: 'artifacts/gates/G2A-desktop-default.png' });
  await openLab(page);
  await page.screenshot({ path: 'artifacts/gates/G2A-desktop.png' });
  await chooseAsset(page, staticId);
  await page.getByTestId('camera-reset').click();
  await expect(page.getByTestId('asset-status')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/gates/G2A-synthetic-static.png' });
  await chooseAsset(page, riggedId);
  await page.getByTestId('asset-animation-clip').selectOption((await api(page)).assets.animations[0].name);
  await page.getByTestId('asset-animation-time').fill('0.25');
  await page.screenshot({ path: 'artifacts/gates/G2A-synthetic-rigged.png' });
  await select(page, 'ghoul.kakuhou.rinkaku');
  await page.getByTestId('isolate-selection').click();
  await page.screenshot({ path: 'artifacts/gates/G2A-rig-pose.png' });
});

test('mobile exploration remains touch accessible with GLB and produces a real capture', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await openLab(page);
    expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByTestId('stage').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'artifacts/gates/G2A-mobile.png' });
    await chooseAsset(page, staticId);
    const structure = page.getByTestId('structure-ghoul.kakuhou.rinkaku');
    const button = await structure.boundingBox();
    expect(button!.height).toBeGreaterThanOrEqual(44);
    await structure.tap();
    await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'ghoul.kakuhou.rinkaku');
    await expect(page.getByTestId('inspector')).toBeInViewport();
    await page.getByTestId('focus-selection').tap();
    await expect(page.getByTestId('stage')).toBeInViewport();
    expect((await api(page)).selectedId).toBe('ghoul.kakuhou.rinkaku');
    expect((await api(page)).assets.activeId).toBe(staticId);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'artifacts/gates/G2A-mobile-asset.png' });
  } finally { await context.close(); }
});

test('the mobile drawer supports touch, keyboard, native dismissal and explicit evidence reopening', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto('/');
    await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
    await expect(page.getByTestId('asset-select')).toHaveCount(0);
    const explore = page.getByTestId('mobile-explore');
    await expect(explore).toBeInViewport();
    const button = await explore.boundingBox();
    expect(button!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'artifacts/gates/G2A-mobile-default.png' });
    await explore.tap();
    const drawer = page.getByRole('dialog', { name: 'Escolha uma estrutura' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('heading', { name: 'Escolha uma estrutura' })).toBeVisible();
    await page.keyboard.press('Tab');
    expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.screenshot({ path: 'artifacts/gates/G2A-mobile-drawer.png' });
    await drawer.getByRole('button', { name: 'Fechar exploração', exact: true }).click();
    await expect(drawer).not.toBeVisible();
    await explore.tap();
    await page.getByTestId('mobile-structure-ghoul.kakuhou.rinkaku').tap();
    await expect(drawer).not.toBeVisible();
    await expect(page.getByTestId('stage')).toBeInViewport();
    expect((await api(page)).selectedId).toBe('ghoul.kakuhou.rinkaku');
    await expect(page.getByTestId('inspector')).toHaveAttribute('data-selected-id', 'ghoul.kakuhou.rinkaku');
    const selected = await api(page);
    await explore.tap();
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
    const dismissed = await api(page);
    expect(dismissed.selectedId).toBe(selected.selectedId);
    expect(dismissed.layers).toEqual(selected.layers);
    expect(cameraDistance(dismissed.camera, selected.camera)).toBeLessThan(0.0001);
    const inspectorToggle = page.getByTestId('inspector-toggle');
    await expect(inspectorToggle).toHaveAttribute('aria-expanded', 'true');
    await inspectorToggle.click();
    await expect(inspectorToggle).toHaveAttribute('aria-expanded', 'false');
    await explore.tap();
    await drawer.getByRole('button', { name: /Ler evidências da seleção/ }).tap();
    await expect(drawer).not.toBeVisible();
    await expect(inspectorToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('inspector')).toBeInViewport();
    await expect(page.getByTestId('inspector')).toContainText(/kakuhou/i);
    await expect(page.getByRole('tab', { name: /Evidências/ })).toHaveAttribute('aria-selected', 'true');
  } finally { await context.close(); }
});
