# GHOUL ATLAS — Registro de execução

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
