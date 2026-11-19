# 02 — Direção de produto: Atlas / Dossiê / Investigação

## Ideia
**Ghoul Atlas — Arquivo Anatômico**. Um arquivo de investigação fictício, tecnicamente rigoroso, visualmente influenciado pela atmosfera de Tokyo Ghoul, mas sem simular um arquivo oficial da CCG. O rigor deve aparecer em IDs, fontes, diagramas, descrições e rastreabilidade, não em falas crípticas.

## Os dois ambientes

### A. Vitrine / Home
Não é uma tela com três barras de ferramenta. É uma introdução editorial e objetiva:
- Marca Ghoul Atlas + selo `Projeto independente · Tokyo Ghoul`.
- Hero com 3D real (ou poster autoral fallback) ocupando 55–70% do palco; título informativo `Atlas anatômico ghoul`.
- Frase única de valor concreta: `Explore células RC, kakuhou e kagune em modelos 3D interativos. As representações hipotéticas são identificadas.`
- CTA primário `Abrir observatório`; secundário `Ver estudos`.
- Três módulos comprovadamente existentes: Anatomia; Manifestação Rinkaku; Transporte de células RC. O G4B só aparece como ativo após validação.
- Abaixo: `Como funciona`, `Base factual e reconstruções`, `Fontes/Créditos`.
- Sem mensagens que insinuem exclusividade científica ou autenticidade oficial da CCG.

### B. Workspace / Observatório
O palco 3D é o produto. Navegação sobre o palco e painéis progressivos. Modos de trabalho: `Anatomia` (corpo); `Simulações` (Rinkaku); `Microescala` (Vascular/RC, Celular quando existir). `Comparar` só ocupa espaço na navegação quando G6 for funcional.

## Novo mapa
```
/                      Apresentação / vitrine
/atlas                 Observatório · Anatomia
/atlas/rinkaku         Observatório · manifestação (reusa Body)
/atlas/vascular        Observatório · microcirculação
/atlas/cell/:entityId  Observatório celular (somente após G4B)
/estudos               Catálogo de módulos / demonstrações realmente disponíveis
/fontes                Metodologia, classes de evidência, fontes, autoria/licenças
```
Rotas são objetivo de IA; escolher solução compatível com Vite/React existente, sem forçar nova biblioteca caso routing leve resolva.

## Navegação sempre compreensível
Topo compacto: marca → `Atlas` `Estudos` `Fontes` → ícone de ajuda.
Dentro do atlas: breadcrumb `Atlas / Corpo / Rinkaku` + seletor contextual de escala. Não acumular navegação global e três barras de status.

## Progressão
Usuário novato: abre vitrine → visualiza Corpo → seleciona região lombar → aciona `Simular Rinkaku` → segue `Circulação RC` → seleciona célula → entra em observatório celular (se disponível) → retorna.
Usuário recorrente: acesso direto a `/atlas/rinkaku` ou `/atlas/vascular`, bookmarks e back.

## A CCG como referência, não camuflagem
Vocabulário e iconografia originais de dossiê, classificação, identificação e procedência. `CCG` aparece como organização do universo na seção de contexto/lore; não chamar o próprio produto de `CCG Official Data`. Nada de copiar emblemas, cartões, arte ou UI oficial sem licença.
