# 06 — Redesign incremental sem regressão

## Ordem recomendada

| Gate | Entrega | Não fazer | Aceite |
|---|---|---|---|
| UI-R0 | Inventário, screenshot baseline, rotas/estados, conflito com G4B, plano | Modificar UI ou engines | Diagnóstico claro, plano aprovável |
| UI-R1 | Vitrine e design tokens, componente de demonstração isolado | Refazer Body/Micro | Home convincente e original, textos definitivos; sem regressão |
| UI-R2 | Novo shell do observatório (header/stage/rail/inspector) | Alterar sampler/câmera de forma oculta | Stage dominante, estado preservado, G1/G2A/G3A compatíveis |
| UI-R3 | Migração Micro, Rinkaku, G4B se existir, timeline e evidências | Recriar engines 3D | Visuais consistentes, seleção e retorno intactos |
| UI-R4 | Mobile, teclado, acessibilidade, motion, testes visuais e performance | Declarar P2 anatômico | Mobile 390/430 sem overflow; performance dentro orçamento |

## Segurança de integração
- `git status` antes de começar. Não usar `reset --hard`, não substituir trabalho local G4B.
- Se G4B estiver em execução, aguardar checkpoint ou usar branch/worktree sem arquivos compartilhados conflitantes.
- Criar baseline de telas: home atual (ou ausência), Corpo repouso, Rinkaku ativo, Micro tracking, Comparar placeholder, mobile e modal.
- Congelar IDs existentes (`data-testid`) até migração de testes; acrescentar novos identificadores, não alterar sem mapa.
- Nenhuma mudança em `src/simulation/*` nem em contratos de assets sem justificativa técnica explícita e testes.
- Preservar `bodySceneBridge`, `vascularClock`, `rinkakuClock`, seleção, `Esc`, estado de câmera, GLB lease e fallback.
- Evitar refetch/reinicialização WebGL ao abrir/fechar inspector e drawers.
- Guardar lado a lado screenshot antes/depois com mesmo estado/câmera.
- Preservar testes existentes, não reduzir cobertura para adaptar layout.

## Critérios quantitativos propostos
- Em desktop 1440×900, área principal de visualização ≥65% da largura útil no estado normal; corpo não menor que a proporção atual no mesmo zoom.
- O modelo deve ocupar ~60–75% da altura útil em vista geral quando anatomia permitir; não confundir orientação de câmera com alteração de escala real.
- Sem scroll vertical da página inteira em workspace desktop por conta de três painéis; painéis podem rolar individualmente ou se sobrepor conforme necessidade.
- Timeline aparece exclusivamente em contexto que tenha processo temporal funcional.
- Títulos não colidem com a geometria, seleção nem avisos.
- No mobile, palco antes de descrições longas; bottom sheet tem navegação, foco e dismiss acessíveis.
- Performance dentro dos budgets já aprovados: não introduzir custo WebGL permanente na Home por acidente; preservar lazy load e measure novamente.
- Indicadores de evidência e status do modelo continuam visíveis e corretos, sem criar selo de `official` só pelo layout.

## Aceite qualitativo (revisão humana)
- Sem frases de efeito desnecessárias.
- É claro imediatamente o que o site faz e qual caminho seguir.
- O universo Tokyo Ghoul está presente por vocabulário, organização e atmosfera, não só por um logotipo.
- As cenas são o foco da tela; ações aparecem onde são relevantes.
- A navegação Corpo → Rinkaku → Micro → Body continua previsível.
- As pendências P2 aparecem discretamente e são explicadas onde o usuário precisa.
- Antes da integração definitiva, o resultado é **P1 de interface**, não arte anatômica P2.

## Release
Não aplicar redesign na URL de produção sem revisão das capturas desktop/mobile, regressões e aceite. Trabalhar em branch de feature; PR e deploy de preview somente quando autorizado e seguro.
