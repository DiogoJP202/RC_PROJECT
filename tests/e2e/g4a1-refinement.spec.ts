import { openMicroTool, closeStudyTool, changeMicroSelect, setMicroHighlight } from './study-tools';
import { evidenceRoot } from './evidence-path';
import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

interface Camera { position: number[]; target: number[]; quaternion: number[]; up: number[] }
interface MicroSnapshot {
  seconds: number; playing: boolean; config: { count: number; seed: number };
  selectedId: string | null; selectedPresent: boolean; cameraMode: 'free' | 'flow' | 'tracking';
  highlightRC: boolean; reducedMotion: boolean; camera: Camera;
  adapter: { positionHash: string; seconds: number; resourceIds: Record<string, unknown>; counts: { total: number }; resources: Record<string, number>;
    selection: { id: string | null; visible: boolean; kind: 'external-brackets'; depthTest: boolean; preservesBaseColor: boolean } };
  metrics: { calls: number; triangles: number; geometries: number; textures: number };
}
interface Visibility {
  visibleFraction: number; inFrameFraction: number; surfaceRays: number; visibleRays: number;
  blockingIds: string[]; selectedPixelsEstimate: number;
}
interface MicroApi {
  snapshot(): MicroSnapshot;
  visibility(id: string): Visibility | null;
  project(id: string): { x: number; y: number; z: number } | null;
  raycast(x: number, y: number): string | null;
}
const output = `${evidenceRoot}/g4a1`;
const runtime = new WeakMap<Page, string[]>();
const micro = (page: Page): Promise<MicroSnapshot> => page.evaluate(() => (window as unknown as { __ATLAS_MICRO__: MicroApi }).__ATLAS_MICRO__.snapshot());
const distance = (a: number[], b: number[]) => Math.hypot(...a.map((value, index) => value - b[index]));
const compact = (value: MicroSnapshot) => ({ seconds: value.seconds, playing: value.playing, config: value.config,
  selectedId: value.selectedId, selectedPresent: value.selectedPresent, cameraMode: value.cameraMode,
  highlightRC: value.highlightRC, camera: value.camera, adapter: value.adapter, metrics: value.metrics });
