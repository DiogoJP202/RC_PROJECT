# G0 — Decisões de produto, engenharia e technical art

Data: 23/10/2026 (`America/Sao_Paulo`). Decisões técnicas adotadas para planejamento G0 e submetidas à revisão; implementação e avaliação visual começam em uma execução G1 separada. Evidências: [RESEARCH_INDEX](RESEARCH_INDEX.md), [CONTENT_AUDIT](CONTENT_AUDIT.md), [ASSET_INVENTORY](ASSET_INVENTORY.md).

## ADR-001 — Uma fatia vertical e uma instituição original

**Decisão:** manter PT-BR, um espécime neutro, rinkaku e percurso corpo → região lombar → kakuhou → vaso → RC → manifestação → evidência. `GHOUL ATLAS / RC OBSERVATORY` é identidade de trabalho, sem logotipo oficial. Primeiro entregar composição, navegação e preview no G1.

R2 sugere CCG, quatro tipos e inúmeros sistemas; o pacote executivo delimita uma fatia realizável. Órgãos completos, Quinx, kakuja, regeneração complexa e scanner clínico ficam no backlog. Reabrir apenas após G7 ou requisito humano explícito. Não haverá desenvolvimento desses módulos no G0.

## ADR-002 — Vite + React + TypeScript + R3F

**Decisão:** confirmar Vite, React, TypeScript strict, Three.js, R3F/Drei, Zustand, Vitest e Playwright; aplicativo estático sem backend. CSS com os tokens existentes; Tailwind pode organizar utilitários sem impor uma estética pronta. Não introduzir UI kit de dashboard.

O trabalho é interação 3D no cliente, sem requisito de SSR, contas ou CMS. Next.js em R2 acrescentaria complexidade sem resolver o risco principal de arte. Reavaliar se surgir conteúdo editorial indexável extenso ou funções de servidor. Nenhuma dependência foi instalada nesta auditoria.

