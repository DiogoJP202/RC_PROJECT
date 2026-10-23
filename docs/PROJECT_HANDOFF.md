# GHOUL ATLAS — Handoff de produto, engenharia e technical art

Checkpoint de transferência: **23/10/2026**, `America/Sao_Paulo`. Última fase de implementação concluída: **G1**. Esta operação preserva e documenta G0/G1; **G2A, G2B, G3 e G4 não foram iniciados**. Para clone, identidade do checkpoint e comandos no novo computador, começar por [RESUME_ON_NEW_PC](RESUME_ON_NEW_PC.md), depois [README](../README.md) e `AGENTS.md`.

## Visão e fronteira da versão preservada

Ghoul Atlas é um observatório anatômico ficcional, em PT-BR, no qual o corpo tridimensional funciona como mapa interativo. A meta integrada do MVP é corpo → região lombar/kakuhou → transporte ilustrativo RC → microcena → manifestação rinkaku → comparação/evidência. A [visão de 90 segundos](00_NORTH_STAR.md) descreve o destino do produto, não funcionalidades já entregues.

G1 entrega o observatório com navegação real, seis estruturas selecionáveis, quatro camadas independentes e evidência por afirmação. Corpo, órgãos e armação são **geometria procedural autoral esquemática**, sempre `PROXY / CONCEPTUAL MODEL`. Não existe modelo anatômico de produção, rig corporal, kagune, vaso ou célula RC entregue. Qualidade cinematográfica/anatômica final continua bloqueada por arte e revisão.

A interface tem identidade original de laboratório: palco central, índice, inspector, fontes e timeline de scan. As três referências privadas de Cyberpunk orientaram princípios de composição no G0; nenhum screenshot, ícone, mesh ou textura delas integra o aplicativo. O estudo é independente e não se apresenta como produto oficial de *Tokyo Ghoul*.

As invariantes de `AGENTS.md` continuam obrigatórias. Separar `official`, `manga_needs_verification`, `real_anatomy`, `inference`, `hypothetical_model` e `unknown` por afirmação. Uma função sustentada por texto oficial não autentica a malha que a ilustra. Fator RC, reserva normalizada e progresso de animação são conceitos distintos; G1 não exibe fórmula fisiológica nem valor RC inventado.

## Estado efetivo dos gates

| Fase | Implementado e demonstrado | Limite preservado |
|---|---|---|
| G0 | Inventário real, leitura das duas pesquisas, três imagens privadas inspecionadas, 25 claims auditados, ADRs, inventário de assets, roadmap e prompt G1 | Painéis primários inacessíveis não foram declarados lidos; candidatos a modelos não foram adquiridos |
| G1 | Aplicativo local executável, catálogo v2, proxy 3D, picking/lista, câmera, camadas, isolamento, scan, erros, teclado, reduced motion, captura e perfil de produção | Arte anatômica P0; Micro/Comparar são estados informativos; loader GLB é preparação interna |
| G2A | **Não iniciado** | Próximo subgate proposto: infraestrutura de integração GLB |
| G2B | **Não iniciado** | Ingresso de assets definitivos licenciados e aprovados |
| G3 | **Não iniciado** | Manifestação rinkaku e engine determinística |
| G4 | **Não iniciado** | Circulação ilustrativa e células RC instanciadas/microcena |

G1 recebeu autorização específica para antecipar interação de camadas que o roadmap G0 distribuía em G2. Isso não conclui G2: não houve ingresso de corpo segmentado validado nem pipeline GLB de produção. A divisão **G2A/G2B** refina o gate G2 para separar infraestrutura de disponibilidade artística. G5–G7 e o backlog de `09_NEXT_MODULES.md` também permanecem futuros.

## Arquitetura que existe no código

Aplicativo estático no browser, Vite + React + TypeScript strict, sem backend, contas, banco ou serviço externo necessário para executar. `src/main.tsx` monta React em `StrictMode`; `App` carrega conteúdo por fetch, observa preferência de movimento, integra os painéis e importa a cena com `React.lazy`/`Suspense`.

