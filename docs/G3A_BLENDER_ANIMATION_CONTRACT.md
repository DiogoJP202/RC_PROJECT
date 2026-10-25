# G3A — Contrato futuro de animação Blender → Web

24/10/2026, America/Sao_Paulo. Complemento de [BLENDER_WEB_INTEGRATION](BLENDER_WEB_INTEGRATION.md) para manifestação Rinkaku. Este documento define a fronteira entre motor temporal e representação; **não declara asset final, implementação GLB Rinkaku, rig ou anatomia aprovados**. G3A implementa a representação procedural original. G2B/G3B e o fechamento artístico de G3 permanecem futuros.

> Atualização de 25/10/2026: o usuário aprovou técnica e visualmente o G3A.1 como **protótipo P1 com ressalvas**. Esse aceite não é fidelidade visual/anatômica P2 nem aprovação de asset Blender. A seção final converte as ressalvas da implantação e do close-up em requisitos da futura entrega. Commit/push do checkpoint foram autorizados posteriormente à implementação; isso não autoriza deploy ou ingresso/desenvolvimento de G2B/G3B/G4. G4A permanece somente planejado.

## Entrega e ingresso continuam G2A

Cada revisão deve manter fonte `.blend` recuperável, GLB autocontido, metadados semânticos, licença/proveniência por geometria e textura, atribuição, bytes/SHA-256 e relatório de deformação. Não incluir `.blend`, fontes privadas ou recursos sem direitos claros em `public/`. Não relaxar preflight, extensões homologadas, limites de payload ou política de rede para fazer um export passar.

Aquisição obrigatória pelo registro central e `acquireAsset(assetId)`; consumo por lease. O motor de manifestação não busca URLs e não conhece arquivos do artista. Um componente que monta o adaptador não deve usar um `GLTFLoader` paralelo que contorne identidade, cache ou ownership.

## Fronteira do adaptador

O motor entrega um snapshot absoluto de [G3A_ENGINE_DESIGN](G3A_ENGINE_DESIGN.md): `t`, fase, progresso local, exposição de raiz, ativação do kakuhou, extensão, espessura, rigidez, emissão de partículas, movimento e intensidade visual. Valores artísticos normalizados `0..1`; nunca fator RC ou medida fisiológica real.

O adaptador aplica a amostra à representação existente. A interface `RinkakuAdapter`, em `src/scene/rinkaku/adapters.ts`, oferece `group`, `apply(snapshot, connection: Matrix4)`, `getBounds(output: Box3)`, `inspect()` e `dispose()`. A conexão é uma transformação de cena; os valores de animação vêm do snapshot. Representações procedural e GLB compartilham a intenção visual, sem exigir topologia/bones iguais. O futuro adaptador GLB deve rejeitar mapeamento incompleto com motivo e manter o proxy disponível.

O arquivo declara `GLBRinkakuMapping`, `FutureGLBRinkakuAdapter` e `GLB_RINKAKU_AVAILABILITY.available: false`. Não há uma classe GLB simulando suporte a um modelo ausente. O mapeamento tipado atual exige identidade/revisão, raiz/conexão semânticas, lista de apêndices, bones por `semanticId`, morphs por `semanticId`/índice/canal, clips por índice/canal/intervalo, envelope e ownership `g2a_asset_lease`. O contrato de ingresso abaixo pede também a documentação legível dos nomes/canais e a revisão do pacote concreto.

**Nomes de bones, morphs, clips e nodes serão fornecidos pelo artista por revisão.** Não há nomes finais aprovados neste documento. Identificadores de função usados no manifesto são semânticos; nunca procurar uma substring como `tentacle`, assumir índices de bone ou tratar convenção sugerida como conteúdo presente no arquivo.

## Mapeamento explícito por revisão

Metadados adicionais da futura representação precisam descrever, no mínimo:

| Campo de contrato | Conteúdo que o artista/integração deve fornecer |
|---|---|
| Identidade | `assetId`, revisão e SHA-256 correspondentes à entrada aprovada |
| Raiz semântica | Node real da cena ativa, identidade e espaço local |
| Conexão | Socket lombar real, pai, orientação, unidade e offset declarado |
| Apêndices | Lista de 1–4 canais da demo e seus nodes/raízes reais |
| Bones | Seletores exatos, eixos locais, pose de referência, limites e propriedade de cada canal |
| Morphs | Mesh semântico, nomes reais, faixa válida, neutro e combinação permitida |
| Clips | Nome real, duração, intervalo de autoria, looping, alvos e política de root motion |
| Materiais | Seletores exatos e canais permitidos para variante de apresentação |
| Encaixe | Relação corpo/socket/apêndice e envelope de poses |
| Canal temporal | Como cada valor normalizado controla bones, morphs e/ou tempo de clip |
| Qualidade | Contagens de vértices, triângulos, draws, joints, mapas e recursos compartilhados |

