# G4A.1 — Parecer crítico do refinamento vascular P1

25/10/2026. Refinamento implementado e validado tecnicamente, com capturas finais, vídeo e doze benchmarks pareados. A aprovação artística humana permanece pendente. Este parecer separa evidência técnica, experiência visual e fidelidade anatômica; não declara P2 concluído. [Índice do pacote](INDEX.md), [especificação do refinamento](../../../docs/G4A1_REFINEMENT.md) e [revisão histórica G4A](../G4A-review/REPORT.md).

## Material efetivamente inspecionado

Foram abertos os PNGs reais finais de [visão geral](after/overview.png), [RC selecionada](after/rc-selected.png), [tracking](after/tracking-occlusion.png), [hemácia](after/rbc-closeup.png), [parede](after/wall.png), [desktop com destaque](after/desktop.png) e [mobile](after/mobile.png), além dos oito quadros de reprodução listados abaixo. Foram comparados aos registros anteriores correspondentes preservados em [before](before/captures.json). Os smokes locais foram substituídos como referência deste parecer pela evidência final arquivada. Nenhuma imagem externa, render artístico ou imagem generativa foi usada como resultado implementado.

A [conferência dos metadados](comparisons.json) comprova igualdade de tempo, identidade, configuração e dimensões nas sete comparações. Visão geral e parede têm também câmera medida idêntica; são as duas comparações adequadas para isolar a mudança de apresentação com o mesmo enquadramento. RC selecionada, tracking, hemácia, desktop e mobile têm câmera diferente, consequência explícita do enquadramento adaptativo. Atribuir toda diferença desses cinco pares apenas ao material seria incorreto. O [painel comparativo](comparison-contact.svg) conserva os pixels reais e declara essa distinção.

O [vídeo real de tracking](after/tracking-42s.webm) foi renovado após a correção final da legenda, com [metadados](after/playback.json), hash e tamanho registrados: 18.712.109 bytes, SHA256 `42abf4f0b1988bc0dd8e34f2a2d20168146ef7bd4f10322a57f6d7e870ad0a79`. O arquivo inclui navegação; tempo de vídeo e timeline não são intercambiáveis. A revisão visual aqui documentada inspecionou os oito PNGs renovados durante essa mesma reprodução, e não afirma ter examinado cada frame do filme. A gravação e os PNGs anteriores estão preservados por cópia verificada em [history](history/after-2026-10-26T01-21-50.868Z/archive-manifest.json), com hashes; uma falha de operação no OneDrive não implicou descarte do histórico. Os estudos de CPU complementam essas imagens; não substituem a revisão humana contínua nem os benchmarks do renderer.

Também foram decodificados e abertos três quadros do vídeo final em [15 s](after/decoded/video-15.png), [30 s](after/decoded/video-30.png) e [45 s](after/decoded/video-45.png), usando o ffmpeg já existente. Confirmam a leitura do ID separado do aviso e a RC reconhecível nessas poses. A [proveniência](../../g4a1/video-decoding.json) associa os PNGs ao hash do filme final; tempos de contêiner não são valores de timeline. Isso não constitui inspeção artística de todos os frames.

## Materiais, parede e iluminação

As hemácias mantêm o carmim original; as RC mantêm o verde pálido e sua silhueta lobulada. Materiais Physical PBR opacos usam roughness 0,72/0,78 e specularIntensity 0,22/0,18, com metalness zero. A seleção deixou de preencher a célula com dourado. Testes com ambas as espécies, com e sem destaque didático, comprovam que selecionar e deselecionar conservam os buffers de cor, os vértices e as trajetórias.

O novo marcador consiste em pequenos arcos externos claros. É um gráfico de interface, sem halo ou luz emitida na cena. Usa depth test, não escreve profundidade e não possui raycast próprio: não captura o clique destinado às células e continua sujeito à oclusão da parede e de outros objetos. Acrescenta um draw quando visível e uma geometria/material próprios; não troca o instancing das células por objetos individuais.

