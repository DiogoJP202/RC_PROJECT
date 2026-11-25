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

## Representação procedural original G3A — registro inicial

As quatro superfícies deformáveis Rinkaku, suas pregas/cores, a resposta visual da raiz lombar e as partículas são geradas por código autoral em `src/scene/rinkaku/ProceduralRinkakuAdapter.ts` e `RinkakuScene.tsx`. Nenhum mesh, textura, rig, personagem ou material externo foi incorporado. O registro é `PROJECT_ORIGINAL`, com o mesmo limite de direitos descrito acima.

São `PROXY / CONCEPTUAL MODEL`, de natureza `hypothetical_model`: crescimento, fixação, retração, cores, partículas, quantidade de 1–4 apêndices e intervalos da timeline são decisões artísticas desta demonstração. O overlay de ativação não representa câmaras ou histologia do kakuhou; partículas não estabelecem forma/escala de células RC. A geometria não constitui anatomia ou arte final aprovada. O contrato de animação GLB futuro não disponibiliza um asset final nem altera a licença dos recursos G2A.

### Refinamento G3A.1 e checkpoint P1 — 25/10/2026

O registro anterior descreve a implementação inicial preservada nas evidências G3A. O overlay separado foi removido no G3A.1; a implantação, os brotos e as pregas pertencem à superfície procedural original do adaptador, com material sem emissão luminosa. A correção terminal assenta essa superfície antes de ocultá-la, sem acrescentar asset externo. Capturas, composições e vídeos são registros da aplicação autoral; não contêm referências privadas ou renders de terceiros.

O usuário aprovou a entrega técnica e visual como **protótipo P1 com ressalvas**. Bases arredondadas, continuidade pele/tecido, facetas e revisão com modelos definitivos permanecem pendências de arte final/P2. Esta aprovação não muda `PROJECT_ORIGINAL`, não cria anatomia/cânone e não concede direitos sobre materiais de terceiros. Nenhum modelo, textura, fonte binária ou asset Blender externo foi incorporado neste checkpoint.

## G4A — representação vascular procedural original

Geometrias de vaso, hemácia bicôncava e superfície RC, cores e mapa de relevo 128×128 são gerados pelo código autoral em `src/scene/vascular/ProceduralVascularAdapter.ts`. Proveniência: `PROJECT_ORIGINAL`, implementação local do Ghoul Atlas em 25/10/2026. Não há meshes, fotografias, figuras de livros, texturas externas ou assets de Tokyo Ghoul incorporados. As fontes OpenStax/Young Jump sustentam somente as afirmações textuais delimitadas em `src/content/vascularEvidence.ts`; suas imagens não foram reproduzidas.

A microcena é um protótipo P1 didático. Forma, escala, material e transporte RC são reconstruções conceituais; a procedência original não confere validação anatômica ou aprovação artística final. Arte Blender futura exige o ingresso de licença, autoria e revisão próprios antes de entrar no build público.

### G4A.1 — refinamento autoral

O marcador de seleção externo, a variação ampla da parede, os ajustes de material/luz e os componentes de apresentação são código/geração autorais `PROJECT_ORIGINAL`. O mapa128×128 permanece gerado localmente. Nenhuma figura OpenStax, fotografia, textura de terceiros, mesh Blender ou asset de Tokyo Ghoul foi incorporado. As comparações e o vídeo registram somente a aplicação; os arcos de seleção são interface didática, não estrutura celular ou emissão biológica. Aprovação artística humana e arte final P2 permanecem pendentes.

### Aceite posterior G4A/G4A.1 — checkpoint P1

O parágrafo anterior registra a revisão pré-aprovação. O usuário aprovou posteriormente G4A/G4A.1 como **protótipo P1 técnico e visual com ressalvas**, sem nova rodada G4A.2. Parede esquemática, marcador fino, hemácias simplificadas e mobile apertado são limites aceitos do protótipo. P2 continua dependente de assets definitivos licenciados e revisão Blender/web. Este aceite não concede direitos de terceiros nem transforma a reconstrução RC em anatomia/cânone validado.

## UI-R1 — Captura editorial e tipografia

A imagem da vitrine é `PROJECT_ORIGINAL`: quadro do Rinkaku gerado no renderer do próprio Ghoul Atlas (checkpoint `1bcecb0`; vista oblíqua, fase ativa, `t=0,88`, quatro apêndices, seed 17, sem partículas artísticas). O HUD foi ocultado somente na captura. As versões WebP resultam de recorte, redimensionamento e compressão; não incluem referências privadas, scans, imagens de personagens, fotos ou malhas de terceiros. A legenda HTML mantém o aviso **Modelo conceitual**. O quadro não atesta forma, escala ou anatomia oficiais.

