import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

interface Camera { position: number[]; target: number[]; quaternion?: number[]; up?: number[]; projection?: Record<string, number>; moving?: boolean; enableDamping?: boolean }
interface BodySnapshot {
  selectedId: string; layers: Record<string, boolean>; surfaceOpacity: number; scanT: number;
  camera: Camera; metrics: { geometries: number; textures: number } | null;
  rinkaku: { enabled: boolean; playing: boolean; direction: number; t: number; config: Record<string, unknown> };
  assets: { activeId: string; status: string; sockets: unknown[]; bones: unknown[]; animation: { time: number; clip: string; playing: boolean }; cache: { refCount: number; loads: number } };
}
interface MicroSnapshot {
  seconds: number; playing: boolean; config: { count: number; seed: number }; speed: number;
  selectedId: string | null; selectedPresent: boolean; cameraMode: 'free' | 'flow' | 'tracking';
  highlightRC: boolean; reducedMotion: boolean; camera: Camera;
  particles: { id: string; kind: 'rbc' | 'rc'; index: number }[];
  adapter: { positionHash: string; seconds: number; counts: { total: number; rbc: number; rc: number };
    resourceIds: { geometry: string[]; material: string[] }; resources: Record<string, number>; disposed: boolean };
  lifecycle: { created: number; disposed: number; active: number };
  metrics: { geometries: number; textures: number; calls: number; triangles: number };
}
interface MicroApi {
  snapshot(): MicroSnapshot;
  project(id: string): { x: number; y: number; z: number } | null;
  raycast(x: number, y: number): string | null;
}
const micro = (page: Page): Promise<MicroSnapshot> => page.evaluate(() => (window as unknown as { __ATLAS_MICRO__: MicroApi }).__ATLAS_MICRO__.snapshot());
const body = (page: Page): Promise<BodySnapshot> => page.evaluate(() => (window as unknown as { __ATLAS_SCENE__: { snapshot(): BodySnapshot } }).__ATLAS_SCENE__.snapshot());
const distance = (a: number[], b: number[]) => Math.hypot(...a.map((value, i) => value - b[i]));
async function open(page: Page) {
  await page.goto('/'); await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
  await page.waitForFunction(() => Boolean((window as unknown as { __ATLAS_SCENE__?: unknown }).__ATLAS_SCENE__));
}
async function enter(page: Page) {
  await page.getByTestId('micro-entry').click();
  await expect(page.getByTestId('micro-status')).toContainText('3D conectado');
  await page.waitForFunction(() => Boolean((window as unknown as { __ATLAS_MICRO__?: MicroApi }).__ATLAS_MICRO__?.snapshot().adapter));
}
async function scrub(page: Page, seconds: number) {
  await page.getByTestId('micro-time').fill(String(seconds));
  await expect.poll(async () => (await micro(page)).adapter.seconds).toBeCloseTo(seconds, 6);
  return micro(page);
}
async function save(name: string, value: unknown) {
  await mkdir('artifacts/g4a', { recursive: true });
  await writeFile(`artifacts/g4a/${name}.json`, `${JSON.stringify(value, null, 2)}\n`);
}
async function pick(page: Page, kind: 'rc' | 'rbc') {
  for (const seconds of [0, 3, 9, 15, 23, 31]) {
    await scrub(page, seconds);
    const hit = await page.evaluate((kind) => {
      const api = (window as unknown as { __ATLAS_MICRO__: MicroApi }).__ATLAS_MICRO__;
      for (const entity of api.snapshot().particles.filter((item) => item.kind === kind)) {
        const p = api.project(entity.id);
        if (p && p.z > -1 && p.z < 1 && Math.abs(p.x) < .85 && Math.abs(p.y) < .72 && api.raycast(p.x, p.y) === entity.id) return { ...p, id: entity.id };
      }
      return null;
    }, kind);
    if (!hit) continue;
    const box = await page.getByTestId('micro-stage').locator('canvas').boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + (hit.x + 1) * box!.width / 2, box!.y + (1 - hit.y) * box!.height / 2);
    await expect(page.getByTestId('micro-inspector')).toHaveAttribute('data-selected-id', hit.id);
    expect((await micro(page)).selectedId).toBe(hit.id);
    return hit.id;
  }
  throw new Error(`No actually pickable ${kind} found in the tested poses.`);
}