Nas capturas finais, a RC selecionada conserva melhor a leitura de cor e volume que a seleção dourada anterior. Os reflexos brancos intensos vistos no baseline foram reduzidos. Há uma troca visual concreta: no [close final da hemácia](after/rbc-closeup.png), a face carmim é preservada, mas o centro bicôncavo permanece pouco contrastado. A forma existe na malha e fica mais evidente nas hemácias oblíquas da sequência. O marcador pode projetar alguns arcos sobre a face visível mesmo estando fora do bound tridimensional: ele não é um contorno de silhueta.

A parede interna continua BackSide e opaca. Usa cor-base #98606a, roughness 0,94, specularIntensity 0,12 e bumpScale 0,045, com textura autoral periódica 128 × 128. A cor por vértice ganhou variação ampla, e o relevo geométrico adicional cresce somente para fora, até 0,10 unidades ilustrativas. Os vértices reais mantêm raio mínimo 2,195 e máximo conservador 2,405; a mudança não estreita o envelope usado para conter as células. Nada disso identifica camadas histológicas ou estruturas RC oficiais.

A iluminação atual distribui mais luz ambiente/hemisférica, com intensidades 0,7/0,85, e reduz as duas fontes pontuais para 3,5/3; exposição 1,05. As células não têm emissão, transparência ou sombras individuais. Os valores são escolhas de visualização, sem interpretação clínica. Fog e perspectiva continuam ajudando a profundidade.

A parede aparece mais legível que o fundo quase preto anterior. Ainda lê como uma superfície ampla simplificada, com faixas geométricas perceptíveis e regiões lisas. O bump é discreto e não transforma essa malha em anatomia de alta fidelidade. Evitou-se usar brilho ou efeitos para sugerir detalhe inexistente.

## Morfologia e movimento preservados

As formas-base não foram substituídas: hemácia discoide bicôncava, com centro mais fino e borda mais espessa; RC autoral com lóbulos, sem organelas. Facetas e simplificações continuam visíveis em close, sobretudo na RC. A hemácia é um modelo didático humano; a forma RC continua interpretação artística/conceitual, sem escala real estabelecida.

IDs, seed, sampler absoluto, escala ilustrativa e trajetórias celulares foram preservados. A seleção, o destaque e a escolha de câmera não escrevem nesses dados. Os estudos pareados confirmaram os hashes das transformações amostradas; o estudo de reprodução também comparou um digest de todas as posições em todos os passos. O fechamento periódico, o volume completo das células e a estabilidade de recursos continuam cobertos pelos testes.

O novo planner escolhe uma pose desejada usando volumes conservadores da população. O relógio e a trajetória da entidade continuam independentes da câmera. A suavização é estado de apresentação: reprodução usa transporte periódico e correções limitadas; scrub explícito e reduced motion usam a referência absoluta. Portanto, determinismo do sampler, repetibilidade da pose estática e continuidade de reprodução são propriedades diferentes, verificadas separadamente.

## Oclusão medida: resultado e limites

O [estudo estático](../../g4a1/occlusion-study.json) compara três populações e três seeds em 81 instantes entre 0 e 40 s: 729 pares de poses. O ganho médio foi **+6,04 pontos percentuais**, abaixo da meta exploratória inicial de **+10 p.p.**. Essa meta não foi atingida. Há efeito de teto: vários baselines de 100/500 objetos já estão próximos de 100% de visibilidade. O ganho se concentra nos casos mais densos; em 2000/seed 17, a média estática foi 26,17% → 57,40%. O efeito de teto explica parte da distribuição do ganho, sem converter a meta não atingida em aprovação automática.

