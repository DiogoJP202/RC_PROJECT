# G2A — Aceite técnico da infraestrutura de assets

> Baseline de código G2A verificada em 24/10/2026: publicada em `main`, commit `0e53c1e31c366a05642501bef312d0fe5d5575b6`. Na retomada, `git fetch origin --prune`, `git rev-parse HEAD origin/main` e `git ls-remote --heads origin main` confirmaram o mesmo SHA. O checkpoint documental posterior preserva o código e acrescenta as evidências da migração. Os testes, capturas e perfis datados abaixo preservam a evidência da estação anterior; a revalidação e a consolidação estão no [log](IMPLEMENTATION_LOG.md).

23/10/2026, America/Sao_Paulo. G1 aprovado como entrada; baseline Git preservada `d7195027dfb48ab25d040a6295676aacb847ce59`. Escopo entregue: infraestrutura GLB, fixtures sintéticas, substituição progressiva e refinamentos pontuais de interação/mobile. **G2B e G3 não foram implementados.** Nenhuma anatomia final foi produzida ou aprovada.

Contrato operacional: [BLENDER_WEB_INTEGRATION](BLENDER_WEB_INTEGRATION.md). Histórico: [G1_ACCEPTANCE](G1_ACCEPTANCE.md) e [IMPLEMENTATION_LOG](IMPLEMENTATION_LOG.md). O aceite técnico abaixo não substitui revisão artística humana nem validação anatômica do artista/revisor.

## Checklist com evidência

| Critério | Resultado demonstrado | Evidência |
|---|---|---|
| Registro central/licença/arquivo aprovado | IDs, versão, digest, bytes, proveniência e teto por asset; ID desconhecido não gera fetch | assetRegistry + testes assetCache |
| GLB binário real do disco | Dois GLBs em public/assets/fixtures, HTTP 200, cabeçalho glTF 2/bytes conferidos e meshes renderizados | E2E de carga assíncrona + manifesto |
| Hierarquia/identidade/cena ativa | extras.atlasId, renomeação livre e grupos de múltiplos meshes; duplicidade, ausência, conflitos e mesh sem binding recusados | resolvedor + regressões |
| Bounds/escala/eixos/pivô | Comparação com o registro, transforms/posição finitos; divergências rejeitadas | unitários de contrato espacial + snapshot do palco |
| Picking/HTML/evidências | Raycast e clique sobre mesh GLB selecionam o mesmo ID, inspector e fontes | E2E real de mouse; project usa bounds atuais |
| Substituição progressiva | GLB troca cabeça/tórax/kakuhou; superfície/músculos/esqueleto continuam proxies | snapshot + captura GLB modular |
| Falha/retry/cancelamento | HTTP 404 mantém corpo proxy e contexto, retry recupera; requisição atrasada não sobrescreve nova escolha | E2E falha/race; unitários de abort |
| Cache/ownership | Fetch coalescido e instâncias independentes; última liberação descarta template; três ciclos static→rigged→proxy terminam sem leases/entries/inFlight | unitários + contadores reais E2E |
| Recursos de falha/late resolve | Geometria, materiais originais/derivados, texturas/ImageBitmap, skeleton/boneTexture, cenas e blob URLs acompanhados no sucesso/erro | resourceOwnership + testes de descarte |
| Rig/animação/socket | SkinnedMesh, dois bones, clipe de 1 s; vértice deformado, rigs independentes e socket filho movendo em pose real | unitário do GLB em disco + E2E de scrub/play/reduced motion |
| Preflight/rede restrita | URI/data URI, redirect, origem diferente, hash/tamanho, extensão não aprovada, pesos originais inválidos, NaNs/ciclos/duplicação recusados | testes positivos/negativos antes de normalização pelo loader |
| Fluxos G1 | Seleção, camadas/opacidade/isolar, foco/reset/órbita, scan, filtro, modos e contexto preservados | 14 E2E G1 intactos e aprovados |
| Acessibilidade/mobile | HTML equivalente, toque ≥44 px nos novos controles, gaveta modal, Tab/Escape, reabertura de evidências, reduced motion e falhas WebGL | 10 E2E G2A + G1; capturas vistas |
| Checks completos | TypeScript, lint, 85 unidades/7 arquivos, 22 Python, catálogo v2, build e 24 E2E com exit 0 | [validation.json](../artifacts/g2a/validation.json) / [saídas](../artifacts/g2a/validation.txt) |
| Build/proveniência/preservação | Zero correspondências de nomes/payloads privados ou pesquisas no dist; fixtures regeneradas com hashes idênticos; catálogo/seed/lock/pesquisas e testes G1 intactos; links locais conferem | [repository-audit](../artifacts/g2a/repository-audit.json) |

