# G1 — Aceite técnico e classificação de qualidade

> A implementação local posterior G3A tem [aceite próprio](G3A_ACCEPTANCE.md) e reexecuta as regressões G1/G2A. Este documento e suas capturas preservam os resultados históricos; os números abaixo não são medições G3A.

> Este documento preserva o aceite histórico G1. A baseline de código G2A publicada em `main`, commit `0e53c1e31c366a05642501bef312d0fe5d5575b6`, foi confirmada por `git fetch` e `git ls-remote` na retomada de 24/10/2026; o checkpoint documental posterior preserva esse código. As referências abaixo a ausência de remote/publicação e ao adaptador futuro descrevem o encerramento original do G1. O estado posterior está em [G2A_ACCEPTANCE](G2A_ACCEPTANCE.md); a validação da nova máquina e a consolidação são registradas separadamente no [log](IMPLEMENTATION_LOG.md).

23/10/2026, `America/Sao_Paulo`. Executado conforme as instruções adicionais aprovadas pelo usuário para G1. O resultado é local, sem deploy e sem assets de produção. Este aceite técnico não substitui a revisão artística do usuário.

## Resultado por sistema

P0 = protótipo funcional; P1 = interação/apresentação refinadas; P2 = fidelidade visual e anatômica avançada.

| Sistema | Estado demonstrado | Nível | Limite |
|---|---|---|---|
| Fundação e organização | Vite/React/TS strict, lint, unidades, Python, E2E, build com gate de catálogo | P1 | Sem backend, autenticação ou publicação |
| Interface do observatório | Índice, palco, inspector, fontes, scan, ajuda e estados futuros; desktop/mobile | P1 | Aprovação estética final é humana |
| Órbita, zoom, seleção e foco | Raycast real, alternativa HTML, transição cancelável, posterior e reset | P1 | Anchors e dimensões são convenções do proxy |
| Representação anatômica | Corpo, cabeça, músculos, esqueleto, tórax e kakuhou autorais | **P0** | Seis meshes esquemáticos; sem anatomia/arte final. Não há P2 |
| Camadas | Quatro entidades independentes, visibilidade, opacidade, isolamento/restauração | P1 na interação / P0 na forma | Não são dados anatômicos segmentados validados |
| Evidências | Catálogo v2 carregado e validado; claims/fontes/status do modelo separados | P1 | A verificação é do escopo textual, não de painéis ou malhas não examinados |
| Loading e falhas | Fetch real de catálogo, import lazy da cena, retry, asset ausente e WebGL perdido | P1 | Proxies são gerados; não existe GLB anatômico carregado |
| Acessibilidade essencial | Tab/Enter, atalhos sem capturar inputs, reduced motion e alternativas HTML/2D | P1 | Sem certificação universal de leitores de tela/dispositivos |
| Futuro adaptador GLB | Fetch/abort, parse glTF 2, nodes na cena ativa, descarte idempotente | P0 | Teste com contêiner original em memória; integração artística real é G2 |
| Micro/Comparar | Estados informativos navegáveis com retorno e contexto preservado | P0 de navegação | Cenas de microscopia e comparação não implementadas |

## Checklist G1 com evidência

- [x] Git inicializado em `main`; sem commit ou remote criado.
- [x] Versões compatíveis consultadas e lockfile criado; dependências principais fixadas.
- [x] Corpo realmente 3D, alto, iluminado, orbitável e selecionável; aviso persistente `PROXY / CONCEPTUAL MODEL`.
- [x] Seis IDs semânticos e quatro camadas independentes; nenhuma camada é somente um filtro de cor.
- [x] Seleção DOM/mesh sincroniza inspector; foco, reset, transparência e isolamento afetam a cena.
- [x] Função/localização/descrição, claims e fontes da seleção acessíveis; hipótese não herda selo oficial.
- [x] Os onze falsos positivos de G0 são rejeitados por regressões negativas independentes.
- [x] Timeline controla scan ilustrativo, com pausa/scrub reais e relógio transiente fora do React por frame.
- [x] Troca Corpo/Micro/Comparar conserva contexto; estados futuros são claramente identificados.
- [x] Movimento reduzido, teclado, toque, loading, retry e fallback verificados no browser.
- [x] Desktop 1440×900 sem overflow vertical; mobile 390×844 sem overflow horizontal; inspector recolhe e se revela após seleção.
- [x] TypeScript, lint, unidades, Python, build, E2E e smoke passaram.
- [x] Capturas reais geradas e inspecionadas; perfil de produção medido.
- [x] Referências privadas e pesquisas integrais ausentes do build.
- [ ] Corpo anatômico/licenciado, rig e arte cinematográfica final — dependência G2/G3, sem P2 declarado.
- [ ] Performance em celular físico — pendente; emulação validou layout/toque.
- [ ] Aprovação humana da direção de arte — pronta para revisão.

## Comandos e resultados

| Comando | Evidência observada |
|---|---|
| `npm run typecheck` | exit 0, sem erro TypeScript |
| `npm run lint` | exit 0, sem erros; arquivos de ferramentas/perfil também conferidos após ajustes |
| `npm test` | exit 0, **41 testes / 5 arquivos** |
| `npm run test:catalog` | exit 0, **22 testes Python**, incluindo os onze casos G0 |
| `npm run validate:catalog` | exit 0, `Catalog OK v2`, catálogo/manifesto/fontes/arquivos conferidos pelas regras implementadas |
| `node tools/python.mjs tools/validate_catalog.py contracts/seed-catalog.json` | exit 1 esperado: seed v1 legado continua inválido para o runtime v2; não foi alterado para esconder o diagnóstico |
| `npm run build` | exit 0; validação do catálogo + TypeScript + Vite |
| `npm run test:e2e` | exit 0, **14 testes Chromium/Chrome**; subconjunto de quatro jornadas repetido no preview de produção após os últimos ajustes |
| Teste específico de scan/reduced motion | exit 0; alteração da preferência durante playback conserva frame/slider e pausa |
| `node tests/e2e/production-profile.js` | exit 0; cache frio, 10 s warm-up + 30 s de amostra, sem erro JS/rede |

