import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

interface Inspection {
  selectedId: string; layers: Record<string, boolean>; camera: { moving: boolean; position: number[]; target: number[] };
  metrics: { geometries: number; textures: number };
  rinkaku: { t: number; playing: boolean; snapshot: { appendageExtension: number; rootExposure: number; kakuhouActivation: number; particleEmission: number };
    adapter: { t: number; visible: boolean; visibleAppendages: number; particleCount: number; resourceIds: unknown } | null };
}
const OUTPUT = 'artifacts/gates/G3A1-review/checkpoint';
const scene = (page: Page): Promise<Inspection> => page.evaluate(() => (
  window as unknown as { __ATLAS_SCENE__: { snapshot(): Inspection } }
).__ATLAS_SCENE__.snapshot());
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
async function scrub(page: Page, t: number) {
  await page.getByTestId('rinkaku-time').fill(String(t));
  await expect.poll(async () => (await scene(page)).rinkaku.adapter?.t).toBe(t);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  return scene(page);
}
async function open(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('scene-status')).toContainText('3D conectado');
  await page.getByRole('slider', { name: 'Opacidade da superfície', exact: true }).fill('1');
  await page.getByTestId('rinkaku-toggle').click();
  await expect.poll(async () => Boolean((await scene(page)).rinkaku.adapter)).toBe(true);
  await expect.poll(async () => (await scene(page)).camera.moving).toBe(false);
}

test('terminal retraction settles before the visibility cutoff and leaves no rendered residue for 1–4 appendages', async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await mkdir(`${OUTPUT}/terminal`, { recursive: true });
  const samples = [];
  for (const count of [1, 2, 3, 4]) {
    await page.getByTestId('rinkaku-count').selectOption(String(count));
    for (const view of ['focus', 'lateral']) {
      await page.getByTestId(`rinkaku-${view}`).click();
      await expect.poll(async () => (await scene(page)).camera.moving).toBe(false);
      const rest = await scrub(page, 0);
      const restPng = await page.getByTestId('stage').screenshot();
      const sequence = [];
      for (const t of [.995, .998, .999, 1]) {
        const state = await scrub(page, t);
        const file = `${OUTPUT}/terminal/count-${count}-${view}-t${t.toFixed(3)}.png`;
        const png = await page.getByTestId('stage').screenshot({ path: file });
        expect(state.camera).toEqual(rest.camera);
        expect(state.rinkaku.adapter?.resourceIds).toEqual(rest.rinkaku.adapter?.resourceIds);
        // With the opaque proxy, the final collar must already be under the skin
        // at .999; group.visible must not be the mechanism that removes a mound.
        if (t >= .999) expect(sha(png), `count ${count}, view ${view}, t ${t}`).toBe(sha(restPng));
        if (t === 1) {
          expect(state.rinkaku.adapter?.visible).toBe(false);
          expect(state.rinkaku.adapter?.visibleAppendages).toBe(0);
          expect(state.rinkaku.adapter?.particleCount).toBe(0);
          expect(state.rinkaku.snapshot).toMatchObject({ appendageExtension: 0, rootExposure: 0, kakuhouActivation: 0, particleEmission: 0 });
          expect(state.rinkaku.playing).toBe(false);
        }
        sequence.push({ t, file, sha256: sha(png), state });
      }
      await scrub(page, .2); await scrub(page, .9);
      await scrub(page, 1);
      expect(sha(await page.getByTestId('stage').screenshot())).toBe(sha(restPng));
      samples.push({ count, view, restSha256: sha(restPng), sequence });
    }
  }
  await writeFile(`${OUTPUT}/terminal-retraction.json`, JSON.stringify({ method: 'Actual UI, opaque proxy, fixed camera, 1–4 counts, focus/lateral. PNG at .999 and1 must already equal rest. No debug mutations.', samples }, null, 2) + '\n');
});

