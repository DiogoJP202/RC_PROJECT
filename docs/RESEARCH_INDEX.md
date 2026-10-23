# G0 — Índice das pesquisas e evidências de leitura

Auditoria: **23/10/2026**, fuso `America/Sao_Paulo`. Escopo: entendimento, fontes, contratos, assets e planejamento. Nenhuma implementação G1 foi iniciada.

## Material efetivamente recebido

No primeiro inventário, `research/` continha somente `README_ADICIONE_SEUS_ARQUIVOS.md`. Após a mensagem do usuário informando a inclusão das pesquisas, o inventário foi refeito e os **dois relatórios abaixo foram lidos integralmente**, incluindo diagramas, exemplos técnicos e referências. O antigo README já não estava na pasta; esta auditoria não o removeu.

| ID | Caminho real | Formato / extensão | Cobertura | Data identificável |
|---|---|---|---|---|
| R1 | [Anatomia e fisiologia dos ghouls em Tokyo Ghoul.md](../research/Anatomia%20e%20fisiologia%20dos%20ghouls%20em%20Tokyo%20Ghoul.md) | Markdown, 876 linhas, 71.002 bytes | Lore, anatomofisiologia, RC, kakuhou, kagune, digestão, reparo, híbridos, patologias e capítulos candidatos | Sem data de autoria declarada; modificação local em `2026-10-23T16:19:16.5775926Z` |
| R2 | [Atlas Anatômico Interativo de Tokyo Ghoul.md](../research/Atlas%20Anat%C3%B4mico%20Interativo%20de%20Tokyo%20Ghoul.md) | Markdown, 1.179 linhas, 37.377 bytes | Experiência, composição, escalas, simulação visual, VFX, arquitetura, performance e candidatos a assets | Sem data de autoria declarada; modificação local em `2026-10-23T16:32:38.2406506Z` |

Datas de filesystem não comprovam data de pesquisa ou de consulta às fontes. As linhas se referem exatamente aos arquivos desta auditoria, sem reformatá-los.

SHA-256:

```text
R1 5360bf58168343e595a62111f9a6dc20fc3dfd09ba327d1897c021c7a93b6c9d
R2 543f6556ac31e0db7dc380b6a4b934125edbfcbd8305849cd570b6c7499d7389
```

Não há `research/previous-pack/`, ZIP ou conjunto anterior de bíblias no inventário atual. Os links `sandbox:/mnt/data/...` ao final de R2 (linhas 1.143–1.164) descrevem material de outra sessão; **não equivalem a arquivos disponíveis neste workspace**.

## Passagens úteis por tema

| Tema | R1: seção / linhas | R2: seção / linhas | Tratamento no projeto |
|---|---|---|---|
| Célula RC, fator e reserva | Células RC e kakuhou, 89–132 | Células RC, 95–131; quantidade, 701–728 | Separar identidade ficcional, índice RC, reserva e densidade visual. Faixas e Red Child dependem de leitura primária específica |
| Kakuhou e localização | Órgão, 134–190 | Reator anatômico, 133–181 | Função e região precisam de fonte direta; câmaras, vasos e anchor exato são reconstrução |
| Kagune e rinkaku | Kagune/biomecânica, 205–278 | Músculo líquido, 183–222; rinkaku, 629–653 | Propriedade qualitativa não fornece coeficientes de rigidez, quantidade fixa de apêndices ou duração biológica |
| Transporte / RC pathways | Circulação, 124–132; integração, 445–453 | Sangue e vias distintas, 267–292 | Cena vascular didática e rede RC interpretativa não são um atlas histológico oficial |
| Limites microscópicos | Histologia, 186–203; questões, 663–690 | RC interna, 125–131; escalas, 398–412 | Não atribuir organelas ou medidas micrométricas canônicas à RC |
| Fonte e adaptação | Método, 51–67; capítulos, 763–826 | Níveis de evidência, 39–66 | Mangá > material editorial oficial > glossário de adaptação; fonte secundária localiza, não comprova |
| Direção visual | Esquemas posterior/sistêmico, 142–184 e 828–876 | Referências, 294–461; corpo como mapa, 467–533 | Composição espacial, volume e inspeção; identidade autoral do observatório |
| Animação / render | Limites da regeneração, 390–425 | Partículas e rig, 820–973; engine, 1.031–1.115 | Loop fora do React, instancing, timeline amostrável e cenas por escala |
| Assets e produção | Não entrega modelos | Fontes abertas, 1.117–1.141 | Candidatos a aquisição; nenhum modelo entregue pelos relatórios |
| Pós-MVP | Híbridos e patologias, 427–659 | Quatro tipos, regeneração, Quinx e kakuja, 583–818 | Backlog; não expandir G1 |