O passe anterior foi preservado: **83 unidades, 22 Python e 23/24 E2E**, com uma falha nova de rolagem da gaveta, sem falhas G1. Foi corrigida a ordem entre fechamento/restauração de foco/layout e rolagem; o teste original passou isoladamente e na suíte final completa. Em paralelo, dois negativos adicionais fecharam extensões aninhadas não declaradas e filhos duplicados, levando a 85 unidades. [Registro inicial](../artifacts/g2a/validation-initial.json) / [saídas iniciais](../artifacts/g2a/validation-initial.txt). Não houve remoção/redução de assertions dos testes anteriores.

## Fixtures e contrato demonstrados

| Arquivo | Bytes | Recursos |
|---|---:|---|
| [atlas-static-v1.glb](../public/assets/fixtures/atlas-static-v1.glb) | 2.604 | Octaedros, hierarquia com grupos, três bindings e socket lombar |
| [atlas-rigged-v1.glb](../public/assets/fixtures/atlas-rigged-v1.glb) | 4.532 | Hierarquia distinta, SkinnedMesh, dois bones, fixture_sway/1 s e socket seguindo bone |

[manifest.json](../public/assets/fixtures/manifest.json) contém SHA-256, bytes, autoria, licença e disclosure; `node tools/generate_fixture_glbs.mjs` reproduz os arquivos. Eles são originais e deliberadamente diferentes do manequim G1. A bancada `?assets=lab` os identifica como sintéticos; o selo `PROXY / CONCEPTUAL MODEL` permanece. A entrada normal não busca esses GLBs.

Texture decode foi demonstrado com GLB em memória e decodificação controlada, além de falha real de decode simulada na fronteira do loader. Isso testa ownership, não qualidade artística/textura ou compatibilidade de todos os dispositivos. Sparse, mais de quatro influências, decoders e extensões não homologados são recusados. O preflight conservador não é um validador glTF universal. Os hooks de ownership têm regressões para o Three fixado **0.186.1** e precisam de revisão ao atualizar essa dependência.

A bancada demonstra um GLB selecionado por vez, com substituição parcial dos proxies. O cache aceita consumidores/leases concorrentes e isso foi testado; a montagem visual simultânea de arquivos de produção separados ainda precisa ser validada no ingresso G2B. O pacote do artista deve explicitar se entrega uma montagem única ou partes independentes e seus espaços de encaixe. Nenhuma montagem de corpo/órgãos definitivos é declarada aprovada aqui.

## Evidência visual inspecionada

- [Desktop normal](../artifacts/gates/G2A-desktop-default.png) e [mobile normal](../artifacts/gates/G2A-mobile-default.png).
- [Gaveta mobile](../artifacts/gates/G2A-mobile-drawer.png), com foco de teclado e alvos de seleção.
- [GLB modular](../artifacts/gates/G2A-synthetic-static.png) e [articulado](../artifacts/gates/G2A-synthetic-rigged.png).
- [Rig isolado em pose](../artifacts/gates/G2A-rig-pose.png) e [mobile com asset](../artifacts/gates/G2A-mobile-asset.png).
- [Bancada desktop](../artifacts/gates/G2A-desktop.png) e [palco mobile da bancada](../artifacts/gates/G2A-mobile.png).

As imagens foram abertas e usadas na revisão. No mobile, o enquadramento separa título/cabeça e o selo foi movido para a faixa inferior para liberar os pés. A bancada opcional ocupa espaço adicional; não é a tela normal do produto. Capturas G1 foram restauradas aos bytes históricos depois dos testes; as imagens desta fase ficam em G2A-* para preservar comparação.

## Perfil de produção e limites observados

