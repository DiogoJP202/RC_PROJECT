# 07 — Contrato de arte 3D e assets

## A maior dependência real do projeto

Nenhum framework substitui um bom modelo anatômico/rig. Codex pode gerar geometria esquemática para validar UX, mas a qualidade de produção exige um pipeline de modelagem real (Blender, fontes abertas licenciadas e assets originais).

## Fonte de anatomia (conferir licença/atribuição da versão baixada)

- [AnatomyTOOL Open 3D Model](https://anatomytool.org/open3dmodel), licença indicada como CC BY-SA.
- [BodyParts3D](https://lifesciencedb.jp/bp3d/?lng=en), verificar créditos e CC BY-SA da versão/distribuição.
- [Visible Human Project](https://www.nlm.nih.gov/research/visible/visible_human.html), dados de referência de imagem, **não** um GLB leve pronto para colocar na web.

Nunca extrair modelos de jogos/serviços médicos proprietários. Mesmo licenças abertas podem requerer attribution/share-alike, inclusive em derivados — revisão final da licença antes de distribuir.

## Inventário inicial

| Asset ID | Alvo | MVP | Fonte / ação | Uso caso falte |
|---|---|---|---|---|
| `human-body-neutral` | corpo inteiro em pose neutra, UVs e proporções | obrigatório | open model licenciado ou modelagem própria | mannequin proxy explicitamente marcado |
| `human-skeleton` | coluna/escápulas/costelas principalmente | desejável | biblioteca aberta / Blender | contorno simplificado com disclaimer |
| `vascular-major` | vasos principais para zoom | obrigatório para G4 (modelo ilustrativo) | autoral spline e vessel mesh | spline didática |
| `ghoul-kakuhou-rinkaku` | órgão regional lombar | obrigatório | modelo original autoral | saco geométrico rotulado conceptual |
| `ghoul-kagune-rinkaku` | 1–4 apêndices com rig e morphs | obrigatório G3 | Blender ou rig procedural | proxy de splines/tube |
| `blood-rbc` | hemácia estilizada | obrigatório G4 | Blender/procedural original | malha bicôncava estilizada |
| `rc-cell-schema` | objeto microscópico original | obrigatório G4 | Blender/procedural original | célula estilizada |
| `rc-cell-interpretive` | versão detailed micro | pós-MVP se art time | Blender autoral | manter schematic |
| `kakugan-eyes` | mudança ocular | pós-MVP | shader original | não mostrar |
| `quad-kagune-other` | Ukaku, Koukaku, Bikaku | pós-MVP | rigs independentes | cards conceituais |

## Convenções de arquivo

```text
public/assets/models/body/body-shell-lod0.glb
public/assets/models/body/body-shell-lod1.glb
public/assets/models/ghoul/kakuhou-rinkaku-v01.glb
public/assets/models/ghoul/kagune-rinkaku-rig-v01.glb
public/assets/models/micro/rc-cell-schematic-v01.glb
public/assets/models/vascular/vessels-major-v01.glb
public/assets/textures/*-basecolor.ktx2
```

A cena deve carregar cada asset por `assetId` em manifest versionado, não caminhos hardcoded em 15 componentes.

## Contrato de exportação Blender → GLB

- Unidade: metros; corpo em pé com altura-alvo realista e dimensões documentadas (não alegar dimensão canon de personagem específico). Origem `(0,0,0)` preferencialmente no solo, Y-up na exportação GLTF; validar orientação importada no Three.js.
- Corpo alinhado; `anchor` do kakuhou ligado à lombar do rig e anotado como posição aproximada.
- Node names sem espaços frágeis: `BODY_ROOT`, `SKIN`, `SKELETON`, `VASCULAR_MAJOR`, `KAKUHOU_RINKAKU`, `KAGUNE_ROOT`, `APPENDAGE_01` …
- Morph targets sugeridos: `root_reveal`, `appendage_extend`, `appendage_thicken`; documentar os que de fato existem.
- Material PBR com normal/roughness, emissive via shader/material custom no renderer; textures reduzidas para web.
- Asset com rig: bones/vertex weights sem NaNs, morphs clampados, testado com GLTF viewer antes de integrar ao aplicativo.
- Produção da malha final NÃO é obrigação implícita do Codex se ferramentas/arquivos artísticos não estiverem disponíveis. Abrir issue/ticket de arte com screenshots do proxy.

## Contrato de hotspot

Cada `anatomyId` mapeia para node GLB, bounding volume e `anchor` relativo. Em mudança de LOD, o `anatomyId` permanece estável. Um `kakuhou` pode não ter shape canônico, mas o anchor precisa sempre levar o usuário à região correta.

## Checklist de licença

- `assetId`, arquivo, URL de aquisição, autor, versão/data, tipo de licença e link para o texto da licença.
- Se BY-SA ou ShareAlike: conferir requisitos para distribuição dos derivados e preservar crédito.
- Se desconhecida: bloquear publicação do asset, mostrar proxy.
- Imagens de Cyberpunk anexadas: **referência visual local**, fora do bundle deployado.
- Arte de Sui Ishida e material Tokyo Ghoul: referências temáticas, sem reproduzir mangá/anime integralmente ou anunciar produto oficial.
