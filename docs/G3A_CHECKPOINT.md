# Checkpoint G3A / G3A.1 — protótipo P1

25/10/2026, America/Sao_Paulo. Aprovação explícita do usuário para entrega técnica e visual **P1 com ressalvas**, consolidação documental, commit e push em `origin/main`. Sem deploy ou implementação de G2B/G3B/G4. Próxima etapa planejada: G4A, circulação sanguínea e transporte visual RC, em execução futura.

## Níveis de aprovação

| Nível | Estado |
|---|---|
| Motor, interatividade e apresentação de protótipo P1 | Aprovados pelo usuário, com ressalvas documentadas |
| Qualidade visual/anatômica P2 e arte final | Pendentes da entrega licenciada e revisão dos modelos Blender |
| Continuidade topológica pele/kagune, materiais finais e close-up | Pendentes; contrato Blender atualizado com requisitos de ingresso |
| G2B, G3B e G4 completo | Não implementados por este checkpoint |

As bases ainda podem lembrar conectores, a pele e o tecido são superfícies independentes e as facetas aparecem em close. Esses pontos não motivam nova expansão do procedural; pertencem ao pacote artístico definitivo e à revisão P2. Cânone, escala RC e fisiologia não são promovidos pelo aceite visual.

## Correções funcionais limitadas

A checagem complementar encontrou um desaparecimento terminal das bases: sua área/altura permanecia finita e a visibilidade retirava o restante em `t=1`. Uma correção mínima recolhe área e altura suavemente antes desse limite, inclusive no corpo translúcido. O gate deriva dos canais absolutos existentes; não altera o sampler, o mapa de21s/retração3,4s, materiais, orçamento de recursos ou as seis poses de referência aprovadas. Testes unitários e capturas reais comprovam o caso antes/depois.

Uma correção de picking impede que meshes prealocadas sob grupo invisível interfiram no clique através do corpo transparente. A verificação percorre os ancestrais, preservando a identidade e os bindings G1/G2A. A limitação HMR conhecida permanece documentada; edição de recursos em dev requer reload completo.

[Evidência específica da retração](../artifacts/gates/G3A1-review/checkpoint/README.md). Os [pacotes de revisão G3A](../artifacts/gates/G3A-review/INDEX.md) e [G3A.1](../artifacts/gates/G3A1-review/INDEX.md), imagens originais, composições, vídeo e relatórios anteriores são preservados. Evidência da checagem final será registrada separadamente, sem substituir os resultados históricos.

## Verificação final

| Comando/prova executada no build final | Resultado |
|---|---|
| `npm run typecheck` / `npm run lint` | Passaram |
| `npm run test` | **139 testes /13 arquivos passaram** |
| `npm run test:catalog` / `npm run validate:catalog` | **22 Python passaram**, catálogo v2 válido |
| `npm run build` | Passou; chunk lazy13,49kB / gzip5,24kB |
| `npm run test:e2e -- --reporter=list,json` | **44 passaram em429,10s**,0 falhas/skips/flaky:14G1+10G2A+9G3A+7G3A.1+4checkpoint |
| Dez ciclos automáticos UI reais | **10 completos**,21.973–22.013ms observados com polling,18geometrias/3texturas e UUIDs estáveis |
| Dez ciclos manuais e três remontagens | Pose determinística, descarte retorna a13geometrias/3texturas |
| Último trecho,1–4 apêndices, opaco e20% | PNGs em`.999` e`1` idênticos ao repouso em foco/lateral; zero resíduos visuais e partículas |
| Preservação das poses aprovadas | **24/24 hashes geométricos de referência idênticos**, conforme [comparação](../artifacts/checkpoint/g3a-approved-poses.json) |

Comandos/logs novos: [checks](../artifacts/checkpoint/g3a-final-checks.json), [E2E](../artifacts/checkpoint/gates/G3A-final-e2e.json). Evidência específica: [comparativo terminal](../artifacts/gates/G3A1-review/checkpoint/endpoint-before-after.png), [opaco](../artifacts/gates/G3A1-review/checkpoint/terminal-retraction.json), [transparente](../artifacts/gates/G3A1-review/checkpoint/terminal-transparent.json), [recursos](../artifacts/gates/G3A1-review/checkpoint/terminal-resources.json).

