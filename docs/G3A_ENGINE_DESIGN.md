# G3A — Design do motor de manifestação Rinkaku

24/10/2026, America/Sao_Paulo. Escopo autorizado: motor temporal, representação procedural original e interação no observatório G1/G2A. **G3A não encerra G3 nem constitui aceite anatômico/artístico definitivo.** G2B, G3B, G4, novos tipos de kagune, deploy e publicação no GitHub ficam fora desta execução.

> Estado atual, 25/10/2026: G3A.1 aprovado pelo usuário como entrega **técnica e visual de protótipo P1, com ressalvas**. A descrição de escopo acima preserva a autorização original da implementação. Commit/push do checkpoint foram autorizados posteriormente; publicação efetiva e SHA devem ser comprovados pelo responsável. Deploy e implementação de G2B/G3B/G4 continuam fora do escopo; G4A está apenas planejado. P2 visual/anatômico e arte Blender final permanecem pendentes.

Documento técnico da implementação local. Resultados de testes, métricas e revisão visual ficam no [aceite G3A](G3A_ACCEPTANCE.md), com evidências próprias desta revisão. O [contrato de animação Blender](G3A_BLENDER_ANIMATION_CONTRACT.md) complementa o ingresso [G2A](BLENDER_WEB_INTEGRATION.md), sem substituí-lo.

> Continuidade G3A.1: as seções originais abaixo registram o G3A e sua reprodução linear de 18 s. A seção **G3A.1 — transporte e representação refinados**, ao final, descreve as mudanças atuais, aprovadas no nível P1. O sampler e seus sete intervalos permanecem; o transporte automático passa a 21 s, com 3,4 s de retração. Os resultados e contagens antigos não são novas medições. A aprovação artística/anatômica avançada P2 continua pendente.

## Hipótese e separação de responsabilidades

Uma amostra absoluta da timeline pode descrever a aparência desejada sem conhecer React, Three.js, a cena ou um GLB. O renderer transforma essa amostra em posições de vértices, materiais e efeitos. O mesmo contrato permite uma representação futura de artista sem acoplar o motor aos nomes de bones/morphs de um arquivo inexistente.

O catálogo continua responsável por evidências e identidade anatômica; a engine não cria afirmações biológicas. A timeline controla coordenadas cinematográficas normalizadas. Seus valores não são fator RC, reserva RC, segundos biológicos, força ou taxa de regeneração. Quantidade de **1–4 apêndices** é escolha da demonstração.

| Camada | Responsabilidade | Não deve fazer |
|---|---|---|
| Sampler puro | Validar configuração e calcular snapshot absoluto em `t` | Ler relógio, DOM, estado React ou acumular deslocamentos |
| Relógio imperativo | Integrar direção/tempo de reprodução; pausa e scrub | Decidir anatomia, criar geometrias ou escrever React a cada frame |
| Estado de UI | Comandos discretos e publicação de progresso com baixa frequência | Usar `setState` para cada vértice/frame |
| Adaptador | Aplicar snapshot à representação e gerir recursos de sua propriedade | Alterar catálogo, inferir nomes de GLB ou descartar recursos do cache G2A |
| Observatório | Câmera, seleção, camadas, alternativas HTML e disclosure | Reiniciar G1/G2A ou transformar animação em claim oficial |

## Domínio temporal

Os intervalos de [04_SIMULATION_SPEC](04_SIMULATION_SPEC.md) são mantidos. O começo de cada intervalo pertence à fase nova; `t=1` pertence a `retract` e termina recolhido.

| Fase | Intervalo global | Finalidade visual conceitual |
|---|---|---|
| `rest` | `[0, .08)` | Raiz recolhida, corpo em repouso |
| `activation` | `[.08, .20)` | Sinal local no kakuhou |
| `release` | `[.20, .35)` | Exposição da raiz e emissão visual |
| `growth` | `[.35, .67)` | Alongamento contínuo e mudança de volume |
| `fixation` | `[.67, .85)` | Ajuste de rigidez e material |
| `active` | `[.85, .95)` | Movimento secundário controlado |
| `retract` | `[.95, 1]` | Retorno conceitual ao repouso |

`localPhaseProgress` é a posição normalizada dentro da fase. Interpolação suave torna as saídas contínuas nos limites relevantes; trocar o nome da fase não dispara uma animação residual. Scrub para trás avalia o mesmo estado absoluto; não é um comando separado que força `retract`.

