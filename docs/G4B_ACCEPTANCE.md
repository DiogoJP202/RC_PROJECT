# G4B — Aceite técnico do observatório celular RC

G4B parte de `987ef434050fa2fa8e2c29ff8509c3242f6b3364`, merge do plano aprovado na `main` pelo PR #4. A implementação está na branch `codex/g4b`, no checkout principal. O escopo é um protótipo interativo P1. A aprovação visual fica reservada à revisão humana. [Plano aprovado](G4B_PLAN.md)

## Interface entregue

No Atlas, abra Micro, selecione uma célula RC por toque, raycast ou lista e use **Seguir célula**. **Inspecionar célula** abre a mesma identidade semântica em `/atlas/cell/:entityId`. Células ausentes da população e hemácias ficam fora dessa entrada contextual. Acesso direto válido abre somente a bancada celular. ID malformado ou de hemácia tem retorno informativo para Micro.

No palco, as vistas Oblíqua, Frontal e Lateral e os controles de zoom dão alternativa às interações de ponteiro. **Esquemático** simplifica o relevo e **Interpretativo** mostra pregas e lobos no mesmo envelope de exibição. **Corte** intercepta os triângulos da geometria local. Há três eixos, posição normalizada, centralização e retorno à superfície. O contorno âmbar representa a interseção. O fundo visível dentro da malha recortada pertence à superfície restante. A ficha identifica que a estrutura interna permanece desconhecida.

**Comparar com hemácia** normaliza o envelope máximo de cada figura e conserva suas proporções próprias. Desktop exibe ambos os volumes no mesmo renderer e em vistas sincronizadas. Mobile alterna a figura no mesmo enquadramento. Sair da comparação devolve seleção, inspeção por corte e pose próprias. A legenda ressalva a ausência de uma relação de tamanho conhecida.

O palco, os controles e a ficha aceitam dados e conteúdo separados do roteamento, demonstrados pela RC e pela hemácia. A entrada de GLB e os focos semânticos de outros tecidos exigirão um adapter e testes próprios. A interface usa Limiar, IBM Plex, a paleta UI-R5 e a mesma folha inferior móvel. Corte, Vista e Ficha ocupam um único painel sob demanda. O fallback usa esquemas autorais, preserva a leitura das fontes e mantém o retorno à circulação e a tentativa de recuperar WebGL.

## Arquitetura e decisões

| Área | Implementação |
|---|---|
| Identidade e rota | `src/simulation/vascularIdentity.ts` compartilha o parser entre as rotas e o motor. `routes.ts` valida a identidade RC no caminho. A volta após acesso direto ou recarregamento abre Micro pausado em zero com o menor perfil que contém o ID. |
| Bookmark e captura | `App.tsx` mantém um token por entrada de histórico e bookmarks de inspeção em memória. Ao abrir a rota, a ponte só aceita uma câmera cujo quadro aplicou a revisão atual de relógio, seleção, destaque e configuração. Captura e pausa ocorrem sem outro frame entre elas. A volta pela entrada de origem repõe a câmera antes de reativar a visibilidade. |
| Renderização da origem | `VascularScene` conserva o canvas e recursos. O gancho de estacionamento segura pose, alvo e quaternion capturados até outro comando de câmera/tempo ou retomada. Em redimensionamento, a projeção segue o novo aspecto. Bookmarks conservam rolagem e contexto das fichas e o CTA recupera o foco. |
| Superfície de inspeção | `InspectionWorkspace` organiza palco, câmera, controles, evidências e fallback. `CellWorkspace` fornece dados e fichas específicas. `InspectionRendererAdapter` normaliza malhas, gerencia recursos e intersecta o plano com os triângulos. O raycast aplica o mesmo lado de recorte visível no material. |
| Recursos | Bench celular e renderer carregam sob demanda. O adapter possui geometrias e materiais próprios por sessão, cria a referência de hemácia no primeiro uso da comparação e descarta os recursos ao sair. O canvas usa invalidação sob demanda e somente a cena em uso emite frames úteis. |
| Evidências | `cellularEvidence.ts` compõe o registro vascular validado com descrições autorais do corte e da comparação. `official` e `real_anatomy` preservam fontes e escopo. O aviso conceitual fica fora do filtro de claims. |

A relação entre o contorno da RC no vaso e o modelo ampliado é de direção artística. As pregas do G4B resultam de uma função determinística, com variação limitada por seed e revisão. O material mate verde dessaturado mantém parentesco com a cor vascular e a luz quente sobre o fundo grafite separa os relevos. O corte mostra o contorno dourado em volta da malha seccionada. A hemácia tem volume contínuo e centro mais fino, com maior legibilidade da concavidade pela vista lateral.

