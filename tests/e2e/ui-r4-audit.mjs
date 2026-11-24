/** Run against the production preview with a locally supplied axe-core bundle. */
/* global window, document, innerWidth */
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

const option = (name) => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const axePath = option('axe');
if (!axePath) throw new Error('Supply --axe=/path/to/axe.min.js.');
const output = option('output') ?? 'artifacts/local/ui-r4-accessibility.json';
const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const report = {
  measuredAt: new Date().toISOString(), browser: browser.version(),
  axeSha256: createHash('sha256').update(await readFile(axePath)).digest('hex'),
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
  states: [],
};
await mkdir(dirname(output), { recursive: true });

async function inspect(page, viewport, route, state) {
  await page.evaluate(() => document.fonts.ready);
  if (!await page.evaluate(() => Boolean(window.axe))) await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async (tags) => {
    const audit = await window.axe.run(document, { runOnly: { type: 'tag', values: tags } });
    return {
      axeVersion: window.axe.version,
      violations: audit.violations.map(({ id, impact, help, nodes }) => ({ id, impact, help,
        nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })),
      incomplete: audit.incomplete.map(({ id, nodes }) => ({ id,
        nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })),
      passedRules: audit.passes.length,
      documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth,
    };
  }, report.tags);
  report.states.push({ viewport, route, state, ...result });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ width: viewport.width, route, state, violations: result.violations.map((v) => `${v.id} (${v.nodes.length})`), overflow: result.documentWidth > result.viewportWidth }));
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 430, height: 932 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    try {
      for (const route of ['/', '/estudos', '/fontes', '/atlas', '/atlas/rinkaku', '/atlas/vascular', '/atlas?webgl=off', '/atlas?catalog=missing', '/atlas/comparar', '/atlas/cell/rc%3A17%3A0']) {
        await page.goto(base + route);
        if (route.includes('webgl=off')) await page.getByTestId('scene-fallback').waitFor();
        else if (route.includes('catalog=missing')) await page.getByTestId('catalog-error').waitFor();
        else if (route === '/atlas/comparar' || route.startsWith('/atlas/cell/')) await page.getByRole('heading', { name: /indisponível/ }).waitFor();
        else if (route.startsWith('/atlas')) await page.getByTestId(route.endsWith('vascular') ? 'micro-status' : 'scene-status').filter({ hasText: 'Cena 3D pronta' }).waitFor();
        else await page.getByRole('heading', { level: 1 }).waitFor();
        if (route === '/fontes') await page.locator('.ga-source-library').waitFor();
        await inspect(page, viewport, route, 'rest');
        if (route === '/fontes') {
          await page.getByText('Registro de conferência', { exact: true }).first().click();
          await inspect(page, viewport, route, 'source-note');
        }
        if (route === '/atlas') {
          for (const tool of ['body-structures', 'body-layers', 'inspector-toggle']) {
            await page.getByTestId(tool).click();
            if (tool === 'inspector-toggle') await page.getByRole('tab', { name: /Evidências/ }).click();
            await inspect(page, viewport, route, tool);
            await page.getByTestId('body-panel-close').click();
          }
          await page.getByRole('button', { name: 'Ajuda', exact: true }).click();
          await inspect(page, viewport, route, 'help');
          await page.getByRole('button', { name: 'Fechar ajuda' }).click();
        }
        if (route.endsWith('rinkaku')) {
          await page.getByTestId('rinkaku-settings').click();
          await page.locator('.rinkaku-evidence summary').click();
          await inspect(page, viewport, route, 'simulation');
        }
        if (route.endsWith('vascular')) {
          await page.getByTestId('micro-controls-toggle').click();
          await inspect(page, viewport, route, 'controls');
          await page.getByTestId('micro-entity').selectOption('rc:17:0');
          await page.getByTestId('micro-panel-close').click();
          await page.getByTestId('micro-inspector-toggle').click();
          await page.getByTestId('micro-evidence').click();
          await inspect(page, viewport, route, 'evidence');
        }
      }
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
if (report.states.some(({ violations, documentWidth, viewportWidth }) => violations.length || documentWidth > viewportWidth)) process.exitCode = 1;