```text
src/main.tsx                    entrada React e CSS
src/app/                        shell App, SceneBoundary, tipos semânticos
src/ui/                         índice, inspector/fontes, timeline, fallback, ícones e CSS
src/state/                      store Zustand e relógio transiente do scan
src/scene/                      cena R3F, AssetSlot procedural, geometria, câmera e manifesto
src/content/                    fronteira de fetch/validação do catálogo + testes
src/visuals/assets/              adaptador GLB futuro + testes
public/catalog.json             única origem de conteúdo publicado
public/ASSET_LICENSES.md         proveniência dos recursos autorais atuais
public/atlas-mark.svg            marca autoral
contracts/                      contrato v2, seed legado v1 e tokens originais
tools/                          validador Python, regressões e seleção de runtime Python
tests/e2e/                      jornadas Playwright e perfil de produção
docs/                           especificação, auditorias e evidências documentais
research/                       os dois relatórios Markdown originais
prompts/                        instruções de gate e handoffs
artifacts/gates/                 capturas próprias preservadas; originais locais de auditoria
artifacts/checkpoint/            evidências selecionadas/saneadas da transferência
references/                     instrução de uso; private/ permanece fora do Git
```

`docs/03_TECHNICAL_ARCHITECTURE.md` contém uma árvore **proposta antes do scaffold**. Diretórios como `src/anatomy/maps`, `src/simulations` e engines RC/kagune não existem nesta baseline. Não criá-los para fazer a árvore planejada parecer implementada. O G1 usa CSS próprio; Tailwind foi apenas uma possibilidade no planejamento e não está instalado. Tokens efetivos de UI estão em `src/ui/styles.css`; `contracts/design-tokens.json` preserva a direção original, sem import automático.

### Componentes e cenas

| Arquivo/sistema | Responsabilidade atual |
|---|---|
| `src/app/App.tsx` | Boot assíncrono, erro/retry do catálogo, shell, modos, ajuda, teclado, preferências e fronteira da cena |
| `src/ui/SystemsIndex.tsx` | Seis botões equivalentes aos alvos 3D, visibilidade das quatro camadas e opacidade da superfície |
| `src/ui/EvidenceInspector.tsx` | Função/localização/descrição, claims, fontes e limites; foco, isolamento e folha recolhível mobile |
| `src/ui/Timeline.tsx` | Play/pause/scrub/reinício do **scan demonstrativo**, sem duração ou medida fisiológica |
| `src/scene/ObservatoryScene.tsx` | Canvas, luzes, chão, órbita/zoom, transição cancelável, picking, scan, métricas e perda real de contexto |
| `src/scene/AssetSlot.tsx` | Instancia as seis malhas reais do proxy, visibilidade/realce, hit test, materiais e descarte |
| `src/scene/proxyGeometry.ts` | Gera corpo, cabeça, musculatura, esqueleto, tórax e kakuhou originais; não importa anatomia externa |
| `src/scene/camera.ts` | Presets reais de foco e enquadramento do proxy; interpolação pura com limites |
| `src/content/catalog.ts` | Fetch e validação estrita antes de qualquer conteúdo entrar na UI; sem catálogo alternativo de sucesso inline |
| `src/ui/Fallback.tsx` / `SceneBoundary` | Esquema 2D original, erro/retry e continuidade textual quando o 3D falha |
| `src/visuals/assets/gltfResource.ts` | Seam interno de fetch/abort/parse de GLB, nodes da cena ativa e descarte básico; **não usado para renderizar a anatomia G1** |

Existe uma cena anatômica Body. Micro/Comparar mostram “Em desenvolvimento”, conservando Canvas e contexto de Body com `visibility:hidden`; não há microcena nem segundo organismo comparativo. `window.__ATLAS_SCENE__` expõe `snapshot`, `project` e `raycast` para inspecionar a cena real nos testes; não é uma API remota.

### Estado e render loop

