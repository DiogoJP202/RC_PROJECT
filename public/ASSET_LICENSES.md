# GHOUL ATLAS — Proveniência dos recursos do G1

Versão de trabalho: 0.1.0. Data: 23/10/2026.

| Recurso | Origem | Uso nesta versão |
|---|---|---|
| Corpo, cabeça, musculatura, esqueleto, tórax e kakuhou esquemáticos | Gerador autoral do projeto em `src/scene/proxyGeometry.ts`; manifesto em `src/scene/proxy-manifest.json` | Proxies conceituais de navegação. Não são modelos anatômicos licenciados de terceiros nem arte final |
| Luz, chão, marcadores e scan | Geometria/material e código autorais do projeto | Efeitos de inspeção ilustrativos, sem significado fisiológico |
| Marca `atlas-mark.svg` e ícones da interface | Desenhos geométricos autorais em SVG | Identidade original do observatório |
| Esquema 2D alternativo | SVG autoral em `src/ui/Fallback.tsx` | Fallback explicitamente identificado; não substitui o preview 3D em funcionamento |
| Tipografia | Fontes já disponíveis no sistema do visitante, com fallbacks | Nenhum arquivo tipográfico é hospedado ou redistribuído |

Nenhuma fotografia, screenshot, textura, HDRI, áudio, imagem do mangá/anime ou modelo externo foi incorporado. As referências privadas e os relatórios de pesquisa não integram o build público.

Os recursos autorais foram criados para uso neste projeto; este registro de proveniência não concede licença pública de redistribuição do projeto nem direitos sobre *Tokyo Ghoul*. O observatório é um estudo ficcional independente. As dependências de software mantêm suas licenças próprias nos respectivos pacotes/lockfile; não são fontes de meshes ou arte de terceiros nesta versão.

Substituições por GLB/glTF exigem registro da versão efetivamente adquirida, autor, fonte, licença, atribuição, alterações, hash e nodes reais. A mera existência de um link de download não libera o asset.

## Fixtures originais G2A

`assets/fixtures/atlas-static-v1.glb` e `atlas-rigged-v1.glb` são arquivos binários glTF 2 originais gerados por `tools/generate_fixture_glbs.mjs`. Proveniência, tamanho e SHA-256 em `assets/fixtures/manifest.json`; registro técnico em `src/visuals/assets/assetRegistry.ts` no repositório. Não contêm meshes, imagens ou texturas de terceiros. O articulado inclui dois bones e um clipe sintético, sem comportamento fisiológico.

São fixtures de infraestrutura, visíveis na bancada opt-in `?assets=lab`, mantendo `PROXY / CONCEPTUAL MODEL`. Não representam anatomia humana validada, forma canônica de kakuhou ou arte definitiva. `PROJECT_ORIGINAL` registra autoria para este projeto e não concede licença geral sobre material de terceiros ou sobre Tokyo Ghoul.