O [estudo final de reprodução](../../g4a1/playback-occlusion-study.json) usa a câmera efetivamente suavizada, 40 s a 60 Hz, com diagnóstico triangular a cada 30 frames. Cada versão inicia em sua referência estática de tracking em t=0. São 2400 passos de reprodução por execução, 81 amostras de visibilidade por caso/versão e 486 amostras no conjunto. A comparação não utiliza apenas a pose desejada do planner.

| População / seed | Visibilidade média G4A → G4A.1 | Amostras com ≥50% visível, depois | Oclusão severa <20%, antes → depois | Frames com gap <0,15, antes → depois |
|---|---:|---:|---:|---:|
| 500 / 17 | 95,61% → 98,26% | 100% | 0 → 0 s | 462 → 0 / 2400 |
| 2000 / 17 | 15,24% → 56,42% | 67,90% | 26 → 3,5 s | 2008 → 319 / 2400 |
| 500 / 73 | 95,86% → 100% | 100% | 0 → 0 s | 0 → 0 / 2400 |

O ganho médio desses três casos de reprodução foi **+15,99 p.p.**; não é o mesmo agregado do estudo estático. Todos os hashes pareados permaneceram iguais. No perfil denso, a maior sequência amostral severa caiu de 12 para 3 s. Permanecem oclusão e proximidade residuais: o gap mínimo da câmera aos bounds foi −0,02258 no caso 2000/17; nos dois casos 500 foi +0,30927 e +0,43497. Gap negativo é sobreposição com uma esfera conservadora, não prova de interseção com a superfície real da célula. O teste não garante separação geométrica da câmera em toda pose possível.

O [primeiro estudo de reprodução](../../g4a1/playback-occlusion-study-initial.json) foi preservado. Ele revelou picos de correção: no caso denso, aceleração máxima 220,39 unidades de visualização/s². Após o ajuste de transporte e correções limitadas, caiu para 6,58; o gap mínimo melhorou de −0,19929 para −0,02258 e os frames próximos de 1073 para 319. Nos três casos finais, aceleração máxima foi 6,65 / 6,58 / 8,20; o menor produto escalar entre vetores up consecutivos foi maior que 0,99999897. Isso sustenta continuidade numérica, sem substituir julgamento visual do movimento.

O diagnóstico usa raios sobre triângulos reais da célula selecionada, da parede e das demais células, após broadphase conservadora. A grade 9 × 9 estima fração de superfície visível; não mede área exata por pixel. Durações de oclusão têm resolução 0,5 s. Proximidade e movimento usam todos os passos a 60 Hz. Esses estudos são CPU, sem renderer, e não representam FPS, tempo GPU, VRAM, fisiologia ou colisão física.

## Sequência real e legibilidade durante tracking

Os oito quadros conservam a identidade `rc:17:0`, seed 17 e perfil 500. São capturas reais durante reprodução, com o intervalo observado antes/depois de cada captura informado nos metadados; não são poses montadas nem frames interpolados.

| Quadro real | Intervalo observado da timeline |
|---|---:|
| [01](after/sequence/tracking-01.png) | 0,104 → 0,348 s |
| [02](after/sequence/tracking-02.png) | 6,570 → 6,798 s |
| [03](after/sequence/tracking-03.png) | 12,448 → 12,675 s |
| [04](after/sequence/tracking-04.png) | 18,435 → 18,675 s |
| [05](after/sequence/tracking-05.png) | 24,355 → 24,608 s |
| [06](after/sequence/tracking-06.png) | 30,288 → 30,507 s |
| [07](after/sequence/tracking-07.png) | 36,201 → 36,410 s |
| [08](after/sequence/tracking-08.png) | 42,631 → 42,887 s |

A célula selecionada permanece inteira dentro do visor e reconhecível nos oito registros renovados. A orientação varia, revelando os lóbulos e também facetas/pregas simplificadas da RC. O cenário circundante continua sendo transportado; a identidade textual e os arcos permitem acompanhar o alvo sem mudar sua cor-base. Os diagnósticos registrados nesses quadros estimam visibilidade 1 em sete amostras e 0,9230769231 no quadro 04; o marcador não é incluído nessa fração.

