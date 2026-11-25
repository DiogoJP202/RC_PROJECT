import { expect, test, type Page } from '@playwright/test';

type Pose = { position: number[]; target: number[]; up: number[]; quaternion: number[] };
type MicroSnapshot = {
  seconds: number; playing: boolean; selectedId: string; highlightRC: boolean; cameraMode: string; config: { count: number; seed: number };
  camera: Pose; adapter: { positionHash: string; resourceIds: unknown };
  inspectionReturn: { first: (Pose & { controls: { target: number[] } }) | null; seconds: number; frames: number };
  metrics: { frames: number };
};

function snapshot(page: Page) {
  return page.evaluate(() => window.__ATLAS_MICRO__?.snapshot() as unknown as MicroSnapshot);
}
function assertPose(expected: Pose, actual: Pose) {
  for (const key of ['position', 'target', 'up'] as const) {
    expect(Math.hypot(...actual[key].map((value, i) => value - expected[key][i])), key).toBeLessThanOrEqual(1e-7);
  }
  expect(1 - Math.abs(actual.quaternion.reduce((sum, value, i) => sum + value * expected.quaternion[i], 0))).toBeLessThanOrEqual(1e-12);
}
async function enter(page: Page) {
  await page.goto('/atlas');
  await expect(page.getByTestId('scene-status')).toHaveText('Cena 3D pronta');
  await page.getByTestId('mode-micro').click();
  await expect(page.getByTestId('micro-status')).toHaveText('Cena 3D pronta');
  await page.getByTestId('micro-controls-toggle').click();
  await page.getByTestId('micro-entity').selectOption('rc:17:0');
  if (await page.getByTestId('micro-panel-close').count()) await page.getByTestId('micro-panel-close').click();
  return page.getByTestId('micro-inspect-cell');
}

