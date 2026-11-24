import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { openBodyTool } from './body-tools';
import { changeMicroSelect, openMicroTool } from './study-tools';
import { evidenceRoot } from './evidence-path';

const output = `${evidenceRoot}/ui-r4`;
interface SceneState {
  camera: Record<string, unknown>; selectedId: string; layers: Record<string, boolean>;
  rinkaku: { t: number; playing: boolean; adapter: { positionHash: string; t: number } };
  adapter: { positionHash: string }; seconds: number; playing: boolean;
}
const read = (page: Page, micro = false) => page.evaluate((micro) => {
  const atlas = window as unknown as Record<string, { snapshot(): SceneState }>;
  const state = atlas[micro ? '__ATLAS_MICRO__' : '__ATLAS_SCENE__'].snapshot();
  return { camera: state.camera, selectedId: state.selectedId, layers: state.layers,
    time: micro ? state.seconds : state.rinkaku.t, playing: micro ? state.playing : state.rinkaku.playing,
    appliedTime: micro ? state.seconds : state.rinkaku.adapter?.t,
    pose: micro ? state.adapter.positionHash : state.rinkaku.adapter?.positionHash };
}, micro);
async function open(page: Page, mode: 'body' | 'rinkaku' | 'vascular') {
  await page.goto(mode === 'body' ? '/atlas?select=ghoul.kakuhou.rinkaku' : `/atlas/${mode}`);
  await expect(page.getByTestId(mode === 'vascular' ? 'micro-status' : 'scene-status')).toHaveText('3D conectado');
  if (mode === 'rinkaku') await expect.poll(async () => (await read(page)).pose).toBeTruthy();
}
async function capture(page: Page, name: string) {
  await mkdir(output, { recursive: true });
  await page.screenshot({ path: `${output}/UI-R4-${name}.png` });
}
async function verifyTimelineFocus(page: Page) {
  await page.keyboard.press('Tab');
  const range = page.getByTestId('rinkaku-time');
  await range.evaluate((element) => element.focus({ preventScroll: true }));
  const bounds = await range.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const outset = Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
    const scrubber = element.closest('.rinkaku-scrubber')!;
    const track = scrubber.querySelector<HTMLElement>('.rinkaku-phase-track')!;
    return { visible: element.matches(':focus-visible'), top: rect.top - outset, bottom: rect.bottom + outset,
      labelBottom: scrubber.querySelector('label')!.getBoundingClientRect().bottom,
      phaseTop: track.getClientRects().length ? track.getBoundingClientRect().top : null };
  });
  expect(bounds.visible).toBe(true);
  expect(bounds.top).toBeGreaterThanOrEqual(bounds.labelBottom - .5);
  if (bounds.phaseTop !== null) expect(bounds.bottom).toBeLessThanOrEqual(bounds.phaseTop + .5);
}

for (const mode of ['body', 'vascular'] as const) {
  test(`${mode} inspector tabs support arrows, Home, End and a single tab stop`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, mode);
    const micro = mode === 'vascular';
    if (micro) { await changeMicroSelect(page, 'micro-entity', 'rc:17:0'); await openMicroTool(page, 'inspect'); }
    else await openBodyTool(page, 'inspect');
    const before = await read(page, micro);
    const tabs = page.getByRole('tablist');
    const structure = tabs.getByRole('tab', { name: 'Estrutura', exact: true });
    const evidence = tabs.getByRole('tab', { name: /Evidências/ });
    await structure.focus();
    await page.keyboard.press('ArrowRight');
    await expect(evidence).toBeFocused();
    await expect(evidence).toHaveAttribute('aria-selected', 'true');
    await expect(structure).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('Home');
    await expect(structure).toBeFocused();
    await page.keyboard.press('End');
    await expect(evidence).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(structure).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(evidence).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tabpanel')).toBeFocused();
    expect(await read(page, micro)).toEqual(before);
    await capture(page, `${mode}-keyboard-desktop`);
  });
}

