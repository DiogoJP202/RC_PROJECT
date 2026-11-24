/* global document */
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const output = 'public/assets/ui-r5';
const origin = process.env.ATLAS_ART_URL ?? 'http://127.0.0.1:5175';
const mark = await readFile(`${output}/mark.svg`, 'utf8');
const markPaths = mark.slice(mark.indexOf('<path'), mark.lastIndexOf('</svg>'));
const plex = await readFile('public/assets/fonts/IBMPlexSansCondensed-SemiBold-Latin1.woff2', 'base64');
const font = `@font-face{font-family:AtlasPlex;src:url(data:font/woff2;base64,${plex}) format('woff2');font-weight:600}`;
await writeFile(`${output}/signature.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 288 64">
  <title>Ghoul Atlas — assinatura horizontal</title>
  <style>${font}</style>
  <g>${markPaths}</g>
  <text x="77" y="44" font-family="AtlasPlex, system-ui, sans-serif" font-size="38" font-weight="600" fill="#F0EBE4">Ghoul Atlas</text>
</svg>\n`);

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
try {
  const page = await browser.newPage();
  for (const size of [16, 32, 180, 512]) {
    await page.setViewportSize({ width: size, height: size });
    const art = size <= 32
      ? `<img src="${origin}/assets/ui-r5/favicon.svg" width="${size}" height="${size}" alt="">`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="13" fill="#100D11"/><g transform="translate(6.4 6.4) scale(.8)">${markPaths}</g></svg>`;
    await page.setContent(`<style>html,body{margin:0}svg,img{display:block;width:100%;height:100%}</style>${art}`);
    await page.locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    await page.screenshot({ path: `${output}/icon-${size}.png`, omitBackground: true });
  }
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    ${font}
    *{box-sizing:border-box}body{margin:0;background:#100D11;color:#F0EBE4;font:24px/1.35 system-ui}
    main{position:relative;height:630px;padding:68px;isolation:isolate}
    .scene{position:absolute;inset:0 0 0 auto;width:76%;height:100%;object-fit:cover;mask-image:linear-gradient(to right,transparent,#000 34%);z-index:-1}
    .brand{display:flex;align-items:center;gap:12px;font:600 30px AtlasPlex,sans-serif}.brand img{width:53px;height:53px}
    h1{font:600 72px/.97 AtlasPlex,sans-serif;letter-spacing:-.04em;margin:72px 0 20px}
    h1 span{display:block;color:#E47784}p{max-width:350px;color:#B7AEB6;margin:0}
    small{color:#DAB47C;position:absolute;bottom:40px;left:68px}
    </style><main>
      <img class="scene" src="${origin}/assets/ui-r5/rinkaku-wide.webp" alt="">
      <div class="brand"><img src="${origin}/assets/ui-r5/mark.svg" alt="">Ghoul Atlas</div>
      <h1>Atlas anatômico <span>ghoul</span></h1>
      <p>Kakuhou, Rinkaku e transporte de células RC.</p><small>Modelo conceitual</small>
    </main>`);
  await page.locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${output}/share.jpg`, type: 'jpeg', quality: 87 });
} finally {
  await browser.close();
}
