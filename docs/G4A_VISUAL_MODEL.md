# G4A — Modelo visual e governo das evidências

25/10/2026. Documento da implementação local, com evidências automatizadas, perfis de produção e revisão visual técnica produzidos. Após a revisão do pacote, o usuário aprovou G4A/G4A.1 como P1 suficiente para checkpoint; arte/anatomia final P2 permanece pendente. Resultados e limites de cada verificação estão no [aceite](G4A_ACCEPTANCE.md) e a decisão atual no [checkpoint](G4A_CHECKPOINT.md). [Design](G4A_ENGINE_DESIGN.md) e [contrato futuro](G4A_BLENDER_CONTRACT.md).

> **Revisão atual G4A.1:** refinamento local tecnicamente validado com 203 unidades, 22 Python e a suíte completa de 62 E2E; os mesmos seis cenários de refinamento foram rechecados e passaram após o CSS final, sem somá-los como testes distintos. TypeScript, lint, catálogo e build passaram. Materiais, seleção, enquadramento adaptativo e composição foram refinados; fontes, sampler, identidades e escala celular foram preservados. Consulte [G4A1_REFINEMENT](G4A1_REFINEMENT.md), o [pacote final de capturas/vídeo G4A.1](../artifacts/gates/G4A1-review/INDEX.md) e o [comparativo de desempenho](../artifacts/gates/G4A1-review/PERFORMANCE.md), com 12 perfis aprovados nos budgets originais. A pendência humana P1 existente no encerramento técnico foi resolvida pela aprovação atual do usuário, com limitações aceitas; arte final P2 continua pendente. As execuções registradas terminaram sem commit, push ou deploy.

## O que a cena representa

O interior vascular é um ambiente didático original: parede curva com relevo discreto, material PBR e iluminação de leitura. O circuito fechado permite acompanhar uma entidade sem teleporte na emenda. Não é um segmento clínico identificado, rede vascular completa, artéria/veia/capilar em escala validada ou CFD. Proporções, rugosidade e iluminação são escolhas de apresentação.

Hemácias usam a referência humana de disco bicôncavo, com centro rebaixado e borda mais espessa; a malha precisa demonstrar volume nas vistas frontal/oblíqua/lateral. A depressão visual não deve parecer um furo atravessando a célula. Não se reproduzem figuras, fotografias ou meshes de livros. A forma procedural é uma simplificação, sem solver de deformação celular.

Células RC têm desenho autoral distinto das hemácias, sem organelas identificadas, núcleo canônico inventado ou dimensão micrométrica. Cor, superfície e destaque didático pertencem a `hypothetical_model`. O destaque RC não descreve fluorescência biológica. Quantidades, velocidades e escalas relativas são controles da animação, não concentração, fator RC ou medida clínica.

O marcador vascular Body é aproximado e deve permanecer rotulado. A entrada usa aproximação cinematográfica e troca controlada de cena, sem prometer zoom físico contínuo ou tamanho real RC. O inspector acompanha a entidade e conserva a classificação da afirmação quando a câmera muda.

## Fontes primárias consultadas nesta execução

