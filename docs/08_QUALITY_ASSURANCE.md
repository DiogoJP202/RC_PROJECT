# 08 — Critérios de qualidade e plano de verificação

Codex deve tornar o projeto inspecionável. A aprovação depende de evidência e a avaliação final do usuário, especialmente na direção de arte.

## Funcional

- [ ] Abrir site não requer login e não resulta em tela branca se WebGL estiver desativado.
- [ ] Corpo pode orbitar, zoom com limites, reset de câmera e foco em kakuhou.
- [ ] Seleção via lista e via geometria 3D produz o mesmo `anatomyId` e painel.
- [ ] Layers/isolate/canon filter operam de fato e têm feedback do estado.
- [ ] Timeline Kagune roda, pausa, volta e faz scrub para qualquer posição sem acumular deformações.
- [ ] Retornar do modo micro mantém o mesmo espécime e o foco relevante.
- [ ] Presets alteram uma única fonte de simulação compartilhada.
- [ ] Layout mobile utilizável por toque; não exigir hover.

## Evidência e conteúdo

- [ ] Todos os claims principais possuem status de evidência público.
- [ ] Oficial possui origem identificável e verificação registrável; segunda mão nunca vira `official` automaticamente.
- [ ] Modelo hipotético exibe disclaimer persistente.
- [ ] Célula RC não tem organelas inventadas rotuladas canônicas.
- [ ] Números de simulação não parecem RC Factor científico e nenhuma relação linear RC→força é vendida como canônica.
- [ ] Cada asset público tem origem/licença documentadas.

## Visual

- [ ] Screenshot no viewport 1440×900: corpo legível e centrado; lado esquerdo/direito não sobrepõem pontos de interesse.
- [ ] Screenshot no viewport 390×844: acesso a sistemas, ação principal e status de fonte sem clipping.
- [ ] 3 estados rinkaku documentados com frame/timestamp reproduzível.
- [ ] HUD não é cópia de Cyberpunk; identidade de análise anatômica distinta.
- [ ] Organismo é visivelmente tridimensional; não só ícone de stock ou imagem de fundo.
- [ ] Aviso de placeholder (se houver) é visível para o usuário final.
- [ ] Transição entre corpo e micro comunica mudança de escala e tem volta clara.

## Acessibilidade / UX

- [ ] Foco de teclado visível; lista alternativa a picking por mouse.
- [ ] Nome acessível em botões e inputs; contraste e indicadores redundantes à cor.
- [ ] `prefers-reduced-motion`: sem fly-through longo nem pulsação obrigatória; controles funcionam.
- [ ] Slider com aria label e teclado; valores de simulação bem rotulados.
- [ ] Erros de carregamento dão alternativa e contexto; ausência de textura não trava UI.

## Performance (medida real, não autodeclaração)

| Métrica | Como medir | Meta inicial |
|---|---|---|
| FPS Body desktop | Performance profiler com máquina/browser anotados | ~50–60 FPS após aquecimento |
| FPS mobile reduced | mesmo, dispositivo real preferido | >= 30 FPS quando possível |
| Draw calls | `renderer.info.render.calls`/dev stats | objetivo inicial <150 no Body |
| Transferência inicial | DevTools rede sem cache | objetivo <=8 MB de assets iniciais comprimidos |
| Tempo até interação | marca performance antes de primeiro controle responsivo | objetivo <=5s desktop/rede estável |
| Estabilidade | 10 ciclos da timeline / ida e volta de modo | sem leak aparente, WebGL/context errors |

Esses são objetivos a serem recalibrados com medição, não SLA garantido. Reportar equipamento e contexto para evitar números falsos.

## Roteiro E2E manual/Playwright

```text
1. load / ; assert stage + heading
2. choose Rinkaku; click Kakuhou in DOM list
3. confirm corresponding 3D selection and inspector
4. isolate; reset; verify layer visibility
5. set progress to .2, .7, .3; confirm sampling reversible
6. enter vessel; select RC; enter micro; return
7. canon-only; assert experimental claims are marked/filtered appropriately
8. enable reduced motion and play; assert no disorienting camera travel
9. resize 390x844; repeat a subset via touch/click
10. simulate unavailable model/WebGL and verify fallback
```

Automação deve ser isolada de indisponibilidade de API externa; sistema é local.

## Checklist por gate

- [ ] `npm run typecheck` concluído.
- [ ] `npm run lint` concluído.
- [ ] `npm run test` concluído.
- [ ] `npm run build` concluído.
- [ ] Fluxo em browser conferido (ou limitação documentada).
- [ ] Screenshots reais existentes em `artifacts/gates/`.
- [ ] `IMPLEMENTATION_LOG.md` preenchido com mudanças/limitações.
- [ ] Novos fatos geográficos/biológicos devidamente rotulados.