A lista descreve requisitos, não um manifesto de asset existente. Morphs e bones são capacidades alternativas/compostas: declarar o que a revisão realmente oferece; não criar parâmetros silenciosos sem efeito.

## Espaço e encaixe

Manter metros, +Y acima e +Z à frente do espécime, transformações aplicadas, escala unitária e pivô declarado conforme G2A. O adaptador recebe transformação de conexão derivada do socket real e atual, ou o fallback regional aproximado do proxy. A conexão acompanha a hierarquia animada; não guardar uma posição fixa de mundo.

A raiz e os primeiros segmentos devem manter contato no envelope inteiro. Informar orientação de saída, separação entre raízes e quaisquer offsets artísticos. Região lombar aproximada e socket são infraestrutura espacial e reconstrução conceitual; não autenticam ductos, vasos, lóbulos ou histologia de kakuhou.

Não tratar bounds/altura/nomes das fixtures G2A como especificação de anatomia final. Cada revisão fornece seus próprios limites medidos e tolerâncias justificadas; a câmera usa bounds reais quando apropriado sem saltar a cada scrub.

## Amostragem absoluta e reversibilidade

Sete fases obrigatórias: `rest [0,.08)`, `activation [.08,.20)`, `release [.20,.35)`, `growth [.35,.67)`, `fixation [.67,.85)`, `active [.85,.95)` e `retract [.95,1]`. São intervalos editoriais, não cronologia canônica. `t=1` é recolhido, não o estado ativo final.

O adaptador deve aplicar posição absoluta a partir da amostra. Não usar incrementos de rotação/escala, springs integrados ou `mixer.update(delta)` como única fonte de pose em scrub: o frame `.7` precisa coincidir após `.2 → .7 → .3 → .7`. Se clips forem usados, definir ação/tempo/peso de forma absoluta e resolver combinações deterministicamente a partir da pose neutra. Restaurar os canais controlados antes de amostrar outra combinação quando necessário.

Documentar canal proprietário: não deixar o clip G2A, outro mixer e o adaptador escreverem simultaneamente no mesmo bone/morph/material. Movimento secundário precisa de função absoluta de tempo/seed ou de modo de inspeção que o congele; `prefers-reduced-motion` permite os mesmos estados por passos estáticos.

O artista entrega vistas início/meio/fim e extremos, poses limítrofes e o mapa de remapeamento entre coordenada global e tempo de cada clip. Verificar continuidade geométrica/material, conexão, auto-interseções relevantes e integridade de normais/UV ao avançar e retroceder.

## Ownership, cache e descarte

O lease G2A possui a instância mutável de transformações, materiais, skeleton/mixer; template compartilha geometrias/texturas até a última liberação. Não executar descarte recursivo genérico de uma árvore adquirida. Troca/desmontagem chama `lease.release()` exatamente uma vez por aquisição.

Recursos extras criados pelo adaptador, como partículas, buffers ou variantes que não pertencem ao lease, exigem ownership e descarte próprios. Não modificar materiais compartilhados por estruturas distintas. Encerrar ações e conexões imperativas do adaptador antes de liberar o lease. Uma instância liberada não pode quebrar outra.

Falha/cancelamento/troca rápida não publica adaptador parcial nem deixa callbacks tardios sobrescreverem a representação escolhida. Preservar os testes de cache, coalescência, leases concorrentes, erro/late resolve e descarte já existentes.

## Aceite futuro de uma representação GLB

1. Conferir proveniência/licenças/hash e preflight do GLB concreto pelo caminho G2A; inventariar tudo que foi declarado no mapa.
2. Rejeitar seletores ausentes, ambiguidades, canal sem efeito, bounds/transforms inválidos ou recursos não homologados. Mostrar fallback explícito.
3. Demonstrar aplicação absoluta em `.04/.14/.27/.53/.76/.90/.98/1`, limites das sete fases, scrub arbitrário e reset.
4. Demonstrar bone, morph ou clip deformando vértices reais; lista de nomes/JSON não basta.
5. Demonstrar socket e raízes acompanhando movimento do pai/asset; câmera, seleção, camadas/isolar e opacidade preservados.
6. Testar duas instâncias independentes, troca procedural ↔ GLB, cancelamento, erro e descarte após dez ciclos; medir recursos observáveis depois de aquecimento.
7. Repetir unitários/E2E, reduced motion, teclado/toque/fallback, capturas e perfil do build de produção. Registrar hardware/browser e limitações.
8. Obter revisão artística/anatômica humana dos arquivos finais, documentando autor/revisor/data/escopo. Aceite técnico de fixtures/procedural não cumpre essa revisão.

