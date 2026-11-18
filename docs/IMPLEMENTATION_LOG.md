# GHOUL ATLAS — Registro de execução

> Baseline de código G2A verificada na retomada de 24/10/2026: `main`, HEAD = origin/main = GitHub main = `0e53c1e31c366a05642501bef312d0fe5d5575b6` naquele momento. O checkpoint documental posterior consolida a migração sem alterar esse código; seu SHA final é conferido no Git após a publicação. As seções abaixo são registros históricos: frases como “sem app”, “não iniciado” e “alterações locais” valem para o momento de cada checkpoint. A retomada e a consolidação de 24/10 estão ao final, sem modificar os resultados anteriores.

## 2026-10-23 — G0: auditoria e preparação

**Limite autorizado:** somente G0. Hipótese de partida: o pacote executivo e duas pesquisas podem fundamentar uma fatia vertical, mas rigor editorial e arte 3D precisam ser comprovados separadamente. Essa hipótese foi confrontada com filesystem, contratos, fontes externas e referências privadas. Não há aplicativo para declarar implementado ou visualmente aprovado.

### Estado antes das alterações

Workspace: `<WORKSPACE>`.

- Primeiro inventário: pasta de pesquisa somente com instruções. O usuário então incluiu os relatórios; a auditoria foi retomada com os **dois arquivos reais integralmente lidos**, identificados em [RESEARCH_INDEX](RESEARCH_INDEX.md).
- Após essa inclusão e antes das entregas G0: 33 arquivos; sem `.git`, `package.json`, lockfile, `src`, `public`, mesh ou rig.
- Há contrato TypeScript, seed JSON e validador Python. Foram lidos e preservados; não são um aplicativo prévio a reescrever.
- Manifesto original: 31 entradas; 30 arquivos presentes com hash correspondente, um antigo README de pesquisa ausente. Relatórios novos não constam nesse manifesto. Não há alteração prévia detectada nos 30 arquivos existentes; isso não oferece histórico Git.
- Node `v24.19.0`, npm `11.17.0` e Git disponíveis. Python no PATH é alias Microsoft Store sem runtime; Python bundled `3.12.14` funciona. Blender não encontrado no PATH; nenhuma instalação ou execução Blender presumida.

### Entregas e arquivos tocados

| Arquivo | Operação | Finalidade |
|---|---|---|
| `docs/RESEARCH_INDEX.md` | criado | Nomes reais, hashes, cobertura/passagens, divergências, leituras e estado do workspace |
| `docs/DECISIONS.md` | criado | ADRs de escopo/stack/render/câmera/evidência/proxy, primeira tela e cinco riscos |
| `docs/CONTENT_AUDIT.md` | criado | Matriz editorial, conferência de fontes e lacunas |
| `docs/ASSET_INVENTORY.md` | criado | Arquivos reais, candidatos/licenças, tickets e plano de proxy |
| `docs/IMPLEMENTATION_LOG.md` | criado | Este registro e checklist G0 |
| `docs/01_ROADMAP_AND_GATES.md` | revisado | Dependências reais, sete fases coerentes, critérios concretos G0–G7 |
| `prompts/G1_RECOMENDADO_APOS_G0.md` | criado | Handoff executável para uma futura sessão somente G1 |
| `artifacts/gates/G0-validation.txt` | criado | Evidência textual de validação e limitações do validador |
| `artifacts/gates/G0-repository-audit.json` | criado | Hashes/estado do pacote, pesquisas e entregas G0 |

Não foram alterados relatórios, imagens privadas, `AGENTS.md`, contrato, seed, validador ou prompt G1 original. O manifesto de distribuição original não foi regenerado: o roadmap tem revisão intencional e as novas entregas estão no snapshot G0. `artifacts/gates` é ignorado pelo `.gitignore` recebido; evidências ficam locais e devem ser preservadas no handoff. Nenhum Git foi inicializado e nenhum commit/deploy foi realizado.

### Comandos e resultados observados

| Verificação | Resultado / interpretação |
|---|---|
| `Get-Content -LiteralPath ... -Raw` e leitura numerada em blocos | Documentos obrigatórios, dois relatórios completos, contratos e especificações realmente lidos; lista exata em RESEARCH_INDEX |
| `rg --files --hidden` com exclusões de dependências/build | Inventário real; repetido após a inclusão dos relatórios |
| `git rev-parse --show-toplevel` | Fatal: não é repositório Git; sem baseline Git |
| `git status --short --branch`, `git log -3 --oneline`, `git remote -v` | Mesmo diagnóstico; não há branch, histórico ou remote para alegar preservados |
| SHA-256 via `hashlib` / `Get-FileHash` | 30 correspondências no pacote original antes da revisão; dois relatórios identificados individualmente |
| `python --version` e `python tools/validate_catalog.py contracts/seed-catalog.json` pelo PATH inicial | Falha: alias Microsoft Store, Python não encontrado |
| Ferramenta de dependências do workspace | Localizou runtime Python bundled sem instalar software |
| `& '<USER_PROFILE>\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' --version` | `Python 3.12.14` |
| Mesmo executável + `tools/validate_catalog.py contracts/seed-catalog.json` | **exit 0**, `Catalog OK: sources, claims, anatomy IDs, asset refs and disclaimers.` |
| Revisão adversarial read-only do validador em `TemporaryDirectory`, via `runpy.run_path`, Python `-B` | 11 catálogos inválidos aceitos; evidência abaixo e ADR-012. Não mudou o seed |
| `view_image` nas três PNG privadas | Imagens efetivamente inspecionadas, uso restrito a composição; nenhuma cópia para assets |
| Abertura de fontes primárias com ferramentas web | Resultados por fonte em CONTENT_AUDIT/ASSET_INVENTORY; docs oficiais de engenharia em DECISIONS. Tentativa de acesso não foi equiparada a painel conferido |
| `node --version`, `npm --version`, `Get-Command ...` | Versões e disponibilidade registradas acima |

Tentativa de leitura de `prompts/01_SCAFFOLD_E_VISUAL.md` retornou caminho inexistente; o nome correto, confirmado no inventário e lido, é `prompts/01_SHELL_VISUAL.md`. Uma aplicação de patch com operações duplicadas no mesmo arquivo foi rejeitada antes de escrever; a revisão foi reaplicada em operações separadas. Esses eventos não foram usados como evidência de leitura ou alteração concluída.

### Diagnóstico do seed e das regras

O sucesso do validador existente é **parcial**. Quatro citações têm `verifiedAt: null`; quatro records de assets não têm `path`. Não existem modelos correspondentes. `nodeNames` são expectativas, não malhas inspecionadas. O próprio `AnatomyNode.evidenceKind` pode ocultar diferenças entre claim oficial e forma conceitual se a UI não separar os estados.

A revisão em diretório temporário confirmou aceitação indevida de: `schemaVersion=999`, ID anatômico duplicado, referência de câmera ausente, foco da câmera ausente, ranges de câmera negativos, enum de sistema inválido, mesh/node ausente, GLB `ready` inexistente, asset aberto `ready` sem licença, parent órfão e claim oficial com fonte apenas secundária. São **achados**, não testes de regressão já corrigidos. G1 deve introduzir validação estrita e fixtures relevantes.

Decisões: Vite/React/R3F sem backend; uma fatia rinkaku; cenas por escala com contexto preservado; sete fases artísticas do enum já existente; variáveis `reserve/activity/hunger/integrity`; sem escala RC ou fórmula científica inventada. Catálogo runtime será derivado da matriz auditada, preservando o exemplo até migração explícita. Arquivos planejados em `src/content` ainda não foram criados.

### Consolidação editorial e de assets

A matriz final contém **25 afirmações**: oito `official` de escopo limitado sustentadas por texto dos guias, nove `manga_needs_verification`, três `real_anatomy`, uma `inference`, duas `hypothetical_model` e duas `unknown`. São classificações da auditoria, sem reescrever os cinco claims do seed. As consultas VIZ não forneceram os painéis necessários. O índice geral registra as duas pesquisas integralmente lidas; cada contribuição registra separadamente o que leu diretamente.

BodyParts3D apresentou conflito primário de documentação: o portal histórico informa CC BY-SA 2.1 JP e o README do arquivo oficial atualizado em 2025 informa CC BY 4.0. Sem aquisição de pacote, nenhuma licença de asset concreto foi declarada liberada. AnatomyTOOL teve falha de acesso. Essas limitações e os tickets ART-01 a ART-07 estão no inventário; o roadmap usa os mesmos IDs.

A revisão cruzada ajustou três ambiguidades: decisões técnicas não equivalem a aprovação humana; luz legível que revela volume não exige efeito volumétrico; claims pendentes podem ser apresentados com rótulo, sem promoção a verificados. O selo de proxy no handoff segue a forma de AGENTS.md: `PROXY / CONCEPTUAL MODEL`, acompanhado de explicação em português.

### Checklist de saída G0

- [x] Estado do diretório confirmado antes de mudanças; ausência de Git/app registrada.
- [x] Ordem obrigatória inicial respeitada e pesquisas incluídas pelo usuário incorporadas à auditoria.
- [x] Dois relatórios reais integralmente lidos e três referências privadas inspecionadas.
- [x] Índice com caminhos, cobertura, passagens, datas identificáveis e hashes.
- [x] Matriz de 15–30 afirmações essenciais com certeza e fonte individualizadas.
- [x] Lacunas e conflitos tratados explicitamente, sem completar anatomia por conveniência visual.
- [x] Inventário diferencia arquivo existente, candidato remoto, proxy planejado e arte final ausente.
- [x] ADRs justificadas, cinco riscos priorizados e primeira tela viável definida.
- [x] Roadmap revisado com critérios concretos e dependências de arte/conteúdo.
- [x] Validador Python executado com resultado real e alcance limitado explicado.
- [x] Prompt recomendado para G1 salvo; G1 não iniciado.
- [ ] Ler painéis primários pendentes e promover claims somente após comprovação — conteúdo futuro.
- [ ] Produzir/adquirir e validar corpo, camadas e rig — arte futura.
- [ ] Avaliação visual do aplicativo e métricas de hardware — somente a partir de G1.

### Implementado / demonstrado / pendente / testado

**Implementado:** documentação G0, revisão de roadmap e handoff. **Demonstrado:** existência/leitura das pesquisas e referências; ausência de modelos/app; validação mínima e suas lacunas. **Pendente:** aprovação visual, todas as funcionalidades G1–G7, arte de produção, claims/painéis não conferidos e licenças das versões ainda não adquiridas. **Testado:** catálogo original e provas adversariais read-only; consistência documental/snapshot na revisão final.

`typecheck`, `lint`, testes de app, build, smoke, browser e screenshots são **não aplicáveis a um app nesta execução**, porque não existe scaffold e o usuário limitou a execução ao G0. Não foram marcados como aprovados, não há captura de aplicativo nem métrica FPS inventada. A exigência geral de código/captura por gate é concretizada a partir de G1, conforme o prompt específico G0 e o roadmap revisado.

### Conferência documental final

Verificados os oito arquivos de entrega/evidência já escritos, 25 linhas únicas de afirmações essenciais e 17 links Markdown locais, sem destino ausente. Dois relatórios mantêm seus hashes. Após G0, o manifesto original tem 29 correspondências, um roadmap intencionalmente revisado e o antigo README de pesquisa ausente. Não surgiram scaffold, dependências, build ou modelos. O snapshot G0 registra hashes finais e 41 arquivos, incluindo ele próprio; não inclui seu próprio hash para evitar autorreferência.

**Encerramento:** auditoria G0 entregue para revisão, com bloqueios transparentes. O próximo trabalho usa `prompts/G1_RECOMENDADO_APOS_G0.md` em uma nova instrução; esta sessão para aqui.

## 2026-10-23 — G1: observatório funcional

O usuário aprovou G0 e anexou instruções específicas para executar somente G1, incluindo camadas independentes, seleção regional e correção dos onze falsos positivos do validador. Essa ampliação foi tratada como fundação com proxies; não houve ingresso de anatomia final, microscopia, fisiologia ou kagune dos próximos gates.

### Hipótese, decisões e estado inicial

A experiência pode atingir P1 em navegação/apresentação com geometria provisória, sem fingir P2 anatômico. Verificado antes de editar: não havia `.git`, app ou modelos. `git init -b main` inicializou o repositório; nenhuma configuração Git global, commit, remote ou publicação foi criada. Arquivos G0 e as duas pesquisas foram preservados, exceto as evoluções explícitas de contrato/ferramenta documentadas abaixo.

Leituras de base: anexo G1 do usuário; `AGENTS.md`, `DECISIONS`, `CONTENT_AUDIT`, `ASSET_INVENTORY`, roadmap revisado e prompt G1. Também utilizados North Star, storyboard, arquitetura, direção visual, contrato e regras de evidência. A leitura integral das pesquisas permanece documentada no G0; novas consultas humanas estritamente textuais constam de `G1_CATALOG_MIGRATION.md`.

Workflow local da skill Sites aplicado, com verificação React e do fluxo completo. O usuário pediu implementação no workspace e parada em G1, portanto não houve registro de Site, sincronização remota ou deploy. Responsabilidades foram divididas em cena, catálogo/validação e E2E; a integração, UI e revisão final ficaram na tarefa principal.

### Arquivos e comportamento entregues

