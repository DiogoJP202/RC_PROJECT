# Blender → Web — contrato de integração G2A

Versão documental **G2A.1**, 23/10/2026. Fonte principal: [contrato original de arte](07_ASSET_PIPELINE.md), refinado pelas decisões [ADR-004/005/007](DECISIONS.md) e pelo [inventário](ASSET_INVENTORY.md). Este contrato define a entrega técnica; **não aprova anatomia, direção de arte, G2B ou G3**. O aceite da implementação e suas evidências ficam em [G2A_ACCEPTANCE](G2A_ACCEPTANCE.md).

## Entrega do artista

Entregar uma versão imutável por revisão, com os seguintes itens. Engenharia confere o pacote antes de promover o GLB para `public/`; pasta pública é distribuída pelo build, mesmo quando não existe import em um componente.

```text
entrega-<assetId>-v001/                 pacote de trabalho; não copiar inteiro para public/
  source/<assetId>-v001.blend           fonte editável, com dependências empacotadas/autorizadas
  web/<assetId>-v001.glb                único arquivo de runtime, autocontido
  metadata/<assetId>-v001.json          manifesto de ingresso e mapeamento semântico
  licenses/                            termos da geometria e de cada mapa/recurso
  attribution.md                       crédito, origens e alterações
  validation/                          relatório, métricas, vistas e teste de deformação
```

Destino de runtime recomendado: `public/assets/models/body/body-shell-v001.glb`, `public/assets/models/ghoul/kakuhou-rinkaku-v001.glb` etc. Os caminhos G0 continuam sugestões; somente o registro central define qual arquivo é efetivamente carregado. Fixtures ficam separadas em `public/assets/fixtures/` e jamais substituem silenciosamente um modelo final. Não incluir `.blend`, scans, imagens de referência privada ou fontes de terceiros sem redistribuição permitida em `public/`.

Por arquivo, registrar `assetId` estável, revisão, autor, data de exportação, Blender/exportador utilizados, origem concreta/URL de aquisição, distribuição/versão, bytes e **SHA-256 dos bytes entregues**. Juntar licença/URL dos termos, atribuição exata e lista de modificações. Cada textura requer o mesmo encadeamento de direitos; estar embutida no GLB não remove essa obrigação. `PROJECT_ORIGINAL` identifica autoria local e exige declaração de proveniência; não é uma licença de terceiros nem autorização automática para redistribuir qualquer referência.

Não copiar a licença genérica de um portal para um arquivo de outra distribuição. O conflito BodyParts3D histórico/2025 continua em ASSET_INVENTORY; resolver pela versão realmente adquirida. Arquivo sem proveniência/licença aprovada fica `blocked_by_license`, fora do build público. Metadados não substituem conferência humana dos direitos.

## Espaço, transformação e medidas