async function settle(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
async function overlayLayout(page: Page) {
  return page.getByTestId('micro-workspace').evaluate((element) => {
    const label = element.querySelector('[data-testid="micro-selection"]')?.getBoundingClientRect();
    const disclosure = element.querySelector('.body-meta')?.getBoundingClientRect();
    if (!label || !disclosure) throw new Error('Micro identity and conceptual disclosure must both have geometry.');
    return { identity: { top: label.top, bottom: label.bottom, left: label.left, right: label.right },
      disclosure: { top: disclosure.top, bottom: disclosure.bottom, left: disclosure.left, right: disclosure.right },
      verticalGap: disclosure.top - label.bottom };
  });
}
async function openMicro(page: Page, seed = 17) {
  const errors: string[] = []; runtime.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`/atlas?microSeed=${seed}`);
  await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
  await page.getByTestId('micro-entry').click();
  await expect(page.getByTestId('micro-status')).toContainText('3D conectado');
  await page.waitForFunction(() => Boolean((window as unknown as { __ATLAS_MICRO__?: MicroApi }).__ATLAS_MICRO__?.snapshot().adapter));
  expect((await micro(page)).config.seed).toBe(seed);
}
async function scrub(page: Page, seconds: number) {
  await page.getByTestId('micro-time').fill(String(seconds));
  await expect.poll(async () => (await micro(page)).adapter.seconds).toBeCloseTo(seconds, 8);
  await settle(page); return micro(page);
}
async function follow(page: Page, seed = 17) {
  await changeMicroSelect(page, 'micro-entity', `rc:${seed}:0`);
  if ((await micro(page)).cameraMode !== 'tracking') await page.getByTestId('micro-follow').click();
  await expect.poll(async () => (await micro(page)).cameraMode).toBe('tracking');
}
async function save(name: string, value: unknown) {
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/${name}.json`, `${JSON.stringify(value, null, 2)}\n`);
}
function expectSameCamera(actual: Camera, expected: Camera, tolerance = 1e-7) {
  for (const key of ['position', 'target', 'quaternion', 'up'] as const) expect(distance(actual[key], expected[key]), key).toBeLessThan(tolerance);
}
test.afterEach(async ({ page }) => { expect(runtime.get(page) ?? []).toEqual([]); });

test('every explicit scrub, including sub-threshold steps, gives a repeatable tracking camera for three seeds', async ({ page }) => {
  const observations = [];
  for (const seed of [17, 31, 73]) {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openMicro(page, seed); await follow(page, seed);
    const first = await scrub(page, 11), poses = [];
    for (const seconds of [11.01, 10.99, 11.02, 11, 3, 27, 6, 11]) {
      const current = await scrub(page, seconds);
      expect(current.seconds).toBe(seconds); expect(current.playing).toBe(false);
      expect(current.selectedId).toBe(`rc:${seed}:0`);
      expect(current.adapter.resourceIds).toEqual(first.adapter.resourceIds);
      if (seconds === 11) {
        expect(current.adapter.positionHash).toBe(first.adapter.positionHash);
        expectSameCamera(current.camera, first.camera);
      } else if (seconds === 11.01) {
        expect(distance(current.camera.position, first.camera.position)).toBeGreaterThan(1e-6);
      }
      poses.push(compact(current));
    }
    observations.push({ seed, first: compact(first), poses });
  }
  await save('small-scrub-camera-revisits', { method: 'Actual UI scrub while paused, without reduced motion; includes changes smaller than the old0.4s discontinuity heuristic.', observations });
});

test('selection, visual highlight and camera modes preserve the absolute transport and real visibility diagnostics', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await openMicro(page);
  const first = await scrub(page, 11);
  await changeMicroSelect(page, 'micro-entity', 'rc:17:0'); await settle(page);
  const selected = await micro(page);
  expect(selected.adapter.positionHash).toBe(first.adapter.positionHash);
  expect(selected.adapter.selection).toMatchObject({ id: 'rc:17:0', visible: true, kind: 'external-brackets', depthTest: true, preservesBaseColor: true });
  expectSameCamera(selected.camera, first.camera);
  await setMicroHighlight(page, true); await settle(page);
  const highlighted = await micro(page);
  expect(highlighted.selectedId).toBe('rc:17:0'); expect(highlighted.adapter.positionHash).toBe(first.adapter.positionHash);
  expectSameCamera(highlighted.camera, first.camera);
  await page.getByTestId('micro-follow').click(); const tracked = await scrub(page, 11);
  const overlays = await overlayLayout(page);
  expect(overlays.identity.bottom).toBeLessThanOrEqual(overlays.disclosure.top);
  await save('desktop-overlay-layout', { viewport: page.viewportSize(), selectedId: tracked.selectedId, seconds: tracked.seconds, overlays });
  const readings = []; let lastTracked = tracked;
  for (const seconds of [0, 5, 10, 15, 20, 25, 30, 35, 40]) {
    const current = await scrub(page, seconds);
    const before = compact(current);
    const visibility = await page.evaluate(() => (window as unknown as { __ATLAS_MICRO__: MicroApi }).__ATLAS_MICRO__.visibility('rc:17:0'));
    expect(visibility).not.toBeNull();
    expect(visibility!.visibleFraction).toBeGreaterThanOrEqual(0); expect(visibility!.visibleFraction).toBeLessThanOrEqual(1);
    expect(visibility!.inFrameFraction).toBeGreaterThanOrEqual(0); expect(visibility!.inFrameFraction).toBeLessThanOrEqual(1);
    expect(Number.isInteger(visibility!.surfaceRays)).toBe(true); expect(visibility!.surfaceRays).toBeGreaterThan(0);
    expect(Number.isInteger(visibility!.visibleRays)).toBe(true); expect(visibility!.visibleRays).toBeGreaterThanOrEqual(0);
    expect(visibility!.visibleRays).toBeLessThanOrEqual(visibility!.surfaceRays);
    expect(Number.isFinite(visibility!.selectedPixelsEstimate)).toBe(true); expect(visibility!.selectedPixelsEstimate).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(visibility!.blockingIds)).toBe(true);
    const after = await micro(page);
    expect(after.adapter.positionHash).toBe(before.adapter.positionHash); expectSameCamera(after.camera, before.camera);
    expect(after.selectedId).toBe('rc:17:0'); expect(after.playing).toBe(false);
    readings.push({ seconds, visibility, camera: before.camera });
    lastTracked = after;
  }
  await page.getByTestId('micro-camera-free').click(); const released = await micro(page);
  expectSameCamera(released.camera, lastTracked.camera);
  expect(released.selectedId).toBe('rc:17:0'); expect(released.cameraMode).toBe('free');
  expect(released.adapter.resourceIds).toEqual(first.adapter.resourceIds);
  await save('selection-and-real-visibility', { method: 'Visibility is a read-only surface-ray diagnostic against actual meshes; numeric results do not imply guaranteed unoccluded tracking or artistic approval.', first: compact(first), selected: compact(selected), highlighted: compact(highlighted), tracked: compact(tracked), readings, released: compact(released) });
});

test('Flow, Tracking and Free transitions retain identity and release the current camera without an entrance reset', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await openMicro(page);
  await changeMicroSelect(page, 'micro-entity', 'rc:17:0'); await scrub(page, 24);
  const modes = [];
  for (const mode of ['flow', 'tracking'] as const) {
    if (mode === 'flow') await page.getByTestId('micro-camera-flow').click(); else await follow(page);
    // Explicit UI scrub settles the requested absolute pose without relying on
    // an arbitrary sleep to hide an easing error while paused.
    const before = await scrub(page, 24);
    expect(before.cameraMode).toBe(mode);
    await page.getByTestId('micro-camera-free').click(); await settle(page);
    const after = await micro(page);
    expect(after.cameraMode).toBe('free'); expect(after.selectedId).toBe('rc:17:0'); expect(after.seconds).toBe(24);
    expect(after.adapter.positionHash).toBe(before.adapter.positionHash);
    expectSameCamera(after.camera, before.camera);
    modes.push({ mode, before: compact(before), after: compact(after) });
  }
  await save('camera-mode-transitions', { modes });
});

test('reduced motion freezes the selected presentation while manual steps and keyboard remain available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await openMicro(page); await follow(page);
  await expect(page.getByTestId('micro-play')).toBeDisabled(); await expect(page.getByTestId('micro-camera-flow')).toBeDisabled();
  const before = await scrub(page, 11); await page.waitForTimeout(250); const after = await micro(page);
  expect(after.adapter.positionHash).toBe(before.adapter.positionHash); expectSameCamera(after.camera, before.camera);
  await page.getByRole('button', { name: 'Próximo passo do transporte', exact: true }).click();
  await expect.poll(async () => (await micro(page)).seconds).toBe(11.5);
  await page.getByTestId('micro-time').focus(); await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await micro(page)).seconds).toBeLessThan(11.5);
  await page.keyboard.press('Escape'); await expect.poll(async () => (await micro(page)).cameraMode).toBe('free');
  await page.keyboard.press('Escape'); await expect(page.getByTestId('mode-body')).toHaveAttribute('aria-current', 'page');
});

for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`mobile${viewport.width} compacts the title, reserves an inspection area and retains touch/accessibility`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await openMicro(page); await follow(page); await scrub(page, 11);
      await page.getByTestId('micro-stage').scrollIntoViewIfNeeded();
      const layout = await page.getByTestId('micro-stage').evaluate((element) => {
        const stage = element.getBoundingClientRect(), title = element.closest('[data-testid="micro-workspace"]')?.querySelector('h1')?.getBoundingClientRect();
        const disclosure = element.querySelector('.proxy-stamp')?.getBoundingClientRect();
        const box = (rect: DOMRect | undefined) => rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right } : null;
        return { stage: box(stage)!, title: box(title), disclosure: box(disclosure), documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth };
      });
      expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.title).not.toBeNull(); expect(layout.disclosure).not.toBeNull();
      expect(layout.title!.height / layout.stage.height).toBeLessThan(.19);
      expect(layout.title!.bottom).toBeLessThan(layout.disclosure!.y);
      expect(layout.disclosure!.bottom).toBeLessThanOrEqual(layout.stage.bottom + 1);
      const overlays = await overlayLayout(page);
      expect(overlays.identity.bottom).toBeLessThanOrEqual(overlays.disclosure.top);
      for (const id of ['micro-profile', 'micro-entity', 'micro-follow', 'micro-camera-free', 'micro-camera-reset', 'micro-return', 'micro-play', 'micro-reset']) {
        if (['micro-profile', 'micro-entity'].includes(id)) await openMicroTool(page, 'controls');
        const box = await page.getByTestId(id).boundingBox(); expect(box).not.toBeNull(); expect(box!.height, id).toBeGreaterThanOrEqual(44);
        await closeStudyTool(page);
      }
      await openMicroTool(page, 'inspect'); await page.getByTestId('micro-evidence').tap(); await expect(page.getByTestId('micro-inspector')).toContainText('HIPÓTESE VISUAL');
      await expect(page.getByTestId('micro-inspector')).toHaveAttribute('data-selected-id', 'rc:17:0');
      await save(`mobile-${viewport.width}-layout`, { viewport, layout, overlays, state: compact(await micro(page)) });
      expect(runtime.get(page) ?? []).toEqual([]);
    } finally { await context.close(); }
  });
}