`src/state/observatory.ts` usa Zustand para eventos: `mode`, `selectedId`, quatro flags de `layers`, `surfaceOpacity`, `isolated/savedLayers`, `focus.target/nonce`, `reducedMotion`, `paused`, `scanT/scanRevision`, `canonOnly`, `inspectorOpen` e métricas. A seleção interna habilita a camada e reduz opacidade externa para revelar a estrutura. Isolar/restaurar conserva a combinação anterior de camadas; reset reenquadra/restaura camadas sem apagar a seleção.

O scan corrente vive em refs e em `scanClock.progress`, atualizado por `useFrame`. A timeline lê a 4 Hz; métricas entram no store a cada 2 s. Pausa e alteração de reduced motion capturam o frame transiente. Não há `setState` React por frame para animar o scan. Nenhuma engine fisiológica ou store de `reserve/activity/hunger/integrity` foi implementada; os tipos desses estados são contratos futuros.

IDs preservados na substituição de arte:

| Anatomy ID | Node atual | Camada |
|---|---|---|
| `human.surface` | `HUMAN_SURFACE` | surface |
| `human.head` | `HUMAN_HEAD` | surface |
| `human.muscular` | `HUMAN_MUSCULAR` | muscular |
| `human.skeletal` | `HUMAN_SKELETAL` | skeletal |
| `human.thorax` | `HUMAN_THORAX` | internal |
| `ghoul.kakuhou.rinkaku` | `KAKUHOU_RINKAKU` | internal |

Orientação do proxy: Y para cima, frente +Z, origem no solo, altura de cena ~1,85 m como convenção de desenho. Manifesto tem anchor central do kakuhou `[0,0.976,-0.112]`; o locator/ponto de teste no código usa superfície posterior próxima (`z=-0.143`). Nenhuma dessas coordenadas é posição médica. A câmera ainda usa presets e anchors específicos do proxy no código; os bookmarks JSON são validados, mas não comandam automaticamente esses presets. G2A deverá reconciliar mapa espacial/câmera com os bounds e anchors efetivos do recurso importado.

### Catálogo e migração

`public/catalog.json`: schema v2, seis estruturas, onze claims, nove citações e um asset procedural real. `contracts/atlas-schema.ts` descreve o contrato. O loader transforma `anatomy` em `structures` para a UI; não duplica a autoria do catálogo.

O gate Python verifica campos/enums/IDs/referências/parents/ciclos, fonte direta e conferência, arquivos/manifesto/gerador e cabeçalho/nodes de GLB quando aplicável. O browser valida JSON e manifesto compilado. Metadados aprovados demonstram conformidade das regras implementadas; não provam sozinhos a verdade de uma proposição ou fidelidade do modelo.

`contracts/seed-catalog.json` permanece v1, intacto, como registro do pacote inicial. **Sua rejeição pelo validador v2 é esperada**; build usa `public/catalog.json`. Não trocar versão do seed nem enfraquecer testes para fazê-lo passar. Histórico e comandos negativos estão em [G1_CATALOG_MIGRATION](G1_CATALOG_MIGRATION.md).

## Dependências e versões reproduzíveis

Versões abaixo extraídas dos registros resolvidos em `package-lock.json` (lockfile v3), não somente dos ranges de `package.json`. Usar `npm ci`.

| Dependência | Versão resolvida |
|---|---|
| Node / npm usados no G1 | 24.19.0 / 11.17.0 |
| Python usado | 3.12.14; código exige 3.10+ e não requer pacotes pip |
| React / React DOM | 19.3.1 / 19.3.1 |
| React Three Fiber / Drei | 9.8.2 / 10.7.9 |
| Three / Zustand | 0.186.1 / 5.0.16 |
| TypeScript / Vite | 6.0.3 / 8.3.5 |
| Vitest / Playwright | 5.0.5 / 1.64.1 |
| ESLint / @eslint/js | 10.13.0 / 10.0.1 |
| typescript-eslint / @vitejs/plugin-react | 8.72.0 / 6.1.2 |
| @types/node / react / react-dom / three | 24.19.2 / 19.3.0 / 19.3.0 / 0.186.0 |

