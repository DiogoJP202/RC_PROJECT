# UI-R5 — Identidade artística do Ghoul Atlas

Proposta para uma etapa de direção de arte sobre a UI-R4. O produto continua sendo um atlas anatômico ficcional independente. Sua assinatura visual combina o kakugan, o enquadramento de um espécime em observação e uma página de arquivo legível. A ordem das rotas, as ferramentas, as simulações e os rótulos de evidência da UI-R4 são a base desta etapa.

## Marca e repertório

- Desenhar um olho geométrico original. Usar dois arcos desiguais para a abertura, um disco carmim deslocado para a íris e dois cantos abertos da retícula para sugerir enquadramento. A retícula é parte da silhueta do símbolo, sem cruz sobre a pupila. Isso diferencia a marca tanto do átomo atual quanto de um ícone de mira. O kakugan é uma referência de forma e cor ao fenômeno ficcional descrito no glossário. [Glossário oficial do anime, verbete 赫眼](https://www.marv.jp/special/tokyoghoul/first/glossary.html)
- Entregar símbolo vetorial SVG, assinatura horizontal com “Ghoul Atlas”, versão monocromática e favicon com favicon SVG e exportações de 16 e 32 px. Na variante de 16 px, reduzir a geometria a um arco, íris e um canto de enquadramento. Aprovar a leitura em fundos claro e escuro e em cores forçadas. A marca no cabeçalho mantém o link acessível para o início.
- Usar o contraste entre a silhueta humana e a matéria orgânica do Rinkaku como ponto de partida artístico. Na arte própria, isso vira enquadramento parcial, luz lateral, preto quente e vermelho concentrado no tecido. Na UI, leva a uma legenda de medição com informação real. Tratar as capas e o artbook como repertório para estudar contraste e composição. Registrar autoria e licença de cada SVG e imagem no inventário do projeto. [Catálogo oficial da VIZ e artbook *zakki*](https://www.viz.com/tokyo-ghoul)

## Tipografia

Manter as famílias IBM Plex locais, com papéis mais claros. Usar **Plex Sans Condensed Semibold** na assinatura e nos títulos. Compor a abertura da Home em 48–72 px no desktop e 36–44 px no mobile, com quebra planejada. Usar **Plex Sans** em 16 px e entrelinha 1,5 no corpo. Atribuir **Plex Mono** de 11–12 px a IDs, tempo e valores de cena. Rótulos de ações seguem em Sans, a partir de 14 px. Na implementação, conferir acentos em títulos condensados, texto selecionável e tamanhos sob reflow. As famílias e a licença já constam no inventário. [Proveniência de assets](../public/ASSET_LICENSES.md)

## Paleta proposta para adoção

| Papel | Cor | Aplicação |
|---|---|---|
| Fundo | `#100D11` | Vitrine, cabeçalho e área fora do palco |
| Superfície | `#1A151B` | Fichas, folhas móveis e metodologia |
| Superfície elevada | `#241D25` | Controles e menus |
| Marfim | `#F0EBE4` | Texto primário e CTA sobre carmim profundo |
| Cinza de texto | `#B7AEB6` | Legendas, descrição e fonte secundária |
| Divisória / borda de controle | `#443942` / `#877681` | Primeiro tom para separação decorativa. Segundo para identificar limites interativos |
| Carmim | `#E47784` / `#762735` | Claro para íris e acento RC. Profundo para ação de destaque com texto marfim |
| Foco/seleção | `#A6C8C2` | Foco de teclado e seleção neutra |
| Modelo conceitual | `#DAB47C` | Aviso com texto e símbolo, acompanhado de sua classificação |

Em cores planas, marfim sobre carmim profundo dá **8,39:1**. Sobre a superfície elevada, marfim dá **13,86:1**, cinza **7,63:1**, carmim claro **5,69:1**, foco **9,13:1** e borda de controle **3,87:1**. Esses pares são uma triagem de tokens. Medir novamente em estados reais com foto, foco, transparência, desabilitado e cores forçadas. O carmim claro é usado sobre as superfícies escuras neutras. Manter texto, posição e ícone para que a cor não carregue sozinha o sentido.

## Aplicação

| Superfície | Intervenção proposta |
|---|---|
| Vitrine | Dar à captura autoral do Rinkaku cerca de 60% da composição desktop. Recortar uma vista oblíqua do próprio renderer com o apêndice e a conexão lombar legíveis. Usar área de sombra contínua atrás do texto. No mobile, reservar enquadramento vertical próprio, com o CTA visível na primeira tela em 390 e 430 px. Fornecer imagem responsiva com proporção reservada e legenda HTML “Modelo conceitual · Rinkaku, vista oblíqua”. |
| Home e Estudos | Uma única chamada primária “Abrir observatório”. Texto da Home “Inspecione o kakuhou, reproduza a manifestação Rinkaku e acompanhe células RC em modelos 3D conceituais.” Organizar as três experiências do índice com título, uma ação e uma descrição que informe o que se pode observar. Remover `01–03`, numeração dos itens e o rótulo “Manifestação” repetido antes de “Manifestação Rinkaku”. |
| Fontes | Manter as seis classes em linguagem direta. Hierarquizar título, resumo do alcance e bibliografia. Acrescentar acesso por âncora às referências e dar mais peso aos títulos. Reservar mono para datas e localizadores curtos. Deixar notas históricas acessíveis sob “Registro de conferência”, com a procedência e a afiliação independente visíveis. |
| Corpo, Rinkaku e Micro | Aplicar a marca, o mesmo cabeçalho, tratamento de títulos, bordas de painel e hierarquia dos botões. Deixar o palco dominante. Corpo recebe cinza neutro na UI, Rinkaku usa o carmim na ação de simulação, Micro usa o acento clínico para acompanhamento. A diferenciação continua legível em monocromia. Concentrar a retícula na marca e no enquadramento do pôster, sem ornamentar o canvas. |
| Fichas e ferramentas | Manter “Estrutura” e “Evidências” com a mesma linha de base. Usar o nome da seleção como título de leitura, a procedência logo abaixo e rótulos de controle em Sans. Manter os avisos de escala, modelo e fonte nos pontos de decisão. |
| Comparar e inspeção celular | Aplicar o mesmo estado de indisponibilidade às rotas existentes, com a margem do editorial, título sucinto e uma ação funcional. Para Comparar, “Comparação indisponível” e “Voltar ao atlas” ocupam o lugar da bancada vazia, das etiquetas do gate e do status impróprio de carregamento. Para celular, “Inspeção celular indisponível” e “Voltar ao fluxo”. Manter ambos fora da lista de experiências disponíveis. Deixar falhas recuperáveis, como ausência de WebGL, com tratamento distinto e a ação existente de tentar novamente. |

## Sequência e critérios de aceite

1. Aprovar duas composições do mesmo símbolo, assinatura e favicon em tamanho real. Conferir silhueta própria, contraste, ausência de formas proprietárias e proveniência.
2. Aprovar Home 1440 × 900, 390 × 844 e 430 × 932 com foto autoral responsiva, CTA acessível e microcopy acima. Manter a entrada fria da Home em **até 500 KiB**, com zero WebGL e zero requisições de catálogo, GLB ou renderer. Usar o estado e o contrato de performance de [UI-R1](UI_R1_ACCEPTANCE.md).
3. Aplicar os tokens no shell, no editorial, nas fichas e nos estados indisponíveis. Capturar os mesmos ângulos e poses desta revisão para comparação. Verificar palco desktop ≥65% da largura, zero overflow horizontal nos dois viewports móveis, alvos principais de 44 px, contraste de texto comum ≥4,5:1, controles e foco ≥3:1, movimento reduzido e preservação das rotas e do retorno de contexto. [W3C: contraste de texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) e [contraste de controles](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
4. Repetir typecheck, lint, unidades, catálogo, build e suíte E2E. Rodar a auditoria de acessibilidade e comparar os perfis de produção com os orçamentos de [UI-R4](UI_R4_ACCEPTANCE.md). Conferir por diff os motores, cenas, pipelines GLB, estados e contratos de evidência. Encaminhar os comparativos para avaliação humana de composição, assinatura e linguagem.

A execução futura cabe em uma branch `codex/ui-r5` na pasta principal, depois da integração e revisão da base. O resultado esperado é uma identidade mais própria sobre a interface P1. A anatomia e as simulações continuam com as divulgações de modelos conceituais já previstas.
