# Auditoria editorial de conteúdo — G0

Data de conferência: **2026-10-23, America/Sao_Paulo**. Escopo: decidir o que pode ser afirmado, o que exige leitura legítima do mangá e o que deve ser identificado como reconstrução. Nenhum dado do catálogo, contrato ou aplicação foi alterado nesta auditoria.

## Resultado e método

Há dois relatórios reais: `research/Anatomia e fisiologia dos ghouls em Tokyo Ghoul.md` (R1) e `research/Atlas Anatômico Interativo de Tokyo Ghoul.md` (R2). O README lido no primeiro inventário era uma instrução de entrega, não uma terceira pesquisa; já não estava presente após a inclusão dos relatórios. R1 foi lido integralmente; R2 foi conferido aqui nos trechos de escala e slider indicados abaixo; a leitura integral de R2 está registrada na auditoria geral de G0.

Os marcadores `turn…search…` presentes nas pesquisas não são citações recuperáveis pelo catálogo. São pistas de uma consulta anterior. Uma URL em R1, R2 ou `SOURCE_REFERENCES.md` não demonstra que o quadro do mangá tenha sido lido.

As páginas Young Jump e Marvelous consultadas contêm texto japonês extraível além de imagens; as confirmações abaixo usam **o texto**, com resumo em português. Não se declarou inspecionar imagens anatômicas ou painéis do mangá. A fonte oficial do anime tem escopo de adaptação e não prevalece sobre eventual conflito com o mangá. Não apareceu conflito textual entre os quatro verbetes básicos consultados, mas isso não equivale a uma revisão integral do cânone.

`confidence` é qualitativa: alta = suporte direto e suficiente ao enunciado limitado; média = classificação editorial segura com extensão ou microestrutura não demonstrada; baixa = suporte primário ainda não lido. Para `unknown`, confiança refere-se à decisão de não especificar o detalhe, sem pretender provar sua ausência em todos os capítulos existentes. Uma reconstrução pode ter confiança alta de que é autoral e continuar sem validade biológica.

## Fontes remotas efetivamente abertas

Todas as entradas foram abertas nesta auditoria em 2026-10-23. Os identificadores S são locais a este documento; não substituem futuros registros `Citation`.

