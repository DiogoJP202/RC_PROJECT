# 01 — Roadmap revisado após a auditoria G0

> Estado no checkpoint de transferência: G0 e G1 entregues; G2A/G2B/G3/G4 não iniciados. O roteiro abaixo preserva o planejamento G0. A autorização específica de G1 antecipou camadas/isolar com proxies, sem integrar anatomia final. G2 passa a ser proposto em **G2A: infraestrutura GLB** e **G2B: assets definitivos**. Consulte [PROJECT_HANDOFF](PROJECT_HANDOFF.md) e [RESUME_ON_NEW_PC](RESUME_ON_NEW_PC.md) antes de executar prompts antigos. Nenhuma próxima fase é autorizada por este backup.

Revisão: **23/10/2026**. Fontes de decisão: [RESEARCH_INDEX](RESEARCH_INDEX.md), [DECISIONS](DECISIONS.md), [CONTENT_AUDIT](CONTENT_AUDIT.md), [ASSET_INVENTORY](ASSET_INVENTORY.md). O pacote original foi diagnosticado antes desta revisão; nenhuma aplicação foi implementada no G0.

Uma execução por gate/subgate, com decisão humana de prosseguir. **Esta execução termina em G0.** A visão de 90 segundos do North Star é a meta integrada do MVP, não promessa de entregar tudo em G1. Gates G1–G7 exigem código executável, checks, evidência de browser/captura e log; G0 é uma auditoria documental com comandos verificáveis.

## Sequência e dependências reais

```text
G0 → G1 → G2 ─┬→ G3 ─┐
              └→ G4 ─┴→ G5 → G6 → G7
```

G3 e G4 compartilham contrato de contexto e podem ser trabalhados em execuções separadas na ordem viável. Se rig final bloquear G3, seguir G2→G4 com bloqueio explícito; um demo procedural rotulado não encerra a dependência de arte final.

| Gate | Entrega | Pré-requisito de entrada | Evidência de saída |
|---|---|---|---|
| G0 | Auditoria e decisões | Pacote e relatórios reais | Cinco documentos exigidos, roadmap revisado, catálogo validado, conflitos e faltas registrados |
| G1 | Observatório navegável com preview 3D honesto | G0 revisado; plano de proxy | Checks + smoke, capturas desktop/mobile, seleção/foco/reset, erros e movimento reduzido |
| G2 | Corpo em camadas e mapa semântico | G1; corpo aprovado ou proxy com limites aceitos | Clique/lista sincronizados, layers/isolar/restaurar e nodes/bounds reais |
| G3 | Manifestação rinkaku reversível | G2; rig/spline e contrato de arte | Sete fases determinísticas, scrub arbitrário e dez ciclos estáveis |
| G4 | Vascular ↔ RC micro | G2; assets/geradores RBC/RC e fontes mínimas | Follow com identidade estável, ida/volta e perfis de carga medidos |
| G5 | Estado visual integrado | G3 e G4 | Presets/reset e domínio 0..1 testados, mesma origem de estado |
| G6 | Evidência e comparação | G5; claims e fontes conferidos | Filtro por claim, comparação equivalente e zero selo oficial indevido |
| G7 | Qualidade final e release | G6; arte e licenças liberadas | Perfil real, acessibilidade, bundle auditado e publicação reproduzível |

## G0 — Auditoria entregue, dependências não resolvidas por decreto

- [x] Inventariar o workspace e verificar se há código/Git antes de alterar.
- [x] Ler os dois relatórios reais e registrar nomes, hashes, cobertura e passagens.
- [x] Inspecionar as três referências privadas e limitar seu uso à composição.
- [x] Documentar 15–30 claims com categoria, fonte, confiança e lacuna em CONTENT_AUDIT.
- [x] Confirmar stack/escopo, reconciliar fases e nomes de estado.
- [x] Inventariar assets reais, candidatos de licença e tickets de produção.
- [x] Executar o validador existente e distinguir sucesso estrutural de rigor editorial.
- [x] Definir primeira tela, riscos priorizados, testes e prompt G1.
- [ ] Conferir integralmente painéis de mangá inacessíveis e todas as fontes editoriais ainda pendentes — pendência de conteúdo, não declaração de leitura concluída.
- [ ] Adquirir/modelar/validar corpo e rig final — dependência de arte, não entrega G0.

O gate documental termina quando um desenvolvedor externo consegue identificar o que construir primeiro, que forma é proxy, que afirmações estão verificadas e como testar o próximo gate. Aceite artístico de produção e claims pendentes não são declarados completos.

## G1 — Primeira tela, contratos e navegação

Escopo: scaffold Vite/React/TS strict/R3F/Drei/Zustand, conteúdo local, sem backend. Não implementar kagune, microcirculação ou quatro tipos completos. Usar o [prompt recomendado](../prompts/G1_RECOMENDADO_APOS_G0.md).

Aceite concreto:

