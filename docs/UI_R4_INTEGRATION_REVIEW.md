# UI-R3 e UI-R4 — Revisão de integração

Revisão de 24/11/2026 na pasta principal. Os SHAs remotos na abertura eram `0c287c7768b4d1607274d9e1e9e6a186f0904e92` em `main` e `e272b50a0795900d3aab60120f45b8b2f71c6f3e` em `codex/ui-r4`. A árvore local iniciou limpa. A base contém UI-R1/UI-R2 por meio do PR #1. Os commits `e3cc9c7` e `e272b50` acrescentam UI-R3/UI-R4 e a consolidação do checkout. O destino desta revisão é o PR de `codex/ui-r4` para `main`, sujeito à aprovação humana.

Foram lidos o `AGENTS.md`, os dez documentos originais em `ghoul_atlas_ui_redesign/`, os aceites [UI-R1](UI_R1_ACCEPTANCE.md), [UI-R2](UI_R2_ACCEPTANCE.md), [UI-R3](UI_R3_ACCEPTANCE.md), [UI-R4](UI_R4_ACCEPTANCE.md), o [checkpoint](UI_REDESIGN_CHECKPOINT.md) e os [critérios gerais de qualidade](08_QUALITY_ASSURANCE.md).

## O que o PR integra

- Rinkaku e Circulação RC adotam a mesma composição de palco e ferramentas do Corpo. Timelines aparecem durante a simulação. Índices e fichas se abrem sob demanda e usam o mesmo diálogo responsivo.
- O painel de evidências reutiliza fontes, localizadores, notas e filtros. Mantém a distinção entre afirmação documentada, anatomia humana e reconstrução conceitual.
- As fichas ganham navegação de teclado por abas, os modais contêm e restauram o foco, e a Ajuda permite desligar atalhos de cena. Os controles móveis preservam acesso por toque, movimento reduzido e alternativas textuais.
- O diff da branch preserva `src/scene`, `src/simulation`, `src/state`, `src/content`, `contracts`, `public` e as dependências. A revisão acrescenta documentação, evidências e um ajuste na preparação do teste desktop UI-R3.

## Validação de produção

| Comando | Resultado |
|---|---|
| `npm.cmd run typecheck` | Exit 0 |
| `npm.cmd run lint` | Exit 0 |
| `npm.cmd test -- --maxWorkers=2` | 206/206 em 22 arquivos |
| `npm.cmd run test:catalog` | 22/22 testes Python |
| `npm.cmd run validate:catalog` | Catálogo de produção v2 aprovado |
| `npm.cmd run build` | Exit 0 |
| `npm.cmd run test:e2e -- --reporter=list,json` | Primeira rodada 87/88 em 12,8 min. Rodada final 88/88 em 13,7 min, sem retries, flakes ou skips. |
| `npm.cmd run test:e2e -- tests/e2e/ui-r3.spec.ts --grep "Rinkaku tools preserve" --repeat-each=5` | 5/5 em 47,1 s, após o ajuste de preparação. |

O caso histórico `430px sheets contain scrolling and keyboard focus while keeping each scene intact` falhou em 18/11 quando a leitura de referência captou a pose Rinkaku antes do adaptador assíncrono. No estado publicado, a preparação aguarda o hash da pose e a aplicação de `t=0,88`. Nesta revisão, o caso passou nas duas rodadas completas, em 10,8 s e 10,9 s. Permanecem as asserções de foco, rolagem, caixa do palco, identidade do canvas, pose, câmera, seleção e camadas.

A primeira rodada de 24/11 encontrou outra falha, no caso desktop `Rinkaku tools preserve the canvas, GLB lease and exact paused pose`. A diferença observada foi de até **4,45 × 10⁻¹⁶** na posição e **5,56 × 10⁻¹⁷** no quaternion. Alvo e projeção coincidiram. A hipótese foi uma leitura durante a acomodação numérica do OrbitControls. Em `tests/e2e/ui-r3.spec.ts`, a preparação agora coleta a referência depois de quatro frames sucessivos com o GLB da fixture ativo, `t=0,88` aplicado no adaptador, hash de pose presente e câmera exatamente estável. As asserções de igualdade após cada ferramenta, os limites de tracking, os timeouts e as expectativas anteriores continuam em vigor. O log e o trace da primeira rodada foram preservados.

