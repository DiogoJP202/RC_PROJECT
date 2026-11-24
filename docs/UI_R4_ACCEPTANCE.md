# UI-R4 — Mobile, teclado e verificação do redesign

Registro técnico da implementação sobre o UI-R3 aprovado, na branch `codex/ui-r4`, inicialmente local sobre o merge `0c287c7`. UI-R3/UI-R4 foram versionados em `e3cc9c7` e transferidos para o checkout principal por instrução posterior do usuário. O [checkpoint de consolidação](UI_REDESIGN_CHECKPOINT.md) registra o estado atual. O snapshot de entrada preserva os arquivos UI-R3 e seus hashes. A entrega fecha a revisão técnica de interface P1 e mantém a classificação conceitual das representações anatômicas.

## Ajustes

- Fichas de Corpo e Micro compartilham `InspectionTabs`. Uma aba participa da sequência de Tab; setas alternam as abas, Home/End acessam suas extremidades e Tab alcança o conteúdo textual. IDs, comandos e estado das fichas são preservados.
- Folhas móveis e Ajuda contêm o ciclo de Tab/Shift+Tab e mantêm o foco dentro do modal. Esc fecha o nível ativo. A rolagem do fundo fica bloqueada durante o modal. O menu móvel fecha por Esc ou clique externo sem disparar o reset da cena.
- A Ajuda oferece a opção Ativar atalhos de cena. Desativá-la suspende os atalhos globais de caracteres e Espaço. Os controles HTML e a saída contextual por Esc continuam disponíveis.
- Numerações decorativas saíram da navegação e do índice. O contador de camadas recebeu contraste adequado. A leitura nas fichas usa corpo de 16 px, com rótulos e metadados menores conforme sua função. Campos móveis usam 16 px e sliders têm alvos de 44 px.
- Foco em cores forçadas, preferência de movimento reduzido, rolagem interna das fichas, limites da Ajuda e reflow foram conferidos. O palco mantém prioridade antes das descrições.
- O link de pular a navegação aponta para conteúdo real durante carregamento, falha de catálogo e sessão normal. No mobile, o contêiner de destino recebe foco. A alternativa textual ao WebGL tem título funcional e texto legível.

## Critérios e evidências

- [x] Typecheck, lint, 206 unidades, 22 testes Python, catálogo e build finais aprovados.
- [x] Nove cenários E2E novos passaram no build final em 54,7 s. Cobrem abas, preferência de atalhos, modais, menu, reflow, cores forçadas, capturas, foco na timeline e recuperação de catálogo.
- [x] Axe-core em 45 estados passou sem violações nas regras executadas. Os resultados incompletos foram conservados para análise manual.
- [x] Rodada E2E completa com 87/88 aprovados e rechecagem final dos nove cenários UI-R4 aprovada. O caso restante recebeu espera explícita pela pose aplicada pelo adaptador assíncrono.
- [x] Seis perfis de produção e custos de transferência dentro dos orçamentos.
- [x] Capturas reais antes/depois em desktop e mobile verificadas.
- [x] Preservação de motores, cenas, stores, contratos, catálogo, assets e evidências UI-R3 comprovada por Git e hashes.

## Acessibilidade

A primeira auditoria percorreu 39 estados e encontrou problemas de contraste em 13 deles, somando 27 ocorrências de nós. O conjunto foi ampliado para 45 estados ao incluir WebGL desativado e catálogo indisponível em cada viewport. Isso revelou um destino ausente no link de pular navegação durante a falha do catálogo. A auditoria verificada não encontrou violações nas regras executadas. Os testes de teclado também identificaram e corrigiram a saída de foco da página ao usar Shift+Tab no início de um modal.

A análise automática usa axe-core 4.11.0, obtido do pacote oficial npm, com SHA-256 do script registrado no relatório. O bundle permanece ferramenta local de QA. Os tags executados foram `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` e `best-practice`. Estados em 1440 × 900, 390 × 844 e 430 × 932 incluem Home, Estudos, Fontes, os três modos, índice, camadas, fichas, parâmetros e Ajuda. [Relatório inicial](../artifacts/gates/UI-R4-accessibility-before.json) e [relatório verificado](../artifacts/gates/UI-R4-accessibility.json).

