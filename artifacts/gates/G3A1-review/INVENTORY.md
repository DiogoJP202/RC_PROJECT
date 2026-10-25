# G3A.1 — Inventário do refinamento

Comparação com a working tree G3A preservada na entrada desta revisão, não apenas com o HEAD publicado. Nenhuma reimplementação de G0/G1/G2A/G3A. Lista verificável dos arquivos alterados em [final-audit.json](../../g3a1/final-audit.json).

| Arquivo/módulo | Responsabilidade |
|---|---|
| `src/simulation/rinkakuPlayback.ts` | Mapa cinematográfico monotônico e invertível, 21 s / retração3,4 s |
| `src/state/rinkaku.ts` | Segundos imperativos separados de t/snapshot; comandos, pausa, reverso e scrub |
| `src/scene/rinkaku/ProceduralRinkakuAdapter.ts` | Superfícies indexadas prealocadas, implantação por quantidade, brotos, curvatura, pregas, cores, normais e descarte próprio |
| `src/scene/rinkaku/RinkakuScene.tsx` | Anchor/socket autoritativo, aplicação absoluta, filtro do tecido, visibilidade e proteção do picking |
| `src/scene/AssetSlot.tsx` | Apresentação temporária do proxy kakuhou sem remover o node/anchor |
| `src/scene/IntegratedAssets.tsx` | Mesma política para meshes do lease GLB, preservando bindings/cache/rig/socket |
| `src/scene/rinkaku/camera.ts` | Posterior/lateral, nova oblíqua e enquadramento móvel estável |
| `src/scene/ObservatoryScene.tsx` | Integração da câmera, bounds reais do corpo GLB e comandos explícitos |
| `src/scene/rinkaku/rinkakuRuntime.ts` | Diagnóstico somente de leitura do transporte e representação |
| `src/app/types.ts` | Tipo de foco para vista oblíqua |
| `src/ui/RinkakuControls.tsx` / `rinkaku.css` | Comando oblíquo, controles táteis e distribuição móvel |
| Testes `.test.ts` de playback/state/adapter/camera | Inversão, continuidade, determinismo, layout, filtro, recursos e enquadramento |
| `tests/e2e/g3a-rinkaku.spec.ts` | Expectativas de duração21 s e destinos novos para evidência; invariantes anteriores preservadas |
| `tests/e2e/g3a1-refinement.spec.ts` | Sete E2E novos: fases/quantidades/vistas, scrub, apresentação, mobile e acessibilidade |
| `tests/e2e/g3a1-production-profile.js` | Perfis novos com rede/cache/viewport definidos e observáveis sem inferência de VRAM |
| Documentação G3A.1, aceite/design/contrato, README/roadmap/handoff/retomada/log | Estado local, decisões, evidências novas e história preservada |
| `.gitignore` | Inclusão pontual de evidências G3A.1; backups/logs brutos continuam ignorados |

Sampler `src/simulation/rinkaku.ts`, catálogo/claims, contratos existentes, package/lockfile e assets públicos conservaram os hashes da entrada G3A.1. `GLBRinkakuAdapter` permanece uma fronteira futura indisponível. A fórmula de contato/paleta do proxy não é imposta ao asset definitivo.

Os oito painéis são a entrada compacta do pacote. As fontes completas ficam em `phases/`, `roots/`, `counts/{1,2,3,4}/`, `growth/`, `retraction/`, `revisit/`, `mobile/`, `before/mobile/`, `after/mobile/`, `compat-sequence/`, `regression/gates/` e `film-frames/`. Caminhos/hashes de cada fonte usada nos painéis: [compositions.json](compositions.json). O [índice](INDEX.md) liga as evidências principais e os resultados de testes/perfis em `artifacts/g3a1/`.
