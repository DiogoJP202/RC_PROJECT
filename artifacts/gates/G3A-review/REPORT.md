# G3A — Revisão crítica da experiência visual

24/10/2026, America/Sao_Paulo. Revisão do G3A existente, sem alterar motor, representação ou interface. Base Git: `main`, `84e6e1f36b8558d225ae4baf82a8f79ddb35c124`, com implementação local ainda sem commit. Nenhuma publicação/deploy ou início de G2B/G3B/G4.

**Parecer:** o protótipo demonstra crescimento volumétrico, curvatura, reversibilidade e uma silhueta funcional. O aceite técnico permanece válido; a aparência ainda pede refinamento antes da aprovação visual do checkpoint, sobretudo na implantação lombar, distinção das fases iniciais e ocupação do visor móvel. Esta revisão identifica ajustes; não os implementa nem presume aprovação humana.

## Método e alcance

Lidos integralmente os documentos de aceite, design e contrato futuro G3A; inspecionados sampler, clock, adaptador, integração espacial, câmera, controles, shaders/materiais e testes. Foi feita também uma segunda avaliação independente das imagens principais. Inventário verificável em [INVENTORY.md](INVENTORY.md).

Foram geradas **42 capturas novas da aplicação real**, sete composições e um vídeo de reprodução real. As composições só recortam, reduzem e organizam pixels das capturas, com legendas; não há imagem generativa, render Blender ou referência externa apresentada como implementação. Os originais completos continuam disponíveis. Configuração: quatro apêndices, seed17, partículas ligadas, qualidade padrão, filtro de evidência desligado e corpo selecionado com opacidade **1,00**, para não mascarar o encaixe com translucidez. As poses desktop usam a mesma câmera posterior fixa, 1440×900/DPR1, e movimento reduzido para amostra estática. Posterior aqui é a vista oblíqua real do controle, não uma projeção ortográfica estrita.

Mobile: Chromium emulado, 390×844/DPR1, toque e movimento habilitado. [mobile-playing.png](mobile-playing.png) registra `playing=true` na fase growth, com tempo real entre `.522217` e `.524983` durante a captura. A UI exibe `.518` porque sua leitura é atualizada a 4 Hz; o renderer acompanha o clock por frame. Não se inventou um tempo exato para um screenshot obtido durante movimento.

O [vídeo](playback.webm) registra um ciclo real `0→1`, com comandos reset/play pela UI. Os 70 registros de acompanhamento cobrem as sete fases; conclusão observada em 18.182 ms desde o comando, além do overhead de gravação/fechamento. Os estados manuais e o vídeo são provas distintas. [Metadados](captures.json) registram câmera, configuração, conexão, fase, pose e hashes por captura.

## Avaliação dos pontos solicitados

