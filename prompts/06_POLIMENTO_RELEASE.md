# PROMPT G7 — Auditoria de qualidade, performance e release

Leia `AGENTS.md`, `docs/08_QUALITY_ASSURANCE.md`, `docs/07_ASSET_PIPELINE.md`, ADRs, inventário e todo o implementation log. **Execute somente G7.**

Faça um ciclo real de QA: typecheck/lint/unit/build/e2e; smoke em browsers disponíveis; screenshots desktop e mobile; testar teclado/reduced-motion/WebGL disabled; registrar números **medidos** de fps/desenho/transferência, com máquina e modo de teste. Corrija assets gigantes, vazamentos, materials recriados, update React por frame e falhas de conteúdo. Implemente loading e fallback se faltar. Auditoria de licenças: nenhum screenshot de Cyberpunk e nenhum modelo comercial em `public/`.

Entregue `docs/RELEASE_REPORT.md` com features, evidência de cada gate, links local/deploy quando de fato disponíveis, limitações, modelos proxy pendentes, riscos autorais e próximos passos. Gere build reproduzível. Pare, e recomende próximo módulo pelo backlog.