- Fundação: `package.json`, lockfile, `index.html`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `playwright.config.ts`, `src/main.tsx` e `.gitignore` atualizado para caches de compilação/Python.
- Aplicativo/estado: `src/app/{App,SceneBoundary,types}`, `src/state/{observatory,scanClock}`. UI orientada a eventos; scan usa relógio transiente, com leitura UI a 4 Hz e métricas a 0,5 Hz fora do loop de render React.
- Interface: `src/ui/{SystemsIndex,EvidenceInspector,Timeline,Fallback,Icon,styles}`. Índice, fontes, filtros, camadas, transparência, ajuda, modos informativos e retorno de contexto. Fallback 2D é explicitamente alternativo; o modo normal usa meshes 3D.
- Render: `src/scene/{ObservatoryScene,AssetSlot,proxyGeometry,camera,proxy-manifest}`. Seis meshes semânticos autorais; quatro camadas independentes; raycast/foco/reset/posterior/isolar. Geometria gerada não equivale a anatomia validada.
- Dados: `public/catalog.json`, `src/content/catalog.ts`, contrato `contracts/atlas-schema.ts` migrado explicitamente para v2. Seis estruturas, onze claims, nove fontes. `contracts/seed-catalog.json` v1 permaneceu byte a byte igual.
- Gate: `tools/validate_catalog.py`, 22 testes Python, `tools/python.mjs` com detecção de Python 3.10+ sem mexer no PATH global. Valida disponibilidade física, manifesto, nodes e origem editorial; não pretende demonstrar a verdade de uma frase só por existir metadado.
- Preparação GLB: `src/visuals/assets/gltfResource.ts`, import lazy de GLTFLoader, erro/abort, node mapping e ownership básico. Cinco testes usam um contêiner glTF 2 binário original em memória; nenhum corpo final foi carregado.
- Proveniência: `public/{atlas-mark.svg,ASSET_LICENSES.md}`. Ícones, marca, fallback e geometria são autorais, sem texturas ou fontes externas.
- Verificação: testes de câmera/geometria/estado/conteúdo/loader e `tests/e2e/observatory.spec.ts`; script reproduzível de produção `tests/e2e/production-profile.js`.
- Handoff: README atualizado, `docs/G1_CATALOG_MIGRATION.md`, `docs/G1_ACCEPTANCE.md` e este registro. Artefatos em `artifacts/gates/G1-*` continuam locais/ignorados; preservar ao compartilhar o handoff.

Stack instalada e verificada: Node 24.19.0, npm 11.17.0, React/DOM 19.3.1, R3F 9.8.2, Drei 10.7.9, Three 0.186.1, Zustand 5.0.16, TypeScript 6.0.3, Vite 8.3.5, Vitest 5.0.5 e Playwright 1.64.1. ESLint foi atualizado de 9 para 10.13.0 após o instalador informar fim de suporte da versão anterior; peers dos plugins foram conferidos e lint passou. Versões exatas resolvidas estão no lockfile.

### Problemas encontrados e correções observadas

1. O catálogo de exemplo passava em G0, mas não tinha recursos/fontes suficientes para runtime. Novo gate v2 e regressões negativas corrigem os onze casos; o seed continua rejeitado intencionalmente, sem mascarar o diagnóstico.
2. A primeira captura desktop tinha 1.168 px de altura em viewport de 900 px. O container passou a ter altura definida, com scroll interno nos painéis; a captura final é 1440×900, sem overflow do documento.
3. O primeiro proxy tinha juntas esféricas excessivas. Perfis e joins foram refinados, face incluída no próprio perfil e material tornado mais fosco. Continua manequim esquemático com seams, classificado P0 anatômico.
4. Selecionar camadas internas podia mantê-las cobertas. Seleção ativa a camada correspondente e reduz a opacidade de superfície; isolamento/restauração conserva configuração anterior.
5. Canvas oculto via `display:none` poderia perder dimensões/contexto de câmera. Estados futuros preservam dimensões e montagem via `visibility`; movimentos/scan pausam quando apropriado.
6. Slider e scan podiam divergir ao pausar. `scanClock` mantém estado transiente; pausa e reduced motion capturam o frame atual. Preferência alterada durante playback foi testada no preview.
7. Mobile abria um inspector longo e seleção podia deixar o resultado fora do viewport. Inspector inicia recolhido; seleção HTML abre e reposiciona a folha; foco/isolar retorna ao palco.
8. Cache Playwright continha Chromium 151 enquanto a versão instalada esperava outra revisão; tentativa do cache teve falhas de contexto. Foi utilizado Chrome 155 já instalado, com Intel Iris Xe real, sem instalar outro browser. Falhas de infraestrutura não foram relatadas como teste do produto aprovado.
9. ESLint não reconhecia globals Node em `.mjs`; configuração ampliada e lint passou. Saída Python passou a UTF-8 para não corromper acentos no terminal Windows.
10. Three substituía automaticamente PCFSoftShadowMap; a sombra foi configurada explicitamente como PCF. Resta warning `THREE.Clock` originado de R3F 9; não se adotou versão alpha para removê-lo.

### Verificação e métricas

Resultados concretos: typecheck exit 0; lint exit 0; **41 testes Vitest** exit 0; **22 testes Python** exit 0; build exit 0 com gate do catálogo; **14 testes E2E** exit 0. Após os ajustes finais, quatro jornadas relevantes e capturas foram repetidas no preview de produção; um teste de alteração de reduced motion durante scan foi repetido isoladamente e passou. Não foi necessário repetir módulos não afetados após alterações só documentais.

HTTP de `/` e `/catalog.json` retornou 200. Perda real de contexto WebGL, falhas deliberadas de asset/catálogo, retry, raycast, seleção, camadas, mouse, teclado, modos, filtro e mobile foram exercitados. As capturas foram vistas como imagens e usadas para correções; nenhum teste visual é autodeclaração sem arquivo.

Perfil de produção: Windows 11 Pro, i5-1135G7/16 GB/Intel Iris Xe D3D11, Chrome 155 headless, 1440×900/DPR 1, cache desativado, CDP 20 Mbps e latency 50 ms. Após 10 s de warm-up, 30,012 s / 1.800 intervalos: **FPS p50 59,88 / p10 59,52; 21 draws; 149.898 triângulos; 13 geometrias / 3 texturas; interação 1.680,9 ms**. Transferência 346.169 B Performance API / 346.530 B CDP; GET confirmou gzip. Zero erros JS/HTTP/rede inesperados. Resultados e protocolo completos em `G1-production-metrics.json`; não são benchmark de celular real ou garantia para outra máquina.

Build emite aviso de chunk lazy de cena (~947 kB minificados / ~253 kB gzip). O payload e os tempos medidos ficaram abaixo dos orçamentos; nenhum limite foi aumentado para esconder a advertência. Auditoria do bundle comparou hash, payload integral e nomes/caminhos dos três PNG privados e dois relatórios: zero correspondências; `G1-bundle-audit.json` registra os arquivos públicos. Pesquisas e seed original mantiveram os hashes.

### Classificação, limites e parada

**Implementado/demonstrado:** fundação, navegação, fontes, camadas e falhas do G1 com evidência. **P1:** interação/apresentação e governança editorial do runtime. **P0:** representação anatômica e seam de GLB futuro. **P2:** não declarado.

Antes de usar um GLB real, ainda é preciso revisar cena ativa/meshes/bounds/anchors, URIs de recursos externos, licenças de mapas e ownership de skeletons/ImageBitmaps/cenas secundárias. O helper atual é preparação interna, não certificação de pipeline de arte final. Produção de corpo, órgãos, rig rinkaku, células/vasos e qualidade cinematográfica avançada permanece dependência explícita. Mobile físico e revisão humana da arte continuam pendentes.

O gate e as recomendações de G2 estão em `docs/G1_ACCEPTANCE.md`. Os servidores locais foram usados para QA; comandos de execução estão no README. Nenhum G2 foi iniciado, nenhum asset anatômico externo foi adquirido e nada foi publicado. Trabalho encerrado em G1 para revisão do usuário.

## 2026-10-23 — Checkpoint, documentação e transferência

### Autorização, diagnóstico e escolhas

O usuário solicitou preservar todo G0/G1 e autorizou push para `https://github.com/DiogoJP202/RC_PROJECT.git`, branch `main`, após checks de segurança/integridade. Escopo exclusivo de documentação, versionamento e restauração; nenhuma funcionalidade ou próxima fase foi iniciada.

Estado inicial confirmado por `git status`, `git branch -avv`, `git remote -v` e `git log`: `main` sem commits, todos os arquivos do projeto não rastreados e nenhum remote. `git ls-remote` retornou exit 0 sem refs. A API GitHub confirmou repositório privado, tamanho 0, default branch main e permissão de push; não havia histórico para integrar/sobrescrever. Nenhum force push, reset destrutivo ou exclusão de originais foi utilizado.

Leituras/inspeções: anexo de checkpoint, AGENTS/README, todos os 18 documentos G0/G1 e oito prompts, configurações/lockfile, contratos, runtime, testes e ferramentas enumerados em PROJECT_HANDOFF; duas pesquisas tiveram nomes/tamanho/SHA conferidos novamente. A inspeção adicional revisou `.gitignore`, os seis JSON/TXT e oito PNG de gates, inventário de arquivos candidatos, diretórios ignorados e nomes/uso de variáveis de ambiente. As imagens desktop/mobile renovadas foram vistas no checkpoint. Leitura integral das pesquisas e das três imagens privadas permanece evidência histórica de G0, sem alegação de nova leitura integral nesta operação.

### Documentação e arquivos preservados

- Criados `docs/PROJECT_HANDOFF.md` e `docs/RESUME_ON_NEW_PC.md`; README refeito com clone, requisitos/versões, npm ci, ambiente, todos os checks, produção local, GLB futuro e problemas Windows.
- Criado `prompts/G2A_INTEGRACAO_GLB.md` como proposta para autorização futura; roadmap recebeu nota de status/subgates sem apagar o planejamento histórico. Aceite G1 e índice de pesquisas apontam evidências disponíveis no clone.
- `.gitignore` agora protege `.env`/credenciais e conserva oito capturas próprias + relatórios selecionados. `.env.example` contém somente quatro nomes vazios; `.nvmrc` registra Node testado. `.gitattributes` normaliza texto e preserva bytes dos dois MD recebidos/seed v1.
- Preservados docs, research, contracts, prompts, tools, tests, src, public, configs e package-lock. Nenhum código/teste de produto ou versão de dependência foi alterado nesta operação.
- Seis JSON/TXT históricos copiados para `artifacts/checkpoint/gates/`, com caminhos pessoais substituídos por `<WORKSPACE>/<USER_PROFILE>`; resultados/metodologia preservados. Originais ficaram locais/ignorados e intactos. As duas ocorrências pessoais deste log foram saneadas após guardar uma cópia local em `artifacts/gates/IMPLEMENTATION_LOG-before-checkpoint.md`.
- Oito PNG autorais renovados pelo E2E são versionados; não contêm metadados EXIF/text/GPS. `artifacts/checkpoint/preservation-index.json` registra hashes finais e transformações. Hashes de inventários históricos não devem ser confundidos com os arquivos atuais.
- `references/private/`, dependências, build, caches e reports temporários não entram no Git. Transferência privada opcional dos três PNG e relatórios brutos está documentada em RESUME; nenhum asset final foi omitido, pois não existe GLB/BLEND anatômico entregue.

### Verificação local repetida

Ambiente: Node 24.19.0, npm 11.17.0, Python 3.12.14, Chrome 155.0.8059.86 do sistema (fallback previsto na config; browser correspondente do Playwright não instalado nesta estação). Registros reais em `artifacts/checkpoint/local-validation.{json,txt}`.

| Comando | Resultado |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | exit 0; 41 testes/5 arquivos |
| `npm run test:catalog` | exit 0; 22 testes Python |
| `npm run validate:catalog` | exit 0; runtime v2 |
| `npm run build` | exit 0; warning conhecido do chunk 3D |
| `npm run test:e2e` | exit 0; 14 testes, zero skipped/falhas |
| Diagnóstico do seed v1 | exit 1 esperado, 46 problemas do contrato legado; seed intacto |

Nenhum requisito ou teste foi enfraquecido. Nenhum novo perfil de FPS ou medição de celular físico foi executado; os números G1 continuam históricos. Permanecem warnings conhecidos do chunk, THREE.Clock, FORCE_COLOR/NO_COLOR e extensão WEBGL_lose_context durante a recuperação do teste que passou. Playwright encerrou seu servidor; nenhum Vite deste workspace permaneceu ativo após a suíte.

### Segurança, integridade e continuidade

Auditoria inicial: sem candidatos a PAT/chaves privadas/credenciais em URL ou atribuições de segredo nos arquivos não gerados; nenhum `.env` privado real encontrado. Sem arquivos grandes (>10 MiB); LFS não necessário neste snapshot. A revisão final staged e o inventário do checkpoint registram o conjunto efetivamente publicado; varredura por padrões e revisão de proveniência não são certificação universal de ausência de segredos.

As pesquisas e o seed mantêm os hashes G0/G1; referências de terceiros permanecem fora do Git/build. `FILE_MANIFEST_SHA256.txt` é preservado como manifesto histórico, não atualizado para encobrir mudanças. A tag `ghoul-atlas-g1-checkpoint` identifica a baseline; documentação posterior registra seu SHA sem autorreferência impossível. A verificação de push/clone e seus SHAs é acrescentada após executar, sem presumir sucesso.

Parada mantida: última implementação G1; G2A/G2B/G3/G4 não iniciados. Arte anatômica P0, revisão artística/anatômica, painel primário pendente e mobile físico continuam riscos explícitos, não resolvidos pelo backup.

Revisão staged da baseline: 99 arquivos/1.943.866 bytes antes de adicionar o próprio relatório de auditoria (100 arquivos no commit); zero candidatos a segredo/caminho pessoal, zero caminhos proibidos, zero links locais de documentação ausentes e hashes dos dois MD/seed correspondentes. Maior arquivo 255.523 B; nenhum >10 MiB. `git diff --cached --check` apontou somente hard breaks Markdown das pesquisas preservadas e whitespace da saída capturada do runner; nenhum achado de whitespace em código/config. Resultados completos em `artifacts/checkpoint/staged-audit.json`.

Baseline criada: `8fac8f7bba9a6891d5306cc14d6e86abbd4ea699`, mensagem `feat: establish Ghoul Atlas G0-G1 baseline`. Tag leve `ghoul-atlas-g1-checkpoint` aponta para esse commit. Atualizações posteriores de documentação/evidência mantêm o código desta baseline; RESUME registra o SHA explícito sem tentar embutir o hash de um commit nele próprio.

### Publicação e restauração verificadas

Push inicial de main e tag concluiu sem force. HEAD local e ref remoto conferiram em `2b64744a0065031b3c7f70ee70291a10a1671fac` (commit que registra a identidade da baseline). A API GitHub confirmou existência/URL desse commit e conteúdo de `docs/RESUME_ON_NEW_PC.md` na main. A árvore foi conferida para docs, pesquisas, contratos, prompts, ferramentas, testes, src, public e evidências; nenhum caminho privado/gerado foi incluído.

