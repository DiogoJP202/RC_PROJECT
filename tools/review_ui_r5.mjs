/* global window, document, innerWidth, HTMLCanvasElement */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const directory = process.env.ATLAS_REVIEW_OUTPUT ?? 'artifacts/local/ui-r5/review';
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
const report = { measuredAt: new Date().toISOString(), browser: browser.version(), captures: [], home: [] };
const sizes = [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 430, height: 932 }];
await mkdir(directory, { recursive: true });

try {
  for (const viewport of sizes) {
    const desktop = viewport.width === 1440;
    const label = desktop ? 'desktop' : String(viewport.width);
    const page = await browser.newPage({ viewport, isMobile: !desktop, hasTouch: !desktop, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const go = async (route) => assert.equal((await page.goto(base + route))?.status(), 200);
    const ready = async (micro = false) => expect(page.getByTestId(micro ? 'micro-status' : 'scene-status')).toHaveText('Cena 3D pronta');
    const picture = async (name, fullPage = false) => {
      await page.evaluate(() => document.fonts.ready);
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.equal(width, viewport.width, name);
      const file = `UI-R5-${name}-${label}.png`;
      await page.screenshot({ path: `${directory}/${file}`, fullPage });
      report.captures.push({ file, route: page.url().slice(base.length), viewport, fullPage });
    };
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      window.webglRequests = 0;
      HTMLCanvasElement.prototype.getContext = function (type, ...options) {
        if (/webgl/i.test(type)) window.webglRequests++;
        return Reflect.apply(original, this, [type, ...options]);
      };
    });
    await go('/');
    await page.locator('.ga-hero picture img').evaluate((img) => img.decode());
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('link', { name: 'Abrir observatório', exact: true })).toBeInViewport();
    const readHome = () => page.evaluate(() => {
      const resources = performance.getEntriesByType('resource').map(({ name, transferSize }) => ({
        file: new URL(name).pathname, transferSize,
      }));
      return {
        width: innerWidth, webgl: window.webglRequests,
        bytes: performance.getEntriesByType('navigation')[0].transferSize + resources.reduce((sum, item) => sum + item.transferSize, 0),
        resources, hero: new URL(document.querySelector('.ga-hero img').currentSrc).pathname,
      };
    });
    const home = await readHome();
    assert.equal(home.webgl, 0);
    assert.ok(home.bytes <= 500 * 1024, `Home transferred ${home.bytes}`);
    assert.match(home.hero, desktop ? /rinkaku-wide\.webp$/ : /rinkaku-portrait\.webp$/);
    assert.ok(!home.resources.some(({ file }) => /catalog\.json|\.glb$|ObservatoryScene|VascularScene|RinkakuScene|AtlasWorkspace|three\.core/.test(file)));
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/share\.jpg$/);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
    const brandMedia = {
      'favicon.svg': 'image/svg+xml', 'icon-16.png': 'image/png', 'icon-32.png': 'image/png',
      'icon-180.png': 'image/png', 'icon-512.png': 'image/png', 'share.jpg': 'image/jpeg',
    };
    for (const [file, mime] of Object.entries(brandMedia)) {
      const media = await page.request.get(`${base}/assets/ui-r5/${file}`);
      assert.ok(media.ok(), file);
      assert.equal(media.headers()['content-type']?.split(';')[0], mime, file);
    }
    await picture('home');
    await page.locator('.ga-study-art img').last().scrollIntoViewIfNeeded();
    await page.locator('.ga-study-art img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    await page.evaluate(() => window.scrollTo(0, 0));
    const withStudies = await readHome();
    assert.equal(withStudies.webgl, 0);
    assert.ok(withStudies.bytes <= 500 * 1024, `Home and studies transferred ${withStudies.bytes}`);
    report.home.push({ ...home, withStudies });
    await picture('home-integral', true);
    await go('/estudos');
    await page.locator('.ga-study-art img').last().scrollIntoViewIfNeeded();
    await page.locator('.ga-study-art img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    await page.evaluate(() => window.scrollTo(0, 0));
    await picture('estudos', true);
    await go('/fontes');
    await page.locator('.ga-source-library').waitFor();
    await picture('fontes');
    if (desktop) {
      await page.getByRole('link', { name: 'Ir às referências' }).click();
      await page.getByText('Registro de conferência', { exact: true }).first().click();
      await picture('referencias');
    }
    await go('/atlas');
    await ready();
    await picture('corpo');
    await page.getByTestId('body-layers').click();
    await picture('camadas');
    await page.getByTestId('body-panel-close').click();
    await go('/atlas?select=ghoul.kakuhou.rinkaku');
    await ready();
    await page.getByTestId('inspector-toggle').click();
    await page.getByRole('tab', { name: /Evidências/ }).click();
    await picture('ficha');
    await go('/atlas/rinkaku');
    await ready();
    await page.getByTestId('rinkaku-time').fill('0.88');
    await expect.poll(() => page.evaluate(() => window.__ATLAS_SCENE__?.snapshot().rinkaku.adapter?.t)).toBeCloseTo(.88, 6);
    await page.evaluate(() => window.scrollTo(0, 0));
    await picture('rinkaku');
    await page.getByTestId('rinkaku-settings').click();
    await picture('simulacao');
    await go('/atlas/vascular');
    await ready(true);
    await page.getByTestId('micro-controls-toggle').click();
    await picture('micro-controles');
    await page.getByTestId('micro-entity').selectOption('rc:17:0');
    await page.getByTestId('micro-panel-close').click();
    await page.getByTestId('micro-time').fill('11.25');
    await page.getByTestId('micro-follow').click();
    await expect(page.getByTestId('micro-follow')).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => window.scrollTo(0, 0));
    await picture('micro');
    await page.getByTestId('micro-inspector-toggle').click();
    await page.getByTestId('micro-evidence').click();
    await picture('micro-ficha');
    await go('/atlas/comparar');
    await expect(page.getByRole('heading', { name: 'Comparação indisponível' })).toBeVisible();
    assert.equal(await page.locator('canvas').count(), 0);
    await picture('comparar');
    await go('/atlas/cell/rc%3A17%3A0');
    await expect(page.getByRole('heading', { name: 'Inspeção celular indisponível' })).toBeVisible();
    await expect(page.locator('#editorial-route')).toHaveCSS('background-color', 'rgb(16, 13, 17)');
    const cellPage = await page.locator('#editorial-route').boundingBox();
    assert.ok(cellPage.height >= viewport.height, 'Cell status fills the viewport');
    await picture('celular');
    await go('/atlas?webgl=off');
    await page.getByTestId('scene-fallback').waitFor();
    await picture('fallback');
    await page.getByRole('button', { name: 'Ajuda', exact: true }).click();
    await picture('ajuda');
    await go('/atlas?catalog=missing');
    await page.getByTestId('catalog-error').waitFor();
    await picture('erro-catalogo');
    assert.deepEqual(errors, []);
    await page.close();
    console.log(JSON.stringify({ viewport, homeBytes: home.bytes, captures: report.captures.length }));
    await writeFile(`${directory}/review.json`, JSON.stringify(report, null, 2) + '\n');
  }
} finally {
  await browser.close();
}
