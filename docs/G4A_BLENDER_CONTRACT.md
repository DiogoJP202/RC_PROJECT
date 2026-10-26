# G4A — Contrato futuro Blender para vaso, hemácia e RC

25/10/2026. Contrato de ingresso futuro; **não declara asset GLB final recebido, adaptador de produção implementado ou arte P2 aprovada**. O G4A usa geradores originais para demonstrar P1 sem depender de Blender. [Design](G4A_ENGINE_DESIGN.md), [modelo/fontes](G4A_VISUAL_MODEL.md) e [pipeline G2A](BLENDER_WEB_INTEGRATION.md).

**Estado atual:** o usuário aprovou G4A/G4A.1 como P1 suficiente para checkpoint, com parede esquemática, marcador fino/sutil, hemácia simplificada e composição mobile apertada aceitos como limitações não bloqueadoras. Essa decisão não homologa assets definitivos nem aprova P2; não abre G4A.2. O [checkpoint](G4A_CHECKPOINT.md) registra a aprovação P1. A próxima fase G4B está planejada e ainda não iniciada.

## Ingresso e propriedade

Todo asset futuro entra pelo registro/preflight/cache/lease G2A: identidade/revisão, SHA/bytes, licença/proveniência por malha/mapa e créditos. Manter `.blend` recuperável na área de trabalho apropriada, GLB autocontido de runtime e manifesto explícito. Não instalar decoders, permitir URIs externas ou relaxar validação para aceitar um arquivo sem homologação.

O adaptador de transporte recebe snapshots absolutos; não conhece URLs nem nomes de objeto adivinhados. O lease possui recursos adquiridos; buffers/pools/materiais extras têm ownership separado. Desmontar Micro não pode descartar geometria/textura compartilhada de outro consumidor nem o contexto Body. Duas instâncias precisam permanecer independentes.

## Entrega por representação

| Representação | O artista deve declarar e demonstrar |
|---|---|
| Vaso | Superfície interna, orientação das faces/normais, centroline ou correspondência explícita ao percurso, variação de raio/relevo, envelope navegável e zonas de inspeção; não presumir que o tubo autoral atual define anatomia final |
| Hemácia | Forma bicôncava com volume e centro rebaixado sem furo indevido; UVs/normais, bounds, pivô/orientação, material e níveis de detalhe necessários; escala relativa didática documentada |
| Célula RC | Forma original legível e distinta, sem organelas ou medidas canônicas inventadas; superfícies/materiais/licenças e limites do realce didático; manter classificação conceitual |
| Pool instanciado | Submesh/materiais homologados, custo de draw/triângulos, transformações por instância e bound conservador que inclua qualquer deformação aprovada |
| Animação opcional | Seletores reais de bones/morphs/clips e controles absolutos; pose em segundos arbitrários deve coincidir após scrub, pausa, reset e revisita |

IDs anatômicos/entidades e identidade de conteúdo não dependem dos nomes visuais do Blender. O mapa futuro declara exatamente quais nodes/materials/submeshes substituem cada gerador. Não inventar um nome final antes de receber o arquivo nem adicionar um loader paralelo que contorne o registro.

## Espaço, percurso e parede

Unidades/eixos/pivô seguem o contrato G2A. As unidades da cena de Micro não se convertem automaticamente em micrômetros e não determinam tamanho RC. O marcador Body e o interior vascular são representações didáticas de escalas diferentes; não entregar uma falsa continuidade métrica entre elas.

O envelope de cada célula deve incluir geometria, orientação, efeitos que mudem silhueta e deformações. A margem de transporte precisa caber no interior mínimo da parede real, incluindo relevo. Um arquivo visualmente maior que o bound declarado deve ser recusado ou receber contrato corrigido antes da integração. Centro dentro do vaso não basta para provar que toda a célula permanece dentro.

Se o vaso tiver nova curva, ramificação ou perfil de parede, declarar o mapeamento para a trajetória/frame de câmera. A emenda do loop didático precisa conservar posição, orientação e leitura de tracking; não esconder um teleporte em uma entidade selecionada. Uma rede vascular completa não faz parte deste ingresso G4A.

