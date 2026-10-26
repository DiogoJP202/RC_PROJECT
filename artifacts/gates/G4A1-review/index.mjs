// CPU-only index and contact sheet from real screenshots already captured.
// Running this file does not start a browser or create new rendered evidence.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const labels = { overview: 'Visão geral', 'rc-selected': 'RC selecionada / cor e marcador', 'tracking-occlusion': 'Tracking / oclusão',
  'rbc-closeup': 'Close da hemácia', wall: 'Parede vascular', desktop: 'Desktop / realce didático', mobile: 'Mobile390' };
const exists = async (file) => fs.access(file).then(() => true, () => false);
const readJson = async (file) => await exists(file) ? JSON.parse(await fs.readFile(file, 'utf8')) : null;
const distance = (a, b) => a?.length === b?.length && a?.every(Number.isFinite) && b?.every(Number.isFinite)
  ? Math.hypot(...a.map((value, index) => value - b[index])) : null;
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const mdLink = (file, text) => `[${text}](${file})`;
export async function generateIndex(output = path.resolve('artifacts/gates/G4A1-review')) {
  const before = await readJson(path.join(output, 'before/captures.json')), after = await readJson(path.join(output, 'after/captures.json'));
  const playback = await readJson(path.join(output, 'after/playback.json'));
  await fs.mkdir(output, { recursive: true });
  const comparisons = [], missing = [], contact = [];
  for (const [name, title] of Object.entries(labels)) {
    const previous = before?.captures.find((item) => item.name === name), current = after?.captures.find((item) => item.name === name);
    if (!previous || !current) { missing.push(name); continue; }
    for (const item of [previous, current]) {
      const bytes = await fs.readFile(path.join(output, item.file));
      if (crypto.createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw new Error(`Capture hash does not match metadata: ${item.file}`);
    }
    const deltas = Object.fromEntries(['position', 'target', 'quaternion', 'up'].map((key) => [key, distance(previous.state.camera[key], current.state.camera[key])]));
    const sameCamera = Object.values(deltas).every((value) => value !== null && value < 1e-7);
    const sameViewport = JSON.stringify(previous.viewport) === JSON.stringify(current.viewport);
    const sameCanvasDimensions = ['width', 'height'].every((key) => Math.abs(previous.canvasRect[key] - current.canvasRect[key]) < .01);
    const sameTimeline = Math.abs(previous.state.seconds - current.state.seconds) < 1e-8;
    const sameIdentity = previous.state.selectedId === current.state.selectedId;
    const sameConfig = previous.state.config.seed === current.state.config.seed && previous.state.config.count === current.state.config.count;
    const matched = sameCamera && sameViewport && sameCanvasDimensions && sameTimeline && sameIdentity && sameConfig;
    comparisons.push({ name, title, before: previous.file, after: current.file, seconds: current.state.seconds,
      sameCamera, sameViewport, sameCanvasDimensions, sameTimeline, sameIdentity, sameConfig, matched, cameraDeltas: deltas,
      note: matched ? 'Same measured camera pose, canvas size, timeline, identity and config.' : 'Measured framing differs. Inspect behavior/layout as well as material; do not claim an identical-camera material comparison.' });
    contact.push({ title, previous, current, matched });
  }
  const rows = Object.entries(labels).map(([name, title]) => {
    const previous = before?.captures.find((item) => item.name === name), current = after?.captures.find((item) => item.name === name);
    const comparison = comparisons.find((item) => item.name === name);
    return `| ${title} | ${previous ? mdLink(previous.file, 'Antes') : 'Pendente'} | ${current ? mdLink(current.file, 'Depois') : 'Pendente'} | ${comparison ? `${comparison.seconds.toFixed(2)}s · ${comparison.matched ? 'câmera equivalente' : 'enquadramento diferente; ver metadados'}` : 'Pendente'} |`;
  }).join('\n');
  let sheetLink = '';
  if (contact.length) {
    const width = 1960, column = 935, margin = 30, rowHeight = 630, height = 80 + contact.length * rowHeight;
    const pieces = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#141518"/><g font-family="sans-serif" fill="#e9dfd5"><text x="30" y="32" font-size="23">G4A.1 / CAPTURAS REAIS</text><text x="30" y="61" font-size="17">ANTES · G4A congelado</text><text x="995" y="61" font-size="17">DEPOIS · implementação local</text>`];
    for (const [index, row] of contact.entries()) {
      const top = 80 + index * rowHeight;
      pieces.push(`<text x="30" y="${top + 23}" font-size="18">${escape(row.title)} · ${row.current.state.seconds.toFixed(2)}s · ${row.matched ? 'câmera equivalente' : 'enquadramento diferente'}</text>`);
      for (const [col, item] of [row.previous, row.current].entries()) {
        const bytes = await fs.readFile(path.join(output, item.file)), imageWidth = bytes.readUInt32BE(16), imageHeight = bytes.readUInt32BE(20);
        const scale = Math.min(column / imageWidth, 580 / imageHeight), w = imageWidth * scale, h = imageHeight * scale;
        const x = margin + col * (column + margin) + (column - w) / 2;
        pieces.push(`<image x="${x}" y="${top + 35}" width="${w}" height="${h}" href="data:image/png;base64,${bytes.toString('base64')}"/>`);
      }
    }
    pieces.push('</g></svg>'); await fs.writeFile(path.join(output, 'comparison-contact.svg'), pieces.join('\n'));
    sheetLink = '\n[Composição comparativa com as capturas reais](comparison-contact.svg) · [Conferência de enquadramento e hashes](comparisons.json)\n';
  }
  const sequence = playback?.captures.map((item) => `| ${mdLink(item.file, path.basename(item.file))} | ${item.state.seconds.toFixed(3)}s → ${item.secondsAfter.toFixed(3)}s | ${item.state.selectedId} |`).join('\n');
  const video = playback ? `\n[Vídeo real de tracking, pelo menos42s de reprodução](${playback.file}) · [Metadados da reprodução](after/playback.json)\n\n| Frame real durante a gravação | Timeline observada antes → depois da captura | Identidade |\n|---|---|---|\n${sequence}\n\nO vídeo inclui navegação. Os PNGs são capturas reais durante a mesma reprodução; tempos do arquivo de vídeo e da timeline não são intercambiáveis. Esta gravação não mede FPS.\n` : '\nVídeo e frames de reprodução ainda pendentes.\n';
  const contents = `# G4A.1 — Revisão comparativa real\n\n${before && after ? 'Capturas pareadas produzidas.' : 'Pacote em preparação; evidências ausentes permanecem pendentes.'} Aprovação artística humana pendente. Nenhuma referência externa ou render gerado é apresentado como resultado da aplicação.\n\nSeed17, perfil500, RC 'rc:17:0', hemácia 'rbc:17:1'. Cenas estáticas usam os mesmos comandos públicos e valores de timeline. As poses e dimensões efetivamente medidas determinam se o enquadramento é equivalente; mudança de câmera não é ocultada.\n\n| Vista | G4A antes | G4A.1 depois | Comparabilidade |\n|---|---|---|---|\n${rows}\n${sheetLink}\n${before ? '[Metadados antes](before/captures.json)' : 'Metadados antes pendentes.'} · ${after ? '[Metadados depois](after/captures.json)' : 'Metadados depois pendentes.'}\n${video}\nA oclusão da vista pareada foi escolhida por raycast real do centro no baseline, quando disponível, e repetida no mesmo tempo depois. Isso não equivale a uma fração de superfície visível. O diagnóstico atual usa a malha real e registra frações separadas. Contato entre células e visibilidade integral não são garantidos.\n\nMobile é emulado com GPU da estação. Perfis independentes em 'artifacts/g4a1/' registram custo de Fluxo e Tracking separadamente; contadores Micro não somam o Body residente nem medem VRAM. 'readyMs' mede a entrada padrão500.\n\nOs materiais antigos de G4A permanecem preservados em [G4A-review](../G4A-review/INDEX.md). Implementação G4B, metabolismo e anatomia RC final continuam fora deste pacote.\n`;
  const reviewLinks = '\n## Relatórios e provas\n\n'
    + '- [Parecer crítico e inventário](REPORT.md)\n'
    + '- [Comparação de desempenho](PERFORMANCE.md) e [dados dos doze perfis](../../g4a1/performance-comparison.json)\n'
    + '- [Estudo estático](../../g4a1/occlusion-study.json) e [reprodução suavizada](../../g4a1/playback-occlusion-study.json)\n'
    + '- [Comandos finais](../../g4a1/checks.json), [62 E2E completos](../../g4a1/e2e-full.json) e [seis cenários rechecados após o ajuste de layout](../../g4a1/e2e-refinement-final.json)\n'
    + '- [Preservação do histórico](../../g4a1/history-preservation.json), [saneamento com backups](../../g4a1/evidence-sanitization.json) e [auditoria final](../../g4a1/final-audit.json)\n'
    + '- [Decisões e limites](../../../docs/G4A1_REFINEMENT.md)\n\n'
    + 'Quadros decodificados do vídeo: [15 s](after/decoded/video-15.png), [30 s](after/decoded/video-30.png), [45 s](after/decoded/video-45.png). Esses tempos pertencem ao arquivo de vídeo; a timeline observada está nos próprios frames. [Proveniência da decodificação](../../g4a1/video-decoding.json).\n';
  await fs.writeFile(path.join(output, 'INDEX.md'), contents + reviewLinks);
  await fs.writeFile(path.join(output, 'comparisons.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), comparisons, pendingViews: missing,
    method: 'Hashes checked; camera pose/dimensions/timeline/config compared from actual capture metadata. Contact sheet embeds only those PNGs without replacing scene content.' }, null, 2)}\n`);
  return { pairedViews: comparisons.length, pendingViews: missing, hasPlayback: Boolean(playback) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) console.log(JSON.stringify(await generateIndex(), null, 2));