## Snapshot e validação

Contrato público em `src/simulation/rinkaku.ts`: `sampleRinkakuAt(t, config?: unknown)`. `normalizeRinkakuConfig` valida na fronteira de comandos, `createRinkakuSnapshot` fornece armazenamento e `writeRinkakuAt(t, config, output)` escreve no snapshot reutilizável do loop sem alocação. O caminho imperativo mantém equivalência com a função pura; não recebe amostra anterior como entrada.

| Campo | Domínio | Significado |
|---|---|---|
| `t` | `0..1` | Coordenada absoluta de animação |
| `phase` | Enum das sete fases | Rótulo editorial do intervalo |
| `localPhaseProgress` | `0..1` | Progresso dentro do intervalo |
| `rootExposure` | `0..1` | Exposição visual da conexão |
| `kakuhouActivation` | `0..1` | Intensidade da deformação/iluminação local |
| `appendageExtension` | `0..1` | Fração artística do comprimento máximo |
| `appendageThickness` | `0..1` | Controle artístico de espessura |
| `visualStiffness` | `0..1` | Controle visual de curvatura e material |
| `particleEmission` | `0..1` | Intensidade representacional do efeito |
| `appendageMotion` | `0..1` | Amplitude normalizada de movimento secundário |
| `visualIntensity` | `0..1` | Realce local de material |
| `appendageCount` | Inteiro `1..4` | Quantidade da demonstração |
| `seed` | Inteiro `0..4294967295` | Variação reproduzível |
| `particles` | Booleano | Habilitação do efeito |
| `quality` | `standard` ou `low` | Perfil de desenho |
| `motionTime` | `0 ≤ valor < 18 + 2π` | Coordenada artística derivada de `t × 18` e seed; não relógio independente |

Entradas finitas fora de `0..1` sofrem clamp; `NaN`/infinitos retornam `t=0`. Quantidade finita é arredondada e limitada a `1..4`; caso inválida recebe quatro. Seed finito é truncado/limitado ao uint32; caso inválido recebe 17. Partículas aceitam somente booleano (default `true`), qualidade somente `low` ou `standard` (default `standard`). Configuração não objeto/array recebe defaults. O enum de fase nunca deriva de strings externas sem validação. O seed e a quantidade são parâmetros da demonstração reproduzível, não diferenças biológicas estabelecidas.

Invariantes de teste: `.7 → .2 → .7` e `.2 → .7 → .3 → .7` reproduzem `.7`; amostragem não modifica a configuração; todas as saídas numéricas são finitas; reset recupera o mesmo frame inicial. Métodos de reprodução não podem criar uma segunda fonte de estado temporal.

## Representação procedural e integração espacial

As raízes usam a região lombar aproximada do observatório. Quando o lease G2A contém socket lombar real, sua transformação atual fornece o encaixe; a alternativa é o anchor regional existente. Mudança de câmera não move o órgão, e troca de modelo não mantém coordenada de mundo obsoleta. O socket demonstra um ponto de conexão de cena; não autentica ducto, trajeto vascular ou microanatomia.

A representação em `src/scene/rinkaku/ProceduralRinkakuAdapter.ts` tem quatro superfícies pré-alocadas, cada uma com 64 segmentos longitudinais, 16 lados e fechamento das extremidades: 4.168 vértices/8.320 triângulos de tecido no conjunto. Crescimento ao longo de curvas intermediárias em S, variação de profundidade, desenrolamento progressivo das pontas, afilamento, pregas, variação de espessura e movimento secundário são calculados a partir de tempo/seed absolutos. Posição inicial da curva permanece ancorada. Posições e normais atualizam os buffers existentes; quantidade muda visibilidade dentro da capacidade já alocada. Material físico carmim escuro, vertex colors e reflexo contido dão leitura de volume, sem mapas ou recursos de terceiros. O primeiro passe visual motivou mais curvatura intermediária/volume e menor brilho especular; a revisão das capturas é uma prova separada dos testes automatizados.

Partículas usam um `InstancedMesh` com capacidade de 48 formas autorais simples; não representam número, tamanho ou morfologia reais de células RC. `low` elimina a emissão de partículas, conservando a geometria e a amostra temporal. Recursos do adaptador: cinco geometrias, dois materiais e nenhuma textura própria. Todos os proxies mantêm `PROXY / CONCEPTUAL MODEL` e classificação `hypothetical_model` para a aparência.

## Reprodução e controles

