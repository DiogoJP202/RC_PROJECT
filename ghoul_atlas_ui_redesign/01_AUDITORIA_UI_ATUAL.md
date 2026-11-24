# 01 — Auditoria UI/UX da versão atual

## Fonte da revisão
Cinco capturas fornecidas pelo usuário: (a) observatório Corpo com três colunas, (b) Rinkaku ativo, (c) Micro circulação, (d) Comparar ainda em desenvolvimento, (e) modal Ajuda. Código inspecionado na `main`: `src/app/App.tsx`, `src/ui/SystemsIndex.tsx`, `src/ui/EvidenceInspector.tsx`, `src/ui/RinkakuControls.tsx`, `src/ui/Timeline.tsx`, `src/ui/vascular.css`, `src/app/types.ts`, `AGENTS.md`.

## Problemas por impacto

| Prioridade | Sintoma nas capturas | Causa provável | Direção |
|---|---|---|---|
| P0 | Palco 3D espremido entre duas barras grandes | Layout fixo de 3 colunas e cabeçalhos redundantes | Palco dominante; ferramentas recolhíveis; painel contextual |
| P0 | Não existe uma página de apresentação convincente | A aplicação abre direto no workspace diagnóstico | Landing/capa de produto distinta; CTA para atlas |
| P0 | Sem relação emocional clara com Tokyo Ghoul | Linguagem sci-fi genérica; quase tudo nomeado como sistema técnico | Dossiês, terminologia correta, variação de espécimes, tags de obras e fontes |
| P0 | Frases de efeito ocupam títulos de componentes | Textos autorais sem função, ex. `O corpo como mapa.` | Nomes precisos, localização e estado |
| P1 | Todas as informações têm o mesmo peso | Etiquetas, status e disclaimers em toda a área | Hierarquia semântica com níveis de divulgação |
| P1 | Aba Comparar dá acesso a placeholder de G6 | Navegação promove função não entregue | Tirar do fluxo principal ou marcar claramente como prévia/indisponível |
| P1 | Corpo manequim pequeno em zoom geral | Palco dividido e câmera encolhida para acomodar textos | Hero visual com enquadramento protagonista |
| P1 | Abas Corpo/Micro/Comparar são perspectivas e produtos misturados | Arquitetura de navegação orientada ao código, não à tarefa | Atlas / Estudos / Fontes; troca de escala contextual |
| P1 | Micro usa fonte serifada editorial e controles densos, Corpo outra linguagem | `vascular.css` define estilo paralelo | Tokens/componentes compartilhados; editorial só na vitrine |
| P1 | Informação sobre forma provisória repetida em vários pontos | Governança factual aparece como decoração em vez de sistema | Selo discreto persistente + detalhes em inspector/fontes |
| P1 | Timeline fixa ocupa altura mesmo na inspeção simples | Estado de player exibido em todos os contextos | Player contextual só quando há processo temporal |
| P2 | Micro mobile ocupa espaço excessivo | Ordenação vertical e avisos longos | Priorizar palco + toolbar inferior + drawer de informações |
| P2 | Ajuda/modal apresenta slogan em destaque | Voz de marketing em recurso de utilidade | Título `Controles e navegação` + tabela clara |

## Problemas específicos de copy
- "O corpo como mapa." → "Estruturas anatômicas" ou "Sistema anatômico".
- "O que nos torna diferentes?" → "Espécime 001 — Ghoul / Rinkaku".
- "Matéria em movimento." → "Manifestação do Rinkaku".
- "Uma corrente. Muitas histórias." → "Circulação e células RC".
- "Por dentro da corrente." → "Transporte vascular · visualização conceitual".
- "Explore. Questione. Confira a evidência." → "Controles e navegação".
- "Evidência verificada" em toggle solto → "Somente fontes confirmadas" com definição e escopo explícitos.

## O que manter
Preservar engines, sampler determinístico, `instanceId → entityId`, estados persistidos Body/Micro, seven-phase Rinkaku, GLB/rig/socket, keyboard/reduced motion, filtros editoriais, créditos/licenças, performance e testes. O redesign é de apresentação/fluxo, não de biologia.

## Pendência de evidência
As capturas não representam necessariamente o último estado local de G4B; confirmar branch, diffs e componentes existentes antes de migrar.
