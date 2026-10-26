# G4A — Motor de transporte vascular visual

25/10/2026, America/Sao_Paulo. Implementação autorizada sobre o checkpoint `717f4069c5e662f78ea8b28e7d13e0636ab0c5dd`, preservando G1/G2A/G3A. Escopo: infraestrutura e primeira experiência P1; não é CFD, fisiologia quantitativa, G4B, G5, G2B ou G3B. Sem commit, push ou deploy automático. A aprovação artística permanece humana.

> **Atualização local G4A.1:** refinamento implementado, com 203 unidades, 22 Python e a suíte completa de 62 E2E aprovados. Após o CSS final, os mesmos seis cenários de refinamento passaram novamente; são rechecagens, não seis testes distintos adicionais. TypeScript, lint, catálogo e build também passaram. Decisões em [G4A1_REFINEMENT](G4A1_REFINEMENT.md), capturas/vídeo finais no [pacote G4A.1](../artifacts/gates/G4A1-review/INDEX.md) e 12 perfis com budgets originais aprovados no [comparativo final](../artifacts/gates/G4A1-review/PERFORMANCE.md). Os números e inventários de produção G4A abaixo permanecem históricos. Após essa revisão, o usuário aprovou G4A/G4A.1 como P1 suficiente para checkpoint; P2 continua pendente. [Decisão atual](G4A_CHECKPOINT.md).

Este documento descreve o contrato e a arquitetura implementados localmente. Foram produzidas evidências automatizadas e uma revisão visual técnica do protótipo; a pendência de aprovação P1 no encerramento técnico original foi resolvida pela decisão humana atual do usuário. Os resultados de cada execução e da regressão final são registrados no [aceite](G4A_ACCEPTANCE.md), distinguindo a baseline G4A das evidências G4A.1. [Modelo visual e fontes](G4A_VISUAL_MODEL.md); [contrato Blender futuro](G4A_BLENDER_CONTRACT.md).

## História completa

Seleção de uma região vascular aproximada no Body → foco/aviso de mudança de escala → carregamento lazy da cena Micro → inspeção do lúmen e células → seleção de uma entidade por instância ou HTML → acompanhamento sem alterar sua trajetória → retorno ao contexto corporal anterior. A troca é de cenas e escala didática; não pretende um zoom físico contínuo até células RC de tamanho conhecido.

O modo Micro integra o aplicativo existente. Body e Micro têm recursos de apresentação separados, mas compartilham a governança editorial, preferências e navegação. Erro da microcena deve oferecer conteúdo/retorno e preservar o contexto do corpo. O modo Comparar permanece fora desta implementação.

## Camadas e responsabilidades

| Camada / arquivo | Responsabilidade |
|---|---|
| `src/simulation/vascular.ts` | Configuração normalizada, identidades, circuito fechado ilustrativo, frame local, posição/orientação absolutas e margem conservadora à parede |
| `src/state/vascular.ts` | Comandos, seleção, perfil, velocidade artística, câmera e relógio transiente; sem atualização React por frame |
| `src/scene/vascular/ProceduralVascularAdapter.ts` | Geometrias autorais, pools instanciados RBC/RC, correspondência de IDs, materiais, seleção, buffers e descarte próprios |
| `src/scene/vascular/VascularScene.tsx` | Canvas lazy, aplicação por frame, câmeras, picking real, métricas e contexto WebGL da microcena |
| `src/scene/vascular/tracking.ts` | Planejamento absoluto de câmera por volumes conservadores, sem alterar partículas; exclui a própria entidade do conjunto de obstáculos |
| `src/scene/vascular/camera.ts` | Transporte periódico e suavização de apresentação; acompanha a deriva da entidade e limita velocidade/aceleração das correções |
| `src/scene/vascular/visibility.ts` | Diagnóstico sob demanda da fração amostral visível por triângulos reais; não é executado para medir FPS nem controla a câmera |
| Integração App/observatório | Entrada, bookmark e restauração Body; pausa do trabalho não visível; controles acessíveis e fallback |
| `src/content/vascularEvidence.ts` | Suplemento editorial validado, usando os mesmos tipos de claim/citação do catálogo existente |