Os resultados incompletos de contraste incluem glifos decorativos, fundos com pseudo-elementos e recortes de conteúdo rolável. Um grupo de reprodução do Rinkaku recebeu semântica explícita após a análise manual. Os resultados finais mantêm os alvos para revisão. Não foram usados filtros para ocultar regras que falhavam. A auditoria automática deve ser complementada por testes manuais, como explica a documentação do axe-core. [Deque — axe-core](https://github.com/dequelabs/axe-core).

A inspeção adicional conferiu o aviso do realce RC no painel móvel e os blocos da Ajuda. Seus retângulos não se sobrepõem aos controles vizinhos ou aos blocos de conteúdo adjacentes. Os campos têm fonte de 16 px; a borda dos selects apresenta contraste de **3,98:1** com o preenchimento e **4,47:1** com o painel. O botão Fechar guia mede 44 px de altura. Capturas e valores computados documentam essa revisão. Os resultados incompletos restantes do axe são de contraste. [Medições manuais](../artifacts/gates/UI-R4-manual.json), [controles em 390 px](../artifacts/gates/UI-R4-controls-review-390.png) e [Ajuda em 430 px](../artifacts/gates/UI-R4-help-review-430.png).

As interações das abas e dos diálogos foram confrontadas com o APG. A opção de desligar atalhos atende ao mecanismo descrito para atalhos de caracteres. Os alvos móveis de 44 px são uma escolha do projeto acima do mínimo de 24 px discutido em WCAG 2.2. [WAI — abas](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), [WAI — diálogos](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [WAI — atalhos](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html), [WAI — tamanho mínimo de alvo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Para reproduzir a auditoria, sirva o build de produção na porta 4173 e execute `node tests/e2e/ui-r4-audit.mjs --axe=/caminho/axe.min.js --output=artifacts/local/ui-r4-accessibility.json`. O pacote usado foi `axe-core@4.11.0`. A verificação funciona fora do bundle público e das dependências da aplicação.

## Verificação visual e desempenho

Os comparativos usam os estados UI-R3 preservados. Corpo abre na visão geral, com a superfície selecionada. Rinkaku fica pausado em `t=0,88`. Micro usa `11,25 s`, perfil padrão de 500 entidades e tracking de `rc:17:0`. A seleção anatômica e as folhas de evidências também receberam capturas próprias. Os tempos pertencem à simulação visual.

O reflow foi testado em 320 × 568, 720 × 450 e 844 × 390 CSS px. O caso 720 × 450 com DPR 2 exercita o layout equivalente ao viewport 1440 × 900 com zoom de 200%. As capturas em 390/430 e os perfis móveis usam emulação.

A rodada completa executou os 88 cenários em 12,6 minutos. Os 79 testes anteriores passaram, incluindo dez ciclos completos de manifestação, dez idas/retornos Corpo/Micro, tracking real com 2.000 entidades, leases GLB, sockets, falhas WebGL e navegação pela vitrine. Um teste novo de 430 px comparou uma pose ainda indefinida com a primeira pose carregada pelo módulo Rinkaku. A preparação passou a aguardar o adaptador e o tempo visual aplicado antes de registrar a referência. As comparações de câmera, hash, seleção e elemento canvas foram mantidas. A rechecagem no build final passou nos nove cenários, incluindo o caso afetado.

A inspeção final encontrou o contorno de foco do slider Rinkaku sobre seu rótulo de status. O contorno foi mantido dentro do alvo do controle, sem mudar dimensões ou tempos da simulação. As asserções conferem a separação geométrica entre o contorno, o rótulo e as fases visíveis em desktop e mobile. Typecheck, lint, catálogo e build foram repetidos em 19/11/2026. A nova rodada passou nos nove casos em 54,7 s; a auditoria do mesmo build repetiu os 45 estados sem violações. As provas anteriores ao ajuste permanecem na área local ignorada `artifacts/local/ui-r4-pre-range-focus`.

| Viewport | Corpo | Rinkaku | Transporte RC |
|---|---|---|---|
| 1440 × 900 | [Visão geral](../artifacts/gates/UI-R4-body-desktop.png) | [Manifestação](../artifacts/gates/UI-R4-rinkaku-desktop.png) | [Tracking](../artifacts/gates/UI-R4-vascular-desktop.png) |
| 390 × 844 | [Visão geral](../artifacts/gates/UI-R4-body-390.png) | [Manifestação](../artifacts/gates/UI-R4-rinkaku-390.png) | [Tracking](../artifacts/gates/UI-R4-vascular-390.png) |
| 430 × 932 | [Visão geral](../artifacts/gates/UI-R4-body-430.png) | [Manifestação](../artifacts/gates/UI-R4-rinkaku-430.png) | [Tracking](../artifacts/gates/UI-R4-vascular-430.png) |

As imagens `UI-R4-before-*` conservam as capturas de entrada. Casos complementares incluem [ficha móvel](../artifacts/gates/UI-R4-vascular-sheet-390.png), [cores forçadas](../artifacts/gates/UI-R4-forced-colors.png) e [fallback WebGL](../artifacts/gates/UI-R4-fallback-430.png). [Medições do palco](../artifacts/gates/UI-R4-layout.json) e [reflow](../artifacts/gates/UI-R4-reflow.json).

### Perfis finais de produção

Os seis perfis foram renovados no build final, depois do ajuste de foco. Cada contexto novo usa cache HTTP desativado, Chrome 157.0.8103.79 headless, Iris Xe, DPR 1 e rede CDP a 20 Mbps com latência configurada de 50 ms. O aquecimento é de 10 s, seguido por 30 s de coleta com 1.800 intervalos rAF. Desktop usa 1440 × 900; mobile emulado usa 390 × 844. Os perfis são sequenciais, com uma execução por cenário. [Relatório final e comparações](../artifacts/gates/UI-R4-performance.json).

| Perfil | FPS p50 | FPS p10 | Draw calls máximas | Transferência combinada |
|---|---:|---:|---:|---:|
| Corpo, desktop | 59,88 | 59,17 | 23 | 475.021 B |
| Rinkaku padrão, desktop | 59,88 | 59,17 | 22 | 481.300 B |
| Fluxo, 500 entidades, desktop | 59,88 | 59,17 | 3 | 495.907 B |
| Tracking, 2.000 entidades, desktop | 59,88 | 59,52 | 4 | 495.907 B |
| Rinkaku padrão, mobile emulado | 59,88 | 59,52 | 22 | 481.300 B |
| Tracking, 500 entidades, mobile emulado | 59,88 | 59,52 | 4 | 495.907 B |

Todos os orçamentos existentes passaram, com zero erros JavaScript, requisições falhas ou erros HTTP. O Corpo ficou interativo em 1,44–1,49 s. A entrada adicional de Micro levou 1,40–1,42 s no perfil padrão de 500 entidades, antes da troca para 2.000 no cenário correspondente. O Rinkaku amostrou as sete fases e conservou suas identidades de recursos; Micro também conservou os UUIDs amostrados. O aviso de depreciação de `THREE.Clock` permanece da dependência existente.

Os cinco cenários compartilhados com UI-R3 usam o mesmo ambiente e as mesmas configurações de rede. As draws máximas permaneceram iguais; o payload cresceu 1.512 B no Rinkaku e 1.459 B em Micro, cerca de 0,3%. Corpo acrescenta uma medição atual, sem baseline UI-R3 própria. A comparação conserva os valores individuais; não constitui teste estatístico de equivalência. Contadores de renderer não medem VRAM, e rAF não mede tempo de GPU. No cenário Micro, o Corpo permanece residente e com render suspenso.

Para reproduzir, configure `ATLAS_PROFILE_URL=http://127.0.0.1:4173/atlas` e o executável Chrome. Execute `node tests/e2e/production-profile.js` para Corpo; `node tests/e2e/g3a1-production-profile.js` para Rinkaku; `node tests/e2e/g4a1-production-profile.js --count=500` para Fluxo. Tracking acrescenta `--tracking`, com `--count=2000` no desktop ou `--count=500 --mobile` no perfil móvel. Rinkaku móvel acrescenta `--mobile`. Use `--output=artifacts/local/nome-do-perfil.json` para preservar cada saída.

## Comandos e integração

| Comando executado | Resultado |
|---|---|
| `npm.cmd run typecheck` | Exit 0; repetido após o ajuste final de foco. |
| `npm.cmd run lint` | Exit 0; repetido após o ajuste final de foco. |
| `npm.cmd test -- --maxWorkers=2` | 206 testes em 22 arquivos aprovados. |
| `npm.cmd run test:catalog` | 22 testes Python aprovados pelo launcher do projeto. |
| `npm.cmd run build` | Exit 0, incluindo `validate:catalog`; repetido após o ajuste final. |
| `npm.cmd run test:e2e -- --reporter=list` | 87/88 na rodada completa; falha de preparação descrita acima. |
| `npm.cmd run test:e2e -- tests/e2e/ui-r4.spec.ts --reporter=list` | 9/9 no build final, 54,7 s. |
| `node tests/e2e/ui-r4-audit.mjs --axe=artifacts/local/ui-r4-tools/package/axe.min.js --output=artifacts/local/ui-r4-accessibility-range-focus.json` | 45 estados, zero violações; incompletos preservados. |

Os testes de navegador usam `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173` e o Chrome instalado indicado por `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. O preview serve o build com `npm.cmd run preview -- --port 4173 --strictPort`. Logs, traces e iterações brutas ficam em `artifacts/local`; relatórios e capturas finais estão em `artifacts/gates`.

A implementação UI-R4 está em `App`, `AtlasWorkspace`, `BodyTools`, `EvidenceInspector`, `Fallback`, `RinkakuControls`, `SystemsIndex`, `VascularWorkspace`, `AtlasHeader`, `main` e nos novos `InspectionTabs`, `dialogKeys` e `accessibility.css`. A cobertura nova está em `ui-r4.spec.ts` e `ui-r4-audit.mjs`. README, este aceite, log e regras de evidência do Git acompanham a mudança. Os demais arquivos locais de UI-R3 continuam parte do checkpoint de entrada.

Foram consultados `AGENTS.md`, `README.md`, `docs/UI_R3_ACCEPTANCE.md`, `docs/08_QUALITY_ASSURANCE.md`, `docs/IMPLEMENTATION_LOG.md`, o roteiro `ghoul_atlas_ui_redesign/06_ROADMAP_UI_E_ACEITE.md` no checkout principal e os módulos de interface, estilos, testes e perfis citados nesta entrega. A comparação Git cobre cenas, simulações, stores, conteúdo, contratos, referências, pesquisa, arquivos públicos e dependências. Os 21 arquivos de evidência UI-R3 do snapshot conservaram seus SHA-256. Os 1.082 arquivos rastreados de evidência histórica não apresentam diferenças. O checkout principal permanece na base `0c287c7`, com apenas o pacote de redesign não rastreado. O [registro de integridade](../artifacts/gates/UI-R4-repository.json) inclui o hash do conjunto de fontes, os hashes das entradas do build e a comparação do snapshot.

## Limites e revisão humana

Chrome na estação e emulação móvel constituem a evidência desta execução. Telefone físico, Safari/iOS e uso efetivo com leitores de tela não foram medidos. Os relatórios automáticos e os testes de teclado não constituem certificação integral WCAG.

As representações humanas, Rinkaku, células RC e trajetórias continuam no estágio conceitual registrado. Não há ingresso de novos modelos Blender nem desenvolvimento de G4B. A revisão artística P2 depende de assets licenciados e avaliação própria. O fechamento do redesign técnico é separado dessa aprovação anatômica/artística.