test('scene shortcuts can be disabled while native controls and contextual Escape remain available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await open(page, 'rinkaku');
  await page.getByTestId('rinkaku-time').fill('0.53');
  await expect.poll(async () => (await read(page)).appliedTime).toBeCloseTo(.53, 6);
  await page.getByRole('button', { name: 'Ajuda', exact: true }).click();
  await page.getByTestId('keyboard-shortcuts').uncheck();
  await capture(page, 'help-desktop');
  await page.keyboard.press('Escape');
  await page.locator('#workspace').focus();
  const before = await read(page);
  for (const key of ['r', '2', 'Space']) await page.keyboard.press(key);
  await expect(page).toHaveURL(/\/atlas\/rinkaku$/);
  expect(await read(page)).toEqual(before);
  await page.getByTestId('rinkaku-play').click();
  await expect.poll(async () => (await read(page)).time).toBeGreaterThan(.53);
  await page.getByTestId('rinkaku-play').click();
  await page.getByRole('button', { name: 'Ajuda', exact: true }).click();
  await page.getByTestId('keyboard-shortcuts').check();
  await page.keyboard.press('Escape');
  await page.locator('#workspace').focus();
  await page.keyboard.press('2');
  await expect(page.getByTestId('micro-status')).toHaveText('3D conectado');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/atlas\/rinkaku$/);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`${viewport.width}px sheets contain scrolling and keyboard focus while keeping each scene intact`, async ({ browser }) => {
    const page = await browser.newPage({ viewport, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    try {
      for (const mode of ['body', 'rinkaku', 'vascular'] as const) {
        const micro = mode === 'vascular';
        await open(page, mode);
        if (micro) {
          await changeMicroSelect(page, 'micro-entity', 'rc:17:0');
          await page.getByTestId('micro-time').fill('11.25');
          await page.getByTestId('micro-follow').tap();
        } else if (mode === 'rinkaku') {
          await page.getByTestId('rinkaku-time').fill('0.88');
          await expect.poll(async () => (await read(page)).appliedTime).toBeCloseTo(.88, 6);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        const stage = page.getByTestId(micro ? 'micro-stage' : 'stage');
        const bounds = await stage.boundingBox();
        const documentTop = bounds!.y + await page.evaluate(() => window.scrollY);
        const canvas = await stage.locator('canvas').elementHandle();
        await expect(page.getByTestId('observatory')).toHaveAttribute('data-reduced-motion', 'true');
        if (mode === 'rinkaku') await verifyTimelineFocus(page);
        await capture(page, `${mode === 'body' ? 'body-selected' : mode}-${viewport.width}`);
        const before = await read(page, micro);
        if (micro) await openMicroTool(page, 'inspect');
        else await openBodyTool(page, mode === 'rinkaku' ? 'simulation' : 'inspect');
        const dialog = page.locator('dialog:modal');
        const close = page.getByTestId(micro ? 'micro-panel-close' : 'body-panel-close');
        await expect(close).toBeFocused();
        if (mode === 'rinkaku') {
          await expect(page.getByTestId('rinkaku-count')).toHaveCSS('font-size', '16px');
          await page.locator('.rinkaku-evidence summary').tap();
        } else {
          await dialog.getByRole('tab', { name: 'Estrutura', exact: true }).focus();
          await page.keyboard.press('End');
        }
        await close.focus();
        await page.keyboard.press('Shift+Tab');
        expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
        await page.keyboard.press('Tab');
        await expect(close).toBeFocused();
        const scroll = await page.evaluate(() => window.scrollY);
        await page.mouse.move(5, 5);
        await page.mouse.wheel(0, 500);
        expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
        for (let step = 0; step < 12; step++) {
          await page.keyboard.press('Tab');
          expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
        }
        await capture(page, `${mode}-sheet-${viewport.width}`);
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        const returned = (await stage.boundingBox())!;
        expect({ x: returned.x, width: returned.width, height: returned.height }).toEqual({ x: bounds!.x, width: bounds!.width, height: bounds!.height });
        expect(returned.y + await page.evaluate(() => window.scrollY)).toBe(documentTop);
        expect(await read(page, micro)).toEqual(before);
        expect(await stage.locator('canvas').evaluate((element, original) => element === original, canvas)).toBe(true);
        if (mode !== 'body') {
          const range = page.getByTestId(micro ? 'micro-time' : 'rinkaku-time');
          expect((await range.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
        await canvas?.dispose();
      }
      await page.goto('/atlas');
      await expect(page.getByTestId('scene-status')).toHaveText('3D conectado');
      await capture(page, `body-${viewport.width}`);
      await page.getByRole('button', { name: 'Ajuda', exact: true }).tap();
      const help = (await page.locator('.help-dialog').boundingBox())!;
      expect(help.y).toBeGreaterThanOrEqual(0);
      expect(help.y + help.height).toBeLessThanOrEqual(viewport.height);
      const closeHelp = page.getByRole('button', { name: 'Fechar ajuda' });
      await closeHelp.focus();
      await page.keyboard.press('Shift+Tab');
      await expect(page.getByRole('button', { name: 'Fechar guia' })).toBeFocused();
      expect((await page.getByRole('button', { name: 'Fechar guia' }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await page.keyboard.press('Tab');
      await expect(closeHelp).toBeFocused();
      await capture(page, `help-${viewport.width}`);
    } finally { await page.close(); }
  });
}

test('mobile menu dismissal takes priority over scene reset and closes on an outside pointer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 'body');
  const before = await read(page);
  const menu = page.locator('.ga-header-menu');
  const summary = menu.locator('summary');
  await summary.click();
  await page.getByTestId('stage').locator('canvas').focus();
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
  expect(await read(page)).toEqual(before);
  await summary.click();
  await page.getByRole('heading', { level: 1 }).click();
  await expect(menu).not.toHaveAttribute('open');
});

test('reflow, landscape and forced colors retain reachable controls', async ({ browser }) => {
  const measurements = [];
  for (const viewport of [{ width: 320, height: 568 }, { width: 720, height: 450 }, { width: 844, height: 390 }]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: viewport.width === 720 ? 2 : 1, reducedMotion: 'reduce' });
    try {
      for (const mode of ['body', 'rinkaku', 'vascular'] as const) {
        await open(page, mode);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
        measurements.push({ viewport, mode, pageWidth: await page.evaluate(() => document.documentElement.scrollWidth) });
      }
    } finally { await page.close(); }
  }
  const page = await browser.newPage({ forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await open(page, 'body');
    await openBodyTool(page, 'inspect');
    await page.getByRole('tab', { name: 'Estrutura', exact: true }).focus();
    await expect(page.getByRole('tab', { name: 'Estrutura', exact: true })).toHaveCSS('outline-style', 'solid');
    await capture(page, 'forced-colors');
  } finally { await page.close(); }
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/UI-R4-reflow.json`, JSON.stringify({ measurements, note: '720×450 CSS px at DPR2 exercises the layout equivalent to a 1440×900 viewport at 200%; no physical phone measured.' }, null, 2));
});

test('desktop captures retain the approved anatomical and temporal states', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const measurements = [];
  for (const mode of ['body', 'rinkaku', 'vascular'] as const) {
    await page.goto(mode === 'body' ? '/atlas' : `/atlas/${mode}`);
    const micro = mode === 'vascular';
    await expect(page.getByTestId(micro ? 'micro-status' : 'scene-status')).toHaveText('3D conectado');
    if (micro) {
      await changeMicroSelect(page, 'micro-entity', 'rc:17:0');
      await page.getByTestId('micro-time').fill('11.25');
      await page.getByTestId('micro-follow').click();
    } else if (mode === 'rinkaku') {
      await page.getByTestId('rinkaku-time').fill('0.88');
      await expect.poll(async () => (await read(page)).appliedTime).toBeCloseTo(.88, 6);
      await expect(page.getByRole('group', { name: 'Reprodução da manifestação', exact: true })).toBeVisible();
      await verifyTimelineFocus(page);
    }
    const bounds = (await page.getByTestId(micro ? 'micro-stage' : 'stage').boundingBox())!;
    expect(bounds.width / 1440).toBeGreaterThanOrEqual(.65);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);
    await capture(page, `${mode}-desktop`);
    measurements.push({ mode, viewport: page.viewportSize(), bounds, state: await read(page, micro) });
  }
  await writeFile(`${output}/UI-R4-layout.json`, JSON.stringify(measurements, null, 2));
});

test('skip navigation focuses real content on mobile and during catalog failure', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const failure of [false, true]) {
    await page.goto(failure ? '/atlas?catalog=missing' : '/atlas');
    await expect(page.getByTestId(failure ? 'catalog-error' : 'scene-status')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Ir para o observatório' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator(failure ? '#catalog-status' : '#workspace')).toBeFocused();
    if (failure) {
      await page.getByTestId('catalog-retry').click();
      await expect(page.getByTestId('scene-status')).toHaveText('3D conectado');
    }
  }
});