Para reproduzir, preferir Node 24.19.0 e npm 11.17.0; o ambiente de testes exige Node 22.12+ nas linhas suportadas pelas dependências (Vitest aceita `^22.12 || ^24 || >=26`). Não presumir que qualquer major intermediário funciona só porque é numericamente maior. Não migrar stack ou instalar releases alpha para resolver warnings de bibliotecas durante uma transferência.

Aplicativo não exige segredo nem `.env` para iniciar. Variáveis opcionais de ferramentas estão documentadas no README/`.env.example`; não são carregadas por um backend. No Windows, o alias Microsoft Store `python.exe` pode falhar: instalar Python real ou indicar `ATLAS_PYTHON`. O helper também reconhece runtime local do Codex quando existente, mas esse runtime não faz parte do repositório nem é requisito do novo computador.

## Qualidade, testes e evidências

P0 = protótipo funcional; P1 = interação/apresentação refinadas; P2 = fidelidade visual/anatômica avançada. Esses rótulos não são prioridade de defeito.

| Área | Nível e estado |
|---|---|
| Fundação, navegação, picking, foco, camadas e UI | P1 demonstrado com proxies |
| Evidência por claim e falhas/recuperação | P1 no escopo G1 |
| Teclado, reduced motion, HTML alternativo e layout touch | P1 essencial; sem certificação universal de acessibilidade |
| Anatomia, órgãos, musculatura e esqueleto | P0 esquemático; sem revisão anatômica/arte final |
| Adaptador GLB futuro | P0 de preparação, sem integração artística real |
| Micro/Comparar | P0 de navegação informativa; funcionalidades futuras |
| Fidelidade P2 | **Não atingida nem declarada** |

Suítes existentes, lidas no checkpoint:

- **41 testes Vitest, 5 arquivos:** catálogo/fetch e negativos editoriais, geometria finita de seis nós, enquadramento/easing, store/contexto/scan e fronteira GLB.
- **22 testes Python:** regressões dos onze falsos positivos G0, licença/disclaimer, tipos hostis, path fora do root, manifesto, seed legado e JSON ausente/inválido.
- **14 testes Playwright:** loading real, hit test real, lista/inspector, camadas/restauração, órbita/zoom, foco/reset, scan, modos/filtro, teclado/reduced motion, falhas/retry, perda real WebGL, desktop/silhueta e layout touch.
- `tests/e2e/production-profile.js`: perfil reproduzível no preview de produção, cache frio, 10 s warm-up + 30 s de amostra, transferência e contadores de renderer.

**Resultados históricos do G1:** typecheck/lint/unidades/Python/catalog/build passaram; 41 Vitest, 22 Python e 14 E2E. Após os últimos ajustes G1, quatro jornadas afetadas e um teste de scan/reduced motion foram repetidos. **Reexecução no checkpoint:** os sete comandos completos passaram novamente, com 41 Vitest/5 arquivos, 22 Python, catálogo v2 e 14 E2E, sem mudança de código/testes. [Resumo atual](../artifacts/checkpoint/local-validation.json) e [saídas completas](../artifacts/checkpoint/local-validation.txt). Consulte a seção de transferência em [IMPLEMENTATION_LOG](IMPLEMENTATION_LOG.md) para publicação e restauração por clone limpo. O perfil de FPS abaixo continua histórico e não foi medido novamente nesta operação.

Capturas próprias preservadas: [desktop 1440×900](../artifacts/gates/G1-desktop.png), [mobile 390×844](../artifacts/gates/G1-mobile.png), [silhueta](../artifacts/gates/G1-silhouette.png), [foco](../artifacts/gates/G1-focus.png), [scan 20%](../artifacts/gates/G1-scan-20.png), [scan 75%](../artifacts/gates/G1-scan-75.png), [mobile completo](../artifacts/gates/G1-mobile-full.png) e [seleção mobile](../artifacts/gates/G1-mobile-selection.png). A reexecução E2E pode atualizar esses arquivos; não tratá-los como snapshots de igualdade pixel a pixel.