## Reconciliação de inconsistências

Os relatórios convergem na premissa e nos limites microscópicos. Não foi encontrada uma divergência que justifique inventar uma terceira anatomia. Há diferenças de **grau de certeza**, escopo e apresentação que exigem decisões explícitas:

| ID | Evidência do problema | Decisão / trabalho restante |
|---|---|---|
| C01 | R1 101–116 trata faixas RC como referências da obra; R2 101 mantém painel pendente | Manter `manga_needs_verification` até conferir edição/capítulo/painel. Não colocar número RC inventado no HUD |
| C02 | R1 215–233 sistematiza três fases; R2 214 reconhece suporte secundário | Terminologia biológica das três fases continua pendente. As sete fases do renderer são contrato artístico, sem selo oficial |
| C03 | R1 124–132 associa sangue e vias RC, mas admite histologia desconhecida; R2 267–292 distingue os sistemas | Transporte específico = inferência/reconstrução, com aviso público. Não desenhar artérias RC como anatomia confirmada |
| C04 | R1 633–651 liga meio-humano a RC elevado e logo ressalva ausência de faixa | Não herdar RC alto universal nem regras de ghoul para todo perfil. MVP fica em humano/ghoul neutro; variantes aguardam fonte |
| C05 | R1 833 chama diagrama de canônico, mas inclui controle provável e pool interpretativo | Desmembrar em claims por seta/nó. Título global não transfere autoridade às hipóteses |
| C06 | R2 398–412 sugere unidades até micrômetros sem dimensão RC estabelecida | Medidas apenas de assets/cena documentados. Microcena rotulada como escala ilustrativa; sem régua RC científica |
| C07 | R2 709–724 sugere eixo humano→transição→ghoul; R1 530–617 descreve fenótipos modulares | Slider controla parâmetro visual normalizado, não espécie nem diagnóstico automático |
| C08 | R2 propõe instituição CCG e vários sistemas; North Star pede identidade original e um rinkaku | `GHOUL ATLAS / RC OBSERVATORY`, em PT-BR; sem logotipo CCG. Quatro tipos, scanner clínico, Quinx, kakuja e órgãos completos ficam depois do MVP |
| C09 | R2 1.009 propõe Next.js; docs/03 prefere Vite | Confirmar Vite para aplicativo local no browser. SSR/backend não têm requisito nesta fatia |
| C10 | Roadmap original usa seis estados em G3; docs/04 e `KagunePhase` têm sete | Unificar futuro renderer em `rest / activation / release / growth / fixation / active / retract` (ADR em DECISIONS). Scrub inverso e fase retract são conceitos diferentes |
| C11 | Seed declara `proxy`/autoria original sem arquivos e `official` com `verifiedAt: null` | Catálogo é exemplo estrutural; não prova asset ou auditoria. Migração para catálogo de runtime é tarefa inicial de G1 |
| C12 | Roadmap aponta claims em `src/content/claims`; docs/03 também sugere `src/anatomy/content` | Eleger uma única origem em `src/content/{sources,claims,anatomy,assets}` no G1; nesta fase o mapa está em CONTENT_AUDIT, sem scaffold |

## Qualidade e limites das referências dos relatórios

