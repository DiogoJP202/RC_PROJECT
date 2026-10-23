# G0 — Inventário de assets e plano de technical art

Auditoria em **23/10/2026**, fuso `America/Sao_Paulo`. Escopo: verificar o material recebido e planejar seu ingresso. Nenhum modelo foi adquirido, baixado, modelado, integrado ou publicado nesta etapa. Este documento não atesta qualidade visual demonstrada no navegador.

## Estado observado

O único material visual binário encontrado no diretório é composto pelas três screenshots privadas em `references/private/`. A busca recursiva por GLB, glTF, Blender, FBX, OBJ, STL, USD, KTX2, HDR, EXR, TTF, OTF e WOFF não encontrou arquivos. Não existe `public/assets` nem aplicativo renderizador no estado auditado. Há contratos e exemplos, sem os objetos que descrevem.

Em `contracts/seed-catalog.json`, os quatro registros de assets dizem `status: proxy` e `kind: glb`, mas não têm `path`; nenhum GLB correspondente existe. São **intenção contratual**, não proxies entregues. Não inferir `ready`, rig funcional, hotspots ou modelos originais a partir desses metadados. Um futuro proxy procedural deve declarar gerador/autoria em contrato adaptado no G1, sem inventar caminho GLB. Corpo, esqueleto e hemácia sequer têm registro próprio nesse seed.

| Asset / recurso | Arquivo real disponível | Estado G0 e dependência | Alternativa honesta planejada | Gate de uso |
|---|---|---|---|---|
| Corpo neutro, pele, proporções e UVs | nenhum | **Blocker de qualidade anatômica/cinematográfica de produção**; escolher base licenciada ou modelar | manequim volumétrico autoral segmentado, sem promessa anatômica, `PROXY / CONCEPTUAL MODEL` | preview G1; ingresso corporal G2 |
| Rig corporal / anchor lombar | nenhum | necessário para posição estável e deformação controlada; corpo estático pode anteceder rig completo | hierarquia autoral com anchor relativo ao torso, sem oscilação fisiológica alegada | G2 |
| Esqueleto lombar, sacro, costelas e escápulas | nenhum | selecionar subestruturas com licença e revisão espacial | marcos regionais esquemáticos; não inventar vértebras realistas | G2; ampliar depois |
| Musculatura/órgãos completos | nenhum | pesquisa oferece visão extensa, escopo excede a fatia inicial | indisponível explicitamente; não desenhar botões ativos sem conteúdo | pós-MVP |
| Kakuhou rinkaku / interior | nenhum; somente ID e node contratual | **modelagem autoral necessária**; função pode ter fonte oficial, forma interna continua hipótese | saco biomaterial simples rotulado; sem lóbulos, artérias ou câmaras apresentados como cânone | G2 |
| Kagune rinkaku, rig, morphs e superfície | nenhum; somente ID e nodes contratuais | **blocker G3**: modelagem, topology, weights, rig e deformação reversível | curva/tubo autoral para testar engine, sempre proxy; quatro cilindros lisos não passam qualidade final | G3 |
| Vasos principais / segmento interno | nenhum; somente ID contratual | base humana e trajeto fictício RC precisam de representações separadas | spline didática autoral; rota para kakuhou recebe selo de reconstrução | G4 |
| Hemácia (RBC) | nenhum | produzir malha bicôncava autoral, fonte anatômica para a afirmação | malha estilizada instanciada; dimensões humanas só após documentar a referência | G4 |
| RC esquemática / interpretativa | nenhum; somente ID contratual | aparência e organelas não documentadas não podem receber selo científico | forma autoral sem escala RC real, `MODELO CONCEITUAL`; versão detalhada posterior | G4 |
| Texturas PBR / normal / roughness | nenhuma | origem, versão e licença por mapa; UV, custo e mipmaps ainda não avaliados | materiais procedurais originais moderados | G1/G2/G3 |
| HDRI / ambiente / áudio | nenhum | não necessários para o primeiro preview; não importar ambiente de jogo | luzes e ambiente procedural; áudio ausente | opcional posterior |
| Fontes tipográficas | nenhuma | nenhuma família/licença instalada foi incorporada ao produto | fontes de sistema em G1; escolher família e anexar licença da versão antes de hospedar | G1 ou polimento |
| Ícones, identidade e esquema de fallback 2D | nenhum | produzir linguagem geométrica original; não extrair screenshots | SVG autoral funcional com nomes acessíveis | G1 |
| Kakugan / outros kagunes / Quinx / kakuja | nenhum | sem rig ou arte, fora da primeira fatia | backlog; não preencher com material proprietário | pós-MVP |

