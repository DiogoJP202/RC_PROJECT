# G4A.1 — Revisão comparativa real

Capturas pareadas produzidas. Aprovação artística humana pendente. Nenhuma referência externa ou render gerado é apresentado como resultado da aplicação.

Seed17, perfil500, RC 'rc:17:0', hemácia 'rbc:17:1'. Cenas estáticas usam os mesmos comandos públicos e valores de timeline. As poses e dimensões efetivamente medidas determinam se o enquadramento é equivalente; mudança de câmera não é ocultada.

| Vista | G4A antes | G4A.1 depois | Comparabilidade |
|---|---|---|---|
| Visão geral | [Antes](before/overview.png) | [Depois](after/overview.png) | 4.00s · câmera equivalente |
| RC selecionada / cor e marcador | [Antes](before/rc-selected.png) | [Depois](after/rc-selected.png) | 11.00s · enquadramento diferente; ver metadados |
| Tracking / oclusão | [Antes](before/tracking-occlusion.png) | [Depois](after/tracking-occlusion.png) | 20.00s · enquadramento diferente; ver metadados |
| Close da hemácia | [Antes](before/rbc-closeup.png) | [Depois](after/rbc-closeup.png) | 11.00s · enquadramento diferente; ver metadados |
| Parede vascular | [Antes](before/wall.png) | [Depois](after/wall.png) | 4.00s · câmera equivalente |
| Desktop / realce didático | [Antes](before/desktop.png) | [Depois](after/desktop.png) | 11.00s · enquadramento diferente; ver metadados |
| Mobile390 | [Antes](before/mobile.png) | [Depois](after/mobile.png) | 11.00s · enquadramento diferente; ver metadados |

[Composição comparativa com as capturas reais](comparison-contact.svg) · [Conferência de enquadramento e hashes](comparisons.json)

[Metadados antes](before/captures.json) · [Metadados depois](after/captures.json)

[Vídeo real de tracking, pelo menos42s de reprodução](after/tracking-42s.webm) · [Metadados da reprodução](after/playback.json)

| Frame real durante a gravação | Timeline observada antes → depois da captura | Identidade |
|---|---|---|
| [tracking-01.png](after/sequence/tracking-01.png) | 0.104s → 0.348s | rc:17:0 |
| [tracking-02.png](after/sequence/tracking-02.png) | 6.570s → 6.798s | rc:17:0 |
| [tracking-03.png](after/sequence/tracking-03.png) | 12.448s → 12.675s | rc:17:0 |
| [tracking-04.png](after/sequence/tracking-04.png) | 18.435s → 18.675s | rc:17:0 |
| [tracking-05.png](after/sequence/tracking-05.png) | 24.355s → 24.608s | rc:17:0 |
| [tracking-06.png](after/sequence/tracking-06.png) | 30.288s → 30.507s | rc:17:0 |
| [tracking-07.png](after/sequence/tracking-07.png) | 36.201s → 36.410s | rc:17:0 |
| [tracking-08.png](after/sequence/tracking-08.png) | 42.631s → 42.887s | rc:17:0 |

O vídeo inclui navegação. Os PNGs são capturas reais durante a mesma reprodução; tempos do arquivo de vídeo e da timeline não são intercambiáveis. Esta gravação não mede FPS.

A oclusão da vista pareada foi escolhida por raycast real do centro no baseline, quando disponível, e repetida no mesmo tempo depois. Isso não equivale a uma fração de superfície visível. O diagnóstico atual usa a malha real e registra frações separadas. Contato entre células e visibilidade integral não são garantidos.

Mobile é emulado com GPU da estação. Perfis independentes em 'artifacts/g4a1/' registram custo de Fluxo e Tracking separadamente; contadores Micro não somam o Body residente nem medem VRAM. 'readyMs' mede a entrada padrão500.

Os materiais antigos de G4A permanecem preservados em [G4A-review](../G4A-review/INDEX.md). Implementação G4B, metabolismo e anatomia RC final continuam fora deste pacote.

## Relatórios e provas

- [Parecer crítico e inventário](REPORT.md)
- [Comparação de desempenho](PERFORMANCE.md) e [dados dos doze perfis](../../g4a1/performance-comparison.json)
- [Estudo estático](../../g4a1/occlusion-study.json) e [reprodução suavizada](../../g4a1/playback-occlusion-study.json)
- [Comandos finais](../../g4a1/checks.json), [62 E2E completos](../../g4a1/e2e-full.json) e [seis cenários rechecados após o ajuste de layout](../../g4a1/e2e-refinement-final.json)
- [Preservação do histórico](../../g4a1/history-preservation.json), [saneamento com backups](../../g4a1/evidence-sanitization.json) e [auditoria final](../../g4a1/final-audit.json)
- [Decisões e limites](../../../docs/G4A1_REFINEMENT.md)

Quadros decodificados do vídeo: [15 s](after/decoded/video-15.png), [30 s](after/decoded/video-30.png), [45 s](after/decoded/video-45.png). Esses tempos pertencem ao arquivo de vídeo; a timeline observada está nos próprios frames. [Proveniência da decodificação](../../g4a1/video-decoding.json).
