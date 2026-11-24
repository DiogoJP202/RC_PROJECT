# PROMPT PARA APÓS APROVAÇÃO DO UI-R0 — UI-R1 INCREMENTAL

O plano UI-R0 foi aprovado. Execute **apenas UI-R1**: tokens de design, componentes-base compartilhados, reescrita da microcopy da home e criação de uma vitrine navegável do Ghoul Atlas.

Requisitos:
- Antes de escrever: `git status`, avaliar G4B WIP; desenvolver em branch/worktree segura sem reescrever outro trabalho.
- Reusar recursos originais do projeto: 3D real se apropriado, ou captura autoral com aviso `modelo conceitual`; não criar mock de biomodelo apresentado como real.
- Home: nome, descrição factual, CTA abrir atlas, três experiências funcionais, metodologia de evidências, créditos. Não apresentar Comparar/G4B como pronto sem implementar.
- Definir tokens CSS e tipografia coerente; evitar componentes ad hoc que criem segundo design system.
- Não alterar samplers nem clocks, camera contexts, loader GLB, instancing ou picking.
- Preservar navegação antiga funcional; URLs antigas devem continuar operando.
- Capturas reais desktop 1440×900 e mobile 390×844 antes/depois, sem colisões ou overflow.
- Verificar TypeScript, lint, unitários, Python/catalog, build e E2E completos; medir custo incremental se carregar WebGL na Home.
- Classificar P1 UI vs P0/P2 anatomia separadamente.
- Criar documento de implementação/aceite `docs/UI_R1_ACCEPTANCE.md` e registrar riscos.
- Sem G4B, G5, G2B, G3B, deploy ou push automático.
- **Pare em UI-R1**, apresente screenshots, decisões e falhas para revisão humana.
