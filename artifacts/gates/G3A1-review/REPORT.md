# G3A.1 — Parecer crítico do refinamento

24/10/2026, America/Sao_Paulo. Implementação local; aprovação artística final reservada ao usuário. Sem commit, push, deploy, G2B, G3B ou G4. Todas as imagens e o filme deste pacote provêm da aplicação real; os painéis apenas recortam, redimensionam e legendam essas fontes.

Fechamento do pacote em 25/10/2026; testes e benchmarks de 24/10 foram preservados com seus horários originais.

## O que mudou e como julgar

| Área | Resultado implementado | Limite da leitura visual |
|---|---|---|
| Implantação lombar | Removido o overlay separado. A apresentação antiga do órgão é temporariamente substituída, conservando o anchor/socket. Cada superfície incorpora perímetro enterrado, relevo, colo estreito e tecido distal; distribuição própria para 1–4 apêndices | Há continuidade dentro da superfície do apêndice, mas a pele corporal continua outra mesh. A aproximação não produz uma união topológica nem contato perfeito com qualquer GLB |
| Ativação | Elevação localizada na pele antes do alongamento; permanece pequena e progressiva | No enquadramento de corpo inteiro, a alteração é discreta. O foco lombar é a melhor vista para comparar com repouso |
| Liberação | Brotos alongados emergem antes do crescimento longo, com extrusão temporária que se acomoda à forma madura | As quatro implantações continuam uma escolha gráfica organizada, não anatomia confirmada |
| Crescimento | A fronteira afina enquanto comprimento, seção e curvas se desdobram; as curvas possuem profundidade | A composição ainda lembra um X em vista posterior; pode haver oclusão entre apêndices por perspectiva |
| Fixação | Cordões e pregas ganham relevo; a tensão das curvas aumenta e o movimento secundário diminui gradualmente | A distinção entre fixação final e ativo é sutil no corpo inteiro. Não foi introduzida uma troca abrupta de silhueta para forçar essa distinção |
| Ativo | Mantém a forma madura, com assimetria e movimento secundário reproduzível | Acabamento procedural e seção radial podem revelar facetas no close-up. Não é tecido anatômico de alta fidelidade |
| Retração | Cadência nominal de 3,4 s, redução progressiva até repouso, pelo mesmo sampler absoluto | No fim, a geometria colapsa e desaparece; não existe solver de absorção/pele. Frames muito lentos podem alongar o tempo de parede |
| Mobile | Câmera fixa mais próxima e visor redistribuído em 390×844 e 430×932; controles continuam acessíveis | Melhor aproveitamento não equivale a certificação de ergonomia ou GPU de telefone físico; o foco lombar ainda ajuda na análise fina |

## Correções resultantes da inspeção

A primeira rodada de imagens revelou pés de implantação salientes e claros demais, semelhantes a encaixes. O segundo passe reduziu o levantamento maduro de aproximadamente `.086` para `.031` unidades, antecipou o gradiente do tecido no colo e preservou uma extrusão temporária na liberação. As pregas/cordões foram reforçadas sem engrossar o pescoço. Não se acrescentou emissão luminosa para esconder a junção.

O filtro de evidências passou a desaturar apenas a parcela de tecido hipotético, preservando a cor da borda cutânea. A auditoria também levou à proteção do picking quando o grupo está oculto por isolamento e à união dos bounds reais do corpo GLB no enquadramento da manifestação. Bindings, lease/cache e sockets não foram substituídos por heurísticas de nomes.

## Material e iluminação

Material físico branco com vertex colors: borda cutânea `#899593`, tecido `#89273b`, variação determinística e escurecimento de sulcos. Rugosidade varia de `.78` a `.69`, clearcoat de `.025` a `.065`, metalness `.005`, specularIntensity `.36`, emissive zero. Cordões, pregas, seções assimétricas e curvatura pertencem à geometria; não dependem somente de cor. O resultado é mais fosco, embora ainda possa lembrar borracha esculpida em alguns ângulos.

A luz ambiente, hemisférica, direcional principal/lateral e a luz lombar preexistente do observatório foram preservadas. A esfera e a luz adicional do overlay G3A foram removidas. Sombras do observatório continuam visíveis no piso; não foi implementada uma simulação de transmissão/subsuperfície nem declarada sombra completa de tecido novo.

## Continuidade, reversibilidade e limites espaciais

O transporte `elapsedSeconds` é separado de `t`/sampler: total nominal de 21 s, retração de 3,4 s; a densidade de tempo passa suavemente de 18 a 68 em `.93..95`. A pose e `motionTime` continuam funções absolutas de `t` e seed com a referência artística original de 18 s. Avançar, retroceder, pausar e fazer scrub não acumulam uma segunda história de deformação.

[Diagnóstico offline](geometry-review.json): 804 poses, 201 por quantidade, raízes sem deriva, atributos finitos, buffers/UUIDs estáveis e revisita byte a byte idêntica. Maior deslocamento de vértice nas fronteiras `±1e-6`: aproximadamente `1,97e-6` unidades. Com quatro apêndices, separação conservadora dos footprints em XY de `.01308` e dos pescoços de `.02945` unidades. Esses números avaliam o layout local, não a distância mínima global entre superfícies nem colisão contra o corpo.

Em `t=1`, a superfície recolhida é idêntica a `t=0`. Matrizes de partículas inativas diferem entre esses dois tempos porque `motionTime` difere; ambas as poses têm zero partículas e grupo oculto. Normais da ponta degenerada podem variar no último limite já oculto. A repetição do **mesmo** `t` continua idêntica, inclusive partículas.

## Evidência e medição

O [índice](INDEX.md) reúne comparativos com câmera/configuração/timeline iguais no desktop, sete fases, oito frames, detalhes de implantação, sequências, vistas, mobile e filme real. Mobile antes/depois declara sua alteração intencional de câmera/layout. Proveniência, recortes e hashes ficam em [compositions.json](compositions.json); o build anterior congelado é a fonte das novas capturas móveis de referência.

Resultados finais das suítes e perfis estão em [G3A1_REFINEMENT](../../../docs/G3A1_REFINEMENT.md) e [artifacts/g3a1](../../g3a1/). Contadores do renderer não medem VRAM; percentis rAF não são tempos de GPU. A residência nas fases mudou entre o ciclo antigo de 18 s e o novo de 21 s; esse workload não é idêntico mesmo quando hardware/rede/viewport são iguais.

## Pendências preservadas

O contato ainda é uma aproximação artística ao proxy, sem solver de pele/colisão; o asset GLB futuro precisa de geometria/paleta/envelope próprios. Materiais, facetas e organização em X podem exigir direção artística adicional após a revisão humana. O resultado permanece **PROXY / CONCEPTUAL MODEL / hypothetical_model**, sem novas afirmações canônicas ou fisiologia quantitativa RC.

No ambiente de desenvolvimento, alterações por Fast Refresh que recriam recursos de `RinkakuScene` exigem recarregamento completo: uma rodada de captura dev foi invalidada por edição simultânea do componente. A evidência final usa build de produção imóvel. Essa limitação de HMR não afeta scrub normal ou troca de configuração no build final e não deve ser confundida com sua validação.

Node/Python ainda utilizam os runtimes já documentados no checkpoint; não houve instalação global/dependência nova. A configuração independente reproduzível e o teste em aparelho físico continuam pendentes. Aprovação artística final, assets definitivos e fases posteriores permanecem fora desta conclusão técnica.