Convenção de entrega do projeto: metros, **+Y para cima, +Z para a frente do espécime**, orientação direita; origem de corpo inteiro no solo entre os pés. A especificação glTF utiliza metros e esses eixos; nomes de objetos são opcionais e não garantidamente únicos. Referências internas ao formato usam índices. [glTF 2.0, §§3.3–3.4](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#indices-and-names)

No Blender, trabalhar com unidade e dimensões declaradas e conferir a conversão de eixos **no arquivo exportado**, sem depender da orientação do viewport DCC. Não aplicar uma rotação corretiva adicional no renderer por costume. Se houver correção de importação, declará-la uma única vez no manifesto e medir bounds após a composição; não espalhar offsets em UI, câmera e hotspots.

- Corpo: informar altura/largura/profundidade reais do asset, pose neutra e orientação das vistas frontal/posterior. A altura aproximada de **1,85 m do proxy G1 é convenção de desenho**, não exigência de anatomia humana nem medida canônica.
- Parte isolada: informar a raiz, seu espaço local e a transformação de encaixe no corpo. Não recentralizar cada órgão automaticamente em `(0,0,0)` e perder sua relação com o restante da montagem.
- Raiz: preferir escala uniforme positiva, transformações conhecidas e sem shears. Não aplicar transformações destrutivamente depois de fazer bind do rig sem reexportar/testar os inversos.
- Bounds: registrar AABB mínima/máxima em metros na pose de referência, origem/pivô e tolerância de comparação. Conferir bounds de malhas realmente renderizáveis da cena ativa, não só de empties ou de uma cena secundária.
- Animação: entregar também envelope dos extremos amostrados; a AABB da pose neutra não garante ausência de corte durante deformação. Seleção e sockets devem usar a transformação atual.
- Rejeitar valores não finitos, malha vazia, escala inesperada, orientação trocada e discrepância além da tolerância declarada. Não corrigir centímetros por adivinhação.

Pivô do corpo e ponto de foco anatômico são conceitos diferentes. O artista declara o pivô de montagem; o mapa semântico declara foco/anchor e bounds de cada estrutura. A região lombar do kakuhou é aproximada: não converter coordenadas GLB em posição médica ou afirmar uma vértebra específica sem fonte.

## Identidade anatômica e hierarquia

A interface conserva os IDs `human.surface`, `human.head`, `human.muscular`, `human.skeletal`, `human.thorax` e `ghoul.kakuhou.rinkaku`. Eles significam identidade de seleção/conteúdo, não nomes obrigatórios de objetos. LODs, revisões de topologia, renomeação de malha e troca proxy → GLB **não** mudam esses IDs.

Hierarquia recomendada, não formato obrigatório de todo fornecedor:

```text
BODY_ROOT
  RIG_ROOT / bones                     opcional para corpo estático
  GEOMETRY
    SURFACE / HEAD
    MUSCULAR
    SKELETAL
    INTERNAL / THORAX
  SOCKETS / SOCKET_LUMBAR               ou empty filho do bone lombar
GHOUL_ROOT
  KAKUHOU_RINKAKU
  SOCKET_ATTACHMENT                    preparação; nenhuma manifestação G3 implícita
```

Nomes curtos ASCII, sem espaços ou caracteres usados como separadores, ajudam inspeção; `BODY_ROOT`, `SKIN`, `SKELETON` e `KAKUHOU_RINKAKU` preservam o vocabulário G0. Nomes repetidos em ramos distintos são possíveis. **Não aceitar `getObjectByName()` como única prova de correspondência.** O binding precisa resolver um alvo inequívoco no arquivo/revisão e confirmar sua presença na cena ativa; ambiguidade ou ausência gera falha identificada e mantém o proxy.

Um ID pode representar várias primitivas/meshes sob um grupo. Cada primitiva selecionável recebe o mesmo ID semântico depois de resolvido o binding. Grupos de uma anatomia não devem englobar malhas de outra por conveniência. Para subestruturas sobrepostas, definir o alvo mais específico e testar o raycast; um hit deve produzir um único ID estável.

Metadados personalizados de DCC podem auxiliar o ingresso, mas devem ser inspecionados no GLB exportado. O manifesto revisado é a autoridade de mapeamento no runtime; textos arbitrários em `extras` não liberam arquivos, licenças, caminhos ou funções. Não interpretar conteúdo do GLB como script.

### Campos operacionais desta versão

Os tipos executáveis estão em `src/visuals/assets/assetRegistry.ts`; o resolvedor em `src/visuals/assets/assetCache.ts`; a fronteira binária/rede em `src/visuals/assets/gltfResource.ts`. A entrega G2A registra **somente duas fixtures originais**; adicionar arte final exige uma nova entrada aprovada, a extensão explícita dos tipos de representação e os gates G2B. O catálogo editorial v2 continua separado e não é reclassificado pela escolha da fixture.

Exportar propriedades personalizadas e conferir o resultado no chunk JSON do GLB. A chave operacional é **`extras.atlasId`**, preservada como `Object3D.userData.atlasId` no import. Cada valor é único **dentro da cena ativa desse asset**; nomes visuais podem repetir em ramos distintos. A mesma semântica pode reaparecer numa revisão/LOD diferente, com registro atualizado.

```json
{
  "name": "SKIN",
  "extras": { "atlasId": "body.surface" }
}
```

O nome `SKIN` ajuda o artista; `body.surface` é a identidade interna de um node exportado; `human.surface` é o ID anatômico da aplicação. O registro faz a ligação, por exemplo:

```ts
bindings: {
  'human.surface': { semanticIds: ['body.surface'] },
  'human.thorax': { semanticIds: ['body.thorax.left', 'body.thorax.right'] },
}
```

Esse fragmento mostra o formato; **não é uma entrada de asset final já aprovada**. Um `semanticId` pode apontar a um grupo que contém primitivas selecionáveis. O resolvedor rejeita identidade duplicada, binding vazio/ausente/sem geometria e mesh pertencente a dois IDs anatômicos conflitantes. `nodeNames` continua como conferência auxiliar do export legado; não resolve identidade anatômica.

O registro contém `path`, `version`, `sha256`, `byteLength`, `maxBytes`, autoria/licença/atribuição, `representation`, `bindings`, `sockets` e `spatial`. Neste último, declarar `rootSemanticId`, `metersPerUnit: 1`, `upAxis: 'Y'`, `forwardAxis: '+Z'`, `pivot`, `tolerance` e `bounds: { min, max }`. A raiz exportada leva os mesmos metadados de unidade/eixos em `extras`; o import confere sua identidade, escala unitária, rotação aplicada, pivô e bounds contra o registro. Metadado coincidente não prova que uma figura foi modelada corretamente: frente/posterior e precisão anatômica continuam revisão humana.

`binding.anchor`, quando fornecido, é um ponto em **espaço local da raiz semântica do asset**, transformado pela matriz dessa raiz; deve ficar nos bounds do binding com a tolerância declarada. Sem anchor explícito, o resolvedor obtém o centro dos bounds. Não confundir esse ponto de inspeção com um socket filho de bone, que acompanha deformação pela sua própria hierarquia. O runtime de cena pode recalcular bounds/centros atuais para o foco durante pose.

Sockets usam `{ semanticId, anatomyId }`, por exemplo `lumbar: { semanticId: 'socket.lumbar', anatomyId: 'ghoul.kakuhou.rinkaku' }`. O node exportado leva `extras.atlasId: 'socket.lumbar'`, sua transformação local e o pai corretos. O mapa não cria um socket virtual se o node estiver ausente.

As fixtures atuais usam `fixture.root`, `fixture.head`, `fixture.thorax`, `fixture.kakuhou`, `socket.lumbar` e, no rig, `socket.rig-tip`. Ambas têm pivô `[0,0,0]` e tolerância de **0,015 m em distância vetorial**. O arquivo estático declara `min=[-0.185,0.901,-0.187]`, `max=[0.185,1.85,0.12]`; o articulado declara `min=[-0.185,0.906,-0.172]`, `max=[0.185,1.85,0.12]`. São números de teste, não gabarito de órgão/corpo final. Cada novo arquivo recebe os próprios bounds medidos e tolerância justificada.

O consumo de cena usa `acquireAsset(assetId)` e recebe um **lease** com `scene`, `bindings`, `bounds`, `anchors`, `sockets`, `animations`, `mixer` opcional e `release()`. O lease possui transforms, materiais, bones e mixer próprios; geometrias/texturas do template são compartilhadas até o último usuário liberar. Chamar `release()` na troca/desmontagem; não executar descarte genérico da árvore do lease, que quebraria outros consumidores. Abort/falha não autoriza publicar instância incompleta. Estatísticas em `getAssetCacheStats()` servem a diagnóstico, sem equivaler a medição de VRAM.

A bancada G2A alterna um GLB por vez sobre os demais proxies; o cache foi testado com leases concorrentes. Para arte final dividida em vários arquivos, entregar transformações de encaixe e responsabilidades por ID sem sobreposição ambígua. A composição visual simultânea desses arquivos será validada em G2B; o teste de duas instâncias independentes de um recurso não equivale ao aceite dessa montagem artística.

### Limites executáveis do ingresso G2A

O preflight em `glbValidation.ts` é um subconjunto conservador, não substitui o validador Khronos completo. Exige GLB autocontido, sem URI/data URI, recursos de rede ou decoder externo. Sparse accessors, mais de quatro influências por vértice e extensões fora da lista aprovada são rejeitados. Todos os meshes renderizáveis da cena ativa precisam de binding anatômico; bones, empties e sockets podem ser não renderizáveis. Isso impede geometria não mapeada de continuar visível durante isolamento.

Limites atuais: JSON até 2 MiB/profundidade 64, tabelas até 8.192 entradas, accessors até um milhão de elementos e oito milhões de escalares, até 128 juntas por skin e animações até 600 s. As duas fixtures têm teto individual de 1 MiB; esse valor não é um orçamento aprovado para arte final. Novo ingresso precisa declarar e justificar seus limites respeitando o orçamento conjunto da experiência.

O ownership envolve o hook `GLTFLoader.register` e métodos tipados do parser da versão fixada **Three 0.186.1**, inclusive recursos originais/derivados que não chegam à árvore final e resoluções tardias após erro. Atualizações de Three exigem executar as regressões de ownership/importação. Textura incorporada foi exercitada por GLB em memória com decodificação controlada; isso não aprova texturas do artista, codecs adicionais ou todo navegador. Morphs, envelope completo de produção e arte texturizada continuam dependências de aceite G2B.

## Camadas, transparência e materiais compartilhados

Entregar geometria separável para `surface`, `muscular`, `skeletal` e `internal`; um mesh único com tintas diferentes não satisfaz camadas independentes. `human.head` pertence à superfície na configuração atual. Uma estrutura pode reunir diversos meshes, mas cada mesh controlável deve ter associação determinística.

Seleção, raycast, foco, isolamento e alternativa HTML usam o mesmo mapa. Esconder uma camada deve esconder seus descendentes visuais e impedir picking efetivo; alterar a opacidade da pele não pode tornar invisible um órgão em outra camada. Isolar/restaurar conserva o estado anterior do usuário.

Materiais-base pertencem ao asset. O observatório pode criar variantes de apresentação por instância/binding para transparência, dessaturação e realce localizado; não modificar um material compartilhado por anatomias independentes e contaminar a seleção. O destaque deve permanecer discreto, sem depender de pós-processamento pesado. Registrar áreas em que alpha blending, ordenação ou superfícies duplas impedem boa leitura.

O pacote deve identificar materiais de pele que permitem transparência de inspeção. Transparência não equivale a cortes anatômicos físicos. Casos de sorting/depth são revisão visual obrigatória no G2B, principalmente com pele, cabelos ou superfícies quase coincidentes.

## Sockets e pontos de conexão

Um socket é um empty/node ou bone real da cena ativa, com identificador de função no manifesto. Declarar o seletor do pai, posição e orientação em **espaço local desse nó**, unidade e convenção de quaternion quando houver offset. Posição de mundo é calculada a partir da hierarquia atual; não duplicar um vetor fixo de mundo para acompanhar um rig animado.

Para encaixe lombar, entregar vista posterior e lateral, nome/ID do socket, pai, orientação de saída, posição local e nota `approximate`. Um socket não confirma trajeto vascular, ducto ou microanatomia oficial. Documentar se está no corpo ou no asset acoplado e a correspondência esperada entre ambos. Rig e socket devem sobreviver a mudanças de pose sem separação visível.

Teste mínimo de encaixe: desenhar um marcador autoral no socket, mover a raiz e o bone pai, comparar a transformação de mundo e repetir depois de troca de instância. Essa prova é de infraestrutura; o órgão final e seus encaixes artísticos continuam G2B. Kagune, seus morphs e as sete fases continuam G3.

## Rig, skinning e animação

Corpo estático é aceito como entrega estática; não inventar rig ausente. Se a revisão declara rig, entregar hierarquia completa de joints, pose de referência, pesos, bind e clips inventariados. Requisitos adicionais do projeto:

1. Todos os bones utilizados estão na cena ativa e sob raiz incluída no pacote; nenhuma dependência de um armature externo não exportado.
2. Pesos finitos, não negativos, normalizados e sem vértices sem influência; até **quatro influências por vértice** e **64 joints por rig visível** são alvos iniciais, sujeitos a perfil. Redução de peso exige revisão de deformação.
3. Matriz de bind e inversos finitos, coerentes com a pose de referência; conferir extremos e presença de deformação no renderer. Uma lista de nomes de bone não demonstra skinning funcional.
4. Sem escalas negativas/não uniformes em chains deformáveis, shears, constraints/drivers ou controladores DCC necessários no runtime. Bakear o resultado necessário; preservar o rig autoral completo na fonte `.blend`.
5. Nomes de clips estáveis, duração/unidade, fps de autoria, intervalo, loop e alvos documentados. Evitar root motion implícito; declarar se existe. Entregar pose neutra reproduzível e clips separados por finalidade.
6. Morphs, se usados, precisam de nomes e intervalos documentados; não assumir `root_reveal`, `appendage_extend` ou `appendage_thicken` só porque G0 os sugeriu. Esses recursos finais não são exigidos nem aprovados nesta infraestrutura G2A.
7. Reproduzir e amostrar início/meio/fim; voltar a um mesmo tempo deve produzir a mesma pose. Pausar/reduced motion conserva uma inspeção estática acessível. Não ligar animação visual a uma fórmula canônica RC.
8. Duas instâncias simultâneas não compartilham estado mutável de skeleton/mixer. Liberar uma instância não quebra outra. Liberar a última não deixa mixers, skeletons ou recursos GPU órfãos.

Rig sintético comprova o transporte técnico de joints/weights/clips e suas instâncias. Deformação anatômica final, topologia em poses extremas e rig rinkaku precisam de revisão dos arquivos definitivos.

## Materiais, texturas e fronteira de carregamento

Baseline de entrega: GLB 2.0 **autocontido**, materiais PBR metallic/roughness simples, imagens PNG/JPEG embutidas em `bufferView`. Preferir materiais de superfície opacos; `MASK`/`BLEND` apenas com finalidade e revisão visual. Texturas iniciais de até **2.048 px por lado**, sem mapas 8K por padrão. Registrar dimensões, canais, espaço de cor e número de materiais. Bakear materiais complexos de DCC quando necessários; nodes do Blender não são código web executável.

O formato GLB pode referenciar recursos externos; a extensão `.glb` sozinha não comprova que um arquivo é autocontido. A entrada do projeto restringe a rede ao arquivo aprovado, sua origem/caminho e hash; recursos externos internos ao contêiner também precisam passar a fronteira de aprovação. [glTF 2.0, §§2.8/3.6.1.2](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-stored-buffer)

Para G2A, não preparar entrega que dependa de URLs remotas, `.bin`/imagens vizinhas, `data:` arbitrário, scripts, decoders remotos ou extensões não homologadas. Não apontar o loader para um URL informado pelo visitante. Não tratar redirect HTTP como autorização para buscar outro domínio. Cache usa a identidade/revisão/hash da entrada, não um nome visual de mesh.

Draco, Meshopt, KTX2/Basis e materiais de transmissão não fazem parte da baseline por aparecerem na documentação geral do GLTFLoader; exigem configuração, arquivos auxiliares autorizados, teste de compatibilidade e benefício medido antes de liberar uma entrega futura. O suporte de biblioteca não equivale ao suporte configurado da aplicação. [GLTFLoader, configuração de decoders](https://threejs.org/docs/pages/GLTFLoader.html)

A política exata de extensões e os campos executáveis do manifesto são definidos nos módulos de ingresso listados adiante. Em divergência, não remover o gate para acomodar um export: revisar o pacote e a decisão explicitamente.

Lista permitida G2A: `KHR_materials_unlit`, `KHR_materials_emissive_strength` e `KHR_texture_transform`. Qualquer outro decoder/extensão requer revisão. Todo campo `uri` é recusado na inspeção do contêiner, inclusive `data:` e caminho relativo; usar imagens/buffers incorporados por `bufferView`. Rede exige origem aprovada, sem query/fragment, traversal ou redirect; hash e bytes são conferidos antes do parse na aquisição pelo registro. A regra é deliberadamente mais restrita que o formato glTF geral.

## Orçamento inicial e carga progressiva

São metas de ingresso do projeto, não propriedades garantidas do glTF nem métricas já atingidas por um corpo final:

| Recurso | Meta inicial da entrega | Aceite |
|---|---|---|
| Payload frio inicial total | **≤8 MiB transferidos**, incluindo app e assets necessários | Medir no build/rede declarados; não 8 MiB por arquivo |
| Body renderizado | **<150 draws** totais | Contar com sombras/materiais da aplicação |
| Body LOD0 visível | Referência inicial ≤200 mil triângulos | Registrar total real e revisar perfil; não preencher anatomia com geometria inútil |
| LOD alternativo | Referência ≤80 mil triângulos | Só exigir/ativar se houver revisão e ganho medido; IDs permanecem iguais |
| Texturas | Até 2K por mapa; inventário de bytes/dimensões | Medir recursos e qualidade, não inferir VRAM só pelo tamanho JPEG |
| Rig ativo | Referência ≤64 joints e quatro influências/vértice | Registrar custo e deformação; não sacrificar correção silenciosamente |
| Tempo até interação | ≤5 s, protocolo ADR-011 | Máquina/browser/DPR/rede registrados |
| Fluidez desktop | p50 ≥50 / p10 ≥30 FPS | Warm-up 10 s + amostra 30 s; não extrapolar para celular |

Carregar somente arquivos aprovados necessários à vista. Microscopia, vasos detalhados e kagune não entram automaticamente na entrada Body. Exceção a orçamento exige medição, causa, alternativa considerada e decisão registrada. Medição de viewport móvel emulado não certifica GPU de um celular físico.

## Procedimento de entrega e aceite

1. Artista exporta uma revisão autocontida, anexa manifesto, licenças/créditos, medidas e relatório de rig/materiais. Fonte `.blend` fica recuperável; não adicionar recursos privados ao bundle.
2. Engenharia mede SHA-256/bytes, verifica proveniência da revisão e inspeciona o JSON do contêiner: cena ativa, recursos, extensões, bindings, sockets, clips. O arquivo só vai para o registro aprovado depois dessas conferências.
3. Abrir em validador glTF e viewer locais autorizados; salvar versão/ferramenta, erros e warnings. Não enviar asset privado a um viewer externo sem autorização. Validação de formato não aprova anatomia ou direitos.
4. Importar pelo mesmo caminho assíncrono/cache da aplicação, nunca por um import especial de demonstração. Conferir transforms, bounds, pivô, malhas renderizáveis, textura, rig/clip e socket na cena ativa.
5. Exercitar a mesma identidade por raycast e índice HTML; foco/reset/orbit/zoom, ocultar cada camada, opacidade, isolar/restaurar, troca de modelo, erro/retry/fallback, teclado e reduced motion. Interações devem continuar no asset novo, não selecionar o proxy invisível.
6. Para rig: amostrar pose neutra/extremos, demonstrar deformação de vértice e socket acompanhando bone, duas instâncias independentes, trocas e liberação. Registrar propriedades não demonstradas como pendentes.
7. Rodar os checks existentes e novos testes relevantes, capturar desktop/mobile e vistas de inspeção, medir custo no build de produção. Confirmar que pesquisa e referências privadas continuam fora de `dist`.
8. Fazer revisão humana anatômica e artística do modelo definitivo **no G2B**, com nome/data/escopo e problemas visíveis. Só então alterar o status de representação do asset correspondente; aprovação técnica de uma fixture não promove outro arquivo.

Aceite anatômico G2B: proporções/marcos/posição relativos revisados, estruturas selecionadas coerentes com sua evidência, pele/interiores não enganadores, normais/UV/texturas/deformações legíveis nas câmeras e telas de uso. Arte ghoul original conserva aviso de reconstrução; a existência/função textual de kakuhou não aprova seu formato, lóbulos, vasos ou histologia.

Falha de rede, hash, cena/binding, rig declarado ou validação espacial mantém o proxy disponível e mostra o motivo. `PROXY / CONCEPTUAL MODEL` permanece quando o fallback ou uma fixture está renderizado. Conteúdo de evidência e navegação HTML continuam acessíveis; dados do catálogo não herdam status factual do arquivo 3D.

## Relação com os contratos anteriores

| Registro anterior | Resolução G2A |
|---|---|
| G0: nomes sugeridos `SKIN`, `SKELETON` etc.; seed tem `nodeName` | Vocabulário recomendado, não identidade exclusiva. Binding explícito por revisão; resolver hierarquia/cena ativa e rejeitar ambiguidades |
| G1: `HUMAN_SURFACE` etc. no manifesto procedural | Permanecem corretos para o gerador G1. GLB pode ter outros nomes; conserva os seis `anatomyId` |
| G0: arquivos KTX2 sugeridos | Intenção de otimização futura. Baseline autocontida sem decoder adicional; extensão só após homologação |
| G0: altura realista e origem preferencial no solo | Unidade/eixos/pivô precisam ser declarados e conferidos; 1,85 m do proxy não vira obrigação de corpo final |
| G0: rig/morphs sugeridos para rinkaku | Convenções de G3, não existência nem requisito de arte final G2A |
| G1: adaptador interno com node de grupo em memória | Evolução precisa provar disco/rede local, meshes, rig, cache e ownership com fixtures; não se credita anatomia final |
| Pesquisa sugere Next.js e atlas extenso | ADR-002 mantém Vite/React/R3F e fatia rinkaku; este contrato não reabre a stack ou cria outros sistemas |

Os documentos G0/G1 continuam registros datados, não devem ser apagados para parecer que o pipeline sempre existiu. Este contrato prevalece nos detalhes operacionais da nova entrega G2A, sujeito à implementação e ao aceite registrado. Mudança incompatível de campos exige revisão explícita de manifesto/testes/documentação.

## Bloqueios que o contrato não resolve

Faltam os arquivos anatômicos definitivos e suas licenças específicas, revisão anatômica/artística, integração da topologia/material real, envelopes de deformação de produção e medição em celular físico. Nenhuma fixture substitui o artista. Quatro camadas de infraestrutura não equivalem a um atlas completo. G2B e G3 dependem de nova autorização e dos arquivos correspondentes.

## Base consultada e limites da conferência

Leitura local direta nesta contribuição: `AGENTS.md`; anexo G2A do usuário; `docs/G1_ACCEPTANCE.md`, `docs/IMPLEMENTATION_LOG.md`, `docs/DECISIONS.md`, `docs/ASSET_INVENTORY.md`, `docs/01_ROADMAP_AND_GATES.md`, `docs/07_ASSET_PIPELINE.md`; trecho de assets do `docs/PROJECT_HANDOFF.md`; `contracts/atlas-schema.ts`; `src/app/types.ts`; `src/scene/AssetSlot.tsx`, `ObservatoryScene.tsx`, `camera.ts`, `proxy-manifest.json`, `assetRuntime.ts`; `src/visuals/assets/gltfResource.ts`, seu teste G1, `assetRegistry.ts` e `assetCache.ts`; `tools/generate_fixture_glbs.mjs`; `public/assets/fixtures/manifest.json`; trecho 1004–1144 do relatório real `research/Atlas Anatômico Interativo de Tokyo Ghoul.md`. Não se atribui a esta contribuição nova leitura integral das duas pesquisas ou de imagens privadas.

Consultadas em 23/10/2026 as referências oficiais Khronos e Three vinculadas acima. A [página do manual Blender citada pelo projeto](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html) e tentativas de URL atual/4.5 retornaram erro 402 pela ferramenta; não se declarou teste do exportador ou leitura bem-sucedida dessa página. Os requisitos de exportação aqui são normas do projeto a conferir no GLB concreto, sem alegar instalação/execução Blender nesta contribuição.
