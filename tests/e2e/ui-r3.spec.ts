import { mkdir, writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { openBodyTool } from './body-tools';
import { changeMicroSelect, closeStudyTool, openMicroTool } from './study-tools';
import { evidenceRoot } from './evidence-path';

const output = `${evidenceRoot}/ui-r3`;
interface Snapshot {
  camera: Record<string, unknown> & { moving: boolean };
  frames: number;
  selectedId: string | null;
  seconds: number;
  cameraMode: string;
  rinkaku: { t: number; adapter: { t: number; resourceIds: unknown; positionHash: string } | null };
  assets: { activeId: string; cache: unknown };
  adapter: { positionHash: string; resourceIds: unknown };
}
const snapshot = (page: Page, micro = false): Promise<Snapshot> => page.evaluate((micro) => {
  const atlas = window as unknown as Record<string, { snapshot(): Snapshot }>;
  return atlas[micro ? '__ATLAS_MICRO__' : '__ATLAS_SCENE__'].snapshot();
}, micro);
async function capture(page: Page, name: string) {
  await mkdir(output, { recursive: true });
  await page.screenshot({ path: `${output}/UI-R3-${name}.png` });
}

test('Rinkaku tools preserve the canvas, GLB lease and exact paused pose', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/atlas/rinkaku?assets=lab');
  await expect(page.getByTestId('scene-status')).toHaveText('3D conectado');
  await page.getByTestId('asset-select').selectOption('fixture.rigged.v1');
  await expect(page.getByTestId('asset-status')).toContainText('GLB sintético integrado');
  await page.getByTestId('rinkaku-time').fill('0.88');
  const stage = page.getByTestId('stage');
  // Record the paused reference after the real renderer has applied the pose
  // and OrbitControls has settled through successive frames.
  const reference: { current?: Snapshot } = {};
  await expect.poll(async () => {
    const stable = await page.evaluate(async () => {
      const atlas = (window as unknown as Record<string, { snapshot(): Snapshot }>).__ATLAS_SCENE__;
      let previous = atlas.snapshot();
      for (let frame = 0; frame < 4; frame++) {
        await new Promise<number>((resolve) => requestAnimationFrame(resolve));
        const next = atlas.snapshot();
        if (next.frames <= previous.frames || next.camera.moving
          || next.rinkaku.t !== .88 || next.rinkaku.adapter?.t !== .88 || !next.rinkaku.adapter.positionHash
          || next.assets.activeId !== 'fixture.rigged.v1'
          || JSON.stringify(next.camera) !== JSON.stringify(previous.camera)) return undefined;
        previous = next;
      }
      return previous;
    });
    reference.current = stable;
    return Boolean(stable);
  }, { message: 'paused Rinkaku and the rigged fixture are rendered with a stable camera' }).toBe(true);
  const before = reference.current;
  if (!before) throw new Error('Missing rendered reference state.');
  const box = await stage.boundingBox();
  const canvas = await stage.locator('canvas').elementHandle();
  for (const kind of ['structures', 'layers', 'inspect', 'simulation'] as const) {
    await openBodyTool(page, kind);
    await expect(page.getByTestId('body-panel')).toBeVisible();
    const panel = (await page.getByTestId('body-panel').boundingBox())!;
    expect(panel.y + panel.height).toBeLessThanOrEqual(box!.y + box!.height);
    expect(await stage.boundingBox()).toEqual(box);
    if (kind === 'simulation') {
      await page.getByRole('button', { name: 'Ajuda', exact: true }).click();
      await expect(page.locator('.help-dialog:modal')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.help-dialog:modal')).toHaveCount(0);
      await expect(page.getByTestId('body-panel')).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('body-panel')).toHaveCount(0);
    const after = await snapshot(page);
    expect(after.camera).toEqual(before.camera);
    expect(after.assets).toEqual(before.assets);
    expect(after.rinkaku).toEqual(before.rinkaku);
    expect(await stage.locator('canvas').evaluate((element, original) => element === original, canvas)).toBe(true);
  }
  await canvas?.dispose();
});

test('Micro panels preserve identity, tracking camera and transport resources', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/atlas/vascular');
  await expect(page.getByTestId('micro-status')).toHaveText('3D conectado');
  await changeMicroSelect(page, 'micro-entity', 'rc:17:0');
  await page.getByTestId('micro-follow').click();
  await page.getByTestId('micro-time').fill('11.25');
  await expect.poll(async () => (await snapshot(page, true)).seconds).toBe(11.25);
  const stage = page.getByTestId('micro-stage');
  const box = await stage.boundingBox();
  const canvas = await stage.locator('canvas').elementHandle();
  const before = await snapshot(page, true);
  for (const kind of ['controls', 'inspect'] as const) {
    await openMicroTool(page, kind);
    const panel = (await page.getByTestId('micro-panel').boundingBox())!;
    expect(panel.y + panel.height).toBeLessThanOrEqual(box!.y + box!.height);
    expect(await stage.boundingBox()).toEqual(box);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('micro-panel')).toHaveCount(0);
    const after = await snapshot(page, true);
    expect(after.camera).toEqual(before.camera);
    expect(after.cameraMode).toBe('tracking');
    expect(after.selectedId).toBe('rc:17:0');
    expect(after.adapter.positionHash).toBe(before.adapter.positionHash);
    expect(after.adapter.resourceIds).toEqual(before.adapter.resourceIds);
    expect(await stage.locator('canvas').evaluate((element, original) => element === original, canvas)).toBe(true);
  }
  await openMicroTool(page, 'inspect');
  await page.getByTestId('micro-evidence').click();
  await expect(page.getByTestId('micro-inspector')).toContainText('HIPÓTESE VISUAL');
  await expect(page.getByTestId('micro-inspector')).toContainText('DESCONHECIDO');
  await page.getByTestId('canon-filter').check();
  await expect(page.getByTestId('micro-inspector').locator('.evidence-badge.hypothetical_model')).toHaveCount(0);
  await expect(page.getByTestId('micro-inspector')).toContainText('INTERPRETAÇÃO ARTÍSTICA');
  await page.getByTestId('canon-filter').uncheck();
  await capture(page, 'vascular-ficha-desktop');
  await closeStudyTool(page);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await snapshot(page, true)).cameraMode).toBe('free');
  await canvas?.dispose();
});