**Prova de transferência:** `main` e a tag da baseline foram publicadas no repositório privado. O commit documental `2b64744a0065031b3c7f70ee70291a10a1671fac` foi confirmado na API GitHub e clonado em diretório temporário novo. `npm ci` (234 pacotes adicionados, auditoria npm reportou zero vulnerabilidades) e os sete comandos completos passaram: 41 unidades, 22 Python, catálogo v2, build e 14 E2E. Não foram copiados/ligados arquivos ignorados do workspace; hashes das pesquisas/seed/lockfile conferem, referências privadas ausentes e working tree do clone limpa. [Relatório](../artifacts/checkpoint/clean-clone-validation.json) e [stdout/stderr saneados](../artifacts/checkpoint/clean-clone-validation.txt). O commit de documentação posterior não muda o código testado. Ferramentas do host continuam pré-requisitos, e nenhum benchmark de FPS ou celular físico foi repetido.

### Performance observada, sem extrapolação

Perfil G1 de produção de 23/10/2026: Windows 11 Pro x64, i5-1135G7, 16 GB, Intel Iris Xe via ANGLE/D3D11, Chrome 155.0.8059.86 headless, 1440×900, DPR 1. CDP configurado para 20 Mbps e `latency=50 ms` (não certifica RTT físico simétrico). Interação em **1.680,9 ms**; após 10 s warm-up, 30.012 ms/1.800 intervalos: **59,88 FPS p50 / 59,52 p10**, **21 draws**, 149.898 triângulos, 13 geometrias, 3 texturas; transferência inicial **346.169 B** pela Performance API / 346.530 B CDP. Zero erros JS/HTTP/rede inesperados nessa medição.

Esses números são uma execução em uma máquina. Emulação 390×844 comprovou layout/toque, **não FPS de celular físico**. Contadores de heap/geometrias/texturas não certificam ausência de vazamento ou VRAM. Revisão de performance após ingressar assets reais é obrigatória; orçamento inicial continua ≤8 MiB comprimidos, <150 draws e interação ≤5 s nas condições declaradas, sujeito a evidência e revisão.

## Assets pendentes e contrato Blender → Web

Faltam corpo e pele aprovados, subestruturas segmentadas/revisadas, rig/UVs/LOD quando necessários, kakuhou autoral de produção, rig rinkaku/morphs/materiais, vasos, hemácia e célula RC esquemática. Não há `.blend` ou GLB anatômico entregue. Blender não foi encontrado no PATH na auditoria G0; disponibilidade de outra instalação não foi presumida. A continuidade do G1 não depende de Blender; produção da arte final depende de DCC/artista e revisão.

Tickets e faixas indicativas de esforço estão em [ASSET_INVENTORY](ASSET_INVENTORY.md), ART-02 a ART-07. BodyParts3D e AnatomyTOOL são candidatos, não assets aprovados. O portal histórico BodyParts3D e o README da distribuição oficial de 2025 apresentam licenças diferentes; vincular a licença **à versão e ao arquivo adquiridos**. Acessibilidade de página ou metadado de catálogo não autoriza redistribuição.

Contrato de ingresso a manter em G2A/G2B:

1. Proveniência por arquivo e textura: autor, origem/URL, distribuição/versão, data, SHA-256, licença/termos, atribuição e alterações. Origem desconhecida ou licença ausente mantém `blocked_by_license` e proxy.
2. Metros documentados, origem coerente no solo e export glTF Y-up testada em Three; transforms, bounds, orientação, normais e proporções revisados. Medidas do asset não viram cânone de personagem.
3. Mapa semântico `anatomyId → node(s) → bounds/anchor`, estável entre LODs; mesma seleção pela lista/hit test, isolamento/restauração e foco sem clipping. Não espalhar novos offsets pelo shell.
4. Contrato de nodes atual preservado ou mapeado explicitamente. Pipeline futuro pode usar `BODY_ROOT`, `SKIN`, `SKELETON`, `VASCULAR_MAJOR`, `KAKUHOU_RINKAKU`; não renomear IDs da UI nem declarar node existente antes da inspeção.
5. Para G3, `KAGUNE_ROOT`, `APPENDAGE_01…`, bones/weights/morphs realmente inventariados e finitos. Nomes sugeridos `root_reveal`, `appendage_extend`, `appendage_thicken` são expectativas, não recursos disponíveis.
6. GLB abre em viewer e na aplicação; materiais PBR/texturas têm termos próprios e custo medido. Compression/LOD só após validar compatibilidade e ganho. Casos de erro usam fallback identificado com conteúdo acessível.
7. Arte do kakuhou e RC mantém disclosure de reconstrução, independentemente de função/região descrita oficialmente. Sem histologia, organelas ou escala física RC inventadas.

