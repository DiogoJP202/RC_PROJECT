# G3A — Aceite técnico do motor de manifestação Rinkaku

> **Estado atual — 25/10/2026:** o usuário aprovou a entrega **técnica e visual do G3A.1 como protótipo P1, com ressalvas**. P1 significa interação/apresentação refinadas; não certifica fidelidade visual/anatômica P2. Bases ainda podem lembrar conectores, a pele e o tecido não formam uma superfície corporal contínua e há facetas em close-up. Arte/revisão Blender e P2 permanecem pendentes. Commit e push do checkpoint foram agora autorizados; sua efetivação e SHA remoto devem ser registrados após a conferência final. Deploy e implementação de G2B/G3B/G4 continuam fora do escopo; G4A está somente planejado.

> Revisão visual posterior do mesmo G3A: [pacote e índice](../artifacts/gates/G3A-review/INDEX.md), [parecer crítico](../artifacts/gates/G3A-review/REPORT.md). Capturas novas incluem sete fases, corpo opaco, lateral, crescimento, retração e mobile em reprodução. O aceite técnico abaixo permanece histórico; a revisão identifica implantação lombar, distinção das fases e ocupação móvel como refinamentos pendentes antes da aprovação visual. Nenhum código do produto foi alterado nessa revisão.

> Registro da entrega G3A.1 anterior à decisão de aceite: refinamento autorizado de implantação, identidade das fases, cadência e enquadramento, então com aprovação artística reservada ao usuário e sem autorização de publicação. A decisão de 25/10/2026 acima encerra essa pendência **no nível P1**. A duração automática atual é 21 s, com 3,4 s de retração; o sampler mantém fases e referência `motionTime` de 18 s. Os checks/métricas G3A abaixo continuam históricos e não contam como reexecução G3A.1.

24/10/2026, America/Sao_Paulo. Implementação local sobre `main` em `84e6e1f36b8558d225ae4baf82a8f79ddb35c124`; sem commit, push ou deploy nesta execução. Escopo: motor temporal e representação procedural original, independentes dos assets Blender. **G3A não conclui G3, G2B, G3B ou G4.** Anatomia permanece P0; aceite técnico do protótipo não substitui revisão artística humana.

Design: [G3A_ENGINE_DESIGN](G3A_ENGINE_DESIGN.md). Fronteira futura: [G3A_BLENDER_ANIMATION_CONTRACT](G3A_BLENDER_ANIMATION_CONTRACT.md). Decisões e correções: [IMPLEMENTATION_LOG](IMPLEMENTATION_LOG.md).

Consolidação de 25/10/2026, correções funcionais limitadas e verificação do build final: [G3A_CHECKPOINT](G3A_CHECKPOINT.md). Os resultados G3A e da entrega G3A.1 abaixo permanecem históricos; não substituem os resultados posteriores do checkpoint.

## Checklist e evidência

- [x] Motor e configuração verificados: [121 unidades e checks](../artifacts/g3a/validation.json).
- [x] Interação G3A e regressões G1/G2A: [33 E2E de produção](../artifacts/g3a/e2e.json).
- [x] Representação procedural e revisão visual: [poses e oito frames registrados](../artifacts/g3a/visual-captures.json), inspecionados conforme relato abaixo.
- [x] Repetição e descarte: [dez ciclos automáticos](../artifacts/g3a/ten-playback-cycles.json) e [dez manuais com remontagens](../artifacts/g3a/ten-cycles.json).
- [x] Orçamentos medidos nesta máquina: perfis [padrão](../artifacts/g3a/production-standard.json) e [econômico](../artifacts/g3a/production-low.json).
- [x] Proveniência, histórico e escopo local preservados: [auditoria final](../artifacts/g3a/final-audit.json), sem commit/push/deploy.

