# G4A — revisão crítica do protótipo vascular P1

25/10/2026. Avaliação da implementação local sobre o checkpoint G3A aprovado. Aprovação artística humana continua pendente; este relatório distingue funcionamento comprovado de qualidade visual e anatomia final. [Índice](INDEX.md), [metadados](captures.json), [aceite técnico](../../../docs/G4A_ACCEPTANCE.md).

## O que foi inspecionado

As sete capturas exigidas, oito poses sequenciais de tracking e as vistas mobile de controles/evidências são registros reais do renderer. O filme mostra reprodução contínua do transporte com uma identidade RC selecionada; nenhum render externo, imagem generativa ou figura de referência substitui a aplicação. Tempos, perfil, seed, câmera e hashes estão nos metadados. Os frames extraídos do filme complementam essa inspeção, sem interpolação.

## Materiais e iluminação

Hemácias usam PBR opaco, cor carmim e roughness0,59; RC usam superfície verde pálida lobulada e roughness0,72. A seleção dourada e o destaque que dessatura as hemácias são recursos de UI, sem fluorescência biológica. A diferença de silhueta permanece sem destaque. Nas capturas selecionadas, o dourado reduz a leitura do centro bicôncavo e dos lóbulos em algumas poses; o relevo fica mais claro nas células próximas sem seleção. Não há emissão luminosa nas células, transparência, sombras por célula ou pós-processamento.

Parede interna BackSide, cor#6c3742, roughness0,88 e bumpScale0,07, com textura de relevo128×128 gerada pelo próprio código. O relevo não pretende reproduzir endotélio histológico. Luz ambiente0,4, hemisférica0,65 e duas luzes pontuais de intensidade7/4 acompanham a observação; exposição1,05. A luz não tem unidade clínica. Fog e perspectiva ajudam a separar primeiro plano e profundidade. Persistem reflexos locais muito claros, superfície da parede simplificada e leitura pouco detalhada em algumas regiões; não é uma entrega fotográfica ou anatômica P2.

## Geometria e movimento

A hemácia tem volume discoide, centro mais fino e borda mais espessa. Os24lados e as normais do centro corrigem o primeiro polo facetado, mas o contorno continua perceptivelmente procedural em close. As RC têm três lóbulos e variação moderada de superfície; não possuem organelas representadas. Elas não são anatomia oficial.

O circuito fecha posição, tangente e referencial de orientação. A população apenas ativa um prefixo de entidades estáveis; não redistribui as trajetórias existentes por i/n. Movimento, orientação e variação radial derivam do tempo absoluto e da identidade/seed. O acompanhamento move somente a câmera. Sua transferência usa o arco do vaso e offsets conservadores, sem chord atravessando o centro vazio do circuito.

As células são contidas pelo bound de todo o volume, considerando escala/orientação e raio mínimo da parede. Testes também verificam os vértices transformados da maior população. Isso não implementa colisão entre células: sobreposições e oclusões mútuas permanecem, sobretudo em2000objetos. Uma célula selecionada pode ficar parcialmente encoberta por outra; sua identidade/evidência continuam preservadas.

## Interação e mobile

Seleção por clique e HTML, tracking/unfollow, pausa/scrub/reset/passos, velocidade normalizada e perfil compartilham comandos discretos. A seleção ausente é explícita. Esc sai de tracking antes de voltar ao corpo. A recuperação WebGL conserva contexto e conteúdo; o fallback continua selecionável sem exigir 3D.

No mobile390×844, o visor e a timeline aparecem antes dos controles mais extensos; informações adicionais exigem rolagem vertical. Não houve overflow horizontal. O aviso de modelo conceitual inicialmente herdava posicionamento G2A e saía do visor: foi corrigido e ganhou teste de bounds. Alvos de toque são de pelo menos44px nos controles testados. Oclusão e proximidade das células reduzem a leitura de algumas poses em largura estreita; reenquadramento, seleção HTML e destaque ajudam, mas não substituem avaliação em telefone físico.

## Correções feitas durante a revisão