Até esses requisitos serem demonstrados, `GLBRinkakuAdapter` é uma fronteira futura, não uma feature final disponível. A forma e animação mantêm `PROXY / CONCEPTUAL MODEL` / reconstrução conceitual quando cabível, independentemente de claims textuais com fonte oficial.

## Complemento G3A.1 — transporte e implantação

Refinamento do procedural aprovado pelo usuário em 25/10/2026 como entrega técnica e visual **P1 com ressalvas**; arte/revisão anatômica P2 permanecem pendentes. Os requisitos de ingresso, seletores explícitos, ownership e amostragem absoluta acima permanecem. **Nenhum adaptador GLB Rinkaku final foi implementado nesta revisão.** O [registro G3A.1](G3A1_REFINEMENT.md) diferencia implementação, testes novos e revisão visual.

O transporte automático usa `playbackTimeAt(t)` e `rinkakuTAtPlaybackTime(seconds)`, total nominal de 21 s e retração de 3,4 s. Isso pertence ao relógio da aplicação. Um adaptador futuro continua recebendo o mesmo snapshot normalizado; não deve ler segundos de parede, integrar sua própria duração nem alterar os sete intervalos. `motionTime` do sampler conserva sua referência artística de 18 s. Clips/bones/morphs devem ser posicionados absolutamente a partir dos canais declarados, preservando `.7→.2→.7` e o percurso reverso no novo transporte. Se a entrega artística incluir remapeamento de clip, documentá-lo explicitamente sem criar uma segunda fonte de progresso.

A implantação proximal do procedural passou a integrar a superfície indexada dos apêndices, com distribuição por quantidade, contato raso, relevo de ativação e pescoço estreito. A função de contato atual aproxima **o proxy corporal desta aplicação**, em coordenadas do adaptador. Ela não infere a superfície de um GLB, não modifica a topologia do corpo e não garante encaixe em outro modelo. A futura entrega deve fornecer sua própria geometria de junção, paleta/material de contato, relação com a superfície corporal e envelope de deformação, declarados por revisão. Não copiar offsets, raios, cores de pele ou a fórmula do proxy como se fossem anatomia aprovada.

Enquanto o procedural substitui a apresentação, meshes do órgão preexistente vinculadas a `ghoul.kakuhou.rinkaku` ficam invisíveis no modo de manifestação. A identidade/binding e o node/socket continuam vivos; fora do modo, a visibilidade volta às regras de camada e isolamento do observatório. Essa política evita a apresentação duplicada do órgão e da nova raiz, sem descartar recursos do lease nem adulterar o cache. Uma representação futura precisa declarar quais meshes são substituídas e quais continuam visíveis, preservando canais/seleção e restaurando a apresentação ao desmontar ou falhar. Não esconder partes do corpo por heurística de nome ou descartar meshes para resolver o encaixe.

As fixtures GLB G2A continuam sendo provas técnicas de socket, cache e restauração. Não validam o contato artístico ou a anatomia de um modelo futuro. A nova vista oblíqua e o enquadramento móvel do procedural também não substituem a revisão do envelope do corpo/apêndices do asset final. Repetir as vistas, quantidades, scrub, camadas/isolamento, montagem/desmontagem, dez ciclos e medições quando esse asset existir. Todos esses elementos continuam sujeitos à revisão artística e anatômica humana.

## Requisitos artísticos P2 derivados das ressalvas P1

O aceite P1 conserva explicitamente três limites: bases que ainda podem lembrar conectores, ausência de continuidade entre a pele corporal e o tecido emergente e facetas/bordas no close-up. Não resolver esses limites somente com brilho, partículas, corpo translúcido ou uma câmera que esconda a junção. A próxima entrega artística deve documentar e demonstrar os itens abaixo com o corpo opaco e as vistas reais do renderer web.

