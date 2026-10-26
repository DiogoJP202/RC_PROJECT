// Real production UI captures only. No state/pose/camera injection or external renders.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const output = path.resolve('artifacts/gates/G4A-review');
const gates = path.resolve('artifacts/gates');
const url = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
for (const folder of ['', 'sequence', 'recording']) await fs.mkdir(path.join(output, folder), { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
  args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
const runtime = { errors: [], warnings: [], failedRequests: [] }, captures = [];
function monitor(page) {
  page.on('pageerror', (error) => runtime.errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') runtime.errors.push(message.text()); if (message.type() === 'warning') runtime.warnings.push(message.text()); });
  page.on('requestfailed', (request) => { const failure = request.failure()?.errorText ?? ''; if (!failure.includes('ERR_ABORTED')) runtime.failedRequests.push({ url: request.url(), failure }); });
}
const settle = (page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const micro = (page) => page.evaluate(() => {
  const value = window.__ATLAS_MICRO__.snapshot();
  const { particles, ...state } = value;
  return { ...state, particleCount: particles.length };
});
async function open(page) {
  monitor(page); await page.goto(url, { waitUntil: 'load' });
  await page.getByTestId('scene-status').filter({ hasText: '3D conectado' }).waitFor();
}
async function enter(page) {
  await page.getByTestId('micro-entry').click();
  await page.getByTestId('micro-status').filter({ hasText: '3D conectado' }).waitFor();
  await page.waitForFunction(() => Boolean(window.__ATLAS_MICRO__?.snapshot().adapter)); await settle(page);
}
async function scrub(page, seconds) {
  await page.getByTestId('micro-time').fill(String(seconds));
  await page.waitForFunction((seconds) => Math.abs(window.__ATLAS_MICRO__.snapshot().adapter.seconds - seconds) < 1e-6, seconds);
  await settle(page);
}
async function select(page, kind) {
  const id = await page.evaluate((kind) => window.__ATLAS_MICRO__.snapshot().particles.find((entity) => entity.kind === kind)?.id, kind);
  if (!id) throw new Error(`Missing ${kind} entity`);
  await page.getByTestId('micro-entity').selectOption(id);
  await page.waitForFunction((id) => window.__ATLAS_MICRO__.snapshot().selectedId === id, id);
  return id;
}
async function follow(page) {
  const state = await micro(page);
  if (state.cameraMode !== 'tracking') await page.getByTestId('micro-follow').click();
  await page.waitForFunction(() => window.__ATLAS_MICRO__.snapshot().cameraMode === 'tracking'); await settle(page);
}
async function capture(page, file, label, stageOnly = false, body = false) {
  const destination = file.startsWith('G4A-') ? path.join(gates, file) : path.join(output, file);
  const before = body ? await page.evaluate(() => window.__ATLAS_SCENE__.snapshot()) : await micro(page);
  const stage = page.getByTestId(body ? 'stage' : 'micro-stage');
  const rect = await stage.boundingBox();
  const bytes = stageOnly ? await stage.screenshot({ path: destination }) : await page.screenshot({ path: destination });
  const after = body ? null : await micro(page);
  const record = { file: path.relative(path.resolve('.'), destination).replaceAll('\\', '/'), label, captureArea: stageOnly ? 'stage' : 'viewport',
    viewport: page.viewportSize(), stageRect: rect, sha256: sha(bytes), state: before, secondsAfter: after?.seconds ?? null,
    note: before.playing ? 'Actual automatic playback; time can advance during screenshot.' : 'Actual static pose through UI scrub/reduced motion.' };
  captures.push(record); return record;
}

try {
  const staticContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await staticContext.newPage(); await open(page);
  await capture(page, 'G4A-entry.png', 'Body · região vascular aproximada e entrada real', false, true);
  await enter(page); await scrub(page, 4);
  await capture(page, 'G4A-vessel-overview.png', 'Visão interna · circuito didático');
  const rbcId = await select(page, 'rbc'); await scrub(page, 11); await follow(page);
  await capture(page, 'G4A-rbc-closeup.png', 'Hemácia bicôncava · inspeção estática');
  const rcId = await select(page, 'rc'); await scrub(page, 11); await follow(page);
  await capture(page, 'G4A-rc-closeup.png', 'RC original · interpretação visual');
  await page.getByTestId('micro-highlight').check();
  await capture(page, 'G4A-rc-selected.png', 'Identidade RC selecionada · realce didático');
  const revisit = await micro(page);
  for (const seconds of [3, 27, 6, 11]) await scrub(page, seconds);
  const repeat = await micro(page);
  if (revisit.adapter.positionHash !== repeat.adapter.positionHash) throw new Error('Same absolute pose did not repeat after arbitrary UI scrubbing.');
  const sequence = [];
  for (const seconds of [0, 5, 10, 15, 20, 25, 30, 35]) {
    await scrub(page, seconds); await follow(page);
    sequence.push(await capture(page, `sequence/tracking-t${String(seconds).padStart(2, '0')}.png`, `Tracking RC · ${seconds}s de animação`, true));
  }
  await staticContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  const mobile = await mobileContext.newPage(); await open(mobile); await enter(mobile);
  await select(mobile, 'rc'); await follow(mobile); await mobile.getByTestId('micro-play').tap();
  await mobile.waitForTimeout(1200); await mobile.getByTestId('micro-stage').scrollIntoViewIfNeeded();
  const mobileCapture = await capture(mobile, 'G4A-mobile.png', 'Mobile390 · tracking em reprodução real');
  if (!mobileCapture.state.playing) throw new Error('Mobile screenshot must show actual running playback.');
  const mobileLayout = await mobile.evaluate(() => ({ viewport: innerWidth, documentWidth: document.documentElement.scrollWidth }));
  await mobile.getByTestId('micro-play').tap(); await mobile.getByTestId('micro-time').scrollIntoViewIfNeeded();
  await capture(mobile, 'mobile-controls.png', 'Mobile · controles de reprodução acessíveis');
  await mobile.getByTestId('micro-inspector').scrollIntoViewIfNeeded(); await mobile.getByTestId('micro-evidence').tap();
  await capture(mobile, 'mobile-evidence.png', 'Mobile · identidade e classes de evidência');
  await mobileContext.close();

  const videoContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference',
    recordVideo: { dir: path.join(output, 'recording'), size: { width: 1440, height: 900 } } });
  const live = await videoContext.newPage(), video = live.video(); await open(live); await enter(live);
  await select(live, 'rc'); await follow(live); await scrub(live, 0); await live.getByTestId('micro-play').click();
  const started = Date.now(), samples = [];
  let trackingCapture = null;
  while (Date.now() - started < 42_000) {
    const current = await micro(live);
    samples.push({ wallElapsedMs: Date.now() - started, seconds: current.seconds, selectedId: current.selectedId, cameraMode: current.cameraMode,
      camera: current.camera, positionHash: current.adapter.positionHash, metrics: current.metrics });
    if (!current.playing || current.cameraMode !== 'tracking' || current.selectedId !== rcId) throw new Error('Video lost the actual tracking/playback identity.');
    if (!trackingCapture && Date.now() - started > 4000) trackingCapture = await capture(live, 'G4A-cell-tracking.png', 'Tracking RC · reprodução real');
    await live.waitForTimeout(500);
  }
  const final = await micro(live); await live.getByTestId('micro-play').click(); await videoContext.close();
  await fs.rename(await video.path(), path.join(output, 'flow-and-tracking.webm'));
  await fs.rmdir(path.join(output, 'recording'));
  const result = { createdAt: new Date().toISOString(), target: url, browser: browser.version(), build: 'Production preview; actual UI, no external or generated renders.',
    captures, selectedExamples: { rbcId, rcId }, mobileLayout,
    revisit: { sameT: 11, sequence: [11, 3, 27, 6, 11], samePositionHash: revisit.adapter.positionHash === repeat.adapter.positionHash },
    sequenceFiles: sequence.map((item) => item.file),
    playback: { file: 'artifacts/gates/G4A-review/flow-and-tracking.webm', sha256: sha(await fs.readFile(path.join(output, 'flow-and-tracking.webm'))),
      wallElapsedMs: samples.at(-1).wallElapsedMs, simulationSecondsObserved: final.seconds, samples,
      note: 'Real default-speed playback, no accelerated time or injected advance API. Video includes navigation; it is not an FPS benchmark.' },
    runtime: { ...runtime, warnings: [...new Set(runtime.warnings)] },
    limitations: ['Static captures freeze actual poses; mobile and tracking screenshot show actual playback and time can change during capture.',
      'Procedural P1 / hypothetical RC; no physiological units or final artistic approval.', 'Mobile emulation uses workstation GPU. Separate production reports contain FPS/resource measurements.'] };
  await fs.writeFile(path.join(output, 'captures.json'), `${JSON.stringify(result, null, 2)}\n`);
  const entries = captures.map((item) => `| ${item.label} | [${path.basename(item.file)}](${path.relative(output, path.resolve(item.file)).replaceAll('\\', '/')}) | ${item.state.seconds === undefined ? 'Body' : `${item.state.seconds.toFixed(3)}s`} |`).join('\n');
  await fs.writeFile(path.join(output, 'INDEX.md'), `# G4A — Pacote de evidência real\n\nCapturas e vídeo da aplicação de produção. A aprovação visual permanece humana.\n\n| Material | Arquivo | Tempo da animação |\n|---|---|---|\n${entries}\n\n[Filme real de fluxo e tracking](flow-and-tracking.webm) · [Metadados e hashes](captures.json)\n\nAs escalas, trajetórias, quantidades e forma RC são conceituais. Nenhuma figura externa ou render Blender é apresentado como implementação.\n`);
  await fs.appendFile(path.join(output, 'INDEX.md'), '\n[Parecer crítico, materiais, limitações e inventário](REPORT.md) · [Aceite e comandos](../../../docs/G4A_ACCEPTANCE.md)\n\nFrames extraídos do vídeo real: [4s](video-frames/frame-4.png), [12s](video-frames/frame-12.png), [24s](video-frames/frame-24.png), [40s](video-frames/frame-40.png). Esses tempos são do arquivo de vídeo, que inclui navegação; não são valores exatos da timeline da simulação.\n\nMedições independentes: [100](../../g4a/production-100.json), [500](../../g4a/production-500.json), [2.000](../../g4a/production-2000.json). Provas: [suítes CPU](../../g4a/checks.json), [E2E completos](../../g4a/e2e-full.json), [dez transições](../../g4a/ten-body-micro-transitions.json), [liberação da câmera](../../g4a/camera-release-continuity.json), [contexto GLB](../../g4a/glb-context-roundtrip.json), [preservação histórica](../../g4a/history-preservation.json), [auditoria final](../../g4a/final-audit.json).\n');
  console.log(JSON.stringify({ captureCount: captures.length, video: result.playback.file, mobileLayout, revisit: result.revisit, runtime: result.runtime }, null, 2));
  if (runtime.errors.length || runtime.failedRequests.length || mobileLayout.documentWidth > mobileLayout.viewport) process.exitCode = 1;
} finally { await browser.close(); }