O retorno deliberadamente pausa a circulação no quadro capturado. **Retomar reprodução** continua nesse ponto. A comparação aqui é celular e morfológica. A rota geral de comparação mantém seu estado informativo e os modelos seguem conceituais. Ingresso Blender futuro depende de malha licenciada, manifesto, preflight e revisão de bounds, seleção, normais e materiais, conforme o [contrato aprovado](G4B_PLAN.md#recursos-blender-e-desempenho).

## Capturas da aplicação

| Vista | Desktop | Mobile 390 | Mobile 430 |
|---|---|---|---|
| Interpretativo | [Desktop](../artifacts/gates/G4B-desktop.png) | [390](../artifacts/gates/G4B-mobile-390.png) | [430](../artifacts/gates/G4B-mobile-430.png) |
| Corte | [Desktop](../artifacts/gates/G4B-corte-desktop.png) | [390](../artifacts/gates/G4B-corte-mobile-390.png) | [430](../artifacts/gates/G4B-corte-mobile-430.png) |
| Comparação | [Desktop](../artifacts/gates/G4B-comparacao-desktop.png) | [390](../artifacts/gates/G4B-comparacao-mobile-390.png) | [430](../artifacts/gates/G4B-comparacao-mobile-430.png) |
| Ficha | [Desktop](../artifacts/gates/G4B-ficha-desktop.png) | [390](../artifacts/gates/G4B-ficha-mobile-390.png) | [430](../artifacts/gates/G4B-ficha-mobile-430.png) |
| Fallback | [Desktop](../artifacts/gates/G4B-fallback-desktop.png) | [390](../artifacts/gates/G4B-fallback-mobile-390.png) | [430](../artifacts/gates/G4B-fallback-mobile-430.png) |

[Modo esquemático](../artifacts/gates/G4B-esquematico-desktop.png) · [RC em perfil](../artifacts/gates/G4B-lateral-desktop.png) · [Fluxo antes da entrada](../artifacts/gates/G4B-vascular-before.png) · [Fluxo após o retorno](../artifacts/gates/G4B-vascular-return.png) · [Vídeo do percurso real](../artifacts/gates/G4B-percurso.webm).

O vídeo registra o fluxo em movimento, a ampliação, a órbita, o corte, a comparação, a ficha e a retomada vascular pela interface. As capturas de comparação identificam o mesmo recorte funcional em desktop e mobile. Os arquivos são saídas reais do preview de produção. [Metadados e hashes](../artifacts/gates/G4B-visual.json)

## Parecer visual

O modelo ampliado conserva o contorno lobulado, e as pregas sob luz lateral dão leitura de volume no modo interpretativo. A malha esquemática contém menos detalhes para separar contorno de relevo. O plano âmbar fica legível sem promover o material de fundo a histologia. A comparação de perfil esclarece a concavidade da hemácia, cuja vista frontal tem relevo menos evidente. A ficha móvel abre como folha inferior e pode ocultar parte do palco durante a leitura.

As pregas e cores são autorais. As texturas não estabelecem organelas, composição, dimensões ou mecanismo RC. O espécime permanece P1. Os viewports 390 e 430 foram avaliados em emulação Chromium. Telefone físico, Safari/iOS, leitores de tela e malhas definitivas permanecem verificações futuras.

## Validação funcional, visual e de acessibilidade

A verificação usou Windows, Node 24.19.0, npm 11.17.0, Python 3.12.14 e Chrome 158 no preview local de produção. Os comandos `npm run typecheck`, `npm run lint`, `npm test -- --maxWorkers=2`, `npm run test:catalog`, `npm run validate:catalog` e `npm run build` cobrem tipos, lint, 210 testes unitários, 22 Python e catálogo de runtime v2. A rejeição do seed histórico v1 é esperada e foi reconferida. [Migração do catálogo](G1_CATALOG_MIGRATION.md)

A execução completa `npm run test:e2e -- --workers=1` passou 94 de 94 cenários, sem pulados ou instáveis, em 13,9 min. O cenário de tracking vascular contínuo com 2.000 entidades passou em 48,3 s, com mais de 42 s de reprodução real. A suíte preserva as provas de sessão GLB e Rinkaku. Os 14 cenários da verificação focada G4B/UI-R1 também passaram. A comparação do índice com a base confirmou a preservação dos 1.255 arquivos versionados em `artifacts/`. [Registro de testes](../artifacts/gates/G4B-validation.json)

No ensaio de dez percursos, o primeiro frame vascular conferiu em todos os ciclos de Tracking, Livre e Fluxo. O teste compara relógio, posição, alvo, eixo vertical, quaternion, identidade, configuração, hash de matrizes e o mesmo canvas/UUIDs dos recursos vasculares. Os dez adaptadores celulares foram descartados. A checagem complementar recompôs a aba Evidências em desktop e a rolagem de 237 px em mobile. Os dois casos preservaram o foco no comando de inspeção, a velocidade 0,77, o realce e a seleção. Na captura pareada com `rc:17:0` em 11,25 s, os 732.240 pixels do recorte do palco são idênticos. A diferença entre as capturas completas é o indicador de foco de retorno. O vídeo VP9 tem 12,4 s e 1280 × 800. [Capturas e hashes](../artifacts/gates/G4B-visual.json)

Axe 4.11 examinou 69 estados em 1440 × 900, 390 × 844 e 430 × 932. Houve zero violações nas regras executadas e zero overflow horizontal. Os itens inconclusivos são de contraste. Entre os itens do G4B estão o triângulo decorativo e mensagens que o axe vê junto ao canvas ou sob um painel aberto. A revisão verificou a leitura dos rótulos visíveis e as cores da legenda, estado, títulos de comparação, texto de corte e foco. Nos pares aferidos, os textos ficaram entre 8,07:1 e 15,17:1, e os indicadores de foco entre 8,96:1 e 9,99:1. A borda funcional do seletor ficou em 4,23:1. [Relatório de acessibilidade](../artifacts/gates/G4B-accessibility.json)

## Desempenho

Rodadas sequenciais no preview Vite, com Iris Xe, Chrome 158, DPR 1, 20 Mbps e 50 ms pelo CDP. Cada perfil tem 10 s de aquecimento e 30 s de amostragem. Os cenários celulares registram órbita por ponteiro, frames efetivos da cena e pausa das invalidações em repouso. O tempo de entrada registra o botão em Micro até a cena celular pronta. O acesso direto mede uma navegação fria separada.

| Perfil | FPS p50 | FPS p10 | Draws máx. | Entrada Micro → G4B |
|---|---:|---:|---:|---:|
| G4B · Superfície | 59,88 | 59,17 | 1 | 438 ms |
| G4B · Corte | 59,88 | 59,17 | 2 | 490 ms |
| G4B · Comparação | 59,88 | 59,17 | 2 | 434 ms |
| G4B · Comparação 390 | 59,88 | 59,17 | 1 | 444 ms |
| G4B · Comparação 430 | 59,88 | 59,17 | 1 | 449 ms |
| Micro · Fluxo 100 | 59,88 | 59,17 | 3 | — |
| Micro · Fluxo 500 | 59,88 | 59,17 | 3 | — |
| Micro · Fluxo 2.000 | 59,88 | 59,52 | 3 | — |
| Micro · Tracking 2.000 | 59,88 | 59,17 | 4 | — |
| Micro · Tracking 500 emulado | 59,88 | 59,52 | 4 | — |
| Corpo | 59,88 | 59,52 | 23 | — |
| Rinkaku | 59,88 | 59,17 | 22 | — |
| Rinkaku emulado | 59,88 | 59,17 | 22 | — |

Os 13 cenários ficaram dentro dos seus orçamentos, incluindo os perfis de Corpo, Rinkaku e vascular da UI-R5 e a série vascular 100/500/2.000. Na série celular, Micro → G4B transferiu 11,5 KiB e levou 0,43–0,49 s. Acesso direto transferiu 441,4 KiB em 0,63–0,70 s. A Home fria transferiu 168,9–197,9 KiB até carregar a vitrine principal, com zero canvas, WebGL e chunks celulares. Micro antes do CTA serviu zero chunks celulares. A comparação desktop, a superfície e o corte permaneceram abaixo do teto de 30 draws. A estação emulou os perfis móveis. Os perfis legados registraram um aviso de depreciação de `THREE.Clock`, sem erro de execução. Contadores do renderer e heap JavaScript descrevem os recursos observados. [Relatório de produção e hashes do build](../artifacts/gates/G4B-performance.json)

## Checklist de aceite

- [x] Identidade RC estável, seleção no fluxo e entrada sob demanda. Back, Forward, reload, URL inválida, dupla entrada e cancelamento exercitados no navegador.
- [x] Dez retornos no primeiro quadro visível e prova pareada de pixels. Quadro pausado, seleção, câmera, foco e recursos de origem preservados. Retomada explícita demonstrada no vídeo.
- [x] Órbita, zoom, presets, raycast, corte e comparação em duas larguras móveis e desktop. Evidências e legendas preservadas no fallback e na perda real de WebGL.
- [x] Catálogo v2, TypeScript, lint, testes unitários, Python, build, 94 testes E2E e auditoria axe com revisão de contraste.
- [x] Orçamentos de execução e transferência medidos e registrados nos cenários celulares e nas regressões anteriores.
- [x] Capturas desktop/mobile, vídeo, proveniência dos procedurais, roadmap, handoff e log atualizados. Evidências históricas preservadas.
- [ ] Aprovação visual humana. Revisão P2 e validação em telefone físico têm aceites próprios.
