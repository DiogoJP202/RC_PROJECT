# UI-R2 — Palco e ferramentas de Corpo

O UI-R2 entrega a nova composição de `/atlas` sobre o worktree local de UI-R1, com a mesma cena 3D. Rinkaku e Micro conservam seus próprios painéis e controles até UI-R3.

- O palco ocupa uma coluna independente. Título, seleção, ações e aviso de representação ficam fora da área de render. O heading de repouso informa espécime e modo, sem slogans.
- Estruturas, Camadas, Ficha e Varredura abrem uma ferramenta por vez. Desktop usa sobreposição não modal; telas estreitas usam `<dialog>` nativo como folha inferior. Esc fecha antes de alterar qualquer estado da cena. A ação de fechar devolve o foco ao botão de origem.
- A lista usa os mesmos seis IDs do picking existente. No desktop, uma seleção pode abrir a ficha; no mobile, ela atualiza a faixa de seleção e a ficha abre sob comando. Isolamento, foco e opacidade continuam a chamar as ações existentes. O filtro de fontes está na ficha e preserva o aviso conceitual no estado de repouso.
- A varredura começa pausada e não tem um dock permanente. A ferramenta oferece reprodução, pausa, scrub e reinício; fechar pausa no último ponto. As timelines temporais de Rinkaku e Micro continuam nos respectivos modos.
- A sessão mantém stores, projeção, renderer e lease ao alternar ferramentas. O callback adicionado ao observer de picking só abre a ficha no shell de desktop. Não substitui raycast, GLB, mapa semântico ou câmera.

## Verificação

- [x] Em 1440 × 900, palco de **1.382 × 675 px** (96% da largura, acima de 65%), sem rolagem da página. Na vista geral, a projeção do corpo ocupa **72,2% da altura** sem ajuste de presets. [Medições](../artifacts/gates/UI-R2-layout.json)
- [x] Em 390 × 844 e 430 × 932, o palco tem **58% da altura da tela**. Sem overflow horizontal; botão da estrutura ≥44 px, foco dentro da folha, seleção e Esc devolvem foco ao acionador. Aviso do proxy em repouso e na ficha de evidências.
- [x] As quatro ferramentas mantêm a caixa do palco, o elemento canvas, a pose, o recurso GLB e os contadores de cache. Abertura/fechamento não busca novamente o catálogo. Fechar a varredura pausa no ponto atual.
- [x] `npm run typecheck`, `npm run lint`, `npm test -- --maxWorkers=2` (206), 22 testes Python, validação do catálogo e `npm run build` passaram.
- [x] A suíte E2E completa do build de produção executou 74 cenários no Chrome, com 71 aprovados. Os três casos restantes passaram na reexecução isolada sobre o mesmo build, após adaptar como acessavam a Ficha e fechavam Camadas.
- [x] Todos os orçamentos do perfil de produção do Corpo passaram. A cena ficou interativa em **1,56 s** com **462 KiB** transferidos. A amostra de 30 s registrou **59,88 / 59,52 FPS** (p50 / p10) e **23 draw calls**. Medição de desktop com Iris Xe, 1440 × 900, DPR 1, cache frio e rede emulada de 20 Mbps com latência CDP de 50 ms. [Perfil](../artifacts/gates/UI-R2-performance.json)

A primeira rodada focada (26/28) revelou que uma ficha longa interceptava o botão de reenquadrar. A altura foi limitada ao palco e a rolagem passou a ocorrer dentro da ficha. A rechecagem aprovou os dois testes originais de câmera/GLB e os quatro cenários novos (6/6); eles incluem assert de que nenhum painel cruza a borda inferior do palco.

A rodada completa também aprovou o tracking vascular com 2.000 partículas, os dez ciclos Corpo → Micro → Corpo e as regressões da vitrine. Nos três cenários reexecutados, um teste desktop passou a abrir a Ficha após voltar ao Corpo, antes de conferir o isolamento persistido. Em duas larguras móveis, os testes passaram a fechar Camadas antes de tocar em Manifestar. As asserções de seleção, câmera, isolamento, escala e reprodução continuaram as mesmas. O perfil registrou zero erros de execução e o aviso de depreciação de `THREE.Clock`.

Para reproduzir, rode `npm run build` e `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`. Em outro terminal, use `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173` para `npm run test:e2e` e `ATLAS_PROFILE_URL=http://127.0.0.1:4173/atlas` para `node tests/e2e/production-profile.js`. A execução registrada usou `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` apontando para o Chrome instalado.

| Captura real | Repouso | Ficha de evidências |
|---|---|---|
| Desktop 1440 × 900 | [Palco](../artifacts/gates/UI-R2-desktop.png) | [Kakuhou](../artifacts/gates/UI-R2-ficha-desktop.png) |
| Mobile 390 × 844 | [Palco](../artifacts/gates/UI-R2-mobile-390.png) | [Folha inferior](../artifacts/gates/UI-R2-ficha-390.png) |
| Mobile 430 × 932 | [Palco](../artifacts/gates/UI-R2-mobile-430.png) | [Folha inferior](../artifacts/gates/UI-R2-ficha-430.png) |

Antes do redesenho de Corpo: [UI-R1 desktop](../artifacts/gates/UI-R1-atlas-desktop.png) e [UI-R1 mobile](../artifacts/gates/UI-R1-atlas-mobile.png). Conteúdo novo e controles são UI; as imagens retratam os mesmos modelos procedurais e evidências. Capturas móveis são emulação, não telefone físico.

## Limites

UI P1 sujeita à revisão visual. Modelos conceituais não mudaram de categoria. UI-R3 concentra migração de Rinkaku, Micro e apresentação compartilhada de evidências; estética definitiva, novos modelos e celular físico continuam escopos separados. Este gate não publica o projeto.
