# 03 — Arquitetura técnica e decisões

## ADR-001: stack para o primeiro produto

**Escolha preferida do protótipo:** Vite + React + TypeScript strict + React Three Fiber + Drei + Three.js + Tailwind (tokens CSS) + Zustand + Vitest + Playwright. Apenas browser; sem backend na fase 1. Deployment estático (Vercel/Cloudflare Pages/GitHub Pages, dependendo das limitações de caminho de assets).

**Por quê Vite e não Next.js agora?** O núcleo é uma aplicação 3D client-side. Vite oferece menor complexidade de SSR/hidratação e bom pipeline de preview. As pesquisas anteriores sugerem Next.js, que continua válido se houver SEO/editorial extenso, rotas server-rendered, autenticação ou CMS. Não migrar por gosto; registrar a decisão em ADR.

**Manter versões compatíveis:** consulte a documentação oficial/versões instaladas antes de pinagem; React Three Fiber v9 acompanha React 19 nas docs, v8 acompanha React 18. Evite alpha/Beta em MVP, especialmente se WebGPU exigir release experimental.

## Arquitetura de camadas (não misturar)

```text
src/
  app/                     bootstrap, routing, error boundary, layout
  ui/                      UI DOM: HUD, panels, source drawer, scrubber
  anatomy/
    content/               dados e claims auditáveis; JSON/TS
    scene/                 corpo + camadas + picking
    maps/                  IDs semânticos -> nodes GLB / bounding volumes
  visuals/
    materials/             RC shaders, body, ghost, highlight
    camera/                rigs e transições, foco, bookmarks
    particles/             instancing e splines do fluxo
    assets/                asset manifest, loader, cache, fallback
  simulations/
    engine/                estados determinísticos, funções puras
    kagune/                amostragem timeline -> bone/morph/uniform
    circulation/           trajetória instanciada -> t
    rc/                    parâmetros normalizados, presets
  state/                   store da UI e snapshots de cenário
  content/                 narrativa e traduções
  tests/                   unit, interactions, e2e, perf sanity
public/assets/           somente modelos e licenças aprovadas
artifacts/gates/          screenshots por gate, não necessariamente versionados
```

## Estado de UI vs estado de simulação

**Zustand (UI, event-driven):** `mode`, `specimen`, `selectedAnatomyId`, `layerVisibility`, `evidenceFilter`, `focusedAssetId`, `simulationPreset`, `isPlaying`, `scrubberT`. Atualizar em eventos (não a 60fps).

**Engine transiente (loop):** buffers de posições, transformadas, uniforms, ossos/shape keys, intensidade de pulso. `useFrame((_, delta) => simulation.tick(delta))`; engine lê snapshot de comandos, escreve nos buffers diretamente. Pausar conforme aba oculta, `reducedMotion` e offscreen.

**Determinismo:** `sampleAt(t, config)` é preferível a usar acumulação casual de estado; implementações devem permitir voltar de `t=0.8` para `t=0.2` com a mesma aparência em qualquer FPS. Seed fixa para detalhes procedurais em testes/screenshot.

## Componentes-chave

```text
<AppShell>
  <TopNav />
  <SystemsIndex />
  <Viewport3D>
     <CameraDirector />
     <AnatomyLayers />
     <KakuhouSystem />
     <KaguneManifestation />
     <EvidenceHotspots />
  </Viewport3D>
  <AnalysisInspector />
  <TimelineControls />
  <EvidenceDrawer />
</AppShell>
```

A passagem para microescala pode trocar `<Viewport3D>` por cena dedicada sem redefinir navegação e estado de evidência. **Nunca** concentre todos os modos, assets e simulações em um componente gigante.

## Contrato de câmera

Bookmarked camera poses em espaço local do espécime; API `cameraDirector.focus({targetId, transitionMs, preserveAzimuth?, reset?})`. Suportar cancelar tween anterior; manter histórico de contexto para voltar. `bounds` do asset mapeado por ID (não coordenadas arbitrárias espalhadas pela UI). Corrigir clipping e near/far em diferentes escalas: macro e micro podem usar câmeras/cenas distintas.

