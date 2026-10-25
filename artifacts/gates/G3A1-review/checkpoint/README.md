# Checkpoint aprovado P1 — 25/10/2026

O usuário aprovou G3A.1 como entrega técnica e visual de **protótipo P1 com ressalvas** e autorizou commit/push em `origin/main`. P2 e arte Blender continuam pendentes. Os pacotes G3A/G3A.1 anteriores são evidências históricas da entrega então revisada e permanecem íntegros.

## Conferência final da retração

Foi encontrado um defeito funcional concreto: em `.999`, as bases ainda formavam pequenos montes; `group.visible` os fazia desaparecer ao fim. [Antes](before/focus-t0.999.png) / [endpoint](before/focus-t1.000.png). O primeiro assentamento só em profundidade ainda deixava discos visíveis através do corpo translúcido; [evidência intermediária](before-final-translucent/focus-t0.999.png).

A correção utiliza os canais já existentes para recolher toda a superfície, inclusive caps e diagnóstico das pontas, para pontos de contato enterrados. O mesmo gate suave diminui altura e área antes da ocultação. Não modifica sampler/relógio, layout, materiais, recursos ou as seis poses de referência `.14/.275/.53/.76/.90/.98`: seus hashes geométricos permanecem idênticos. A margem de contato é uma folga artística do proxy, sem significado anatômico ou RC.

Regressão unitária falhou antes e passou após a correção. A conferência visual usa comandos reais da UI, corpo opaco e transparência20%, 1–4 apêndices, foco lombar e lateral. Compara PNGs de `.999` e `1` com repouso, verificando zero footprint renderizado antes do cutoff. Metadados: [opaco](terminal-retraction.json), [transparente](terminal-transparent.json), [reprodução real e recursos](terminal-resources.json). As imagens ficam em `terminal/` e `terminal-transparent/`.

Recursos prealocados permanecem intencionalmente disponíveis no modo para replay; não são resíduo visual. `t=1` tem grupo oculto, zero apêndices/partículas visíveis e todos os canais de manifestação zerados. Ao sair, o adaptador é descartado e os contadores retornam ao patamar13 geometrias/3 texturas. Esses contadores não medem VRAM.

Também foi corrigido um defeito localizado de picking: filhos visíveis sob um grupo oculto não podem bloquear a seleção da superfície translúcida. O helper `src/scene/visibility.ts` e os dois handlers agora verificam toda a cadeia de pais; teste real de clique complementa quatro testes puros.

O [comparativo terminal antes/depois](endpoint-before-after.png) usa a mesma câmera. Filmes reais do build final: [opaco](after/retraction-final.webm) e [transparente20%](after-translucent/retraction-final.webm), com foco/lateral e permanência no endpoint. Metadados: [opaco](after/captures.json), [transparente](after-translucent/captures.json). Os vídeos anteriores do pacote permanecem históricos.

## Limites aprovados e próxima dependência

Permanecem aceitos no P1: bases arredondadas com leitura de conector, ausência de união pele/tecido contínua, facetas no close e necessidade de revisão com modelos definitivos. Não houve outra rodada de refinamento artístico. A solução de junção, topologia, materiais, normais, envelope e revisão P2 foi acrescentada ao [contrato Blender](../../../../docs/G3A_BLENDER_ANIMATION_CONTRACT.md).

Próximo trabalho planejado: **G4A — simulação de circulação sanguínea e transporte visual RC**, ainda não implementado. G2B/G3B/G4 não foram desenvolvidos neste checkpoint. O transporte RC deverá conservar o caráter de simulação e as classificações factuais existentes.

Os resultados finais ficam no [registro do checkpoint](../../../../docs/G3A_CHECKPOINT.md), com a evidência técnica em `artifacts/checkpoint/`. SHA e sincronização final são conferidos no Git após a publicação; não se confunde o parent84e6e1f com o novo commit que contém este registro.
