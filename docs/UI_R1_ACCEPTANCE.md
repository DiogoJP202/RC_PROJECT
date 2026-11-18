# UI-R1 — Aceite da vitrine e da navegação

Base de comparação: `1bcecb0f50a7c4ae59abc06f64fc9ac72e976fb4` (G4A.1). A proposta deste gate é dar ao Ghoul Atlas uma entrada editorial e permitir acesso direto aos estudos existentes. **A composição do observatório, a geometria e os samplers continuam sendo os do G4A.1.** Este trabalho ocorre no worktree isolado de `feat/ui-r1`.

## Entrega

| Rota | Contrato |
|---|---|
| `/` | Vitrine com captura autoral do Rinkaku, CTA de entrada, três estudos disponíveis, metodologia e créditos. A imagem é estática, com legenda HTML **Modelo conceitual**. |
| `/estudos` | Índice para Anatomia, Manifestação Rinkaku e Transporte de células RC; compartilha as entradas da vitrine. |
| `/fontes` | Metodologia, classes de evidência, referências do catálogo e do suplemento vascular, e registro de créditos. O vínculo de cada afirmação à fonte permanece nas fichas do observatório. |
| `/atlas`, `/atlas/rinkaku`, `/atlas/vascular` | Entradas diretas para Corpo, Rinkaku e Micro. O Rinkaku usa o mesmo palco do Corpo; o Micro tem renderer próprio carregado sob demanda. |
| `/atlas/comparar`, `/atlas/cell/:entityId` | Estados informativos, sem promoção no índice de estudos. O segundo oferece retorno ao fluxo existente; não implementa inspeção celular. |

As entradas `/?mode=body|micro|compare` e as queries reconhecidas de seleção e diagnóstico continuam válidas. Sua normalização preserva o histórico do navegador, incluindo Voltar/Avançar, sem expor estado de simulação na URL. O manifesto de hospedagem reescreve apenas as rotas HTML indicadas; não encaminha um JSON ou GLB ausente para `index.html`.

## Limites de integração

- A vitrine não precisa montar o observatório. Seu critério de rede é zero contextos WebGL e zero requisições de módulos de renderer, GLB ou catálogo na entrada fria, com até **500 KiB transferidos** no primeiro viewport.
- Na mesma aba, o Atlas já visitado permanece montado ao ir a Estudos ou Fontes, porém fica invisível, fora da interação e com o render suspenso. A troca pausa o transporte. Ao voltar, o critério é manter o canvas anterior, câmera, pose, seleção e configuração; a retomada é manual.
- O caminho Corpo/Rinkaku → Micro reaproveita o `bodySceneBridge`; a saída do Micro restaura o contexto anterior quando lhe corresponde no histórico. O acesso vascular direto volta a Corpo. Back durante a entrada cancela a transição pendente.
- Identidade anatômica, picking, clipes, socket, lease, ownership, validação de catálogo e classificação das evidências permanecem no runtime existente. A apresentação editorial não é evidência canônica e não altera forma, escala ou fisiologia.

## Mídia, licenças e arquivos históricos