Entrar na manifestação suspende o scan demonstrativo, evitando dois relógios com controles ambíguos. Voltar à inspeção recupera sua interação e contexto. Play/pause, direção reversa, passos, scrub, reset e seleção de fase operam a mesma timeline; câmera não é recalculada a cada scrub.

Visões posterior/lateral e foco lombar são comandos de câmera explícitos. Seleção, camadas, isolamento, opacidade e a bancada GLB continuam pertencendo ao observatório. `src/state/rinkaku.ts` integra transporte no relógio mutável; duração artística completa de 18 s. `reset` zera `t`, pausa e restaura direção +1, preservando configuração e modo habilitado. Reverso muda a direção na pose atual; não força a fase `retract`. Scrub/seleção de fase/step pausam. Seleção de fase usa ponto médio; passos avançam/recuam `.02`.

`prefers-reduced-motion` mantém inspeção estática por passos e scrub; iniciar reprodução é recusado. Página oculta, saída do modo Body, falha ou indisponibilidade de cena pausam e exigem retomada explícita; preservam a pose. Mouse, teclado e toque usam controles HTML equivalentes. Sem WebGL, os controles textuais e evidências continuam disponíveis com erro explícito.

## Propriedade e futuro GLB

`ProceduralRinkakuAdapter` possui `group`, `apply(snapshot, connection)`, `getBounds(output)`, `inspect()` e `dispose()`. Possui seus buffers, materiais e recursos do efeito e os libera idempotentemente na troca/desmontagem. `inspect()` expõe assinatura/positionHash, raízes/pontas, contagens e UUIDs para QA; não é estado científico nem estimativa de VRAM. Não libera geometrias/texturas compartilhadas pelo lease G2A. O futuro `GLBRinkakuAdapter` precisa de mapeamento explícito por revisão; a existência da interface não significa que haja asset, bones, morphs ou clips finais implementados.

Ver [G3A_BLENDER_ANIMATION_CONTRACT](G3A_BLENDER_ANIMATION_CONTRACT.md) para espaço, canal temporal, aplicação absoluta, ownership, manifest e testes de ingresso. Não inferir integração artística final a partir das fixtures sintéticas G2A.

## Evidência e qualidade

| Aspecto | Classificação nesta etapa | Evidência exigida |
|---|---|---|
| Motor de simulação visual | Técnico, determinístico | Unitários e snapshots reproduzíveis |
| Interação | Observatório preservado | E2E play/scrub/câmera/seleção/falhas |
| Representação procedural | Original e conceitual | Capturas reais e sequência de frames |
| Qualidade artística | Protótipo sujeito a revisão | Inspeção visual das capturas, sem autoaprovação por teste |
| Fidelidade anatômica | Não aprovada | Arte/rig e revisão humana futuros |

Os fatos textuais já auditados permanecem no catálogo com suas classes. A representação, crescimento, fixação, pulsações, materiais, partículas e cronologia são `hypothetical_model`; aspectos não estabelecidos continuam `unknown` ou pendentes conforme o catálogo. Nenhuma claim foi promovida a `official` por implementação da animação.

## Protocolo de verificação

TypeScript, lint, unitários, Python, catálogo, build e E2E completos. Dez ciclos automáticos completos de 18 s, após aquecimento, devem verificar recursos observáveis sem crescimento contínuo. O teste usa reset/play reais pela UI, duração original e polling moderado; não injeta avanço sintético ou scrub durante a reprodução. Uma prova separada percorre dez ciclos manuais por todos os limites de fase, repete `.90` e desmonta/remonta três vezes. Essas verificações não certificam VRAM nem ausência universal de vazamento. Verificar troca de quantidade/qualidade/representação, descarte, seleção/câmera, movimento reduzido, aba oculta e fallback.

Capturas da aplicação: `G3A-rest.png` em `.04`, `G3A-activation.png` em `.14`, `G3A-growth.png` em `.53`, `G3A-active.png` em `.90`, `G3A-retract.png` em `.98` e `G3A-mobile.png`. Configuração de referência: quatro apêndices, seed 17; estado de partículas/qualidade e câmera devem acompanhar a evidência. A sequência reproduzível `artifacts/g3a/sequence/growth-t*.png` cobre oito quadros de `.35` a `.70`; metadados ficam em `visual-captures.json`. `ten-cycles.json` distingue scrub de playback; `ten-playback-cycles.json` registra os dez ciclos automáticos e seus tempos observados.

