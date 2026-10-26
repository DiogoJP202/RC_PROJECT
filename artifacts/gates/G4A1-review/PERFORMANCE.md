# G4A.1 — Desempenho antes/depois

Doze contextos novos e sequenciais, mesmo hardware/seed/configuração. 10 s de aquecimento + 30 s de amostra. Budgets anteriores preservados.

| Modo / células | FPS p50 antes → depois | FPS p10 antes → depois | Draws antes → depois | Budgets |
|---|---:|---:|---:|---|
| Fluxo / 100 | 59,88 → 59,88 | 59,52 → 59,52 | 3 → 3 | Todos aprovados |
| Fluxo / 500 | 59,88 → 59,88 | 59,52 → 59,52 | 3 → 3 | Todos aprovados |
| Fluxo / 2000 | 59,88 → 59,88 | 59,52 → 58,82 | 3 → 3 | Todos aprovados |
| Tracking / 100 | 59,88 → 59,88 | 59,52 → 58,82 | 3 → 4 | Todos aprovados |
| Tracking / 500 | 59,88 → 59,88 | 59,52 → 58,82 | 3 → 4 | Todos aprovados |
| Tracking / 2000 | 59,88 → 59,88 | 59,52 → 58,82 | 3 → 4 | Todos aprovados |

[Dados, deltas, ambiente e logs de origem](../../g4a1/performance-comparison.json).

Entrada Micro mede sempre o perfil padrão 500 antes da mudança para a população ensaiada. Contadores pertencem ao renderer Micro; Body continua residente. O marcador acrescenta um draw em Tracking. UUIDs estáveis não demonstram ausência universal de leaks.

FPS usa percentis do inverso dos intervalos requestAnimationFrame, não tempos GPU. Uma execução por versão/caso, sem significância estatística; o limite do monitor pode esconder diferenças de margem GPU. Cache HTTP desativado não equivale a esvaziar caches do sistema operacional. CDP 50 ms é configuração, não RTT físico medido. Não há validação de telefone físico.