O loader existente exige GLB da mesma origem, arquivo/metadata/licença/nodeNames e resolve nodes na cena ativa. Seus testes usam um contêiner binário glTF 2 **original, gerado em memória, com um node de grupo e sem malha anatômica**. Isso não prova importação de corpo, textura, skeleton ou morphs. Antes do uso real, G2A deve tratar URIs externas internas ao GLB, validação de meshes/bounds/anchors, recursos dependentes e ownership de skeleton/boneTexture, ImageBitmap e cenas secundárias. A verificação Python atual de nomes no JSON GLB não substitui verificar nodes utilizáveis/visíveis na cena ativa e geometria importada.

## Conteúdo que continua sem confirmação

[CONTENT_AUDIT](CONTENT_AUDIT.md) preserva 25 proposições: oito oficiais de escopo textual limitado, nove de mangá pendente, três de anatomia humana, uma inferência, duas reconstruções e duas desconhecidas. O runtime usa apenas o subconjunto mínimo necessário e funções humanas gerais; não precisa expor todos os futuros módulos.

Pendentes: presença/faixas RC humanas e ghoul, nome Red Child/morfologia, terminologia das três fases eventualmente atribuídas à obra, detalhes de RC pathways, ROS, Quinx/frames, meio-humanos e kakuja. Conferir legitimamente edição/capítulo/painel, registrar locator/resumo/data e limitar cada proposição. Leitor VIZ forneceu shell/redirecionamento na auditoria; nenhum painel relevante foi declarado lido. Não promover uma síntese secundária por conter marcador `turn…` de conversa anterior.

Young Jump/Marvelous sustentam as funções qualitativas conferidas, com escopo manga/editorial/anime separado; OpenStax oferece referência humana, sem autenticar anatomia ghoul ou geometria. Histologia profunda do kakuhou, vasos RC, dimensão física/organelas RC e fórmulas RC→força/regeneração continuam desconhecidos ou modelos explicitamente autorais.

## Problemas conhecidos e diferenças documentais

| Achado | Consequência para continuidade |
|---|---|
| Chunk lazy de cena ~947 kB minificado / ~253 kB gzip, acima do aviso local de 900 kB | Warning conhecido; medir antes de otimizar. Não aumentar limite para ocultar custo |
| R3F 9 usa `THREE.Clock` obsoleto no Three instalado | Warning de dependência sem falha funcional observada; não migrar para alpha por este motivo |
| Playwright espera revisão de browser que pode faltar no cache | Instalar Chromium compatível; config aceita Chrome instalado ou override. Chromium 151 antigo falhou em contexto nesta máquina; Chrome 155 passou |
| Só Chrome/Windows e viewport mobile emulado demonstrados | Firefox/Safari, outros GPUs/OS e celular físico não certificados |
| Corpo/órgãos P0 e âncoras aproximadas | G2B exige arte/revisão, não apenas substituição cega de arquivo |
| Catálogo v2 + seed v1 | Validar runtime v2; falha do seed é diagnóstico esperado, não regressão |
| Roadmap, inventário, ADRs e START_CODEX preservam frases “esta execução G0”/“sem app” | São snapshots históricos. Estado atual é este handoff + aceite G1 + log; não reinicializar scaffold nem repetir G0 como se o app não existisse |
| Roteiro QA geral inclui micro, manifestação e comparação | É checklist do MVP completo; G1 só comprova seu subconjunto. Não marcar G3–G6 concluídos |
| Nomes de screenshots antigos em docs/05 | Evidências efetivas G1 usam `G1-desktop.png`, `G1-mobile.png`, `G1-silhouette.png`, conforme roadmap revisado |
| URLs/árvores de arquitetura originalmente propostas | Seleção atual usa IDs pontuados; nenhuma rota editorial/backend foi implementada |