Medição própria G3A no build de produção: hardware/browser/GPU/DPR, transferência fria, tempo até interação, 10 s de aquecimento e 30 s de amostra, FPS p50/p10, draws, geometria/texturas e erros observáveis. Não reapresentar perfis G2A como dados novos; viewport móvel emulado valida layout e não FPS de celular físico. Resultados concretos e limitações ficam no aceite/log.

## G3A.1 — transporte e representação refinados

Refinamento autorizado após o [parecer visual G3A](../artifacts/gates/G3A-review/REPORT.md) e aprovado técnica/visualmente pelo usuário em 25/10/2026 como protótipo P1 com ressalvas. Não reimplementa o sampler nem inicia G2B/G3B/G4. O protocolo e os resultados novos de capturas, suítes e benchmarks estão em [G3A1_REFINEMENT](G3A1_REFINEMENT.md). A aprovação humana se refere ao pacote entregue; leitura de código ou testes isolados não constituem aprovação artística P2.

### Segundos de reprodução separados da pose

`src/simulation/rinkakuPlayback.ts` define o mapa absoluto `playbackTimeAt(t)` e sua inversa `rinkakuTAtPlaybackTime(seconds)`. A duração cinematográfica completa é 21 s. Até `.93`, o mapa conserva a cadência antiga de 18 segundos por unidade de `t`; entre `.93` e `.95`, sua densidade cresce suavemente de 18 para 68 segundos por unidade. O intervalo `.95..1` passa a durar 3,4 s. A integral de smoothstep mantém derivadas contínuas nas duas fronteiras, sem pausa ou salto ao entrar na retração. Valores finitos são limitados ao domínio; inválidos retornam ao repouso.

O relógio imperativo possui `elapsedSeconds`, além de `t` e do snapshot. Cada tick integra segundos com direção `+1/-1` e usa o mapa inverso para recuperar a coordenada normalizada. Scrub, passos, seleção de fase, reset e retomada recalculam o tempo correspondente à pose atual. O sampler permanece independente desse relógio: `motionTime` continua calculado com `t × 18` e seed, e todos os canais continuam funções da mesma amostra absoluta. Assim, estender a cadência da retração não muda o desenho de uma pose manual nem introduz movimento secundário dependente do histórico.

O renderer continua limitando o delta de frame para evitar avanços grandes após uma interrupção; os 21 s são a duração nominal de transporte com frames regulares. Tempos observados pela UI incluem polling, agendamento e eventuais frames lentos. O teste de dez ciclos reais deve registrar esses tempos, sem substituir a reprodução por scrub ou avanço sintético.

### Implantação original no adaptador

O overlay luminoso lombar do primeiro G3A foi removido. As superfícies do adaptador incorporam uma região proximal de contato, elevação localizada e pescoço estreito antes do tecido distal, usando os mesmos buffers indexados. O layout de implantação varia com a quantidade escolhida de 1–4 apêndices, mantendo a transformação de conexão separada do desenho local. Ativação eleva o relevo; liberação apresenta uma extrusão inicial; crescimento percorre as curvas; fixação desenvolve cordões e altera gradualmente a tensão da forma. Não há gatilho que substitui a geometria inteira na fronteira de fase.

A aproximação de contato foi desenhada para o proxy corporal atual. Ela não é aderência automática a qualquer superfície GLB, deformação da pele, abertura anatômica ou solver de colisão. A paleta próxima ao contato acompanha a leitura visual do proxy; não deve ser tratada como material final do corpo. Avaliação nas vistas posterior, lateral e oblíqua, corpo opaco e 1–4 apêndices é necessária para julgar o resultado. Normais finitas, ausência de NaN e hashes reproduzíveis não garantem naturalidade ou ausência universal de interseções.

### Apresentação do órgão e câmeras

`AssetSlot.tsx` e `IntegratedAssets.tsx` acrescentam a condição de manifestação à visibilidade das meshes já vinculadas a `ghoul.kakuhou.rinkaku`. A substituição é de apresentação: não remove o node do proxy ativo, não muda o anchor, não reescreve bindings e não libera o lease G2A. Ao sair, as regras de camada e isolamento do observatório voltam a determinar sua visibilidade. A seleção HTML mantém a identidade anatômica. O socket `lumbar` continua sendo a fonte de conexão quando existe no lease; no proxy, permanece o anchor do manifesto aplicado à transformação do node.

