# G2A — Infraestrutura de integração GLB (proposta, não executada)

Execute **somente G2A**, após autorização explícita. Leia `AGENTS.md`, `README.md`, `docs/PROJECT_HANDOFF.md`, `docs/RESUME_ON_NEW_PC.md`, `docs/G1_ACCEPTANCE.md`, `docs/G1_CATALOG_MIGRATION.md`, `docs/07_ASSET_PIPELINE.md` e o estado real de Git/código/testes. Preserve a baseline G0/G1 e seu histórico.

Objetivo: preparar a integração Blender → Web a partir de `src/visuals/assets/gltfResource.ts`, do AssetSlot/manifesto existentes e do catálogo v2. Não reinicialize stack nem substitua o observatório. Não implemente G2B (arte final), G3 (kagune) ou G4 (circulação/micro).

1. Diagnostique o seam atual antes de alterar. Defina contrato versionado por asset: origem/autor/licença/hash/versão, recursos e texturas, orientação/unidade/transforms, nodes ativos/meshes, bounds, anchors e mapa estável dos seis `anatomyId`.
2. Trate URIs internas/externas e recursos dependentes do GLB antes de seu uso. Valide o que será realmente renderizado na cena ativa. Não confunda presença de um nome no JSON com malha selecionável válida.
3. Complete abort/retry, carregamento lazy e ownership/descarte dos recursos usados (incluindo skeleton/boneTexture, ImageBitmap e cenas secundárias quando pertinentes). Verifique erro e repetição sem acúmulo de recursos.
4. Use fixture GLB mínima autoral rastreável para comprovar o fluxo positivo e negativos relevantes. Rotule-a como fixture/proxy; não a apresente como anatomia ou arte final. Sem modelo de produção, registre blocker e mantenha o gerador atual.
5. Integre contrato espacial/câmera sem espalhar novos offsets hardcoded. Preserve seleção por lista/raycast, camadas, isolar/restaurar, foco/reset, mobile, teclado, reduced motion, erro/fallback e classificação factual independente da licença/forma.
6. Documente contrato operacional de exportação Blender, assets ainda ausentes e condições de ingresso G2B. Não baixe nem publique mesh sem origem/licença aprovadas.

Aceite: checks G1 continuam passando; import real da fixture demonstrado no browser com nodes/meshes/bounds/anchors inspecionados; casos negativos rejeitados; abort/cleanup/retry e retorno ao proxy demonstrados; capturas próprias e inventário de recursos; log de comandos e riscos atualizado. Nenhuma afirmação canônica ou anatômica nova sem fonte conferida. Não marque G2B/G3/G4 como concluídos. **Pare após G2A.**
