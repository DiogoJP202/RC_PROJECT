# G3A.1 — Refinamento visual e direção de arte

24–25/10/2026, America/Sao_Paulo. Refinamento do G3A existente, **aprovado técnica e visualmente pelo usuário em 25/10/2026 como protótipo P1, com ressalvas**. P1 corresponde à interação/apresentação refinadas; fidelidade visual/anatômica P2 e arte final Blender permanecem pendentes.

Na implementação e entrega originais, commit, push e deploy não estavam autorizados e não foram realizados. A decisão posterior de 25/10 autoriza **commit e push para consolidar este checkpoint**, após a conferência final; a publicação efetiva e o SHA remoto serão registrados pelo responsável. Não autoriza deploy nem implementação de G2B/G3B/G4. G4A é apenas a próxima etapa planejada.

Este documento registra a implementação e as verificações executadas no build refinado. O [aceite G3A](G3A_ACCEPTANCE.md), o [design](G3A_ENGINE_DESIGN.md) e o [contrato futuro Blender](G3A_BLENDER_ANIMATION_CONTRACT.md) continuam sendo referências. O [pacote G3A anterior](../artifacts/gates/G3A-review/INDEX.md) permanece histórico, sem substituir a nova evidência. A nova revisão está em [G3A1-review/INDEX](../artifacts/gates/G3A1-review/INDEX.md), com [parecer crítico](../artifacts/gates/G3A1-review/REPORT.md).

O [checkpoint de 25/10/2026](G3A_CHECKPOINT.md) registra as correções funcionais complementares e a verificação do build final. As métricas/suítes da entrega original abaixo continuam históricas, preservadas sem serem reapresentadas como resultado posterior à correção terminal.

## Problemas e causas identificadas

| Problema da revisão G3A | Responsabilidade técnica identificada | Critério para esta revisão |
|---|---|---|
| Remendo rosa, bases sobrepostas e encaixe abrupto | Proxy preexistente do kakuhou, overlay de `RinkakuScene.tsx` e superfícies independentes do adaptador | Apresentação original suprimida somente durante manifestação; geometria de implantação pertence ao adaptador e mantém o socket/anchor |
| Ativação/liberação pouco distintas | A emissão visível começava tarde, enquanto o overlay comunicava quase somente cor/brilho | Deformação localizada e exteriorização progressivas, com leitura geométrica própria |
| Fixação quase idêntica ao ativo | Variação de material/rigidez pouco perceptível na forma | Transformação gradual da superfície e do comportamento, sem salto de comprimento |
| Retração de aproximadamente 0,9 s | Reprodução antiga integrava `t` linearmente em 18 s | Transporte cinematográfico explícito, monotônico e invertível; fases e sampler preservados |
| Espécime pequeno no mobile | Envelope conservador, distância de câmera e distribuição da área de cena | Melhor ocupação do visor em 390×844 e 430×932, com câmera estável durante scrub e controles acessíveis |

Ocultar uma apresentação redundante não dispensa corrigir a geometria de implantação. A anatomia/proxy original, suas identidades, bindings e materiais devem continuar recuperáveis ao sair do modo. A conexão espacial correta é necessária, mas não equivale por si só a uma junção visual aprovada.

## Separação temporal preservada

O sampler `sampleRinkakuAt(t, config)` continua absoluto e determinístico. As sete fases mantêm os intervalos `[0,.08)`, `[.08,.20)`, `[.20,.35)`, `[.35,.67)`, `[.67,.85)`, `[.85,.95)` e `[.95,1]`; `t=1` termina recolhido. `motionTime` continua derivado de `t` e seed usando a referência artística de 18 s do G3A, sem ler relógio real.

`src/simulation/rinkakuPlayback.ts` introduz `playbackTimeAt(t)` e sua inversa `rinkakuTAtPlaybackTime(seconds)`. O percurso completo automático dura **21 s**, com **3,4 s** em `.95..1`. A densidade de tempo sobe suavemente entre `.93` e `.95`; a posição temporal não salta na entrada da retração. Esses segundos são uma escolha cinematográfica, não tempo biológico ou escala RC.