Os quadros 05–08 mostram hemácias de primeiro plano grandes e parcialmente recortadas pelas bordas do visor. Isso preserva profundidade, mas limita a leitura do contexto e evidencia que a câmera adaptativa favorece a entidade selecionada, sem tornar todas as células igualmente inspecionáveis. Há superposições visuais entre células. A parede continua extensa e lisa em várias poses; o trecho curvo visível nos quadros 07/08 dá mais indicação do lúmen que os fundos quase uniformes dos quadros centrais. Nenhum desses achados comprova colisão física ou anatomia definitiva.

## UX e leitura no mobile

O título permaneceu um h1 acessível, agora menor, liberando a região central da cena. No [mobile final](after/mobile.png), a RC selecionada cabe no visor, sem cortar sua silhueta, e os controles da timeline aparecem abaixo dele; conteúdo adicional continua exigindo rolagem vertical. O disclosure conceitual e o ID selecionado permanecem visíveis. A comparação usa o mesmo viewport/timeline/configuração e uma câmera adaptativa diferente, declarada nos metadados. O registro emulado e os E2E não medem desempenho de um telefone físico.

A revisão da gravação anterior identificou sobreposição parcial do ID pelo aviso PROXY no desktop. A correção final restringiu o rodapé da microcena a 20 px do fundo no desktop, conservando 15 px no mobile. As sete capturas e os oito quadros renovados foram abertos novamente: legenda/ID e aviso conceitual agora possuem separação vertical e permanecem inteiros. A correção é de CSS; motor, câmera e materiais não mudaram após os estudos de transporte. A gravação anterior continua no histórico como evidência do defeito corrigido.

Os arcos externos são finos e fragmentados. No mobile, alguns trechos perdem contraste ou são ocludidos pelo entorno; não formam um contorno contínuo da entidade. É uma limitação de legibilidade a julgar com a revisão humana, preservando o comportamento correto de profundidade. Seleção HTML, identidade textual e inspector continuam sendo alternativas à leitura exclusiva do marcador 3D.

O [desktop com destaque](after/desktop.png) conserva a RC verde e escurece as hemácias, facilitando separar as duas representações. O custo visual é perder relevo e contexto nas hemácias escuras; o destaque continua opcional e não representa fluorescência biológica. Livre/Fluxo/Seguir, pausa, passos, scrub, reduced motion e retorno ao corpo foram exercitados na regressão. A política de pausa/scrub e pequenas revisitas de timeline também possuem o E2E específico; uma cena estática não demonstra por si só todos esses fluxos.

## Verificação disponível e trabalho pendente

Os [logs de comandos](../../g4a1/checks.json) registram exit 0 para TypeScript, lint, testes unitários, testes do catálogo, validação do catálogo e build. O [log unitário](../../g4a1/test.txt) registra **203 testes em 21 arquivos**; os [testes Python do catálogo](../../g4a1/test-catalog.txt) registram **22 aprovados**. Os nove testes do adapter cobrem cor e morfologia antes/durante/depois da seleção, marcador externo/picking, buffers de obstáculos, contenção, bounds e descarte dos recursos após dez ciclos de perfil/tempo.

A [suíte completa E2E](../../g4a1/e2e-full.txt) terminou com **62/62 aprovados em 9,6 minutos**, antes do último ajuste de espaçamento CSS. Inclui a preservação das experiências anteriores, dez transições reais Body/Micro/Body, tracking em reprodução, seleção ausente, retorno à pose real, reduced motion, orbit/pan, contexto WebGL perdido, fallback e mobile. Após a correção do aviso PROXY, os [seis cenários específicos foram reexecutados](../../g4a1/e2e-refinement-final.json): **6/6 aprovados em 36,1 s**, sem falhas, skips ou flakiness registrados. São cenários rechecados, não 68 cenários distintos. O [primeiro E2E específico](../../g4a1/e2e-refinement-first.txt), também 6/6, permanece como execução anterior e não é somado aos 62.