Aprovação humana final da direção de arte, revisão por anatomista e qualidade P2 permanecem pendentes. Não reclassificar esse limite ao fazer backup no GitHub.

## Preservação e o que restaurar fora do Git

Preservar no repositório código/configurações/lockfile, toda documentação, prompts, contratos, ferramentas, testes, recursos públicos autorais e as duas pesquisas Markdown. As pesquisas são referência interna de desenvolvimento; não entram em `public/` nem `dist/`. Sua preservação no Git foi solicitada pelo usuário e não autoriza republicação de material de terceiros citado nelas.

Pesquisas verificadas novamente por SHA-256 neste checkpoint:

```text
research/Anatomia e fisiologia dos ghouls em Tokyo Ghoul.md
5360bf58168343e595a62111f9a6dc20fc3dfd09ba327d1897c021c7a93b6c9d

research/Atlas Anatômico Interativo de Tokyo Ghoul.md
543f6556ac31e0db7dc380b6a4b934125edbfcbd8305849cd570b6c7499d7389
```

As oito capturas próprias são adequadas à preservação. Auditorias originais com caminhos absolutos e contexto da estação ficam locais/ignoradas; cópias saneadas preservam os resultados relevantes em `artifacts/checkpoint/`. Conferir os arquivos efetivamente incluídos e o inventário de transferência no log. Os originais não devem ser apagados.

`references/private/` continua excluída por direitos de terceiros. Para preservar esse material opcional de estudo, copiar a pasta diretamente entre computadores ou para armazenamento privado autorizado, conferir hashes do [inventário G0](ASSET_INVENTORY.md) e restaurar no mesmo caminho relativo. Não colocar em GitHub/`public`/deploy. Auditorias originais e relatórios brutos podem ser transferidos da mesma forma, em armazenamento privado; as versões saneadas bastam à leitura técnica do checkpoint.

`node_modules`, `dist`, caches, `.env` privados e relatórios transitórios do Playwright não são backup do projeto: recriar com instalação/build/testes. Credenciais de GitHub, configurações globais de Git e binários Node/Python/browser não pertencem ao repositório; configurar legitimamente no novo computador. Não existe asset GLB oculto nessa baseline a recuperar de cache.

## Próximas etapas propostas — exigem nova autorização

**G2A — infraestrutura GLB:** ler esta baseline e o contrato antes de editar; evoluir o seam existente, validar arquivo/recursos/nodes/meshes/bounds/anchors, ownership/abort/retry e fallback. Usar fixture original mínima para provar importação; não vendê-la como corpo final. Preservar IDs, catálogo, UI, estado e jornadas existentes. Aceite: checks atuais passam, teste positivo e negativos relevantes, erro/cleanup demonstrados e contrato de arte utilizável. Não implementar kagune/RC/micro nem adquirir modelo sem origem definida.

**G2B — assets definitivos:** receber/produzir base humana e kakuhou, conferir licença de cada recurso e revisão anatômica/visual, integrar no AssetSlot com mapa semântico, medir custo e repetir picking/lista/layers/foco/reset/resizes/erros e capturas. Selo conceitual do kakuhou continua necessário; asset mais detalhado não o transforma em histologia oficial. Se faltar arte, registrar blocker e manter proxy honesto.

**G3 — rinkaku:** somente depois do contrato/rig viáveis; `sampleAt(t)` determinístico nas sete fases `rest / activation / release / growth / fixation / active / retract`, scrub reversível e dez ciclos estáveis. Tempos, 1–4 apêndices desta demo e parâmetros materiais são escolhas artísticas. `t=1` encerra retração; ativo é amostrado em `.85–.95`.

