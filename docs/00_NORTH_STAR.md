# 00 — North Star: o que estamos construindo

## Premissa de produto

Um terminal de **diagnóstico biológico experimental** abre um espécime ghoul 3D. O visitante vê um corpo aparentemente humano, escaneia e atravessa seus sistemas para entender diferenças anatômicas e funcionamento das RC. O design inspira-se no princípio 'corpo como mapa' de Cyberpunk, mas a linguagem própria é de laboratório, microscopia e arquivo forense.

**Proposta de nome de trabalho:** `GHOUL ATLAS / RC OBSERVATORY`. Não use logotipos oficiais da CCG; prefira instituição ficcional original, por exemplo `OBSERVATORY / RESEARCH DIVISION`.

## A fatia vertical — sequência demonstrável de 90 segundos (alvo narrativo)

1. **Boot / scan**: tela escura; scanner percorre um corpo neutro; aparece `RC ACTIVITY DETECTED` e interface se organiza.
2. **Body**: corpo 3D rotativo, camadas anatômicas alternáveis, menu de sistemas e cartão de evidência científica.
3. **Kakuhou**: clique na zona lombar de espécime `RINKAKU`; câmera aproxima, camada cutânea é isolada ou cortada; surge organela conceitual com identificação explícita.
4. **RC Path**: a UI passa para modo vascular, com células circulantes estilizadas; clique em uma partícula RC.
5. **Microscopy**: transição de escala para cena de capilar com hemácias e células RC; célula ampliada se torna objeto manipulável (morfologia interna hipotética quando houver).
6. **Manifestation**: retorno ao kakuhou; timeline de 0–100%; RC migra visualmente para raiz, 1–4 apêndices rinkaku manifestam com deformação progressiva e endurecimento aparente.
7. **Compare & evidence**: visitante alterna `canônico`/`modelo conceitual` e lê fontes, sem sair da experiência.

## Qualidade que importa

- **Surpresa espacial**: pelo menos 1 aproximação/viagem de câmera compreensível; não um `zoom: scale(10)`.
- **Coerência de luz e materiais**: escultura ou proxy renderizado com orientação volumétrica, não UI flutuando num fundo escuro com humano genérico minúsculo.
- **Funcionalidade verificável**: cada botão visível faz algo real e é consistente ao voltar/reabrir.
- **Ciência epistemicamente honesta**: cada sistema distingue fato, inferência e representação.
- **Iteração guiada por screenshots**: o Codex deve produzir evidências visuais para o usuário avaliar.

## Público e prioridade de dispositivos

Primário: desktop 1366–1920 px, mouse e teclado, desempenho WebGL razoável. Secundário: tablet/mobile com qualidade reduzida, fluxo preservado via painéis e botões. Primeira versão em português brasileiro; arquitetura de conteúdo preparada para tradução.

## MVP inclui

- Interface diagnóstica original, acessível e responsiva.
- 1 espécime neutro, **1 tipo rinkaku**; camadas base com asset real ou proxy identificado.
- Seleção de hotspot do kakuhou, foco de câmera, painel de fonte.
- 1 sistema de partículas/fluxo RC em ambiente vascular separado.
- 1 célula RC ampliável (modelo interpretativo identificado).
- 1 manifestação de kagune, timeline pausável/reversível.
- 1 comparação de estado `human / ghoul`, sem inventar anatomias onde inexistem.
- Fallback WebGL e modo `reduced-motion`.

## Fica fora do MVP

Atlas completo de todos os órgãos, 4 kagunes finais, Kakuja, Quinx detalhado, regeneração complexa, batalhas, autenticação/contas, CMS, multiplayer, VR, dados médicos reais, CFD de sangue e reconstruções histológicas apresentadas como canon. Esses módulos têm backlog em `09_NEXT_MODULES.md`.

## Antiobjetivos

- Landing page de marketing em vez de experiência interativa.
- 50 cartões de conteúdo e um personagem estático.
- Simulações com números falsamente oficiais.
- Prometer rigor anatômico usando geometria procedural abstrata não rotulada.
- Reproduzir exatamente a disposição, iconografia e lettering de Cyberpunk.
