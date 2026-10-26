# Checkpoint G4A / G4A.1 — módulo vascular P1

25/10/2026, America/Sao_Paulo. O usuário aprovou explicitamente a revisão visual e considerou **G4A/G4A.1 suficientes para encerrar o módulo vascular como protótipo P1**, com as limitações abaixo. Autorizou consolidação, commit e push normal em `origin/main`. Decidiu **não abrir G4A.2**. Este checkpoint não inclui G4B, G5, G2B ou G3B, nem deploy.

## Aprovação e dependências

| Camada | Decisão |
|---|---|
| Motor, navegação, tracking e apresentação vascular P1 | Aprovados pelo usuário |
| Parede esquemática, marcador RC fino/sutil, hemácias simplificadas e mobile apertado | Ressalvas aceitas, não bloqueadoras deste checkpoint |
| Qualidade anatômica/artística P2 | Pendente de assets definitivos próprios/licenciados e revisão Blender/web |
| Telefone físico e ferramentas independentes do Codex | Pendências de validação, sem alegar comprovação nesta estação |
| G4B — exploração ampliada da célula RC | Próxima etapa planejada; não implementada nesta execução |

O aceite P1 não transforma o circuito didático em CFD, histologia, escala RC validada ou anatomia final. Classes editoriais, fontes e hipóteses permanecem delimitadas. Não existe autorização para inventar organelas ou mecanismos canônicos na futura exploração RC.

O [contrato Blender](G4A_BLENDER_CONTRACT.md) exige licença/autoria, normals/materiais, concavidade RBC legível, silhueta RC preservada, envelopes completos incluindo deformações, compatibilidade com IDs/picking/instancing/ownership e nova validação de contenção/tracking/performance no renderer web. A aprovação do procedural não aprova automaticamente um futuro GLB.

## Implementação preservada

Motor vascular separado de interface e renderer, sampler absoluto, identidade semântica independente da população, perfis 100/500/2.000, seleção por clique/HTML, câmeras Livre/Fluxo/Tracking, referência de pose determinística separada da suavização, bounds completos e recursos reutilizáveis. Entrada/retorno Micro preservam câmera manual, alvo orbital, seleção, camadas, opacidade e manifestação Rinkaku; Esc continua contextual.

G4A.1 acrescenta enquadramento orientado por obstáculos sem mover partículas, limites de apresentação temporal, seleção externa que conserva cor/relevo, parede e luz menos reflexivas, título compacto e correção da sobreposição ID/aviso. Nenhum refinamento novo foi aberto no checkpoint. Apenas documentação, proveniência e configuração de versionamento são consolidadas nesta execução.

## Evidências aprovadas e verificações

- [Pacote G4A original](../artifacts/gates/G4A-review/INDEX.md) e [parecer histórico](../artifacts/gates/G4A-review/REPORT.md).
- [Sete pares G4A.1, composição, oito frames e vídeo real](../artifacts/gates/G4A1-review/INDEX.md); [decisão P1 posterior à captura](../artifacts/gates/G4A1-review/APPROVAL.md).
- [Métricas pareadas](../artifacts/gates/G4A1-review/PERFORMANCE.md), [estudo estático](../artifacts/g4a1/occlusion-study.json) e [reprodução](../artifacts/g4a1/playback-occlusion-study.json).
- [Aceite G4A](G4A_ACCEPTANCE.md) e [arquitetura/aceite G4A.1](G4A1_REFINEMENT.md).

As imagens, vídeos, métricas e relatórios pré-aprovação são preservados como registros das execuções. Onde dizem aprovação humana pendente ou proibição de publicação, descrevem o estado anterior à decisão atual. Não se reescrevem resultados passados para simular uma aprovação automática.

| Evidência técnica já concluída | Resultado |
|---|---|
| TypeScript, lint, unidades, Python, catálogo e build | Aprovados; 203 unidades / 22 Python |
| E2E de produção | 62 cenários completos; os mesmos seis cenários G4A.1 rechecados após o último CSS, sem somar 68 distintos |
| Contexto, recursos e regressões | Dez transições Body/Micro/Body; GLB/Rinkaku, teclado, reduced motion, WebGL e descarte aprovados |
| Doze perfis independentes antes/depois | Budgets originais aprovados; p50 59,88 FPS, p10 final 58,82–59,52; Fluxo 3 draws / Tracking 4 |
| Visibilidade live, 2.000 / seed 17 | 15,24% → 56,42%; oclusão severa 26 → 3,5 s em 40 s, diagnóstico amostral 9 × 9 |
| Meta exploratória estática | +6,04 p.p.; meta +10 p.p. não atingida e não alterada retrospectivamente |

O filme final registra 42,563 s de transporte; os PNGs e três frames decodificados pertencem à aplicação real. Emulação mobile usa a GPU da estação. Percentis rAF não são tempo GPU/VRAM; uma medição por caso não prova significância estatística. Células continuam sem colisão física, com oclusões/proximidade residuais em densidade alta.

### Checagem deste checkpoint

Comandos finais e resultados próprios em [checks](../artifacts/checkpoint/g4a-checks.json), [smoke de interface](../artifacts/checkpoint/g4a-e2e-smoke.json) e [auditoria pré-publicação](../artifacts/checkpoint/g4a-prepublication-audit.json). A [preservação](../artifacts/checkpoint/g4a-evidence-preservation.json) confere os bytes anteriores; saídas renovadas pelo smoke são arquivadas antes da restauração. Não são alegadas novas execuções dos benchmarks ou da suíte completa de 62 quando apenas as verificações de checkpoint são repetidas.

O metadado histórico `artifacts/g4a1/e2e-refinement-final-run.json` registra a tentativa headless shell de exit 1, anterior à repetição aprovada. Seus campos `report`/`log` usam nomes depois reutilizados; os relatórios daquela falha estão preservados em `e2e-refinement-headless-shell-failed.json/.txt`. A execução final é o JSON/TXT `e2e-refinement-final`, com seis aprovados em 36,077 s. Essa associação é explicitada no manifesto atual sem alterar o registro histórico.

A descrição do gap no refinamento foi corrigida editorialmente: o estudo live calcula distância câmera–centro menos o raio conservador da célula; não subtrai raio de câmera. O limiar de proximidade 0,15 é separado. O valor −0,02258 e os resultados permanecem iguais; o custo do planner utiliza outro cálculo com margem de câmera. Fonte: `tests/e2e/g4a1-playback-study.mjs` e `src/scene/vascular/tracking.ts`.

O vídeo solto `flow-and-tracking.webm` é duplicata byte a byte do filme G4A aprovado (SHA256 `65cf7abe8b9259f5318a2b36a185206ac219db42956fcfcf555b90ccb3dad2ac`). A cópia canônica está versionada no pacote G4A; a duplicata permanece local e ignorada. Build, dependências, traces e backups brutos continuam fora do Git. Não há novo asset externo nem licença de redistribuição presumida para terceiros.

## Identidade e continuidade

Base publicada antes deste checkpoint: `717f4069c5e662f78ea8b28e7d13e0636ab0c5dd`, confirmada por fetch/ls-remote. Branch `main`. O commit que introduz este documento identifica o checkpoint G4A; consultar `git log -1 -- docs/G4A_CHECKPOINT.md` e `git ls-remote origin refs/heads/main`, sem inserir uma autorreferência impossível ao SHA do próprio commit. SHA remoto e working tree são conferidos após o push e informados no encerramento.

Próxima etapa: planejamento/implementação futura de **G4B — exploração ampliada da célula RC**. Não foi iniciada aqui. G5, G2B, G3B e arte P2 continuam dependências separadas.