`rinkakuClock.elapsedSeconds` pertence ao transporte; `t` continua sendo a coordenada enviada ao sampler/adaptador. Scrub, passos e seleção de fase recalculam os segundos correspondentes. Pausar/retomar e mudar direção não introduzem uma segunda pose nem histórico de deformação. O reverso percorre o mesmo mapa, na direção oposta. O estado React continua recebendo comandos e leituras de baixa frequência; os ticks e buffers permanecem imperativos.

## Fronteira de representação e preservação do observatório

A implantação é geometria procedural original no espaço do adaptador. O modelo corporal original não recebe uma alteração topológica destrutiva. No proxy, a transformação vem do anchor do manifesto aplicado ao node real; no GLB, o socket `lumbar` do lease ativo permanece autoritativo. O refinamento não inventa um rig nem nomes finais de bone/morph/clip.

A supressão de apresentação deve se limitar às meshes já vinculadas a `ghoul.kakuhou.rinkaku` durante manifestação; não pode remover o node/anchor/socket, alterar o catálogo ou liberar recursos G2A. Ao sair, seleção, camadas, isolamento e a apresentação original retornam às regras do observatório. Os testes usam o proxy e as duas fixtures G2A, sem tratá-las como modelos finais.

As câmeras posterior, lateral, oblíqua e de foco lombar são comandos explícitos. A pose escolhida não deve ser recalculada a cada valor de timeline. Órbita manual, movimento reduzido e alternativas HTML continuam acessíveis. Melhor enquadramento não deve ser confundido com câmera automática seguindo o quadro sem autorização do usuário.

## Inventário da revisão

| Arquivo | Responsabilidade no refinamento |
|---|---|
| `src/simulation/rinkakuPlayback.ts` e `.test.ts` | Mapa invertível entre segundos cinematográficos e progresso; invariantes de continuidade e inversão |
| `src/state/rinkaku.ts` e `.test.ts` | Integração do transporte separado, pause/retomar/reverso/scrub e ausência de notificações por frame |
| `src/scene/rinkaku/ProceduralRinkakuAdapter.ts` e `.test.ts` | Implantação, progressão geométrica das fases, raízes/superfícies, normais, buffers e descarte |
| `src/scene/rinkaku/RinkakuScene.tsx` | Montagem lazy e aplicação absoluta usando anchor/socket real; ownership sem descartar lease |
| `src/scene/AssetSlot.tsx` e `src/scene/IntegratedAssets.tsx` | Apresentação do proxy e meshes do lease, preservando identidades, bindings, camadas e restauração |
| `src/scene/rinkaku/camera.ts`, `.test.ts` e `src/scene/ObservatoryScene.tsx` | Enquadramento móvel estável e nova vista oblíqua |
| `src/ui/RinkakuControls.tsx`, `src/ui/rinkaku.css`, `src/app/types.ts` | Comando oblíquo, distribuição móvel e tipos de foco |
| `tests/e2e/g3a1-refinement.spec.ts` | Sete fases ×1–4 apêndices, vistas, sequências, restauração proxy/GLB e dois viewports móveis |
| `tests/e2e/g3a1-production-profile.js` | Novas medições padrão/econômico; modo móvel emulado opcional, sem reutilizar números antigos |

Este inventário descreve responsabilidades previstas/observadas durante a execução; a auditoria final deve conferir os arquivos efetivamente alterados. As suítes antigas continuam exigidas. Ajustes de duração e contagem só são aceitáveis quando motivados pelo novo transporte/recursos, preservando os testes de determinismo, estabilidade e descarte.

## Protocolo de evidência e comparação

Novos screenshots e composições ficam em `artifacts/gates/G3A1-review/`; resultados de testes/benchmarks em `artifacts/g3a1/`. Nenhuma captura antiga deve ser sobrescrita. Só se usam pixels da aplicação real; painéis comparativos podem recortar, reduzir e legendar as fontes, sem retocar a geometria nem substituir o resultado por render externo.

