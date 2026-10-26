# G4A.1 — Refinamento da experiência vascular

Registro original de implementação, 25/10/2026: revisão autorizada após a inspeção humana do G4A, mantendo o motor de transporte, IDs, seed, trajetórias e contratos de contexto/GLB. Aquele escopo não incluía G4B/G5/G2B/G3B, commit, push, deploy ou aprovação artística P2.

**Decisão atual do usuário:** G4A e G4A.1 aprovados como P1 suficiente para checkpoint, com limitações procedurais aceitas e sem novo G4A.2. Arte/anatomia P2 permanece pendente. G4B é a próxima fase planejada, ainda não iniciada. O [checkpoint](G4A_CHECKPOINT.md) registra essa decisão posterior às execuções e à revisão técnica descritas neste documento.

## Baseline e hipótese

O G4A é a baseline local sobre `main` em `717f4069c5e662f78ea8b28e7d13e0636ab0c5dd`. Antes de editar,889 arquivos de código/documentação/evidência e o build foram preservados na área local ignorada. O build anterior é servido separadamente para capturas reais antes/depois. O [aceite G4A](G4A_ACCEPTANCE.md) e seu [pacote visual](../artifacts/gates/G4A-review/INDEX.md) continuam históricos.

Hipótese: enquadramento orientado por volumes pode reduzir oclusões e células excessivamente próximas sem modificar partículas. Seleção externa, superfície mate e título compacto podem melhorar a leitura da mesma geometria procedural. Visibilidade geométrica, iluminação, estabilidade e aprovação artística são verificações distintas.

## Arquitetura e invariantes

`src/scene/vascular/tracking.ts` escolhe uma pose-alvo a partir da amostra absoluta e dos volumes da população atual. O próprio ID selecionado é excluído da lista de obstáculos; volumes atrás do alvo não contam como oclusores. O custo combina oclusão do cone de visão, proximidade e preferência pela vista nominal. Os candidatos cabem no disco conservador do vaso e não escrevem no sampler. A câmera pode depender da população por causa dos obstáculos; a trajetória da entidade continua independente dela.

`camera.ts` mantém somente o estado de apresentação/suavização. A reprodução transporta primeiro o deslocamento periódico da entidade e suaviza a correção do enquadramento, com limites de velocidade e aceleração; não aplica uma interpolação atrasada à trajetória inteira. A correção radial tem limites de 1,2 unidades/s e 4 unidades/s²; a correção ao longo do arco, 8 unidades/s e 6 unidades/s². Esses limites são de apresentação, não medidas fisiológicas. Scrub, pausa e reduced motion reconstroem a referência absoluta, inclusive passos menores que 0,4 s. Sair de Tracking/Flow mantém a pose atual. Referência absoluta e estado temporal da apresentação não são intercambiáveis: uma troca de candidato pode mudar a referência, enquanto a reprodução limita sua aproximação.

O adaptador preenche buffers reutilizáveis de centros/raios enquanto já amostra as instâncias. A consulta da câmera é O(K×N), com poucos candidatos, sem comparação entre todos os pares nem componente React por célula. Nenhuma variável RC, metabolização ou concentração clínica é criada.

## Seleção, parede e composição

A seleção conserva a cor-base e a geometria RBC/RC. Pequenos arcos externos usam `LineSegments`, depth test ativo, sem escrita de profundidade ou raycast próprio; continuam ocludidos pelas células e pela parede. O marcador acrescenta uma geometria/material de propriedade do adaptador e um draw quando visível. Descarte e perfis precisam conservar seus UUIDs.

Materiais celulares Physical PBR usam roughness0,72/0,78 e specularIntensity0,22/0,18. A parede tem roughness0,94, specularIntensity0,12, cor#98606a, bump autoral128² e variação ampla. O relevo geométrico adicional cresce somente para fora, até0,10unidades ilustrativas: raio mínimo2,195 preservado, máximo conservador2,405. Isso não representa uma estrutura histológica identificada. As células e sua escala não mudam.

Iluminação ambiente/hemisférica mais distribuída e luzes pontuais menos intensas reduzem dependência de reflexos brancos. Não há sombras por célula, transparência, emissão ou pós-processamento. O título da cena permanece acessível como `h1`, com presença menor no desktop/mobile; controles, evidências e disclosure são conservados.