Perfil novo do build final, padrão, 1440×900/DPR1, mesmo Ryzen7/Radeon/Chromium156, CDP20Mbps/50ms, 10s aquecimento+30s rAF: **59,88 FPS p50 / 58,82 p10**, até20 draw calls, 18 geometrias/3 texturas estáveis e todas as sete fases amostradas. Interação Body 1.221ms; transferência Body 367.916bytes+lazy 5.518bytes=373.434bytes. Todos os budgets passaram, zero erros JS/HTTP/rede; aviso conhecido THREE.Clock. [Relatório](../artifacts/checkpoint/gates/G3A-final-profile.json). Medição única de desktop, não GPU/VRAM ou telefone físico.

As gravações finais mostram o trecho `.98→1` em foco/lateral e a permanência no endpoint, com [corpo opaco](../artifacts/gates/G3A1-review/checkpoint/after/retraction-final.webm) e [transparência20%](../artifacts/gates/G3A1-review/checkpoint/after-translucent/retraction-final.webm). São novos registros reais do build corrigido. O filme de revisão anterior permanece histórico e não é apresentado como captura da correção posterior.

Preservação: **318 arquivos anteriores** conferidos byte a byte; saídas novas das regressões foram copiadas antes de restaurar fontes históricas. [Manifesto](../artifacts/checkpoint/g3a-preservation.json). Revisão dos candidatos: nenhum segredo identificado pelos padrões, temporário privado/build ou novo material externo sem autorização. Package/lock, catálogo, contratos de base, pesquisas/referências e fixtures intactos; `public/ASSET_LICENSES.md` recebeu somente a atualização de proveniência P1. [Auditoria pré-publicação](../artifacts/checkpoint/g3a-prepublication-audit.json). Os scans não constituem prova universal de ausência de segredos.

O adaptador conserva cinco geometrias/dois materiais enquanto o modo está aberto para permitir replay e scrub; isso é prealocação intencional. Em`t=1`, o grupo fica oculto, todos os canais de manifestação/partículas zeram e a superfície já não tem footprint visível antes desse cutoff. Sair do modo libera os recursos extras. Contadores e UUIDs não são medidas de VRAM.

O commit contém este registro e os relatórios de validação; seu SHA deve ser obtido pelo Git e conferido em `origin/main`, evitando um SHA autorreferente dentro do próprio commit. As verificações antigas de121/134 unidades e33/40E2E permanecem históricas em seus respectivos pacotes; não substituem esta execução final.

## Publicação e retomada

`.gitattributes` preserva os bytes dos novos pacotes G3A, seus relatórios e vídeos. Isso impede que a normalização CRLF/LF invalide hashes em outro clone. Quebras CRLF e a linha vazia final dos logs capturados são reconhecidas na checagem de whitespace dos artefatos; as regras de código não foram relaxadas. [Conferência dos bytes no índice do Git](../artifacts/checkpoint/g3a-staged-byte-verification.json).

Mensagem autorizada: `feat: complete G3A rinkaku manifestation prototype`. Base antes deste checkpoint: `main = origin/main = 84e6e1f36b8558d225ae4baf82a8f79ddb35c124`, confirmada por fetch e ls-remote em25/10. Publicação normal em `origin/main`, sem force push ou operação destrutiva. A conferência posterior compara HEAD, origin/main e ls-remote e verifica working tree limpo; o resultado será informado ao usuário.

G4A pode ser preparado na próxima execução a partir deste checkpoint; não deve presumir escala/morfologia canônica de células RC, circulação confirmada de kagune ou fórmulas quantitativas RC. G2B/P2 continuam dependentes de assets definitivos licenciados, mapeamento técnico e revisão humana. Ambiente independente do Codex e validação em telefone físico permanecem pendências já documentadas.
