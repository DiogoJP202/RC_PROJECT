# GHOUL ATLAS — Observatório Anatômico 3D

Laboratório anatômico ficcional em PT-BR inspirado em *Tokyo Ghoul*, com interface original, seleção 3D real e evidências por afirmação. A base G1 agora recebe a **infraestrutura G2A**: registro GLB aprovado, instâncias/cache, bindings estáveis, rig/sockets e fallback para proxies. As seis estruturas continuam autorais provisórias, sempre `PROXY / CONCEPTUAL MODEL`; as duas fixtures GLB não são anatomia. Interação/apresentação P1; anatomia P0; nenhum P2 declarado. Micro/Comparar são estados informativos; kagune, circulação RC e fisiologia continuam pendentes. Resultados e limites em [G2A_ACCEPTANCE](docs/G2A_ACCEPTANCE.md).

Para retomar, leia [AGENTS.md](AGENTS.md), [PROJECT_HANDOFF](docs/PROJECT_HANDOFF.md) e [RESUME_ON_NEW_PC](docs/RESUME_ON_NEW_PC.md). A **baseline de código G2A validada em 24/10/2026** é [`0e53c1e31c366a05642501bef312d0fe5d5575b6`](https://github.com/DiogoJP202/RC_PROJECT/commit/0e53c1e31c366a05642501bef312d0fe5d5575b6). Antes das correções documentais, `git fetch` e `git ls-remote origin main` confirmaram `HEAD = origin/main = GitHub main` nesse SHA e a árvore limpa. A consolidação posterior de documentação/evidências não altera essa baseline de código; o HEAD de `main` deve ser conferido no Git. G0, G1 e G2A estão concluídos; **G2B/G3 permanecem pendentes**. Após este checkpoint, o próximo trabalho indicado pelo usuário é a preparação do motor de manifestação Rinkaku, sem depender dos assets definitivos do Blender, em sessão futura. A validação desta máquina e a consolidação estão no [log](docs/IMPLEMENTATION_LOG.md). Não há deploy decorrente desta tarefa.

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
artifacts/gates/         capturas G1/G2A próprias versionadas
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

## Preservação e limitações

As duas pesquisas Markdown são versionadas no repositório privado para continuidade; hashes em [RESEARCH_INDEX](docs/RESEARCH_INDEX.md). Não entram no build web nem concedem licença sobre material citado. Documentos G0/G1 conservam contexto histórico; planos anteriores não significam funcionalidades entregues. `FILE_MANIFEST_SHA256.txt` é o manifesto original do pacote, não um checksum atualizado do projeto.

Capturas próprias estão em `artifacts/gates/`. JSON/TXT originais locais foram conservados e permanecem ignorados; cópias com caminhos pessoais saneados ficam em `artifacts/checkpoint/gates/`. O índice do checkpoint registra hashes/transformações. As três referências Cyberpunk privadas não são redistribuídas. Sua transferência manual opcional está em [RESUME_ON_NEW_PC](docs/RESUME_ON_NEW_PC.md); o app não depende delas.

No Windows, `python.exe` pode ser alias da Microsoft Store. Instale Python 3.10+ ou defina `ATLAS_PYTHON`; os scripts procuram `python`, `python3`, `py -3` e opcionalmente o runtime do Codex, sem exigir este último. Se a política bloquear `npm.ps1`/`npx.ps1`, use `npm.cmd`/`npx.cmd` sem mudar a política global. Portas 5173/4173 devem estar livres. Instale o Chromium correspondente para E2E; o fallback Chrome/cache do Windows pode variar e não garante WebGL sem GPU/driver funcional.

Limites conhecidos: anatomia P0, revisão artística e mobile físico pendentes; aviso de chunk lazy da cena e `THREE.Clock` da dependência R3F. [Aceite G1](docs/G1_ACCEPTANCE.md), [aceite G2A](docs/G2A_ACCEPTANCE.md) e [log](docs/IMPLEMENTATION_LOG.md) distinguem medições e pendências. Não execute os prompts antigos automaticamente. Este checkpoint consolida ambiente e Git; a preparação do motor Rinkaku será uma sessão futura, e G2B continua dependente do pacote artístico licenciado/revisado.