| Requisito | Resultado / evidência |
|---|---|
| Sampler puro, sete intervalos e valores finitos | Unitários de `src/simulation/rinkaku.test.ts`; limites, clamp, configurações inválidas, continuidade e sequências arbitrárias |
| Reprodução e scrub compartilham uma timeline | `src/state/rinkaku.test.ts`; relógio imperativo, pausa, direção, reset e preservação de contexto |
| Sem notificações React por frame de reprodução | Teste de 180 ticks sem notificação Zustand; buffers e materiais existentes aplicados via `useFrame` |
| 1–4 superfícies deformáveis originais | `ProceduralRinkakuAdapter.test.ts`: volume/pregas, curvatura intermediária, envelope, âncora, seed e buffers determinísticos |
| Conexão segue a cena | Socket `lumbar` do lease G2A; anchor do manifesto no proxy. E2E troca static/rigged/proxy e compara a raiz ao socket de mundo |
| Play, pause, retomar direção, reverso, steps, fase, scrub e reset | E2E G3A; pose `.7 → .2 → .3 → .7`, assinaturas, recursos e câmera |
| Câmeras posterior/lateral/lombar | Testes de câmera e E2E; envelope fixo não depende do quadro de scrub |
| Seleção, camadas, scan e bancada GLB preservados | E2E G1/G2A completos e contexto mantido nos fluxos G3A |
| Movimento reduzido, teclado, toque, falha WebGL | E2E manual, fallback explícito, perda real de contexto, controles de 44 px e viewport móvel sem overflow |
| Dez ciclos manuais completos e desmontagem | [ten-cycles.json](../artifacts/g3a/ten-cycles.json): todos os limites de fase, repetição da pose ativa e três desmontagens adicionais |
| Dez ciclos automáticos completos, duração original | [ten-playback-cycles.json](../artifacts/g3a/ten-playback-cycles.json): reset/play reais, sem acelerar ou injetar avanço durante a reprodução |
| Revisão visual independente das asserções | Cinco poses desktop e sequência de crescimento inspecionadas; relato abaixo |
| Catálogo/cânone, licenças e histórico preservados | Catálogo e fontes existentes sem alteração; proveniência procedural em `public/ASSET_LICENSES.md`; auditoria final |

Os dois testes de dez ciclos são provas distintas. Contadores de recursos e UUIDs não medem VRAM nem certificam ausência universal de vazamentos.

## Verificações desta revisão

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Passou |
| `npm run lint` | Passou |
| `npm run test` | 121 testes / 11 arquivos passaram |
| `npm run test:catalog` | 22 testes Python passaram |
| `npm run validate:catalog` | Catálogo v2 válido |
| `npm run build` | Passou; chunk da manifestação lazy de 12,47 kB / gzip 4,92 kB |
| `npm run test:e2e -- --reporter=list,json` | 33 passaram, 0 falhas/skips/flaky, 309,78 s; Chromium no build de produção |

Comandos/durações: [validation.json](../artifacts/g3a/validation.json) e [e2e.json](../artifacts/g3a/e2e.json), com [saída legível](../artifacts/g3a/e2e.txt). Os 33 E2E são 14 G1, 10 G2A e 9 G3A; os testes anteriores foram preservados. A contagem unitária inicial era 120; um teste adicional de curvatura intermediária elevou o total final a 121. A execução exploratória anterior de oito E2E passou, mas não substitui a suíte final de produção.

## Revisão visual

O primeiro passe exibiu silhueta excessivamente reta e reflexos fortes junto à raiz. As curvas receberam inflexões intermediárias em S e variação de profundidade, desenrolamento das pontas durante crescimento, mais volume e materiais com reflexão contida. A intensidade da resposta luminosa lombar foi reduzida. A câmera passou a respeitar o envelope posterior completo, sem truncar seu alvo nas restrições antigas de órbita.

As capturas desktop finais mostram raiz em repouso, resposta local na ativação, pontas em formação, silhueta ativa completa e redução de extensão/espessura na retração. A sequência de oito frames registra a mudança de forma, além da simples escala de um tubo. Corpo translúcido nas capturas desktop resulta da seleção do kakuhou pelo observatório; é contexto de inspeção, não uma alteração da anatomia. Não foi observado desprendimento da raiz nem corte das pontas no enquadramento de referência. Mobile final também foi inspecionado: corpo e quatro pontas cabem no visor, timeline fica legível abaixo da cena e não há overflow horizontal ou drawer sobreposto. Os controles testados têm pelo menos 44 px de altura. O sombreado e o volume continuam esquemáticos; há sobreposição das raízes e não existe solução de colisão tecido/corpo.

| Captura real da aplicação | `t` |
|---|---|
| [Repouso](../artifacts/gates/G3A-rest.png) | .04 |
| [Ativação](../artifacts/gates/G3A-activation.png) | .14 |
| [Crescimento](../artifacts/gates/G3A-growth.png) | .53 |
| [Ativo](../artifacts/gates/G3A-active.png) | .90 |
| [Retração](../artifacts/gates/G3A-retract.png) | .98 |
| [Mobile](../artifacts/gates/G3A-mobile.png) e [controles](../artifacts/gates/G3A-mobile-controls.png) | .90 |

