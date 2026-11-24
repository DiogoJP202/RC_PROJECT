# Checkpoint — UI-R3/UI-R4 no checkout principal

Em 19/11/2026, o usuário determinou que todo o trabalho fique na pasta principal do projeto, com separação por branches e commit/push ao concluir as entregas. Essa preferência está registrada no `AGENTS.md`.

## Estado consolidado

- A pasta principal contém a branch `codex/ui-r4`, a partir do merge `0c287c7`.
- O commit `e3cc9c7` contém a implementação e as evidências UI-R3/UI-R4, com 99 arquivos alterados ou acrescentados. O checkout anterior liberou a branch e ficou com HEAD destacado.
- Os dez documentos originais em `ghoul_atlas_ui_redesign/` acompanham o versionamento. Seu conteúdo recebido foi preservado.
- Os 99 arquivos da transferência foram conferidos. Git normalizou CRLF para LF em três arquivos de texto; não houve diferença de conteúdo. As imagens e os relatórios conservaram seus bytes.
- Foram copiados e verificados por SHA-256 481 arquivos locais de QA, somando 482.881.986 bytes. Logs, traces, snapshots e perfis permanecem em `artifacts/local/`; os antigos `test-results` foram preservados em `artifacts/local/ui-redesign-worktree-backup/test-results/`. Não houve colisões ou sobrescrita de dados locais.
- Dependências instaladas e build são próprios da pasta principal. Esses diretórios continuam fora do Git, assim como evidência bruta e referências privadas.

Os aceites e relatórios UI-R3/UI-R4 documentam o estado durante a execução dos gates. Declarações antigas de trabalho local, índice vazio ou ausência de publicação pertencem àquele momento. Este checkpoint registra a consolidação e a autorização posterior de versionamento.

## Verificação na pasta principal

| Comando | Resultado |
|---|---|
| `npm.cmd run typecheck` | Exit 0. |
| `npm.cmd run lint` | Exit 0. |
| `npm.cmd test -- --maxWorkers=2` | 206 testes aprovados em 22 arquivos. |
| `npm.cmd run test:catalog` | 22 testes Python aprovados. |
| `npm.cmd run build` | Exit 0, com o catálogo público v2 validado. |
| `npm.cmd run test:e2e -- tests/e2e/ui-r3.spec.ts tests/e2e/ui-r4.spec.ts --reporter=list` | 14/14 aprovados em 1,3 min, no preview de produção da pasta principal. |

As seis entradas de build registradas no benchmark UI-R4 conservaram seus SHA-256 após o rebuild na pasta principal. O código da aplicação, os testes, os contratos, os assets públicos e as dependências não mudaram durante a consolidação. Os 21 arquivos de evidência UI-R3 também conservaram seus hashes.

A checagem adicional de `contracts/seed-catalog.json` retornou exit 1, com 46 problemas, conforme esperado para o exemplo v1 histórico. Essa rejeição é exigida por [G1_CATALOG_MIGRATION](G1_CATALOG_MIGRATION.md) e coberta pelos testes Python. O catálogo de runtime é `public/catalog.json` v2 e passou no build. O seed foi preservado.

O [relatório de consolidação](../artifacts/checkpoint/ui-redesign-consolidation.json) registra as verificações. Os brutos permanecem em `artifacts/local/ui-consolidation/transfer.json` e `artifacts/local/ui-consolidation/e2e.log`. O destino do push é `origin/codex/ui-r4`.

## Continuidade

Continuar o trabalho nesta pasta, usando branches. As tarefas concluídas devem terminar com commit e push. O redesign continua P1 de interface, com os limites de arte e acessibilidade registrados em [UI-R3](UI_R3_ACCEPTANCE.md) e [UI-R4](UI_R4_ACCEPTANCE.md). Os modelos anatômicos e RC permanecem conceituais. G4B e a arte P2 com assets licenciados continuam pendentes. A consolidação não inicia outra etapa funcional nem altera motores, cenas, stores, contratos ou assets.