- Comparação antes/depois: mesmos `t`, quantidade quatro, seed17, partículas ligadas, qualidade padrão, corpo opaco, viewport/DPR e câmera documentados. Uma câmera nova não pode ser apresentada como se fosse idêntica à anterior.
- Sete poses de referência: `.040/.140/.275/.530/.760/.900/.980`.
- Oito frames de crescimento: `.350/.400/.450/.500/.550/.600/.650/.700`; o último já é fixação, mantido por comparabilidade.
- Retração: `.950/.960/.970/.980/.990/.995/1.000`, com inspeção da sequência e da reprodução real, além dos números de continuidade.
- Implantação com 1, 2, 3 e 4 apêndices em crescimento, ativo e retração nas vistas posterior, lateral e oblíqua; detalhes de raiz em várias fases.
- Pares de fronteira antes/depois e `.700→.200→.700→.300→.700`, comparando buffer, raiz/pontas e câmera; igualdade da pose não substitui avaliação artística.
- Mobile 390×844 e 430×932: screenshot em crescimento automático real, registrando `t` antes/depois da captura, controles ≥44 px, ausência de overflow e movimento reduzido manual.

O novo E2E usa apenas comandos reais da UI para avançar a timeline e mudar câmeras. A API de diagnóstico é somente lida. Aprovar hashes diferentes por fase comprova diferença de dados geométricos, mas não certifica que um humano distinguirá as fases sem rótulos.

## Verificação e desempenho — nova execução

| Verificação desta implementação refinada | Resultado e evidência |
|---|---|
| TypeScript e lint completos | Passaram; [comandos/logs](../artifacts/g3a1/checks.json) |
| Unitários completos | **134 testes / 12 arquivos passaram**, incluindo mapa, estado, câmera e 13 testes do adaptador |
| Python e validação do catálogo | **22 testes passaram**, catálogo v2 válido; catálogo/claims preservados |
| Build de produção | Passou; chunk lazy RinkakuScene 13,29 kB / gzip 5,14 kB |
| E2E G1/G2A/G3A e refinamento | **40 passaram em 396,77 s**, 0 falhas/skips/flaky; [relatório](../artifacts/g3a1/e2e-results.json) |
| Dez ciclos automáticos de 21 s, recursos/descarte | **10 completos**, observados em 21.109–22.094 ms; 18 geometrias / 3 texturas e UUIDs estáveis, zero erros; [ciclos reais](../artifacts/g3a1/compat-ten-playback-cycles.json) |
| Dez ciclos manuais e montagem/desmontagem | Passaram; revisita determinística e três remontagens, retorno a 13 geometrias / 3 texturas; [ciclos manuais](../artifacts/g3a1/compat-ten-cycles.json) |
| Novos benchmarks padrão/econômico | Passaram; padrão, econômico, mobile emulado e baseline G3A congelada medidos novamente, tabela abaixo |
| Inspeção crítica das imagens/filme reais | Capturas das sete fases, 36 poses em três vistas/quantidades, sequências e mobile inspecionadas; [parecer](../artifacts/gates/G3A1-review/REPORT.md) e [índice do filme](../artifacts/gates/G3A1-review/INDEX.md) |
| Aprovação técnica e visual humana P1 | **Concedida pelo usuário em 25/10/2026, com ressalvas**; não equivale a P2 ou arte final |
| Revisão artística/anatômica P2 | Pendente; exige assets Blender e revisão da junção/tecido final |

Novas medições sequenciais no mesmo Ryzen 7 5825U, Radeon integrada/ANGLE D3D11, cerca de 16 GB, Windows 11 build 26200, Chromium 156.0.8078.4 headless. Desktop 1440×900/DPR1; mobile emulado 390×844/DPR1. CDP20 Mbps/latência50 ms, cache HTTP desabilitado, 10 s de aquecimento e 30 s de intervalos rAF, diagnósticos a baixa frequência. O novo percurso de 21 s altera o tempo de permanência em algumas poses; a baseline congelada usa os 18 s antigos, portanto o workload de movimento difere intencionalmente.

