# GHOUL ATLAS — Retomar em outro computador

Comece por `AGENTS.md`, depois [PROJECT_HANDOFF](PROJECT_HANDOFF.md), este guia e [README](../README.md). Última fase concluída: **G1**, com anatomia proxy P0 e interação P1. **G2A é a próxima etapa autorizável; não foi executada nem autorizada pelo backup.**

## Identidade do checkpoint

- Repositório privado: [DiogoJP202/RC_PROJECT](https://github.com/DiogoJP202/RC_PROJECT).
- Branch: `main`.
- Referência imutável da baseline G0/G1: tag `ghoul-atlas-g1-checkpoint`.
- SHA da baseline: [`8fac8f7bba9a6891d5306cc14d6e86abbd4ea699`](https://github.com/DiogoJP202/RC_PROJECT/commit/8fac8f7bba9a6891d5306cc14d6e86abbd4ea699).

A tag identifica o código validado. `main` também recebe a documentação de transferência e seus registros de verificação. O SHA de um commit não pode constar dentro do próprio commit; por isso a documentação registra a baseline anterior e permite conferir o HEAD publicado com os comandos abaixo.

## Clone, instalação e inicialização

Instale Git, Node **24.19.0**, npm **11.17.0** e Python **3.10+** (testado **3.12.14**). Autentique o GitHub com conta que tenha acesso ao repositório privado, sem copiar tokens da máquina antiga para arquivos do projeto.

```powershell
git clone --branch main https://github.com/DiogoJP202/RC_PROJECT.git
cd RC_PROJECT
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
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

Esperado nesta baseline: **41 testes Vitest/5 arquivos, 22 Python, 14 E2E**, catálogo v2 aprovado e todos os comandos com exit 0. E2E regenera oito capturas; diferenças de PNG entre GPU/browser/tempo não significam alterações de código e devem ser revisadas antes de commit. Logs do backup: [local-validation](../artifacts/checkpoint/local-validation.json); [saídas](../artifacts/checkpoint/local-validation.txt).

**Restauração comprovada em 23/10/2026:** clone novo do GitHub no commit `2b64744a0065031b3c7f70ee70291a10a1671fac`, `npm ci` e os sete checks acima com exit 0. Nenhum arquivo ignorado do workspace foi copiado; pesquisas/seed/lockfile mantiveram os hashes; working tree do clone permaneceu limpa após E2E. O commit seguinte apenas acrescenta esta evidência/documentação. [Relatório do clone](../artifacts/checkpoint/clean-clone-validation.json) e [saídas completas](../artifacts/checkpoint/clean-clone-validation.txt). Isso comprova restauração nesta estação com ferramentas instaladas; compatibilidade com outra GPU/OS continua sujeita aos checks no computador novo.

`public/catalog.json` é o catálogo ativo. O seed `contracts/seed-catalog.json` v1 é histórico e sua rejeição no validador v2 é esperada. Não altere o seed nem enfraqueça o gate para mascarar esse diagnóstico.

Depois do build, use `npm run preview -- --port 4173`. Para E2E no preview, defina `$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4173'`; remova com `Remove-Item Env:PLAYWRIGHT_BASE_URL` para retornar ao padrão. O perfil opcional `node tests/e2e/production-profile.js` precisa do preview e de WebGL funcional. Não extrapole métricas históricas de Iris Xe/Chrome para o computador novo.

## Arquivos preservados e transferência privada opcional

Código, configs, lockfile, contratos, docs, prompts, testes, ferramentas, recursos públicos autorais, **as duas pesquisas reais** e oito capturas próprias estão no Git. [preservation-index](../artifacts/checkpoint/preservation-index.json) informa hashes e cópias saneadas dos seis relatórios originais. [RESEARCH_INDEX](RESEARCH_INDEX.md) registra hashes dos MD; `.gitattributes` preserva seus bytes e os do seed legado entre clones.

As três imagens abaixo continuam somente em `references/private/`, fora do Git por direitos de terceiros. São opcionais para estudo de composição; o app não depende delas. Na máquina antiga, copie a pasta diretamente para armazenamento privado autorizado; restaure em `RC_PROJECT/references/private/`. Nunca adicione a `public/`, Git ou deploy. Compare com `Get-FileHash -Algorithm SHA256`:

| Arquivo | SHA-256 |
|---|---|
| `cyberware-large.png` | `ab661ba47647fedb32ca2d26ece3829fac20c6d8d883afe81ad4ac63d4507e48` |
| `cyberware-small.png` | `2887b96155d962b35fd262d437154a0922bf02e76c8246ff9c6bfc70a168b110` |
| `perk-tree.png` | `e956d8eb1af5e67b8be32cc09f26ff262ecf362aca81f559d8030fc8ebc6cdad` |

Auditorias JSON/TXT brutas de `artifacts/gates/` e a cópia local `IMPLEMENTATION_LOG-before-checkpoint.md` também permanecem na máquina antiga. Para arquivo forense exato, copie-os por meio privado e restaure no mesmo diretório; para continuidade, use as cópias saneadas versionadas em `artifacts/checkpoint/gates/`. Os originais não foram apagados.

`node_modules`, `dist`, caches e relatórios transitórios Playwright são recriados por install/build/testes. Não transportar credenciais nem configurações globais de Git como arquivos do projeto. Não há GLB/`.blend` de anatomia final oculto no backup: esses assets ainda precisam ser produzidos/adquiridos e licenciados.

## Próxima execução

O prompt proposto está em [G2A_INTEGRACAO_GLB](../prompts/G2A_INTEGRACAO_GLB.md). Só execute após uma nova autorização do usuário. Ele delimita infraestrutura GLB, testes e contrato de arte, sem iniciar G2B/G3/G4.

Preserve e evolua a implementação existente: observatório/UI, seis IDs, quatro camadas/isolar, picking, câmera, store/contexto, scan, catálogo v2, validador, fallbacks, acessibilidade e testes. Não reinicialize scaffold, não trate o roadmap G0 como fotografia atual e não reimplemente a aplicação. Sem modelo final, mantenha `PROXY / CONCEPTUAL MODEL`; reconstrução própria não se torna ciência oficial com uma malha mais detalhada.