test('ten Body→Micro→Body transitions restore the manual camera, selection, layers and paused Rinkaku pose', async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page);
  await page.getByTestId('structure-human.thorax').click();
  await page.getByTestId('layer-skeletal').click();
  await page.getByTestId('rinkaku-toggle').click();
  await page.getByTestId('rinkaku-time').fill('0.7');
  await expect.poll(async () => (await body(page)).rinkaku.t).toBeCloseTo(.7, 6);
  const canvas = page.getByTestId('stage').locator('canvas'); const box = await canvas.boundingBox();
  await page.mouse.move(box!.x + box!.width * .48, box!.y + box!.height * .55);
  await page.mouse.down(); await page.mouse.move(box!.x + box!.width * .59, box!.y + box!.height * .51, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(2500);
  const before = await body(page); const cycles = [];
  for (let cycle = 1; cycle <= 10; cycle++) {
    await enter(page); await page.getByTestId('micro-profile').selectOption('100');
    await scrub(page, 7.5);
    const inside = await micro(page);
    expect(inside.adapter.counts.total).toBe(100);
    expect(inside.adapter.disposed).toBe(false);
    expect(inside.lifecycle.active).toBe(1);
    await page.getByTestId('micro-return').click();
    await expect(page.getByTestId('mode-body')).toHaveAttribute('aria-current', 'page');
    await expect.poll(async () => page.evaluate(() => Boolean((window as unknown as { __ATLAS_MICRO__?: MicroApi }).__ATLAS_MICRO__))).toBe(false);
    await expect.poll(async () => page.evaluate(() => (window as unknown as { __ATLAS_VASCULAR_RESOURCES__: () => { active: number } }).__ATLAS_VASCULAR_RESOURCES__().active)).toBe(0);
    const released = await page.evaluate(() => (window as unknown as { __ATLAS_VASCULAR_RESOURCES__: () => { created: number; disposed: number; active: number } }).__ATLAS_VASCULAR_RESOURCES__());
    expect(released.disposed).toBe(released.created);
    const after = await body(page);
    expect(after.selectedId).toBe(before.selectedId); expect(after.layers).toEqual(before.layers);
    expect(after.surfaceOpacity).toBe(before.surfaceOpacity); expect(after.scanT).toBe(before.scanT);
    expect(after.rinkaku).toEqual(before.rinkaku);
    expect(distance(after.camera.position, before.camera.position)).toBeLessThan(1e-7);
    expect(distance(after.camera.target, before.camera.target)).toBeLessThan(1e-7);
    expect(distance(after.camera.quaternion!, before.camera.quaternion!)).toBeLessThan(1e-12);
    expect(after.camera.up).toEqual(before.camera.up);
    expect(after.camera.projection).toEqual(before.camera.projection);
    expect(after.metrics?.geometries).toBe(before.metrics?.geometries);
    expect(after.metrics?.textures).toBe(before.metrics?.textures);
    cycles.push({ cycle, body: after, micro: { resources: inside.adapter.resources, counts: inside.adapter.counts, metrics: inside.metrics, lifecycle: inside.lifecycle }, released });
  }
  await save('ten-body-micro-transitions', { method: 'Ten actual UI entries/returns, paused Body/Rinkaku, manual orbit before first entry; no camera/state injection.', before, cycles });
});

test('absolute scrubbing, pause, speed, reset and population changes retain deterministic instanced transport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page); await enter(page);
  const first = await scrub(page, 32);
  for (const seconds of [9, 74, 2, 32]) await scrub(page, seconds);
  const repeated = await micro(page);
  expect(repeated.adapter.positionHash).toBe(first.adapter.positionHash);
  expect(repeated.adapter.resourceIds).toEqual(first.adapter.resourceIds);
  expect(repeated.particles).toEqual(first.particles);
  for (const count of [100, 2000, 500]) {
    await page.getByTestId('micro-profile').selectOption(String(count));
    await expect.poll(async () => (await micro(page)).adapter.counts.total).toBe(count);
    const changed = await micro(page);
    expect(changed.seconds).toBe(32); expect(changed.adapter.resourceIds).toEqual(first.adapter.resourceIds);
    expect(changed.particles.slice(0, 100)).toEqual(first.particles.slice(0, 100));
  }
  expect((await micro(page)).adapter.positionHash).toBe(first.adapter.positionHash);
  await page.getByTestId('micro-reset').click();
  await expect.poll(async () => (await micro(page)).seconds).toBe(0);
  expect((await micro(page)).playing).toBe(false);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByTestId('micro-speed').fill('0.8'); await page.getByTestId('micro-play').click();
  await expect.poll(async () => (await micro(page)).seconds).toBeGreaterThan(.1);
  await page.getByTestId('micro-play').click(); const paused = await micro(page);
  await page.waitForTimeout(150); expect((await micro(page)).seconds).toBe(paused.seconds);
  expect(paused.speed).toBe(.8);
});