| Área da entrega Blender | Requisito e evidência de ingresso futuro |
|---|---|
| Junção lombar | Forma proximal que emerja do corpo, com distribuição e afilamento coerentes para os canais suportados. Ausência de leitura involuntária de anel, flange, bulbo anexado ou peças grosseiramente sobrepostas. Demonstrar repouso, ativação, liberação, crescimento, fixação, ativo e retração |
| Continuidade pele/tecido | Declarar a solução de integração: topologia contínua ou superfícies de transição explicitamente autoradas e deformadas em conjunto. A solução precisa manter contorno, contato e continuidade visual de normais/material durante todo o ciclo; o mero encontro de duas meshes independentes não satisfaz o requisito |
| Topologia e deformação | Loops e densidade adequados à flexão/abertura/recolhimento, normais e tangentes coerentes, UVs/skin weights/morphs íntegros quando usados. Evitar facetas inesperadas, tampas expostas, estiramento ou dobras abruptas no close-up. Declarar o que é contínuo, soldado, sobreposto ou recortado e sua propriedade de animação |
| Materiais de contato | Paleta e resposta PBR coerentes entre pele, transição e tecido: cor, rugosidade, normal/tangente e demais mapas aprovados. Documentar seletor/ownership de cada material e licenças dos mapas; não depender da cor fixa ou da fórmula de contato do proxy |
| Close-up | Capturas e sequência em posterior, lateral e oblíqua, incluindo foco lombar e luzes finais da aplicação. Inspecionar costura, raízes, perfis rasantes, pregas e superfície madura com movimento reduzido e reprodução real. Quadro geral bonito não substitui essa revisão |
| Envelope completo | Bounds medidos do corpo, junção e apêndices nas poses extremas e ao longo do ciclo, para cada quantidade/configuração suportada. Registrar zonas de contato e tolerâncias justificadas, oclusões e interseções conhecidas; não prometer ausência universal de colisão sem verificação |
| Scrub e retração até `t=1` | Aplicação absoluta em ordem arbitrária, revisita de `.7` e todo o trecho `.95→1`, inclusive `.99/.995/.999/1`. `t=1` deve terminar recolhido de forma consistente com o repouso, sem tampa, fragmento, salto de junção ou canal residual visível. Demonstrar também o percurso inverso e reset |
| Identidade e conexão | Preservar `ghoul.kakuhou.rinkaku`, bindings, socket `lumbar`, transformações hierárquicas e seleção/camadas/isolar/restaurar. Apêndices e junção acompanham o socket real; declarar a apresentação substituída sem excluir nodes ou quebrar o lease/cache |

Requisitos de continuidade visual não impõem um nome de bone/morph ou uma topologia única ausente: a revisão concreta deve declarar a solução e fornecer seus seletores reais. Se pele/junção/apêndice pertencerem a objetos ou arquivos distintos, o mapa explicita quais canais os deformam juntos e impede dois controladores escrevendo no mesmo canal. Cada instância permanece independente e o ownership G2A continua obrigatório.

O artista e o revisor humano devem registrar autor, revisão/hash, materiais/fontes, poses inspecionadas, tolerâncias e ressalvas. O aceite P2 só pode ocorrer após a arte efetiva passar pelo ingresso técnico G2A, integração absoluta e revisão visual/anatômica humana. Esta especificação não inicia a produção Blender, não implementa G2B/G3B e não converte a cronologia hipotética em fisiologia canônica.

## Aprendizado funcional do checkpoint P1

A [conferência final do checkpoint](G3A_CHECKPOINT.md) encontrou e corrigiu um resíduo terminal do procedural: as bases ainda tinham footprint finito perto de `t=1` e desapareciam no cutoff. O adaptador agora recolhe extensão XY por um gate `formation²` e altura relativa por `formation`, para o contato enterrado, antes de ocultar. Os gates usam a mesma amostra absoluta; sampler, mapa temporal e seis poses de referência aprovadas permaneceram intactos. Essa fórmula aproxima o proxy e não é um requisito de implementação para um GLB futuro.

O requisito do futuro asset é o resultado observável: superfície recolhida sem salto, cap, disco ou fragmento residual, inclusive com o corpo transparente. Os testes dirigidos atuais verificaram 1–4 apêndices em foco/lateral, corpo opaco e opacidade de 20%, PNGs `.999/1` coincidentes com o repouso, zero partículas visíveis e descarte ao sair. [Evidência específica](../artifacts/gates/G3A1-review/checkpoint/README.md). Essas provas P1 não substituem repetir o envelope real e o close-up da arte Blender.

Visibilidade também precisa ser efetiva em toda a cadeia de pais: uma mesh sob grupo oculto não pode bloquear o picking anatômico por continuar localmente `visible=true`. O helper de visibilidade e os handlers atuais foram corrigidos e o clique real passou. Representações futuras devem preservar essa regra, a identidade `ghoul.kakuhou.rinkaku`, bindings/sockets, isolamento e restauração de apresentação.

O registro do checkpoint concentra os resultados da suíte final e a publicação autorizada. A confirmação do SHA remoto ocorre após commit/push, fora do texto autorreferente do próprio commit; esta atualização documental não a presume. P1 permanece aprovado com ressalvas, P2 depende da arte/revisão Blender e G4A continua somente planejado.
