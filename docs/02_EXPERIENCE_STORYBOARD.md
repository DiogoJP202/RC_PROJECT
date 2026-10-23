# 02 — Roteiro de experiência e estados de câmera

## Mental model

O usuário não visita páginas desconectadas: examina **o mesmo espécime** em escalas distintas. Mudanças de estado devem preservar contexto (`specimen`, `system`, `selectedAnatomy`, `layer`, `simulationProgress`) quando fizer sentido. A câmera é ferramenta narrativa, não um zoom aleatório.

## Estrutura desktop 1440×900 (direção, não grid rígido)

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│  RC OBSERVATORY     SPECIMEN / GHOUL-R       BODY  MICRO  COMPARE    [?]        │
├───────────────┬───────────────────────────────────────┬────────────────────────┤
│ SYSTEM INDEX  │  3D STAGE                              │  ANALYSIS / EVIDENCE   │
│               │                                        │                        │
│ ○ Anatomical  │          [ FULL BODY ]                 │  KAKUHOU / RINKAKU    │
│ ○ Vascular    │       live / orbit / focus              │  location & function   │
│ ○ RC Network  │                                        │  claims / source tags  │
│ ● Kakuhou     │             ● HOTSPOT                  │                        │
│ ○ Kagune      │                                        │  RC reserve [sim]      │
│ ○ Sensory     │         [ layer controls ]             │  inspect / isolate     │
│ ○ Compare     │                                        │  source & uncertainty  │
├───────────────┴───────────────────────────────────────┴────────────────────────┤
│   PLAY ▷    ◀  ━━━━━●━━━━━━━━━━━━━  ▶  00:01 / 00:02    RESET     SOURCE STATUS│
└────────────────────────────────────────────────────────────────────────────────┘
```

Objetivo: corpo ocupa preferencialmente **60–75% da altura útil do palco**, e não 20% como ocorre em dashboards que gastam espaço com cartões. Camada de UI legível sobre cena sem ocultar órgãos.

## Telas/estados

**S0 BOOT_SCAN:** cena imersa em baixa luz, corpo neutro, linha de scan curta. Entrada automática opcional; botão `PULAR INTRO`; `prefers-reduced-motion` mostra resultado estático.

**S1 BODY:** câmera corpo inteiro 3/4; seleção de tipo `RINKAKU` e sistema. A lista destaca hotspots equivalentes. Hover preview não provoca jump de câmera.

**S2 REGION_FOCUS:** dolly para lombar, tronco vira foco; pele desbotada localmente ou isolada; rótulo do kakuhou + origem da evidência. Seleção mantém caminho de volta.

**S3 ORGAN_INSPECTION:** kakuhou isolado/levemente expandido em exploded view. Se anatomia interna não é canon, overlay: `RECONSTRUÇÃO CONCEITUAL` persistente.

**S4 VASCULAR_STREAM:** câmera muda para uma cena otimizada com vasos estilizados, RC e hemácias. Não extrapolar dimensões verdadeiras de RC.

**S5 RC_MICRO:** segue partícula selecionada; transfere foco para objeto ampliado; rota de retorno preservada; rótulos `CONCEITUAL` e `CANON` próximos ao dado correspondente.

**S6 KAGUNE_MANIFEST:** troca foco para o corpo/região; `t` controla fase; câmera não gira arbitrariamente durante scrub. Controles: play, pause, scrub, reverse, reset, velocidade (não canônica), isolamento.

**S7 COMPARE:** humano/ghoul mesmo tamanho, escala e ângulo; mostrar diferença só onde documentada.

## Transições recomendadas

| De → para | Câmera | Efeito | Tempo de design | Falha/reduced motion |
|---|---|---|---|---|
| S0→S1 | dolly de corpo | scan + linhas finas | 0,8–1,5s | corte sem scan |
| S1→S2 | orbitar ~30° + aproximar lombar | partes periféricas diminuem contraste | 0,7–1,1s | câmera instantânea |
| S2→S3 | aproximar 1 estrutura | isolamento + escala local | 0,6–0,9s | dissolve rápido |
| S3→S4 | travessia via portal de seção | mudança discreta de cena | 0,9–1,4s | tela de corte com contexto |
| S4→S5 | acompanhar objeto selecionado | DOF *opcional* e ampliação | 0,7–1,3s | troca imediata de escala |
| S5→S6 | retorno por breadcrumb | reconstrução do contexto | 0,7–1,0s | corte sem travelling |

Tempos cinematográficos sugeridos, **não tempos de fisiologia canon**. Prefira timeline reversível/interruptível; novos cliques cancelam tweens anteriores.

## Ações funcionais mínimas

- `1/2/3`: modos Body/Micro/Compare; `Esc` volta um nível; `R` reseta câmera; `Space` pausa.
- Hotspot 3D tem equivalente via botão HTML na lista; estado selecionado indica foco.
- Zoom e pan limitados para evitar atravessar geometria sem modo de seção.
- Botão evidência mostra URL, nível de certeza, frase e *porque este modelo foi escolhido*.
- `Canon only` **não oculta** obrigatoriamente o 3D conceitual; ele pode dessaturá-lo com aviso claro e remover claims não confirmadas. Não confundir filtro de conhecimento com filtro geométrico.

## Navegação mobile

Palco principal ocupa topo, menu inferior por abas, folha deslizável de análise, timeline compacta sob o corpo. A seleção de órgão deve funcionar sem hover. Reduzir efeitos caros, não ocultar contexto factual.

## Estados de erro e carregamento

- Sem WebGL: ilustração estática/SVG com índice anatômico e conteúdo textual.
- Falta de asset: anatomia proxy com selo e descrição.
- 3D indisponível, mas conteúdo carregado: nunca tela branca.
- Fontes externas offline: manter títulos e status sem alegar verificação remota instantânea.