test('Micro preserves the rigged GLB lease, sampled socket, isolation and opacity without exposing the hidden asset bench', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?assets=lab'); await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
  await page.getByTestId('asset-select').selectOption('fixture.rigged.v1');
  await expect(page.getByTestId('asset-status')).toContainText('GLB sintético integrado');
  await page.getByTestId('asset-animation-clip').selectOption({ index: 1 });
  await page.getByTestId('asset-animation-time').fill('0.63');
  await page.getByTestId('structure-human.thorax').click(); await page.getByTestId('isolate-selection').click();
  await page.getByRole('slider', { name: 'Opacidade da superfície', exact: true }).fill('0.18');
  const before = await body(page);
  await enter(page); await expect(page.getByTestId('asset-select')).toBeHidden();
  await page.getByTestId('micro-time').fill('16'); await page.getByTestId('micro-return').click();
  const after = await body(page);
  expect(after.assets.activeId).toBe('fixture.rigged.v1'); expect(after.assets.status).toBe('ready');
  expect(after.assets.sockets).toEqual(before.assets.sockets); expect(after.assets.bones).toEqual(before.assets.bones);
  expect(after.assets.animation).toEqual(before.assets.animation);
  expect(after.assets.cache.refCount).toBe(before.assets.cache.refCount); expect(after.assets.cache.loads).toBe(before.assets.cache.loads);
  expect(after.layers).toEqual(before.layers); expect(after.selectedId).toBe(before.selectedId); expect(after.surfaceOpacity).toBe(.18);
  expect(distance(after.camera.position, before.camera.position)).toBeLessThan(1e-7);
  await save('glb-context-roundtrip', { before, after });
});

test('real RC and RBC picking reaches the stable inspector identity and evidence remains classified', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page); await enter(page);
  await page.getByTestId('micro-profile').selectOption('100');
  const rc = await pick(page, 'rc');
  await expect(page.getByTestId('micro-entity')).toHaveValue(rc);
  await page.getByTestId('micro-evidence').click();
  await expect(page.getByTestId('micro-inspector')).toContainText('HIPÓTESE VISUAL');
  await expect(page.getByTestId('micro-inspector')).toContainText('DESCONHECIDO');
  await expect(page.getByTestId('micro-inspector').getByRole('link', { name: /Young Jump/ })).toHaveAttribute('href', 'https://youngjump.jp/tokyoghoul/tg/data/');
  const rbc = await pick(page, 'rbc');
  await expect(page.getByTestId('micro-entity')).toHaveValue(rbc);
  await expect(page.getByTestId('micro-inspector')).toContainText('BASE HUMANA');
  await expect(page.getByTestId('micro-inspector').getByRole('link', { name: /18.3 Erythrocytes/ })).toHaveAttribute('href', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/18-3-erythrocytes');
  const before = await micro(page);
  await page.getByTestId('micro-highlight').check();
  expect((await micro(page)).selectedId).toBe(rbc);
  expect((await micro(page)).adapter.positionHash).toBe(before.adapter.positionHash);
  await expect(page.getByText('Realce didático; não representa fluorescência biológica.')).toBeVisible();
});

test('tracking keeps one identity through real playback, while profile removal is explicit and keyboard exits in two steps', async ({ page }) => {
  test.setTimeout(80_000);
  await open(page); await enter(page); await page.getByTestId('micro-profile').selectOption('2000');
  const id = (await micro(page)).particles.find((item) => item.kind === 'rc' && item.index > 100)!.id;
  await page.getByTestId('micro-entity').selectOption(id); await page.getByTestId('micro-follow').click();
  await expect.poll(async () => (await micro(page)).cameraMode).toBe('tracking');
  const initial = await micro(page); await page.getByTestId('micro-play').click();
  // A complete illustrative circuit is about38–40s at default speed; this
  // intentionally observes real playback rather than advancing the clock API.
  const observations = []; const started = Date.now();
  let previous = initial;
  while (Date.now() - started < 42_000) {
    await page.waitForTimeout(500);
    const current = await micro(page);
    expect(current.selectedId).toBe(id);
    const cameraStep = distance(current.camera.position, previous.camera.position);
    // Initial mode transfer is intentionally eased along the tube. Once settled,
    // normal tracking cannot jump to another region at the closed-loop seam.
    if (Date.now() - started > 6000) expect(cameraStep).toBeLessThan(1.5);
    observations.push({ elapsedMs: Date.now() - started, seconds: current.seconds, camera: current.camera, cameraStep, selectedId: current.selectedId });
    previous = current;
  }
  const moving = await micro(page);
  expect(moving.selectedId).toBe(id); expect(moving.selectedPresent).toBe(true);
  expect(moving.seconds - initial.seconds).toBeGreaterThan(38);
  expect(moving.cameraMode).toBe('tracking');
  expect(distance(moving.camera.position, initial.camera.position)).toBeGreaterThan(.1);
  await page.getByTestId('micro-play').click();
  await page.getByTestId('micro-profile').selectOption('100');
  await expect(page.getByTestId('micro-inspector')).toContainText('Entidade ausente neste perfil');
  const missing = await micro(page);
  expect(missing.selectedId).toBe(id); expect(missing.selectedPresent).toBe(false); expect(missing.cameraMode).toBe('free');
  await expect(page.getByTestId('micro-follow')).toBeDisabled();
  await page.getByTestId('micro-profile').selectOption('2000');
  await page.getByTestId('micro-follow').click();
  await page.getByTestId('micro-stage').click({ position: { x: 20, y: 20 } });
  await page.keyboard.press('Escape'); await expect.poll(async () => (await micro(page)).cameraMode).toBe('free');
  await page.keyboard.press('Escape'); await expect(page.getByTestId('mode-body')).toHaveAttribute('aria-current', 'page');
  await save('tracking-loop', { method: '42 real seconds of default-speed playback with camera/identity samples every500ms, then explicit profile removal and return.', id, initial, moving, missing, observations });
});