| Arquivo da vitrine | Dimensões | SHA-256 |
|---|---:|---|
| `assets/ui-r1/rinkaku-hero-768.webp` | 768 × 559 | `89f90457c07477515abd9a286ab78cb8c39e6b33300098a39cf20c1d29458895` |
| `assets/ui-r1/rinkaku-hero-1440.webp` | 1440 × 1048 | `73b2d780acd0a682e13f2ebfd62f52cdeedb917232aa9620289df316d4ee939c` |

IBM Plex™ é tipografia da IBM Corp., distribuída sob a **SIL Open Font License, Version 1.1**. Os quatro subconjuntos Latin1 WOFF2 abaixo foram copiados sem modificações dos pacotes oficiais, com o [texto de licença](assets/fonts/OFL-IBM-Plex.txt). São servidos localmente; nenhum CDN ou pacote novo é necessário em runtime.

| Variante e release oficial | SHA-256 |
|---|---|
| [Plex Sans Regular 1.1.0](https://registry.npmjs.org/@ibm/plex-sans/-/plex-sans-1.1.0.tgz) | `b5ad7bd39f996144915f0ad9849a90183b27d8c28ad97ed98af5b1bebc51f6b1` |
| [Plex Sans Medium 1.1.0](https://registry.npmjs.org/@ibm/plex-sans/-/plex-sans-1.1.0.tgz) | `b5610af04d0d4b5a14a621d96d974b993e945a065db1a8861918f69ef9321934` |
| [Plex Sans Condensed SemiBold 2.0.0](https://registry.npmjs.org/@ibm/plex-sans-condensed/-/plex-sans-condensed-2.0.0.tgz) | `6738b1096fd433204a070db0b4a9b1172ad3e6bdff8aad5f05f7351e7c157d06` |
| [Plex Mono Regular 2.5.0](https://registry.npmjs.org/@ibm/plex-mono/-/plex-mono-2.5.0.tgz) | `e8993d946649b9d01abb1ed06d574b19d8ea3e66b5c3948602db335c44c18e56` |

## UI-R5 — Marca e capturas editoriais

O olho **Limiar**, o estudo **Incisão**, a assinatura, o favicon, os ícones raster e a composição de compartilhamento são `PROJECT_ORIGINAL`, produzidos para o Ghoul Atlas. O favicon tem geometria própria para 16/32 px. O SVG de assinatura embute o mesmo subconjunto IBM Plex Sans Condensed Semibold e conserva a atribuição e a licença [OFL 1.1](assets/fonts/OFL-IBM-Plex.txt) registradas acima. Não foram incorporados logotipos, imagens, malhas ou figuras de *Tokyo Ghoul*, da CCG ou de terceiros. A inspiração do kakugan está documentada na [proposta](../docs/UI_R5_PROPOSAL.md).

| Arquivo em `assets/ui-r5` | Dimensões | Origem |
|---|---|---|
| `rinkaku-wide.webp` | 1440 × 930 | Render do espécime e do Rinkaku procedural em t=0,88, em vista posterior oblíqua, com luz e câmera editoriais |
| `rinkaku-portrait.webp` | 720 × 830 | Mesmo estado do Rinkaku com enquadramento vertical próprio |
| `rinkaku-study.webp` | 880 × 570 | Mesmo estado, recorte lateral da implantação lombar |
| `anatomia-study.webp` | 900 × 680 | Corpo conceitual com kakuhou selecionado e direção de luz para o pôster |
| `micro-study.webp` | 960 × 490 | Vaso procedural, tempo 11,25 s e acompanhamento de `rc:17:0` |
| `share.jpg` | 1200 × 630 | Composição tipográfica e recorte de `rinkaku-wide.webp` |

As imagens carregam a classificação visual de modelo conceitual na interface. Tempos e escolhas de câmera pertencem à visualização. A ferramenta [capture_ui_r5_art](../tools/capture_ui_r5_art.mjs) usa Vite dev na porta 5175 e aplica os ajustes de luz e câmera na sessão descartável; a geometria e as simulações são as do Atlas. Os PNGs resultantes foram convertidos com Pillow, WebP `quality=85, method=6`. A ferramenta [export_ui_r5_identity](../tools/export_ui_r5_identity.mjs) gera ícones e cartão a partir dos recursos do projeto. A aplicação serve a arte estática da vitrine sem inicializar WebGL.