| Perfil medido nesta execução | Interativo | FPS p50 / p10 | Draws máx. | Geometrias / texturas |
|---|---:|---:|---:|---:|
| [G3A anterior, baseline congelada](../artifacts/g3a1/baseline-standard-fresh.json) | 1.375 ms | 59,88 / 58,82 | 23 | 19 / 3 |
| [G3A.1 padrão](../artifacts/g3a1/production-standard.json) | 1.263 ms | 59,88 / 58,48 | 20 | 18 / 3 |
| [G3A.1 econômico](../artifacts/g3a1/production-low.json) | 1.214 ms | 59,88 / 58,82 | 19 | 17 / 3 |
| [G3A.1 mobile emulado](../artifacts/g3a1/production-emulated-mobile-standard.json) | 1.386 ms | 59,88 / 59,52 | 20 | 18 / 3 |

Todos os budgets declarados passaram. Zero erros JS, HTTP ou requisições falhadas; aviso preexistente de depreciação `THREE.Clock` na dependência. Transferência fria Body 367.909 bytes + lazy 5.420 bytes = 373.329 bytes, comparada a 372.488 bytes na baseline anterior. Ativação medida 383 ms no padrão, 393 ms no econômico e 199 ms no mobile emulado. Máximo de triângulos: 148.030 / 147.170 / 148.110, respectivamente. Heap antes/depois e UUIDs estão nos relatórios; não se infere VRAM desses valores.

UUIDs e contadores devem ficar estáveis depois de aquecer o renderer, e as desmontagens devem devolver os recursos extras. Contadores de geometrias/texturas não medem VRAM; heap varia com GC. Emulação móvel usando a GPU deste computador não certifica FPS, temperatura ou ergonomia de um aparelho físico. Relatórios anteriores continuam históricos e não contam como execução nova.

O comparativo mobile mediu a fração vertical projetada do bounding box corporal: **41,0% → 56,7%** no viewport390 e **45,0% → 59,7%** no430. É uma métrica de enquadramento, não segmentação de pixels ou escala anatômica. Câmera/layout mudam intencionalmente nesses pares; os 25 pares desktop preservam câmera, `t`, configuração e opacidade com tolerância `1e-6`. Quatro pares mobile conservam `t`/configuração/viewport. O [manifesto dos painéis](../artifacts/gates/G3A1-review/compositions.json) valida os 29 pares.

O [filme real](../artifacts/gates/G3A1-review/playback-and-reverse.webm) registra ciclo posterior completo (21.093 ms), trechos `.93→1` lateral/oblíquo (4.281/4.261 ms) e reverso posterior completo (21.117 ms), sem aceleração ou avanço sintético. Poses/tempos e ausência de erros estão em [comparison-captures.json](../artifacts/gates/G3A1-review/comparison-captures.json). Frames extraídos do filme foram inspecionados junto às sequências estáticas e integraram o pacote submetido ao aceite P1. A checagem complementar posterior do último trecho até `t=1` encontrou e corrigiu um defeito terminal; sua evidência separada está descrita na seção de checkpoint abaixo, sem substituir esse filme histórico.

## Limitações e decisão artística

Todas as formas, fases, materiais, pregas e tempos permanecem `hypothetical_model` e **PROXY / CONCEPTUAL MODEL**. A cena não comprova ductos, vasos, histologia, dinâmica de fluidos ou fisiologia canônica de kakuhou. Sem solver de colisão ou anatomia final, a revisão precisa delimitar as poses/seeds/quantidades efetivamente inspecionadas; não pode prometer ausência universal de interseções.

O adaptador GLB futuro continua indisponível até existir asset licenciado, mapeamento explícito e revisão artística de seu envelope. O aceite P1 melhora a leitura procedural sem declarar arte Blender, fidelidade P2 ou G3 completo. O [contrato futuro](G3A_BLENDER_ANIMATION_CONTRACT.md) transforma as ressalvas em requisitos verificáveis de junção lombar, continuidade pele/tecido, materiais, topologia, close-up, envelope e retração.