test('releasing tracking by button, missing profile or first Escape retains the actual camera pose', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page); await enter(page);
  await page.getByTestId('micro-profile').selectOption('2000'); await scrub(page, 24);
  await page.getByTestId('micro-entity').selectOption('rc:17:104');
  const poses = [];
  for (const action of ['button', 'profile', 'Escape'] as const) {
    await page.getByTestId('micro-profile').selectOption('2000');
    await page.getByTestId('micro-follow').click();
    await expect.poll(async () => (await micro(page)).cameraMode).toBe('tracking');
    await page.waitForTimeout(80); const before = await micro(page);
    if (action === 'button') await page.getByTestId('micro-follow').click();
    else if (action === 'profile') await page.getByTestId('micro-profile').selectOption('100');
    else await page.keyboard.press('Escape');
    await expect.poll(async () => (await micro(page)).cameraMode).toBe('free');
    await page.waitForTimeout(80); const after = await micro(page);
    expect(distance(after.camera.position, before.camera.position)).toBeLessThan(1e-7);
    expect(distance(after.camera.target, before.camera.target)).toBeLessThan(1e-7);
    expect(distance(after.camera.quaternion!, before.camera.quaternion!)).toBeLessThan(1e-7);
    expect(after.camera.up).toEqual(before.camera.up);
    expect(after.seconds).toBe(24); expect(after.selectedId).toBe('rc:17:104');
    poses.push({ action, before: before.camera, after: after.camera });
  }
  await save('camera-release-continuity', { seconds: 24, selectedId: 'rc:17:104', poses });
});

test('enabling reduced motion inside Micro overrides the saved Body orbit inertia on return', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await open(page);
  await expect.poll(async () => (await body(page)).camera.enableDamping).toBe(true);
  await enter(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByTestId('micro-play')).toBeDisabled();
  await page.getByTestId('micro-return').click();
  await expect.poll(async () => (await body(page)).camera.enableDamping).toBe(false);
  await page.waitForTimeout(150); expect((await body(page)).camera.enableDamping).toBe(false);
});

test('reduced motion keeps manual transport and camera/selection controls available without continuous playback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page); await enter(page);
  await expect(page.getByTestId('micro-play')).toBeDisabled();
  await expect(page.getByTestId('micro-camera-flow')).toBeDisabled();
  await scrub(page, 6.5);
  await page.getByRole('button', { name: 'Próximo passo do transporte', exact: true }).click();
  await expect.poll(async () => (await micro(page)).seconds).toBe(7);
  await page.getByTestId('micro-time').focus(); await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await micro(page)).seconds).toBeGreaterThan(7);
  const still = await micro(page); await page.waitForTimeout(160);
  expect((await micro(page)).adapter.positionHash).toBe(still.adapter.positionHash);
  await page.getByTestId('micro-entity').selectOption('rc:17:0'); await page.getByTestId('micro-follow').click();
  expect((await micro(page)).cameraMode).toBe('tracking'); expect((await micro(page)).playing).toBe(false);
  await page.getByTestId('micro-camera-reset').click();
  await expect.poll(async () => (await micro(page)).cameraMode).toBe('free');
});