Ambos os MD preservam marcadores de uma pesquisa anterior (`turn...search`, `turn...view`, `turn...image`). Esses identificadores não têm tabela de resolução neste pacote. A existência do marcador não comprova citação direta nem visita nesta sessão. R1 fornece URLs explícitas de capítulos e guias; R2 fornece vários nomes e marcadores, além de links sandbox indisponíveis. As verificações atuais e os bloqueios por fonte estão em [CONTENT_AUDIT](CONTENT_AUDIT.md) e [ASSET_INVENTORY](ASSET_INVENTORY.md).

Relatório factual é **síntese secundária fornecida pelo usuário**, mesmo quando se intitula canônico. Artigo de produção VFX documenta decisões de um filme; não estabelece histologia do mangá. Referências BioDigital, Visible Body, Nanome e Cyberpunk orientam interação; não autorizam redistribuição de seus assets.

## Arquivos realmente lidos

Leitura obrigatória inicial, na ordem solicitada: `AGENTS.md`; `README.md`; `docs/00_NORTH_STAR.md`; `docs/01_ROADMAP_AND_GATES.md` (versão original); `docs/02_EXPERIENCE_STORYBOARD.md`; `docs/06_CANON_AND_DATA_RULES.md`; `docs/07_ASSET_PIPELINE.md`; `docs/SOURCE_REFERENCES.md`; único arquivo então em `research/` (`README_ADICIONE_SEUS_ARQUIVOS.md`); `references/LEIA_PRIMEIRO.md` e inspeção visual das três imagens privadas. Com as pesquisas incluídas, foram lidos R1 e R2 integralmente e reconciliados com os documentos anteriores.

Leituras adicionais efetivas:

- `docs/03_TECHNICAL_ARCHITECTURE.md`
- `docs/04_SIMULATION_SPEC.md`
- `docs/05_VISUAL_ART_DIRECTION.md`
- `docs/08_QUALITY_ASSURANCE.md`
- `docs/09_NEXT_MODULES.md`
- `contracts/atlas-schema.ts`
- `contracts/seed-catalog.json`
- `contracts/design-tokens.json`
- `tools/validate_catalog.py`
- `prompts/00_AUDITAR_PESQUISAS.md`
- `prompts/01_SHELL_VISUAL.md`
- `START_CODEX.txt`
- `.gitignore`
- `FILE_MANIFEST_SHA256.txt`
- `references/private/cyberware-large.png`, `cyberware-small.png`, `perk-tree.png` — vistas como imagens, não somente listadas.

Os demais prompts G2–release foram **inventariados e conferidos por hash**, não lidos como especificação desta execução. Não se alega leitura de arquivos ausentes. Os documentos G0 produzidos foram relidos na revisão final.

## Estado do workspace

Após a chegada dos relatórios e antes das novas entregas G0: **33 arquivos**. Não há `.git`, `package.json`, lockfile, `src/`, `public/`, aplicativo, modelos 3D ou rig. Há dois arquivos técnicos prévios: contrato TypeScript e validador Python; foram preservados. Não existe histórico/remote/diff Git para comparar. Git não foi inicializado nesta execução.

Na checagem inicial, o manifesto original tinha 31 entradas: **30 arquivos existentes conferiam byte a byte**; faltava apenas o antigo README de pesquisa. Os dois relatórios são acréscimos do usuário e não aparecem no manifesto original. O manifesto foi preservado como registro do pacote recebido; a alteração posterior do roadmap é intencional e registrada no log. O estado após as entregas está em [G0-repository-audit](../artifacts/checkpoint/gates/G0-repository-audit.json), cópia saneada do original local `artifacts/gates/G0-repository-audit.json` preservada no checkpoint.

Resultado G0: material recebido e auditado; lacunas de **verificação primária**, produção artística e runtime permanecem explícitas. Próxima execução sugerida: [G1 recomendado](../prompts/G1_RECOMENDADO_APOS_G0.md), somente mediante nova instrução do usuário.