No foco lombar ainda aparecem bordas de implantação e facetas; fixação/ativo têm diferenciação mais sutil que liberação/crescimento. A silhueta posterior continua estilizada em X. Nas 36 poses inspecionadas não foi observada penetração distal grosseira no tronco, sem garantia universal de colisão. Fast Refresh após recriar recursos de `RinkakuScene` requer reload completo no dev; uma rodada dev com edição simultânea foi invalidada, e a aceitação técnica usa o build de produção imóvel. Nenhuma ferramenta/dependência nova foi instalada; Node/Python independentes do Codex e telefone físico continuam pendentes conforme o checkpoint.

**Implementado:** implantação/fases refinadas, transporte invertível, câmera móvel e oblíqua, preservação de apresentação/seleção/GLB. **Demonstrado:** capturas reais comparáveis, 1–4 apêndices em três vistas, crescimento/retração, mobile e reverso. **Testado:** verificações completas, ciclos e quatro perfis novos acima. **Aprovado:** entrega técnica e visual P1 pelo usuário, com ressalvas. **Pendente:** P2/arte e revisão Blender, telefone físico, ambiente independente e limitações declaradas. A [auditoria final da entrega](../artifacts/g3a1/final-audit.json) preserva o sampler, catálogo, contratos, dependências e 146 arquivos de evidência anteriores; não comprova a publicação posterior do checkpoint.

### Ressalvas preservadas no aceite de 25/10/2026

- As bases ainda podem transmitir leitura de conector. O P2 deve substituir essa aproximação por uma junção lombar artisticamente integrada ao corpo.
- A pele corporal e os apêndices continuam meshes independentes; não foi entregue uma superfície pele/tecido contínua ou deformação corporal de produção.
- Facetas, bordas e mudanças de material permanecem visíveis no close-up; acabamento/topologia/normais dependem da revisão Blender.
- O aceite é de protótipo P1 e não promove a representação a anatomia final, cânone comprovado ou fidelidade P2.

### Correções funcionais e verificação do checkpoint

A conferência final encontrou bases ainda finitas perto de `t=1`, retiradas abruptamente pela visibilidade. A correção recolhe a superfície inteira, incluindo caps e pontas de diagnóstico, para o contato enterrado: extensão XY escalada por `formation²` e altura relativa por `formation`, ambos derivados dos canais absolutos já existentes. Não altera o sampler, mapa temporal, layout, materiais ou orçamento de recursos. As seis poses `.14/.275/.53/.76/.90/.98` mantêm hashes idênticos; a folga de contato é uma aproximação artística do proxy, não anatomia aprovada.

Os **14 testes do adaptador** passaram, incluindo regressão inicialmente vermelha. Os **quatro E2E dirigidos passaram em 39,3 s**: 1–4 apêndices, foco/lateral e corpo opaco/transparente a 20%; comparações de PNG de `.999` e `1` coincidiram com o repouso nos casos registrados, com zero partículas visíveis. Ao sair, recursos retornaram a 13 geometrias/3 texturas. São diagnósticos observáveis, não VRAM ou prova universal de colisão. [Evidência da checagem](../artifacts/gates/G3A1-review/checkpoint/README.md).

O helper `src/scene/visibility.ts` e os handlers de picking também verificam os pais: meshes prealocadas sob um grupo oculto deixam de bloquear o clique através da superfície transparente. O teste de clique real passou. Essa proteção preserva identidade, bindings, sockets e a apresentação anatômica; não acrescenta uma nova funcionalidade de produto.

O [registro G3A_CHECKPOINT](G3A_CHECKPOINT.md) concentra a suíte completa do build final e a consolidação. Seu resultado não é presumido a partir dos testes dirigidos acima. Commit/push estão autorizados, com confirmação posterior de HEAD/origin/main/SHA remoto e working tree limpo; um commit não pode conter seu próprio SHA autorreferente. G4A permanece somente planejado e P2/Blender pendentes.