## Render e desempenho

- Render desktop com pixel ratio adaptativo (limitar DPR em telas caras). Mobile em perfil reduzido.
- `InstancedMesh`/buffer instancing para RC e hemácias; geometria/material compartilhados; nenhuma partícula como componente React independente.
- `useFrame` com `delta`, não `setState` por frame.
- Carregar `body-shell`, `kakuhou-rinkaku`, `kagune-rinkaku`, `vascular-major`, `rc-cell-macro` **por demanda**.
- Evitar 6+ camadas transparentes simultâneas (sorting/overdraw). Priorizar isolar + clipping/ghost local.
- LOD no corpo e no kagune; morphs/rig prioritariamente GPU-friendly.
- Testar compressão e texturas KTX2/meshes Draco ou Meshopt; compressão pode custar decodificação inicial, portanto medir.
- Shaders devem ter fallback básico; pós-processamento é opcional, não requisito para ver o conteúdo.

## Metas iniciais de desempenho (hipóteses de projeto)

- Desktop referência: 1440×900, Chrome/Edge em GPU intermediária; buscar 50–60 FPS após warm-up no modo Body.
- Mobile referência: 390×844, hardware mediano; buscar ~30 FPS no modo reduzido.
- Interação após abertura: meta de **até 5s em conexão estável desktop**, sem prometer em todo dispositivo.
- Medir `FPS p50/p10`, draws, triangles, JS heap se disponível, total transferido e tempo até ação real.
- Orçamento inicial de engenharia (ajustável pelo profiling): body initial payload <= 8 MB comprimidos e draws da cena principal preferencialmente abaixo de ~150 em desktop; NÃO são fatos técnicos universais e não justificam descartar anatomia essencial.

## URLs e arquitetura de continuidade

Na base UI-R5, `/` é a Home sem WebGL. `/estudos` e `/fontes` são páginas editoriais. `/atlas`, `/atlas/rinkaku` e `/atlas/vascular` abrem as experiências funcionais. `/atlas/comparar` e `/atlas/cell/:entityId` têm estados informativos. Os aliases legados ainda são normalizados pelo roteador. Consulte o [checkpoint do redesign](UI_REDESIGN_CHECKPOINT.md) para a navegação, os painéis sob demanda e a suspensão da bancada.

As pastas reais são `src/app`, `src/ui`, `src/scene`, `src/simulation`, `src/state`, `src/content` e `src/visuals/assets`. A árvore acima registra a proposta inicial. A implementação usa CSS local com tokens compartilhados e catálogo runtime `public/catalog.json` v2. O [plano G4B](G4B_PLAN.md) especifica a futura bancada celular e a integração com o contexto vascular estacionado.

## Testes automatizados

- Vitest: engine de RC, clamps, curvas de timeline, selectors, conteúdo com referência.
- Playwright: abrir, selecionar kakuhou, isolar, voltar, play/pause/scrub, modo micro, reduced motion, fallback.
- Capturas com viewport fixo e seed fixa; tolerar variância WebGL em vez de snapshots pixel-perfect frágeis.
- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e` (configurar no scaffold).

## Segurança e distribuição

- Não haverá dados de usuário/necessidade de servidor no MVP. Usar `rel=noopener noreferrer` nos links externos e CSP compatível com o renderer.
- Ativos proprietários de referência só em `references/` local, excluídos do deploy.
- Documento `ASSET_LICENSES.md` faz parte do build público se houver atribuição exigida.

## Três riscos críticos

1. **Asset errado / anatômico inconsistente:** resolve-se por contratação/criação/edição em Blender e contratos de node, não por CSS.
2. **Árvores de instanciamento sem seleção:** renderize instâncias com `instanceId` → `entityId` estável e fallback HTML na lista.
3. **'Simulação científica' enganosa:** rotule gameplay e hipóteses; nunca use uma função RC->força como se fosse consequência direta do cânone.
