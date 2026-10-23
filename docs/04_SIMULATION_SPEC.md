# 04 — Contratos de simulação: clareza acima de pseudociência

## Escopo da primeira versão

A primeira experiência deve simular **aparência, fluxo e estados de animação**, não fisiologia quantitativa validada. Não tentar CFD, mitose molecular real ou biomecânica de tecido mole de laboratório na web inicial. Mostrar métodos visuais e respectivas incertezas.

### Fonte de verdade e escalas

- `rcFactor`: número descritivo vinculado a fonte, quando verificado; não é unidade física internacional nem energia do usuário.
- `rcReserve`: float didático 0..1; fração de reservatório disponível **na nossa simulação**.
- `metabolicLoad`: float didático 0..1, proxy de atividade da animação.
- `hunger`: float didático 0..1.
- `integrity`: float didático 0..1.
- `kagunePhase`: enum + progresso 0..1.
- `confidence`: qualidade de evidência do mecanismo exibido.

A regra de ouro é separar "a obra mostra que X acontece" de "nossa interpolação para animar X funciona assim".

## A — Circulação sanguínea e partícula RC (MVP)

**Dados:** splines de vasos didáticos, `flowSpeed`, `seed`, `instancingCount`, raio visual (não escala médica de RC). Para hemácias, usar modelos esquemáticos razoáveis; para RC, morfologia visual derivada de descrições e **sem inventar organelas canônicas**.

**Loop:** escolher curva, distribuir `u_i=(i/n + offset(seed,i)) mod 1`, posição pelo Catmull-Rom/spline em `u`, deslocamento lateral suave precomputado ou ruído temporal barato. Amostrar tangente e alinhamento. Ao selecionar RC, duplicar instância como objeto destacado/focus (ou outline por instanceId) e oferecer `follow`.

**Como evitar 'visão aquário':** velocidade coerente com direção, parallax de vasos e partículas em primeiro e segundo planos; sem turbulência tão grande que células atravessem paredes. A escala do vaso é ilustrativa.

**Gate:** 100, 500 e 2.000 partículas não reconstroem React tree; frame rate medido; o clique em uma RC sempre mostra o mesmo registro de evidência.

## B — RC em microescala (MVP)

**Modos:** `diagrammatic` com célula esquemática, `interpretive` com superfície orgânica, estruturas internas explicitamente hipotéticas. Cada legenda tem selo próprio. Controle de rotação e escala; botão de volta. Na ausência de material autorizado, renderizar modelo original estilizado e avisar.

**Microinterações:** oscilação discreta, foco nas bordas, comparação com hemácia humanizada, ligação visual entre células (modo `STRUCTURAL ASSEMBLY`) com linhas/volumes; cada uma é conceptualização, não histologia oficial.

## C — Kakuhou (MVP)

**Confirmado no universo:** órgão/bolsa associado a armazenamento RC e produção de kagune; localização regional correlacionada ao tipo. **Não confirmado:** anatomia histológica das câmaras, vasos exatos, superfícies lobuladas, mecanismo químico dos pulsos.

**Modelo visual proposto:** estrutura sacular original transparente/semipermeável localizada de modo **aproximado** na região lombar para rinkaku, com membranas e pequenos reservatórios; artérias/RC estão marcadas `HYPOTHETICAL VISUAL MODEL` em overlay. Não ocultar incerteza com decoração de laboratório.

**Estados visuais:** `idle` (pulso fraco), `charge` (sinal luminoso), `release` (corrente para a raiz), `post-release` (iluminação reduzida). Pulsação não deve implicar batimento fisiológico canônico.

## D — Rinkaku (MVP)