A tabela descreve os módulos implementados; o resultado das verificações pertence ao aceite, com seus comandos e evidências.

## Tempo, identidade e geometria do transporte

`VascularConfig` contém `count: 100 | 500 | 2000` e `seed`. Os perfis contam objetos da demonstração, não concentração sanguínea/RC. A distribuição entre tipos é autorada e também não é proporção biológica.

Cada entidade tem identidade estável, tipo, índice e parâmetros derivados de seed. A população não pode alterar a trajetória de uma entidade que continua presente. `createEntity` e `createParticles` são trabalho de configuração; `writeVascularAt(seconds, entity, config, output)` escreve em armazenamento reutilizado. `sampleVascularAt` é a conveniência pura para testes/comandos. Uma pose não depende do frame anterior nem de `Math.random()` em reprodução.

O circuito didático é fechado e periódico, com curvatura longitudinal e relevo radial discreto. O frame é calculado em coordenada absoluta, com tangente/normal/binormal e quaternion. Uma tabela de comprimento de arco preparada uma vez distribui o movimento ao longo da curva. Orientação e deriva radial são limitadas e reproduzíveis. O loop fechado evita uma entidade selecionada desaparecer em uma ponta e reaparecer por teleporte na outra; não representa a rede vascular real do corpo inteiro.

A margem de transporte desconta um bound conservador da célula inteira e o relevo da parede. Verificar só o centro dentro do tubo seria insuficiente. Os testes precisam conferir posições/orientações, bounds da geometria e amostras densas do loop, inclusive a emenda e as três populações. Isso não cria um solver de colisões célula/célula ou uma validação hemodinâmica.

`vascularClock.seconds` pertence ao transporte e o slider normalizado de velocidade controla um multiplicador artístico. Pausar conserva o tempo; scrub/passos/reset fornecem poses absolutas. Reduced motion permite passos e seleção sem exigir movimento contínuo. Página oculta, falha/indisponibilidade e saída da cena pausam o relógio. Nenhum desses controles altera reserva RC, força, fome, emissão ou regeneração do Rinkaku.

## Instâncias, seleção e acompanhamento

A chave de picking inclui o pool/mesh e o `instanceId`, porque RBC e RC podem ter índices locais iguais. O adaptador resolve essa chave para `entityId`; o inspector usa a identidade estável, não o índice de draw. O destaque RC muda a apresentação sem renumerar entidades ou simular fluorescência biológica. Quantidade e seed mudam por comandos discretos, sem componente React por célula.

Selecionar uma entidade preserva sua evidência durante movimento e voltas do circuito. Se ela sair da população ao reduzir o perfil, o inspector deve mostrar indisponibilidade explícita e a câmera sai do tracking; não substitui a seleção silenciosamente por outra célula. A seleção HTML e o clique real precisam chegar ao mesmo ID.

As câmeras são `free`, `flow` e `tracking`. Free permite órbita/exploração limitada ao interior; Flow acompanha a direção geral; Tracking usa a posição/tangente da entidade. O modo de câmera nunca escreve na trajetória. Mudança de modo, scrub, orientação do frame e emenda do circuito precisam ser inspecionados para evitar tremor/inversão. Reset de câmera retorna à composição inicial sem modificar indevidamente o estado do corpo.

No G4A.1, `tracking.ts` avalia poucos candidatos no envelope conservador do vaso a partir dos centros/raios reutilizáveis da população corrente. O custo considera o cone de visão, a proximidade e a preferência pela vista nominal; o alvo depende do tempo absoluto e da população, sem histórico do sampler. Na reprodução, `camera.ts` transporta a deriva de fase/lane do mesmo ID e aplica velocidades/acelerações limitadas somente às correções de enquadramento. Pausa, scrub de qualquer tamanho e reduced motion reconstroem a pose absoluta e zeram essas velocidades. O easing em reprodução continua sendo estado de apresentação, distinto dos dados determinísticos das partículas.