1. Criar scripts `typecheck`, `lint`, `test`, `build` e `test:e2e`; executá-los com saídas/exit codes no log. Instalar versões compatíveis verificadas e lockfile. Não sobrescrever contratos/documentos por scaffold.
2. Adaptar o seed para catálogo de runtime estrito: IDs únicos, enums/campos, relações de anatomia/câmera, proveniência e disponibilidade do asset; fonte primária/revisão/locator separados da categoria. Fixtures negativas devem rejeitar os casos do ADR-012. Manter o seed original como exemplo até migração explícita.
3. Manequim **tridimensional original** enquadrado por bounds, alto e iluminado. Selo persistente `PROXY / CONCEPTUAL MODEL` se não houver mesh licenciado. Anchor regional aproximado é objeto da cena; seleção HTML e preview usam o mesmo ID. Inspeção interna detalhada fica em G2.
4. Overview, torso, lombar e reset funcionam; foco cancela a transição anterior. Retornar preserva espécime/seleção. Nenhuma câmera corta cabeça/pés em overview ou deixa painel ocultar a seleção.
5. Modos Micro/Comparar podem abrir estado informativo explícito com voltar e contexto preservado. Sem simulação fingida. Timeline do preview, se ativa, controla scan demonstrativo rotulado; manifestação fica indisponível até G3.
6. No viewport **1440×900**, corpo ocupa 60–75% da altura útil do palco. Em **390×844**, palco e controles são usáveis por toque, sem scroll horizontal/clipping; folha de evidência recolhe. Status de proxy/certeza continua legível.
7. Tab/Enter/Esc/reset funcionam, foco visível e alternativas HTML; atalhos não sequestram input. `prefers-reduced-motion` elimina viagens/pulsos obrigatórios. Simular asset ausente e WebGL indisponível/contexto falho: conteúdo textual e esquema original continuam disponíveis.
8. Capturar e **inspecionar** `artifacts/gates/G1-desktop.png` (1440×900), `G1-mobile.png` (390×844) e `G1-silhouette.png`; nomes substituem variantes antigas para evitar duplicidade. Registrar problemas/correções. Sequência curta de scan/foco demonstra movimento; sequência kagune só G3.
9. Registrar primeira medição com equipamento/browser/DPR/rede, tempo até interação, draws e payload. Seguir protocolo ADR-011; não chamar FPS emulado de mobile real. Se ferramenta/browser faltar, saída continua pendente e bloqueio é documentado.

**Bloqueio de saída:** botão ativo sem função, proxy sem rótulo, fonte não conferida com selo de verificação, captura inexistente ou checks falhando. Uma imagem bonita não substitui raycast/câmera reais.

## G2 — Camadas e correspondência espacial

Entrada: G1 aprovado visualmente; corpo segmentado disponível (licenciado ou proxy com limites aceitos). Manifest resolve arquivo/gerador, nodes, bounds, anchor e status factual. Release exige arte de produção, mesmo que G2 aceite proxy para validar UX.

Aceite: selecionar kakuhou por mesh e por HTML gera o mesmo `anatomyId`, painel e foco; repetir depois de orbit/resize/LOD não desloca hotspot. Isolar/restaurar retorna exatamente às camadas anteriores. Testar seleção ocluída, pointer miss e reset. Toda transparência é local/limitada e a região permanece legível. Registrar captura posterior/foco, inventário de nodes efetivos, typecheck/lint/test/build/e2e e smoke.

## G3 — Rinkaku controlado

Entrada: G2 e rig ou gerador spline documentado. Câmaras, rig e malha hipotéticos mantêm disclosure. Quantidade de 1–4 apêndices é escolha desta demonstração, não limite universal da espécie.

Vocabulário único: `rest / activation / release / growth / fixation / active / retract`. `t∈[0,1]`; intervalos de docs/04 são artísticos. `t=1` finaliza retração; amostrar `active` dentro de `.85–.95`. `sampleAt(t)` não depende do tick anterior; estados de kakuhou derivam dessa amostra.

Aceite: sequências `.2→.7→.3→.7` reproduzem o mesmo `.7`; play/pause/reverse/scrub/reset não criam meshes duplicados nem valores não finitos. Dez ciclos completos sem erro de contexto e sem crescimento monotônico de geometrias/texturas após aquecimento. Câmera estável durante scrub; reduced motion usa etapas fixas. Capturas `G3-rest.png`, `G3-growth.png`, `G3-active.png` com t/seed registrados. Rig final ausente mantém **arte final pendente**, mesmo com engine demonstrada.

## G4 — Corrente vascular e microcena

Entrada: G2, geradores/assets RBC/RC, texto de circulação humana e disclaimer do transporte RC. Carregamento de micro não ocorre na entrada Body.

