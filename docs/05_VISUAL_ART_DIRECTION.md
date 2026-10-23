# 05 — Direção visual: laboratório de ficção científica, não clone de Cyberpunk

## Princípios visuais

1. **Corpo como protagonista:** palco escuro, modelo volumétrico transparente em regiões, recorte de luz frio, pontos RC rubros.
2. **Diagnóstico crível:** desenho técnico/forense com medidas, linhas e indicadores de fonte; sem dashboard de SaaS.
3. **Hierarquia por escala:** olhar corpo → área → órgão → célula; painéis e câmera mudam juntos.
4. **Vivo mesmo em repouso:** respiro, micro movimentos, luz interna discretos, pausáveis.
5. **Epistemologia visual:** cor/selo distinguem `CANON`, `BASE HUMANA`, `INFERÊNCIA`, `RECONSTRUÇÃO`; cor nunca único sinal.

## Paleta original de referência (ajustável)

```text
Background / void      #060B12
Panel / glass dark     #111D28
Panel raised           #182733
Text primary           #E8F0F5
Text secondary         #9CB1BF
Grid / hairline        #28404A
RC crimson             #DC4B5B
Medical cyan           #66D5D0
Hypothesis amber       #E0B46A
Neutral scan blue      #9CB8D8
```

A paleta foi criada para o projeto; não copiar presets de Cyberpunk. Consistência: vermelho = RC/ghoul; ciano = seleção/diagnóstico; âmbar = aviso/hipótese; branco = informação base.

## Tipografia, iconografia e micro detalhes

- Títulos condensados ou técnico-sans legível com licença apropriada; textos longos com sans convencional, métricas com mono tabular.
- Ícones geométricos lineares próprios, hotspots numerados e legendas fora do corpo quando possível.
- Painéis com linhas finas, cantos discretos, fundo 85–95% opaco para leitura; blur caro não deve estar em toda a tela.
- Não usar cartões de perks iguais aos screenshots anexados. A árvore futura pode ser `RC RESEARCH NETWORK` com conexões anatômicas/científicas em vez de árvore de XP.

## Composição 1440×900

- Header com identidade + espécime + modos sem virar menu de RPG.
- Sidebar esquerda ~220–260px; direita ~290–340px; palco usa espaço restante com safe area interna.
- Corpo total ocupa 65% (alvo) da altura do canvas no modo overview. A câmera adapta `bounds`, não hardcode de coordenadas que cortam pés/cabeça.
- Sidebar com 6 grupos no MVP, scroll sem empurrar canvas. Timeline 72–100px na parte inferior.
- `focus region` reduz infos periféricas e dá espaço ao órgão, sem abrir modal dominante sobre o viewport.

## Materiais 3D

- **Pele:** neutral matte/semirrealista, opção ghost local; vasos têm distinção sem super saturação.
- **RC:** forma bio-orgânica original. Em macro, poucas estruturas legíveis; micro, uma célula interpretativa detalhada.
- **Kakuhou:** saco biomaterial (interpretação). Overlay de linhas de seção, não textura de máquina.
- **Rinkaku:** aparência de 'músculo líquido' com superfície úmida + microestruturas, rig e brilho das juntas; evitar simplesmente 4 cilindros vermelhos lisos no entregável final.
- **Pós:** bloom mínimo e controlável, sem embaçar labels/AA; plano de fundo escuro, bom contraste e geometria fácil de ler.

## Qualidade: 3 passes obrigatórios no G1/G3

**Passo 1 — Silhueta:** print sem UI: proporção, enquadramento, contraste e leitura da anatomia. Teste em thumbnails.

**Passo 2 — Interface:** print com UI: textos cabem, seleção óbvia, não esconder partes anatômicas importantes; comparação com objetivos, não com pixels de Cyberpunk.

**Passo 3 — Movimento:** vídeo curto ou sequência de 4 screenshots (`rest`, `release`, `growth`, `active`) com câmera e iluminação consistentes.

## Anti-padrões comuns em sites 3D gerados automaticamente

- Humano pequeno perdido num enorme canvas.
- Paleta de gradiente rosa/roxo e 'glassmorphism' genérico sem lógica anatômica.
- Botões visualmente clicáveis sem ação ou ícones que parecem ser do jogo de referência.
- Transições que trocam tudo de forma abrupta e perdem o objeto observado.
- Milhares de partículas aleatórias vermelhas: movimento sem direção, causa ou vínculo com RC.
- Texto longo flutuando sobre detalhes de órgãos; preferir inspector lateral e breadcrumbs.
- GIF bonito não controlável no lugar de timeline real reversível.

## Artefatos de aprovação

Capturar `artifacts/gates/G1-overview-1440.png`, `G1-mobile-390.png`, `G3-rest.png`, `G3-growth.png`, `G3-active.png`, `G4-micro.png`; usuário decide se a identidade visual está convincente antes de multiplicar features.
