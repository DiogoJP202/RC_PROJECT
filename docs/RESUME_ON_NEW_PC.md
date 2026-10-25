# GHOUL ATLAS — Retomar em outro computador

> **Checkpoint atual autorizado, 25/10/2026:** G3A/G3A.1 aprovados pelo usuário como **P1 técnico e visual com ressalvas**, com consolidação/publicação em `main` autorizadas. Arte final P2, G2B e G3B continuam pendentes; não há autorização de deploy. Após publicar, confirmar o SHA remoto e a árvore limpa no registro de encerramento. O próximo trabalho planejado é **G4A: simulação de circulação e transporte visual RC**, ainda não implementado; G4 completo permanece pendente. As notas abaixo sobre trabalho exclusivamente local descrevem o período anterior a esta autorização e não substituem a conferência do Git atual.

> **G3A.1 local, 24/10/2026:** preservar também o refinamento visual e suas evidências em [G3A1_REFINEMENT](G3A1_REFINEMENT.md) e [G3A1-review](../artifacts/gates/G3A1-review/INDEX.md). Transporte nominal de 21 s, retração de 3,4 s; sampler independente com referência de 18 s. Ainda sem commit/push/deploy e com aprovação artística humana pendente; um clone remoto não recupera essas alterações locais. Nenhuma ferramenta/dependência nova foi instalada nesta execução.

> **Atualização local G3A, 24/10/2026:** há código e evidências G3A ainda sem commit/push sobre o checkpoint `84e6e1f36b8558d225ae4baf82a8f79ddb35c124` de `main`. Um clone remoto contém o checkpoint publicado, sem estas alterações locais até uma publicação posterior autorizada. Preserve a working tree ao transferir este trabalho. Leia [G3A_ACCEPTANCE](G3A_ACCEPTANCE.md) e [G3A_ENGINE_DESIGN](G3A_ENGINE_DESIGN.md). G0/G1/G2A preservados; G2B/G3B/G4 e arte final de G3 pendentes. Os registros de migração abaixo descrevem o checkpoint anterior a G3A.