test('both studies use the desktop stage and retain contextual timelines', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const measurements = [];
  for (const mode of ['rinkaku', 'vascular'] as const) {
    await page.goto(`/atlas/${mode}`);
    const micro = mode === 'vascular';
    await expect(page.getByTestId(micro ? 'micro-status' : 'scene-status')).toHaveText('3D conectado');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await page.getByTestId(micro ? 'micro-time' : 'rinkaku-time').fill(micro ? '11.25' : '0.88');
    if (micro) {
      await changeMicroSelect(page, 'micro-entity', 'rc:17:0');
      await page.getByTestId('micro-follow').click();
    }
    const stage = (await page.getByTestId(micro ? 'micro-stage' : 'stage').boundingBox())!;
    expect(stage.width / 1440).toBeGreaterThanOrEqual(.65);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
    await expect(page.getByTestId('scan-toggle')).toHaveCount(0);
    await capture(page, `${mode}-desktop`);
    measurements.push({ mode, viewport: page.viewportSize(), stage });
  }
  await writeFile(`${output}/UI-R3-layout.json`, JSON.stringify(measurements, null, 2));
});

for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`studies on ${viewport.width}px keep modal focus and the exact selected pose`, async ({ browser }) => {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    try {
      for (const mode of ['rinkaku', 'vascular'] as const) {
        const micro = mode === 'vascular';
        await page.goto(`/atlas/${mode}`);
        await expect(page.getByTestId(micro ? 'micro-status' : 'scene-status')).toHaveText('3D conectado');
        await page.getByTestId(micro ? 'micro-time' : 'rinkaku-time').fill(micro ? '11.25' : '0.88');
        if (micro) {
          await changeMicroSelect(page, 'micro-entity', 'rc:17:0');
          await page.getByTestId('micro-follow').tap();
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        const stage = page.getByTestId(micro ? 'micro-stage' : 'stage');
        const box = await stage.boundingBox();
        expect(box!.height / viewport.height).toBeGreaterThanOrEqual(.549);
        expect(box!.height / viewport.height).toBeLessThanOrEqual(.65);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
        await expect(stage.locator('.study-disclosure')).toBeInViewport();
        await capture(page, `${mode}-${viewport.width}`);
        const before = await snapshot(page, micro);
        if (micro) await openMicroTool(page, 'inspect'); else await openBodyTool(page, 'simulation');
        const close = page.getByTestId(micro ? 'micro-panel-close' : 'body-panel-close');
        await expect(page.locator('dialog:modal')).toBeVisible();
        await expect(close).toBeFocused();
        if (micro) {
          await page.getByTestId('micro-evidence').tap();
          await expect(page.getByTestId('micro-inspector')).toContainText('HIPÓTESE VISUAL');
        } else {
          await page.locator('.rinkaku-evidence summary').tap();
          await expect(page.locator('.rinkaku-evidence .source-list a').first()).toHaveAttribute('href', /^https:\/\//);
        }
        await capture(page, `${mode}-ficha-${viewport.width}`);
        await page.keyboard.press('Escape');
        await expect(page.locator('dialog:modal')).toHaveCount(0);
        await expect(page.getByTestId(micro ? 'micro-inspector-toggle' : 'rinkaku-settings')).toBeFocused();
        expect((await stage.boundingBox())!.height).toBe(box!.height);
        const after = await snapshot(page, micro);
        expect(after.camera).toEqual(before.camera);
        expect(after.selectedId).toBe(before.selectedId);
        if (micro) expect(after.adapter.positionHash).toBe(before.adapter.positionHash);
        else expect(after.rinkaku).toEqual(before.rinkaku);
      }
    } finally { await page.close(); }
  });
}