test('ten complete inspections hold the actual first vascular frame across tracking, flow and free views', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const inspect = await enter(page);
  const canvas = await page.getByTestId('micro-stage').locator('canvas').elementHandle();
  const cellular = page.getByTestId('cell-stage');
  const runs = [];
  for (let i = 0; i < 10; i++) {
    const mode = ['tracking', 'free', 'flow'][i % 3];
    if (mode === 'tracking') {
      if ((await snapshot(page)).cameraMode !== 'tracking') await page.getByTestId('micro-follow').click();
    } else await page.getByTestId('micro-camera-' + mode).click();
    await page.getByTestId('micro-time').fill(String(8 + i));
    if (mode !== 'free') {
      await page.getByTestId('micro-play').click();
      await expect.poll(async () => (await snapshot(page)).seconds).toBeGreaterThan(8.16 + i);
    } else {
      const stage = page.getByTestId('micro-stage').locator('canvas');
      await stage.focus();
      await page.keyboard.press('ArrowLeft');
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    }
    const before = await page.evaluate(() => {
      const sample = window.__ATLAS_MICRO__!.snapshot() as unknown as MicroSnapshot;
      const button = document.querySelector<HTMLButtonElement>('[data-testid="micro-inspect-cell"]')!;
      button.click();
      button.click();
      return sample;
    });
    await expect(cellular).toBeVisible();
    await expect(page.getByTestId('cell-status')).toHaveText('Cena 3D pronta');
    const parked = await snapshot(page);
    expect(parked.seconds).toBe(before.seconds);
    expect(parked.playing).toBe(false);
    expect(parked.adapter.positionHash).toBe(before.adapter.positionHash);
    await page.getByTestId('cell-compare').click();
    await expect(page.getByRole('heading', { name: 'Comparação morfológica' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Observatório celular' })).toBeVisible();
    if (i % 2) await page.goBack(); else await page.getByTestId('cell-return').click();
    await expect(page).toHaveURL(/\/atlas\/vascular$/);
    await expect(inspect).toBeFocused();
    await expect.poll(async () => (await snapshot(page)).inspectionReturn.frames).toBeGreaterThanOrEqual(parked.metrics.frames + 1);
    const after = await snapshot(page);
    const first = after.inspectionReturn.first!;
    expect(after.inspectionReturn.seconds).toBe(before.seconds);
    expect(after.seconds).toBe(before.seconds);
    expect(after.playing).toBe(false);
    expect(after.selectedId).toBe(before.selectedId);
    expect(after.cameraMode).toBe(mode);
    expect(after.config).toEqual(before.config);
    expect(after.highlightRC).toBe(before.highlightRC);
    expect(after.adapter.resourceIds).toEqual(before.adapter.resourceIds);
    expect(after.adapter.positionHash).toBe(before.adapter.positionHash);
    assertPose(before.camera, { ...first, target: first.controls.target });
    assertPose(before.camera, after.camera);
    expect(await page.getByTestId('micro-stage').locator('canvas').evaluate((element, original) => element === original, canvas)).toBe(true);
    await expect.poll(() => page.evaluate(() => window.__ATLAS_CELL_RESOURCES__?.().active)).toBe(0);
    runs.push({ mode, seconds: before.seconds, firstFrame: after.inspectionReturn.frames - parked.metrics.frames });
  }
  const resources = await page.evaluate(() => window.__ATLAS_CELL_RESOURCES__?.());
  expect(resources?.created).toBeGreaterThanOrEqual(10);
  expect(resources?.created).toBe(resources?.disposed);
  expect(runs.every(({ firstFrame }) => firstFrame === 1)).toBe(true);
  console.log('G4B round trips', JSON.stringify({ runs, resources }));
  await page.getByTestId('micro-return').click();
  await expect(page).toHaveURL(/\/atlas$/);
  await expect(page.getByTestId('scene-status')).toHaveText('Cena 3D pronta');
  expect(errors).toEqual([]);
});

test('cut, picking, zoom, comparative views and evidence stay contextual on desktop', async ({ page }) => {
  await page.goto('/atlas/cell/rc%3A31%3A8');
  const stage = page.getByTestId('cell-stage');
  await expect(page.getByTestId('cell-status')).toHaveText('Cena 3D pronta');
  await expect(page.getByRole('button', { name: 'Superfície', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const original = await page.evaluate(() => window.__ATLAS_CELL__?.().camera);
  const canvas = stage.locator('canvas');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 38, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__ATLAS_CELL__?.().camera)).not.toEqual(original);
  await page.getByRole('button', { name: 'Vista', exact: true }).click();
  const orbit = await page.evaluate(() => window.__ATLAS_CELL__?.().camera);
  await page.getByRole('button', { name: 'Aproximar' }).click();
  await expect.poll(() => page.evaluate(() => window.__ATLAS_CELL__?.().camera)).not.toEqual(orbit);
  await page.keyboard.press('Escape');
  await page.getByLabel('Representação').selectOption('schematic');
  await page.getByRole('button', { name: 'Corte', exact: true }).click();
  await page.getByRole('button', { name: 'X', exact: true }).click();
  await page.getByTestId('cell-cut-position').fill('0.18');
  await expect.poll(() => page.evaluate(() => window.__ATLAS_CELL__?.().surface?.contourVertices)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(stage).toHaveAttribute('data-selection', 'section');
  await page.getByRole('button', { name: 'Superfície', exact: true }).click();
  await page.getByTestId('cell-compare').click();
  await expect.poll(() => page.evaluate(() => window.__ATLAS_CELL__?.().surface?.bounds.filter((part) => part.visible).length)).toBe(2);
  await page.mouse.click(box.x + box.width * .735, box.y + box.height / 2);
  await expect(stage).toHaveAttribute('data-selection', 'rbc');
  await page.getByRole('button', { name: 'Ficha', exact: true }).click();
  await expect(page.getByText('Disco bicôncavo.', { exact: false })).toBeVisible();
  await page.getByRole('tab', { name: 'Evidências' }).click();
  await expect(page.getByRole('link', { name: /OpenStax/ })).toBeVisible();
  await page.getByTestId('canon-filter').check();
  await expect(page.getByText('A geometria é uma reconstrução conceitual.', { exact: false })).toBeVisible();
  await page.getByTestId('canon-filter').uncheck();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Observatório celular' })).toBeVisible();
  await page.getByTestId('cell-return').click();
  await expect(page.getByTestId('micro-selection')).toContainText('rc:31:8');
});

test('history re-captures a new vascular frame and a reloaded cell returns safely by route', async ({ page }) => {
  const inspect = await enter(page);
  await page.getByTestId('micro-time').fill('9');
  await inspect.click();
  await expect(page.getByTestId('cell-status')).toHaveText('Cena 3D pronta');
  await page.goBack();
  await expect(inspect).toBeVisible();
  await page.getByTestId('micro-time').fill('17.5');
  await page.goForward();
  await expect(page.getByTestId('cell-status')).toHaveText('Cena 3D pronta');
  await page.getByTestId('cell-return').click();
  await expect(page.getByTestId('micro-time')).toHaveValue('17.5');
  await inspect.click();
  await expect(page.getByTestId('cell-status')).toHaveText('Cena 3D pronta');
  await page.reload();
  await expect(page.getByText(/acesso direto/i).first()).toBeVisible();
  await page.getByTestId('cell-return').click();
  await expect(page.getByTestId('micro-time')).toHaveValue('0');
});

test('pending lazy entry can be cancelled and context loss has a textual recovery path', async ({ page }) => {
  const inspect = await enter(page);
  let release = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/CellWorkspace-*.js', async (route) => { await gate; await route.continue().catch(() => {}); });
  await inspect.click();
  await expect(page).toHaveURL(/\/atlas\/cell\//);
  await page.goBack();
  release();
  await expect(inspect).toBeFocused();
  await inspect.click();
  await expect(page.getByTestId('cell-status')).toHaveText('Cena 3D pronta');
  await page.getByTestId('cell-stage').locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(page.getByRole('heading', { name: 'Visualização 3D indisponível' })).toBeVisible();
  await page.getByRole('button', { name: 'Ficha', exact: true }).click();
  await page.getByRole('tab', { name: 'Evidências' }).click();
  await expect(page.getByText(/células RC acumuladas no kakuhou/)).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByTestId('cell-retry').click();
  await expect(page.getByTestId('cell-status')).toHaveText('Cena 3D pronta');
  await page.getByTestId('cell-return').click();
  await expect(inspect).toBeFocused();
});

for (const width of [390, 430]) {
  test(`${width}px comparison alternates subjects, keeps keyboard sheets and reduced motion`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 932 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    try {
      await page.goto('/atlas/cell/rc%3A17%3A0');
      await expect(page.getByTestId('cell-status')).toHaveText('Cena 3D pronta');
      await page.getByTestId('cell-compare').tap();
      const hemacia = page.getByRole('button', { name: 'Hemácia humana', exact: true });
      const camera = await page.evaluate(() => window.__ATLAS_CELL__?.().camera);
      await hemacia.tap();
      await expect(hemacia).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(() => page.evaluate(() => window.__ATLAS_CELL__?.().surface?.bounds.filter((part) => part.visible).length)).toBe(1);
      expect(await page.evaluate(() => window.__ATLAS_CELL__?.().camera)).toEqual(camera);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await page.getByRole('button', { name: 'Ficha', exact: true }).tap();
      await expect(page.getByRole('dialog', { name: 'Ficha celular' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Ficha', exact: true })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('heading', { name: 'Observatório celular' })).toBeVisible();
    } finally { await page.close(); }
  });
}