A seleção G4A.1 usa arcos externos com depth test, sem raycast próprio nem pintura da superfície selecionada. O marcador compartilha a transformação da entidade, respeita oclusão e conserva a resolução de picking por pool/instância. Isso não garante visão integral da célula: a heurística de volumes e os trajetos entre candidatos não são um solver de colisões célula/câmera. Esferas conservadoras podem sobrepor a câmera em cenas densas; gap negativo é um alerta, sem provar contato com triângulos da superfície.

## Contexto, ownership e recursos

`src/scene/vascular/camera.ts` separa a trajetória das partículas da suavização da câmera. A transferência automática percorre o menor arco periódico; offsets permanecem no interior conservador. A câmera livre usa projeção sobre a curva e margem própria. O estado de suavização pertence somente à câmera; não altera o sampler. Reduced motion e scrub explícito podem avaliar diretamente a pose estática; reprodução ordinária cruza a emenda continuamente.

No fechamento, a passagem de Flow/Tracking para Free foi ajustada para conservar a pose real atual. Somente a primeira montagem ou o comando explícito de reenquadramento retorna à entrada do circuito. O damping dos controles fica ativo apenas na exploração livre sem reduced motion; a atualização ao mudar essa política descarrega o movimento residual. Essas correções não alteram o tempo ou as trajetórias das entidades. A regressão final desses comportamentos é registrada no aceite, sem atribuir sua validação a capturas anteriores à correção.

**Inventário histórico G4A:** o adaptador possuía três geometrias, três materiais, dois pools de instâncias e uma textura de relevo 128×128 original. A capacidade conjunta é 2000; os perfis mudam quantidade e tabelas CPU por comando, conservando os UUIDs GPU. Naqueles perfis de produção, o renderer Micro registrou três draws de geometria, três geometrias e duas texturas. Uma textura é de propriedade do adaptador; o contador do renderer tem escopo diferente e não identifica sozinho a propriedade da segunda. Não há sombras por célula, transparência ou pós-processamento. Esses inventários não são métricas de VRAM nem totais de recursos da aplicação: o Body permanece montado e residente para preservar contexto, com seu render suspenso durante Micro.

**Inventário de código G4A.1:** quatro geometrias/quatro materiais, os mesmos dois pools e uma textura própria. A geometria/material adicionais pertencem ao marcador de seleção, que acrescenta um draw quando visível; o descarte idempotente cobre esses recursos e os buffers de obstáculos. Os [perfis finais antes/depois](../artifacts/g4a1/performance-comparison.json) registram três draws em Fluxo e quatro em Tracking atual. Todos os 12 perfis passaram nos budgets preservados: p50 de 59,88 FPS, p10 anterior de 59,52 e atual entre 58,82–59,52. Isso se limita ao protocolo/hardware registrados, sem medir VRAM ou FPS de telefone físico. Materiais e iluminação foram refinados sem modificar geometria, escala ou trajetórias das células; o relevo amplo adicional da parede cresce somente para fora do envelope anterior.

O bookmark Body inclui posição/alvo/orientação da câmera e o contexto de seleção/camadas/opacidade, além da timeline/configuração/direção do Rinkaku e preferência reduced motion. Entrar em Micro pausa trabalho visual corporal desnecessário, sem criar um metabolismo compartilhado nem exigir reset do espécime. Retornar restaura o bookmark antes de devolver a interação. Uma transição interrompida ou falha de micro não publica um estado parcial sobre o Body.

