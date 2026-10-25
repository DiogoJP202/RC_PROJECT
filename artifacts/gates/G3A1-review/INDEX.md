# G3A.1 — Pacote de revisão visual

24–25/10/2026, America/Sao_Paulo. **Implementação e validação técnica concluídas; aprovação artística humana pendente.** Trabalho local sobre `main` / `84e6e1f36b8558d225ae4baf82a8f79ddb35c124`, sem commit, push ou deploy. G2B/G3B/G4 não iniciados.

Aplicação de produção: [127.0.0.1:4173](http://127.0.0.1:4173/), botão **Manifestar**. A bancada continua em [assets=lab](http://127.0.0.1:4173/?assets=lab). Esses endereços dependem dos servidores locais em execução.

## Revisão compacta

| Painel — pixels da aplicação real | Avaliação |
|---|---|
| [01 — Sete fases antes/depois](01-seven-phases-before-after.png) | Mesma câmera, `t`, quatro apêndices, seed17, padrão/partículas, corpo opaco e viewport/DPR |
| [02 — Implantação lombar antes/depois](02-implantation-before-after.png) | Foco idêntico em crescimento `.530`, ativo `.900` e retração `.980` |
| [03 — Oito frames de crescimento](03-growth-before-after.png) | `.350/.400/.450/.500/.550/.600/.650/.700`; último frame já é fixação |
| [04 — Retração quadro a quadro](04-retraction-before-after.png) | `.950/.960/.970/.980/.990/.995/1`; stills não medem cadência |
| [05 — Ativo: 1–4 apêndices e três vistas](05-counts-and-views.png) | Posterior, lateral e oblíqua, `.900` |
| [06 — Mobile antes/depois](06-mobile-before-after.png) | 390×844 e 430×932, `.530/.900`; câmera/layout alterados intencionalmente |
| [07 — Crescimento: quantidades e vistas](07-counts-growth-views.png) | 12 combinações em `.530` |
| [08 — Retração: quantidades e vistas](08-counts-retraction-views.png) | 12 combinações em `.980` |

Desktop: **25 pares** com câmera/t/configuração/opacidade iguais até `1e-6`; mobile: quatro pares com t/configuração/viewport iguais e novo enquadramento declarado. [Manifesto de fontes, recortes, hashes e verificações](compositions.json). Apenas recorte, redução, organização e legenda; nenhuma pintura, imagem generativa ou render externo.

## Fontes completas

| Fase | t | Captura real do viewport |
|---|---:|---|
| Repouso | .040 | [rest.png](phases/rest.png) |
| Ativação | .140 | [activation.png](phases/activation.png) |
| Liberação | .275 | [release.png](phases/release.png) |
| Crescimento | .530 | [growth.png](phases/growth.png) |
| Fixação | .760 | [fixation.png](phases/fixation.png) |
| Ativo | .900 | [active.png](phases/active.png) |
| Retração | .980 | [retract.png](phases/retract.png) |

- Crescimento: [t.350](growth/t0350.png), [t.400](growth/t0400.png), [t.450](growth/t0450.png), [t.500](growth/t0500.png), [t.550](growth/t0550.png), [t.600](growth/t0600.png), [t.650](growth/t0650.png), [t.700](growth/t0700.png).
- Retração: [t.950](retraction/t0950.png), [t.960](retraction/t0960.png), [t.970](retraction/t0970.png), [t.980](retraction/t0980.png), [t.990](retraction/t0990.png), [t.995](retraction/t0995.png), [t1](retraction/t1000.png).
- Raízes: [ativação](roots/t140.png), [liberação](roots/t275.png), [crescimento](roots/t530.png), [fixação](roots/t760.png), [ativo](roots/t900.png), [retração](roots/t980.png).
- Ativo com quatro apêndices: [posterior](counts/4/posterior-active.png), [lateral](counts/4/lateral-active.png), [oblíqua](counts/4/oblique-active.png). Todos os 36 caminhos/poses ficam em [implantation-views.json](../../g3a1/implantation-views.json).
- Scrub `.700→.200→.700→.300→.700`: [antes](revisit/t0700-before.png), [revisitado](revisit/t0700-after.png); câmera, pose, raízes e UUIDs reproduzíveis. [Fronteiras e sequências](../../g3a1/sequences-and-boundaries.json).
- Mobile em **reprodução real**: [390px](mobile/390-playing.png), [430px](mobile/430-playing.png). Ativo: [390px](mobile/390-active.png), [430px](mobile/430-active.png). Controles: [390px](mobile/390-controls.png), [430px](mobile/430-controls.png). Metadados [390](../../g3a1/mobile-390.json) / [430](../../g3a1/mobile-430.json) registram `playing=true` e t antes/depois da captura.
- Referências móveis congeladas: [G3A 390 crescimento](before/mobile/390-growth.png), [G3A.1 390 crescimento](after/mobile/390-growth.png), [G3A 430 ativo](before/mobile/430-active.png), [G3A.1 430 ativo](after/mobile/430-active.png). Demais caminhos e câmera em [comparison-captures.json](comparison-captures.json).
- Regressões G1/G2A desta execução: [regression/gates](regression/gates/). Originais históricos restaurados byte a byte; [auditoria](../../g3a1/final-audit.json).

## Filme, medições e parecer

[Filme real: ciclo, retração lateral/oblíqua e reverso](playback-and-reverse.webm). Ciclo posterior observado em 21.093 ms; lateral/oblíquo `.93→1` em 4.281/4.261 ms; reverso completo em 21.117 ms. Sem aceleração, scrub injetado durante reprodução ou frames sintéticos. [Amostras e erros](comparison-captures.json); [frames extraídos do vídeo](film-frames/) e [proveniência](film-frames/manifest.json). `elapsedSeconds` e `t` permanecem fontes distintas com mapa invertível; 21 s / 3,4 s são durações nominais do transporte.

- [Relatório crítico](REPORT.md): materiais, iluminação, implantação, fases, deformações, limites e problemas conhecidos.
- [Inventário e responsabilidades](INVENTORY.md); [registro técnico completo](../../../docs/G3A1_REFINEMENT.md).
- [134 unidades / 22 Python / catálogo / TypeScript / lint / build](../../g3a1/checks.json); [40 E2E aprovados](../../g3a1/e2e-results.json).
- [Dez ciclos reais](../../g3a1/compat-ten-playback-cycles.json), [dez manuais + remontagens](../../g3a1/compat-ten-cycles.json), [804 poses offline](geometry-review.json), [restauração proxy/GLB](../../g3a1/presentation-restoration.json).
- Benchmarks novos: [G3A congelado](../../g3a1/baseline-standard-fresh.json), [G3A.1 padrão](../../g3a1/production-standard.json), [econômico](../../g3a1/production-low.json), [mobile emulado](../../g3a1/production-emulated-mobile-standard.json).
- Reprodução do pacote: [captura comparativa/filme](capture-comparison.mjs), [compositor](compose.py), [diagnóstico offline](analyze-geometry.mjs), [extração de frames reais](extract-film.ps1), [auditoria de preservação](audit.py).
- [Verificação final do pacote](verify-package.json): oito painéis e 29 pares verificados, zero links quebrados, PNG da revisita byte a byte idêntico, quatro perfis aprovados e 146 arquivos históricos preservados. [Script de conferência](verify.py).

O refinamento remove o remendo rosa e a sobreposição grosseira nas poses inspecionadas, separa ativação/liberação e melhora o aproveitamento móvel. Ainda há bordas de implantação, facetas, acabamento procedural e distinção sutil entre fixação/ativo. Contato aproximado ao proxy, sem solver de colisão/pele; GLB final e celular físico continuam pendentes. Nenhuma dessas provas equivale a aprovação artística, anatomia final ou nova afirmação canônica. **PROXY / CONCEPTUAL MODEL / hypothetical_model.**
