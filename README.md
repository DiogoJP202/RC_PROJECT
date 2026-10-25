# GHOUL ATLAS — Observatório Anatômico 3D

Laboratório anatômico ficcional em PT-BR inspirado em *Tokyo Ghoul*, com interface original, seleção 3D real e evidências por afirmação. A base G1 recebe a **infraestrutura G2A**: registro GLB aprovado, instâncias/cache, bindings estáveis, rig/sockets e fallback para proxies. **G3A** acrescenta um motor determinístico de manifestação Rinkaku e uma representação procedural original, com timeline reversível, independente dos modelos definitivos do Blender. **G3A.1** refina a implantação lombar, a leitura das fases e o enquadramento móvel; em **25/10/2026**, o usuário aprovou o checkpoint **P1 técnico e visual com ressalvas**. A arte final P2 continua pendente. As estruturas continuam provisórias, sempre `PROXY / CONCEPTUAL MODEL`; as duas fixtures GLB não são anatomia. Interação/apresentação P1; anatomia P0; nenhum P2 declarado. Micro/Comparar, circulação RC e fisiologia continuam pendentes. Resultados e limites em [G2A_ACCEPTANCE](docs/G2A_ACCEPTANCE.md), [G3A_ACCEPTANCE](docs/G3A_ACCEPTANCE.md) e [G3A1_REFINEMENT](docs/G3A1_REFINEMENT.md).