Referência: quatro apêndices, seed 17, partículas habilitadas, qualidade padrão; viewport desktop 1440×900/DPR1, mobile emulado 390×844/DPR1. Frames de crescimento `.35/.40/.45/.50/.55/.60/.65/.70` em `artifacts/g3a/sequence/`. Metadados completos em [visual-captures.json](../artifacts/g3a/visual-captures.json). Capturas usam movimento reduzido para congelar a pose; a prova automática usa movimento habilitado.

## Performance e estabilidade

Dez ciclos automáticos pela UI concluíram `t=0 → 1`, com manifestação e retração, entre 18.919 e 19.101 ms observados por ciclo. O relógio tem duração artística de 18 s; os tempos observados incluem comandos, polling de conclusão e overhead de frames. Permaneceram **19 geometrias e 3 texturas** da cena, mesmos UUIDs do adaptador, seleção/camadas preservadas, zero erros e nenhuma perda de contexto.

Nos dez ciclos manuais, a pose `.90` repetiu a mesma assinatura e os recursos ficaram em 19/3. Sair do módulo retornou a **13 geometrias e 3 texturas**; três remontagens/desmontagens adicionais mantiveram esse patamar. O adaptador possui cinco geometrias/dois materiais/zero texturas e capacidade de 48 partículas; a resposta lombar possui outra geometria/material. Contadores da cena não são tamanhos em bytes.

Perfis próprios de produção, executados sequencialmente depois dos E2E e sem outra cena/teste 3D do agente concorrente. Ryzen 7 5825U (8 núcleos/16 threads), Radeon integrada via ANGLE/D3D11, driver `31.0.21925.1001`, Windows 11 Home build 26200, aproximadamente 16 GB RAM; Chromium 156.0.8078.4 headless, viewport 1440×900/DPR1. Node 24.22.1, npm 11.17.0, Python 3.12.14. [Ambiente](../artifacts/g3a/environment.json).

Protocolo: build Vite/preview local em 4173, contexto fresco/cache HTTP desabilitado, CDP 20 Mbps e latência configurada de 50 ms; 10 s de aquecimento e 30 s de intervalos `requestAnimationFrame`. Esta latência é configuração CDP, não RTT físico medido. Quatro apêndices/seed17, sequência completa de 18 s com restart por UI; todas as sete fases apareceram na amostra de cada perfil.

| Medida | Padrão | Econômico |
|---|---:|---:|
| Interação inicial Body | 1.274 ms | 1.254 ms |
| Ativação lazy da manifestação | 157 ms | 395 ms |
| Transferência inicial Body | 367.294 bytes | 367.294 bytes |
| Transferência adicional G3A | 5.194 bytes | 5.194 bytes |
| Body + manifestação | 372.488 bytes | 372.488 bytes |
| FPS p50 / p10 | 59,88 / 58,82 | 59,88 / 58,82 |
| Máximo draw calls observado | 23 | 22 |
| Frames / duração da amostra | 1.797 / 30.019,6 ms | 1.797 / 30.019 ms |
| Erros JS/rede/HTTP | 0 / 0 / 0 | 0 / 0 / 0 |

Relatórios: [production-standard.json](../artifacts/g3a/production-standard.json) e [production-low.json](../artifacts/g3a/production-low.json). Todos os budgets medidos passaram: interação ≤5 s, p50 ≥50/p10 ≥30 FPS, draws <150 e transferência inicial/conjunto <8 MiB. O preview serviu os JS/CSS comprimidos; as codificações por resposta estão nos relatórios. A carga normal não baixa a geometria procedural até a entrada na manifestação.

Uma execução por perfil, limitada ao ambiente declarado; percentis de rAF não são tempo de GPU nem certificação de aparelho móvel. Os FPS iguais perto de 60 não demonstram ganho percentual do modo econômico; este reduziu um draw e desativou partículas/luz local. Aviso conhecido: depreciação `THREE.Clock` dentro da dependência R3F. Não houve erro runtime, requisição falhada ou HTTP ≥400 nestes perfis.

## Limites e pendências