As sete capturas depois, seus metadados, painel comparativo, vídeo e oito quadros estão disponíveis e foram incorporados a este parecer. A aprovação artística continua com o usuário. Os testes funcionais verdes não classificam a representação procedural como anatomia P2.

## Benchmarks finais

As **12 medições independentes** foram concluídas: populações 100/500/2000 × Fluxo/Tracking × antes/depois, 10 s de aquecimento e 30 s de amostra por contexto novo, sem outra sessão automatizada de GPU em paralelo. As seis medições finais atuais e as capturas usam o build posterior à correção de espaçamento; resultados intermediários foram preservados. [Tabela completa](PERFORMANCE.md) e [dados/deltas/ambiente](../../g4a1/performance-comparison.json).

Todos os budgets originais passaram. FPS p50 59,88 antes/depois em todos os casos; p10 anterior 59,52 e atual 58,82–59,52. Fluxo manteve três draws; Tracking usa quatro pelo marcador. Contagens de triângulos 56.032 / 214.432 / 808.384 por população, inalteradas. UUIDs permaneceram estáveis e não houve erro JS, HTTP ou request falho. Entrada Body final 1,16–1,24 s, Micro padrão 500 em 1,40–1,44 s; transferência conjunta 394.992 bytes, +3.007 sobre a baseline.

Windows 11/Ryzen 7 5825U/Radeon integrada/16 GB, Chromium 156, viewport 1440 × 900/DPR 1, CDP 20 Mbps/50 ms e cache HTTP desativado. Uma execução por cenário/versão, sem prova de significância estatística: o teto de refresh pode esconder diferenças de margem GPU. Contadores Micro excluem o Body residente e não medem VRAM; percentis rAF não são tempos GPU. O diagnóstico de visibilidade não roda durante o perfil. `readyMs` mede entrada padrão 500, sem alegar inicialização direta de cada população. O aviso `THREE.Clock` deprecado é da dependência existente.

A [auditoria final](../../g4a1/final-audit.json) verifica separadamente hashes, escopo, recursos públicos, padrões de segredos e caminhos pessoais. O [saneamento](../../g4a1/evidence-sanitization.json) preserva os brutos e manifestos anteriores na área local ignorada. Nenhuma verificação de privacidade é presumida apenas a partir dos testes funcionais.

Resultado da conferência: zero falhas; 736 arquivos históricos iguais à baseline, 22 capturas e três frames decodificados conferidos, doze perfis válidos e nenhuma dependência nova/recurso público inesperado. Foram revisados 58 logs/JSONs novos, oito saneados e 58 ocorrências de caminhos pessoais removidas com backup. Nenhum padrão de segredo/caminho pessoal detectado no inventário final; busca dirigida, sem garantia universal. O arquivo preexistente não classificado da raiz continua fora do build e preservado sem aprovação de redistribuição.

## Inventário e responsabilidades

