# G4A — Aceite do transporte vascular visual

> **Estado atual — G4A/G4A.1 aprovados pelo usuário como P1 suficiente para checkpoint.** A decisão humana posterior à revisão aceita as limitações procedurais descritas abaixo; não aprova arte/anatomia P2 e não abre G4A.2. A próxima fase é G4B, planejada e ainda não iniciada. Decisão e escopo no [checkpoint G4A/G4A.1](G4A_CHECKPOINT.md).

> **G4A.1 — revisão local de 25/10/2026 concluída tecnicamente:** câmera/oclusão, seleção sem cobertura dourada, parede mate e composição compacta. Passaram 203 unidades, 22 Python, catálogo, TypeScript, lint, build, 62 E2E completos e a rechecagem dos mesmos seis cenários após o último CSS; doze perfis de desempenho dentro dos budgets originais. A [documentação da revisão](G4A1_REFINEMENT.md), o [novo pacote comparativo](../artifacts/gates/G4A1-review/INDEX.md) e o [parecer crítico](../artifacts/gates/G4A1-review/REPORT.md) registram ganhos e limitações, incluindo a meta exploratória estática não atingida. Os números e capturas G4A abaixo são a baseline histórica, preservada; a aprovação P1 atual decorre da decisão do usuário, não dos testes. As execuções descritas não implementaram G4B/G5/G2B/G3B nem realizaram commit, push ou deploy.

**Registro histórico da execução G4A, 25/10/2026:** implementação concluída localmente e validada tecnicamente; a aprovação artística humana estava pendente naquele encerramento. Base: `717f4069c5e662f78ea8b28e7d13e0636ab0c5dd`, branch `main`. Escopo P1 independente da arte final, sem G4B/G5/G2B/G3B, commit, push ou deploy nessa execução.

Referências: [design](G4A_ENGINE_DESIGN.md), [modelo visual/fontes](G4A_VISUAL_MODEL.md), [contrato Blender futuro](G4A_BLENDER_CONTRACT.md). O [checkpoint G3A/G3A.1](G3A_CHECKPOINT.md) permanece histórico e não é evidência de execução G4A.

## Checklist de saída

- [x] Entrada Body→Micro comunica mudança de cena/escala e mantém a região aproximada identificada.
- [x] Ambiente vascular tem profundidade, curvatura e parede interna com leitura de volume, ainda esquemática.
- [x] Hemácia procedural bicôncava e RC conceitual têm silhuetas distintas nas capturas reais.
- [x] Sampler absoluto reproduz posições/orientações; IDs estáveis independem de população.
- [x] Bounds completos das partículas permanecem no interior conservador; emenda não cria salto nos testes.
- [x] Picking por mesh/instanceId e seleção HTML chegam à mesma entidade e evidência; parede opaca bloqueia picking.
- [x] Tracking conserva ID e trajetória; seleção ausente fica explícita ao reduzir o perfil.
- [x] Free/Flow/Tracking, liberação sem corte e reset de câmera funcionam; órbita, setas e toque testados.
- [x] Play/pause/speed/scrub/reset e destaque RC funcionam sem variável fisiológica inventada.
- [x] Dez transições Body→Micro→Body preservam seleção, camadas, câmera manual e timeline Rinkaku.
- [x] Reduced motion, página oculta, falha WebGL e retorno ao Body preservam conteúdo/contexto.
- [x] Recursos lazy são descartados/remontados, com contadores e UUIDs estáveis após aquecimento.
- [x] TypeScript, lint, unidades, Python, catálogo, build e 56 regressões E2E completos passaram.
- [x] Perfis100/500/2000 medidos separadamente,10s de aquecimento e30s de amostra.
- [x] Sete capturas, sequência e vídeo reais inspecionados; problemas constam do parecer crítico.
- [x] Classes/fontes/licenças revisadas;505 arquivos históricos preservados,166 saídas novas arquivadas; logs saneados; sem publicação.
- [x] Aprovação visual humana do P1 recebida — decisão atual do usuário: G4A/G4A.1 suficientes para checkpoint, com as limitações aceitas e P2 pendente; [registro da decisão](G4A_CHECKPOINT.md).

## Resultados históricos da execução G4A