- Forma, cronologia, crescimento, espessura, fixação, partículas e resposta luminosa são `hypothetical_model`. Nenhuma claim foi promovida a `official`; variáveis não são fator RC, reserva RC ou medida fisiológica.
- Não há GLB Rinkaku final, rig artístico, mapas anatômicos ou implementação do adaptador GLB futuro. O contrato declara a indisponibilidade e exige mapeamento explícito por revisão.
- Sem colisões físicas, conservação de massa, solver de tecidos, sangue, feridas, regeneração ou combate. Não se afirma microanatomia interna do kakuhou.
- Movimento secundário deriva de tempo/seed absolutos; não continua acumulando quando pausado. Aba oculta, modo não corporal, reduced motion e falha de cena pausam; retomada exige comando explícito.
- Perfil econômico desativa partículas e luz local adicional, mantendo a mesma malha. Sem celular físico, FPS móvel permanece pendente.
- Node/Python ainda dependem da instalação local documentada no checkpoint; configuração independente reproduzível continua recomendada em [RESUME_ON_NEW_PC](RESUME_ON_NEW_PC.md). Nenhuma ferramenta global ou dependência nova instalada nesta fase.

**Implementado:** motor, procedural, interação e contrato. **Demonstrado:** cinco poses, oito frames de crescimento, mobile e inspeção no navegador das vistas posterior/lateral e foco lombar. **Testado:** 121 unidades, 22 Python, catálogo, TypeScript, lint, build, 33 E2E, dez ciclos automáticos, dez manuais e dois perfis de produção. **Pendente:** arte/revisão final, celular físico, ambiente independente e fases posteriores fora do escopo. G3A está tecnicamente concluído no escopo autorizado; G3 completo permanece pendente.

Integridade final, preservação dos 26 PNG históricos, cópias próprias das regressões atuais e saneamento dos relatórios: [final-audit.json](../artifacts/g3a/final-audit.json). Originais locais de logs e backups ficam em `artifacts/local/`, ignorado pelo Git. Nenhuma evidência histórica foi substituída pela medição G3A.

## G3A.1 — revisão artística local

Refinamento autorizado após a revisão crítica do pacote G3A. [Decisões e protocolo](G3A1_REFINEMENT.md). Resultados desta entrega estão em [G3A1_REFINEMENT](G3A1_REFINEMENT.md), com 134 unidades, 22 Python, catálogo, build e 40 E2E aprovados; [capturas e parecer](../artifacts/gates/G3A1-review/INDEX.md), ciclos e novos benchmarks acompanham o aceite técnico. **Em 25/10/2026, o usuário aprovou técnica e visualmente o protótipo P1 com as ressalvas abaixo.** Na entrega original não houve commit, push ou deploy; a autorização posterior permite consolidar o checkpoint por commit/push, sem deploy nem avanço para G2B/G3B/G4.

| Mudança local | Alcance e limite |
|---|---|
| Implantação integrada às superfícies procedurais, sem overlay rosa separado | Relevo de ativação, emergência inicial e pescoços distribuídos por 1–4 apêndices. Contato aproximado ao proxy, sem solver de pele/colisão nem garantia para GLB final |
| Supressão temporária da apresentação preexistente do kakuhou | Proxy/meshes do lease mantêm identidade, anchor/socket e bindings; sair restaura as regras do observatório. Não é remoção ou descarte do órgão |
| Identidade geométrica progressiva | Ativação localizada, liberação como extrusão e fixação por relevo/tensão. Diferença numérica por fase não constitui aprovação da leitura visual |
| Mapa temporal monotônico e invertível | 21 s no percurso completo; 3,4 s de retração, desaceleração suave em `.93..95`. Sampler e `motionTime` de referência 18 s continuam independentes do relógio |
| Vista oblíqua e enquadramento móvel estável | Câmeras explícitas, órbita manual e scrub preservados; verificar 390×844 e 430×932 com imagens reais antes de afirmar composição aprovada |

O pacote novo fica em `artifacts/gates/G3A1-review/`, separado da revisão anterior. Os testes novos e benchmarks ficam em `artifacts/g3a1/`. Comparações devem usar a mesma câmera, valores de `t`, quantidade/seed, qualidade/partículas, opacidade corporal, viewport e DPR; alterações de enquadramento móvel devem ser identificadas como tais.

### Checklist desta execução refinada