Aceite: duas cenas/contextos conservam espécime/seleção/câmera de retorno por dez idas/voltas. `instanceId→entityId` estável; selecionar/seguir RC conserva evidência durante movimento. Células não atravessam sistematicamente a parede do vaso; sem escala micrométrica RC inventada. Medir perfis de **100, 500 e 2.000** partículas por 30 s após warm-up; registrar FPS p50/p10, draws e memória quando acessível. Não criar componente React por partícula. Captura `G4-micro.png`, micro sem WebGL/falha de asset e modo reduzido testados.

## G5 — Um estado de simulação visual

Entrada: G3/G4 funcionais. Estado único `reserve / activity / hunger / integrity` finito em 0..1; `injury` é derivação opcional de integrity, não variável concorrente. `rcFactor` é conteúdo separado quando verificável.

Aceite: presets calm/active/exhausted/repairing produzem snapshots reproduzíveis; reset restaura o mesmo frame; valores inválidos/NaN não propagam. Mesmo snapshot controla inspector, uniforms e emissão qualitativa. Pausar/aba oculta evita trabalho contínuo indevido. Testes de limites, reset, export/import e determinismo. Cada controle apresenta `VARIÁVEL DO MODELO`, sem equação de força/regeneração oficial.

## G6 — Conteúdo auditável e comparação

Entrada: catálogo runtime com todos os claims relevantes classificados e verificados no grau apresentado. Não é necessário conferir conteúdo pós-MVP para publicar a fatia; é obrigatório deixar esse conteúdo fora do selo oficial.

Aceite: filtro canon mostra apenas claims elegíveis e mantém aviso de forma conceitual; não converte hipótese em inexistência biológica. Fontes têm URL direta/título/locator/nota de consulta; item pendente nunca recebe selo de verificação. Humano/ghoul usa câmera, proporções e escala comparáveis, com diferenças sustentadas; base humana reutilizada é identificada. Teclado e fallback permitem ler as mesmas evidências. Zero claims oficiais sem fonte primária e conferência registrada. Captura `G6-compare.png` e teste editorial de catálogo passam.

## G7 — Produção, performance e distribuição

Entrada: G6; todos os assets públicos com arquivo/gerador e proveniência aprovados. Qualidade cinematográfica/anatômica final continua bloqueada se só houver manequim/tubos conceituais. Preservar honestidade e registrar estado de protótipo se a arte não tiver sido produzida.

Aceite:

- Protocolo ADR-011 medido em desktop real; viewport móvel e, para FPS móvel, dispositivo real. Metas iniciais p50 ≥50/p10 ≥30 FPS desktop, ≥30 FPS mobile, draws <150, payload inicial ≤8 MB comprimidos e interação ≤5 s na rede declarada. Exceção exige medição, causa e decisão explícita, nunca número inventado.
- Carregamento progressivo/LOD e compressão adotados somente se melhorarem medição; dez ciclos dos fluxos sem erros e sem crescimento de recursos após aquecimento.
- QA de docs/08 preenchido com links reais a saídas/capturas; erros e todos os fluxos acessíveis por teclado/toque, reduced motion e fallback.
- Build não contém `references/private`, scans, mídia sem licença ou os relatórios integrais. Créditos e requisitos da versão efetivamente distribuída acompanham derivados quando exigidos.
- Deploy reproduzível documentado e revisão humana final. Não publicar por consequência automática de concluir G0.

## Backlog de dependências acionáveis

| Item | Responsável funcional | Quando | Condição de encerramento |
|---|---|---|---|
| CAT-01 catálogo estrito e estados honestos | Engenharia/editorial | Início G1 | Casos negativos rejeitados e nenhum asset planejado exposto como disponível |
| ART-01 proxy autoral | Technical art/render | G1 | Preview volumétrico, seleção/foco/reset e rótulo persistente |
| ART-02 base humana + ART-03 corpo/camadas | Technical art | Planejamento G1; ingresso G2 | Proveniência, contrato espacial/nodes e avaliação anatômica/visual aprovados |
| ART-04 kakuhou original | Technical art/editorial | G2 | Região aproximada e forma conceitual explicitadas, sem histologia canônica inventada |
| ART-05 rig rinkaku e materiais | Technical art/render | G3 | Rig/gerador testado, sete fases e arte final ou proxy identificado |
| ART-06 RBC/RC/vaso | Technical art/render | G4 | Assets/geradores originais legíveis, instancing e identidade selecionável |
| ART-07 lookdev e otimização | Technical art/render | G3–G7 | Luz, material e LOD avaliados com captura e orçamento medido |
| SRC-01 painéis RC/fases/pathways | Editorial | Antes de promover claims | Edição/capítulo/painel legitimamente lido e locator/extrato/consulta registrados |
| QA-01 hardware/browser de referência | Engenharia/QA | Baseline G1; fechamento G7 | Ambiente e amostra registrados; performance pendente não mascarada |

Os demais módulos de [09_NEXT_MODULES](09_NEXT_MODULES.md) continuam fora desta sequência. Fonte auditada, asset viável, contrato de simulação, storyboard, aceite e ausência de regressão são pré-requisitos para promovê-los.