| Ponto | Evidência observada | Avaliação |
|---|---|---|
| Continuidade do crescimento | [Oito frames](02-growth-sequence.png), `.350/.400/.450/.500/.550/.600/.650/.700` | Volume, comprimento e curvatura evoluem; a ponta muda de orientação e se desdobra. Não é apenas escala de um cilindro. O trecho intermediário concentra grande parte da mudança visível. `.700` já pertence à fixação, conforme contrato. |
| Transições das sete fases | [Sete poses](01-seven-phases.png) e [seis pares de fronteira](05-phase-transitions.png), limite ±.001 | Não se detectou corte de silhueta nos pares amostrados. Repouso, ativação e liberação são pouco distinguíveis geometricamente; dependem de brilho/volume local e rótulos. Fixação e ativo também têm silhuetas muito próximas. Continuidade funciona melhor que a comunicação visual das fases. |
| Deformação das raízes | [Três detalhes lombares](06-root-details.png) e [lateral opaca](views/active-lateral.png) | Centros permanecem ancorados, mas bases espessas se atravessam e deixam contornos de peças separadas. O remendo rosa aparece entre elas; a pele não participa da emergência. É o maior problema visual atual. |
| Interseções grosseiras com o corpo | Corpo opaco em todas as vistas principais; lateral e foco lombar | Há sobreposição evidente das quatro bases e interpenetração visual na inserção. Nos quadros gerais selecionados não se observou um segmento distal atravessando grosseiramente o tronco/pernas. Isso não certifica ausência de penetrações em todos os tempos, órbitas, seeds ou quantidades; não existe teste/solver de colisão. |
| Estabilidade das curvaturas | Crescimento, pares de limites, posterior/lateral e repetição `.700` | Curvas conservam continuidade espacial nas amostras e profundidade real. Persistem dobras angulosas próximas à raiz e uma composição quase em X; a lateral reúne percursos em um feixe, dificultando distinguir quatro apêndices. Isso é limitação de desenho, não evidência de instabilidade temporal. |
| Retração sem saltos | [Sete poses de retração](04-retraction.png), até `t=1`, vídeo e diagnóstico geométrico | A sequência amostrada diminui extensão/espessura e termina sem apêndices; não foi detectado salto geométrico nos pontos verificados. A fase dura só **0,9 s** de 18 s: aprovação da cadência continua pendente. A leitura é de recolhimento/encolhimento rápido; stills e continuidade numérica não bastam para aprovar naturalidade de movimento. |
| Voltar/avançar na timeline | `.700→.200→.700→.300→.700` | Mesma assinatura, raízes, pontas, câmera e **PNG byte a byte idêntico**, com diferença RGB zero. [Comparativo](07-scrub-revisit.png), [dados](compositions.json). Este percurso foi demonstrado; não é uma prova universal de toda configuração. |
| Legibilidade móvel | [Captura em movimento](mobile-playing.png), documento e viewport com 390 px | Corpo e apêndices cabem, controles/valor da timeline são legíveis, não há overflow horizontal. O espécime ocupa uma faixa pequena da cena de 560 px, com bastante vazio acima; implantação e deformações finas ficam difíceis de julgar. A relação cena/timeline e o uso do espaço precisam melhorar antes de afirmar refinamento móvel final. |

## Materiais e iluminação

O tecido usa `MeshPhysicalMaterial` carmim `#96414e`, cores por vértice e sulcos escuros. Metalness `.015`, specularIntensity `.55`; roughness varia de `.69` a `.58`, clearcoat de `.075` a `.16`, emissiveIntensity de `.04` a `.135`. O resultado tem volume e contraste suficientes nas vistas gerais, sem glow branco dominando a geometria. De perto, pregas repetidas e regiões facetadas ainda denunciam o gerador. Não há texturas anatômicas, subsurface scattering ou materiais finais de artista.

O overlay lombar é uma esfera original ondulada, achatada e independente, material rosa `#a05263`, roughness `.62`, metalness `.025` e emissivo `#a32c45`. Sua contração tem amplitude artística de até 5,5%. A luz local `#db5b72` fica `.19` atrás da conexão, alcance `.65`, intensidade máxima `.065`, e some em econômico. O efeito é localizado, porém o volume rosa já exposto no repouso — o proxy do kakuhou existente — e o overlay posterior se confundem. O conjunto comunica um bulbo/remendo externo, não uma implantação orgânica na pele.

O observatório preserva ambiente `.7`, hemisfério `1.1`, luz principal `3.1` e luz posterior azulada `3.4`, ACES Filmic/exposição `.91`. Existem sombras visíveis do corpo/cena no piso; **não se afirma ausência total de sombras**. As meshes novas G3A não habilitam explicitamente `castShadow`/`receiveShadow`, portanto sua própria ligação de contato/auto-oclusão não deve ser tratada como resolvida pelo shadow map principal. A leitura lombar depende sobretudo de normais e reflexos e pode parecer colada ao corpo. Não houve pós-processamento pesado novo.

Partículas são até 48 icosaedros carmim, transparentes, opacidade `.58`, sem escrita de profundidade. São discretas em escala geral e ganham aparência de fragmentos geométricos no foco próximo. O disclosure informa que não são células RC. Não corrigem a leitura da emergência e não devem encobrir a junção.

## Deformação, curvatura e conexão

Quatro superfícies independentes, cada uma 64 segmentos longitudinais ×16 lados, tampas e normais de superfície por diferenças finitas: 4.168 vértices/8.320 triângulos de tecido no total. Raios-base `.085/.077`, seção elíptica lobulada, afilamento `(1−u²)^.69`, twist/pregas e inflexões intermediárias X `.22`, Y `.16`, Z `.19`. O crescimento percorre a curva e altera a seção, em vez de apenas escalar a malha inteira. Movimento secundário depende do mesmo tempo absoluto/seed e para ao pausar. As tampas têm normais ±Z fixas, uma limitação a conferir em ângulos rasantes.

