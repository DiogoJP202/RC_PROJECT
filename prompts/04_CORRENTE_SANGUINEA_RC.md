# PROMPT G4 — Viajar para dentro da corrente sanguínea

Leia `AGENTS.md`, `docs/02_EXPERIENCE_STORYBOARD.md`, `docs/04_SIMULATION_SPEC.md`, `docs/03_TECHNICAL_ARCHITECTURE.md` e G2/G3. **Execute somente G4.** Crie uma cena de vaso estilizado (desenho didático) com hemácias e células RC instanciadas seguindo trajetórias/splines; câmera pode seguir uma RC e passar para objeto micro 3D manipulável. A transição corpo→vaso→célula deve ter retorno para o foco original.

O modelo celular é `SCHEMATIC / CONCEPTUAL`; não invente organelas oficiais nem diametro exato. Separe modo RC **esquemático** e **interpretação**; incluir legenda com nível de certeza. Nada de centenas de componentes React por partícula: `InstancedMesh` ou shader/buffer; instâncias selecionáveis com ID coerente.

Crie toggles de contagem 100/500/2000, benchmark e fallback se recurso insuficiente. Testes de fluxo independente de FPS e retorno. Screenshots `vessel`, `RC focused`, `micro`. Atualize log e pare em G4.