- Saturação generalizada do primeiro passe: luz/exposição reduzidas e posicionamento de luz revisto.
- Células iniciais excessivamente grandes: escala artística reduzida e câmera reposicionada; perfis permanecem quantidades de renderização.
- Visor colapsado em largura intermediária: corrigida a distribuição de colunas.
- Slider atrasado após passo: comandos pausados atualizam o controle imediatamente.
- Picking através de parede opaca: a parede bloqueia a seleção de células ocultas.
- Transferência de tracking pelo centro do circuito: substituída por transporte periódico da câmera.
- Aviso mobile recortado: removido o posicionamento absoluto herdado na microcena.
- Liberação de Flow/Tracking: conserva a pose real ao entrar em Livre; a composição inicial fica reservada à montagem e ao reenquadramento explícito.
- Movimento residual dos controles: damping restrito à exploração livre sem reduced motion, com atualização ao mudar a política.

Os dois últimos ajustes pertencem ao fechamento funcional. Seus resultados de regressão são registrados no aceite; o filme e as imagens conservam os metadados da captura e não devem ser tratados como uma nova execução dessas correções.

## Alcance das métricas

Os perfis de produção de 100, 500 e 2000 objetos estão em `artifacts/g4a/production-{100,500,2000}.json`. A entrada medida por `readyMs` ocorre sempre com o perfil padrão 500; a população solicitada é selecionada antes do aquecimento e dos 30 s de amostragem. Esses tempos de entrada não comparam inicialização direta das três populações.

Três draws, três geometrias e duas texturas são contadores do renderer Micro. O adaptador possui uma textura de relevo 128×128; duas texturas observadas no renderer não significam duas texturas criadas pelo adaptador. O Body permanece montado e residente, com render suspenso, e não está somado nesses contadores. rAF, heap JavaScript e inventários de recursos não são uma medição de tempo GPU ou VRAM. Os números se limitam ao hardware e protocolo declarados nos JSONs.

## Limitações e próxima revisão

O resultado demonstra infraestrutura e UX P1, com formas legíveis e transporte reproduzível. A naturalidade/art direction final continua sujeita à revisão do usuário. A representação ainda tem caráter esquemático: facetas, reflexos pontuais claros, parede pouco detalhada e ausência de deformação/colisão celular. Não há ramificação, rede corporal completa, CFD, escala RC calibrada ou metabolismo compartilhado com Rinkaku.

Antes de P2, os assets precisam de autoria/licença, topologia/normais/materiais próprios, envelope de contenção e correspondência ao percurso, além de revisão humana no renderer web. Uma eventual G4A.1 deve responder aos achados concretos dessa revisão; G4B exige novo escopo e evidência para qualquer detalhe interno, sem inventar histologia RC. Nenhuma dessas fases foi implementada aqui.

## Inventário funcional

| Arquivo ou grupo | Responsabilidade |
|---|---|
| `src/simulation/vascular.ts` | Identidades, configuração e sampler absoluto periódico |
| `src/state/vascular.ts` | Relógio, comandos, perfis e seleção semântica |
| `src/scene/vascular/ProceduralVascularAdapter.ts` | Vaso, RBC/RC, instancing, materiais, bump e ownership |
| `src/scene/vascular/camera.ts` | Tracking/Flow pelo arco e limites da câmera livre |
| `src/scene/vascular/VascularScene.tsx` | Canvas, buffers por frame, picking, métricas e falha WebGL |
| `src/scene/vascular/lifecycle.ts` | Contadores observáveis de criação/descarte, sem guardar recursos |
| `src/scene/bodyContext.ts` | Captura/restauração do contexto e câmera real Body |
| `src/scene/ObservatoryScene.tsx` | Marcador regional, aproximação e suspensão do render Body |
| `src/app/App.tsx` | Navegação contextual, lazy, Esc e retorno |
| `src/ui/VascularWorkspace.tsx`, `vascular.css` | Controles, inspector, timeline e layout responsivo |
| `src/content/vascularEvidence.ts` | Claims/fontes tipados e validados por afirmação |
| Seis novos arquivos `*.test.ts` | Determinismo, IDs, volume, câmera, contexto, ownership e editorial |
| `tests/e2e/vascular.spec.ts` | Fluxos reais, dez transições, tracking, GLB, teclado/toque/falhas |
| `tests/e2e/g4a-production-profile.js` | Medições independentes por população |
| `capture.mjs` | Capturas/filme reais e metadados reproduzíveis |
| Quatro documentos `docs/G4A_*` | Arquitetura, modelo/fontes, aceite e ingresso Blender futuro |

Resultados quantitativos finais, comandos e histórico das correções de testes ficam no aceite/log. Este parecer não transforma percentis FPS ou testes verdes em aprovação artística.