A figura foi capturada no canvas original pela própria interface, no checkpoint da base: vista oblíqua, `t=0,88`, quatro apêndices, seed 17 e partículas desligadas. Apenas o HUD foi ocultado para a captura. As versões de 768 × 559 (11.712 bytes) e 1440 × 1048 (23.492 bytes) foram recortadas e comprimidas em WebP. A mídia é autoral do projeto, sem imagens de referência privada, fotos ou malhas de terceiros. IBM Plex Sans, Sans Condensed e Mono são distribuídas localmente em WOFF2, sob [SIL OFL 1.1](../public/assets/fonts/OFL-IBM-Plex.txt). Versões, origens e hashes constam em [ASSET_LICENSES](../public/ASSET_LICENSES.md#ui-r1--captura-editorial-e-tipografia).

Antes da mudança: [desktop 1440 × 900](../artifacts/gates/UI-R1-before-desktop.png), [mobile 390 × 844](../artifacts/gates/UI-R1-before-mobile.png) e [parâmetros e hashes](../artifacts/gates/UI-R1-baseline.json). Essas capturas mostram o Corpo: a vitrine ainda não existia. A execução nova de testes e perfis grava em `test-results/atlas-evidence/`, uma pasta ignorada. Os arquivos históricos de gates são protegidos contra sobrescrita; as novas provas escolhidas para revisão têm prefixo `UI-R1-`.

## Checklist de verificação

- [x] `typecheck`, `lint`, 206 testes unitários em 22 arquivos (`npm test -- --maxWorkers=2`), 22 testes Python, validação do catálogo v2 e `build`.
- [x] Suíte E2E completa executada no build: 69/70 na rodada de 11,3 min; o único caso pendente passou em reprodução isolada tanto em G4A.1 quanto em UI-R1.
- [x] Os oito cenários novos passaram: entrada sem 3D, Estudos/Back, créditos, aliases, contexto/canvas de Rinkaku e Micro, Back durante transição e composição móvel. Passaram as dez transições Corpo → Micro → Corpo, GLB/teclado e perda/recuperação de WebGL.
- [x] Smoke do build com entrada fria, imagem decodificada, caminho até Corpo, Estudos, Fontes e volta ao Atlas. Rotas HTML 200; catálogo e GLB existentes com o MIME correto; diagnósticos de JSON e GLB ausentes com 404 sem fallback HTML.
- [x] Capturas reais em 1440 × 900, 390 × 844 e 430 × 932. CTA dentro do primeiro viewport e sem overflow horizontal nas três larguras.
- [x] Os gates anteriores, samplers, estados, pipeline GLB e checkout principal não foram modificados. As capturas novas conferem com os SHA-256 registrados.

O primeiro teste unitário completo, disparado em paralelo com typecheck e lint, registrou um timeout de 5 s no teste histórico de dez ciclos Rinkaku. A reexecução completa com dois workers aprovou os 206 testes, sem alterar o timer, o teste ou o motor. O aviso conhecido de `THREE.Clock` pertence à dependência de 3D; a vitrine não a carrega.

Na suíte E2E (`npm run test:e2e -- --reporter=list`, Chrome 157.0.8103.79 contra preview), o único caso que falhou foi o acompanhamento contínuo em 2.000 partículas. Ele compara a distância entre duas leituras após uma espera nominal de 500 ms. No trace, o passo de 1,55966 ocorreu em 0,6980 s de simulação e 41 frames; o trecho correspondente no [registro G4A.1](../artifacts/gates/G4A1-review/regressions/artifacts/g4a/tracking-loop.json) já media 1,49005 em 0,6507 s, com velocidade média ligeiramente maior. O trace não mostra corte de câmera e o teste não entra na nova suspensão editorial. Com a mesma versão do Chrome e o mesmo caso executado separadamente, a base passou em 49,3 s (passo máximo 1,27613 após o aquecimento previsto no teste) e o UI-R1 passou em 49,5 s (1,48426). O limite de 1,50, a trajetória e a duração do teste não foram reduzidos ou alterados. A rodada completa não foi repetida; os logs e o trace da falha foram preservados localmente.

| Carregamento frio da vitrine | Transferência | Contextos WebGL | Requisições de catálogo, GLB ou renderer |
|---|---:|---:|---:|
| 1440 × 900 | 196.621 B (192 KiB) | 0 | 0 |
| 390 × 844 | 184.841 B (181 KiB) | 0 | 0 |
| 430 × 932 | 184.841 B (181 KiB) | 0 | 0 |

Medição de transferência por Navigation/Resource Timing, contextos frios do Chrome headless, DPR 1, sem limitação de rede e com compressão do servidor de preview. O teto era 500 KiB. O [relatório do navegador](../artifacts/gates/UI-R1-browser.json) registra versão, recursos, MIME, dimensões e hashes. Isto mede o carregamento editorial e não substitui o perfil de FPS de GPU ou telefone físico.

- Vitrine: [desktop](../artifacts/gates/UI-R1-home-desktop.png), [página completa](../artifacts/gates/UI-R1-home-full.png), [mobile 390](../artifacts/gates/UI-R1-home-mobile.png) e [mobile 430](../artifacts/gates/UI-R1-home-430.png).
- Páginas de apoio: [Estudos](../artifacts/gates/UI-R1-studies-desktop.png) e [Fontes](../artifacts/gates/UI-R1-sources-desktop.png).
- Corpo após a rota nova: [desktop](../artifacts/gates/UI-R1-atlas-desktop.png) e [mobile](../artifacts/gates/UI-R1-atlas-mobile.png), comparáveis ao Corpo anterior sem pretender antecipar UI-R2.

Perfil de produção representativo: `node tests/e2e/g4a1-production-profile.js --count=500 --tracking`. Chrome 157, Intel Iris Xe/ANGLE D3D11, 1440 × 900/DPR 1, CDP 20 Mbps/50 ms, 10 s de aquecimento e 30 s de amostra. Corpo interativo em **1,45 s**, Micro pronto em **1,44 s**; transferência conjunta de **467.498 B**. Tracking a **59,88 FPS p50 / 59,17 FPS p10**, quatro draws e IDs estáveis por 1.800 intervalos. Passaram todos os limites já definidos para esse perfil, sem erros de JS, rede ou HTTP. O [relatório reduzido](../artifacts/gates/UI-R1-performance.json) não substitui a matriz 100/500/2.000 de Fluxo e Tracking nem o teste em dispositivo físico.

## Pendências

Revisão humana da vitrine antes do UI-R2. Palco dominante, reorganização dos painéis de trabalho, dock unificado e auditoria fina de acessibilidade são escopo de UI-R2 a UI-R4. A aprovação visual se refere à interface, não ao nível anatômico da malha. A auditoria do checkout original não encontrou implementação local do G4B; possível WIP em outra máquina continua fora deste gate. Nenhum commit, push ou deploy é necessário para a revisão local.