**G4 — circulação/RC:** cena dedicada lazy, vasos didáticos, RBC e RC autorais instanciados com `instanceId→entityId` estável, follow/ida/volta preservando contexto. Perfis 100/500/2.000 partículas após warm-up; sem React por partícula, medidas RC inventadas ou transporte ilustrativo apresentado como histologia confirmada.

Não reimplementar o observatório, o catálogo v2, o gate editorial, picking, camadas, câmera, store, scan, fallbacks ou testes existentes. O próximo prompt deve começar com **“Execute somente G2A”** e critérios concretos; a operação de checkpoint termina sem executar esse prompt.

## Evidência de leitura deste handoff

Leitura direta nesta operação, além da inspeção de diretórios e Git:

- `AGENTS.md`, `README.md`, `START_CODEX.txt`, `.gitignore`, `references/LEIA_PRIMEIRO.md` e o anexo do usuário “CHECKPOINT, DOCUMENTAÇÃO E BACKUP NO GITHUB”.
- Todos os 18 documentos anteriores em `docs/`: `00_NORTH_STAR.md`, `01_ROADMAP_AND_GATES.md`, `02_EXPERIENCE_STORYBOARD.md`, `03_TECHNICAL_ARCHITECTURE.md`, `04_SIMULATION_SPEC.md`, `05_VISUAL_ART_DIRECTION.md`, `06_CANON_AND_DATA_RULES.md`, `07_ASSET_PIPELINE.md`, `08_QUALITY_ASSURANCE.md`, `09_NEXT_MODULES.md`, `ASSET_INVENTORY.md`, `CONTENT_AUDIT.md`, `DECISIONS.md`, `G1_ACCEPTANCE.md`, `G1_CATALOG_MIGRATION.md`, `IMPLEMENTATION_LOG.md`, `RESEARCH_INDEX.md`, `SOURCE_REFERENCES.md`.
- Todos os oito prompts anteriores: `00_AUDITAR_PESQUISAS.md`, `01_SHELL_VISUAL.md`, `02_CORPO_E_KAKUHOU.md`, `03_RINKAKU_MANIFESTACAO.md`, `04_CORRENTE_SANGUINEA_RC.md`, `05_ESTADO_E_CONTEUDO.md`, `06_POLIMENTO_RELEASE.md`, `G1_RECOMENDADO_APOS_G0.md`.
- `package.json`; registros resolvidos e engines relevantes de `package-lock.json` extraídos programaticamente; `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `playwright.config.ts`.
- `contracts/atlas-schema.ts`, `contracts/seed-catalog.json`, `contracts/design-tokens.json`, `public/catalog.json`, `public/ASSET_LICENSES.md`.
- `src/main.tsx`, os três arquivos de `src/app/`, `src/state/observatory.ts`, `scanClock.ts`, `observatory.test.ts`; `src/content/catalog.ts` e `catalog.test.ts`.
- `src/scene/ObservatoryScene.tsx`, `AssetSlot.tsx`, `camera.ts`, `camera.test.ts`, `proxyGeometry.ts`, `proxyGeometry.test.ts`, `proxy-manifest.json`; `src/visuals/assets/gltfResource.ts` e `gltfResource.test.ts`.
- `src/ui/SystemsIndex.tsx`, `EvidenceInspector.tsx`, `Timeline.tsx`, `Fallback.tsx`, `Icon.tsx`, `styles.css`; `tools/python.mjs`, `validate_catalog.py`, `test_validate_catalog.py`; `tests/e2e/observatory.spec.ts` e `production-profile.js`.

As duas pesquisas tiveram nomes/hashes conferidos novamente; a leitura integral do conteúdo e a inspeção visual das três referências privadas são evidências **do G0**, registradas em RESEARCH_INDEX, não uma alegação de releitura integral ou nova inspeção visual nesta contribuição. Os resultados de testes do checkpoint e da sincronização são registrados pelo responsável da operação no log/relatório, sem serem presumidos pelo autor deste documento.