A rodada final usou Chrome **157.0.8103.80**, um worker e preview local do build de produção na porta 4173. O teste desktop passou em 3,7 s na suíte completa após as cinco execuções isoladas. O tracking de 2.000 entidades registrou **42,18 s** de simulação, **78** amostras e passo máximo de câmera de **1,091** após a acomodação, com o limite original de **1,5**. As seis entradas de build da UI-R4 conservaram o SHA-256. TypeScript e lint foram repetidos após o ajuste do teste. [Relatório dos 88 cenários, comandos, medições e hashes](../artifacts/gates/UI-R4-review-validation.json).

Para reproduzir, executar `npm.cmd run build`, apontar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para o Chrome instalado e definir `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173` antes da suíte. O Playwright inicia o preview. Os logs, JSONs originais e traces permanecem em `artifacts/local/ui-r4-integration/`.

## Capturas

São 47 capturas reais de Chrome headless em build de produção. Os viewports são 1440 × 900 no desktop e 390 × 844 / 430 × 932 no mobile emulado. A sequência de Corpo começa na visão geral. Rinkaku está no quadro manual `t=0,88`. Circulação acompanha `rc:17:0` em `11,25 s`, com o perfil de 500 entidades. São estados do demonstrador. As fichas mostram seleções e evidências que o usuário pode alcançar pelos controles do atlas.

| Tela | Desktop | Mobile 390 | Mobile 430 |
|---|---|---|---|
| Página inicial | [Vitrine](../artifacts/gates/UI-R4-review-home-desktop.png) | [Vitrine](../artifacts/gates/UI-R4-review-home-390.png) | [Vitrine](../artifacts/gates/UI-R4-review-home-430.png) |
| Estudos | [Índice](../artifacts/gates/UI-R4-review-estudos-desktop.png) | [Índice](../artifacts/gates/UI-R4-review-estudos-390.png) | [Índice](../artifacts/gates/UI-R4-review-estudos-430.png) |
| Fontes | [Metodologia](../artifacts/gates/UI-R4-review-fontes-desktop.png) | [Metodologia](../artifacts/gates/UI-R4-review-fontes-390.png) | [Metodologia](../artifacts/gates/UI-R4-review-fontes-430.png) |
| Corpo | [Observatório](../artifacts/gates/UI-R4-review-body-desktop.png) | [Observatório](../artifacts/gates/UI-R4-review-body-390.png) | [Observatório](../artifacts/gates/UI-R4-review-body-430.png) |
| Rinkaku | [Manifestação](../artifacts/gates/UI-R4-review-rinkaku-desktop.png) | [Manifestação](../artifacts/gates/UI-R4-review-rinkaku-390.png) | [Manifestação](../artifacts/gates/UI-R4-review-rinkaku-430.png) |
| Circulação RC | [Acompanhamento](../artifacts/gates/UI-R4-review-vascular-desktop.png) | [Acompanhamento](../artifacts/gates/UI-R4-review-vascular-390.png) | [Acompanhamento](../artifacts/gates/UI-R4-review-vascular-430.png) |
| Ficha anatômica | [Evidências](../artifacts/gates/UI-R4-review-body-ficha-desktop.png) | [Folha](../artifacts/gates/UI-R4-review-body-ficha-390.png) | [Folha](../artifacts/gates/UI-R4-review-body-ficha-430.png) |
| Parâmetros Rinkaku | [Simulação](../artifacts/gates/UI-R4-review-rinkaku-simulacao-desktop.png) | [Folha](../artifacts/gates/UI-R4-review-rinkaku-simulacao-390.png) | [Folha](../artifacts/gates/UI-R4-review-rinkaku-simulacao-430.png) |
| Ficha vascular | [Evidências](../artifacts/gates/UI-R4-review-vascular-ficha-desktop.png) | [Folha](../artifacts/gates/UI-R4-review-vascular-ficha-390.png) | [Folha](../artifacts/gates/UI-R4-review-vascular-ficha-430.png) |
| Ajuda | [Controles](../artifacts/gates/UI-R4-review-help-desktop.png) | [Controles](../artifacts/gates/UI-R4-review-help-390.png) | [Controles](../artifacts/gates/UI-R4-review-help-430.png) |