Foi feito clone **do GitHub** em pasta temporária nova, inicialmente sem node_modules/dist/.env/references/private. Sem copiar ou ligar arquivos ignorados do workspace, `npm ci` adicionou 234 pacotes/auditou 235 e reportou zero vulnerabilidades. Repetidos no clone: typecheck, lint, 41 Vitest/5 arquivos, 22 Python, catálogo v2, build e 14 E2E, todos exit 0. Evidência completa em `artifacts/checkpoint/clean-clone-validation.{json,txt}`. Python 3.12.14 e Chrome 155 eram ferramentas disponíveis no host, não arquivos restaurados do workspace; Chromium correspondente deve ser instalado no PC novo conforme README.

SHA-256 das pesquisas, seed v1 e lockfile idênticos no clone. Referências privadas continuaram ausentes; nenhum arquivo rastreado mudou depois dos testes (inclusive PNGs nesta execução). Playwright encerrou o próprio servidor e a inspeção de processos não encontrou Vite do workspace/clone em execução. Conferidos também hashes dos seis relatórios originais locais e suas cópias saneadas, oito PNG e nomes vazios de `.env.example`: todos intactos/conformes.

Este registro e seus relatórios entram num commit exclusivamente documental após o código validado. A verificação final compara SHA local/remoto, árvore do clone atualizado por fast-forward, tag e working trees; o SHA final pode ser obtido por `git rev-parse HEAD` e `git ls-remote origin refs/heads/main`. Não repetir suítes após mudanças exclusivamente de documentação/evidência sem novo risco funcional. Arquivos brutos e referências privadas permanecem locais, com restauração opcional detalhada; nenhuma pendência de transferência impede executar o G1 do clone.

## 2026-10-23 — G2A: infraestrutura de integração anatômica

### Autorização, leitura e diagnóstico

O usuário aprovou avanço e anexou “G2A: Asset Integration & Anatomical Infrastructure”, autorizando apenas infraestrutura, fixtures de teste e refinamentos pontuais de UX. Um artista Blender trabalha em paralelo; produzir anatomia humana definitiva, integrar arte final G2B ou implementar G3 não faz parte desta execução.

Estado inicial: working tree limpa em main, HEAD/origin/main `d7195027dfb48ab25d040a6295676aacb847ce59`; baseline G0/G1 e tag existentes, sem necessidade de novo init, remote ou sobrescrita. A leitura obrigatória abrangeu AGENTS, G1_ACCEPTANCE, IMPLEMENTATION_LOG, DECISIONS, ASSET_INVENTORY, roadmap, contrato anatômico e pipeline Blender G0. Inspecionados App/UI/store/câmera/AssetSlot/scene, loader e seus cinco testes existentes, catálogo v2, configuração/lockfile, scripts de perfil e E2E G1. Handoff e guia de retomada distinguem planejamento histórico de código real. Nenhuma nova afirmação canônica foi introduzida.

Aplicado workflow local da skill Sites, revisão `vercel:react-best-practices` e verificação do fluxo completo: escolha na bancada → arquivo GLB aprovado por HTTP → preflight/importação → bindings/lease → cena selecionável → evidências; falha retorna ao proxy. Sem dependências novas ou migração de stack. O preview local respondeu 200 em `/` e nos dois GLBs reais. Não há serviço/API/backend novo; a origem de dados é o diretório público estático.

### Decisões e implementação

- Registro central `src/visuals/assets/assetRegistry.ts`: ID/versão/bytes/SHA/proveniência, subconjunto de recursos aprovado, bindings parciais por `extras.atlasId`, sockets e espaço/pivô/bounds. Nomes visuais são auxiliares, não identidade anatômica. Catálogo editorial v2 permanece intacto.
- `assetCache.ts`: aquisição assíncrona, request concorrente compartilhado, abort por consumidor, refcount, instâncias com transforms/bones/material/mixer próprios e descarte do template no último release. Cache não mantém um atlas inativo indefinidamente; trocar depois de liberar pode refazer fetch. Materiais por mesh/slot evitam realce/opacidade contaminarem outro ID.
- `gltfResource.ts`, `glbValidation.ts`, `resourceOwnership.ts`: origem/arquivo/hash e licença aprovados, redirect/URI/data URI/decoder recusados; inspeção binária antes de GLTFLoader normalizar pesos; hierarquia, valores finitos, acessores, skin e tracks. Ownership inclui recursos parciais/tardios, cenas secundárias, materiais originais/derivados, textura/ImageBitmap, skeleton/boneTexture e URLs blob. Hook de parser acoplado ao Three fixado 0.186.1 tem regressões específicas.
- `IntegratedAssets.tsx`: carga lazy, estado de loading/falha sem perder corpo/texto, substituição somente dos IDs presentes, proxy automático e retry; `AssetSlot` conserva proxies dos demais IDs. `assetRuntime.ts` permite consultas reais de bounds/anchors/sockets. Rig usa mixer fora do React por frame; estado transiente fica em `assetClock` e UI lê a 4 Hz. Play/pausa/scrub/reduced motion conservam a pose.
- Cena/câmera: `project`/raycast/snapshot inspecionam meshes reais; foco usa volume importado e transição cancelável de duração proporcional à viagem. Limites de órbita e overview podem usar o envelope da montagem, sem depender só de landmarks G1. Realce localizado por material leve; sem postprocess pesado.
- `AssetLab.tsx` é bancada opt-in `?assets=lab`, com indicação explícita de fixture. A entrada normal mantém proxies e não busca GLBs de teste. Sem modelo definitivo adquirido ou falsa alegação anatômica.
- Mobile: título/modelo separados por enquadramento, selo reposicionado abaixo dos pés, alvos de toque ampliados e `MobileExplorer` em diálogo/gaveta inferior com foco nativo, Escape e alternativa HTML. Evidências reabrem o inspector e sua aba; atalhos globais respeitam qualquer modal aberto.
- `tools/generate_fixture_glbs.mjs` produz de modo determinístico dois binários + manifesto de autoria/hash: estático 2.604 B, articulado 4.532 B, hierarquias diferentes e três bindings (cabeça/tórax/kakuhou). O rig tem dois bones, socket filho animável, skin e `fixture_sway` de 1 s. Geometria angular/retangular deliberadamente não anatômica.
- Contrato operacional entregue em `docs/BLENDER_WEB_INTEGRATION.md`; aceite em `G2A_ACCEPTANCE.md`. README/proveniência e Git ignore evoluem para preservar evidências G2A. Perfil de produção aceita `--output`, `--asset` e `--animate`, conservando relatórios G1.

### Problemas observados e correções

Revisão cruzada identificou material compartilhado entre IDs, retenção CPU do último lease liberado no estado React, slider desatualizado após pausa, Escape da gaveta disparando reset global e ação de evidências que só rolava para um painel recolhido. Corrigidos com materiais independentes, limpeza com guarda de identidade, relógio transiente/captura de pausa, guarda de modais e comando compartilhado de inspector.

Na primeira suíte completa, 83 unidades/7 arquivos, 22 Python, catálogo/build/typecheck/lint passaram; E2E teve **23 passes e uma falha nova na gaveta**. Os 14 testes G1 passaram sem mudança. O retorno ao palco ocorria antes da restauração de foco/layout do diálogo; mover a rolagem para o próximo frame corrigiu a jornada, repetida isoladamente com exit 0. Evidência inicial preservada em `artifacts/g2a/validation-initial.{json,txt}`; nenhum assert foi removido para passar.

Inspeção visual encontrou o selo cobrindo um pé no mobile; foi movido para uma faixa inferior com fonte maior, mantendo cabeça/pés legíveis. Revisão adversarial do preflight também demonstrou extensões aninhadas omitidas de extensionsUsed e filhos duplicados aceitos; as correções rejeitam esses casos antes de interpretar plugins ou percorrer a hierarquia. Resultados definitivos, capturas e perfil são registrados no aceite após execução.

### Limites de qualidade e parada

Infraestrutura/interação são avaliadas como P1 somente com os checks/capturas associados; representação humana e fixtures permanecem P0, nenhum P2 anatômico declarado. O preflight conservador não é certificação glTF universal: sparse, mais de quatro influências, codecs/decoders não aprovados e casos artísticos não exercitados continuam explicitamente limitados. Teste de textura em GLB de memória usa decoder controlado; não aprova mapas reais nem todos os browsers.

G2B exige pacote do artista, licença por arquivo/mapa, metadados e revisão de anatomia/arte, UV/PBR, rig/morphs/extremos, envelope, import e orçamento medido no arquivo concreto. Kakuhou continua reconstrução; não há escala RC, circulação, fisiologia ou manifestação rinkaku implementadas. Mobile físico e revisão humana final continuam pendentes. As mudanças desta fase ficam locais sobre a baseline Git preservada; não houve autorização de publicação automática de uma nova fase.

### Verificação final G2A

Depois das correções, os sete comandos completos passaram: typecheck exit 0; lint exit 0; **85 testes Vitest/7 arquivos** exit 0 (48 de recursos, incluindo os cinco anteriores); **22 Python** exit 0; catálogo v2 exit 0; build exit 0; **24 E2E** exit 0 (14 G1 intactos + 10 G2A), sem skipped. Saídas e tempos reais em `artifacts/g2a/validation.{json,txt}`. A primeira execução com falha foi conservada separadamente; não é apresentada como aprovação.

Perfil de produção repetido em Chrome 155 headless/Iris Xe, 1440×900/DPR 1, CDP 20 Mbps e latency 50 ms, 10 s warm-up + 30 s/1.800 intervalos: proxy **59,88/59,52 FPS p50/p10**, interação **1.879,6 ms**, **21 draws**, transferência **358.241 B**. GLB articulado em playback: **59,88/59,52 FPS**, boot **1.179,9 ms**, ativação adicional **333 ms**, **22 draws**, transferência boot+asset/loader **376.324 B**. Zero erros JS/rede/HTTP inesperados e todos os budgets passaram; Clock e chunk grande continuam warnings conhecidos. Os tempos são execuções distintas nesta estação; não se atribui causalmente boot mais rápido à fixture. Relatórios `production-proxy.json` e `production-rigged.json` em `artifacts/g2a/`.

Capturas G2A desktop/mobile normais, gaveta, GLB estático/articulado, rig em pose isolada e mobile com asset foram geradas no browser e vistas. Cabeça/pés livres de clipping/HUD e aviso conceitual persistente. Capturas históricas G1, geradas novamente pelos testes, foram restauradas aos bytes da baseline; os resultados atuais ficam em G2A-* para não destruir comparativos. Nenhum arquivo original privado, pesquisa, seed, catálogo editorial ou lockfile foi alterado.

Contrato final para o artista e proposta de próxima execução estão em BLENDER_WEB_INTEGRATION e `prompts/G2B_ASSETS_DEFINITIVOS.md`. G2A conclui a infraestrutura tecnicamente demonstrada com fixtures. A arte anatômica final, seus termos, revisão visual/anatômica, texturas/rig/morphs reais e celular físico permanecem dependências explícitas. Parada após G2A.

Auditoria final em `artifacts/g2a/repository-audit.json`: 11 arquivos de dist, nove capturas próprias, dois GLBs reproduzidos com bytes/SHA idênticos; zero correspondências de payload/nome dos cinco materiais protegidos no build, zero candidatos a segredo/caminho pessoal ou caminho privado/gerado no conjunto de arquivos candidatos ao Git, zero links locais ausentes. Conferidos por diff os testes G1/loader legado, pesquisas, seed, catálogo v2, lockfile e capturas históricas: sem alterações. A análise por padrões não equivale a certificação universal de segurança. Baseline/main remota seguem d719502; alterações G2A permanecem locais para revisão e próximo checkpoint.

## 2026-10-24 — Retomada e validação na nova máquina

### Hipótese, escopo e identidade recuperada

Hipótese: o clone publicado já contém G0/G1/G2A completos no seu escopo técnico; esta estação precisa de dependências e validação, sem reimplementar módulos. Confirmada por `git status --short --branch` inicialmente limpo, remote correto, `git fetch origin --prune`, `git fsck --full` sem erros e inspeção da árvore remota. `git merge-base --is-ancestor` confirmou a baseline G1 no histórico. `HEAD`, `origin/main` e `git ls-remote --heads origin main` coincidiram em **`0e53c1e31c366a05642501bef312d0fe5d5575b6`**, branch **main**; divergência `0 / 0`. A ref do GitHub foi consultada novamente no encerramento e continuou igual.

Lidos integralmente AGENTS, README, PROJECT_HANDOFF, RESUME_ON_NEW_PC, G1_ACCEPTANCE, G2A_ACCEPTANCE, BLENDER_WEB_INTEGRATION, este log e 01_ROADMAP_AND_GATES. Inspeção direta e revisão paralela conferiram registro/preflight/importação/ownership/cache, leases/bindings, IntegratedAssets/AssetSlot, runtime/câmera, stores/relógios, bancada/gaveta mobile, fixtures/manifesto e testes. Há duas fixtures reais versionadas, não anatomia final escondida em cache. Nenhuma afirmação científica foi alterada ou promovida.

### Ambiente e recuperação das ferramentas

| Item | Estação anterior (histórico G2A) | Nova estação observada |
|---|---|---|
| Sistema | Windows 11 Pro x64, build 26200 | Windows 11 Home x64, 10.0.26200 |
| Hardware | i5-1135G7, 16 GB, Intel Iris Xe | Positivo R78512AI-15; Ryzen 7 5825U, 8 cores/16 threads; 16 GB (16.540.626.944 B reportados) |
| GPU/driver | Iris Xe via ANGLE D3D11 | AMD Radeon integrada, driver 31.0.21925.1001; ANGLE D3D11 confirmado no browser |
| Git | Disponível no checkpoint | 2.55.0.windows.2 |
| Node / npm / Python | 24.19.0 / 11.17.0 / 3.12.14 | 24.22.1 / 11.17.0 / 3.12.14 |
| Browser de QA | Chrome 155.0.8059.86 headless | Chromium 156.0.8078.4, revisão Playwright 1248, browser completo headless |

Problemas específicos encontrados: npm ausente do PATH e dos locais usuais; `python.exe` no PATH era alias Microsoft Store, sem launcher `py`; cache Playwright tinha revisão 1228, enquanto 1.64.1 exige 1248. Node 24.22.1 e Python 3.12.14 bundled do Codex já funcionavam. Não foi instalado outro Node/Python nem Blender.

