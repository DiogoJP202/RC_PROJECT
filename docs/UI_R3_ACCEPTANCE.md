# UI-R3 — Manifestação e transporte no observatório

Implementação local na branch `codex/ui-r3`, baseada no merge `0c287c7` de UI-R1/UI-R2. O gate migra a apresentação de Rinkaku e Micro. A anatomia continua representada pelos proxies e fixtures licenciados do projeto.

## Decisões

- Rinkaku reutiliza o palco de Corpo. Estruturas, Camadas, Ficha anatômica e Simulação abrem uma ferramenta por vez. Quantidade de apêndices, qualidade, partículas, canais normalizados, vistas e evidências da manifestação ficam em Simulação. Play, reverso, passos, fases e scrub ficam no transporte contextual.
- Micro usa a mesma composição. Células e fluxo abre população, seletor HTML de entidades e realce RC. Livre, Fluxo, Seguir, reenquadrar, reprodução e retorno estão junto ao palco. A identidade selecionada é exibida na barra. A ficha abre após seleção desktop; no mobile, Ficha é uma ação explícita.
- `ExplorerPanel` é o diálogo responsivo compartilhado pelos três modos. Desktop usa sobreposição e mobile usa uma folha modal nativa. Fechar devolve foco. Esc fecha a ferramenta antes de soltar tracking ou retornar à cena anterior.
- `EvidenceSources` apresenta títulos, URLs, localizadores, datas e notas do catálogo e do suplemento vascular. `EvidenceFilter` mantém a mesma opção e o mesmo aviso nos três modos. O filtro preserva os avisos da reconstrução. Os registros científicos e suas classificações não foram editados.
- O transporte é contínuo enquanto a simulação está em reprodução, inclusive com uma ferramenta aberta. Abrir ou fechar ferramentas conserva tempo, pose, câmera e seleção. Navegar para a vitrine continua pausando a sessão e suspendendo o render.

## Aceite com evidência

- [x] `npm run typecheck`, `npm run lint`, `npm test -- --maxWorkers=2` (206), `npm run test:catalog` (22), validação do catálogo e build passaram. Typecheck, lint e build foram repetidos após o último ajuste de teclado.
- [x] Suíte E2E completa com 78/79 aprovados. O caso restante passou isoladamente no mesmo build após corrigir o volume de dados transferido pela instrumentação do teste.
- [x] Capturas reais 1440 × 900, 390 × 844 e 430 × 932, comparadas à base UI-R2.
- [x] Nenhum overflow horizontal, títulos fora da geometria e ferramentas móveis com foco, Esc e ações de 44 px.
- [x] Abrir/fechar ferramentas preserva o mesmo canvas, câmera, pose, IDs de geometria/material e lease GLB.
- [x] Picking real RC/hemácia, tracking, entidade ausente, scrub, sete fases Rinkaku e retorno ao Corpo continuam funcionais.
- [x] Câmera manual, seleção, camadas, opacidade, sockets e animação da fixture são restaurados nos dez ciclos de retorno.
- [x] Cinco perfis representativos de produção dentro dos orçamentos existentes, com ambiente e limitações registrados.
- [x] Arquivos de motores, estados, cenas, contratos, catálogo e evidências históricas preservados por comparação Git. Dependências e fixtures também conservam seus bytes rastreados.

A rodada focada inicial executou 19 casos. Tracking em três seeds, seleção e realce, transições de câmera, movimento reduzido, mobile 390/430, oito fluxos da vitrine e quatro testes novos passaram. O teste novo de repouso contava também o diálogo de Ajuda fechado. A asserção passou a exigir ausência de diálogos abertos.

A rodada completa levou 13,2 minutos e aprovou 78 de 79 cenários, incluindo os cinco novos, dez ciclos automáticos de 21 s do Rinkaku, falhas WebGL reais e dez entradas/retornos Corpo/Micro. O único caso com falha foi o tracking de 2.000 entidades. O trace mediu **1,75 s de tempo de simulação** entre leituras, com deslocamento de **2,156**, enquanto o teste esperava amostrar a cada 500 ms e limitava o deslocamento a 1,5. Uma reexecução original também falhou, com 1,578.

O teste enviava pelo protocolo Playwright a população e o adaptador completos a cada leitura. A coleta periódica passou a transferir somente os campos usados na asserção: câmera, identidade e tempo. A execução permaneceu real durante 42 s, com o limite original de 1,5 e os mesmos critérios de remoção de perfil, identidade e Esc. A rechecagem passou com 78 observações, intervalo de simulação máximo de **0,567 s** e deslocamento máximo após acomodação de **1,226**. Esta correção é limitada à instrumentação E2E. [Relatório de tracking](../artifacts/gates/UI-R3-tracking.json)

Após os perfis foi ajustada a prioridade de Esc quando a Ajuda modal está sobre uma ferramenta desktop. O build final passou nos nove cenários UI-R2/UI-R3 em 43,7 s, incluindo uma asserção que mantém a ferramenta aberta ao fechar a Ajuda. Essa rodada também gerou novamente as capturas finais. Os limites temporais, numéricos e de recursos dos testes anteriores continuam vigentes.

## Capturas e medições