> Baseline de código verificada na retomada de **24/10/2026**: G2A está publicado em `main`, no commit [`0e53c1e31c366a05642501bef312d0fe5d5575b6`](https://github.com/DiogoJP202/RC_PROJECT/commit/0e53c1e31c366a05642501bef312d0fe5d5575b6). Naquele momento, `git fetch` e `git ls-remote origin main` confirmaram `HEAD = origin/main = GitHub main`; a árvore estava limpa antes das atualizações documentais. O checkpoint pós-migração consolida essas notas e evidências sem alterar o código; seu HEAD documental pode ser posterior à baseline. Veja [aceite G2A](G2A_ACCEPTANCE.md), [contrato Blender → Web](BLENDER_WEB_INTEGRATION.md) e [log](IMPLEMENTATION_LOG.md). Os registros G0/G1 abaixo são históricos. Não refaça G0, G1 ou G2A; G2B/G3 continuam pendentes.

Comece por `AGENTS.md`, depois [PROJECT_HANDOFF](PROJECT_HANDOFF.md), este guia e [README](../README.md). G0/G1/G2A estão entregues; o motor e refinamento G3A/G3A.1 receberam aprovação P1 técnica/visual com ressalvas e autorização de checkpoint em `main`. Anatomia continua proxy P0 e arte final P2 permanece pendente. G2B/G3B e G4 não foram implementados; o próximo trabalho planejado é G4A. Confirme o SHA remoto antes de transferir para garantir que o clone inclui o checkpoint G3A/G3A.1. O ingresso artístico [G2B](../prompts/G2B_ASSETS_DEFINITIVOS.md) continua pendente do pacote/revisão.

## Identidade do checkpoint

- Checkpoint G3A/G3A.1: aprovação P1 com ressalvas e publicação em `main` autorizadas em 25/10/2026; SHA final a confirmar no Git e no registro de encerramento. Base anterior: `84e6e1f36b8558d225ae4baf82a8f79ddb35c124`.
- Repositório privado: [DiogoJP202/RC_PROJECT](https://github.com/DiogoJP202/RC_PROJECT).
- Branch: `main`.
- Baseline de código publicada e validada em 24/10/2026, incluindo G2A: [`0e53c1e31c366a05642501bef312d0fe5d5575b6`](https://github.com/DiogoJP202/RC_PROJECT/commit/0e53c1e31c366a05642501bef312d0fe5d5575b6); commits documentais posteriores não substituem esta identidade do código testado.
- Referência imutável da baseline G0/G1: tag `ghoul-atlas-g1-checkpoint`.
- SHA da baseline: [`8fac8f7bba9a6891d5306cc14d6e86abbd4ea699`](https://github.com/DiogoJP202/RC_PROJECT/commit/8fac8f7bba9a6891d5306cc14d6e86abbd4ea699).

A tag identifica somente o código G0/G1 validado naquele checkpoint; ela não representa G2A nem G3A/G3A.1. O novo checkpoint deve acrescentar G3A/G3A.1 a `main`, preservando G2A e a documentação de transferência. Confira sempre o HEAD remoto com os comandos abaixo; esta identificação não substitui executar os checks na máquina nova.

## Clone, instalação e inicialização

Confirme Git, Node **22.12+ na linha 22 ou 24.x**, npm e Python **3.10+** antes de instalar ferramentas. A baseline foi testada com Node **24.19.0**, npm **11.17.0** e Python **3.12.14**; a retomada abaixo também validou Node **24.22.1**. Autentique o GitHub com conta que tenha acesso ao repositório privado, sem copiar tokens da máquina antiga para arquivos do projeto.

```powershell
git clone --branch main https://github.com/DiogoJP202/RC_PROJECT.git
cd RC_PROJECT
git status --short --branch
git fetch origin
git rev-parse HEAD
git rev-parse origin/main
git ls-remote origin refs/heads/main
git rev-parse ghoul-atlas-g1-checkpoint
git merge-base --is-ancestor 8fac8f7bba9a6891d5306cc14d6e86abbd4ea699 HEAD
node --version
npm --version
python --version
npm ci
npx playwright install chromium
npm run dev
```

Abra [127.0.0.1:5173](http://127.0.0.1:5173); `Ctrl+C` encerra. O app não exige `.env`, backend, chave ou asset fora do Git. Os quatro overrides de ferramentas estão no README e os nomes em `.env.example`; não são carregados automaticamente de `.env`.

Se o PowerShell bloquear wrappers `.ps1`, use `npm.cmd` e `npx.cmd`. Se Python for alias da Microsoft Store, instale uma distribuição real e, se preciso, indique o executável:

```powershell
$env:ATLAS_PYTHON = (py -3 -c 'import sys; print(sys.executable)')
```

O helper reconhecer runtime do Codex na máquina antiga é conveniência local, não dependência do projeto. Use um Python legítimo instalado na máquina nova.

## Ambiente validado nesta máquina — 24/10/2026

Git **2.55.0.windows.2**, Node **24.22.1** e Python **3.12.14** já estavam disponíveis; Node/Python são runtimes bundled do Codex. `python` no PATH era o alias Microsoft Store e não havia `npm` funcional. Foi disponibilizado **npm 11.17.0 portátil** a partir do registro oficial, com integridade SHA-512 conferida, fora do repositório. `npm ci` instalou 234 pacotes/auditou 235 e reportou zero vulnerabilidades, sem alterar o lockfile. O helper `node tools/python.mjs --version` também encontrou Python 3.12.14 sem override.

O cache inicial tinha Chromium revisão 1228, diferente da revisão 1248 exigida pelo Playwright 1.64.1. `npx.cmd playwright install chromium` instalou **156.0.8078.4 / revisão 1248**, com os componentes auxiliares do próprio Playwright. Os 24 E2E passaram no preview de produção em 4173 usando o browser completo em headless, com override explícito. Não foi necessário instalar Blender, outro Node/Python, mudar versões do projeto ou configurações globais.

Para usar provisoriamente as ferramentas existentes desta estação em um novo terminal PowerShell, execute na raiz do projeto. **Este bloco depende dos runtimes internos do Codex** e não estabelece um ambiente independente:

```powershell
$atlasRuntime = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$atlasNpm = Join-Path $env:LOCALAPPDATA 'GhoulAtlas\tooling\npm-11.17.0'
$env:PATH = "$atlasNpm;$(Join-Path $atlasRuntime 'node\bin');$env:PATH"
$env:ATLAS_PYTHON = Join-Path $atlasRuntime 'python\python.exe'
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = Join-Path $env:LOCALAPPDATA 'ms-playwright\chromium-1248\chrome-win64\chrome.exe'
node --version
npm.cmd --version
node tools/python.mjs --version
npm.cmd run dev
```

Esse bloco ajusta somente o processo atual. Os caminhos são locais desta estação e não substituem os requisitos de instalação em outro computador. Para repetir os E2E no build, execute `npm.cmd run build`, defina `$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4173'` e rode `npm.cmd run test:e2e`; o Playwright inicia o preview se estiver ausente. Remova o override de URL ao voltar ao dev.

Revalidação atual: TypeScript, lint, **85 unidades/7 arquivos**, **22 Python**, catálogo v2, build e **24 E2E** com exit 0. [Resultados](../artifacts/checkpoint/new-pc-validation.json), [saídas](../artifacts/checkpoint/new-pc-validation.txt), [E2E](../artifacts/checkpoint/new-pc-e2e.txt) e [hardware](../artifacts/checkpoint/new-pc-machine.json). As capturas atuais usam `G2A-new-pc-*`; os PNG históricos G1/G2A foram restaurados aos bytes anteriores. Métricas e checklist completo estão no [log da retomada](IMPLEMENTATION_LOG.md).

## Independência das ferramentas — diagnóstico do checkpoint

Foi aberto Windows PowerShell com `-NoProfile -NonInteractive` e PATH de processo reconstruído somente dos valores persistidos `Machine` + `User`. Nenhum PATH global foi alterado. [Evidência do diagnóstico](../artifacts/checkpoint/post-migration-environment.json):

| Ferramenta | Resultado fora do PATH do Codex |
|---|---|
| Git | 2.55.0.windows.2, instalação independente em Program Files |
| Node / npm / npx | Não encontrados; o Node 24.22.1 usado nos testes está no runtime interno |
| npm portátil 11.17.0 | Arquivos fora do Codex, mas seu wrapper falha sem `node` no PATH; não é um runtime independente |
| Python / py | `python`/`python3` são aliases Store sem runtime funcional; `py` ausente; o Python 3.12.14 validado é interno |
| Playwright | Pacote 1.64.1 no projeto e Chromium 156.0.8078.4/revisão 1248 em cache externo ao Codex; a CLI local falha sem Node |

Assim, o app foi validado nesta máquina, mas o ambiente de desenvolvimento **ainda depende do Codex**. Nenhuma instalação, atualização ou configuração global foi feita nesta consolidação.

Configuração independente recomendada, **não instalada nem validada nesta sessão**:

1. Obter **Node 24.22.1 x64** em ZIP pelo [site oficial Node.js](https://nodejs.org/en/download), conferir SHASUMS/assinatura e extrair em uma pasta própria do usuário, por exemplo `<LOCALAPPDATA>/GhoulAtlas/tooling/node-v24.22.1-win-x64`. Essa versão de Node já passou nos testes da migração; `.nvmrc` continua preservando 24.19.0 da baseline anterior.
2. Manter o **npm portátil 11.17.0** já disponível fora do Codex, com o Node independente acima no PATH do processo. Isso preserva a versão utilizada com o lockfile, sem instalação global de npm ou gerenciador de versões adicional.
3. Instalar **Python 3.13.17 x64** para o usuário pelo [instalador oficial](https://www.python.org/downloads/release/python-31317/), ou disponibilizar um runtime independente compatível e com revisão fixada. A versão 3.13.17 é uma recomendação disponível para Windows; os testes registrados até aqui usaram **3.12.14**, portanto a instalação independente exigirá nova validação Python. Os scripts só usam a biblioteca padrão, sem necessidade de pip nesta tarefa.
4. Usar `npm.cmd ci` e a CLI do **Playwright 1.64.1 do lockfile**, sem Playwright global. `npx.cmd playwright install chromium` fornece o browser da revisão requerida quando ausente; o cache pode ser reutilizado. [Documentação oficial de browsers](https://playwright.dev/docs/browsers).

Depois de disponibilizar esses arquivos independentemente do Codex, este exemplo ativa somente a sessão atual (ajuste o caminho de Python se o instalador usar outro destino):

```powershell
$atlasIndependentNode = Join-Path $env:LOCALAPPDATA 'GhoulAtlas\tooling\node-v24.22.1-win-x64'
$atlasIndependentNpm = Join-Path $env:LOCALAPPDATA 'GhoulAtlas\tooling\npm-11.17.0'
$env:PATH = "$atlasIndependentNpm;$atlasIndependentNode;$env:PATH"
$env:ATLAS_PYTHON = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python313\python.exe'
node --version
node -p 'process.execPath'
npm.cmd --version
& $env:ATLAS_PYTHON -c 'import sys; print(sys.version); print(sys.executable)'
npx.cmd playwright --version
```

Execute em um terminal externo sem perfil/overrides do Codex, confirme caminhos sem `.cache/codex-runtimes`, e só então repita os sete checks da seção seguinte. Até isso ocorrer, mantenha esta independência como pendência; as falhas de descoberta acima são diagnóstico de ferramentas, não falhas novas dos testes do aplicativo. As páginas oficiais foram consultadas para a recomendação; arquivos de instalação não foram baixados nem executados neste checkpoint.

## Validar a restauração

```powershell
npm run typecheck
npm run lint
npm test
npm run test:catalog
npm run validate:catalog
npm run build
npm run test:e2e
git status --short --branch
```

A suíte final registrada no [aceite G2A](G2A_ACCEPTANCE.md) passou com **85 testes Vitest/7 arquivos, 22 Python e 24 E2E**, catálogo v2 e os sete comandos com exit 0. São resultados da máquina anterior; a reexecução nesta máquina deve ter seus próprios comandos, saídas e ambiente no [log](IMPLEMENTATION_LOG.md). E2E regenera capturas G1/G2A; diferenças de PNG entre GPU/browser/tempo precisam de revisão antes de commit. Os **41 testes Vitest/5 arquivos, 22 Python e 14 E2E** nos logs [local-validation](../artifacts/checkpoint/local-validation.json) / [saídas](../artifacts/checkpoint/local-validation.txt) pertencem ao checkpoint histórico G0/G1.

**Registro histórico — restauração comprovada em 23/10/2026:** clone novo do GitHub no commit `2b64744a0065031b3c7f70ee70291a10a1671fac`, `npm ci` e os sete checks acima com exit 0. Nenhum arquivo ignorado do workspace foi copiado; pesquisas/seed/lockfile mantiveram os hashes; working tree do clone permaneceu limpa após E2E. O commit seguinte apenas acrescentou essa evidência/documentação. [Relatório do clone](../artifacts/checkpoint/clean-clone-validation.json) e [saídas completas](../artifacts/checkpoint/clean-clone-validation.txt). Isso comprovou restauração da baseline G0/G1 na estação anterior; não comprova os checks G2A nesta máquina.

`public/catalog.json` é o catálogo ativo. O seed `contracts/seed-catalog.json` v1 é histórico e sua rejeição no validador v2 é esperada. Não altere o seed nem enfraqueça o gate para mascarar esse diagnóstico.

Depois do build, use `npm run preview -- --port 4173`. Para E2E no preview, defina `$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4173'`; remova com `Remove-Item Env:PLAYWRIGHT_BASE_URL` para retornar ao padrão. O perfil opcional `node tests/e2e/production-profile.js` precisa do preview e de WebGL funcional. Não extrapole métricas históricas de Iris Xe/Chrome para o computador novo.

Confirme também a cena normal e a bancada [127.0.0.1:5173/?assets=lab](http://127.0.0.1:5173/?assets=lab): GLB modular e articulado, seleção/lista, foco/camadas, animação e retorno ao proxy. As duas fixtures estão em `public/assets/fixtures/` e são sintéticas, sem anatomia final. Registre navegador/GPU e evidência visual próprios desta retomada, mantendo as capturas históricas identificadas.

## Arquivos preservados e transferência privada opcional

Código, configs, lockfile, contratos, docs, prompts, testes, ferramentas, recursos públicos autorais, **as duas pesquisas reais**, fixtures GLB e capturas próprias G1/G2A estão no Git. [preservation-index](../artifacts/checkpoint/preservation-index.json) informa hashes e cópias saneadas dos seis relatórios originais do checkpoint G0/G1. [RESEARCH_INDEX](RESEARCH_INDEX.md) registra hashes dos MD; `.gitattributes` preserva seus bytes e os do seed legado entre clones.

As três imagens abaixo continuam somente em `references/private/`, fora do Git por direitos de terceiros. São opcionais para estudo de composição; o app não depende delas. Na máquina antiga, copie a pasta diretamente para armazenamento privado autorizado; restaure em `RC_PROJECT/references/private/`. Nunca adicione a `public/`, Git ou deploy. Compare com `Get-FileHash -Algorithm SHA256`:

| Arquivo | SHA-256 |
|---|---|
| `cyberware-large.png` | `ab661ba47647fedb32ca2d26ece3829fac20c6d8d883afe81ad4ac63d4507e48` |
| `cyberware-small.png` | `2887b96155d962b35fd262d437154a0922bf02e76c8246ff9c6bfc70a168b110` |
| `perk-tree.png` | `e956d8eb1af5e67b8be32cc09f26ff262ecf362aca81f559d8030fc8ebc6cdad` |

Auditorias JSON/TXT brutas de `artifacts/gates/` e a cópia local `IMPLEMENTATION_LOG-before-checkpoint.md` também permanecem na máquina antiga. Para arquivo forense exato, copie-os por meio privado e restaure no mesmo diretório; para continuidade, use as cópias saneadas versionadas em `artifacts/checkpoint/gates/`. Os originais não foram apagados.

`node_modules`, `dist`, caches e relatórios transitórios Playwright são recriados por install/build/testes. Não transportar credenciais nem configurações globais de Git como arquivos do projeto. Não há GLB/`.blend` de anatomia final oculto no backup: esses assets ainda precisam ser produzidos/adquiridos e licenciados.

## Próxima execução

A recomendação anterior de seguir diretamente para [G2B_ASSETS_DEFINITIVOS](../prompts/G2B_ASSETS_DEFINITIVOS.md) e a orientação posterior de preparar o motor Rinkaku ficam preservadas como histórico da retomada. Essa preparação foi implementada como G3A/G3A.1 e aprovada em P1 com ressalvas; consulte o [aceite](G3A_ACCEPTANCE.md) e o [refinamento](G3A1_REFINEMENT.md) antes de iniciar outra fase. O próximo trabalho planejado é **G4A: simulação de circulação e transporte visual RC**, ainda não implementado. O prompt [G2A_INTEGRACAO_GLB](../prompts/G2A_INTEGRACAO_GLB.md) é histórico de uma fase entregue; não é uma instrução para reexecutá-la. G2B continua dependente de arte/licenças/revisão; G3B, arte final P2 de G3 e G4 completo permanecem futuros. A consolidação deste checkpoint não autoriza implementá-los.

Preserve e evolua a implementação existente: observatório/UI, seis IDs, quatro camadas/isolar, picking, câmera, store/contexto, scan, catálogo v2, validador, fallbacks, acessibilidade e testes. Não reinicialize scaffold, não trate o roadmap G0 como fotografia atual e não reimplemente a aplicação. Sem modelo final, mantenha `PROXY / CONCEPTUAL MODEL`; reconstrução própria não se torna ciência oficial com uma malha mais detalhada.