Uma vista oblíqua explícita complementa posterior/lateral/foco lombar. O ajuste móvel usa um enquadramento fixo mais próximo e redistribuição do visor/controles. O tamanho do espécime não é recalculado a cada scrub e a câmera não segue automaticamente cada ponta. Órbita manual e movimento reduzido preservam seus comandos. As poses efetivamente enquadradas devem ser demonstradas nos dois viewports móveis; a descrição do algoritmo não basta para afirmar ausência de clipping.

### Evidência nova e limites

Testes de mapa/estado cobrem inversão, monotonicidade, velocidade nos limites, partição de frames, scrub, pausa e reverso. `tests/e2e/g3a1-refinement.spec.ts` acrescenta sete fases ×1–4 apêndices, implantação nas três vistas, sequências, restauração proxy/fixtures e mobile 390×844/430×932. Os testes G1/G2A/G3A continuam exigidos. Resultados novos ficam em `artifacts/g3a1/`, capturas em `artifacts/gates/G3A1-review/`; o pacote G3A anterior permanece histórico.

O contrato futuro GLB continua explícito e o adaptador final indisponível. Geometria de contato, limites de câmera e nomes internos do proxy não viram requisitos anatômicos do artista. Forma, fases, materiais, parâmetros e segundos continuam `hypothetical_model`, com disclosure permanente **PROXY / CONCEPTUAL MODEL**. O aceite P1 concedido pelo usuário não substitui a aprovação artística/anatômica P2.

### Aceite P1 e limite P2

P1 registra interação e apresentação refinadas do protótipo: transporte reversível, fases geométricas, conexões estáveis, controles e demonstração visual. As bases ainda podem lembrar conectores; a pele do corpo e as superfícies emergentes permanecem separadas, e facetas/bordas são perceptíveis no close-up. Essas ressalvas foram aceitas no P1 e continuam pendências da arte/revisão Blender.

P2 exige a entrega artística concreta com junção lombar integrada, continuidade visual pele/tecido, materiais e topologia próprios, envelope validado e revisão humana. Os requisitos verificáveis estão em [G3A_BLENDER_ANIMATION_CONTRACT](G3A_BLENDER_ANIMATION_CONTRACT.md), incluindo scrub arbitrário, retração completa até `t=1` e preservação de bindings/sockets. Nenhuma aprovação de cânone, anatomia final ou G3 completo decorre do aceite do procedural.

A conferência complementar da retração até `t=1` foi executada e motivou a correção funcional abaixo. A autorização de commit/push consolida o protótipo P1 já aprovado, com P2/Blender pendentes; G4A permanece somente planejado. Verificação completa do build final e procedimento de publicação ficam no [G3A_CHECKPOINT](G3A_CHECKPOINT.md), sem antecipar SHA ou resultado de uma suíte ainda não concluída.

### Correção terminal e picking no checkpoint

Perto do repouso, o adaptador deriva `formation` suavemente dos canais de ativação, exposição e extensão. A extensão XY de toda a superfície é reduzida por `formation²` e a altura relativa ao contato por `formation`, incluindo caps e pontas de diagnóstico, antes da ocultação final. Recolher somente Z deixava discos visíveis através da pele translúcida; recolher também o footprint elimina esse resíduo nos casos testados. A margem enterrada é específica do proxy e não constitui anatomia ou contato universal de GLB.

Essa correção preservou hashes das seis poses `.14/.275/.53/.76/.90/.98`, sampler, layout, materiais, transporte de 21 s/retração de 3,4 s e recursos. Os 14 testes do adaptador passaram, com regressão vermelha antes da correção. Quatro E2E dirigidos passaram em 39,3 s com opacidade 1/0,2, 1–4 apêndices, foco e lateral; `.999` e `1` coincidiram com repouso nas comparações PNG, zero partículas visíveis e retorno a 13 geometrias/3 texturas ao sair. A [evidência específica](../artifacts/gates/G3A1-review/checkpoint/README.md) permanece separada dos pacotes anteriores.

`src/scene/visibility.ts` centraliza a verificação de visibilidade de todos os ancestrais, também usada pelos handlers reais de clique. Isso impede que filhos prealocados ainda marcados visíveis sob um pai oculto interceptem seleção através do corpo transparente. O teste de picking real passou, preservando as identidades/bindings e sockets existentes. O resultado da suíte completa posterior é registrado somente no [checkpoint](G3A_CHECKPOINT.md).