Compatibilidade consultada em **23/10/2026**: a [documentação R3F](https://r3f.docs.pmnd.rs/getting-started/introduction) associa R3F 9 a React 19 e identifica R3F 10 como alpha. Planejar React 19/R3F 9 estáveis, com versões exatas e peers de Drei/Three verificadas e fixadas no lockfile do G1; não usar alpha/WebGPU como pré-requisito. O [guia Vite](https://vite.dev/guide/) informa os requisitos Node 20.19+ / 22.12+; há Node `v24.19.0` e npm `11.17.0` locais. Essa leitura não substitui `npm install`, typecheck e build reais no G1.

## ADR-003 — Separar UI, cena e engine

**Decisão:** Zustand guarda eventos/seleção, camadas, modo, filtro e comandos de reprodução. Transformações rápidas, buffers, ossos e uniforms ficam em refs/engine e `useFrame` com delta. Funções puras amostram timeline e presets. Reutilizar geometrias/materiais e usar instancing para células.

A [orientação oficial R3F](https://r3f.docs.pmnd.rs/advanced/pitfalls) recomenda mutação no loop e evita `setState` rápido. [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) permite repetir geometria/material reduzindo draws. Isso fundamenta a escolha; quantidade final de instâncias depende de profiling, sem promessa de 50 mil células.

Uma única origem de conteúdo: `src/content/{sources,claims,anatomy,assets}`; mapas espaciais em `src/anatomy/maps`. Não duplicar catálogos em `src/anatomy/content`. Esses diretórios são **planejados**, não existentes no G0.

## ADR-004 — Cenas por escala, contexto contínuo

**Decisão:** corpo e microcena têm câmeras e recursos distintos, com carregamento sob demanda. Breadcrumb e snapshot conservam espécime, seleção, camadas, bookmark e progresso. Câmera cinematográfica conecta a narrativa, sem exigir um universo 3D fisicamente contínuo de metros a micrômetros.

Bounds do asset determinam enquadramento; focus cancela transição anterior; reset/voltar são previsíveis. Anchor lombar é local ao modelo e aproximado. G1 demonstra overview/foco/reset; G2 exige mapa mesh/órgão; G4 implementa transição micro. Reabrir somente se a divisão impedir uma interação demonstrável.

## ADR-005 — Conhecimento e representação têm estados independentes

**Decisão:** `Claim.kind` informa certeza da frase; `modelStatus` e disclosure informam certeza da forma. Um kakuhou com função sustentada por fonte pode usar uma malha inteiramente hipotética. `official` no nó não pode eliminar o selo de reconstrução do mesh.

Filtro canônico atua sobre claims e seus avisos. Se a forma conceitual permanecer, fica dessaturada e identificada. No runtime, fonte oficial não conferida recebe indicação de pendência, sem selo `OFICIAL VERIFICADO`. Para questões sem evidência, escrever “não estabelecido nas fontes consultadas”, evitando alegar ausência em toda a obra.

A matriz de 15–30 claims fica em CONTENT_AUDIT no G0; só será convertida em catálogo de aplicativo no G1. O seed original permanece como exemplo e evidência do diagnóstico.

## ADR-006 — Fator RC, reserva e escala visual

**Decisão:** não exibir número de fator RC na primeira tela. Reserva, atividade, fome e integridade são variáveis normalizadas do modelo, quando introduzidas no G5. Nenhuma delas classifica espécie ou fornece força/regeneração clínica. Densidade de partículas é parâmetro de desenho.

Vocabulário interno único conforme o contrato: `reserve / activity / hunger / integrity`. `rcReserve` e `metabolicLoad` em docs/04 são aliases descritivos; não criar estados concorrentes. Se necessário, `injury = 1 - integrity` é uma convenção do modelo. Os quatro estados visuais de kakuhou são derivados das sete fases da timeline, sem máquina fisiológica concorrente.

Dimensões de corpo/vaso podem representar unidades do asset, se documentadas; tamanho RC, trajetos exatos e organelas não recebem escala científica. Falta de painel primário mantém faixas numéricas e Red Child pendentes. Reabrir cada claim somente com suporte direto e locator específico.

## ADR-007 — Proxy é uma entrega de interação, arte final é dependência

**Decisão:** G1 pode usar manequim autoral volumétrico segmentado, claramente marcado **`PROXY / CONCEPTUAL MODEL`**, com `AssetSlot` substituível. Não há modelo corporal, kakuhou, kagune ou rig entregue. Metadados `proxy` no seed não representam objetos existentes.

Corpo final/licenciado é blocker para qualidade anatômica/cinematográfica de produção; não bloqueia uma prova de navegação bem composta. Não chamar o proxy de atlas de alta fidelidade. Contrato de ingresso: origem/unidade/orientação, bounds, nodes, anchors, licença, hash, testes de importação e limites de custo conforme ASSET_INVENTORY. Não adquirir nem publicar assets de licença incerta.

## ADR-008 — Sete fases artísticas determinísticas

**Decisão:** o futuro G3 segue o enum já existente: `rest → activation → release → growth → fixation → active → retract`. Substitui a lista conflitante de seis estados do roadmap anterior. Os intervalos de docs/04 são coordenadas de animação, não tempos da obra.

`t=1` termina retração; o estado plenamente ativo é amostrado dentro de `.85–.95`. Voltar o slider não equivale a disparar a fase retract. `sampleAt(t)` precisa reproduzir o mesmo frame depois de scrub arbitrário. As três fases eventualmente atribuídas ao mangá ficam em claim separado, pendente. Não implementar essa engine no G0/G1.

## ADR-009 — Primeira tela com presença espacial

**Decisão de layout (a validar no browser em G1):** abrir diretamente o observatório; boot opcional curto e pulável. Não haverá hero de marketing. Desktop 1440×900: header de referência 64 px; índice 244 px; inspector 316 px; timeline 88 px; palco central de cerca de 880×748 px. Corpo ocupa **60–75% da altura útil do palco** (alvo 65%), com cabeça e pés íntegros e respiro para rótulos. Larguras não são coordenadas rígidas para todos os viewports.

Visual: fundo mineral azul escuro, pele neutra fosca, luz principal ampla, recorte frio moderado, RC rubro localizado e âmbar para hipótese; sem transparência de corpo inteiro acumulada ou bloom que destrua leitura. Overview 3/4; seleção lombar muda para posterior 3/4. Grounding e sombra discreta dão volume; não copiar os cartões, gauges, fontes ou contornos das screenshots.

Índice inicial oferece somente ações sustentadas pelo preview: superfície, região do kakuhou e evidências. Grupos futuros podem informar indisponibilidade com texto e estado desabilitado claro. Inspector começa com “Espécime de estudo / Rinkaku”, status do asset e limites da reconstrução; seleção mostra fonte e aviso distintos da forma. Sem métricas RC fictícias ornamentais.

G1: modos Corpo/Micro/Comparar navegam de verdade; Micro/Comparar podem ser estados informativos identificados como não implementados, conservando contexto. A faixa inferior mostra **inspeção/scan demonstrativo** se houver reprodução: play/pause/scrub alteram de fato linha/realce do scan, com rótulo de demonstração visual. Manifestação biológica permanece indisponível até G3; não mostrar controles ativos sem efeito.

Mobile 390×844: palco com altura útil mínima de referência 440 px em fluxo vertical, navegação compacta e inspector em folha recolhível. Abrir a folha reposiciona/expõe o conteúdo selecionado; não esconder a única ação ou exigir hover. Menos VFX, mesmos avisos e alternativa HTML.

Aceite visual depende dos três passes de docs/05: silhueta, UI e movimento (no G1, scan/câmera; fases do kagune somente no G3). Screenshots e avaliação humana são necessárias para a qualidade visual; este documento não a declara demonstrada.

## ADR-010 — Acessibilidade e falhas fazem parte do fluxo

**Decisão:** seleção via HTML equivalente ao preview, foco visível, nomes acessíveis e cor acompanhada de texto. Atalhos ignoram campos editáveis; Space não deve capturar eventos de slider/input. `prefers-reduced-motion` usa estados estáticos/cortes e mantém controles. Sem WebGL ou asset, conteúdo e índice continuam acessíveis com esquema 2D original e status do erro.

G1 cobre erro de contexto e asset, não somente teste `window.WebGLRenderingContext`. Nenhum fallback deve ser uma fotografia privada ou alegar anatomia real. Reavaliar por testes de teclado, toque e leitor de tela.

## ADR-011 — Gate documental e orçamento verificável

**Decisão:** G0 entrega documentação e diagnóstico; a regra geral de aplicativo/screenshot por gate aplica-se a partir de G1. Não fabricar uma captura G0 de app inexistente. O validador Python foi executado; typecheck/lint/test/build/smoke/browser são **não aplicáveis ao aplicativo no G0**, pois não existe scaffold. Isso não equivale a aprovação desses checks.

G1 cria os scripts, roda todos e mede o preview. Baseline futuro: desktop 1440×900, Chrome/Edge, registrar OS/GPU/browser/DPR e rede; warm-up de 10 s + amostra de 30 s, FPS p50/p10, draws, triângulos, transferência fria e tempo até controle responsivo. Metas iniciais: FPS p50 ≥50 e p10 ≥30, draws <150, assets iniciais ≤8 MB comprimidos, interação ≤5 s em rede de teste declarada (referência 20 Mbps, RTT 50 ms). São orçamentos de engenharia sujeitos a evidência, não medições já obtidas.

Viewport mobile emulado prova layout; não comprova FPS de celular real. Meta móvel ≥30 FPS exige dispositivo real registrado. Sem hardware de referência, marcar performance pendente, sem converter resultado de emulação em certificado.

## Riscos priorizados e dependências

| Prioridade | Risco / sinal observável | Mitigação e responsável funcional | Gate de controle |
|---|---|---|---|
| P0 | Sem corpo/rig: promessa cinematográfica apoiada apenas em texto | Technical art: proxy rotulado para G1; selecionar/produzir corpo com ticket e prova de licença. Qualidade final continua bloqueada | G1 preview; G2/G3 ingresso de arte; G7 final |
| P0 | Fonte oficial confundida com painel conferido, ou shape hipotético apresentado como ciência | Editorial + engenharia: auditoria por claim, locator, verifiedAt apenas após conferência, avisos por representação | Conteúdo antes de renderizar no G1; fechamento G6 |
| P1 | Modelos abertos/proprietários distribuídos sem cumprir licença; screenshots vazam para bundle | Arte + release: separar referências de `public`, manifest de arquivos e atribuições da versão concreta, auditoria do `dist` | G2 entrada; G7 publicação |
| P1 | Corpo visualmente pequeno / excesso de transparência / celular lento | UX + render: composição por bounds, teste de silhueta, carregamento por cena, DPR e instancing medidos | G1 capturas; G4 carga; G7 perfil |
| P1 | Escopo cresce e contratos divergentes criam UI falsa ou scrub inconsistente | Lead: um rinkaku, sete fases únicas, testes de seleção/contexto e determinismo, controles só quando funcionais | G1–G5 |

O Python no PATH é um alias Microsoft Store sem instalação funcional; o Python `3.12.14` do runtime Codex está disponível e validou o seed. Blender não foi encontrado no PATH; disponibilidade externa não foi presumida. Git existe, mas este diretório não tem repositório inicializado. Não se fez instalação, aquisição de modelo, scaffold, deploy ou commit no G0.

## ADR-012 — O validador mínimo não é um gate editorial nem de assets

**Decisão:** preservar o exemplo e validador recebidos no G0; no G1 criar validação de runtime estrita e fixtures negativas antes de expor o catálogo. A prova read-only em diretório temporário aceitou 11 documentos deliberadamente inválidos: versão errada, ID duplicado, câmera inexistente, foco de câmera inexistente, distância/transição negativas, enum anatômico inválido, node inexistente, GLB pronto ausente, asset aberto pronto sem licença, parent órfão e claim oficial sustentada só por secundária.

São necessários validação estrutural (campos/enums/IDs únicos e referências), gate editorial (fonte primária/locator/status de revisão/disclaimers) e gate de asset (arquivo ou gerador realmente disponível, nodes e proveniência). Para campo sem suporte no schema atual, adaptar o contrato no G1 e documentar migração. Um proxy procedural não exige GLB fictício; o manifest deve identificar seu gerador e autoria. Nenhum valor `ready` pode representar somente intenção.

`verifiedAt` deve registrar a conferência que ocorreu, com nota do escopo; metadados da página não significam painel lido. A matriz de CONTENT_AUDIT informa o que pode ser aproveitado. Dados humanos reutilizados num espécime ghoul continuam base de comparação; isso não comprova circulação ghoul real.
