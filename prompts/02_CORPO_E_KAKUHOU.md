# PROMPT G2 — Exploração anatômica funcional

Leia `AGENTS.md`, `docs/06_CANON_AND_DATA_RULES.md`, `docs/07_ASSET_PIPELINE.md`, `contracts/atlas-schema.ts`, `contracts/seed-catalog.json` e o estado atual de G1.

**Execute somente G2:** transforme o 3D do corpo em um atlas selecionável. Implemente scene graph semântico `anatomyId`↔GLB node/proxy; superfície, camada esquelética e sistema vascular de forma proporcional ao que os assets permitem. Adicione **KAKUHOU RINKAKU na região lombar**, com aviso persistente de reconstrução visual interna hipotética. O hotspot precisa apontar para a malha, não para um botão falso sobre canvas.

Interações: mouse/touch orbit; click por hit test; click pela lista HTML; foco correto na lombar; isolate; ghost layer sem excesso de transparência; reset / voltar. Painel de análise deve trazer Claims do seed-catalog, status de evidência e URL. Corrigir clipping ao focar e retornar. Não importar malha sem procedência.

Critérios de saída: a mesma seleção via DOM e via canvas; câmera não corta o corpo; a opacidade pode ser restaurada; o sistema funciona com mesh real ou proxy marcado e documentado. Testar; gerar prints antes/depois de selecionar; atualizar log. Pare em G2.