Outros estados registrados: [estruturas](../artifacts/gates/UI-R4-review-estruturas-desktop.png), [camadas](../artifacts/gates/UI-R4-review-camadas-390.png), [varredura](../artifacts/gates/UI-R4-review-varredura-390.png), [células e fluxo](../artifacts/gates/UI-R4-review-fluxo-controles-390.png), [menu móvel](../artifacts/gates/UI-R4-review-menu-390.png), [bibliografia](../artifacts/gates/UI-R4-review-bibliografia-desktop.png), [Comparar](../artifacts/gates/UI-R4-review-comparar-desktop.png) e [inspeção celular indisponível](../artifacts/gates/UI-R4-review-celular-390.png).

## Avaliação visual

| Dimensão | O que funciona | O que ajustar na UI-R5 |
|---|---|---|
| Marca | O cabeçalho editorial é reconhecível ao trocar de rota. | O ícone de órbitas parece um átomo de laboratório genérico. O olho com retícula tem potencial para ligar marca e assunto em tamanho de favicon. |
| Hierarquia | Palco, seleção e ferramentas têm áreas próprias. O título da Home e o CTA apresentam um caminho direto. | O pôster da Home fica visualmente separado do texto por uma moldura retangular rígida. A legenda “01 Espécime 001” repete informação. O índice repete `01–03` e “Estudos disponíveis” nas páginas. |
| Navegação | Atlas, Estudos e Fontes mantêm a mesma nomenclatura. O retorno de Rinkaku ao Corpo e o retorno do fluxo são identificáveis. | Em telas curtas, parte das ações do Micro pode ficar abaixo do primeiro viewport. É uma consequência visível da hierarquia palco → controles. Medir de novo para manter a descoberta das ações após a troca de marca e escala tipográfica. |
| Linguagem | Fontes delimita o que as referências sustentam. O aviso de modelo impede que o 3D pareça anatomia oficial. | “3D conectado” soa como status de rede. Avaliar “Cena 3D pronta”, mantendo feedback para carregamento e fallback. Manter título e aviso próximos à área a que se referem. |
| Arte e estados indisponíveis | Corpo, Rinkaku e Micro conservam a mesma lógica de operação. A rota celular oferece volta ao fluxo. | O manequim, o relevo vascular e as células ainda têm material de protótipo. A UI-R5 pode melhorar enquadramento e identidade gráfica. A maturidade anatômica depende dos assets P2. Em Comparar, “O corpo como mapa”, “O que nos torna diferentes?”, o rótulo do gate e “Carregando 3D” competem com o aviso de indisponibilidade. Na rota celular, o texto encosta na borda em 390 px. As duas rotas precisam do mesmo estado visual com margens e ação de retorno. |

A Home conserva título e CTA dentro do primeiro viewport nos três tamanhos. A lista de Estudos ocupa 875 px de altura no mobile de 390 px, com o rodapé logo após as três opções. Em Fontes, as seis classes precedem a bibliografia. A leitura móvel se beneficiaria de um link direto para as referências. Notas sobre gates antigos e caminhos de documentação têm valor de auditoria, mas hoje competem com o título e com o resumo da fonte.

Em 1440 × 900, os três palcos ocupam 1.382 px de largura, cerca de 96% do viewport. Corpo tem 675 px de altura e as duas simulações, 632 px. As ferramentas móveis de Camadas e Circulação têm rótulos e controles legíveis. Os pequenos marcadores de início/fim da Varredura e os microrrótulos da timeline Rinkaku ainda pedem uma hierarquia melhor. As rotas editoriais e os estados indisponíveis passaram pela medição de largura nos três viewports. Os estados principais de observatório foram conferidos pela suíte E2E.

## Checklist de integração

- [x] Pasta principal, SHAs local e remoto de entrada e escopo do diff conferidos.
- [x] TypeScript, lint, unitários, Python, catálogo e build aprovados.
- [x] Suíte completa de produção aprovada e falhas anteriores documentadas.
- [x] Capturas desktop e mobile, análise visual e proposta da etapa artística.
- [ ] Revisão humana e aprovação para merge.

## Limites e continuidade

O aceite é de interface P1, com modelos conceituais. Dispositivo móvel físico, Safari/iOS, leitores de tela e assets anatômicos finais seguem pendentes. A auditoria axe de 45 estados e os seis perfis de produção são evidências já registradas do build UI-R4. Esta revisão repete a suíte E2E e as capturas. A [proposta UI-R5](UI_R5_PROPOSAL.md) trata do próximo trabalho artístico sobre os fluxos existentes.