Os checks completos foram feitos em momentos apropriados à mudança. Após os ajustes finais de relógio/sombra, foram repetidas as jornadas afetadas e as capturas no build de produção; não se alega uma nova suíte completa de 14 testes após cada edição documental.

## Evidência visual

- [Desktop 1440×900](../artifacts/gates/G1-desktop.png)
- [Mobile 390×844](../artifacts/gates/G1-mobile.png)
- [Silhueta sem UI](../artifacts/gates/G1-silhouette.png)
- [Foco no kakuhou](../artifacts/gates/G1-focus.png)
- [Scan 20%](../artifacts/gates/G1-scan-20.png) e [75%](../artifacts/gates/G1-scan-75.png) — coordenadas de efeito visual, não tempo biológico
- [Mobile completo](../artifacts/gates/G1-mobile-full.png) e [seleção mobile](../artifacts/gates/G1-mobile-selection.png)
- [Smoke de desenvolvimento](../artifacts/checkpoint/gates/G1-runtime-smoke.json) e [perfil de produção](../artifacts/checkpoint/gates/G1-production-metrics.json) — cópias saneadas preservadas no checkpoint; originais locais mantidos.

As capturas mostram o corpo e os órgãos **provisórios**; não são evidência de reconstrução anatômica fiel. Durante a revisão, foram corrigidos overflow desktop, juntas esféricas excessivas, defasagem do slider, recuperação de erros e reposicionamento do inspector mobile.

## Perfil de produção — uma medição nesta máquina

Ambiente: Windows 11 Pro 10.0.26200 x64, Intel Core i5-1135G7, 16 GB, Intel Iris Xe via ANGLE/D3D11, Chrome 155.0.8059.86 headless, viewport 1440×900 e DPR 1. Preview Vite do build, cache HTTP desativado, CDP configurado para 20 Mbps e `latency=50 ms`. Esse campo CDP não certifica um RTT físico simétrico.

| Métrica | Resultado | Orçamento inicial |
|---|---:|---:|
| Interação inicial | **1.680,9 ms** | ≤5.000 ms |
| FPS p50 / p10 | **59,88 / 59,52** | ≥50 / ≥30 |
| Amostra após warm-up | 1.800 intervalos, 30.012 ms | 30 s após 10 s |
| Draw calls Body | **21** | <150 |
| Triângulos | 149.898 | registrar, sem meta universal |
| Geometrias / texturas | 13 / 3 | registrar |
| Transferência inicial medida | **346.169 B** pela Performance API; 346.530 B via CDP | ≤8 MiB |
| Console JS / HTTP inesperado / requests falhos | **0 / 0 / 0** | zero |

GETs confirmaram gzip em JS/CSS/catálogo; não confundir tamanho bruto de `dist` com bytes transferidos. JS heap CDP variou aproximadamente 11,96→13,33 MB no perfil; são contadores JS, sem estimativa de VRAM ou certificação de ausência de leak. Nenhum resultado foi extrapolado para outros computadores ou celulares.

## Limitações e próximos ingressos

O chunk lazy de cena tem cerca de 947 kB minificados / 253 kB gzip, acima do aviso local de 900 kB; o payload medido e a interação ficaram dentro dos orçamentos. A dependência R3F 9 ainda usa `THREE.Clock`, obsoleto no Three atual; é warning de biblioteca, sem erro funcional observado. A sombra foi configurada explicitamente como PCF para remover o aviso de substituição de PCFSoftShadowMap.

O adaptador GLB é um seam interno para assets previamente aprovados pelo gate. Antes de G2, restringir/revisar URIs de recursos externos do contêiner, validar materiais/texturas/licenças e completar ownership de skeletons, ImageBitmaps e cenas secundárias de modelos reais. O teste de um contêiner glTF com node **não** prova rig, textura, anatomia, bounds de produção ou consumo de memória de um corpo final.

Recomendações G2: escolher/produzir base humana e região lombar com licença da versão concreta; revisar anatomia; inspecionar GLB em viewer; mapear nodes/bounds/anchors e recursos dependentes; substituir o proxy preservando IDs; repetir seleção/lista/camadas/foco e capturas. Manter forma do kakuhou como reconstrução e separar localização regional de posicionamento profundo inventado. Rigs rinkaku, vasos e células continuam gates posteriores.

**Parada:** G1 entregue para revisão. Nenhum modelo anatômico final foi adquirido/integrado, nenhuma simulação dos próximos gates foi implementada e nada foi publicado.

## Atualização de preservação — checkpoint

O texto acima registra o encerramento original do G1. Na operação de transferência, os sete comandos de aceite foram repetidos: typecheck, lint, 41 unidades, 22 testes Python, catálogo v2, build e 14 E2E passaram, sem alterações de código/testes. [Saídas completas](../artifacts/checkpoint/local-validation.txt) e [resumo](../artifacts/checkpoint/local-validation.json). As oito capturas foram renovadas pelo E2E; hashes atuais em [preservation-index](../artifacts/checkpoint/preservation-index.json). Os números do perfil de produção continuam históricos, sem nova medição de FPS. Publicação do checkpoint no GitHub não é deploy. A continuidade proposta divide G2 em G2A/infraestrutura e G2B/assets, conforme [handoff](PROJECT_HANDOFF.md).
