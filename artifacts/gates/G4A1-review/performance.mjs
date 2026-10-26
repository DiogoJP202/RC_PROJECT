// Derives a comparison from the twelve completed profiles; never launches a browser.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = async (file) => JSON.parse((await readFile(resolve(root, file), 'utf8')).replace(/^\uFEFF/, ''));
const rows = [];
for (const mode of ['flow', 'tracking']) for (const count of [100, 500, 2000]) {
  const pair = {};
  for (const label of ['before', 'after']) {
    const file = `artifacts/g4a1/production-${label}-${mode}-${count}.json`;
    const profile = await read(file);
    if (profile.comparisonLabel !== label || profile.scenario.count !== count
      || profile.scenario.cameraMode !== mode || profile.scenario.seed !== 17) throw new Error(`Unexpected scenario: ${file}`);
    pair[label] = { file, fpsP50: profile.sample.fpsP50, fpsP10: profile.sample.fpsP10,
      sampleMs: profile.sample.durationMs, frames: profile.sample.frames,
      bodyInteractiveMs: profile.bodyCold.interactiveMs, microDefault500ReadyMs: profile.scenario.readyMs,
      payloadBytes: profile.scenario.bootPlusMicroTransferBytes,
      observables: profile.observables, budgets: profile.budgets,
      runtimeErrors: profile.runtime.errors.length + profile.runtime.failedRequests.length + profile.runtime.httpErrors.length,
      environment: profile.environment };
  }
  rows.push({ mode, count, ...pair,
    difference: { fpsP50: pair.after.fpsP50 - pair.before.fpsP50,
      fpsP10: pair.after.fpsP10 - pair.before.fpsP10,
      payloadBytes: pair.after.payloadBytes - pair.before.payloadBytes },
    passedOriginalBudgets: ['before', 'after'].every((label) => Object.values(pair[label].budgets).every(Boolean)
      && pair[label].runtimeErrors === 0) });
}
const report = { gate: 'G4A.1', generatedAt: new Date().toISOString(), rows,
  allOriginalBudgetsPassed: rows.every((row) => row.passedOriginalBudgets),
  protocol: 'Twelve sequential fresh Chromium contexts. Each: 10s warmup, 30s visible rAF sample; no visibility raycasts. Seed17, desktop1440x900/DPR1, cache disabled, CDP20Mbps/50ms. Flow and Tracking separated. readyMs is DEFAULT500 entry before profile selection.',
  limits: 'One run per scenario/version on this workstation; capped refresh can conceal GPU headroom. rAF is not GPU frame time; heap and renderer counters are not VRAM. Mobile emulation does not certify a physical phone. Before/after deltas are observations, not statistical significance.' };
await writeFile(resolve(root, 'artifacts/g4a1/performance-comparison.json'), `${JSON.stringify(report, null, 2)}\n`);
const f = (value) => value.toFixed(2).replace('.', ',');
const lines = ['# G4A.1 — Desempenho antes/depois', '',
  'Doze contextos novos e sequenciais, mesmo hardware/seed/configuração. 10 s de aquecimento + 30 s de amostra. Budgets anteriores preservados.', '',
  '| Modo / células | FPS p50 antes → depois | FPS p10 antes → depois | Draws antes → depois | Budgets |',
  '|---|---:|---:|---:|---|',
  ...rows.map((row) => `| ${row.mode === 'flow' ? 'Fluxo' : 'Tracking'} / ${row.count} | ${f(row.before.fpsP50)} → ${f(row.after.fpsP50)} | ${f(row.before.fpsP10)} → ${f(row.after.fpsP10)} | ${row.before.observables.drawCalls.max} → ${row.after.observables.drawCalls.max} | ${row.passedOriginalBudgets ? 'Todos aprovados' : 'Falha: consultar JSON'} |`), '',
  '[Dados, deltas, ambiente e logs de origem](../../g4a1/performance-comparison.json).', '',
  'Entrada Micro mede sempre o perfil padrão 500 antes da mudança para a população ensaiada. Contadores pertencem ao renderer Micro; Body continua residente. O marcador acrescenta um draw em Tracking. UUIDs estáveis não demonstram ausência universal de leaks.', '',
  'FPS usa percentis do inverso dos intervalos requestAnimationFrame, não tempos GPU. Uma execução por versão/caso, sem significância estatística; o limite do monitor pode esconder diferenças de margem GPU. Cache HTTP desativado não equivale a esvaziar caches do sistema operacional. CDP 50 ms é configuração, não RTT físico medido. Não há validação de telefone físico.', ''];
await writeFile(resolve(root, 'artifacts/gates/G4A1-review/PERFORMANCE.md'), lines.join('\n'));
console.log(JSON.stringify({ allOriginalBudgetsPassed: report.allOriginalBudgetsPassed, rows: rows.map(({ mode, count, before, after }) => ({ mode, count, before: [before.fpsP50, before.fpsP10], after: [after.fpsP50, after.fpsP10] })) }));
if (!report.allOriginalBudgetsPassed) process.exitCode = 1;