Recursos Micro são carregados sob demanda. O adaptador possui seus buffers/geometrias/materiais/pools e descarta-os idempotentemente na desmontagem. Não possui nem libera leases G2A. A quantidade ativa muda o pool sem crescimento contínuo de recursos; a capacidade e os bounds efetivos devem constar do diagnóstico final. Refazer uma população não autoriza recriar material/geometria a cada frame.

A integração futura GLB continua pelo registro/cache/preflight G2A, com seletores/licenças explícitos. Não usar um loader paralelo nem copiar recursos desconhecidos. O procedural continua disponível se a arte final não passar pelo ingresso; veja o [contrato futuro](G4A_BLENDER_CONTRACT.md).

## Evidência e verificação

`evidenceFor('vessel' | 'rbc' | 'rc', content)` retorna `EvidenceClaim[]` e `Citation[]`. O suplemento tem validação explícita de tipos, IDs únicos, referências, classes, data/locator/nota e fontes elegíveis. Namespace próprio impede sobrepor o catálogo corporal. As consultas de 25/10 estão no [modelo visual](G4A_VISUAL_MODEL.md); fatos humanos, texto oficial, hipótese e desconhecido permanecem separados. `public/catalog.json` e o contrato base não são reescritos para registrar uma falsa anatomia vascular.

Protocolo final: suítes completas, dez transições reais Body→Micro→Body, seleção por instância/HTML, tracking, perfis e identidade ausente, pausa/reset/scrub, teclado/toque/reduced motion, contexto perdido e remontagens. Perfis de produção independentes de 100/500/2000, 10 s de aquecimento e 30 s rAF, equipamento/GPU/browser/rede/DPR declarados. Registrar draw calls, triângulos, texturas/geometrias e memória observável; não chamar heap ou contadores de VRAM.

Os três perfis de produção em `artifacts/g4a/production-{100,500,2000}.json` medem a entrada inicial com o perfil padrão 500. Só depois da marca `readyMs` o script seleciona a população solicitada, aquece e amostra essa população. Portanto, `readyMs` é tempo de entrada padrão, não latência de inicialização específica de 100 ou 2000 objetos. FPS vem de intervalos rAF, e heap JavaScript não mede memória GPU; as observações se limitam ao equipamento e protocolo registrados.

O [pacote histórico G4A](../artifacts/gates/G4A-review/INDEX.md) contém sete screenshots reais exigidos, sequência, vistas complementares e vídeo da entrada, profundidade, hemácia, RC, seleção, tracking e mobile, com metadados preservados. A [revisão crítica G4A](../artifacts/gates/G4A-review/REPORT.md) registra os limites daquela apresentação. O [pacote atual G4A.1](../artifacts/gates/G4A1-review/INDEX.md) consolida capturas pareadas, sequência/vídeo e diferenças de enquadramento declaradas; a evidência final deve ser conferida nesse índice. Testes numéricos não aprovam automaticamente a qualidade visual. Resultados e limitações ficam em [G4A_ACCEPTANCE](G4A_ACCEPTANCE.md) e [G4A1_REFINEMENT](G4A1_REFINEMENT.md), sem reutilizar métricas G3A/G4A como novos dados G4A.1.

## Estado de checkpoint e dependências futuras

G4A/G4A.1 foram aprovados pelo usuário como P1 suficiente. Parede esquemática, marcador fino/sutil, hemácia simplificada e composição mobile apertada são limitações conhecidas aceitas como não bloqueadoras; permanecem descritas e não motivam novo G4A.2 neste checkpoint. Essa aprovação não modifica contratos, fontes ou resultados numéricos e não converte malhas procedurais em P2.

Arte/anatomia P2 depende de assets Blender concretos com autoria/licença, topologia, normais, materiais, bounds e correspondência ao percurso, além do ingresso pelo pipeline G2A, medições e revisão humana no renderer web. G4B é a próxima fase planejada e ainda não iniciada. O motor atual não implementa seu futuro escopo, metabolismo compartilhado ou novas afirmações anatômicas. [Registro da decisão e limites](G4A_CHECKPOINT.md).