Dois contextos Chrome novos, cache HTTP desativado, preview Vite em 4173, 1440×900/DPR 1, Windows/i5-1135G7/16 GB/Iris Xe ANGLE D3D11, Chrome 155.0.8059.86 headless. CDP: 20 Mbps e `latency=50 ms` (não certifica RTT físico simétrico). Cada execução aqueceu 10 s e mediu 30 s/1.800 intervalos de requestAnimationFrame.

| Métrica | Entrada normal/proxy | Fixture articulada em reprodução |
|---|---:|---:|
| Interação inicial Body | 1.879,6 ms | 1.179,9 ms |
| Ativação adicional do asset | não se aplica | 333 ms, incluindo escolha/carga |
| FPS p50 / p10 | 59,88 / 59,52 | 59,88 / 59,52 |
| Draw calls | 21 | 22 |
| Triângulos | 149.898 | 102.882 |
| Geometrias / texturas | 13 / 3 | 15 / 4 |
| Transferência Performance API | 358.241 B | 376.324 B, boot + asset/loader selecionado |
| Erros JS / requests falhos / HTTP inesperados | 0 / 0 / 0 | 0 / 0 / 0 |

[Perfil proxy](../artifacts/g2a/production-proxy.json) e [perfil articulado](../artifacts/g2a/production-rigged.json) contêm ambiente, amostras, recursos/encodings, contadores e budgets. A segunda transferência inclui carga explícita posterior ao boot; não é apresentada como payload inicial Body. Os tempos variam entre execuções; a tabela não é experimento causal comparando velocidade de modelos. Todos os budgets configurados passaram nas duas execuções.

Resta o aviso conhecido `THREE.Clock` de dependência R3F; o build também avisa que o chunk lazy de cena excede 900 kB. O limite não foi aumentado para ocultar o warning. Os perfis medidos ficaram dentro dos orçamentos, mas não garantem o custo dos assets finais. Contadores JS/renderer não estimam VRAM nem certificam ausência universal de vazamento. Mobile físico, outros GPUs/OS/browsers e arte definitiva continuam pendentes.

## Classificação de qualidade

| Sistema | Nível | Limite |
|---|---|---|
| Infraestrutura de assets e preservação de interação | P1 demonstrado | Só subconjunto aprovado de glTF, com fixtures; modelos finais ainda não exercitados |
| UX/mobile/câmera/seleção | P1 demonstrado | Viewport emulado; aprovação visual humana e celular físico pendentes |
| Corpo, órgãos e fixtures | P0 | Geometria esquemática/sintética, sem validação anatômica |
| Fidelidade cinematográfica/anatômica P2 | Não declarada | Depende de arte e revisão G2B |

## Bloqueios e recomendação G2B

O artista deve entregar pacote versionado com `.blend` editável em pasta privada de trabalho, GLB autocontido de runtime, manifesto semântico, unidades/eixos/pivô/bounds, sockets, rig/clip e envelope, licenças/créditos/hash por recurso. Conferir as vistas/anatomia e a versão concreta da licença antes de pôr arquivos em public. Não aplicar os bounds das fixtures à arte final.

G2B deve adicionar entradas aprovadas e representação correspondente, integrar os arquivos recebidos mantendo os IDs e o pipeline existente, revisar materiais/texturas/rig/morphs/extremos, repetir interação, perfil, falhas e capturas. Se houver dependência de decoder/sparse/extensão hoje bloqueada, homologá-la por teste e revisão explícitos; não desativar o gate para fazer o arquivo passar.

Sem arquivo final, manter proxy e registrar blocker. Forma interna do kakuhou continua reconstrução; rig mais detalhado não estabelece histologia oficial. G3, manifestação rinkaku, RC/microcirculação e fórmulas fisiológicas permanecem fora deste aceite.

Próximo prompt proposto: [G2B_ASSETS_DEFINITIVOS](../prompts/G2B_ASSETS_DEFINITIVOS.md), mediante nova autorização. O [contrato Blender → Web](BLENDER_WEB_INTEGRATION.md) é a referência para o artista em paralelo. No encerramento original deste aceite, as alterações G2A ainda eram locais sobre a baseline Git preservada; sua publicação posterior foi confirmada no SHA da nota de estado atual. G2B e G3 continuam pendentes.

Nota do checkpoint pós-migração: a proposta G2B acima é histórica. O usuário indicou como próximo trabalho a preparação do motor Rinkaku sem depender dos assets definitivos; isso não inicia nem conclui G3 nesta consolidação.