| Comando/prova | Estado |
|---|---|
| `npm run typecheck` / `npm run lint` | Exit0, completos |
| `npm run test` | Exit0,190 testes/19 arquivos;51 novos testes sobre139 da baseline |
| `npm run test:catalog` / `npm run validate:catalog` | Exit0,22 Python e catálogo v2 válido |
| `npm run build` | Exit0, produção Vite com chunks Micro lazy |
| `npm run test:e2e -- --reporter=list,json` | Exit0,56/56 em9,5min;44 regressões anteriores +12 G4A; nenhum skip |
| Dez transições e descarte |10/10; Micro ativo0 ao sair, disposed=created; câmera/alvo<1e−7, quaternion<1e−12 |
| Tracking / loop / seleção ausente |42s reais, mesma identidade; remoção explícita e Esc contextual |
| GLB, câmera livre, reduced motion e falhas | Lease/socket/pose/isolar/opacidade preservados; teclado real e recuperação WebGL passaram |
| Perfis100/500/2000 | Relatórios independentes em `artifacts/g4a/production-*.json` |
| Capturas e filme / parecer crítico |17 capturas reais, incluindo sete obrigatórias e oito poses; vídeo com42s de transporte observado e quatro frames extraídos |

Logs/exit codes: [checks](../artifacts/g4a/checks.json), [E2E final](../artifacts/g4a/e2e-full.json) e [saída legível](../artifacts/g4a/e2e-full.txt). Provas: [dez transições](../artifacts/g4a/ten-body-micro-transitions.json), [tracking contínuo](../artifacts/g4a/tracking-loop.json), [liberação sem corte](../artifacts/g4a/camera-release-continuity.json), [contexto GLB](../artifacts/g4a/glb-context-roundtrip.json). Conteúdo/câmera/descarte têm testes puros próprios, sem usar capturas como prova numérica de contenção.

Falhas iniciais foram conservadas como histórico: dois valores de automação HTML inválidos; slider atrasado após passo; inércia residual na câmera reduzida; expectativa antiga de13geometrias no Body, anterior ao marcador de duas geometrias; e teclado de pan sem listener confiável. A expectativa G3A passou a comparar com a baseline corporal efetiva, conservando a verificação de liberação completa. Auditoria adicional corrigiu corte ao liberar tracking e damping antigo ao mudar reduced motion em Micro. Três testes direcionados e a suíte completa final passaram após as correções. A execução intermediária interrompida para corrigir câmera não é apresentada como suíte aprovada.

## Evidências visuais exigidas

O [índice real](../artifacts/gates/G4A-review/INDEX.md) reúne `G4A-entry.png`, `G4A-vessel-overview.png`, `G4A-rbc-closeup.png`, `G4A-rc-closeup.png`, `G4A-rc-selected.png`, `G4A-cell-tracking.png` e `G4A-mobile.png`, mais oito poses em0/5/10/15/20/25/30/35s, controles e evidências mobile. Desktop1440×900 e mobile390×844,DPR1,seed17,perfil500. [Metadados/hash](../artifacts/gates/G4A-review/captures.json) identificam câmera, entidade e tempo; [vídeo real](../artifacts/gates/G4A-review/flow-and-tracking.webm) inclui navegação e reprodução, sem aceleração ou injeção de avanço.

Foram inspecionadas formas, profundidade, progressão, enquadramento, controles e mobile, além de frames reais do filme. [Parecer crítico e inventário](../artifacts/gates/G4A-review/REPORT.md). Nenhuma referência artística, render Blender, imagem gerada ou figura externa aparece como resultado implementado.

## Orçamento e interpretação

Perfis de produção independentes para100/500/2000; registrar10s de aquecimento e30s de intervalos rAF, GPU/browser/CPU/RAM/rede/viewport/DPR. Metas existentes permanecem: p50≥50/p10≥30FPS desktop, draw calls<150, interação≤5s e payload inicial≤8MB comprimidos. Não aumentar budgets para aprovar a implementação. Dispositivo físico é necessário para afirmar FPS móvel.

Equipamento: Windows11, Ryzen7 5825U, Radeon integrada,16GB,Chromium156/ANGLE D3D11;1440×900,DPR1,cache frio e CDP20Mbps/50ms. Cada população tem contexto novo e execução sequencial. `readyMs` mede entrada no perfil padrão500 antes da troca de população; FPS e recursos medem o perfil solicitado após aquecimento. Resultados finais por perfil constam dos JSONs; nenhuma medição G3A foi reutilizada.

| População | FPS p50 / p10 | Draws | Triângulos | Relatório |
|---|---|---|---|---|
|100|59,88 /59,88|3|56.032|[produção100](../artifacts/g4a/production-100.json)|
|500|59,88 /59,52|3|214.432|[produção500](../artifacts/g4a/production-500.json)|
|2.000|59,88 /59,52|3|808.384|[produção2000](../artifacts/g4a/production-2000.json)|