| Arquivo / grupo | Responsabilidade no refinamento |
|---|---|
| `src/scene/vascular/ProceduralVascularAdapter.ts` e teste | Materiais, parede com relevo somente externo, marcador, buffers globais de obstáculos, instancing e ownership |
| `src/scene/vascular/tracking.ts` e teste | Candidatos de câmera e custo de oclusão/proximidade; referência desejada sem escrever na simulação |
| `src/scene/vascular/camera.ts` e teste | Transporte pelo arco, referência absoluta, feedforward na reprodução e correções suaves limitadas |
| `src/scene/vascular/visibility.ts` e teste | Diagnóstico somente leitura sobre triângulos reais; separado do controle de câmera |
| `src/scene/vascular/VascularScene.tsx` | Integração por frame, política de snap/scrub, iluminação, picking e diagnóstico de renderer |
| `src/app/App.tsx` | Parâmetro URL `microSeed` validado para reproduzir cenários sem alterar o sampler |
| `src/ui/VascularWorkspace.tsx` | Título sem quebra forçada, indicação da revisão e controles sem alteração de domínio |
| `src/ui/vascular.css` | Título compacto e área útil de inspeção, conservando controles e disclosure |
| `tests/e2e/g4a1-refinement.spec.ts` | Fluxos novos, revisitas pequenas, seleção, modos de câmera, acessibilidade e mobile |
| `tests/e2e/g4a1-occlusion-study.mjs` | Comparação estática pareada de visibilidade real estimada |
| `tests/e2e/g4a1-playback-study.mjs` | Reprodução suavizada a 60 Hz, visibilidade, gaps, movimento e hashes |
| `tests/e2e/g4a1-production-profile.js` | Doze perfis de desempenho separados por população, modo e versão |
| `artifacts/gates/G4A1-review/capture.mjs`, `index.mjs` | Capturas reais, vídeo, metadados e conferência de comparabilidade |
| `artifacts/gates/G4A1-review/performance.mjs` | Comparação derivada dos doze perfis, sem executar simulação nem navegador |
| `artifacts/gates/G4A1-review/preserve-history.mjs`, `sanitize-evidence.mjs`, `audit.mjs` | Arquivo/restauração verificável das evidências, saneamento com backups e auditoria final de escopo |
| `docs/G4A1_REFINEMENT.md` | Contratos, hipótese, limites e protocolo do refinamento |
| Roadmap, log, handoff, retomada, aceite e README | Estado local atual separado dos checkpoints e resultados históricos |
| `docs/G4A_BLENDER_CONTRACT.md`, `public/ASSET_LICENSES.md` | Requisitos futuros de bounds/materiais/morfologia e proveniência dos recursos autorais |

`src/simulation/vascular.ts`, contratos GLB e evidências editoriais continuam sendo os limites da representação. O adapter é proprietário apenas de suas quatro geometrias, quatro materiais e uma textura; pools instanciados permanecem reutilizáveis. A câmera usa centros/raios já amostrados em buffers fixos, sem recriar células, geometrias ou materiais por frame. O shader adicional precisa ser julgado pelos perfis de produção, não apenas pela contagem de draws.

## Classificação crítica

| Dimensão | Avaliação com a evidência disponível |
|---|---|
| Técnica | Determinismo celular, seleção, volumes, buffers, recursos e continuidade numérica demonstrados. Regressão: 203 unitários, 22 Python e 62 E2E; após o ajuste CSS, 6/6 cenários específicos rechecados. Doze perfis nos budgets originais; auditoria de evidência/privacidade registrada separadamente. |
| UX | Título menor e seleção que conserva a identidade cromática melhoram a inspeção. Fluxos e mobile passaram na suíte completa; capturas finais e oito quadros reais foram inspecionados. Vídeo disponível para revisão humana contínua. |
| Visual P1 | Reflexos reduzidos, parede mais visível e tracking com melhora medida. Persistem parede simplificada, facetas, brackets finos, baixo contraste de alguns centros RBC e oclusões no perfil denso. Aprovação artística humana pendente. |
| Anatomia / P2 | Não entregue. RC permanece conceitual, sem histologia/escala oficial; vaso é circuito didático autoral. P2 depende de assets Blender próprios/licenciados, contrato de bounds/normais/materiais e revisão no renderer web. |

Não há colisão entre células, deformação física, rede ramificada corporal, CFD, calibração micrométrica RC ou metabolismo integrado. O refinamento não torna todo alvo sempre visível e não inicia G4B, G5, G2B ou G3B. A entrega técnica local está preparada para revisão humana; arte P1/P2 e eventual checkpoint dependem das respectivas autorizações. Nenhum commit, push ou deploy foi realizado.