| Fonte direta / data | Locator efetivamente conferido | Uso limitado |
|---|---|---|
| [OpenStax, Anatomy and Physiology 2e — 18.3 Erythrocytes](https://openstax.org/books/anatomy-and-physiology-2e/pages/18-3-erythrocytes), 25/10/2026 | Abertura; Shape and Structure of Erythrocytes, parágrafo de discos bicôncavos e legenda Figure18.6 | Referência humana de forma/função geral de hemácias; não valida a malha, escala artística ou RC |
| [OpenStax — 20.1 Structure and Function of Blood Vessels](https://openstax.org/books/anatomy-and-physiology-2e/pages/20-1-structure-and-function-of-blood-vessels), 25/10/2026 | Shared Structures: lumen; Tunica Intima: primeiro parágrafo sobre endothelium | Referência humana de passagem/revestimento interno; não identifica um vaso específico nem sua geometria |
| [Young Jump — 資料集 / 喰種](https://youngjump.jp/tokyoghoul/tg/data/), 25/10/2026 | Seção 喰種（グール）, parágrafo que menciona Rc細胞 e 赫包 | Menção oficial ao acúmulo RC no kakuhou, sem autenticar forma ou circulação RC |
| [Young Jump — 資料集 / 赫子](https://youngjump.jp/tokyoghoul/tg/data/index02.html), 25/10/2026 | Seção 赫子（かぐね）, descrição de RC exteriorizadas e comparação ao sangue | Consulta de escopo: a comparação descritiva do kagune não comprova transporte intravascular fisiológico RC |

A consulta foi textual às páginas diretas. Não foram inspecionados painéis de mangá nesta pesquisa e não se adquiriu licença para reproduzir suas imagens. Os resumos são autorais e não incorporam figuras, fotografias, texturas ou modelos de terceiros. Nenhuma busca em fandom foi usada como comprovação de cânone.

## Classes por afirmação

| Grupo | Classe | O que pode ser comunicado |
|---|---|---|
| Forma/função geral RBC e lúmen/revestimento vascular | `real_anatomy` | Contexto humano textual, com fonte e limites de representação |
| RC mencionadas/acumuladas no kakuhou | `official` | Somente a proposição limitada do guia conferido |
| Forma RC, realce, trajetórias, proporções e perfis | `hypothetical_model` | Interpretação visual didática, permanentemente rotulada |
| Histologia, escala exata e dinâmica vascular RC | `unknown` nas fontes consultadas | Lacuna desta consulta; não afirmar inexistência em toda a obra |
| Painéis ou mecanismos não conferidos | `manga_needs_verification` quando incorporados futuramente | Nunca promover a `official` para justificar uma animação |

O suplemento `src/content/vascularEvidence.ts` reutiliza os tipos editoriais existentes, com fronteira executável e namespace próprios. Fontes possuem URL, tipo, data de consulta, locator e nota. Claims oficiais/humanos exigem fonte elegível conferida; hipóteses exigem disclaimer. A malha continua conceitual mesmo quando o cartão associado contém um fato verdadeiro. `public/catalog.json` não é alterado por esta extensão.

## Direção e inspeção visual exigidas

A leitura deve priorizar profundidade do vaso, biconcavidade RBC e distinção RC; reflexos e realce não podem encobrir a forma. Evitar parede plástica uniforme, brilho excessivo, rotação contínua de brinquedo ou composição de aquário. O movimento é suave, tangente ao percurso e limitado ao interior por bounds conservadores.

Inspecionar fluxo livre e tracking em reprodução e quadro estático, inclusive a emenda do circuito e seleção ausente ao mudar perfil. Testar enquadramento sem parede atravessar a câmera, sem inversão inesperada e sem usar colisão numérica de centros como prova de contato de toda a célula.

Mobile exige célula selecionada e controles legíveis, alternativas HTML para seleção, toque ≥44px e ausência de overflow horizontal. Emulação não certifica GPU nem ergonomia de um telefone físico. Reduced motion mantém inspeção por passos e mudanças de câmera sem viagem obrigatória.

**Registro visual histórico G4A:** o [pacote G4A](../artifacts/gates/G4A-review/INDEX.md) e o [relatório crítico](../artifacts/gates/G4A-review/REPORT.md) documentam materiais/parâmetros, capturas, movimento e correções daquela apresentação. O destaque dourado de seleção reduzia a leitura de relevo em algumas poses, sobretudo no centro bicôncavo e nos lóbulos RC; oclusões por células em primeiro plano também persistiam, inclusive no mobile. Essa observação explica o refinamento posterior e permanece como evidência histórica.

No G4A.1, a seleção conserva a cor-base RBC/RC e usa arcos externos com depth test, sem raycast próprio nem alteração da identidade selecionada. Materiais celulares e parede têm brilho reduzido; iluminação mais distribuída e título compacto liberam a leitura do palco. O relevo amplo da parede é autoral e cresce para fora, sem transformar a superfície em histologia de endotélio. Nada disso autentica forma ou anatomia RC.

O planejamento de tracking considera volumes próximos e o cone de visão, preservando as trajetórias. A suavização acompanha a deriva da entidade e limita as correções de câmera; poses estáticas são reconstruídas pelo tempo absoluto. A avaliação de visibilidade usa uma grade9×9 sobre a silhueta real, com raycasts contra triângulos de células/parede. É um diagnóstico amostral separado do benchmark de FPS, sem equivalência a área exata de pixels. As comparações precisam declarar diferenças de câmera causadas pela adaptação.

A identidade e os cartões permanecem disponíveis, mas isso não garante visibilidade integral da entidade selecionada. Células podem se interpenetrar por ausência de solver físico, e esferas conservadoras podem indicar proximidade/sobreposição da câmera no perfil denso; gap negativo não prova interseção da superfície real. Essas limitações e a emulação mobile continuam explícitas no [pacote G4A.1](../artifacts/gates/G4A1-review/INDEX.md), cujos pareceres preservam a pendência humana existente quando foram produzidos. A decisão atual de aceitar o P1 está registrada separadamente no [checkpoint](G4A_CHECKPOINT.md); as evidências históricas não foram alteradas para simular essa aprovação.

As correções de fechamento para liberar Flow/Tracking preservando a pose e para impedir movimento residual dos controles em reduced motion pertencem à integração de câmera. Não mudam a forma celular, o sampler ou a interpretação factual. Sua regressão final deve ser lida no aceite; os metadados do pacote preservam o momento das capturas.

O usuário aprovou o pacote G4A/G4A.1 como P1 suficiente, aceitando parede esquemática, marcador fino/sutil, hemácia simplificada e composição mobile apertada como limitações não bloqueadoras. A decisão encerra este refinamento sem abrir G4A.2. Não valida histologia ou escala RC e não elimina as limitações documentadas.

P2 permanece dependente de assets Blender próprios/licenciados, revisão de topologia/normais/materiais e bounds, integração pelo pipeline existente e nova revisão humana no renderer web. Evidência técnica, métricas de um equipamento e emulação mobile não substituem essa homologação. G4B é a próxima fase planejada e ainda não iniciada; seu futuro escopo e suas afirmações exigirão delimitação e evidência próprias.