## Referências privadas inspecionadas

As três imagens foram **abertas e vistas** com `view_image`, não apenas enumeradas. Dimensões vieram do cabeçalho PNG; tamanho e SHA-256 foram medidos localmente.

| Caminho | Dimensões | Bytes | SHA-256 |
|---|---:|---:|---|
| `references/private/cyberware-large.png` | 1920 × 1080 | 1.622.391 | `AB661BA47647FEDB32CA2D26ECE3829FAC20C6D8D883AFE81AD4AC63D4507E48` |
| `references/private/cyberware-small.png` | 364 × 205 | 68.593 | `2887B96155D962B35FD262D437154A0922BF02E76C8246FF9C6BFC70A168B110` |
| `references/private/perk-tree.png` | 739 × 415 | 347.694 | `E956D8EB1AF5E67B8BE32CC09F26FF262ECF362ACA81F559D8030FC8EBC6CDAD` |

- `cyberware-large`: corpo ocupa o centro e ancora categorias laterais; informação contextual aparece em painel. A sobreposição inferior esquerda ilustra também o risco de obstruir a anatomia. Aproveitar centralidade e vínculo espacial, sem copiar cards de equipamento, gauges, logotipo, tipografia, cores ou bordas.
- `cyberware-small`: confirma a mesma hierarquia numa miniatura; detalhes e rótulos perdem legibilidade. Usar como teste de massa visual, não como imagem de interface ou blueprint responsivo.
- `perk-tree`: conexões e agrupamentos comunicam dependência. Uma rede científica futura deve representar relações e evidência, sem XP, perks, pictogramas ou desenho copiado.

**Direito/uso:** fornecidas pelo usuário para referência privada; não há licença de redistribuição anexada. **Todas excluídas da produção.** `.gitignore` contém `references/private/`, mas ignorar Git não impede cópia acidental ao bundle. O gate de release deve comprovar ausência de seus nomes e hashes em `public`, `dist` e pacotes de distribuição; nenhum import delas é permitido. Não houve build no G0, portanto essa exclusão ainda não foi testada num bundle.

## Confronto com a pesquisa real

Leitura integral: `research/Atlas Anatômico Interativo de Tokyo Ghoul.md` (1.179 linhas). As referências internas `turn…` e os links `sandbox:/mnt/data/…` do relatório são rastros da conversa original; não constituem arquivos de arte entregues no repositório.

| Passagem / seção real de R2 | Aproveitamento / correção no plano |
|---|---|
| “não inventar um ‘segundo corpo’, mas sobrepor uma anatomia ghoul” | base humana identificada como comparação, estruturas ghoul autorais; anatomia humana não comprova fisiologia ghoul |
| “O kakuhou deveria ser o ‘reator’ anatômico” propõe câmaras e vascularização | podem orientar concept art, sempre `hypothetical_model`; evitar reactor tecnológico literal e tubulação como anatomia oficial |
| “Sistema de camadas” rejeita transparência do corpo inteiro | adotar exposição regional e isolamento; depende de geometria separada, não somente opacidade global |
| “Formação do kagune sem precisar simular milhões de células” | planejar rig + morph/reveal + material + partículas; não são recursos existentes; scrubbing exige amostragem determinística |
| “Escamas animadas” e referência CGWORLD | LOD e detalhes por distância fazem sentido; filmes documentam decisões de VFX, não microscopia canônica e não concedem acesso aos meshes |
| “Temos fontes anatômicas abertas utilizáveis” | são candidatos; falta inspecionar cobertura, geometria, licença do pacote concreto e custo de preparação |
| Escalas numéricas e “RC FACTOR 2,730” | não usar números de RC nem micrômetros inventados na primeira tela; parâmetros de desenho ficam separados de ciência |
| Next.js, cinco/seis escalas contínuas e vários sistemas | seguir ADR do projeto: Vite/React/R3F e cenas por escala; carregar microcena depois. Não adquirir atlas completo para G1 |

## Fontes primárias de candidatos: resultado e limites