| Fase | u local | Evento visual | Pipeline sugerido | Natureza |
|---|---|---|---|---|
| rest | 0–0.08 | corpo neutro, raiz recolhida | bone/morph 0 | efeito editorial |
| activation | .08–.2 | kakuhou pulsa, RC converge | emissive uniform + instances | modelo visual |
| release | .2–.35 | partículas emergem | trail/mask | modelo visual |
| growth | .35–.67 | apêndices se alongam | skinned GLB / morph / spline rig | manifestação canon, mecânica inferida |
| fixation | .67–.85 | microescamas e rigidez visual mudam | roughness/normal/shader | inspirado em 'músculo líquido' oficial |
| active | .85–.95 | appendages movem-se com controle | bone rig + secondary motion | modelo visual |
| retract | .95–1 | desaparecem/retornam ao repouso | reverse morph / dissolve | animação conceitual |

Esses intervalos **são coordenadas da timeline cinematográfica**, não segundos biológicos, quantidade de células ou cronologia exata do mangá. `sampleAt(t)` sem estado residual para permitir scrub reversível; fase 'retract' como extensão editorial não é a única trajetória biológica.

**Rig de início:** se asset não existe, protótipo com splines/tubos controláveis e aparência declaradamente esquemática. Contrato de importação para asset final: origin local na região do kakuhou, appendage roots nomeadas, bone indices/morph targets documentados.

**Interações:** explorar animação frame a frame; toggle partículas; mostrar caminho da raiz; isolá-la; rigidez visual slider; trocar câmera lateral/posterior; modo reduced motion com etapas fixas.

## E — Estado fisiológico (MVP tardio)

Não implementar fórmulas do tipo `força = RC × 2`. Usar curvas artísticas explícitas que controlam **efeitos visuais**, não resultados biomédicos. Exemplo: `rcReserve ↑ → brilho e densidade representacional ↑`; legenda `Visualização conceitual — correlação não quantificada pelo autor`.

Entrada/presets:

```text
CALM:      reserve=.75, activity=.10, hunger=.20, integrity=1.0
ACTIVE:    reserve=.70, activity=.80, hunger=.35, integrity=1.0
EXHAUSTED: reserve=.15, activity=.45, hunger=.85, integrity=.72
REPAIRING: reserve=.45, activity=.30, hunger=.55, integrity=.58
```

**Todos os números acima são presets inventados para teste UX**, não RC factors nem valores do mangá. Etiquetar sempre no app.

## F — Módulos futuros: prereqs e cuidados

| Simulação | Entrada | Efeito | Cuidado factual |
|---|---|---|---|
| Ukaku | perfil, modo de disparo, reserve | cristalização/projéteis + gasto qualitativo | custo exato não conhecido |
| Koukaku | rigidez, pose | massa visual + armas/escudo | física de material inventada |
| Bikaku | inclinação/impulso | flexão da cauda + equilíbrio | não prometer dinâmica real |
| Kakugan | trigger, lado | shader ocular e vascular superficial | microhistologia não confirmada |
| Digestão | classe de alimento | estado de tolerância/rejeição ilustrado | enzimas concretas só se documentadas |
| Regeneração | integridade/lesão | camadas de reparo + glow RC | via molecular desconhecida |
| Quinx | frame/limitador | abertura de casing do kakuhou | níveis/capacidades requerem fonte específica |
| Kakuja | histórico narrativo | formação de nova morfologia | não há fórmula automática canônica |

## Contratos de engine

- Todos os parâmetros válidos em domínio documentado; clamp explícito e sem `NaN`.
- `sampleAt(t, state)` função pura ou função de avaliação que não dependa do tick anterior; interpolação temporal no renderer.
- Cenários devem permitir export de JSON para teste/reprodução.
- Do UI para engine: eventos discretos (`SELECT_PRESET`, `SCRUB`, `PLAY`, `PAUSE`, `FOCUS_RC`); do engine para UI: snapshots com baixa frequência, sem feed de 60 FPS.
- Teste propriedade: `sampleAt(0.5)` é igual antes/depois de `sampleAt(0.9)`; `reset` restaura o mesmo frame; slider aceita mouse, toque e teclado.
