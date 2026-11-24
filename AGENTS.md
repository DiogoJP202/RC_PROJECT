# AGENTS.md — Instruções permanentes para o Codex

Você está construindo **Ghoul Atlas**, laboratório anatômico ficcional e interativo, com UX diagnóstica de ficção científica e base anatômica humana. A documentação em `docs/` é a especificação de produto. Os relatórios de `research/` são materiais de referência e não substituem validação de afirmações.

## Invariantes (não negociáveis)

1. **Nunca invente cânone.** Diferencie `official`, `manga_needs_verification`, `real_anatomy`, `inference`, `hypothetical_model`, `unknown` em cada afirmação científica importante. Fonte direta exigida quando `official`.
2. **Não confunda valor RC, reserva de RC e slider de simulação.** Os fatores RC citados no fandom não criam fórmula quantitativa canônica para força ou regeneração. Variáveis de jogo são normalizadas e rotuladas como simulação.
3. **Não copie a UI de Cyberpunk 2077 ou assets de Tokyo Ghoul.** Imagens em `references/` servem para princípios de composição e interação. Crie nomenclatura, componentes, ícones, materiais, tipografia e layout originais. Não faça scraping de meshes proprietários.
4. **O 3D é uma parte funcional do produto**, não um fundo ilustrativo. Clique/hit test, foco de câmera, isolamento, tooltip e camadas devem apontar para estruturas reais da cena.
5. **Nunca declare completo sem verificação:** `typecheck`, `lint`, `test`, `build`, smoke e captura visual pelo navegador quando houver browser disponível. Registre comandos/resultados concretos.
6. **Sinalize placeholders abertamente.** Malha provisória = `PROXY / CONCEPTUAL MODEL`; nunca sugira que uma esfera transparente seja anatomia de alta fidelidade.
7. **Performance:** simulação de movimento por frame fora do ciclo de `setState` React; usar `useFrame`, referências, buffers e instancing. Evitar alocações por frame, recriação de geometrias/material e todo o modelo carregado de início.
8. **Rigor de escala:** micronização é uma troca controlada de cena, com zoom cinematográfico; não afirme escala real da célula RC nem estruturas intracelulares não descritas pelo mangá.
9. **Inclusão:** navegação por teclado, botões acessíveis alternativos aos hotspots 3D, preferência `prefers-reduced-motion`, e fallback quando WebGL falhar.
10. **Direito de autor:** registre fonte/licença/atribuição para cada asset. Arquivos sem licença clara NÃO entram no build público.

## Ordem de prioridades

`correção factual > funcionamento navegável > legibilidade UX > qualidade visual > efeitos decorativos > volume de recursos`.

Mas não use essa ordem para justificar uma interface feia: a experiência visual faz parte do produto. Se o modelo de qualidade não existir, entregue um protótipo honesto e documente o bloqueio.

## Workflow para cada tarefa

- Trabalhar na pasta principal do projeto, identificada pela primeira entrada de `git worktree list --porcelain`. Se o chat iniciar em um worktree, usar explicitamente a pasta principal como diretório de trabalho.
- Separar tarefas por branches, sem criar novos worktrees ou cópias de desenvolvimento. Ao concluir uma entrega, fazer commit e push na branch de trabalho, preservando alterações de terceiros e sem force push.
- Leia os documentos pertinentes; confirme o estado real do repositório e caminhos antes de propor substituições.
- Explicite no `docs/IMPLEMENTATION_LOG.md`: hipótese, arquivos tocados, riscos, escolhas e limitações.
- Faça alterações pequenas e coesas. Não reescreva tudo porque um módulo precisou ser ajustado.
- Escreva testes de simulação para funções puras; testes de interface para fluxos de navegação, e2e/screenshot para gates visuais.
- Comprove ausência de regressões. Ao final reporte `implementado / demonstrado / pendente / testado`, capturas e métricas quando possíveis.
- Se faltar asset, implemente `AssetSlot`/proxy e contrato claro de entrada, não uma mentira visual.

## Artefatos que cada gate deve entregar

1. Código funcional no repositório.
2. Screenshot `artifacts/gates/Gx-desktop.png` e, quando relevante, mobile.
3. `docs/IMPLEMENTATION_LOG.md` atualizado.
4. Checklist do gate marcado com evidência; não somente autoavaliação verbal.
5. Próximos bloqueios objetivos.

## Sources & content

Links oficiais principais: `https://youngjump.jp/tokyoghoul/tg/data/`, `https://youngjump.jp/tokyoghoul/tg/data/index02.html`, `https://youngjump.jp/tokyoghoul/tg/data/index03.html`, `https://www.marv.jp/special/tokyoghoul/first/glossary.html`.

Ex.: formação de kagune por células RC oriundas do kakuhou = fonte oficial. Lóbulos, artérias exatas, organelas de RC, regras lineares de força = **não confirmadas**. Trate como hipótese ou desconhecido.