Referência humana reconsultada: [OpenStax20.1, Shared Structures e Figure20.3](https://openstax.org/books/anatomy-and-physiology-2e/pages/20-1-structure-and-function-of-blood-vessels). Texto e legenda ajudam a delimitar o lúmen/revestimento; não autenticam as cores, os relevos autorais ou um vaso ghoul específico. Nenhuma figura foi incorporada ao build/pacote.

## Medição de oclusão

`visibility.ts` fornece um diagnóstico somente leitura: projeta os vértices reais da célula e amostra uma grade9×9. Raios que atingem a superfície selecionada são comparados com triângulos reais da parede e demais células, após filtro conservador por esfera. O resultado é uma estimativa amostral de fração visível, não área exata por pixel, nem validação fisiológica. O marcador de UI não conta como visibilidade da célula.

O estudo estático compara seed17/31/73 ×100/500/2000 ×81instantes entre0e40s. O estudo de reprodução usa40s a60Hz e diagnóstico a cada0,5s, com visibilidade, oclusões<20%, amostras≥50%visíveis, gaps a volumes celulares, velocidade, aceleração e continuidade do up. Durações amostrais têm resolução0,5s. Os hashes verificam igualdade dos movimentos antes/depois.

Foi registrada uma meta exploratória inicial de+10p.p. na média estática agregada. A primeira avaliação mostrou baseline já próxima de100% em várias cenas esparsas, ganhos concentrados nos casos densos e ganho agregado menor que essa meta. Esse resultado não será ocultado nem transformado em aprovação automática; a revisão também mede redução relativa da oclusão e estabilidade em reprodução.

## Validação e riscos

Preservar suítes anteriores e executar novos testes de tracking, morfologia/seleção, bounds, pequenos scrubs e mobile; repetir dez transições Body/Micro/Body, regressões Rinkaku e benchmarks independentes100/500/2000 sem elevar budgets. Capturas pareadas mantêm seed, ID, tempo, perfil e comandos iniciais; quando a câmera adaptativa mudar o enquadramento final, a comparação deve declarar essa diferença. Um vídeo contínuo complementa os quadros estáticos.

Riscos conhecidos: células se interpenetram por não haver colisões físicas; nem toda oclusão pode ser eliminada. Esferas conservadoras superestimam o volume das hemácias; gap negativo nelas é um alerta de proximidade, não prova de interseção com o triângulo. A revisão artística humana P1, pendente no encerramento técnico original, foi posteriormente recebida pela decisão atual do usuário. Telefone físico e P2 Blender continuam pendentes.

## Resultados verificados

| Evidência | Resultado |
|---|---|
| TypeScript, lint, build | Completos, exit 0 |
| Unidades | 203 testes em 21 arquivos, todos aprovados |
| Python / catálogo | 22 testes aprovados; catálogo v2 válido |
| E2E de produção | 62/62 completos; os mesmos seis cenários G4A.1 foram rechecados após o último ajuste CSS, 6/6 em 36,1 s; sem somar 68 cenários distintos |
| Contexto e recursos | Dez transições Body → Micro → Body, câmera manual/target, GLB, camadas, isolamento, Rinkaku, descarte e recuperação WebGL aprovados |
| Determinismo | Hashes de posições/matrizes antes/depois iguais nos estudos; scrub pequeno e retorno à mesma referência aprovados |
| Pareamento visual | Sete pares reais; oito frames e vídeo contínuo com pelo menos 42 s de transporte; câmera adaptativa diferente declarada nos metadados |

Comandos e saídas: [checks](../artifacts/g4a1/checks.json), [unidades](../artifacts/g4a1/test.txt), [E2E completo](../artifacts/g4a1/e2e-full.json). O [índice de revisão](../artifacts/gates/G4A1-review/INDEX.md) reúne as imagens originais e o vídeo; o [parecer crítico](../artifacts/gates/G4A1-review/REPORT.md) separa técnica, legibilidade e arte.

O [estudo estático](../artifacts/g4a1/occlusion-study.json) contém 729 pares de poses em nove combinações de seed/população. Ganho agregado de **6,04 pontos percentuais**: a meta exploratória de +10 p.p. **não foi atingida**. A baseline já alcançava perto de 100% em vários casos esparsos; não se altera a meta retrospectivamente. No caso 2.000/seed 17, a referência absoluta passou de 26,17% para 57,40% visíveis.

O [estudo de reprodução final](../artifacts/g4a1/playback-occlusion-study.json) mede 40 s a 60 Hz em três cenários, com 81 diagnósticos geométricos por execução e versão:

| Perfil / seed | Visibilidade média antes → depois | Oclusão severa antes → depois |
|---|---|---|
| 500 / 17 | 95,61% → 98,26% | 0 s → 0 s |
| 2.000 / 17 | 15,24% → 56,42% | 26,0 s → 3,5 s; maior intervalo 12,0 s → 3,0 s |
| 500 / 73 | 95,86% → 100,00% | 0 s → 0 s |

O ganho médio desses três pares foi de 15,99 p.p. No caso denso, a proporção de amostras com pelo menos metade da RC visível subiu de 12,35% para 67,90%; frames próximos a bounds de outras células caíram de 2.008 para 319 em 2.400. Permanecem aproximações: gap mínimo conservador −0,023 unidades, medido da posição efetiva da câmera ao bound da célula (`distância câmera–centro − raio celular`), sem descontar um raio de segurança da câmera. O limiar de proximidade usado nesse estudo é 0,15; o gap não prova cruzamento de triângulos. Método em [g4a1-playback-study.mjs](../tests/e2e/g4a1-playback-study.mjs). Não se promete ausência de oclusão em 2.000 células.

O primeiro passe adaptativo reduziu oclusões, mas introduziu picos de aceleração de aproximadamente 185–220 unidades/s². Esse defeito intermediário foi corrigido com transporte da entidade e limitação da correção; a evidência inicial foi preservada. As três execuções finais mediram máximos de 6,58–8,20 unidades/s² e `up` consecutivo ≥0,99999897. Esses 220 não pertencem à baseline G4A. Os valores absolutos são unidades da cena, não conforto universal certificado.

Medições do renderer/rAF de Flow e Tracking foram feitas separadamente em doze contextos novos de produção, com 10 s de aquecimento e 30 s de amostra por perfil/versão. O diagnóstico de raios não roda durante essas medições. **Todos os budgets originais passaram**, sem alteração de limites. Mediana 59,88 FPS antes/depois em todos os cenários; p10 anterior 59,52 FPS e final 58,82–59,52 FPS. Fluxo manteve três draws; Tracking passou de três para quatro pelo marcador. Triângulos por perfil: 56.032 / 214.432 / 808.384, sem alteração. [Tabela pareada](../artifacts/gates/G4A1-review/PERFORMANCE.md) e [dados completos](../artifacts/g4a1/performance-comparison.json).

Ambiente: Windows 11, Ryzen 7 5825U/Radeon integrada, 16 GB, Chromium 156, 1440 × 900/DPR 1, cache HTTP desativado, CDP 20 Mbps/50 ms. Entrada Body final 1,16–1,24 s e Micro padrão 500 em 1,40–1,44 s; transferência conjunta 394.992 bytes, +3.007 sobre a baseline. Tempos de entrada não representam inicialização direta de cada perfil. Uma execução por caso/versão: teto de refresh pode ocultar margem GPU; esses percentis não são tempo GPU, VRAM ou significância estatística. Não certificam telefone físico. O aviso de depreciação `THREE.Clock` pertence à dependência existente; sem atualização de stack neste gate.

A última inspeção do vídeo revelou o ID do visor parcialmente sob o aviso PROXY no desktop. O footer Micro foi deslocado para 20 px do rodapé; mobile manteve 15 px. A suíte de 62 havia terminado antes desse ajuste CSS localizado; depois dele, comandos completos de CPU/build e os seis cenários específicos foram repetidos, incluindo asserções de não sobreposição no desktop e nos dois tamanhos mobile. [Rechecagem final](../artifacts/g4a1/e2e-refinement-final.json). Uma tentativa com headless shell excedeu o timeout; a repetição no mesmo Chromium completo da baseline passou sem aumentar limites ou alterar expectativas. A tentativa e seu trace foram preservados.

As capturas e os seis perfis atuais foram renovados após esse último build; a baseline e o motor permaneceram iguais. Vídeo final: 42,56 s de transporte observado, com oito PNGs durante a reprodução e três quadros decodificados do próprio arquivo. O OneDrive impediu renomear a pasta anterior; o script passou a copiar e conferir cada hash antes de renovar arquivos conhecidos, sem apagar ou mover o histórico. A versão anterior e suas medições permanecem arquivadas no pacote.

Os 736 arquivos de evidência anteriores foram conferidos e preservados byte a byte; 170 saídas regeneradas durante regressões foram arquivadas no novo pacote antes da restauração. [Manifesto](../artifacts/g4a1/history-preservation.json). Materiais, marcador e relevo são autorais; nenhuma imagem, mesh ou render externo compõe as capturas.

**Implementado:** tracking adaptativo, apresentação temporal limitada, marcador externo, parede/iluminação e composição compacta. **Demonstrado:** comparativos e reprodução real em desktop/mobile emulado, com o último problema de sobreposição corrigido. **Testado:** suítes completas, rechecagem final, doze perfis e estudos determinísticos acima. **Aprovado pelo usuário:** G4A/G4A.1 como P1 suficiente para checkpoint. **Pendente:** telefone físico e qualidade P2 com assets definitivos homologados. A [auditoria de escopo/evidências](../artifacts/g4a1/final-audit.json) e o [saneamento com backups](../artifacts/g4a1/evidence-sanitization.json) registram as conferências próprias. As execuções técnicas descritas terminaram sem commit, push ou deploy.

Parede esquemática, marcador fino/sutil, hemácia simplificada e espaço mobile apertado permanecem limitações conhecidas, aceitas como não bloqueadoras do P1. O usuário não solicitou G4A.2 para esse fechamento. A evolução P2 exige assets Blender com autoria/licença, topologia/normais/materiais, bounds e revisão humana no renderer web conforme o [contrato](G4A_BLENDER_CONTRACT.md). G4B permanece planejada e não iniciada; seu futuro escopo não foi implementado ou validado neste gate.

## Checklist técnico G4A.1

- [x] Pose desejada determinística separada da apresentação temporal; identidade e trajetórias preservadas — [estudo de reprodução e hashes](../artifacts/g4a1/playback-occlusion-study.json).
- [x] Melhora de oclusão quantificada em seeds, tempos e populações diferentes, com limitações e meta exploratória não atingida explícitas — [estudo estático](../artifacts/g4a1/occlusion-study.json) e parecer crítico.
- [x] Seleção conserva morfologia/cor, instancing, picking e descarte; parede preserva contenção — [203 unidades](../artifacts/g4a1/test.txt), testes do adapter/câmera/visibilidade e fontes auditadas.
- [x] Teclado, reduced motion, passos/scrub pequenos e layout desktop/mobile preservados; ID e aviso sem sobreposição — [seis rechecagens finais](../artifacts/g4a1/e2e-refinement-final.json).
- [x] Suíte completa, dez transições Body/Micro/Body e regressões G1/G2A/G3A/G4A aprovadas — [62 E2E completos](../artifacts/g4a1/e2e-full.json), saídas novas arquivadas conforme manifesto de preservação.
- [x] Doze perfis independentes com os budgets originais — [comparação de desempenho](../artifacts/gates/G4A1-review/PERFORMANCE.md).
- [x] Sete pares reais, composição comparativa, oito frames e vídeo final inspecionados tecnicamente — [pacote de revisão](../artifacts/gates/G4A1-review/INDEX.md).
- [x] Histórico de 736 arquivos preservado; saneamento de 58 logs/JSONs, oito alterados e 58 ocorrências de caminhos pessoais removidas, com brutos arquivados — [manifestos de saneamento](../artifacts/g4a1/evidence-sanitization.json) e preservação.
- [x] Auditoria final sem falhas: 22 capturas obrigatórias e três frames decodificados conferidos, doze perfis, fontes protegidas, sem dependência nova nem conteúdo público inesperado; zero padrões de segredo/caminho pessoal detectados — [auditoria](../artifacts/g4a1/final-audit.json). Busca dirigida, sem garantia universal de ausência de credenciais.
- [x] Aprovação artística humana P1 — decisão atual do usuário aceita G4A/G4A.1 como suficientes para checkpoint, com limitações explícitas; [registro](G4A_CHECKPOINT.md).
- [ ] Arte/anatomia P2 e validação de telefone físico — dependências futuras; não implementadas nesta entrega.