Para tornar os comandos existentes executáveis, o pacote oficial **npm 11.17.0** foi obtido em `registry.npmjs.org`, com SHA-512 conferido contra `dist.integrity`, e extraído em `<LOCALAPPDATA>/GhoulAtlas/tooling/npm-11.17.0`, com wrappers locais npm.cmd/npx.cmd. PATH foi ajustado somente no processo de execução. `npm.cmd ci` acrescentou **234 pacotes**, auditou **235** e reportou **zero vulnerabilidades**, em 45 s; lockfile e versões do projeto preservados. O aviso de nova major do npm não motivou atualização.

Python foi apontado por `ATLAS_PYTHON` nos checks; o helper também encontrou **3.12.14 sem override**, confirmado por `node tools/python.mjs --version`. `npx.cmd playwright install chromium` instalou a revisão exigida e seus componentes auxiliares (headless shell/FFmpeg), necessidade do E2E já previsto. A instalação terminou com exit 0, conforme [saída](../artifacts/checkpoint/new-pc-browser-install.txt). E2E/perfis usaram `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para o Chromium completo da mesma revisão, sem alterar a configuração do projeto. [Hardware e diagnóstico](../artifacts/checkpoint/new-pc-machine.json). O bloco de ativação em [RESUME_ON_NEW_PC](RESUME_ON_NEW_PC.md) foi executado em processo novo e retornou as três versões esperadas; não houve mudança global de PATH/política do PowerShell.

### Checks e demonstração na nova estação

| Comando | Resultado concreto |
|---|---|
| `npm.cmd ci` | exit 0; instalação pelo lockfile, 234 pacotes/235 auditados |
| `npm.cmd run typecheck` | exit 0; TypeScript sem erro |
| `npm.cmd run lint` | exit 0; sem erro ESLint |
| `npm.cmd test` | exit 0; **85 testes, 7 arquivos** |
| `npm.cmd run test:catalog` | exit 0; **22 testes Python** |
| `npm.cmd run validate:catalog` | exit 0; `Catalog OK v2` |
| `npm.cmd run build` | exit 0; catálogo + TypeScript + Vite |
| `npm.cmd run test:e2e` | exit 0; **24/24, sem skipped**, 57,3 s no runner; `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173` |
| Perfil proxy e perfil rigged/`--animate` | ambos exit 0; todos os budgets passaram |
| Smoke HTTP no preview | `/`, `/catalog.json`, `/?assets=lab` e os dois GLBs retornaram **200**; binários 2.604/4.532 B |

[Resumo dos checks](../artifacts/checkpoint/new-pc-validation.json), [stdout/stderr](../artifacts/checkpoint/new-pc-validation.txt), [E2E](../artifacts/checkpoint/new-pc-e2e.json) / [saída E2E](../artifacts/checkpoint/new-pc-e2e.txt) e [smoke HTTP](../artifacts/checkpoint/new-pc-http-smoke.json). Os checks independentes foram paralelizados; build ocorreu depois de typecheck para evitar escrita concorrente do compilador. Os E2E e os dois perfis foram executados em sequência. Nenhum teste foi removido, alterado ou enfraquecido.

Bancada **`?assets=lab` confirmada**: carga assíncrona dos GLBs modular/articulado pelo registro aprovado, três bindings sobre proxies restantes, raycast real e identidade no inspector, camadas/isolar/foco/reset, HTTP 404→fallback→retry, cancelamento/race, descarte após trocas, deformação/clip/socket, pausa/scrub/reduced motion e controles mobile/teclado. Os 14 fluxos G1 e os 10 G2A passaram. A cena normal e o articulado/clipe também foram abertos no navegador integrado; o status GLB integrado e a pose 0,5 foram observados pela UI.

As nove capturas E2E atuais foram abertas e inspecionadas: [desktop normal](../artifacts/gates/G2A-new-pc-desktop-default.png), [mobile normal](../artifacts/gates/G2A-new-pc-mobile-default.png), [gaveta mobile](../artifacts/gates/G2A-new-pc-mobile-drawer.png), [GLB modular](../artifacts/gates/G2A-new-pc-synthetic-static.png), [articulado](../artifacts/gates/G2A-new-pc-synthetic-rigged.png), [pose isolada](../artifacts/gates/G2A-new-pc-rig-pose.png), [seleção mobile](../artifacts/gates/G2A-new-pc-mobile-asset.png), [bancada desktop](../artifacts/gates/G2A-new-pc-desktop.png) e [bancada mobile](../artifacts/gates/G2A-new-pc-mobile.png). A cena normal mantém cabeça/pés e disclosure legíveis; a bancada mobile ocupa espaço adicional com rolagem. Fixtures angulares continuam explicitamente sem valor anatômico. As **17 imagens históricas G1/G2A** foram guardadas antes dos E2E e restauradas aos bytes anteriores; as novas usam `G2A-new-pc-*`, sem substituir o histórico.

### Performance e diferenças observadas

Protocolo igual ao script existente: build de produção/preview 4173, contexto novo/cache HTTP desativado, 1440×900/DPR 1, CDP 20 Mbps e `latency=50 ms` (sem certificar RTT físico), 10 s warm-up + 30 s de amostra. Browser integrado fechado antes das medições. Cada perfil produziu **1.800 intervalos**; renderer real AMD/ANGLE D3D11, sem SwiftShader nessa medição.

| Métrica | Proxy anterior → novo | Articulado anterior → novo |
|---|---:|---:|
| FPS p50 / p10 | 59,88 / 59,52 → **59,88 / 58,82** | 59,88 / 59,52 → **59,88 / 58,82** |
| Interação inicial Body | 1.879,6 → **1.308,3 ms** | 1.179,9 → **1.208,1 ms** |
| Ativação adicional do GLB | não se aplica | 333 → **322 ms** |
| Draw calls | 21 → **21** | 22 → **22** |
| Transferência Performance API | 358.241 → **358.241 B** | 376.324 → **376.324 B**, boot + carga explícita |
| Geometrias / texturas | 13 / 3 → **13 / 3** | 15 / 4 → **15 / 4** |

[Perfil proxy atual](../artifacts/checkpoint/new-pc-production-proxy.json) e [articulado atual](../artifacts/checkpoint/new-pc-production-rigged.json) preservam medições completas, runtime e budgets. Ambos tiveram **zero erros JS, requests falhos e HTTP inesperados**; todos os budgets passaram. Os números antigos permanecem nos arquivos G2A originais. CPU/GPU/browser diferem e há somente uma execução de cada cenário; a variação de tempo não estabelece vantagem causal ou benchmark universal. Não se observou regressão funcional nesta estação.

Permanecem warnings conhecidos: `THREE.Clock` no runtime e chunk lazy da cena **975,51 kB minificado / 263,33 kB gzip**, acima de 900 kB, além do aviso de ambiente FORCE_COLOR/NO_COLOR no runner. Nenhum limite foi aumentado nem dependência alterada para ocultá-los. Mobile físico, outros browsers e custo de arte definitiva continuam sem certificação; contadores não estimam VRAM nem provam ausência universal de vazamento.

### Arquivos, checklist e encerramento

Corrigidos **README.md**, **PROJECT_HANDOFF.md**, **RESUME_ON_NEW_PC.md**, **01_ROADMAP_AND_GATES.md**, **G1_ACCEPTANCE.md**, **G2A_ACCEPTANCE.md** e este log. Notas de estado atual substituem G2A “local/não iniciado”; os registros anteriores continuam datados e com suas contagens/métricas originais. O contrato Blender foi lido e continua válido, sem mudança necessária. Novas evidências ficam em `artifacts/checkpoint/new-pc-*` e `artifacts/gates/G2A-new-pc-*`. Código, testes, scripts, catálogo, fixtures, pesquisas, seed, lockfile, `.nvmrc` e AGENTS foram preservados.

- [x] Clone/branch/remote/SHA íntegros e G2A publicado confirmados por Git, árvore remota e `fsck`.
- [x] Nove documentos obrigatórios lidos e implementação confrontada com aceite/contrato.
- [x] Ferramentas/dependências disponíveis e ativação local reproduzível documentada.
- [x] Sete comandos de aceite com exit 0 e saídas próprias da nova máquina.
- [x] Cena normal, bancada, falhas, rig, mobile e teclado demonstrados por E2E/browser/capturas.
- [x] Hardware e perfis atuais registrados, separados dos resultados históricos.
- [x] Documentação reconciliada; capturas históricas preservadas; integridade conferida em [auditoria final](../artifacts/checkpoint/new-pc-audit.json).
- [ ] G2B: aguarda pacote Blender/GLB definitivo, licença por recurso e revisão de arte/anatomia, além de nova autorização.
- [ ] G3: não iniciado; depende do contrato/rig e autorização posteriores.

**Implementado:** recuperação das ferramentas e correções documentais, sem funcionalidade nova. **Demonstrado:** G0/G1/G2A publicados recuperados e operacionais nesta estação, com bancada GLB funcional. **Pendente:** arte/revisão G2B, G3 e mobile físico. **Testado:** todos os comandos, 85 unidades, 22 Python, catálogo, build, 24 E2E, smoke e dois perfis aprovados. Próxima fase recomendada: preparar/receber o pacote do artista para G2B, sem iniciá-la nesta sessão.

O código continua sincronizado com o SHA remoto citado; **as correções documentais e evidências desta retomada são locais, sem commit/push/deploy**. Isso distingue sincronização do código validado de publicação das novas notas. Não houve G2B/G3, nova aquisição de anatomia ou alteração de versões do projeto.

## 2026-10-24 — Checkpoint pós-migração: documentação, ambiente e Git

### Autorização, hipótese e escopo

O usuário solicitou exclusivamente consolidar o ambiente/Git e **autorizou commit e push em origin/main**, sem operações destrutivas ou force push. Hipótese: as sete correções documentais e 21 evidências locais da retomada podem ser publicadas sem alterar a implementação validada. Estado inicial: `main` em `0e53c1e31c366a05642501bef312d0fe5d5575b6`, igual a origin/main após fetch; sete documentos modificados, 12 relatórios `new-pc-*` e nove PNG novos; nenhum commit local à frente/atrás.

Revisados README, PROJECT_HANDOFF, RESUME_ON_NEW_PC, roadmap, aceites G1/G2A e este log. Permanecem **G0/G1/G2A concluídos no escopo registrado**, **G2B/G3 pendentes**. A instrução atual do usuário substitui a recomendação anterior de começar por G2B: o próximo trabalho será **preparar o motor Rinkaku sem depender dos assets definitivos do Blender**, em outra execução. Não foi criada implementação ou preparação desse motor neste checkpoint. Critérios completos de G3 e dependências artísticas de G2B continuam preservados.

Os trechos acima que dizem “alterações locais/sem push” e a limitação equivalente em `new-pc-audit.json` descrevem o encerramento da retomada **antes desta consolidação**. Os SHA/contagens/perfis anteriores não foram reescritos para aparentar uma nova medição. `0e53c1e` identifica o código testado; um HEAD documental posterior não significa nova implementação G2A.

### Independência do ambiente: verificação e recomendação

Diagnóstico repetido em Windows PowerShell `-NoProfile -NonInteractive`, com PATH de processo reconstruído somente dos valores persistidos Machine/User. Git independente funciona; **Node/npm/npx não são descobertos**, `python`/`python3` são aliases Store sem runtime e `py` está ausente. O wrapper npm portátil e a CLI Playwright local falham sem Node. O Chromium revisão 1248 está em cache externo ao Codex; isso não torna a CLI independente. [Saída estruturada](../artifacts/checkpoint/post-migration-environment.json).

Portanto, **a execução validada ainda depende dos runtimes internos do Codex para Node e Python**. npm 11.17.0 está fora do Codex, mas seu wrapper chama `node` pelo PATH. Nenhuma ferramenta foi instalada/atualizada e nenhuma configuração global foi alterada nesta consolidação. A primeira tentativa de executar o probe por `-File` encontrou a política local de scripts; ele foi executado como comando de console com `-Command`, sem mudar a política. O diagnóstico final está no JSON vinculado, com caminhos pessoais saneados.

O [guia de retomada](RESUME_ON_NEW_PC.md) agora separa o workaround atual de uma configuração independente **recomendada, não executada**: Node 24.22.1 x64 em ZIP numa pasta do usuário, npm portátil 11.17.0 existente, Python independente com revisão fixada (proposta Windows 3.13.17) e Playwright 1.64.1 local do lockfile/browser correspondente. Inclui ativação por sessão, verificação dos executáveis e revalidação posterior. Node/Python/Playwright oficiais foram consultados para indicar a configuração, sem baixar instaladores. Os 22 testes Python existentes foram executados em **3.12.14**, não em 3.13.17. A independência completa continua uma pendência documentada, não um sucesso presumido.

### Preservação, privacidade e validação do checkpoint

Auditoria independente e revisão principal verificaram os candidatos ao commit. Código/configurações de execução, testes, scripts, catálogo, contratos, fixtures, `.nvmrc`, lockfile, AGENTS e pesquisas não mudaram. Os dois GLBs mantêm bytes/SHA do manifesto. As **17 capturas históricas** correspondem aos blobs Git da baseline; as **nove capturas novas** correspondem aos SHA da auditoria da retomada, são PNG válidos (cinco desktop 1440×900/quatro mobile 390×844), sem metadados textuais/EXIF e foram inspecionadas visualmente. Nenhuma captura ou relatório necessário foi removido/substituído.

Os registros de teste são consistentes: **85 unidades/7 arquivos**, **22 Python**, catálogo/build/typecheck/lint e **24 E2E** com exit 0. Os dois perfis têm 1.800 amostras, cinco budgets aprovados e somente o warning conhecido THREE.Clock. Isso é conferência das evidências da retomada; **as suítes de aplicativo e os perfis não foram reexecutados nesta operação só documental**, pois a implementação não mudou. Não há nova alegação de browser/screenshot/FPS.

O scan limitado aos arquivos candidatos verifica padrões comuns de segredo, credencial em URL, e-mail, caminho pessoal absoluto, caminhos privados/gerados e payload integral das pesquisas. Nenhum desses dados é necessário ao novo checkpoint. A revisão não certifica ausência universal de segredos nem substitui a proveniência autoral dos PNG. Os relatórios originais `new-pc-*` são preservados; os dois novos relatórios registram diagnóstico de ambiente e auditoria desta consolidação.

A primeira conferência staged apontou somente um espaço final em `[plugin builtin:vite-reporter]` no TXT capturado. A cópia TXT teve esse espaço removido e os TXT novos foram normalizados de CRLF para LF, conforme `.gitattributes`, sem mudar comandos/valores/resultados. A string original do reporter permanece no campo `stderr` do build em `new-pc-validation.json`. Hashes antes/depois e a transformação constam da auditoria; nenhum relatório histórico já versionado ou PNG foi alterado.

Arquivos consolidados: **README.md**, **docs/PROJECT_HANDOFF.md**, **docs/RESUME_ON_NEW_PC.md**, **docs/01_ROADMAP_AND_GATES.md**, **docs/G1_ACCEPTANCE.md**, **docs/G2A_ACCEPTANCE.md**, este log, os **12 JSON/TXT new-pc**, **nove PNG G2A-new-pc**, `post-migration-environment.json` e [post-migration-checkpoint.json](../artifacts/checkpoint/post-migration-checkpoint.json). Não há mudança de configuração executável, dependência ou ferramenta global necessária para este commit.

Checklist da preparação:

- [x] Remote/branch e ausência de divergência confirmados antes de stage; autorização de push explícita.
- [x] Sete documentos revisados; histórico e identidade do código testado separados do checkpoint documental.
- [x] Dependência de runtimes detectada e configuração independente recomendada, sem instalação global.
- [x] Código/lockfile/pesquisas/fixtures e 17 PNG históricos preservados; nove PNG e 12 relatórios novos conferidos.
- [x] Integridade dos resultados anteriores revisada; nenhuma suíte antiga declarada como recém-executada.
- [x] Links, whitespace, conjunto candidato e scan de dados conferidos na [auditoria](../artifacts/checkpoint/post-migration-checkpoint.json), antes da publicação.
- [ ] Disponibilizar e validar ferramentas independentes do Codex — recomendação pendente, fora deste checkpoint.
- [ ] Preparação do motor Rinkaku — próximo trabalho indicado, não iniciado; G2B/G3 continuam pendentes.

**Implementado:** consolidação documental e preservação das evidências. **Demonstrado:** Git independente; dependência atual de Node/Python internos; integridade do código G2A e seus resultados anteriores. **Pendente:** ambiente independente validado e próximo trabalho Rinkaku. **Testado nesta operação:** descoberta de ferramentas sem PATH do Codex e verificações documentais/de integridade; sem nova suíte funcional.

O conjunto revisado segue para commit em `main` e push normal em `origin/main`. A entrega registra o SHA completo retornado pelo Git e confirma `HEAD = origin/main = ref do GitHub`, divergência zero e working tree limpa **após** executar a publicação; o SHA do próprio commit não é embutido neste arquivo para evitar autorreferência. Sem deploy, force push ou alteração de G2B/G3.

## 2026-10-24 — G3A: motor de manifestação Rinkaku

### Autorização, hipótese e decisões de entrada

O usuário autorizou a implementação completa do anexo G3A, com autonomia técnica, validação visual e testes; sem G2B/G3B/G4, deploy ou publicação GitHub automática. Estado inicial: `main` limpa em `84e6e1f36b8558d225ae4baf82a8f79ddb35c124`, igual a origin/main. G0/G1/G2A preservados. A dependência local dos runtimes Node/Python documentada no checkpoint continua; npm portátil/Chromium já disponíveis foram reutilizados, sem instalação ou atualização de dependências.

Hipótese: amostragem absoluta de sete fases, representação procedural por buffers e uma conexão derivada da cena podem demonstrar uma transformação volumétrica reversível, sem depender de um solver com histórico ou da arte Blender. A conclusão técnica G3A não encerra o aceite artístico/anatômico do G3.

Leitura de entrada: AGENTS, roadmap, 04_SIMULATION_SPEC, BLENDER_WEB_INTEGRATION, G2A_ACCEPTANCE, DECISIONS, este log e contracts/atlas-schema. Inspecionados App/estado/scan, cena/câmera/AssetSlot, catálogo/inspector/timeline, registro/loader/cache/leases e sockets. Motor, procedural e QA/documentação foram delegados em arquivos separados; integração, revisão visual e aceite final ficaram na tarefa principal. Skills `vercel:react-best-practices` e `vercel:verification` aplicadas à revisão React e ao fluxo local completo, sem recurso Vercel/deploy.

Decisões: `sampleRinkakuAt` puro e `writeRinkakuAt` sem alocação por frame; clock transiente separado do scan; duração artística de 18 s; quatro superfícies pré-alocadas com curvas, pregas e seções assimétricas; partículas instanciadas opcionais; quality low reduz emissão/luz. A timeline de inspeção G1 pausa ao entrar na manifestação e seu contexto é mantido. UI usa atualização de 4 Hz para leitura; mixers, buffers e pose não entram no estado React por frame. Conexão utiliza socket `lumbar` real do lease G2A ou anchor do manifesto procedural transformado pela malha real. Câmera usa envelope fixo de poses para evitar zoom durante scrub.

Todo o movimento e a forma são `hypothetical_model`. Claims oficiais e fontes existentes são lidos do catálogo, sem modificação; nenhum tempo, curva, partícula, quantidade de apêndices ou valor normalizado foi promovido a cânone. Material/ativação são efeitos autorais; a resposta lombar não inventa câmaras ou batimento fisiológico.

### Implementação e verificação em andamento

Arquivos novos: `src/simulation/rinkaku*`, `src/state/rinkaku*`, `src/scene/rinkaku/`, `src/ui/RinkakuControls.tsx`, `src/ui/rinkaku.css`, E2E/perfil G3A e os três documentos de design/contrato/aceite. Integrações pontuais em App, tipos de foco, cena/main; proveniência atualizada em ASSET_LICENSES e regras de evidência G3A no gitignore. Nenhum pacote novo ou mudança do catálogo editorial.

Primeiro check de integração: TypeScript passou; o lint identificou mutações de objetos de renderer capturados por `useMemo` no callback de frame. A integração passou a acessar esses objetos por refs explícitas, preservando a mutação imperativa de Three e as regras React. Após o ajuste, TypeScript/lint e **120 unidades/11 arquivos** passaram. Testes de navegador, revisão visual, medições e aceite final serão registrados após execução; este registro não os presume aprovados.

### Fechamento G3A — implementação, visual e regressões

O primeiro passe de navegador passou em oito E2E exploratórios, mas a inspeção identificou curvas intermediárias retas demais e brilho excessivo na raiz. O procedural recebeu inflexões em S com profundidade, desenrolamento das pontas durante extensão, maior volume e material carmim com reflexão contida. A resposta luminosa lombar foi reduzida. A câmera passou a usar limites de órbita compatíveis com seu envelope posterior; scrub conserva câmera fixa. Um teste adicional comprova curvatura intermediária, elevando o total a 121. Corrigidos também retomada que perdia a direção reversa e atalho Espaço que podia solicitar play no fallback; os dois fluxos receberam asserções E2E.

Inspecionadas as capturas finais reais `G3A-rest/activation/growth/active/retract`, mobile e controles, mais a sequência de crescimento `.35→.70`. Desktop em 1440×900, mobile emulado 390×844, DPR1, quatro apêndices/seed17/padrão. A seleção do kakuhou torna o corpo translúcido nos cinco desktop; o mobile usa superfície normal. A raiz permaneceu conectada, as pontas cabem no visor de referência e o crescimento muda volume/curvatura. Mobile sem overflow, timeline legível e controles testados ≥44 px de altura. Inspeção adicional no navegador do build final conferiu profundidade em lateral, enquadramento posterior e foco próximo da raiz. Continua um protótipo autoral: sobreposição entre raízes, sem colisão, arte anatômica final ou solver físico.

Verificação final no build de produção:

| Comando / prova | Resultado concreto |
|---|---|
| `npm run typecheck` / `npm run lint` | Ambos passaram |
| `npm run test` | 121 testes em 11 arquivos passaram |
| `npm run test:catalog` | 22 Python passaram |
| `npm run validate:catalog` | Catálogo v2 válido |
| `npm run build` | Passou; manifestação lazy 12,47 kB / gzip 4,92 kB |
| `npm run test:e2e -- --reporter=list,json` em 4173 | 33 passaram em 309,78 s, 0 falhas/skips/flaky: 14 G1, 10 G2A e 9 G3A |
| Dez ciclos automáticos pela UI, sem aceleração/injeção | 18.919–19.101 ms por ciclo observado, 19 geometrias/3 texturas e UUIDs estáveis, zero erros/perda de contexto |
| Dez ciclos manuais + três remontagens | Pose/recursos determinísticos; desmontagem retorna a 13 geometrias/3 texturas |

Medições novas, não reaproveitadas: dois perfis sequenciais `node tests/e2e/g3a-production-profile.js` e `--quality=low`, preview4173, Chromium156.0.8078.4/ANGLE Radeon D3D11, Ryzen7 5825U/16GB/Windows11 Home26200, viewport1440×900/DPR1. Cache desabilitado, CDP20Mbps/50ms, 10s aquecimento+30s amostra. Padrão: interação1.274ms, ativação157ms, FPS p50/p10 59,88/58,82, draws≤23. Econômico: interação1.254ms, ativação395ms, FPS59,88/58,82, draws≤22. Transferência Body367.294bytes + lazyG3A5.194bytes, total372.488bytes; todos os budgets passaram. Zero erros JS/rede/HTTP; permanece aviso conhecido `THREE.Clock` da dependência. Contadores não medem VRAM; rAF não mede tempo de GPU e viewport emulado não mede FPS de telefone físico.

Documentação final: design, aceite e contrato G3A novos; roadmap, README e notas de handoff/retomada atualizados para distinguir a implementação local do checkpoint publicado anterior. Aceites G1/G2A ganharam somente referência ao novo aceite, preservando os resultados históricos. Catálogo/claims, contratos existentes, pesquisas, package/lockfile, fixtures, infraestrutura de assets e testes G1/G2A preservados. Os 26 PNG históricos foram copiados antes dos E2E; novas capturas das regressões usam prefixo `G3A-regression-`, permitindo restaurar os históricos byte a byte. Relatórios revisados substituem caminhos pessoais por marcadores; originais locais e backups ficam ignorados em `artifacts/local/`. Auditoria em `artifacts/g3a/final-audit.json`.

**Implementado:** motor puro/clock, superfícies procedurais, animação local do kakuhou, partículas opcionais, UI completa, câmeras e contrato de adaptação futuro. **Demonstrado:** manifestação e retração contínuas, reversão/scrub determinísticos, conexão lombar e preservação do observatório/bancada. **Testado:** comandos e provas acima, com imagens inspecionadas. **Pendente:** revisão artística/anatômica humana, GLB final/mapeamento real, celular físico e ambiente independente recomendado no checkpoint. G3A tecnicamente concluído; não se declara G3 completo. G2B/G3B/G4 não iniciados, sem novo conteúdo canônico, dependências, ferramentas globais, deploy, commit ou push. Alterações permanecem locais para revisão sobre `main`/origin-main em `84e6e1f36b8558d225ae4baf82a8f79ddb35c124`.

## 2026-10-24 — G3A: pacote de revisão visual antes do checkpoint

Autorização limitada à revisão do G3A existente: capturas reais, comparação, inventário e parecer crítico. Nenhuma reimplementação, funcionalidade nova, G2B/G3B/G4, commit, push ou deploy. Lidos aceite, design e contrato futuro completos, além das instruções e módulos efetivos. Uma avaliação independente revisou código e imagens, sem editar arquivos.

Hipótese de revisão: poses com corpo opaco, câmera invariável e dados do clock permitem julgar a geometria sem mascarar encaixes com transparência. O objetivo era verificar visualmente o sistema entregue, não aprovar sua aparência por resultado de teste. Foram produzidos em `artifacts/gates/G3A-review/` 42 screenshots novos, sete painéis compostos exclusivamente desses pixels, um vídeo de ciclo real, índice, relatório, inventário, metadados e scripts reproduzíveis. Alterações desta operação: novo diretório, whitelist pontual no gitignore, link no aceite e este registro. Código, UI, catálogo, contratos, dependências e assets continuam iguais.

Capturas: sete fases `.040/.140/.275/.530/.760/.900/.980`; oito frames `.350→.700` em passos `.050` (`.700` já é fixação); posterior/lateral ativo `.900`; três detalhes lombares; seis pares de fronteiras ±.001; sete estados de retração até `1`; antes/depois da sequência `.700→.200→.700→.300→.700`; mobile 390×844 em crescimento automático. Corpo com opacidade 1, quatro apêndices, seed 17, padrão/partículas. O screenshot mobile ocorreu com `playing=true`, clock `.522217–.524983`; a UI exibe `.518` por atualização a 4 Hz. O vídeo real registra todas as sete fases; 70 amostras, conclusão observada em 18.182 ms após play. Sem erro JS/requisição falhada; somente aviso conhecido THREE.Clock.

Verificações desta operação: TypeScript/lint/build passaram; 121 unidades/11 arquivos passaram; catálogo válido durante build. Captura/smoke operou a UI real e conferiu fase, reprodução, câmera, conexão, retorno temporal e viewport sem overflow. Em `.700` repetido, PNG byte a byte idêntico e diferença RGB zero, mesmas pontas/raízes/hash/câmera. Diagnóstico offline do mesmo adaptador em 201 poses: coordenadas finitas, desvio dos centros de raiz zero; maior deslocamento de vértices nos limites ±1e−6 foi 1,87e−6 unidades de cena. Esses dados não medem colisão nem naturalidade. Os 33 E2E completos e benchmarks do aceite anterior não foram apresentados como reexecução nesta revisão.

Achados críticos: crescimento muda comprimento, seção e curvatura com silhueta legível; lateral demonstra profundidade. Porém as bases volumosas se sobrepõem, o remendo rosa fica aparente e não há união visual com a pele. Repouso/ativação/liberação e fixação/ativo têm pouca distinção geométrica. A retração é contínua nas amostras, mas concentra recolhimento em 0,9 s e requer julgamento de cadência. No mobile, timeline e controles cabem, porém o espécime fica pequeno e há vazio no visor; a raiz perde leitura. Curvas ainda compõem um X e mostram dobras proximais/facetas. Há sombras existentes do corpo/cena; não se declarou ausência total de sombras nem implantação física resolvida pelas meshes novas.

Os 68 arquivos de código/testes/contratos/public/research/package observados e 58 imagens anteriores conservaram hashes. PNGs originais completos e metadados permitem auditar os recortes/legendas; não houve imagem externa/generativa ou retoque de geometria. Logs revisados têm caminhos pessoais saneados; originais locais em artifacts/local, ignorado. Índice em [G3A-review/INDEX](../artifacts/gates/G3A-review/INDEX.md), parecer em [REPORT](../artifacts/gates/G3A-review/REPORT.md), integridade em [verify-review.json](../artifacts/gates/G3A-review/verify-review.json).

**Implementado nesta operação:** pacote de revisão, não novas funcionalidades. **Demonstrado:** sete fases, crescimento, vistas, conexão aparente, retração, repetibilidade e mobile em movimento. **Testado:** verificações e smoke acima. **Pendente antes do aceite visual:** implantação lombar, leitura de fases, aproveitamento móvel e revisão humana da cadência/acabamento. Nenhum refinamento foi aplicado; alterações G3A permanecem locais para aprovação. Cânone, qualidade anatômica e disponibilidade Blender continuam sem promoção indevida.

## 2026-10-24–25 — G3A.1: refinamento visual e direção de arte

Autorização específica para concluir o refinamento local, incorporar os cinco cuidados da análise e preservar os contratos anteriores. Sem G2B/G3B/G4, commit, push ou deploy. Aprovação artística final reservada ao usuário. Estado de entrada: G3A implementado, tecnicamente validado e ainda local sobre main/origin-main em `84e6e1f36b8558d225ae4baf82a8f79ddb35c124`. Código, build e evidências anteriores copiados para backup local ignorado antes de editar; revisão G3A anterior preservada.

Hipótese: a sensação de anexos vinha da sobreposição do kakuhou/overlay e de raízes volumosas, além de pouca identidade nas fases iniciais. A solução preserva o órgão/anchor, substituindo somente sua apresentação durante a manifestação, e integra perímetro enterrado, relevo, colo e tecido à mesma superfície indexada do adaptador. O contato é aproximado ao proxy atual; não é alteração da pele corporal nem contato universal com GLB. A distribuição varia explicitamente por quantidade1–4. Ativação eleva montes, liberação produz brotos alongados temporários, crescimento percorre curvas, fixação tensiona e desenvolve cordões/pregas. A inspeção do primeiro passe revelou colos claros/salientes semelhantes a encaixes; o segundo passe reduziu o levantamento maduro de ~.086 para ~.031 unidades e antecipou a transição do tecido. Não se usou luz emissiva para esconder a geometria.

Arquivos de implementação: `src/simulation/rinkakuPlayback.ts`, estado/clock e respectivos testes; adaptador procedural/testes; montagem `RinkakuScene`; `AssetSlot`/`IntegratedAssets`; câmeras/teste/observatório, tipos de foco, runtime diagnóstico e controles/CSS. O mapa monotônico e invertível separa segundos de reprodução dos dados absolutos do sampler: total nominal21s, retração3,4s, densidade18→68 entre .93 e .95. Sampler/intervalos e motionTime de referência18s conservaram hashes. A câmera desktop de comparação foi preservada; o mobile recebe enquadramento fixo mais próximo e visor redistribuído, com comando oblíquo explícito. Correções de integração: filtro desatura somente tecido hipotético, proteção de picking sob grupos invisíveis/isolar e bounds reais do corpo GLB no enquadramento. Nenhuma mudança nos contratos existentes, catálogo/claims, assets, dependências ou testes G1/G2A.

Novos arquivos de verificação: `tests/e2e/g3a1-refinement.spec.ts` e `g3a1-production-profile.js`. O teste G3A anterior conserva suas invariantes, com duração nominal ajustada e destinos próprios de evidência. Novos scripts de captura/composição/diagnóstico/auditoria e relatório ficam em `artifacts/gates/G3A1-review/`. Documentação: G3A1_REFINEMENT, aceite/design/contrato G3A, README, roadmap, handoff e retomada; histórico mantido. Inventário e todos os paths estão no índice novo.

| Comando/prova desta execução | Resultado |
|---|---|
| `npm run typecheck` / `npm run lint` | Passaram |
| `npm run test` | 134 testes /12 arquivos passaram |
| `npm run test:catalog` / `npm run validate:catalog` | 22 Python passaram, catálogo v2 válido |
| `npm run build` | Passou; chunk lazy13,29kB/gzip5,14kB |
| `npm run test:e2e -- --reporter=list,json`, produção4173 | 40 passaram/396,77s;0 falhas/skips/flaky;14 G1+10 G2A+9 G3A+7 refinamento |
| Dez ciclos automáticos UI reais | 21.109–22.094ms observados;18 geometrias/3 texturas e UUIDs estáveis, zero erros |
| Dez ciclos manuais +3 remontagens | Determinismo e recursos estáveis; retorno a13 geometrias/3 texturas |
| Diagnóstico offline804poses | Finitude/envelope/normais/recursos/raízes/revisita passaram; deriva0, fronteiras±1e-6 com deslocamento máximo1,97e-6u |

Novos perfis sequenciais, não números reaproveitados: baseline G3A congelada, G3A.1 padrão/econômico e mobile emulado. Mesmo Ryzen7 5825U/Radeon integrada,16GB,Windows11 build26200,Chromium156.0.8078.4/ANGLE D3D11. Desktop1440×900/DPR1, mobile390×844/DPR1,CDP20Mbps/latência50ms,cacheoff,10s aquecimento+30s rAF. Baseline medida novamente: interação1375ms,FPS p50/p10 59,88/58,82,draws23,19geometrias/3texturas. Novo padrão:1263ms,59,88/58,48,draws20,18/3; econômico:1214ms,59,88/58,82,draws19,17/3; mobile emulado:1386ms,59,88/59,52,draws20,18/3. Todos os budgets passaram; zero erros JS/rede/HTTP, aviso conhecido THREE.Clock. Payload Body367.909+lazy5.420=373.329bytes, ante372.488bytes. Tempos de residência mudaram de18 para21s, logo não se declara workload idêntico. rAF/heap/contadores não certificam GPU/VRAM ou telefone físico.

Evidência visual: oito painéis exclusivamente de capturas reais, sete fases, oito frames de crescimento, sete de retração, seis detalhes lombares,36poses(1–4×três vistas×crescimento/ativo/retração), revisita e mobile390/430 em andamento.25pares desktop têm mesma câmera/t/configuração/opacidade até1e-6;4pares mobile declaram a câmera/layout novos. Fração vertical projetada do bounding box corporal:41,0→56,7% em390 e45,0→59,7% em430. Filme real: ciclo posterior21.093ms, retração lateral/oblíqua desde.93 em4.281/4.261ms e reverso completo21.117ms. Frames extraídos foram examinados sem interpolação/retoque; metadados/pixels originais ficam no pacote.

Avaliação crítica: remendo rosa e sobreposição grosseira das bases removidos nas vistas amostradas; ativação/liberação geométricas reconhecíveis, progressão e retração mais legíveis, mobile melhor ocupado. Persistem bordas anulares/facetas no close, acabamento procedural, oclusões laterais e organização emX; fixação/ativo têm diferença sutil. Nenhum solver de colisão/pele; ausência de penetração grosseira nas poses inspecionadas não equivale a garantia universal. Fonte e contrato GLB futuro preservados, mas o modelo final deve fornecer contato/paleta/envelope próprios. Uma rodada dev foi invalidada por edição/HMR simultâneos de RinkakuScene; após recriar recursos, o dev requer reload completo. Aceitação técnica e perfis usam produção imóvel.

Preservação:146 arquivos históricos conferidos byte a byte, incluindo pacote G3A-review.17 capturas G1/G2A atualizadas pelos testes foram copiadas para o pacote novo antes de restaurar os originais. Sampler, catálogo, contratos e package/lockfile preservados. Logs revisados sem caminhos pessoais; brutos/backups/build congelado em artifacts/local ignorado. Auditoria em `artifacts/g3a1/final-audit.json`. Nenhuma dependência/ferramenta global instalada; ambiente independente do Codex e celular físico permanecem pendentes.

**Implementado:** refinamento completo no escopo autorizado. **Demonstrado:** comparativos reais, implantação, fases, scrub, reverso, vistas e mobile. **Testado:** suítes, ciclos,804poses e quatro perfis novos acima. **Pendente:** aprovação artística humana, limites do proxy e itens externos declarados. Alterações locais preservadas para revisão; G2B/G3B/G4 não iniciados e nenhuma publicação realizada.

## 2026-10-25 — Checkpoint aprovado G3A/G3A.1 P1

O usuário aprovou explicitamente a entrega técnica e visual de protótipo P1 com ressalvas e autorizou commit/push em origin/main. A aprovação não inclui P2, arte final Blender, deploy ou implementação de G2B/G3B/G4. Próxima etapa somente planejada:G4A,circulação sanguínea e transporte visual RC. As aprovações pendentes e proibições de publicação dos registros anteriores descrevem aqueles momentos históricos; o novo aceite P1 não os apaga.

A checagem complementar encontrou defeito funcional concreto: em .999 restavam montes cor de pele que desapareciam pelo cutoff de visibilidade. A primeira correção emZ ainda deixava discos através da pele translúcida; a solução final recolhe altura e área, incluindo todos os vértices/caps e o diagnósticoXYZ da ponta, por gate absoluto suave dos canais existentes. XY usa formation² eZ assenta no contato enterrado com folga artística específica do proxy. Nenhum material/luz foi usado para mascarar o resíduo. Sampler,mapa temporal,layout,materiais,budget/ownership de recursos permanecem;24 hashes das seis poses aprovadas para1–4 quantidades são idênticos. Novo teste unitário/visual demonstrou a falha antes e passou após. Também foi corrigido o picking de filhos sob pais invisíveis em AssetSlot/IntegratedAssets,com helper de visibilidade efetiva e clique real pelo corpo transparente. HMR continua com a limitação de reload já documentada; não foi ampliado o escopo artístico.

Arquivos da correção: ProceduralRinkakuAdapter.ts/test; AssetSlot.tsx;IntegratedAssets.tsx;novo visibility.ts/test;novo tests/e2e/g3a-checkpoint.spec.ts com quatro casos. Documentos de aceite/design/refinamento/contrato,README,roadmap,handoff e retomada distinguem P1 aprovado e P2 pendente. public/ASSET_LICENSES.md identifica o overlay inicial como histórico e a procedência original da implantação atual. Novo docs/G3A_CHECKPOINT.md reúne os resultados finais. Os requisitos de junção lombar contínua,topologia,normais/materiais,close-up,envelope e retração foram registrados no contrato Blender; não iniciam a produção do asset.

Build final:TypeScript/lint passaram;139 unidades/13 arquivos passaram;22 Python ecatálogo v2 passaram;build passou,lazy13,49kB/gzip5,24kB. Suíte completa de produção:44 E2E passaram em429,10s,zero falhas/skips/flaky(14G1+10G2A+9G3A+7G3A.1+4checkpoint). Novamente10ciclos automáticos reais,21.973–22.013ms observados,polling/overhead incluídos,18 geometrias/3texturas eUUIDs estáveis;10 ciclos manuais e3remontagens retornam a13/3. Sem perda de contexto ou erro na prova de ciclos. As novas imagens em.999 e1 são byte a byte idênticas ao repouso nas vistas foco/lateral,1–4 apêndices,com corpo opaco eopacidade20%. t1 mantém0apêndices/partículas visíveis;os buffers intencionais de replay ficam alocados até sair do modo,quando são descartados. Não se confunde prealocação com resíduo visual,nem contadores com VRAM.

Preservação e revisão de conteúdo são registradas separadamente em artifacts/checkpoint;capturas/vídeos/relatórios anteriores são conservados e saídas das regressões finais arquivadas antes da restauração. Arte final continua pendente:bases arredondadas/conectores,continuidade pele/kagune,facetas e revisão nos modelos definitivos. Esses limites aceitos no P1 não motivam outra rodada extensa de refinamento procedural. As pesquisas,catálogo,contratos de base epackage/lock permanecem;nenhuma dependência ou ferramenta global instalada.

O checkpoint usa a mensagem autorizada `feat: complete G3A rinkaku manifestation prototype`,sobre parent main/origin-main84e6e1f36b8558d225ae4baf82a8f79ddb35c124 verificado porfetch/ls-remote. O commit que contém este registro é sua identidade;SHA remoto eworking tree limpo são conferidos após o push normal e informados ao usuário,evitando um SHA autorreferente. G4A,G2B,G3B eG4 não foram implementados nesta operação.

Fechamento das evidências deste checkpoint:318 arquivos históricos preservados byte a byte, com novas saídas de regressão arquivadas separadamente. Novo perfil padrão do build final:interação1.221ms,FPS59,88/58,82(p50/p10),até20draws,18geometrias/3texturas,UUIDs estáveis,todas as sete fases. Payload367.916+5.518=373.434bytes,zero erros JS/rede/HTTP,todos os budgets passaram;permanece o aviso conhecido THREE.Clock. Filmes reais adicionais registram .98→1 em foco/lateral com corpo opaco e20% de opacidade,incluindo permanência no endpoint. Auditoria pré-publicação não encontrou padrões de segredo,temporários indevidos ou novo material externo;manifestações/evidências autorais e pacote anterior preservados. Resultados e limites estão em docs/G3A_CHECKPOINT.md e artifacts/checkpoint.

Configuração de preservação do checkpoint:regras específicas de.gitattributes mantêm os novos pacotes de evidência byte a byte,sem normalizaçãoCRLF/LF;logs capturados conservam a linha vazia final eCR-at-EOL,sem relaxar whitespace do código. A conferência do conteúdo real no índice do Git não encontrou diferença nos artefatos verificados. Fonte,vídeos e capturas não foram reformatados para satisfazer o diff.

## 2026-10-25 — G4A: motor vascular e transporte visual RC

Autorização explícita após a análise de leitura: implementar todo G4A P1 sobre main/HEAD `717f4069c5e662f78ea8b28e7d13e0636ab0c5dd`, incorporando os cinco cuidados identificados. Proibidos G4B/G5/G2B/G3B, commit, push e deploy. Aprovação artística final reservada ao usuário; qualidade anatômica final P2 permanece dependente da arte/revisão Blender.

Hipótese: um circuito didático fechado e um sampler absoluto permitem explorar transporte, selecionar e seguir entidades sem depender de fisiologia quantitativa ou de assets finais. O motor em `src/simulation/vascular.ts` usa comprimento de arco e referenciais periódicos; parâmetros derivam de identidade/seed, nunca de i/n. A mesma entidade conserva trajetória em100/500/2000. O relógio `src/state/vascular.ts` integra somente segundos de animação e velocidade normalizada; seleção, tracking e destaque não modificam os dados determinísticos.

O adaptador `src/scene/vascular/ProceduralVascularAdapter.ts` fornece hemácias bicôncavas, RC lobuladas originais e parede curva com relevo autoral. Buffers/pools são pré-alocados, cores mudam por comando e o ownership é explícito:3geometrias,3materiais,1textura128² e2buffers de instância; recursos do cache GLB não são descartados. IDs por pool/instanceId resolvem para uma identidade semântica. O bound conservador inclui escala/orientação e todos os vértices das células; não existe solver de colisão entre células ou CFD.

Integração: `bodyContext.ts` captura posição/quaternion/up/projeção e target/limites OrbitControls antes da aproximação, além de seleção/camadas/opacidade/isolamento/scan e estado temporal/configuração Rinkaku/GLB. Body permanece montado com frameloop suspenso fora de Corpo; Micro é lazy e seus recursos exclusivos são liberados ao sair. A câmera automática em `vascular/camera.ts` viaja pelo arco do vaso, sem cortar o interior do circuito. Reduced motion e scrub avaliam poses estáticas. `Esc` é contextual; o retorno restaura o contexto em vez de executar reset.

UI em `VascularWorkspace.tsx`/`vascular.css` conserva a estrutura do observatório e oferece câmeras, seleção HTML/clique, destaque RC, reprodução/pausa/passos/scrub/velocidade/perfis e evidências. `App.tsx` integra navegação e falhas sem expor controles corporais que contornem a restauração. O suplemento editorial `vascularEvidence.ts` usa os tipos de claims/citações existentes e valida namespace, fontes elegíveis, datas, locators e disclaimers; catálogo e contratos de base permanecem intactos. Fontes primárias consultadas constam de G4A_VISUAL_MODEL; nenhuma figura/mesh externo foi incorporado.

Revisão real do primeiro passe encontrou saturação luminosa, células excessivamente grandes e layout intermediário que colapsava o visor. Foram corrigidos luz, escala artística, distribuição da interface e relevo da parede. A geometria RBC ganhou normais centrais coerentes e24lados; RC conserva três lóbulos sem emissão. Um E2E revelou slider desatualizado depois de passos: comandos pausados agora aparecem imediatamente, mantendo amostragem UI a4Hz somente para a reprodução. A revisão também corrigiu picking através da parede opaca, inércia residual no modo reduzido e arredondamento histórico na avaliação estática da câmera. Duas falhas iniciais de automação eram valores HTML de range escritos como `.7/.8`; os testes passaram a enviar `0.7/0.8`, preservando suas expectativas.

Arquivos adicionais: testes puros de sampler/adaptador/estado/câmera/contexto/evidências; `tests/e2e/vascular.spec.ts`, `g4a-production-profile.js`, script de captura e quatro documentos G4A. O E2E G1 que esperava Micro informativo foi atualizado somente para a nova cena, conservando as verificações de contexto e do modo Comparar. .gitignore/.gitattributes reservam os artefatos G4A; backup ignorado de todas as evidências rastreadas existe antes das regressões. README/roadmap/proveniência foram atualizados; os registros G3A permanecem históricos.

Fechamento funcional: uma auditoria identificou corte ao soltar Flow/Tracking e damping corporal antigo caso reduced motion fosse ativado em Micro. Free agora conserva a câmera real, reservando o retorno à composição inicial para montagem/reenquadramento; a preferência atual limita o damping salvo na restauração. Novos testes verificam button/profile/Esc sem mudança de pose e alteração de preferência no retorno. O novo teste de câmera livre revelou listener de setas perdido pela reconexão dos controles; teclado passou a ser propriedade do canvas, lendo o controle atual, sem subscrever inputs do painel. Esses ajustes não mudam o sampler nem as trajetórias.

Suíte CPU final: `npm run typecheck`, `lint`, `test`, `test:catalog`, `validate:catalog` e `build`, todos exit0.190 unidades/19arquivos (139anteriores+51novas),22Python,catálogo v2 válido e chunks Micro lazy. Node24.22.1,npm11.17.0,Python3.12.14 e Chromium156 existentes; nenhuma ferramenta global/dependência instalada. A dependência anterior de Node/Python internos do Codex permanece documentada; não é um ambiente independente recém-homologado.

E2E final de produção: `npm run test:e2e -- --reporter=list,json`,56/56 em9,5min,sem skips,após três testes direcionados aprovados. Inclui44regressões G1/G2A/G3A/G3A.1 e12G4A,dez transições exatas Body→Micro→Body,GLB/socket/lease/isolamento/opacidade,pickingRC/RBC real,42sreais de tracking,ID ausente,teclado/toque,reduced motion,contexto WebGL perdido/recuperado e fallback. Recursos exclusivos ativos0 e disposed=created após cada saída; posição/alvo Body<1e−7,quaternion<1e−12,up/projeção preservados. Regressões também repetiram dez ciclos completos automáticos e manuais do Rinkaku,com20geometrias/3texturas corporais estáveis (inclui o novo marcador de duas geometrias).

A primeira suíte completa teve51/52aprovados: uma expectativa antiga fixava13geometrias corporais antes do marcador. Foi substituída por comparação com a baseline corporal efetiva e sua liberação, preservando o teste de ownership. Relatórios iniciais e o teste de teclado que falhou são mantidos; uma execução intermediária foi interrompida para corrigir câmera e não é contada como suíte aprovada. A suíte final única contém todos os cenários. Logs/exit codes e provas estão em `artifacts/g4a/`.

Os perfis100/500/2000 são medições novas, em contextos separados/sequenciais,10sde aquecimento+30srAF,Windows11/Ryzen7 5825U/Radeon integrada/16GB,Chromium156,1440×900/DPR1,cache frio eCDP20Mbps/50ms. O tempo de entrada usa DEFAULT500 antes da troca de perfil. Três draws e três geometrias/duas texturas observadas pertencem somente ao renderer Micro,com Body residente e render suspenso; o adaptador possui uma textura128². Não há sombras por célula,transparência ou pós-processamento. rAF/heap/contadores não são tempoGPU/VRAM. Números finais e budgets permanecem nos JSONs próprios, sem alterar metas para passar.

Medições finais no build congelado após as correções:100→59,88/59,88FPS p50/p10 e56.032tri;500→59,88/59,52 e214.432tri;2000→59,88/59,52 e808.384tri. Três draws em todos,UUIDs/contadores estáveis,todos os budgets aprovados,sem erros JS/HTTP/requests. Body frio1,44–1,64s,Micro padrão1,44–1,47s,transferência conjunta391.985bytes. Aviso `THREE.Clock` deprecatado pertence à dependência existente; não motivou atualização de stack neste gate.

O pacote `artifacts/gates/G4A-review/` reúne sete capturas exigidas, oito poses em0/5/10/15/20/25/30/35s,mobile com controles/evidências,vídeo real com42sde transporte e quatro frames extraídos. Inspeção registrou e corrigiu saturação,escala excessiva,layout intermediário,parede que permitia picking e aviso mobile recortado. Permanecem parede esquemática/escura,facetas,reflexos claros,oclusões/sobreposição celular e realce dourado que reduz relevo. Identidade disponível não garante visibilidade integral de uma RC atrás de outra célula. O relatório crítico diferencia técnica,UX,visualP1 e precisão anatômica; arte humana/P2,telefone físico e assets Blender licenciados/revisados seguem pendentes.

**Implementado:** motor puro,relógio independente,adaptador instanciado,câmeras,inspector,evidências e navegação contextual. **Demonstrado:** seleção/acompanhamento,looping,retorno exato e reprodução/scrub em desktop/mobile emulado. **Testado:** suítes completas e provas acima,mais perfis independentes. **Pendente:** aprovação artística humana,arte final,ambiente independente e telefone físico. G4B/G5/G2B/G3B não iniciados; sem commit,push ou deploy. Baseline main/origin-main permanece `717f4069c5e662f78ea8b28e7d13e0636ab0c5dd`; arquivos ficam locais para revisão.

Preservação final:505 arquivos rastreados de evidência histórica conferidos por SHA256;166 saídas regeneradas foram copiadas para `G4A-review/regressions/` antes de restaurar os bytes originais. As novas17capturas/vídeo foram renovadas no mesmo build final das medições; filme registra42,31sde transporte,81amostras,sem erro/request falho e apenas o avisoClock conhecido. Desktop/mobile e quatro frames de vídeo foram inspecionados; captura mobile390px tem documentWidth390.

Revisão de distribuição/privacidade: código,figuras e bump autorais,sem mesh/imagem/textura externa; dist inclui somente runtime,catálogo/marca/proveniência e fixtures sintéticas anteriores. Nenhum segredo identificado nos padrões de alta confiança.34logs/JSONs novos revisados;11saneados,107ocorrências de caminhos pessoais removidas,brutos preservados comSHA em `artifacts/local/` ignorado. Catálogo,contratos,research,references,package/lock e sampler/adaptador Rinkaku sem diff. Manifestos de preservação,saneamento e auditoria final ficam em `artifacts/g4a/`. Nada foi staged,commitado,publicado ou implantado.

## 2026-10-25 — G4A.1: refinamento vascular autorizado

Escopo autorizado: reduzir oclusão e aproximações excessivas da câmera, melhorar parede/iluminação, preservar morfologia RC na seleção e reduzir títulos sobrepostos, sem reimplementar transporte ou avançar G4B/G5/G2B/G3B. Aprovação artística reservada ao usuário; commit/push/deploy proibidos. Baseline local de889arquivos e build preservados antes da alteração; inclui o G4A ainda não commitado.

Hipótese/decisões em [G4A1_REFINEMENT](G4A1_REFINEMENT.md): planner de pose determinístico separado da suavização, buffers de obstáculos reusados, brackets externos depth-tested, materiais mate e relevo de baixa frequência somente para fora do envelope já validado. Arquivos: tracking/camera,adapter/renderer/visibility e respectivos testes,App querymicroSeed,UI/CSS compactos,novos E2E/profiler/estudos de oclusão/scripts de captura. Sampler vascular,IDs,catálogo,contratos base,GLB e Rinkaku permanecem preservados.

Primeiro passe: comparação estática729poses com triângulos reais e hashes de trajetória iguais; ganho mais forte em2000/seed17. Estudo de reprodução confirmou redução de oclusão severa,mas revelou picos de aceleração da câmera; o fechamento permanece condicionado à correção temporal e nova medição. Não se declara tracking resolvido nem arte aprovada somente por testes verdes.

Fechamento funcional posterior: a primeira suavização adaptativa foi substituída por transporte periódico da entidade e correção de enquadramento com limites de velocidade/aceleração. O sampler e o relógio absoluto não dependem desse estado de apresentação. Pausa, scrub arbitrário, pequenos passos e reduced motion usam referência absoluta; reprodução limita a aproximação ao candidato desejado. A fonte e os hashes do estudo final correspondem ao código final. O estudo inicial permanece preservado: seus picos de aproximadamente 185–220 unidades/s² eram um defeito intermediário G4A.1, não uma métrica da baseline G4A. Após a correção, máximos de 6,58–8,20 nas três execuções; up consecutivo ≥0,99999897.

Verificação completa final, sem exclusão de regressões: TypeScript, lint, 203 unidades/21 arquivos, 22 testes Python, catálogo v2 e build passaram (exit 0); E2E de produção 62/62 em 9,6 min, sem skips, flaky ou falhas. Os seis cenários novos não são somados novamente ao total. Inclui dez transições Body → Micro → Body, câmera manual/target/seleção/camadas, GLB/lease/socket/isolamento/opacidade, tracking e liberação, retorno à mesma referência por scrub pequeno, reduced motion, teclado/mobile, perda/recuperação WebGL e regressões completas Rinkaku. Logs em `artifacts/g4a1/`; nenhum teste anterior foi removido para facilitar a aprovação.

Oclusão por diagnóstico triangular 9 × 9: 729 pares estáticos em nove combinações de seed/perfil, ganho médio +6,04 p.p.; meta exploratória +10 p.p. não atingida. Estudo de reprodução: 40 s a 60 Hz, três casos, 81 amostras por versão/caso, ganho médio +15,99 p.p. No caso 2.000/seed 17, visibilidade 15,24% → 56,42%, oclusão severa 26 → 3,5 s, maior intervalo 12 → 3 s, amostras ≥50% visíveis 12,35% → 67,90%, frames próximos a bounds 2.008 → 319/2.400. Todos os hashes de movimentos pareados iguais. Gap mínimo conservador −0,02258: proximidade residual explícita, não prova de penetração de triângulos; não há promessa de ausência de oclusões em 2.000 células. Contenção das partículas e continuidade do circuito continuam cobertas pelas provas anteriores e novas, sem alterar trajetórias para a câmera.

Revisão real: sete pares antes/depois, oito PNGs durante reprodução e vídeo contínuo com 42,31 s de transporte observado. Inspeção dos 22 PNGs registrou RC com cor/relevo preservados, redução de reflexos e melhor leitura da parede/título; permanecem concavidade frontal RBC pouco contrastada, facetas, parede lisa/esquemática, marcador fino e hemácias periféricas grandes em algumas poses. Visão geral e parede mantêm câmera idêntica; cinco comparações usam câmera adaptativa diferente, declarada por metadados. O vídeo registra a aplicação real, sem renders externos; quadros discretos não são aprovação de cada frame nem avaliação artística humana. Mobile é emulação na GPU da estação. Pacote e parecer em `artifacts/gates/G4A1-review/`.

Preservação: 736 arquivos de evidência pré-G4A.1 conferidos por SHA-256; 170 saídas regeneradas pelas regressões foram arquivadas no novo pacote antes da restauração byte a byte. Nenhuma evidência anterior foi apagada ou substituída silenciosamente. A licença/proveniência registra somente geometria, materiais, marcador e bump autorais; referência humana textual não autentica a anatomia procedural. Contrato Blender futuro acrescenta bounds, normais/materiais, volume bicôncavo, marcador independente e nova validação no renderer, sem iniciar G2B.

Última inspeção do vídeo: a decodificação real em 15/30/45 s revelou sobreposição parcial do ID no visor com o aviso PROXY no desktop. Correção localizada no espaçamento inferior do footer Micro, de 56 px herdados para 20 px; mobile mantém 15 px. Acrescentada asserção de não sobreposição aos cenários E2E existentes de desktop/mobile, sem inflar a contagem de cenários nem alterar câmera, células, materiais ou sampler. Logs e medições anteriores preservados antes da renovação das evidências; esse ajuste não abre nova rodada artística.

Encerramento após o CSS: TypeScript, lint, 203 unidades, 22 Python, catálogo e build repetidos com exit 0; executores Node equivalentes aos scripts npm registrados literalmente em `checks.json`, pois npm não estava no PATH da sessão auxiliar. Seis cenários específicos rechecados em 36,1 s com o mesmo Chromium completo da baseline, incluindo não sobreposição de ID/PROXY no desktop e mobile 390/430. Não são 68 cenários: a suíte completa anterior contém 62, e seis deles foram repetidos. Uma tentativa com headless shell teve um timeout aguardando rAF; foi preservada com trace local e relatório próprio. Nenhum timeout, expectativa ou budget foi ampliado.

Doze perfis finais pareados: seis baseline preservados e seis atuais renovados depois do último build/capturas, sempre em contextos separados, com 10 s de aquecimento e 30 s de amostra. Todos os budgets originais passaram; p50 59,88 FPS nos doze casos, p10 antes 59,52 e depois 58,82–59,52. Fluxo três draws; Tracking quatro pelo marcador. Triângulos 56.032/214.432/808.384, UUIDs estáveis, sem erros JS/HTTP/requests. Body final 1,16–1,24 s, Micro padrão 500 em 1,40–1,44 s; payload conjunto 394.992 bytes (+3.007). Hardware/browser/viewport/protocolo e limites de rAF/headroom/VRAM/telefone físico constam dos JSONs e de `G4A1-review/PERFORMANCE.md`. Resultados do primeiro passe pós-materiais continuam em `iterations/pre-overlay-fix/`; não são a tabela final.

Pacote final renovado: sete pares, oito quadros e filme com 42,563 s de transporte observado. Os três PNGs decodificados em 15/30/45 s pertencem ao vídeo final SHA256 `42abf4f0b1988bc0dd8e34f2a2d20168146ef7bd4f10322a57f6d7e870ad0a79` e foram abertos; identidade e aviso estão legíveis/separados. O OneDrive recusou rename da pasta anterior. A captura passou a copiar e verificar hashes de todos os arquivos antes de renovar saídas conhecidas; não apaga/move evidência. Vídeo bruto novo permanece na área local ignorada; versão anterior do pacote tem manifesto verificável em `history/`. Sem nova alteração artística ou de motor após essas provas.

**Implementado:** todos os itens G4A.1 autorizados. **Demonstrado:** seleção sem fill dourado, tracking melhorado, parede/título e última sobreposição corrigida, comparativos e vídeo reais. **Testado:** suítes, seis rechecagens finais, determinismo/oclusão/proximidade/movimento, dez transições e doze perfis. **Pendente:** revisão artística humana, arte P2/Blender, telefone físico e validação de ferramentas independentes do Codex. Riscos remanescentes documentados: oclusões/proximidade densas, células sem colisão, parede/facetas esquemáticas, marcador fino e concavidade frontal RBC pouco contrastada. Meta exploratória estática +10 p.p. não atingida (+6,04); ganho live +15,99 p.p. pertence a outro agregado. Branch/HEAD permanecem no checkpoint `717f4069c5e662f78ea8b28e7d13e0636ab0c5dd`; working tree intencionalmente local, sem staging, commit, push ou deploy.

Auditoria final de evidências/escopo passou sem falhas: 736 arquivos históricos conferidos, 22 capturas obrigatórias e três frames decodificados associados ao vídeo final, doze perfis, checks/unidades/E2E e hashes de fontes protegidas. Catálogo, GLB, sampler/estado vascular, Rinkaku e package/lock preservados; nenhuma dependência nova ou recurso público inesperado. Saneamento conferiu 58 logs/JSONs, alterou oito e removeu 58 ocorrências de caminhos pessoais; brutos e manifestos anteriores preservados na área ignorada. Padrões dirigidos de alta confiança não identificaram segredos ou caminhos pessoais nas alterações inventariadas/build; isso não é uma garantia universal de credenciais. Manifestos finais em `artifacts/g4a1/`; `git diff --check` aprovado. O arquivo preexistente não classificado da raiz permanece preservado fora do build, sem aprovação de origem/licença ou redistribuição.

## 2026-10-25 — Checkpoint G4A/G4A.1 aprovado como P1

Decisão explícita do usuário: revisão visual aprovada, módulo vascular suficiente como protótipo P1 e autorização de commit/push normal em `origin/main`, sem force push. Não abrir G4A.2. Ressalvas aceitas não bloqueadoras: parede esquemática, marcador RC fino/sutil, hemácias simplificadas em alguns ângulos e mobile funcional porém apertado. P2 anatômico/artístico continua dependente de assets definitivos licenciados e revisão Blender/web. Próximo trabalho planejado: G4B, exploração ampliada da célula RC, sem implementação nesta execução; G5/G2B/G3B também não iniciados e nenhum deploy.

Hipótese desta execução: consolidar somente documentação/proveniência/versionamento e verificar a integridade do protótipo aprovado. README, roadmap, handoff, retomada, aceites, design/modelo visual e contrato Blender receberam estado atual separado dos registros históricos. Criados [G4A_CHECKPOINT](G4A_CHECKPOINT.md) e o registro de aprovação no pacote G4A.1. Capturas, filmes, métricas e relatórios pré-aprovação são preservados byte a byte, inclusive os avisos de aprovação/publicação pendentes verdadeiros na época. Nenhuma mudança de motor, interface, sampler ou conteúdo canônico foi introduzida no checkpoint.

Correção editorial com evidência: a fórmula do estudo live é distância câmera–centro menos raio conservador da célula (`g4a1-playback-study.mjs:74`); o limiar 0,15 é contado separadamente, diferente da margem usada no custo do planner. A descrição do gap foi ajustada sem mudar −0,02258 nem qualquer resultado. O metadado antigo `e2e-refinement-final-run.json` registra a tentativa headless shell de exit 1 com caminhos depois reutilizados. O checkpoint explicita os relatórios próprios daquela falha e os finais 6/6 aprovados, sem reescrever o original.

Git inicial confirmado por fetch e ls-remote: `HEAD = origin/main = GitHub main = 717f4069c5e662f78ea8b28e7d13e0636ab0c5dd`, divergência 0/0. O vídeo solto da raiz foi classificado por igualdade de hash como duplicata exata do filme G4A autorizado, 17.391.395 bytes/SHA256 `65cf7abe8b9259f5318a2b36a185206ac219db42956fcfcf555b90ccb3dad2ac`. Permanece local, ignorado especificamente; a cópia canônica está no pacote versionado. Não se removeu evidência nem se presumiu licença de um material desconhecido. Atributos preservam os novos logs/manifestos por bytes; brutos, caches, trace, dependências e build continuam fora do Git.

Verificação nova do checkpoint: `npm run typecheck`, `lint`, `test`, `test:catalog`, `validate:catalog` e `build` passaram; 203 unidades/21 arquivos e 22 Python. Smoke de produção com os mesmos seis cenários G4A.1 passou em 35,1 s no Chromium completo da baseline, sem alterações de timeout/budgets/expectativas. Checks e resultados em `artifacts/checkpoint/g4a-*`. Suíte completa anterior de 62, dez transições e doze benchmarks permanecem evidência preservada; não são apresentados como novas execuções desta consolidação.

Preservação do checkpoint: snapshot de 1.043 arquivos de evidência; cinco JSONs regenerados pelo smoke foram arquivados sob `artifacts/checkpoint/gates/G4A-*` antes da restauração de todos os bytes originais. Riscos/limites visuais e dependências constam do checkpoint. Auditoria pré-publicação verifica arquivos efetivamente preparados, tamanhos, segredos/caminhos pessoais, proveniência/build e correspondência do código com o aprovado. O commit que introduz `docs/G4A_CHECKPOINT.md` identifica esta entrega; após push normal, comparar HEAD/origin/main/ls-remote e working tree no encerramento, sem gravar o SHA do commit dentro de si mesmo.

## 2026-11-18 — UI-R1: vitrine editorial e rotas do atlas

Hipótese aprovada no UI-R0: separar a apresentação do estudo das ferramentas de exploração cria uma entrada mais clara sem reexecutar o pipeline 3D na Home. O usuário escolheu uma captura autoral estática; o trabalho para revisão termina no UI-R1.

Base confirmada: `1bcecb0` em `main` e `origin/main`, sem trabalho rastreado pendente e sem implementação G4B encontrada no checkout, demais refs ou stash. Os dez MD do pacote estão no checkout principal e foram lidos no UI-R0. O código foi desenvolvido no worktree isolado `feat/ui-r1`. A evidência anterior cobre os cinco estados desktop fornecidos pelo usuário e capturas móveis do checkpoint; o comparativo atual parte da sessão Corpo em 1440 × 900 e 390 × 844, já que não havia vitrine.

Alterações: entrada e controlador History API em `src/app`, workspace G4A.1 extraído e carregado sob demanda, componentes editoriais e tokens em `src/ui/editorial`, links diretos e aliases legados, Ajuda objetiva, mídia WebP original e tipografia IBM Plex OFL local. As páginas Estudos e Vitrine usam o mesmo índice. Fontes apresenta a bibliografia do catálogo e do suplemento vascular, com classes, localização e notas declaradas. A captura é do próprio render oblíquo do Rinkaku, sem assets protegidos nem melhoria inventada da anatomia; hashes e licenças em `public/ASSET_LICENSES.md`.

Escolhas de navegação e riscos: manter o observatório inerte com render suspenso quando uma rota editorial estiver visível; pausar a simulação na pose atual e retomar manualmente. Histórico, abas e link direto não serializam ou reiniciam motores. O corpo continua compartilhado com Rinkaku e é preservado durante a troca para Micro. Os Canvas recebem controle de atividade; o shader, o sampler, a câmera, o registro GLB e os contratos não foram substituídos. Os testes encaminham somente saídas novas para `test-results/atlas-evidence` e conservam as provas rastreadas dos gates anteriores. As reescritas planejadas para hospedagem são limitadas aos caminhos HTML. G4B, arte final, mudanças de composição do workspace e implantação estão fora do escopo.

Verificação de fechamento: typecheck, lint, 206 unitários, 22 testes Python, catálogo e build aprovados. Capturas e smoke no Chrome 157: Home transferiu 196.621 B em desktop e 184.841 B em mobile, sem carregar o renderer, catálogo ou GLB. Servidores dev e preview responderam às rotas HTML diretas e preservaram 404 para GLB/JSON ausentes. As oito regressões de UI-R1 passaram. A rodada E2E completa terminou com 69/70; o tracking vascular ultrapassou 1,50 num intervalo de amostragem mais longo. O mesmo caso passou em repro no G4A.1 e no UI-R1, sem alteração de limite ou motor. O perfil representativo de tracking com 500 partículas manteve todos os budgets, 59,88/59,17 FPS p50/p10 e quatro draws. Nenhum arquivo rastreado de evidência histórica foi alterado. Mídia, comandos, comparação de tracking e limitações: [UI_R1_ACCEPTANCE](UI_R1_ACCEPTANCE.md).

## 2026-11-18 — UI-R2: reorganizar o Corpo sem redimensionar sua cena

Base: mesmo worktree local de UI-R1, com a vitrine aprovada e a `main` em `1bcecb0`. Hipótese: a leitura do espécime melhora com um palco dominante e ferramentas à sua volta, sem alterar o modelo ou a escala. Este gate encerra a apresentação de Corpo; Rinkaku e Micro mantêm o shell interno existente até o UI-R3.

Arquivos de UI: `AtlasWorkspace`, `App` e `BodyTools`, com estilos escopados da bancada de Corpo; índice, camadas, ficha e varredura reutilizam os comandos e seletores anteriores. `ObservatoryScene` acrescenta uma notificação ao callback de picking existente, apenas para abrir a ficha em desktop. Não há mudança em sampler, câmera, catálogo, estados ou pipeline GLB. A geometria segue rotulada `PROXY / CONCEPTUAL MODEL`; o filtro de fontes não muda o status da cena.

Entrada em repouso sem dock de scan e sem painéis permanentes. Modal móvel e sobreposição desktop compartilham conteúdo. A ação de fechar mantém a caixa do canvas, preserva seleção e estado, pausa a varredura se aberta e devolve foco. A primeira rodada focada localizou dois testes bloqueados por uma ficha comprida sobre o controle de câmera. A altura foi limitada ao palco e a ficha recebeu rolagem própria; os mesmos dois cenários passaram junto aos quatro novos. Os testes antigos abriram os controles pelos novos acionadores, mantendo IDs e verificações de contexto. As capturas novas usam prefixo `UI-R2`; as evidências já rastreadas não foram sobrescritas.

Verificação de fechamento: typecheck, lint, 206 testes unitários, 22 testes Python, validação do catálogo e build passaram. A rodada completa E2E terminou com 71/74. Os três casos restantes passaram no mesmo build depois de abrir a Ficha ou fechar Camadas conforme o fluxo atual, com as verificações originais preservadas. O palco mediu 96% da largura em desktop e 58% da altura nas duas larguras móveis. O perfil desktop do Corpo passou em todos os orçamentos, com 1,56 s até interatividade, 59,88/59,52 FPS p50/p10 e 23 draw calls. Capturas, medidas, comandos e limites em [UI_R2_ACCEPTANCE](UI_R2_ACCEPTANCE.md).