Todos os budgets existentes passaram. Entrada Body fria1,44–1,64s; entrada Micro padrão1,44–1,47s incluindo aproximação; transferência conjunta observada391.985bytes. As populações foram medidas depois da entrada, não são três modos de boot. O renderer Micro conservou3geometrias/2texturas e UUIDs estáveis; o adaptador possui3materiais/1textura128²,dois pools de instância e capacidade2000. Body continua residente fora desses contadores. Sem sombras por célula,transparência ou pós-processamento; qualquer acréscimo futuro precisa de nova medição, não de um custo presumido.

Registrar custo incremental lazy, triângulos, geometria/texturas, sombras, transparência e efeitos. Heap pode variar com GC; contadores do renderer não estimam VRAM nem certificam ausência universal de vazamento. Medições G3A não substituem dados novos. Aprovação técnica, UX, visual e precisão anatômica são classificações separadas.

| Dimensão | Classificação nesta entrega |
|---|---|
| Técnica | Motor/integração G4A implementados e testes completos aprovados localmente |
| UX | Fluxos desktop, teclado, toque emulado, seleção ausente e fallback demonstrados; telefone físico pendente |
| Visual | Procedural P1 demonstrado e criticado; G4A/G4A.1 aprovados pelo usuário como suficientes para checkpoint, com limitações explícitas |
| Anatomia | Base humana geral para RBC/vaso, malhas didáticas; RC hipotética/sem histologia ou escala validada; nenhum P2 |

## Limites preservados

Sem histologia RC, dimensões micrométricas inventadas, circuito vascular corporal completo, CFD ou metabolismo compartilhado. A circulação RC desenhada é `hypothetical_model`; detalhes não demonstrados nas fontes consultadas são `unknown`. O lúmen e a hemácia são simplificações didáticas originais, não arte anatômica P2.

Ambiente independente dos runtimes documentados do Codex e celular físico continuam pendências anteriores, salvo nova evidência concreta. Não instalar ferramentas globais/dependências sem necessidade justificada. A aprovação humana atual do P1 é uma decisão de escopo/qualidade para checkpoint, separada dos checks automatizados e da validação futura P2.

**Achados históricos do G4A anterior ao refinamento:** parede lisa/escura em algumas áreas, reflexos muito claros, facetas em close, realce dourado que reduzia relevo, oclusão/sobreposição entre células e menor ocupação útil com tipografia mobile. Esses achados motivaram o G4A.1 e não descrevem todos o estado atual: seleção dourada foi substituída, iluminação/título foram refinados e oclusão foi reduzida com evidência.

**Limitações atuais aceitas como não bloqueadoras do P1:** parede esquemática, marcador fino/sutil, hemácia simplificada e espaço mobile apertado em algumas composições. Permanecem facetas, oclusões/sobreposições em cenas densas e ausência de colisão celular/deformação física, ramificação ou circuito corporal completo. A decisão humana permite o checkpoint sem novo G4A.2. P2 continua dependente de assets Blender próprios/licenciados, topologia/normais/materiais e envelopes homologados, integração pelo pipeline existente e revisão humana no renderer web. G4B é a próxima fase planejada, ainda não iniciada; seu escopo futuro não recebe histologia inventada.

## Preservação e estado Git

[Preservação histórica](../artifacts/g4a/history-preservation.json):505 originais conferidos por SHA256;166 arquivos modificados pelos testes foram arquivados sob `G4A-review/regressions/` antes de restaurar os bytes publicados. Nenhuma evidência antiga foi substituída no checkpoint de origem. Brutos/backup locais permanecem ignorados em `artifacts/local/`.

[Saneamento](../artifacts/g4a/evidence-sanitization.json):34 logs/JSONs novos revisados,11 alterados para remover107 ocorrências de caminhos pessoais ou BOM, com originais brutos/hashes conservados. Nenhum segredo identificado pelos padrões de alta confiança e revisão de escopo; não há novo asset externo, dependência ou ferramenta global. Catálogo/contratos de base, pesquisas, referências, fixtures e motor Rinkaku permanecem preservados.

[Auditoria final e inventário por hash](../artifacts/g4a/final-audit.json) registram branch/HEAD/origin-main, fonte/build, capturas, suites, budgets e conteúdo público no encerramento histórico G4A. Naquela execução, `main` estava sobre `717f4069c5e662f78ea8b28e7d13e0636ab0c5dd`, com alterações locais intencionais para revisão, sem stage/commit/push/deploy. A aprovação atual G4A/G4A.1 P1 foi concedida diretamente pelo usuário após a revisão própria deste pacote, sem derivá-la da aprovação anterior G3A; o [checkpoint atual](G4A_CHECKPOINT.md) registra a consolidação.
