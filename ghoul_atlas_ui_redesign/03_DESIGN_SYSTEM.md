# 03 — Sistema visual: Forensic / Organic / Editorial

## Princípio
**Institucional na estrutura; orgânico na matéria; silencioso na interface.** Evitar neon em todos os componentes, contornos finos por toda parte, mini-etiquetas redundantes e gradientes gratuitos. O vermelho pertence à biologia, não a todos os botões.

## Tokens sugeridos (hipóteses de design; validar contraste e acessibilidade)
| Token | Hex | Papel |
|---|---|---|
| ink | `#0B0E10` | Fundo geral |
| surface | `#14191C` | Painel/contexto |
| elevated | `#1D2427` | Elementos elevados |
| paper | `#E8E5DD` | Texto primário |
| muted | `#A5A8A7` | Texto secundário |
| trace | `#394144` | Divisória discreta |
| rc-crimson | `#A8293B` | Estado/tecido RC/ação de manifestação |
| rc-deep | `#5C1621` | Sombras orgânicas |
| clinical | `#9AB9B4` | Seleção e inspeção neutras |
| hypothesis | `#C6A16B` | Incerteza/hypothetical |

Preferir 80% grafite/off-white, 15% cinzas/neutros e 5% acentos variáveis. Não usar crimson para status de sucesso; não codificar evidência somente por cor.

## Tipo
- Marca/display: sans condensada com personalidade discreta, por exemplo IBM Plex Sans Condensed ou Barlow Condensed; sem misturar serif editorial aleatória na tela de operações.
- Corpo: IBM Plex Sans / Inter com 14–16 px desktop, line-height 1.45–1.6.
- Dados: IBM Plex Mono 10–12px *somente* para IDs, labels, coordenadas e status.
- Escala: display 40–56 (vitrine), h1 workspace 24–30, h2 18–22, legenda 12–13. Não usar tagline de 42 px sobre o 3D.
- Famílias devem ter licença adequada e carregamento local/remoto revisado; não anexar arquivos de fonte sem autorização.

## Composição
- Header global 56–64px.
- Stage desktop ocupa idealmente 70–80% da largura em repouso, 60–68% com inspector aberto.
- Painel esquerdo: rail de ícones ou drawer 240–280px somente ao explorar índice/camadas.
- Inspector direito: drawer de 320–380px, fechado por padrão, aberto após seleção; pode sobrepor borda do palco em vez de encolhê-lo permanentemente.
- Stage sem títulos gigantes e avisos flutuando no centro. Toolbar mínima de câmera/visão no canto inferior.
- Timeline contextual dockada na base do palco apenas em simulações com tempo.
- Vitrine usa composições mais abertas e sem sidebar permanente.

## Movimento
- Troca de seleção: foco curto (250–500ms, reduzido conforme preferências), destaque e atualização da ficha.
- Entrada micro: troca de escala declarada sem sugerir zoom contínuo real.
- Camadas: opacity/dissolve sutil e reutilização da geometria.
- Nada de glitch intermitente, ruído animado gratuito, texto revelado letra a letra ou scanlines intensas.

## Componentes
`AtlasHeader`, `StageFrame`, `AnatomyRail`, `ExplorerDrawer`, `AnatomyInspector`, `EvidenceSheet`, `SimulationTransport`, `ModelDisclaimer`, `StageToolbar`, `ExperienceCard`, `Breadcrumbs`, `EmptyState`.

## Governaça visual
Manter `CANÔNICO`, `BASE HUMANA`, `HIPÓTESE`, `NÃO CONFIRMADO`, `MODELO CONCEITUAL` como informações reais. Mostrar um selo sucinto no stage e detalhes em ficha; disclaimer não deve dominar cada viewport. O filtro de cânone tem explicação acessível e não remove avisos do modelo.