- [x] TypeScript, lint, unitários, Python, catálogo e build finais registrados.
- [x] Regressões completas G1/G2A/G3A e E2E G3A.1 registrados.
- [x] Dez ciclos automáticos completos com o novo transporte, sem acelerar/injetar scrub, e recursos observáveis registrados.
- [x] Dez ciclos manuais, reversibilidade, restauração e montagem/desmontagem registrados.
- [x] Novos benchmarks padrão/econômico, com protocolo e hardware, sem reapresentar números antigos como atuais.
- [x] Sete fases, oito frames de crescimento, retração sequencial e vistas posterior/lateral/oblíqua inspecionados.
- [x] Implantação e deformação inspecionadas com 1, 2, 3 e 4 apêndices, corpo opaco e foco lombar.
- [x] Antes/depois comparável e mobile em andamento nos dois viewports entregues.
- [x] Relatório crítico final distingue melhorias, problemas remanescentes e limites do proxy.
- [x] Aprovação técnica e visual humana **P1 com ressalvas**, concedida pelo usuário em 25/10/2026; não é autoaprovação do agente.
- [ ] Fidelidade visual/anatômica **P2** e arte final Blender aprovadas — permanecem pendentes.

Nenhum item deste checklist deve ser marcado somente por leitura do código ou pelos resultados históricos G3A. A emulação móvel não aprova GPU/ergonomia de telefone físico; contadores/UUIDs não são VRAM. Geometria e cronologia continuam **PROXY / CONCEPTUAL MODEL / hypothetical_model**, sem novas afirmações canônicas.

### Ressalvas aceitas no P1 e encerramento do checkpoint

As bases procedurais ainda podem parecer conectores em alguns ângulos. A continuidade dentro de cada apêndice não constitui continuidade topológica entre pele corporal e tecido emergente; bordas, mudança de material e facetas permanecem perceptíveis no close-up. Essas limitações foram aceitas para o protótipo P1 e continuam requisitos explícitos da arte/revisão Blender rumo ao P2, conforme o [contrato](G3A_BLENDER_ANIMATION_CONTRACT.md). O aceite não declara anatomia final, colisões resolvidas, GLB definitivo ou G3 completo.

A aprovação permite consolidar o estado existente por commit e push após revisão de arquivos/dados sensíveis e conferência de sincronização; não comprova que a publicação já ocorreu. A checagem complementar do último trecho da retração até `t=1` foi executada e revelou um desaparecimento terminal das bases, corrigido no escopo funcional do checkpoint. A superfície agora reduz extensão XY por `formation²` e altura relativa ao contato por `formation` antes da ocultação; a folga enterrada é artística e específica do proxy. Isso evita que um footprint finito suma somente pelo cutoff, inclusive através do corpo com opacidade de 20%.

Quatro E2E dirigidos passaram em **39,3 s**, cobrindo corpo opaco/transparente, 1–4 apêndices, foco lombar e lateral. PNGs em `.999` e `1` coincidiram com o repouso nas comparações registradas; zero partículas visíveis e retorno a 13 geometrias/3 texturas ao sair. Os 14 testes do adaptador passaram, incluindo a regressão que falhou antes da correção. As seis poses aprovadas `.14/.275/.53/.76/.90/.98` conservaram seus hashes; sampler, layout, materiais, transporte e recursos permaneceram. O clique real também passou após o helper de visibilidade verificar toda a cadeia de pais. [Evidências específicas](../artifacts/gates/G3A1-review/checkpoint/README.md).

- [x] Checagem complementar da última retração até `t=1`, correção funcional e evidência registradas no [checkpoint](G3A_CHECKPOINT.md).
- Procedimento de publicação: criar o commit, publicar normalmente em `origin/main` e conferir SHA remoto/working tree limpo no Git. O resultado é informado no encerramento; o commit não pode conter seu próprio SHA. [Registro do checkpoint](G3A_CHECKPOINT.md).

O resultado da suíte completa do build final é mantido no [registro do checkpoint](G3A_CHECKPOINT.md); esta seção não presume seu desfecho a partir dos quatro E2E dirigidos. O commit não inclui seu próprio SHA autorreferente: o responsável confirma o SHA efetivo e a sincronização por Git após publicar.

G4A permanece somente como próxima etapa planejada. Não houve implementação de G4A, G2B, G3B ou G4 por esta atualização documental.