test('real terminal playback stops at one, keeps replay resources stable and releases them on exit', async ({ page }) => {
  await open(page);
  await scrub(page, .9);
  await page.waitForTimeout(2200);
  const warmed = await scene(page);
  await scrub(page, .98);
  const started = Date.now();
  await page.getByTestId('rinkaku-play').click();
  await expect.poll(async () => { const s = await scene(page); return s.rinkaku.t === 1 && !s.rinkaku.playing; }).toBe(true);
  const end = await scene(page);
  expect(end.rinkaku.adapter?.visible).toBe(false);
  expect(end.rinkaku.adapter?.particleCount).toBe(0);
  expect(end.rinkaku.adapter?.resourceIds).toEqual(warmed.rinkaku.adapter?.resourceIds);
  expect(end.metrics.geometries).toBe(warmed.metrics.geometries);
  expect(end.metrics.textures).toBe(warmed.metrics.textures);
  expect(end.selectedId).toBe(warmed.selectedId);
  expect(end.layers).toEqual(warmed.layers);
  await page.getByTestId('rinkaku-toggle').click();
  await expect.poll(async () => (await scene(page)).rinkaku.adapter).toBeNull();
  await expect.poll(async () => (await scene(page)).metrics.geometries).toBe(13);
  const unmounted = await scene(page);
  expect(unmounted.metrics.textures).toBe(3);
  await mkdir(OUTPUT, { recursive: true });
  await writeFile(`${OUTPUT}/terminal-resources.json`, JSON.stringify({ method: 'Real UI playback from .98 to1; retained replay buffers are intentional until mode exit. Renderer counters do not measure VRAM.', elapsedMs: Date.now() - started, warmed, end, unmounted }, null, 2) + '\n');
});

test('transparent body picking ignores pooled appendages below an invisible parent at the endpoint', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await page.getByTestId('rinkaku-count').selectOption('1');
  await page.getByTestId('structure-human.thorax').click();
  await page.getByTestId('rinkaku-focus').click();
  await expect.poll(async () => (await scene(page)).camera.moving).toBe(false);
  await scrub(page, 1);
  expect((await scene(page)).selectedId).toBe('human.thorax');
  const point = await page.evaluate(() => (window as unknown as { __ATLAS_SCENE__: {
    project(id: string): { x: number; y: number }; raycast(x: number, y: number): string;
  } }).__ATLAS_SCENE__.project('ghoul.kakuhou.rinkaku'));
  const canvas = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(canvas.x + (point.x + 1) * canvas.width / 2, canvas.y + (1 - point.y) * canvas.height / 2);
  await expect.poll(async () => (await scene(page)).selectedId).toBe('human.surface');
});

test('terminal surfaces also have no residual pixel footprint through the transparent body', async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await page.getByRole('slider', { name: 'Opacidade da superfície', exact: true }).fill('0.2');
  await mkdir(`${OUTPUT}/terminal-transparent`, { recursive: true });
  const samples = [];
  for (const count of [1, 2, 3, 4]) {
    await page.getByTestId('rinkaku-count').selectOption(String(count));
    for (const view of ['focus', 'lateral']) {
      await page.getByTestId(`rinkaku-${view}`).click();
      await expect.poll(async () => (await scene(page)).camera.moving).toBe(false);
      await scrub(page, 0);
      const restSha256 = sha(await page.getByTestId('stage').screenshot());
      for (const t of [.999, 1]) {
        const state = await scrub(page, t);
        const file = `${OUTPUT}/terminal-transparent/count-${count}-${view}-t${t.toFixed(3)}.png`;
        const png = await page.getByTestId('stage').screenshot({ path: file });
        expect(sha(png), `transparent count ${count}, ${view}, t ${t}`).toBe(restSha256);
        samples.push({ count, view, t, file, sha256: sha(png), restSha256, state });
      }
    }
  }
  await writeFile(`${OUTPUT}/terminal-transparent.json`, JSON.stringify({ method: 'Real UI, body opacity0.2, all counts in focus/lateral. Exact PNG equality at .999 and1 against rest verifies that burial alone is not masking a retained disc.', samples }, null, 2) + '\n');
});
