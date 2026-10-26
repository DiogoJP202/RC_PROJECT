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
