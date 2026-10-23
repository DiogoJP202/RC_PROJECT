# GHOUL ATLAS — Observatório Anatômico 3D

Laboratório anatômico ficcional em PT-BR inspirado em *Tokyo Ghoul*, com interface original, seleção 3D real e evidências por afirmação. **Última fase implementada: G1.** As seis estruturas são geometrias autorais provisórias, sempre identificadas como `PROXY / CONCEPTUAL MODEL`. Interação/apresentação P1; anatomia P0; nenhum P2 declarado. Micro/Comparar são estados informativos; kagune, circulação RC e fisiologia continuam pendentes.

Para retomar, leia [AGENTS.md](AGENTS.md), [PROJECT_HANDOFF](docs/PROJECT_HANDOFF.md) e [RESUME_ON_NEW_PC](docs/RESUME_ON_NEW_PC.md). Este checkpoint preserva código e documentação em repositório privado; não é deploy. A próxima fase autorizável é **G2A**, mediante nova instrução.

## Instalação reproduzível

Requisitos: Git; Node.js **22.12+ na linha 22 ou 24.x**; npm; Python **3.10+**. Ambiente testado: **Node 24.19.0, npm 11.17.0, Python 3.12.14**. `.nvmrc` registra o Node testado, se seu gerenciador a suportar. Use o `package-lock.json` versionado e `npm ci`; não atualize dependências durante a restauração.

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
src/scene/               proxies, AssetSlot, câmera, raycast e manifesto
src/content/             fetch e validação do catálogo
src/visuals/assets/      adaptador GLB futuro, sem integração anatômica
public/                  catálogo, marca SVG e proveniência autoral
contracts/               esquema v2, seed v1 e tokens iniciais
tools/                   gate Python, regressões e seleção de runtime
tests/e2e/               jornadas de navegador e perfil de produção
docs/, research/, prompts/ especificações, duas pesquisas reais e gates
artifacts/gates/         capturas G1 próprias versionadas
artifacts/checkpoint/    relatórios saneados e verificações do backup
references/private/     referências de terceiros locais, excluídas do Git
```

Arraste para orbitar, role para aproximar e clique nos meshes; há botões HTML equivalentes. Quatro camadas independentes, opacidade, foco, posterior e isolar/restaurar afetam a cena. `R` reenquadra, `Esc` retorna ao corpo, `1/2/3` trocam modo e Espaço pausa o scan; atalhos respeitam inputs. Scan é ilustrativo, sem medida fisiológica. Os modos preservam contexto. Diagnóstico local: `?webgl=off`, `?asset=missing`, `?catalog=missing`, `?silhouette=1`.

## GLB futuro

Nenhum GLB anatômico de produção foi fornecido, adquirido ou integrado. O adaptador foi testado com contêiner original em memória. A aplicação usa `src/scene/proxyGeometry.ts`; copiar `.glb` para `public/` não o integra automaticamente.

G2A deve preparar integração/validação mantendo proxies. G2B depende de modelos aprovados: arquivo/versão, licença/atribuição, unidades/orientação, bounds, nodes, anchors, materiais e recursos dependentes. Consulte [Blender → Web](docs/07_ASSET_PIPELINE.md), [inventário](docs/ASSET_INVENTORY.md) e [handoff](docs/PROJECT_HANDOFF.md). Asset sem licença clara não entra no build público; a forma do kakuhou continua conceitual.

## Preservação e limitações

As duas pesquisas Markdown são versionadas no repositório privado para continuidade; hashes em [RESEARCH_INDEX](docs/RESEARCH_INDEX.md). Não entram no build web nem concedem licença sobre material citado. Documentos G0/G1 conservam contexto histórico; planos anteriores não significam funcionalidades entregues. `FILE_MANIFEST_SHA256.txt` é o manifesto original do pacote, não um checksum atualizado do projeto.

Capturas próprias estão em `artifacts/gates/`. JSON/TXT originais locais foram conservados e permanecem ignorados; cópias com caminhos pessoais saneados ficam em `artifacts/checkpoint/gates/`. O índice do checkpoint registra hashes/transformações. As três referências Cyberpunk privadas não são redistribuídas. Sua transferência manual opcional está em [RESUME_ON_NEW_PC](docs/RESUME_ON_NEW_PC.md); o app não depende delas.

No Windows, `python.exe` pode ser alias da Microsoft Store. Instale Python 3.10+ ou defina `ATLAS_PYTHON`; os scripts procuram `python`, `python3`, `py -3` e opcionalmente o runtime do Codex, sem exigir este último. Se a política bloquear `npm.ps1`/`npx.ps1`, use `npm.cmd`/`npx.cmd` sem mudar a política global. Portas 5173/4173 devem estar livres. Instale o Chromium correspondente para E2E; o fallback Chrome/cache do Windows pode variar e não garante WebGL sem GPU/driver funcional.

Limites conhecidos: anatomia P0, revisão artística e mobile físico pendentes; aviso de chunk lazy (~947 kB minificados) e `THREE.Clock` da dependência R3F. [Aceite G1](docs/G1_ACCEPTANCE.md), [log](docs/IMPLEMENTATION_LOG.md) e [handoff](docs/PROJECT_HANDOFF.md) distinguem medições e pendências. Não execute os prompts antigos automaticamente; G2A exige nova autorização.