Consultas web realizadas em **23/10/2026**. São verificações de páginas, não prova de licença de um arquivo adquirido. Não foi baixado nenhum pacote de modelos. Fontes terciárias encontradas em busca não fundamentam a seleção abaixo.

| URL efetivamente aberta | Resultado da consulta | Consequência |
|---|---|---|
| [AnatomyTOOL Open3DModel](https://anatomytool.org/open3dmodel) | primeira tentativa 502; nova tentativa timeout | licença, cobertura e versão do candidato **não confirmadas diretamente**. CC BY-SA consta de docs/R2, mas não autoriza aquisição/publicação de uma versão específica |
| [AnatomyTOOL — Can I use materials](https://anatomytool.org/sites/default/files/Can%20I%20use%20materials%20from%20AnatomyTOOL_0.pdf) | busca indexada sugere licenças por item; abertura direta 502 | nenhum termo específico de geometria/textura tratado como validado; candidato permanece pendente |
| [BodyParts3D — portal](https://lifesciencedb.jp/bp3d/?lng=en) | HTML acessível; interface exige JavaScript | não houve inspeção 3D, seleção ou download |
| [BodyParts3D — licença do portal](https://lifesciencedb.jp/bp3d/info/license/index.html) | texto japonês indica CC BY-SA 2.1 Japan e crédito obrigatório | informação histórica do portal não deve ser aplicada indiscriminadamente a distribuições novas |
| [BodyParts3D — página de download do portal](https://lifesciencedb.jp/bp3d/info/download/index.html) | aponta para arquivo oficial LSDB | nenhum ZIP baixado |
| [BodyParts3D — downloads LSDB](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html) | lista release 4.0 em OBJ: 136 MB IS-A e 62 MB PART-OF; não GLB pronto | extração seletiva, retopologia/revisão e conversão são trabalho real; sem rig/PBR presumidos |
| [BodyParts3D — licença LSDB](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) | timeout na abertura e ao seguir link da página oficial | não alegar leitura dessa página; o README abaixo ofereceu evidência primária alternativa |
| [BodyParts3D — README oficial do arquivo](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html) | acessível; seção 3 informa **CC BY 4.0**, atualização 25/02/2025 e histórico de atualização 27/02/2025 | conflito com portal antigo registrado. Licença aplicável deverá ser vinculada à origem/versão efetivamente adquirida e preservada com os derivados; não herdar licença de conversões de terceiros |
| [NLM — Visible Human Project](https://www.nlm.nih.gov/research/visible/visible_human.html) | acessível; NLM descreve imagens de criosseção/CT/MRI em domínio público e acesso sem licença desde 2019 | fonte de referência humana; segmentação, reconstrução e otimização não vieram prontas. Não equivale a malha leve, rig ou scanner ghoul |
| [CGWORLD — Tokyo Ghoul S, 2019](https://cgworld.jp/regular/201910-vfxanatomy-cgw254.html) | artigo acessível; relata variações de rig, experimentação com pulso, trabalho com geometria simplificada sem escamas e composição ocular | referência primária de processo VFX, **sem licença de reutilização** de imagens/meshes. Pulso experimental não prova fisiologia nem presença no filme final |

**Preferência provisória:** avaliar seleção de BodyParts3D diretamente da distribuição oficial LSDB, por sua proveniência e licença explicitada no README atual, quando houver trabalho de arte no G2. Isso não garante que ofereça a pele semirrealista, UVs, rig e estética exigidos. AnatomyTOOL continua alternativa pendente; Visible Human serve prioritariamente ao estudo, devido ao custo de transformar imagens em geometria. Não copiar atlas comerciais (BioDigital, Visible Body) nem VFX do filme.

A atribuição especificada pelo README LSDB deverá acompanhar dados dessa distribuição, com título, autor, licença e alterações; o crédito não substitui a conferência do pacote. Para uma distribuição BY-SA, preservar obrigações da licença daquela versão e documentar o que foi adaptado. Não declarar que toda a aplicação mudou de licença apenas porque um mesh tem ShareAlike; verificar o material concretamente distribuído e suas obrigações antes do release.

## Plano de ingresso e critérios verificáveis

Um `AssetSlot` futuro deve mapear `assetId` para arquivo/gerador real, fallback, status de representação e dados de proveniência; os IDs anatômicos permanecem estáveis na troca de LOD/proxy. Contrato atual necessita evolução documentada no G1 para suportar hash, versão, fonte e licença completa sem duplicar estados contraditórios.

Critérios de ingresso de cada asset (G2 em diante; critérios de interação do proxy começam em G1):

1. **Proveniência:** arquivo/gerador existente, autor, URL de aquisição, distribuição/versão, data, hash SHA-256, licença da geometria **e** de cada textura, cópia/URL dos termos, atribuição e alterações. Licença ausente implica `blocked_by_license`, fora do bundle.
2. **Geometria:** dimensões documentadas em metros, transformação e orientação testadas na importação Y-up, origem e bounding box coerentes, superfícies/normais sem defeito visível no ângulo de uso. Não chamar proporção do manequim de padrão humano validado.
3. **Mapa espacial:** `anatomyId → nodeName → bounds/anchor` resolvido em cena; seleção por hit test e alternativa HTML apontam para o mesmo alvo; foco não corta estrutura e funciona nos LODs. Anchor lombar aproxima região, sem coordenada médica inventada.
4. **Rig e animação:** weights/bones finitos, morphs existentes inventariados e clampados, teste de extremos, sem NaNs, saltos de scrub ou interpenetração grave. Filhos de kagune seguem a raiz; nenhuma animação fisiológica é tratada como evidência.
5. **Materiais e custo:** revisar basecolor/roughness/normal e cor de emissão; reduzir texturas para o uso real, compressão e mipmaps testados. O orçamento do payload inicial é **≤8 MB comprimidos**, com **<150 draws** no modo Body, conforme ADR; não um limite individual de 8 MB por asset. Registrar triângulos/texturas/memória reais antes de ampliar detalhamento.
6. **Qualidade e falhas:** GLB abre em viewer de validação e na aplicação; captura de silhueta sem UI, UI com seleção e sequência de movimento em G1/G3. Erro de carga usa proxy/esquema identificado, preserva conteúdo e teclado; WebGL indisponível não bloqueia informação.
7. **Disclosures:** claim/fonte e status da forma aparecem separadamente. Mesh original de kakuhou continua reconstrução mesmo quando sua função é `official`. RC não possui barra de micrômetros inventada ou organelas descritas como oficiais.

Orçamentos de FPS e interação permanecem metas até medir no dispositivo e condições registrados no roadmap. Geometria oculta e assets de microcena não devem carregar no overview por padrão.

## Tickets de arte e esforço por faixa

Estimativas de planejamento, não prazo comprometido. Premissas: um artista 3D/technical artist com Blender e experiência web, um revisor de anatomia/conteúdo disponível, um espécime, uma direção aprovada e até duas rodadas curtas de revisão. Um dia útil equivale a aproximadamente 6 horas focadas; não incluem espera por licença, contratação, hardware ou aprovação. Blender não foi encontrado no PATH na auditoria raiz; acesso a DCC é dependência, não capacidade presumida.

| Ticket / entregável | Esforço indicativo | Dependências e aceite específico |
|---|---:|---|
| ART-01 — proxy autoral para preview G1 | 0,5–1,5 dia de arte + 0,5–1 dia de integração | manequim segmentado com volume e silhueta legíveis, selo de proxy, cabeça/pés enquadrados, hit test + botão HTML e foco/reset; não pede rig anatômico final |
| ART-02 — selecionar base humana e fechar proveniência | 1–3 dias | acesso às páginas/pacote concreto, revisão da licença e cobertura; relatório de geometria/UV/rig/nodes, sem declarar download escolhido antes de inspeção |
| ART-03 — preparar corpo e subestruturas lombares | 3–7 dias com base adequada; 10–20 dias se modelagem original necessária | ART-02; retopologia/UV se preciso, LOD, unidade, região posterior, mapa espacial e revisão anatômica. Pele final cinematográfica não está garantida pela base aberta |
| ART-04 — kakuhou autoral | 2–4 dias | ART-03 para encaixe; concept frontal/posterior, shape orgânico, variação visual e marca de reconstrução; evitar detalhamento que pareça evidência científica |
| ART-05 — rinkaku original com rig/morphs | 5–10 dias + 2–4 dias de integração/ajuste | ART-03/04, concept aprovado, topologia deformável e amostragem de sete fases; sequência rest/growth/active consistente, não apenas partículas decorativas |
| ART-06 — vaso + RBC + RC esquemática | 2–4 dias + 1–3 dias de integração | G4 e definição dos claims; instancing, seleção/follow reais, distinção RBC/RC, escala RC não científica e transição de cena com contexto |
| ART-07 — lookdev e otimização da fatia | 2–5 dias | corpo/kagune adequados, capturas e medição; sombra, luz, materiais e LOD dentro dos budgets, mobile real ainda sujeito a hardware disponível |

Não somar essas faixas como calendário automático: algumas etapas se sobrepõem, outras esperam revisão e a base escolhida pode exigir refazer topologia. G1 deve limitar-se ao preview e ao contrato de substituição; ART-03 a ART-07 não estão autorizados nesta execução G0.

## Primeira tela original proposta

Abrir em `GHOUL ATLAS / RC OBSERVATORY`, espécime neutro, sem hero promocional e sem marcas da CCG como identidade oficial. Em 1440×900, usar tokens existentes: índice 244 px, inspector 316 px, faixa inferior 88 px; header de referência 64 px. O palco restante tem aproximadamente 880×748 px antes de paddings. Corpo ocupa 60–75% da altura útil, alvo 65%, cabeça e pés íntegros; calcular câmera por bounds.

Overview em 3/4, postura neutra e silhueta forte; selecionar região lombar move para posterior 3/4 e destaca anchor real do proxy. Fundo mineral `#060B12`, pele neutra fosca, luz principal ampla que revela volume, recorte frio moderado, sombra discreta de apoio. RC rubro localizado (`#DC4B5B`), ciano de seleção (`#66D5D0`), âmbar de hipótese (`#E0B46A`), sempre com texto/selo. Evitar corpo totalmente translúcido, excesso de bloom e partículas sem direção. Não depender de HDRI baixado para compor essa cena.

Índice inicial pequeno: superfície, região de kakuhou e evidências. Inspector apresenta espécime, estado **PROXY / CONCEPTUAL MODEL**, estrutura selecionada e limites do conhecimento; a seleção altera realce e câmera de verdade. Enquanto não houver órgão/rig, não simular manifestação. Se a faixa inferior tiver play/pause/scrub no G1, controlar um **scan demonstrativo** legível que efetivamente muda; rotulá-lo como efeito de inspeção, sem alegação de exame clínico ou ativação biológica.

Em 390×844, manter palco de referência de pelo menos 440 px em fluxo e inspector recolhível, seleção por toque/teclado e menos efeitos. `prefers-reduced-motion` conserva seleção e inspeção sem deslocamentos automáticos. Qualidade de arte final continua bloqueada até ingresso e revisão de assets, mesmo se esse preview passar navegação e layout.

## Evidência de auditoria e arquivos lidos

Comandos de inventário: `rg --files --hidden -g '!.git/**'`; busca por extensões de modelo/textura/fonte/imagem; `Get-ChildItem references/private`; `Get-FileHash -Algorithm SHA256`; leitura do cabeçalho PNG para dimensões. A inspeção visual usou `view_image` nos três caminhos absolutos acima. Não foram executados modelagem, renderização de produto ou benchmark nesta subauditoria.

Arquivos efetivamente lidos para este documento: `AGENTS.md`; `references/LEIA_PRIMEIRO.md`; `docs/07_ASSET_PIPELINE.md`; `docs/05_VISUAL_ART_DIRECTION.md`; `contracts/design-tokens.json`; `.gitignore`; `docs/SOURCE_REFERENCES.md`; `research/Atlas Anatômico Interativo de Tokyo Ghoul.md` integralmente; `contracts/seed-catalog.json`; `contracts/atlas-schema.ts`; `prompts/00_AUDITAR_PESQUISAS.md`; `docs/DECISIONS.md` produzido na auditoria raiz. Os demais documentos obrigatórios e o relatório de fisiologia constam da auditoria consolidada [RESEARCH_INDEX](RESEARCH_INDEX.md), não são creditados como leitura desta subauditoria.

**Resultado G0 de assets:** inventário demonstrado por arquivos e imagens; blockers, direitos, ingresso, esforço e composição planejados. **Não implementado:** proxy, AssetSlot, corpo, rig, kagune, vasos e células. Não há screenshot de aplicação G0 nem prova de qualidade cinematográfica. Próximo passo permitido em outra execução: G1 conforme [DECISIONS](DECISIONS.md), mantendo a separação entre preview navegável e arte final.