Para retomar, leia [AGENTS.md](AGENTS.md), [PROJECT_HANDOFF](docs/PROJECT_HANDOFF.md) e [RESUME_ON_NEW_PC](docs/RESUME_ON_NEW_PC.md). G0/G1/G2A estão concluídos; G3A e seu refinamento G3A.1 foram desenvolvidos sobre `main` no checkpoint anterior `84e6e1f36b8558d225ae4baf82a8f79ddb35c124`. A consolidação e publicação do checkpoint em `main` foram autorizadas em 25/10/2026; o SHA resultante deve ser confirmado no Git e no registro de encerramento. Isso não autoriza deploy. **G2B, G3B, fechamento artístico P2 de G3 e G4 continuam pendentes.** A baseline histórica de código G2A validada em 24/10/2026 é [`0e53c1e31c366a05642501bef312d0fe5d5575b6`](https://github.com/DiogoJP202/RC_PROJECT/commit/0e53c1e31c366a05642501bef312d0fe5d5575b6); o checkpoint posterior consolidou documentação/evidências. A validação da máquina e as decisões G3A estão no [log](docs/IMPLEMENTATION_LOG.md). Consulte o estado atual no Git antes de continuar.

O próximo trabalho planejado é **G4A: simulação de circulação e transporte visual RC**, preservando a classificação hipotética do transporte ficcional. G4A ainda não foi implementado nem é iniciado pela consolidação deste checkpoint.

O [registro do checkpoint G3A/G3A.1](docs/G3A_CHECKPOINT.md) separa o aceite P1 da arte P2 e reúne as verificações finais:139 unidades,22 Python,catálogo,build e44 E2E aprovados, incluindo a correção do último trecho da retração. Os pacotes de revisão anteriores continuam preservados como histórico.

## Instalação reproduzível

Requisitos: Git; Node.js **22.12+ na linha 22 ou 24.x**; npm; Python **3.10+**. Ambiente anterior testado: **Node 24.19.0, npm 11.17.0, Python 3.12.14**. Na retomada de 24/10/2026, **Node 24.22.1, npm 11.17.0 e Python 3.12.14** passaram nos checks, incluindo 85 unidades, 22 Python e 24 E2E; detalhes e ativação das ferramentas locais em [RESUME_ON_NEW_PC](docs/RESUME_ON_NEW_PC.md). `.nvmrc` preserva o Node da baseline. Use o `package-lock.json` versionado e `npm ci`; não atualize dependências durante a restauração.

Nesta estação, a validação usou Node/Python internos do Codex e npm portátil que depende de Node no PATH. Isso comprova execução do projeto, mas não um ambiente independente do Codex. A configuração reproduzível recomendada usa Node/npm e Python próprios da estação e o Chromium correspondente ao Playwright fixado no lockfile; o [guia de retomada](docs/RESUME_ON_NEW_PC.md) distingue o diagnóstico atual dessa configuração recomendada.

```powershell
git clone --branch main https://github.com/DiogoJP202/RC_PROJECT.git
cd RC_PROJECT
node --version
npm --version
python --version
npm ci
npx playwright install chromium
npm run dev
```

O repositório privado exige uma conta autorizada no GitHub. Acesse [127.0.0.1:5173](http://127.0.0.1:5173); pare com `Ctrl+C`. Não é necessário copiar `node_modules`, `dist`, caches, credenciais ou a instalação do Codex anterior.

## Ambiente

O app não exige chave, serviço externo, backend ou `.env`. [.env.example](.env.example) lista somente nomes de overrides opcionais, sem valores. São variáveis de processo dos scripts Node/Playwright; copiar para `.env` **não** as carrega automaticamente. `BASE_URL` é fornecido pelo Vite; `ProgramFiles`/`LOCALAPPDATA` pertencem ao Windows.

| Variável opcional | Uso |
|---|---|
| `ATLAS_PYTHON` | Caminho de Python 3.10+ funcional para o helper |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Executável alternativo; prefira o Chromium correspondente do Playwright |
| `PLAYWRIGHT_BASE_URL` | E2E; padrão `http://127.0.0.1:5173`; porta 4173 seleciona preview |
| `ATLAS_PROFILE_URL` | Perfil de produção; padrão `http://127.0.0.1:4173` |

Exemplo opcional no PowerShell, somente se a descoberta de Python falhar:

```powershell
$env:ATLAS_PYTHON = (py -3 -c 'import sys; print(sys.executable)')
npm run validate:catalog
```

## Verificações e produção local

Execute na raiz. Todos estes comandos precisam terminar com exit code 0:

```powershell
npm run typecheck
npm run lint
npm test
npm run test:catalog
npm run validate:catalog
npm run build
npm run test:e2e
```

Alternativa direta para Python:

```powershell
python -B -m unittest discover -s tools -p test_validate_catalog.py
python tools/validate_catalog.py public/catalog.json
```

O runtime usa **`public/catalog.json` v2**. `contracts/seed-catalog.json` é o exemplo histórico v1, preservado byte a byte: sua rejeição pelo validador v2 é esperada. Não é o comando de aceite atual. Veja [migração](docs/G1_CATALOG_MIGRATION.md).

Para visualizar o build:

```powershell
npm run preview -- --port 4173
```

Em outro terminal, com preview ativo:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4173'
npm run test:e2e
node tests/e2e/production-profile.js
```

O perfil aguarda 10 s e mede 30 s; grava relatório local e não certifica outros dispositivos. Remova o override com `Remove-Item Env:PLAYWRIGHT_BASE_URL` ao voltar ao dev. O Playwright inicia o servidor necessário quando ausente; feche servidores antigos para conferir instalação limpa. HTML reports, traces e falhas em `playwright-report/` e `test-results/` são locais.

## Organização e uso

```text
src/app/                 shell, boundary e tipos
src/ui/                  índice, inspector, fontes, timeline, fallback e CSS
src/state/               Zustand, contexto e relógio transiente
src/scene/               proxies, integração GLB, bindings, câmera e raycast
src/content/             fetch e validação do catálogo
src/visuals/assets/      registro, preflight GLB, cache/leases e ownership
public/                  catálogo, marca SVG e proveniência autoral
contracts/               esquema v2, seed v1 e tokens iniciais
tools/                   gate Python, regressões e seleção de runtime
tests/e2e/               jornadas de navegador e perfil de produção
docs/, research/, prompts/ especificações, duas pesquisas reais e gates
artifacts/gates/         capturas G1/G2A históricas e evidências próprias G3A
artifacts/checkpoint/    relatórios saneados e verificações do backup
references/private/     referências de terceiros locais, excluídas do Git
```

Arraste para orbitar, role para aproximar e clique nos meshes; há botões HTML equivalentes. Quatro camadas independentes, opacidade, foco, posterior e isolar/restaurar afetam a cena. `R` reenquadra, `Esc` retorna ao corpo, `1/2/3` trocam modo e Espaço pausa o scan; atalhos respeitam inputs. Scan é ilustrativo, sem medida fisiológica. Os modos preservam contexto. Diagnóstico local: `?webgl=off`, `?asset=missing`, `?catalog=missing`, `?silhouette=1`.

## Integração GLB — G2A

Nenhum GLB anatômico de produção foi fornecido, adquirido ou integrado. A rota normal usa `src/scene/proxyGeometry.ts`. Para testar o ingresso, abra [bancada GLB local](http://127.0.0.1:5173/?assets=lab): selecione GLB modular ou articulado. Os arquivos autorais em `public/assets/fixtures/` substituem somente cabeça, tórax e kakuhou; os outros IDs mantêm proxies. O articulado possui skin, bones, socket e clipe `fixture_sway`; play/pausa/scrub são testes mecânicos, sem fisiologia.

O registro `src/visuals/assets/assetRegistry.ts` aprova arquivos exatos por ID/versão/bytes/SHA-256/licença. `extras.atlasId` resolve bindings e sockets, independentemente dos nomes visuais. Carga assíncrona e cancelamento mantêm proxies durante espera/falha; retry recupera o GLB. Cada lease controla transforms, materiais, rig e mixer; a última liberação descarta o template compartilhado. Copiar `.glb` para `public/` não o integra nem o licencia: tudo nessa pasta é distribuído pelo build.

O [contrato operacional Blender → Web](docs/BLENDER_WEB_INTEGRATION.md) refina o [contrato G0](docs/07_ASSET_PIPELINE.md). G2B exige arquivo/versão, licença/atribuição, escala/eixos/pivô, bounds, bindings, sockets, rig/clip e revisão artística/anatômica. Não reutilize bounds das fixtures. Recursos externos, data URIs e decoders/extensões não aprovados são recusados; consulte o contrato para o subconjunto admitido. A forma do kakuhou continua reconstrução.

Fixtures podem ser reproduzidas com `node tools/generate_fixture_glbs.mjs`; o manifesto é determinístico e deve ser revisado junto dos binários. Testes de disco verificam hashes, anatomia semântica, rig, animação, sockets e descartes. Para perfilar sem sobrescrever os relatórios G1:

```powershell
node tests/e2e/production-profile.js --output=artifacts/g2a/production-proxy.json
$env:ATLAS_PROFILE_URL = 'http://127.0.0.1:4173/?assets=lab'
node tests/e2e/production-profile.js --asset=fixture.rigged.v1 --animate --output=artifacts/g2a/production-rigged.json
Remove-Item Env:ATLAS_PROFILE_URL
```

Esses comandos exigem preview ativo em 4173. O segundo perfil distingue transferência do boot + carga explícita da fixture, e registra latência de ativação separada da interação inicial. Mobile físico continua pendente.

## Manifestação Rinkaku — G3A e refinamento G3A.1

No modo Corpo, escolha **Manifestar**. A timeline oferece iniciar/pausar/retomar, reverso, passos, scrub absoluto, reset e seleção das sete fases. Retomar conserva a direção; reset retorna a `t=0`; `t=1` termina recolhido. Alterne 1–4 apêndices, partículas e efeitos Padrão/Econômico. Use Posterior, Lateral, Oblíqua ou Focar raiz lombar. **Inspecionar** devolve o painel anatômico, com seleção e camadas preservadas. O scan demonstrativo G1 fica pausado durante a manifestação.

No G3A.1, a reprodução automática completa leva **21 s**, com **3,4 s de retração**. Um mapa monotônico e invertível converte segundos de reprodução em progresso normalizado; o sampler puro conserva seus sete intervalos e a referência de 18 s do movimento secundário. Scrub continua instantâneo e independente desse relógio. Tempos, forma, crescimento e fixação são escolhas artísticas; não são tempos biológicos, fator RC ou mecanismo canônico. Movimento reduzido e ausência de WebGL preservam controle manual e leitura textual, com reprodução automática desabilitada. O adaptador usa o socket lombar do lease GLB quando disponível, ou o anchor do proxy; nenhum asset Blender final é necessário. [Design do motor](docs/G3A_ENGINE_DESIGN.md), [contrato futuro Blender](docs/G3A_BLENDER_ANIMATION_CONTRACT.md) e [aceite/evidências](docs/G3A_ACCEPTANCE.md).

A revisão G3A.1 ajusta a superfície de implantação e a distribuição das raízes, a expressão geométrica progressiva das fases, a vista oblíqua e a ocupação da cena em mobile. Preserva a fronteira do adaptador e a restauração do observatório. Decisões e limitações ficam em [G3A1_REFINEMENT](docs/G3A1_REFINEMENT.md); comparações reais antes/depois, sequências e parecer crítico ficam no [novo pacote visual](artifacts/gates/G3A1-review/INDEX.md). O usuário aprovou a experiência P1 com ressalvas; bordas/facetas, silhueta estilizada e arte final P2 continuam registradas como limites. O [pacote G3A anterior](artifacts/gates/G3A-review/INDEX.md) permanece histórico.

Para medir este módulo, com build e preview em 4173 ativos:

```powershell
node tests/e2e/g3a1-production-profile.js
node tests/e2e/g3a1-production-profile.js --quality=low
node tests/e2e/g3a1-production-profile.js --mobile
```

Execute os perfis sequencialmente, sem outro teste/cena 3D concorrente. Não substituem medição em celular físico nem revisão artística/anatômica.

## Preservação e limitações

As duas pesquisas Markdown são versionadas no repositório privado para continuidade; hashes em [RESEARCH_INDEX](docs/RESEARCH_INDEX.md). Não entram no build web nem concedem licença sobre material citado. Documentos G0/G1 conservam contexto histórico; planos anteriores não significam funcionalidades entregues. `FILE_MANIFEST_SHA256.txt` é o manifesto original do pacote, não um checksum atualizado do projeto.

Capturas próprias estão em `artifacts/gates/`. JSON/TXT originais locais foram conservados e permanecem ignorados; cópias com caminhos pessoais saneados ficam em `artifacts/checkpoint/gates/`. O índice do checkpoint registra hashes/transformações. As três referências Cyberpunk privadas não são redistribuídas. Sua transferência manual opcional está em [RESUME_ON_NEW_PC](docs/RESUME_ON_NEW_PC.md); o app não depende delas.

No Windows, `python.exe` pode ser alias da Microsoft Store. Instale Python 3.10+ ou defina `ATLAS_PYTHON`; os scripts procuram `python`, `python3`, `py -3` e opcionalmente o runtime do Codex, sem exigir este último. Se a política bloquear `npm.ps1`/`npx.ps1`, use `npm.cmd`/`npx.cmd` sem mudar a política global. Portas 5173/4173 devem estar livres. Instale o Chromium correspondente para E2E; o fallback Chrome/cache do Windows pode variar e não garante WebGL sem GPU/driver funcional.

Limites conhecidos: anatomia P0, arte final P2 e mobile físico pendentes; experiência G3A.1 P1 aprovada com ressalvas, cena carregada em chunk lazy e aviso `THREE.Clock` da dependência R3F. [Aceite G1](docs/G1_ACCEPTANCE.md), [aceite G2A](docs/G2A_ACCEPTANCE.md), [aceite G3A](docs/G3A_ACCEPTANCE.md) e [log](docs/IMPLEMENTATION_LOG.md) distinguem medições e pendências. Não execute os prompts antigos automaticamente. G2B continua dependente do pacote artístico licenciado/revisado; o demo procedural não encerra G3.
