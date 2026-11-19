# PROMPT INICIAL PARA CODEX — UI-R0, SOMENTE AUDITORIA E PLANO

Estamos reformulando integralmente a apresentação do Ghoul Atlas, mas **não** os motores de simulação.

A UI atual parece genérica/gerada automaticamente: slogans sem utilidade, informação espalhada, três colunas que reduzem o palco 3D, inconsistência entre Corpo e Micro, pouca identidade de Tokyo Ghoul e nenhuma vitrine convincente. A estética científica é boa e deve ser mantida com mais personalidade, precisão e hierarquia.

Leia integralmente este pacote `00`–`07` e `AGENTS.md`. Confira o Git e a árvore de trabalho. O checkpoint público conhecido é `1bcecb0f...`, **mas pode haver G4B local em andamento**. Não sobrescreva alterações não commitadas.

Audite os componentes, CSS, rotas, stores, câmeras, GLB, E2E e estados reais. Compare com as capturas de referência do usuário. Pesquise, quando possível, as fontes externas do arquivo `07`. Produza documentação de design e plano de migração com:
1. Inventário de páginas, componentes, estilos e conteúdos que devem ser substituídos/refatorados.
2. Matriz `estado atual → estado novo`, distinguindo fluxos existentes de futuros.
3. Fluxos e wireframes desktop/mobile (landing, Corpo, Rinkaku, Micro e Celular se já existir).
4. Uma direção de arte única, design tokens, tipografia e sistema de evidências integrado.
5. Microcopy final, sem slogans e sem fantasia de ser site oficial CCG.
6. Estratégia para criar a vitrine/landing com mídia real do projeto.
7. Plano por gates UI-R0…UI-R4 e riscos do G4B em andamento.
8. Plano de testes de regressão e captura antes/depois.

**Nesta primeira execução não modifique código nem CSS. Não publique nada.** Entregue um plano preciso e critérios de aceite, e pare para revisão.