test('free observation accepts real orbit and keyboard pan, and camera reset preserves the absolute transport pose', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page); await enter(page);
  await scrub(page, 24);
  const before = await micro(page), canvas = page.getByTestId('micro-stage').locator('canvas');
  const box = await canvas.boundingBox();
  await page.mouse.move(box!.x + box!.width * .45, box!.y + box!.height * .55); await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * .58, box!.y + box!.height * .59, { steps: 9 }); await page.mouse.up();
  await expect.poll(async () => distance((await micro(page)).camera.position, before.camera.position)).toBeGreaterThan(.05);
  await canvas.focus(); const orbited = await micro(page); await page.keyboard.press('ArrowRight');
  await expect.poll(async () => distance((await micro(page)).camera.target, orbited.camera.target)).toBeGreaterThan(.001);
  await page.getByTestId('micro-camera-reset').click();
  await expect.poll(async () => distance((await micro(page)).camera.position, before.camera.position)).toBeLessThan(1e-7);
  expect((await micro(page)).seconds).toBe(24); expect((await micro(page)).adapter.positionHash).toBe(before.adapter.positionHash);
});

test('a real Micro WebGL context loss leaves textual evidence and the Body bookmark available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page);
  await page.getByTestId('structure-human.thorax').click(); const before = await body(page);
  await enter(page);
  const lost = await page.getByTestId('micro-stage').locator('canvas').evaluate((element) => {
    const extension = (element as HTMLCanvasElement).getContext('webgl2')?.getExtension('WEBGL_lose_context');
    if (!extension) return false; extension.loseContext(); return true;
  });
  expect(lost).toBe(true);
  await expect(page.getByTestId('micro-status')).toHaveText('Modo textual');
  await expect(page.getByTestId('micro-play')).toBeDisabled();
  await page.getByTestId('micro-entity').selectOption('rc:17:0'); await page.getByTestId('micro-evidence').click();
  await expect(page.getByTestId('micro-inspector')).toContainText('HIPÓTESE VISUAL');
  await page.getByTestId('micro-retry').click();
  await expect(page.getByTestId('micro-status')).toHaveText('3D conectado');
  expect((await micro(page)).selectedId).toBe('rc:17:0');
  await page.getByTestId('micro-return').click();
  await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
  expect((await body(page)).selectedId).toBe(before.selectedId); expect((await body(page)).layers).toEqual(before.layers);
});

test('Micro without WebGL exposes accessible static evidence and a truthful return path', async ({ page }) => {
  await page.goto('/?webgl=off'); await expect(page.getByTestId('scene-fallback')).toBeVisible();
  await page.getByTestId('mode-micro').click();
  await expect(page.getByTestId('micro-status')).toHaveText('Modo textual');
  await expect(page.getByTestId('micro-play')).toBeDisabled();
  await page.getByTestId('micro-entity').selectOption('rc:17:0');
  await page.getByTestId('micro-evidence').click();
  await expect(page.getByTestId('micro-inspector')).toContainText('DESCONHECIDO');
  await page.getByTestId('micro-time').fill('12'); await expect(page.getByTestId('micro-time')).toHaveValue('12');
  await page.getByTestId('micro-return').click(); await expect(page.getByTestId('scene-fallback')).toBeVisible();
});

test('mobile Micro has usable touch controls, no overflow and readable selection/evidence', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await open(page); await enter(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const stageBox = await page.getByTestId('micro-stage').boundingBox();
    const disclosureBox = await page.getByTestId('micro-stage').locator('.proxy-stamp').boundingBox();
    expect(disclosureBox!.y).toBeGreaterThanOrEqual(stageBox!.y);
    expect(disclosureBox!.y + disclosureBox!.height).toBeLessThanOrEqual(stageBox!.y + stageBox!.height);
    for (const id of ['micro-entry', 'micro-profile', 'micro-entity', 'micro-follow', 'micro-camera-free', 'micro-camera-reset', 'micro-return', 'micro-play', 'micro-reset']) {
      if (id === 'micro-entry') continue;
      const box = await page.getByTestId(id).boundingBox(); expect(box).not.toBeNull(); expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByTestId('micro-entity').selectOption('rc:17:0'); await page.getByTestId('micro-follow').tap();
    await page.getByTestId('micro-inspector').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('micro-inspector')).toHaveAttribute('data-selected-id', 'rc:17:0');
    await page.getByTestId('micro-evidence').tap(); await expect(page.getByTestId('micro-inspector')).toContainText('HIPÓTESE VISUAL');
    await page.getByTestId('micro-return').tap(); await expect(page.getByTestId('mode-body')).toHaveAttribute('aria-current', 'page');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});
