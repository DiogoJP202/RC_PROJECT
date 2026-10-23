# Prompt recomendado para a próxima execução — somente G1

Você é lead engineer e technical artist do GHOUL ATLAS. Execute **somente G1**, após ler `AGENTS.md`, `docs/00_NORTH_STAR.md`, `docs/01_ROADMAP_AND_GATES.md` revisado, `docs/02_EXPERIENCE_STORYBOARD.md`, `docs/03_TECHNICAL_ARCHITECTURE.md`, `docs/05_VISUAL_ART_DIRECTION.md` e as entregas G0: `RESEARCH_INDEX.md`, `DECISIONS.md`, `CONTENT_AUDIT.md`, `ASSET_INVENTORY.md`, `IMPLEMENTATION_LOG.md`. Inspecione as três referências privadas apenas para princípios de composição.

Antes de editar, confirme o estado atual e preserve todo o material existente. No G0 não havia `.git`, aplicativo, `package.json`, modelos ou rig; o seed passou no validador mínimo, mas fontes sem conferência e assets sem arquivo não são conteúdo pronto. Não presuma que o estado continua igual.

Construa o primeiro observatório navegável com Vite, React, TypeScript strict, R3F/Drei/Three, Zustand, tokens CSS, Vitest e Playwright, sem backend. Consulte versões/peer dependencies oficiais e registre lockfile; React 19/R3F 9 estáveis foram a direção G0. Evite recursos alpha/WebGPU. Se houver código novo prévio, diagnostique e adapte em vez de sobrescrever.

Primeiro corrija a passagem do catálogo de exemplo para o runtime: uma única origem em `src/content`, validação estrita de estrutura/IDs/enums/referências/câmeras, gate editorial e disponibilidade/proveniência dos assets. Cubra os casos negativos do ADR-012. `official` e fonte/página conferida são estados separados; selos de verificação exigem suporte direto. Use claims e fontes conforme o status registrado em CONTENT_AUDIT; pendentes podem aparecer somente com rótulo explícito, sem promoção a verificado. Não atribua `verifiedAt` a painel que não foi lido. Um proxy procedural deve apontar para gerador real, sem inventar caminho GLB.

Tela: identidade original `GHOUL ATLAS / RC OBSERVATORY`, PT-BR; header compacto com espécime/modos, índice esquerdo, grande palco 3D e inspector direito. Em 1440×900, corpo inteiro ocupa 60–75% da altura útil, com cabeça/pés visíveis e seleção desobstruída. Use iluminação legível que revele o volume e materiais neutros, RC rubro pontual e avisos âmbar, sem copiar cartões/fontes/gauges de Cyberpunk. Não faça landing page ou dashboard de métricas fictícias.

Se continuar sem corpo licenciado, crie manequim autoral volumétrico para provar navegação, com `AssetSlot` e aviso persistente **PROXY / CONCEPTUAL MODEL**. Declare que a arte final/anatomia detalhada continua bloqueada. Anchor lombar é aproximado e ligado a objeto real da cena; seleção pela lista e pelo preview convergem. Implementar orbit limitado, foco torso/lombar, reset e retorno de contexto; cancelar transição anterior quando houver novo foco.

Todo controle ativo precisa ter efeito verificável. Micro/Comparar podem navegar a estado explicativo “Em desenvolvimento” com voltar e preservação do espécime; não fingir cenas prontas. Se timeline estiver ativa no G1, ela controla apenas scan/realce demonstrativo rotulado, com play/pause/scrub reais. Manifestação de kagune é G3. Não implementar ainda engine fisiológica, circulação, organelas RC, quatro tipos ou regeneração.

Em 390×844, palco de referência ≥440 px em fluxo vertical, inspector recolhível, toque sem hover e nenhum scroll horizontal; manter rótulos factuais/asset. Teclado com foco visível e botões HTML equivalentes; atalhos respeitam inputs. Reduced motion usa corte/estados fixos. WebGL/contexto indisponível ou asset ausente deve preservar índice/conteúdo e esquema 2D original.

Crie e rode `typecheck`, `lint`, `test`, `build`, `test:e2e` e smoke do preview. Teste seleção/foco/reset/contexto, teclado, reduced motion, asset ausente e fallback WebGL. Capture **no browser** `artifacts/gates/G1-desktop.png` (1440×900), `G1-mobile.png` (390×844), `G1-silhouette.png` e sequência de scan/foco; inspecione e corrija problemas reais antes da entrega. Sem ferramenta/captura, registre bloqueio; não declare verificação visual.

Registre primeira medição seguindo ADR-011: OS/GPU/browser/DPR/rede, interação inicial, draws, payload e FPS com warm-up/amostra. Emulação mobile valida layout; desempenho mobile real requer hardware anotado. Verifique que build público não inclui `references/private` nem pesquisas integrais.

Atualize `docs/IMPLEMENTATION_LOG.md` com hipótese, arquivos, comandos/exit codes, limitações, capturas e checklist. Reporte **implementado / demonstrado / pendente / testado**, destacando a dependência de arte final. Pare após G1 para revisão humana, sem avançar G2 ou publicar automaticamente.