## Identidade, seleção e câmera

O adaptador mantém correspondência explícita entre pool/mesh, `instanceId` e `entityId`. Atualizar geometria/material não renumera uma entidade existente. Destaque RC é apresentação didática, não fluorescência real; não altera trajetória ou a evidência associada.

Preservar seleção por clique e HTML, aviso de entidade ausente quando o perfil muda e modos Free/Flow/Tracking. A câmera usa bounds e frames reais do novo asset, com limites que evitem atravessar a parede. Voltar ao Body restaura câmera/seleção/camadas/timeline Rinkaku, sem acoplamento quantitativo metabólico.

## Evidência antes de aceitar a substituição

Conferir proveniência e arquivo exato; renderizar malhas e deformações efetivas; verificar finitude/bounds e instâncias. Repetir perfis100/500/2000, seleção real, looping/tracking, câmera livre, pausa/reset/scrub e configurações com entidade ausente. Executar dez entradas/retornos, descarte/remontagens, falha/cancelamento, teclado/toque/reduced motion e contexto WebGL perdido.

Inspecionar overview, close-ups RBC/RC, seleção, tracking e mobile com imagens/filme reais do renderer web. Medir material/transparência/sombras e conferir os budgets existentes; normal map ou maior densidade não aprovam automaticamente naturalidade ou anatomia. Registrar autor/revisor/data/hash, fontes humanas, escolhas artísticas e problemas remanescentes.

O aceite P2 exige arte concreta e revisão humana. Modelo RC continua hipótese visual salvo proposições textuais verificadas por fonte direta; nenhum rig/GLB certifica histologia ou escala RC. Até existir entrega licenciada e aprovada, o procedural permanece a representação honesta e o adaptador final permanece futuro.

## Dependências futuras P2 identificadas no refinamento G4A.1

Os itens abaixo são exigências da futura substituição Blender, preservadas após o aceite humano P1. Não são bloqueios adicionais do checkpoint atual nem tarefas G4A.2 autorizadas. O ingresso dependerá dos arquivos concretos, autoria/licenças, revisão técnica de topologia/normais/materiais e bounds, testes no renderer web e aprovação humana da nova representação.

- Parede: produzir superfície interna com curvatura/normais/materiais que sustentem profundidade sem depender de faixas procedurais ou brilho intenso. Não apresentar relevo autoral como histologia identificada; declarar raio interno mínimo e envelope real.
- Hemácia: preservar biconcavidade reconhecível em luz difusa, vista frontal, oblíqua e lateral; revisar facetas/normais sem fazer a depressão parecer um furo. Materiais precisam equilibrar concavidade e reflexos no renderer web.
- RC: manter silhueta e relevo reconhecíveis sem cobertura cromática de seleção. Forma continua interpretação autoral; não adicionar organelas ou medidas oficiais inventadas.
- Tracking: fornecer bounds conservadores completos por instância, incluindo a animação/deformação aprovada. Centros/raios devem estar no mesmo espaço das trajetórias; um bound só do pivô invalida a prevenção de proximidade.
- Seleção/diagnóstico: o marcador externo precisa preservar a superfície original, respeitar profundidade e não interceptar picking. A substituição deve conservar identidade semântica e oferecer triângulos reais para avaliar visibilidade, em vez de declarar o score de esferas como prova visual.

Repetir comparação com a mesma seed/entidade/tempo/perfil, reprodução em circuito completo, testes de contenção, dez retornos Body/Micro e perfis100/500/2000. Densidade máxima pode conservar oclusões; os assets não autorizam alterar trajetórias para esconder esse limite. Estas exigências preparam o ingresso futuro e não implementam G2B nem certificam P2.

G4B planejada não implica que assets Blender finais estejam prontos ou que a anatomia interna RC esteja validada. Seu escopo e evidências deverão ser definidos antes de qualquer implementação; este contrato continua limitado à substituição futura das representações de transporte existentes.