Os arquivos `UI-R3-before-*.png` registram o build anterior do projeto. A manifestação está pausada em `t=0,88`, com configuração padrão. Micro está em `11,25 s`, com `rc:17:0` selecionada e acompanhada no perfil padrão. O roteiro de captura usa os controles HTML e mantém movimento reduzido. As novas capturas usam os mesmos estados. O ajuste do layout não altera presets nem fórmulas de câmera.

| Viewport | Manifestação Rinkaku | Transporte RC | Ficha vascular |
|---|---|---|---|
| Desktop 1440 × 900 | [Palco](../artifacts/gates/UI-R3-rinkaku-desktop.png) | [Palco](../artifacts/gates/UI-R3-vascular-desktop.png) | [Evidências](../artifacts/gates/UI-R3-vascular-ficha-desktop.png) |
| Mobile 390 × 844 | [Palco](../artifacts/gates/UI-R3-rinkaku-390.png) | [Palco](../artifacts/gates/UI-R3-vascular-390.png) | [Folha](../artifacts/gates/UI-R3-vascular-ficha-390.png) |
| Mobile 430 × 932 | [Palco](../artifacts/gates/UI-R3-rinkaku-430.png) | [Palco](../artifacts/gates/UI-R3-vascular-430.png) | [Folha](../artifacts/gates/UI-R3-vascular-ficha-430.png) |

Parâmetros e fontes do Rinkaku também foram capturados em [390 px](../artifacts/gates/UI-R3-rinkaku-ficha-390.png) e [430 px](../artifacts/gates/UI-R3-rinkaku-ficha-430.png). Os dois palcos desktop mediram **1.382 × 632 px**, 96% da largura de 1440 px, sem rolagem da página. A base tinha 876 × 626 px em Rinkaku e 896 × 649 px em Micro. Em 390/430 px, o palco tem 55% da altura da tela e precede as ferramentas e descrições. A página móvel pode rolar verticalmente. [Medições atuais](../artifacts/gates/UI-R3-layout.json) e [baseline](../artifacts/gates/UI-R3-baseline.json).

## Desempenho de produção

Os cinco perfis usaram Chrome 157 headless, Intel Iris Xe, DPR 1, rede CDP de 20 Mbps com latência configurada de 50 ms, 10 s de aquecimento e amostras de 30 s. Foram execuções sequenciais, com contexto novo por perfil. O desktop foi medido em 1440 × 900 e a emulação móvel em 390 × 844. As 1.800 amostras rAF por perfil medem cadência do navegador. Os contadores de renderer e heap têm os limites documentados nos relatórios.

| Perfil | FPS p50 | FPS p10 | Draw calls máximas | Transferência combinada |
|---|---:|---:|---:|---:|
| Rinkaku padrão, desktop | 59,88 | 59,17 | 22 | 479.788 B |
| Fluxo, 500 entidades, desktop | 59,88 | 59,17 | 3 | 494.448 B |
| Tracking, 2.000 entidades, desktop | 59,88 | 59,52 | 4 | 494.448 B |
| Rinkaku padrão, mobile emulado | 59,88 | 59,17 | 22 | 479.788 B |
| Tracking, 500 entidades, mobile emulado | 59,88 | 59,17 | 4 | 494.448 B |

Todos cumpriram os orçamentos originais de interatividade, cadência, draws, payload e estabilidade de recursos. O Rinkaku amostrou as sete fases completas. Os perfis registraram zero erros de execução, requisições falhas ou erros HTTP. Permanece o aviso de depreciação de `THREE.Clock`. O relatório conserva protocolo, configuração, ambiente, limites e resultados por perfil. [Métricas verificadas](../artifacts/gates/UI-R3-performance.json).

Para reproduzir, execute `npm run build` e sirva `npm run preview -- --port 4173 --strictPort`. Configure `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173` para `npm run test:e2e`. Os perfis usam `ATLAS_PROFILE_URL=http://127.0.0.1:4173/atlas`, `node tests/e2e/g3a1-production-profile.js` e `node tests/e2e/g4a1-production-profile.js --count=500`. Acrescente `--tracking`, `--count=2000` ou `--mobile` conforme o perfil. A estação usou `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` apontando para o Chrome instalado.

## Arquivos lidos e integração

Foram lidos `AGENTS.md`, `README.md`, os dez documentos de `ghoul_atlas_ui_redesign` no checkout principal, os aceites UI-R1/UI-R2 e o log de implementação. A integração foi confrontada com `G3A_BLENDER_ANIMATION_CONTRACT` e `G4A_BLENDER_CONTRACT`, especialmente ownership, identidade, animação absoluta e limites de escala. A inspeção de código cobriu `AtlasWorkspace`, `App`, `BodyTools`, `SystemsIndex`, `EvidenceInspector`, `RinkakuControls`, `VascularWorkspace`, estilos base/editoriais/Rinkaku/vascular, stores, suplemento de evidências, interfaces de diagnóstico das cenas, E2E e scripts de perfil afetados.

G4B continua ausente nesta base. O gate preserva a página que informa a indisponibilidade da inspeção celular. O ingresso de modelos Blender finais depende dos contratos de assets e de uma entrega licenciada concreta.

## Limites

Esta entrega é P1 de interface e está sujeita à revisão visual humana. As células RC, trajetórias e sete fases da manifestação continuam modelos visuais identificados. As capturas móveis usam emulação. A validação em telefone físico e o fechamento amplo de acessibilidade e desempenho pertencem ao UI-R4. Não houve publicação deste gate.