As raízes locais estão em X `[-.034,.034,-.024,.024]`, Y `[.022,.018,-.023,-.027]`, Z0. Na forma desenvolvida, seus raios são grandes em relação à separação entre centros, explicando a sobreposição que aparece nas imagens. Não há soldagem, blend de superfície, deformação da pele, abertura anatômica ou interseção booleana. A conexão espacial correta não equivale a uma implantação visual convincente.

O adaptador usa o socket real `lumbar` de um lease G2A quando disponível; no proxy, usa o anchor `[0,.976,-.112]` do manifesto transformado pelo node real. Estas capturas usam o **proxy**, não um GLB final. A prova de socket/fixtures está no aceite técnico anterior, não é atribuída a este vídeo. Não existe rig GLB Rinkaku final ou nomes inventados de bones/morphs nesta revisão.

Diagnóstico offline do adaptador existente: 201 amostras finitas, desvio dos centros de raiz zero, repetição `.700` com deslocamento de vértices zero. Nos limites ±`10⁻⁶`, o maior deslocamento foi aproximadamente `1,87×10⁻⁶` unidades de cena; perto de `t=1`, `4,24×10⁻⁹`. [geometry-review.json](geometry-review.json). Esses números indicam continuidade amostral; unidades de cena não são uma escala RC real e não medem qualidade artística, colisões ou naturalidade.

## O que funciona e o que refinar antes do checkpoint visual

Funciona: controle absoluto e reversível, geometria com variação de volume/curva, silhueta clara na posterior, profundidade demonstrada na lateral, contraste carmim/azul e reprodução consistente. A câmera fixa evita mudanças de enquadramento durante scrub. A UI expõe estado, fases e caráter conceitual sem converter animação em cânone.

Prioridades de refinamento para aprovação posterior:

1. **Implantação lombar:** resolver leitura de peças sobrepostas, remendo exposto e mudanças abruptas de contorno junto à pele. Validar em lateral opaca e foco próximo; transparência não pode mascarar a junção.
2. **Leitura das fases:** tornar a liberação perceptível como emergência de forma e dar diferenciação útil à fixação/ativo, mantendo os sete intervalos e o caráter hipotético. Evitar substituir essa leitura por brilho maior.
3. **Mobile:** aproveitar melhor o visor para que crescimento e raiz sejam legíveis enquanto se usa a timeline. Preservar contexto corporal, toque e enquadramento das pontas.
4. **Cadência da retração e desenho das curvas:** revisar a leitura do recolhimento rápido e das dobras proximais. Qualquer mudança de duração/intervalo depende de decisão explícita sobre o contrato; não foi feita aqui.
5. **Acabamento:** reduzir repetição das pregas/facetas e avaliar sombras próprias/contato em medição futura. O perfil econômico atual remove efeitos, mas mantém a tesselação; não é LOD móvel.

Nenhum desses refinamentos foi implementado nesta tarefa. Não há aprovação de anatomia, cânone do processo, arte final ou experiência móvel em aparelho físico. A representação permanece **PROXY / CONCEPTUAL MODEL**, com forma/tempos/materiais/partículas classificados como `hypothetical_model`.

## Verificação e preservação

Nesta revisão: TypeScript, lint, **121 unitários/11 arquivos**, catálogo no build e build passaram. A captura automatizada percorreu as sete fases, vistas, fronteiras, retração, revisita e um ciclo real, sem erro JS/requisição falhada; permanece somente aviso conhecido `THREE.Clock` da dependência. Os **33 E2E completos e os dois perfis de performance** pertencem à validação G3A anterior; não são apresentados como recém-executados aqui. Não foi medido FPS novo nem desempenho de celular físico.

Os 68 arquivos de código/testes/contratos/public/research/package observados e as 58 imagens anteriores mantiveram seus hashes. Artefatos novos ficaram neste diretório; `.gitignore` permite preservá-los, o aceite recebe link da revisão e o log registra a operação. [Verificação final](verify-review.json). Sem alteração de funcionalidades, dependências, ferramentas globais, conteúdo canônico, commit, push ou deploy.
