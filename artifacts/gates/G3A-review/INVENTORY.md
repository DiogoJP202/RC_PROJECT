# G3A — Inventário implementado e responsabilidades

Inventário do estado local auditado em 24/10/2026. Caminhos abaixo são relativos à raiz do repositório e os links apontam aos arquivos reais. Esta revisão não altera os módulos.

## Motor e estado

| Arquivo | Responsabilidade |
|---|---|
| [src/simulation/rinkaku.ts](../../../src/simulation/rinkaku.ts) | Configuração validada, sete intervalos, snapshot, sampler puro e escrita reutilizável sem alocação por frame |
| [src/simulation/rinkaku.test.ts](../../../src/simulation/rinkaku.test.ts) | Determinismo, continuidade dos canais, limites e entradas inválidas |
| [src/state/rinkaku.ts](../../../src/state/rinkaku.ts) | Comandos de reprodução e relógio imperativo; direção, pausa, scrub, reset e ligação ao contexto de inspeção |
| [src/state/rinkaku.test.ts](../../../src/state/rinkaku.test.ts) | Transporte, reduced motion, contexto, ciclos e ausência de notificações React por tick |

## Representação e integração

| Arquivo | Responsabilidade |
|---|---|
| [src/scene/rinkaku/adapters.ts](../../../src/scene/rinkaku/adapters.ts) | Interface da representação e contrato futuro GLB, explicitamente indisponível |
| [src/scene/rinkaku/ProceduralRinkakuAdapter.ts](../../../src/scene/rinkaku/ProceduralRinkakuAdapter.ts) | Superfícies, pregas/curvas, buffers/normais, partículas, bounds, inspeção e descarte de recursos próprios |
| [src/scene/rinkaku/ProceduralRinkakuAdapter.test.ts](../../../src/scene/rinkaku/ProceduralRinkakuAdapter.test.ts) | Buffers determinísticos, curvatura, âncora, envelope e descarte |
| [src/scene/rinkaku/RinkakuScene.tsx](../../../src/scene/rinkaku/RinkakuScene.tsx) | Montagem lazy, conexão por socket/anchor, aplicação por frame, resposta local do kakuhou e seleção/visibilidade |
| [src/scene/rinkaku/rinkakuRuntime.ts](../../../src/scene/rinkaku/rinkakuRuntime.ts) | Ponte transiente de cena e diagnóstico; não possui nem descarta lease G2A |
| [src/scene/rinkaku/camera.ts](../../../src/scene/rinkaku/camera.ts) | Câmeras posterior/lateral pelo envelope fixo, sem reenquadrar por scrub |
| [src/scene/rinkaku/camera.test.ts](../../../src/scene/rinkaku/camera.test.ts) | Finiteza, direção e enquadramento móvel |
| [src/scene/ObservatoryScene.tsx](../../../src/scene/ObservatoryScene.tsx) | Integração no observatório, montagem condicional, câmera, hit tests, suspensão do scan e diagnóstico |
| [src/app/App.tsx](../../../src/app/App.tsx) | Entrada no modo, troca de painéis, atalhos, disponibilidade e pausas por contexto/falha |
| [src/app/types.ts](../../../src/app/types.ts) | Novo alvo de foco `rinkaku-lateral` |
| [src/main.tsx](../../../src/main.tsx) | Importação do estilo G3A |

## Interface, testes e medição

| Arquivo | Responsabilidade |
|---|---|
| [src/ui/RinkakuControls.tsx](../../../src/ui/RinkakuControls.tsx) | Entrada, play/pause/retomar/reverso, passos, fases, scrub, parâmetros, câmeras, fontes e disclosures |
| [src/ui/rinkaku.css](../../../src/ui/rinkaku.css) | Apresentação desktop/mobile, timeline, painel e ordem dos blocos no mobile |
| [tests/e2e/g3a-rinkaku.spec.ts](../../../tests/e2e/g3a-rinkaku.spec.ts) | Nove fluxos E2E: poses, comandos, ciclos reais/manuais, sockets, teclado/mobile, fallback e perda de contexto |
| [tests/e2e/g3a-production-profile.js](../../../tests/e2e/g3a-production-profile.js) | Medição de produção padrão/econômico, transferência, rAF, renderer e erros |

## Documentos e proveniência

| Arquivo | Responsabilidade |
|---|---|
| [docs/G3A_ENGINE_DESIGN.md](../../../docs/G3A_ENGINE_DESIGN.md) | Arquitetura, domínio temporal, representação e ownership |
| [docs/G3A_BLENDER_ANIMATION_CONTRACT.md](../../../docs/G3A_BLENDER_ANIMATION_CONTRACT.md) | Fronteira futura Blender/GLB, mapeamento explícito e requisitos de ingresso; não é um adaptador GLB implementado |
| [docs/G3A_ACCEPTANCE.md](../../../docs/G3A_ACCEPTANCE.md) | Aceite técnico, evidências, métricas e limitações |
| [docs/IMPLEMENTATION_LOG.md](../../../docs/IMPLEMENTATION_LOG.md) | Hipótese, decisões, correções, verificações e esta revisão |
| [public/ASSET_LICENSES.md](../../../public/ASSET_LICENSES.md) | Proveniência da geometria/material procedural original |
| [README.md](../../../README.md) | Uso e estado atual local |
| [docs/01_ROADMAP_AND_GATES.md](../../../docs/01_ROADMAP_AND_GATES.md) | Subgate G3A separado do fechamento artístico G3 |
| [docs/PROJECT_HANDOFF.md](../../../docs/PROJECT_HANDOFF.md), [docs/RESUME_ON_NEW_PC.md](../../../docs/RESUME_ON_NEW_PC.md) | Continuidade e distinção entre checkpoint remoto e alterações locais |
| [.gitignore](../../../.gitignore) | Preservação controlada de evidências, sem incluir builds/caches/dados privados |

## Ferramentas desta revisão

- [capture.mjs](capture.mjs): opera a UI do build, captura PNGs e vídeo real, registra estados/hashes e confere preservação. Não injeta pose/câmera no renderer.
- [compose.py](compose.py): cria painéis por recorte fixo, redução e legendas dos screenshots; mantém fontes e hashes em [compositions.json](compositions.json). Pillow já disponível, sem instalação.
- [analyze-geometry.mjs](analyze-geometry.mjs): amostra offline o sampler/adaptador existentes; mede finiteza, centros de raiz e deslocamentos próximos a limites. Não altera o algoritmo.
- [verify.mjs](verify.mjs): confere imagens/vídeo, links, hashes, estados e preservação dos arquivos observados; gera `verify-review.json`.
- `INDEX.md`, `REPORT.md`, JSONs, logs, PNGs e vídeo: pacote de revisão local; não entram no build público.

O catálogo, as seis identidades anatômicas, os leases/cache/bindings/fixtures G2A e as pesquisas existentes continuam sendo consumidos, sem reimplementação. G2B/G3B/G4 não foram iniciados; não existe asset Rinkaku final oculto neste inventário.
