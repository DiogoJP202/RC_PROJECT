# UI-R5 — Identidade, vitrine e revisão artística

A entrega parte de `0c0916b5605230360dd7456ad45ba1b8bf7940ec`. A direção aprovada em [UI_R5_PROPOSAL](UI_R5_PROPOSAL.md) orientou a implementação. A revisão anterior, as fontes e os resultados de UI-R1 a UI-R4 seguem no histórico. A UI-R5 foi aprovada pelo usuário e integrada à `main` pelo [PR #3](https://github.com/DiogoJP202/RC_PROJECT/pull/3), merge `7085f1c2f6237724baad4f73d1d1f6f7a8aa5204`. O [checkpoint](UI_REDESIGN_CHECKPOINT.md) registra o encerramento do redesign.

## Marca e abertura

**Limiar** usa duas pálpebras assimétricas, uma pupila carmim deslocada e dois cantos abertos de enquadramento. **Incisão** usa pálpebras separadas e pupila em fenda. Escolhi Limiar pela leitura frontal como olho, pela melhor separação dos traços em 32 px e por reservar o vermelho para a pupila. A arte conceitual mencionada no pedido não estava disponível entre os arquivos acessíveis desta execução. Usei a descrição do briefing e o glossário já registrado na proposta.

A assinatura horizontal é um SVG autônomo. O cabeçalho usa o mesmo vetor com texto HTML. A versão monocromática é destinada a fundos claros. A redução para 16/32 px simplifica a silhueta, aproxima a pupila e usa um canto. As exportações de 180/512 px usam o símbolo completo com margem. As cores forçadas conservam o nome visível e a indicação de foco. [Prancha e comparativo](../artifacts/gates/UI-R5-concepts.png) · [Limiar](../artifacts/gates/UI-R5-eye-limiar.svg) · [Incisão](../artifacts/gates/UI-R5-eye-incisao.svg) · [recursos finais](../public/assets/ui-r5/).

A proposta A usa a silhueta do espécime no mesmo campo escuro da tipografia. A proposta B abre com o título sobre um corte lombar em faixa. A foi adotada porque o apêndice e a postura orientam o olhar para o espécime sem dividir a abertura em caixas. A versão móvel usa outro enquadramento do mesmo modelo. A filiação independente e o aviso “Modelo conceitual” ficam em HTML. O pôster foi produzido no próprio renderer, com a luz e a câmera ajustadas na sessão da captura.

## Sistema visual

| Papel | Aplicação |
|---|---|
| IBM Plex Sans Condensed Semibold | Marca escrita e títulos. A Home usa quebras definidas pela composição e pela largura. |
| IBM Plex Sans | Texto, descrições e controles. Identificadores e tempos usam Plex Mono. |
| Grafite `#100D11` / superfícies `#1A151B`, `#241D25` | Fundo comum e degraus dos painéis. As divisórias delimitam grupos reais. |
| Marfim `#F0EBE4` / secundário `#B7AEB6` | Títulos, texto e legendas. |
| Carmim `#E47784` / `#762735` | Pupila, manifestação e ações primárias. |
| Clínico `#A6C8C2` / aviso `#DAB47C` | Foco e seleção. Avisos conceituais mantêm texto explícito. |

A Home e Estudos compartilham os dados de cada experiência. A primeira dá peso à anatomia e intercala planos da raiz Rinkaku e do vaso. Estudos usa linhas editoriais com imagens alternadas e uma entrada direta por estudo. Fontes agrupa a classificação e a bibliografia, com atalho para as referências e histórico em expansão. Corpo, Rinkaku e Micro mantêm controles de cena e ferramentas sob demanda. Comparar e inspeção celular explicam a indisponibilidade e oferecem retorno funcional. A visita direta a Comparar começa sem canvas. Ao chegar da bancada, o observatório existente fica inerte e conserva o contexto até o retorno.

## Parecer crítico

A luz lateral separa o manequim dos apêndices. A raiz fica identificável mesmo com parte do tronco em sombra. O pôster ao lado da tipografia tem maior contraste de silhueta que a antiga moldura. As juntas segmentadas, o pedestal circular e a sombra dura ainda remetem a uma bancada de protótipo. Na microimagem, a cor distingue a célula acompanhada. A leitura de anatomia fina ainda depende da ficha e da cena interativa.

O contraste entre o campo carmim da vitrine e a luz mais fria da bancada é intencional. A primeira usa luz editorial. A segunda mantém a leitura de seleção, camadas e rastreio do produto. O cabeçalho e os controles usam a mesma escala tipográfica e de cores. A densidade cresce com a ficha ou os parâmetros em uso. Telas estreitas mantêm a folha rolável e agrupam ação principal e timeline no entorno do palco.

A obra inspira o kakugan e a relação visual entre organismo e apêndice. As imagens públicas têm geração própria e procedência declarada. O acabamento demonstrado é o do protótipo conceitual. Juntas, implantação dos apêndices, material do tecido e leitura vascular precisam de uma futura revisão com os modelos definitivos licenciados. A revisão atual usa desktop e emulação mobile Chromium. Testes em telefone físico, Safari/iOS e leitor de tela permanecem pendentes.

Os metadados usam a URL absoluta do domínio canônico para os crawlers sociais. O arquivo do cartão e suas dimensões são verificáveis no build local e no preview. A URL canônica da nova imagem passa a responder quando este conteúdo entrar em produção. [Cartão 1200 × 630](../public/assets/ui-r5/share.jpg) · [Proveniência e licenças](../public/ASSET_LICENSES.md#ui-r5--marca-e-capturas-editoriais).

## Capturas de produção

As capturas reproduzem três larguras em Chromium. Cada imagem de ferramenta mostra a interação aberta a partir do modo correspondente. A série usa movimento reduzido para manter os quadros estáveis. Os grupos abaixo também preservam os originais UI-R4 para comparação.

| Vista | Desktop 1440 × 900 | Mobile 390 × 844 | Mobile 430 × 932 |
|---|---|---|---|
| Home UI-R4 | [Antes](../artifacts/gates/UI-R4-review-home-desktop.png) | [Antes](../artifacts/gates/UI-R4-review-home-390.png) | [Antes](../artifacts/gates/UI-R4-review-home-430.png) |
| Home UI-R5 | [Depois](../artifacts/gates/UI-R5-home-desktop.png) | [Depois](../artifacts/gates/UI-R5-home-390.png) | [Depois](../artifacts/gates/UI-R5-home-430.png) |
| Home completa | [Completa](../artifacts/gates/UI-R5-home-integral-desktop.png) | [Completa](../artifacts/gates/UI-R5-home-integral-390.png) | [Completa](../artifacts/gates/UI-R5-home-integral-430.png) |
| Estudos | [Desktop](../artifacts/gates/UI-R5-estudos-desktop.png) | [390](../artifacts/gates/UI-R5-estudos-390.png) | [430](../artifacts/gates/UI-R5-estudos-430.png) |
| Fontes | [Desktop](../artifacts/gates/UI-R5-fontes-desktop.png) | [390](../artifacts/gates/UI-R5-fontes-390.png) | [430](../artifacts/gates/UI-R5-fontes-430.png) |
| Corpo | [Desktop](../artifacts/gates/UI-R5-corpo-desktop.png) | [390](../artifacts/gates/UI-R5-corpo-390.png) | [430](../artifacts/gates/UI-R5-corpo-430.png) |
| Camadas | [Desktop](../artifacts/gates/UI-R5-camadas-desktop.png) | [390](../artifacts/gates/UI-R5-camadas-390.png) | [430](../artifacts/gates/UI-R5-camadas-430.png) |
| Ficha anatômica | [Desktop](../artifacts/gates/UI-R5-ficha-desktop.png) | [390](../artifacts/gates/UI-R5-ficha-390.png) | [430](../artifacts/gates/UI-R5-ficha-430.png) |
| Rinkaku | [Desktop](../artifacts/gates/UI-R5-rinkaku-desktop.png) | [390](../artifacts/gates/UI-R5-rinkaku-390.png) | [430](../artifacts/gates/UI-R5-rinkaku-430.png) |
| Simulação | [Desktop](../artifacts/gates/UI-R5-simulacao-desktop.png) | [390](../artifacts/gates/UI-R5-simulacao-390.png) | [430](../artifacts/gates/UI-R5-simulacao-430.png) |
| Micro em tracking | [Desktop](../artifacts/gates/UI-R5-micro-desktop.png) | [390](../artifacts/gates/UI-R5-micro-390.png) | [430](../artifacts/gates/UI-R5-micro-430.png) |
| Células e fluxo | [Desktop](../artifacts/gates/UI-R5-micro-controles-desktop.png) | [390](../artifacts/gates/UI-R5-micro-controles-390.png) | [430](../artifacts/gates/UI-R5-micro-controles-430.png) |
| Ficha vascular | [Desktop](../artifacts/gates/UI-R5-micro-ficha-desktop.png) | [390](../artifacts/gates/UI-R5-micro-ficha-390.png) | [430](../artifacts/gates/UI-R5-micro-ficha-430.png) |
| Comparar indisponível | [Desktop](../artifacts/gates/UI-R5-comparar-desktop.png) | [390](../artifacts/gates/UI-R5-comparar-390.png) | [430](../artifacts/gates/UI-R5-comparar-430.png) |
| Inspeção celular indisponível | [Desktop](../artifacts/gates/UI-R5-celular-desktop.png) | [390](../artifacts/gates/UI-R5-celular-390.png) | [430](../artifacts/gates/UI-R5-celular-430.png) |
| Fallback WebGL | [Desktop](../artifacts/gates/UI-R5-fallback-desktop.png) | [390](../artifacts/gates/UI-R5-fallback-390.png) | [430](../artifacts/gates/UI-R5-fallback-430.png) |
| Catálogo indisponível | [Desktop](../artifacts/gates/UI-R5-erro-catalogo-desktop.png) | [390](../artifacts/gates/UI-R5-erro-catalogo-390.png) | [430](../artifacts/gates/UI-R5-erro-catalogo-430.png) |
| Ajuda | [Desktop](../artifacts/gates/UI-R5-ajuda-desktop.png) | [390](../artifacts/gates/UI-R5-ajuda-390.png) | [430](../artifacts/gates/UI-R5-ajuda-430.png) |

[Home antes e depois em uma prancha](../artifacts/gates/UI-R5-home-comparativo.png) · [Referências e histórico](../artifacts/gates/UI-R5-referencias-desktop.png).

## Leitura e verificação

A execução consultou `AGENTS.md`, os dez arquivos de `ghoul_atlas_ui_redesign/` (00 a 09), [a proposta](UI_R5_PROPOSAL.md), [a revisão de integração](UI_R4_INTEGRATION_REVIEW.md) e os registros de [UI-R1](UI_R1_ACCEPTANCE.md), [UI-R2](UI_R2_ACCEPTANCE.md), [UI-R3](UI_R3_ACCEPTANCE.md) e [UI-R4](UI_R4_ACCEPTANCE.md).

### Vitrine e acessibilidade

| Viewport | Transferência da Home | Contextos WebGL | Pôster carregado |
|---|---:|---:|---|
| 1440 × 900 | 201.291 B (196,6 KiB) | 0 | Horizontal |
| 390 × 844 | 199.969 B (195,3 KiB) | 0 | Vertical |
| 430 × 932 | 199.969 B (195,3 KiB) | 0 | Vertical |

A medição usa um contexto novo por largura e inclui as três imagens dos estudos decodificadas. A Home não pediu o catálogo, GLB ou renderer. O CTA apareceu no primeiro viewport. Favicon SVG, ícones PNG e cartão JPEG responderam com o tipo correto. A inspeção comparou a resposta inicial, o recorte responsivo e a ficha visual. [Relatório de navegação e capturas](../artifacts/gates/UI-R5-visual-review.json).

A primeira auditoria detectou um salto de `h1` para `h3` em Estudos. O índice reutilizado agora usa `h2` em Estudos e `h3` sob a seção correspondente na Home. A auditoria final com axe-core 4.11.0 encontrou **zero violações** e zero overflow horizontal em **54 estados**. Ela mantém 68 resultados inconclusivos de contraste para revisão, concentrados em glifos, pseudo-elementos, sobreposições e áreas roláveis. A inspeção visual cobriu os avisos, a leitura das fichas, o fallback e a Ajuda nas três larguras. A auditoria utiliza as mesmas tags WCAG e de boas práticas da UI-R4. [Resultados por estado](../artifacts/gates/UI-R5-accessibility.json).

Para reproduzir, sirva `npm.cmd run preview -- --port 4173` após o build. Execute `node tools/review_ui_r5.mjs` para as capturas e a medição da Home. O axe usa `node tests/e2e/ui-r4-audit.mjs --axe=/caminho/axe.min.js --output=artifacts/local/ui-r5/accessibility.json`. O bundle axe-core é uma ferramenta de QA fora do build. Os perfis usam a mesma estação, viewports e limites da [UI-R4](UI_R4_ACCEPTANCE.md).

### Perfis de produção

| Perfil | FPS p50 | FPS p10 | Draw calls máximas | Transferência combinada | UI-R4 |
|---|---:|---:|---:|---:|---:|
| Corpo, desktop | 59,88 | 59,17 | 23 | 474.263 B | 475.021 B |
| Rinkaku, desktop | 59,88 | 59,17 | 22 | 480.577 B | 481.300 B |
| Fluxo, 500 entidades, desktop | 59,88 | 59,17 | 3 | 495.187 B | 495.907 B |
| Tracking, 2.000 entidades, desktop | 59,88 | 59,17 | 4 | 495.187 B | 495.907 B |
| Rinkaku, mobile emulado | 59,88 | 59,52 | 22 | 480.577 B | 481.300 B |
| Tracking, 500 entidades, mobile emulado | 59,88 | 59,52 | 4 | 495.187 B | 495.907 B |

Foram executados sequencialmente no Chrome 157.0.8103.80 e Iris Xe, com cache HTTP desligado, rede CDP de 20 Mbps e latência configurada de 50 ms. Cada cenário trouxe 10 s de aquecimento e 1.800 intervalos rAF em cerca de 30 s. Os seis perfis passaram nos orçamentos originais. Todos registraram zero erros JavaScript, requisições falhas ou erros HTTP. O aviso de depreciação de `THREE.Clock` já existia na dependência. Contadores de renderer e rAF não medem memória ou tempo de GPU. [Perfis, valores e hashes de build](../artifacts/gates/UI-R5-performance.json).

### Regressões investigadas

A primeira suíte completa aprovou 87 de 88 testes em 13,8 min. O teste de Estudos ainda buscava os nomes antigos dos links depois da mudança da vitrine. O trace mostrou que os destinos existiam sob as novas ações. Foram atualizados os seletores por função e nome acessível. Permaneceram as verificações de destino, entrada com a simulação pausada e retorno a Estudos. A rechecagem focada passou e o trace inicial foi guardado na área local de QA.

A revisão das capturas localizou uma faixa do fundo anterior na rota de inspeção celular indisponível. O contêiner editorial passou a ocupar toda a altura visível, e o título de erro do catálogo adotou a tipografia da identidade. As 52 capturas, os 54 estados automatizados e os seis perfis foram produzidos novamente nesse build.

### Escopo preservado

A comparação com `0c0916b` confirma que `src/scene`, `src/simulation`, `src/state`, `src/visuals`, `src/content`, `contracts`, catálogo, fixtures GLB e dependências mantêm o mesmo conteúdo. As evidências históricas permanecem no Git. Fichas e referências continuam lendo as classes de evidência do mesmo catálogo. Comparar e inspeção celular ficam disponíveis como rotas informativas. Os estágios G4B, G5, G2B e G3B seguem pendentes.

### Critérios de aceite técnico

- [x] Duas marcas e duas composições comparadas. Marca selecionada em SVG, versão monocromática, assinatura, favicon próprio, quatro tamanhos PNG e cartão social.
- [x] Home, Estudos, Fontes, os três modos, fichas, ferramentas e estados de erro conferidos em capturas reais desktop e mobile.
- [x] Home abaixo de 500 KiB nas três larguras, com zero inicialização WebGL e zero requisições do renderer ou catálogo.
- [x] `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test -- --maxWorkers=2`, `npm.cmd run test:catalog`, `npm.cmd run validate:catalog` e `npm.cmd run build` passaram. Foram 206 testes unitários e 22 testes Python.
- [x] `npm.cmd run test:e2e -- --reporter=list,json` aprovou **88/88** em 13,7 min, sem retries ou skips. Inclui o cenário de 430 px que havia falhado na UI-R4 e a navegação de Estudos corrigida nesta etapa.
- [x] Auditoria axe-core em 54 estados sem violações nas regras executadas. Seis perfis cumpriram os orçamentos originais.
- [x] Preservação verificada dos motores, simulações, estados, contratos, catálogo, GLB e das 972 evidências históricas em `artifacts/gates`.
- [x] Aprovação artística humana da UI-R5 no escopo do redesign.
- [ ] Avaliação em telefone físico, Safari/iOS e leitores de tela.

[Comandos, execução completa e hashes](../artifacts/gates/UI-R5-validation.json).