| ID | URL direta / título | Resultado da abertura e limite da conferência |
|---|---|---|
| S1 | [Young Jump — dados de ghoul](https://youngjump.jp/tokyoghoul/tg/data/) | Texto japonês acessível, seção 喰種: dieta, RC e kakuhou. Imagens não inspecionadas. |
| S2 | [Young Jump — Kagune](https://youngjump.jp/tokyoghoul/tg/data/index02.html) | Texto acessível, seção 赫子: exteriorização RC e propriedades mecânicas qualitativas. Imagens não inspecionadas. |
| S3 | [Young Jump — RC type](https://youngjump.jp/tokyoghoul/tg/data/index03.html) | Texto acessível: quatro tipos, regiões de manifestação e propriedades relativas. Não fornece atlas volumétrico interno ou coordenadas métricas. |
| S4 | [Marvelous — glossário do anime](https://www.marv.jp/special/tokyoghoul/first/glossary.html) | Texto acessível nos verbetes 喰種, 赫子, クインケ e 赫眼. Fonte oficial da adaptação, não painel do mangá. |
| S5 | [Young Jump — Quinque](https://youngjump.jp/tokyoghoul/tg/data/index04.html) | Texto acessível, seção クインケ. Confirma processamento do kakuhou e acionamento elétrico, sem estabelecer inervação natural. |
| S6 | [OpenStax — An Overview of Blood, 18.1](https://openstax.org/books/anatomy-and-physiology-2e/pages/18-1-an-overview-of-blood) | Texto acessível, composição e circulação dos elementos sanguíneos. Referência didática humana; não evidência de circulação RC. |
| S7 | [OpenStax — Circulatory Pathways, 20.5](https://openstax.org/books/anatomy-and-physiology-2e/pages/20-5-circulatory-pathways) | Texto acessível, circuitos pulmonar e sistêmico. Conferidos os parágrafos iniciais, Pulmonary Circulation e Overview of Systemic Arteries. |
| S8 | [OpenStax — Respiratory System, 22.1](https://openstax.org/books/anatomy-and-physiology-2e/pages/22-1-organs-and-structures-of-the-respiratory-system) | Texto acessível, funções gerais e distinção entre zonas condutora e respiratória. Consulta contextual, não usada para extrapolar fisiologia ghoul. |
| S9 | [OpenStax — Wound Healing, 24.4](https://openstax.org/books/fundamentals-nursing/pages/24-4-wound-healing) | Texto acessível, Phases of Wound Healing. Distingue hemostasia, inflamação, proliferação e maturação; o próprio texto também agrupa hemostasia com inflamação em três fases. Não fixa tempo de regeneração ghoul. |
| S10 | [VIZ — Tokyo Ghoul:re, capítulo 2](https://www.viz.com/shonenjump/tokyo-ghoul-re-chapter-2/chapter/6179) | Título e shell do leitor acessíveis, com elementos de preview/carregamento. Nenhuma fala ou painel relevante foi lido. Não comprova RC humano, faixas ou Red Child nesta sessão. |
| S11 | [VIZ — Tokyo Ghoul:re, capítulo 37](https://www.viz.com/shonenjump/tokyo-ghoul-re-chapter-37/chapter/8037) | Redirecionou para [catálogo de capítulos](https://www.viz.com/shonenjump/chapters/tokyo-ghoul-re). Nenhuma fala/painel sobre pathways foi conferida. |

As fontes OpenStax são fontes didáticas diretas para anatomia humana, não pesquisa experimental primária. Não foram consultadas wikis nesta execução. R1/R2 são sínteses secundárias locais. Os destinos de capítulos adicionais citados a seguir são **alvos para verificação**, não páginas declaradas lidas.

## Registro de 25 afirmações essenciais

O texto desta tabela é uma proposta editorial para futura migração. A data de consulta é a do cabeçalho, com o escopo específico declarado em cada linha. `—` significa que a afirmação ainda não tem Claim próprio no seed.

| # / Claim do seed | Enunciado permitido ou candidato | EvidenceKind | Fonte, conferência e confidence | Lacuna / ação obrigatória |
|---|---|---|---|---|
| 01 `claim.kakuhou.stores.rc` | Kakuhou acumula RC e participa da formação do kagune. | `official` | S1, verbete 喰種; S4, verbetes 喰種/赫子. Texto direto conferido; **alta**. R1 l8–12, 120, 136. | Não estender função a formato, tamanho ou histologia do mesh. Acrescentar locator e resumo ao registro da fonte quando migrar. |
| 02 `claim.kagune.liquid.muscle` | Kagune é descrito como músculo líquido que endurece e amolece. | `official` | S2, seção 赫子. Texto direto conferido; **alta**. R1 l209–213. | Propriedade qualitativa não determina rigidez em pascal, timing ou shader. |
| 03 — | Água e café são exceções à restrição alimentar descrita para ghouls. | `official` | S1/S4, verbete 喰種; texto direto conferido; **alta**. R1 l342–356. | Explicação bioquímica do café fica `unknown`; enzimas específicas não foram verificadas. |
| 04 — | O guia distingue ukaku, koukaku, rinkaku e bikaku. | `official` | S3, abertura de Rc type; texto direto conferido; **alta**. R1 l235–246. | Sem fórmula universal de poder nem vitória automática por classe. |
| 05 — | Rinkaku manifesta-se aproximadamente na região da cintura/lombar. | `official` | S3, seção 鱗赫; texto regional conferido; **alta** para a região, **baixa** para precisão interna. R1 l144–179. | O guia descreve região de aparecimento; posição profunda do órgão, vértebra e coordenadas GLB continuam aproximadas. |
| 06 — | Rinkaku é associado a regeneração e a ligações RC comparativamente frágeis. | `official` | S3, seção 鱗赫; texto direto conferido; **alta**. R1 l260–269. | Sem taxa de cura, limiar de dano, constante material ou multiplicador numérico. |
| 07 — | Quinque usa kakuhou processado e sinais elétricos para gerar kagune artificialmente. | `official` | S5, seção クインケ; S4, mesmo verbete; texto direto conferido; **alta**. R1 l293–308. | Não prova presença de nervo nomeado ou mecanismo neural no órgão vivo. |
| 08 — | No glossário do anime, kakugan relaciona alteração ocular à excitação ou uso de habilidades; há exceções de lateralidade. | `official` | S4, verbete 赫眼; texto direto conferido no escopo do anime; **alta** nesse escopo. R1 l280–291. | Separar fenótipo de histologia. A descrição fina de esclera/íris exige referência visual autorizada própria. |
| 09 — | Humanos também possuem RC. | `manga_needs_verification` | R1 l8–10, 93–99; S10 é alvo primário identificado, mas só metadados foram lidos; **baixa** nesta auditoria. | `verificationTodo`: ler legitimamente :re cap. 2, registrar edição, diálogo e localização. Não mostrar OFICIAL ainda. |
| 10 — | Humanos ~200–500; ghouls ~1.000–8.000 de fator RC. | `manga_needs_verification` | R1 l103–116 remete a :re cap. 2 e TG cap. 29; S10 sem painel; **baixa**. | Conferir ambos os capítulos, tradução e qualificador de faixa. Não inventar unidade, limiar de transformação ou proporcionalidade de força. |
| 11 — | RC significa Red Child e a denominação alude à aparência descrita no mangá. | `manga_needs_verification` | R1 l91–99; S10 sem fala/painel; **baixa**. | Conferir :re cap. 2. Nenhuma imagem microscópica foi validada para modelagem. |
| 12 — | Formação, fixação e desagregação são três estágios nomeados. | `manga_needs_verification` | R1 l215–233 usa marcador de índice anterior sem referência primária recuperável no trecho; S2 só confirma mudanças de consistência; **baixa**. | Localizar capítulo/verbete primário que nomeia os estágios. A timeline do projeto fica autoral até lá. |
| 13 — | RC pathways se desenvolvem em corpos modificados e se relacionam à adaptação. | `manga_needs_verification` | R1 l128, 394, 445–453; S11 redirecionou sem painéis; **baixa**. | Ler :re cap. 37 legitimamente; separar existência das vias de sua histologia e de um mapa vascular inventado. |
| 14 — | Haru Shirazu apresenta ROS, associada a excesso RC e doença. | `manga_needs_verification` | R1 l455–465; alvo: [VIZ :re cap. 42](https://www.viz.com/shonenjump/tokyo-ghoul-re-chapter-42/chapter/8043), não aberto nesta auditoria; **baixa**. | Ler capítulo e registrar proposição exata. Não usar diagnóstico humano de câncer como equivalência. |
| 15 — | Quinx possuem kakuhou implantado com frames e podem manter alimentação humana. | `manga_needs_verification` | R1 l579–599; S10/S11 não forneceram painéis; **baixa**. | Verificar cenas e estado dos personagens; quantidade/percentuais de frames e exceções não entram como dados estabelecidos. |
| 16 — | Meio-humanos constituem perfil diferente de ghoul de um olho e de Quinx. | `manga_needs_verification` | R1 l528–577, 603–617; alvo: [VIZ :re cap. 83](https://www.viz.com/shonenjump/tokyo-ghoul-re-chapter-83/chapter/18639), não aberto; **baixa**. | Conferir categorias e exceções. Não atribuir automaticamente RC alto nem faixa própria a `half_human`. |
| 17 — | Canibalismo repetido pode associar-se a kakuja, sem regra quantitativa universal. | `manga_needs_verification` | R1 l475–520; alvo: [Shonen Jump+ TG cap. 65](https://shonenjumpplus.com/episode/13932016480028833411), não aberto; **baixa**. | S1 confirma canibalismo, não o mecanismo kakuja. Conferir capítulo antes de promoção editorial; não produzir conversor RC→kakuja. |
| 18 — | Histologia detalhada e vascularização do kakuhou não estão estabelecidas nas fontes efetivamente verificadas. | `unknown` | S1/S4 limitam-se à função; R1 l186–190, 683–684 reconhece lacuna; **média**. | Não atribuir cápsula, lóbulos ou artérias nomeadas como oficiais. Revisão global do mangá ainda não realizada. |
| 19 `claim.rc.organelles.unknown` | Arquitetura interna e dimensão física da célula RC permanecem não estabelecidas para este catálogo. | `unknown` | R1 l99, 665–666; S1/S2 sem citologia; **média**. | Sem organelas precisas, barra em μm ou falsa resolução microscópica. Não afirmar que toda a obra foi examinada. |
| 20 — | RC percorrendo a rede vascular humana é uma interpretação didática de transporte sistêmico. | `inference` | R1 l124–132 reconhece microanatomia indefinida; S7 só trata sangue humano; **média** para a cautela editorial. | Disclaimer público: “Transporte RC ilustrado; trajetos e integração com vasos humanos não foram estabelecidos nestas fontes.” |
| 21 `claim.kakuhou.render.internal` | Câmaras pulsáteis representam visualmente a reserva da simulação. | `hypothetical_model` | Escolha autoral do seed e docs/04, seção C; sem fonte canônica para morfologia; **alta** de autoria conceitual. | Manter disclaimer existente visível ao isolar/focar; sinalizar PROXY / CONCEPTUAL MODEL no asset. Pulso não é batimento oficial. |
| 22 — | Reserva 0..1, densidade de partículas e tempos da timeline controlam aparência. | `hypothetical_model` | docs/04 e `PhysiologicalState`/`KaguneFrame`; regra de projeto, **alta** de autoria conceitual. | Rotular SIMULAÇÃO. `rcFactor`, `reserve` e progresso não são intercambiáveis. Não converter slider em diagnóstico de espécie. |
| 23 `claim.blood.illustrated` | Hemácias integram os elementos sanguíneos que circulam nos vasos humanos. | `real_anatomy` | S6, composição; S7, circuitos e capilares; texto didático conferido; **alta**. | Não usar a mesma citação para afirmar presença de RC em capilares ou equivalência RC=hemácia. |
| 24 — | Circuitos pulmonar e sistêmico conectam coração, pulmões e demais tecidos por trajetos distintos. | `real_anatomy` | S7, Pulmonary Circulation/Overview of Systemic Arteries; texto conferido; **alta**. | Assets e splines precisam revisão anatômica própria; a existência do circuito não autentica geometria de proxy. |
| 25 — | Reparo humano envolve hemostasia, inflamação, proliferação e maturação, com agrupamentos didáticos possíveis. | `real_anatomy` | S9, Phases of Wound Healing; texto conferido; **alta**. | Não transportar durações ou etapas para regeneração ghoul; se comparar, separar painéis e evidências. |

## Conflitos e correções editoriais propostas

1. **Certeza herdada de pesquisa:** R1 chama várias exposições de canônicas, mas os suportes de capítulos permanecem inacessíveis nesta leitura. Faixas RC, Red Child, pathways, ROS e híbridos não recebem `official` por herança do relatório. R1 fornece bons alvos; não resolve o `verificationTodo`.
2. **Síntese mais afirmativa que as ressalvas:** R1 l833 intitula o diagrama “MODELO CANÔNICO”, enquanto inclui pool, inervação provável e encadeamentos de reparo. O próprio R1 l49 e l757–761 distingue hipótese. A futura figura deve ter título de síntese interpretativa e evidência por ligação, não selo único global.
3. **Meio-humano e RC:** R1 l634 liga meio-humano a “RC elevado”; l651 ressalva ausência de faixa. Isso não demonstra elevação universal. Manter perfil independente e valor desconhecido até evidência específica.
4. **Escala RC:** R2 l398–412 propõe uma descida até μm apesar de admitir escala não canônica. Isso conflita com a proibição de precisão fictícia. A transição pode ser cinematográfica; ao entrar em RC, mudar para escala ilustrativa sem número físico.
5. **Slider como taxonomia biológica:** R2 l709–728 coloca HUMAN→TRANSITION→GHOUL no mesmo eixo que concentra reserva e regeneração. Um aviso de ausência de linearidade não corrige o diagnóstico implícito. Separar perfil de espécime, fator RC documentado e controles visuais normalizados, conforme docs/04.
6. **Localização e forma com granularidade diferente:** `ghoul.kakuhou.rinkaku` tem `evidenceKind: official`, mas inclui claim hipotética, `conceptual_proxy` e espacialização aproximada. O dado regional pode ser documentado; a malha e seu interior não herdam o selo. O seed usa `locationPrecision: documented_region`; o posicionamento 3D interno continua aproximado e deve ser exibido como tal.
7. **Mesmo problema no kagune:** `ghoul.kagune.rinkaku` pode reunir função descrita oficialmente e manifestação autoral. O rótulo público deve mostrar evidência da afirmação e status do modelo separadamente. `official` no nó não autentica rig, duração, escamas ou material renderizado.
8. **Fontes apenas cadastradas:** todas as quatro citações do seed têm `verifiedAt: null`; falta locator em todas e resumo em três. Esta auditoria comprovou escopos restritos de S1/S2/S3/S7; não alterou as citações. Em G1, migrar apenas os escopos efetivamente conferidos, preservando pendências.
9. **Nome ambíguo de citação:** `src.openstax.blood` chama-se Circulatory Pathways e aponta a seção 20.5. O suporte é pertinente à circulação, mas o identificador não distingue composição sanguínea de trajetória. Propor fonte própria 18.1 ao ampliar o conteúdo, sem trocar IDs silenciosamente nesta fase.
10. **Contrato de confiança incompleto:** docs/04 prevê `confidence`; `Claim` em `contracts/atlas-schema.ts` não tem esse campo. A mesma interface permite locator, data e nota opcionais, sem declarar escopo manga/anime para cada claim. Projetar migração explícita em G1, preservando os IDs atuais; não alterar versão ou contrato em G0.

## Auditoria dos cinco Claims presentes no seed

| Claim | Suporte editorial após consulta | Estado do arquivo existente |
|---|---|---|
| `claim.kakuhou.stores.rc` | Conteúdo básico sustentado por S1; S4 explicita a relação com formação. | Fonte ainda não tem data preenchida/locator; não promover o mesh junto com a afirmação. |
| `claim.kagune.liquid.muscle` | Sustentado por S2. | Data/locator/resumo ainda ausentes no registro. |
| `claim.kakuhou.render.internal` | Hipótese claramente nomeada, `isLoreClaim: false`, disclaimer adequado. | Deve aparecer no mesmo contexto de um nó atualmente `official`, risco de ocultação por agregação. |
| `claim.blood.illustrated` | Sustentado pelo conjunto S6/S7 para humanos. | S7 já cadastrado, mas sem data/locator; atribuição a todos os `specimenKinds` não confirma vasos ghoul. |
| `claim.rc.organelles.unknown` | Formulação limitada “aqui” é adequada à lacuna real. | Não há tamanho ou coordenada anatômica precisa nesse registro; manter a cautela na cena futura. |

## Cinco testes editoriais de aceite

As cinco linhas agrupam as regras automáticas de docs/06; a restrição a scans e a promoção indevida de fonte secundária são cobertas no teste 5. O validador mínimo existente cobre apenas parte dessas regras. Não há execução de UI nesta fase.

| Teste | Critério objetivo | Diagnóstico G0 |
|---|---|---|
| E1 — fonte oficial rastreável | Cada `official` deve ter fonte direta, título, URL, data, locator e resumo que sustentem exatamente o texto e escopo. Caso de falha: citação com `verifiedAt: null`. | **Não atendido integralmente pelo seed**, embora os dois claims oficiais básicos tenham sido conferidos na web nesta auditoria. Validador não rejeita data/locator ausentes. |
| E2 — mangá pendente | Cada `manga_needs_verification` exige `verificationTodo` concreto; nunca recebe OFICIAL. | Não há esse tipo no seed; exigir para os candidatos 09–17. O Python verifica TODO, mas não selo renderizado. |
| E3 — reconstrução pública | `inference` e `hypothetical_model` exigem disclaimer não vazio exibido em tooltip, detalhe, isolamento e microcena. | Claim hipotética do seed tem disclaimer. Exibição ainda **não demonstrada**; não existe interface para testar nesta auditoria. |
| E4 — desconhecido sem precisão falsa | `unknown` não gera dimensão RC física, organelas nomeadas ou coordenadas médicas precisas; cada transição preserva o aviso. | Seed compatível com a lacuna; R2 propõe escala que precisa ser rejeitada. O Python não valida esse comportamento. |
| E5 — integridade de origem e direitos | Fonte secundária não vira `official` sem leitura primária; não publicar scans completos nem reproduzir assets proprietários. Fixture editorial com R1 sozinho deve continuar pendente. | Relatórios preservados como secundários; fontes usadas com resumos. Nenhum scan foi incorporado. Fiscalização do build e das telas é futura. |

## Respostas às cinco perguntas de docs/06

1. **Números do HUD:** ainda não existe HUD auditável. Presets de docs/04 e a escala proposta em R2 poderiam sugerir cânone. Presets terão rótulo SIMULAÇÃO; nenhuma medida física RC será mostrada sem suporte.
2. **Órgão ghoul com nome não documentado:** não há subórgão oficial novo no seed. Câmaras/lóbulos/vasos são reconstrução; não devem ganhar nome anatômico oficial na UI.
3. **Coordenada absoluta do kakuhou:** não há coordenada médica no seed. Bookmark é composição de câmera. `documented_region` significa região, e o mesh interno deverá continuar marcado `approximate` na apresentação.
4. **RC circulation:** tratar como visualização didática inferida; não apresentar histologia confirmada, via dedicada mapeada nem equivalência com circuito humano.
5. **Filtro de cânone e teclado:** comportamento ainda não demonstrado. Aceite futuro: filtro altera legendas/fontes da seleção por claim, conserva rótulo do modelo e pode ser acionado por teclado sem depender de hotspots 3D.

## Arquivos realmente lidos para esta auditoria editorial

- `docs/06_CANON_AND_DATA_RULES.md` — integral.
- `docs/SOURCE_REFERENCES.md` — integral.
- `docs/04_SIMULATION_SPEC.md` — integral.
- `contracts/seed-catalog.json` — integral, cinco claims, quatro citações, quatro nós de anatomia.
- `contracts/atlas-schema.ts` — integral; contrato real localizado após tentativa de um nome inexistente.
- `tools/validate_catalog.py` — integral; diagnóstico de cobertura por leitura do código, sem reivindicar execução própria.
- `research/README_ADICIONE_SEUS_ARQUIVOS.md` — integral no inventário inicial; ausente no estado posterior à inclusão dos relatórios.
- `research/Anatomia e fisiologia dos ghouls em Tokyo Ghoul.md` — integral, l1–876; saídas longas truncadas foram complementadas por releitura das faixas intermediárias.
- `research/Atlas Anatômico Interativo de Tokyo Ghoul.md` — leitura direta dos trechos l391–415 e l699–732 nesta auditoria editorial; integral consolidado pelo responsável pela auditoria geral.

`contracts/catalog.schema.json` foi tentado e **não existe**; não é arquivo lido. O contrato localizado é `contracts/atlas-schema.ts`. A lista acima registra leitura direta desta contribuição, sem atribuir a ela a leitura de todos os arquivos do G0.

## Bloqueios e saída para G1

- Antes de usar dados RC, estágios nomeados, pathways e perfis híbridos como cânone, falta leitura legítima dos capítulos com registro de edição/locator. G1 pode avançar com o núcleo qualitativo S1–S5 e manter os demais candidatos como pendentes.
- A geometria do kakuhou, da célula RC e da circulação RC continua conceitual. Um proxy rotulado permite testar interação; não satisfaz o gate de anatomia cinematográfica final.
- Migração de `Citation`/`Claim` deve modelar confiança, escopo da fonte e verificação por proposição sem transformar data de acesso a metadados em data de validação de painel.
- Critério de saída editorial de G1: cinco claims seed com proveniência preservada, dois claims oficiais com validação precisa migrada, disclaimers visíveis e ausência de medidas RC físicas inventadas. Os nove candidatos de mangá permanecem documentados como pendentes; caso algum seja importado no runtime, não recebe selo OFICIAL. Não é requisito expor nove módulos/claims adicionais na primeira tela. Implementação e testes ficam em G1; G0 termina na auditoria.
