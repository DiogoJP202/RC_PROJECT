# G2B — Integrar o pacote anatômico do artista (proposta)

Execute **somente G2B**, após nova autorização explícita e recebimento do pacote de arte. Leia AGENTS, README, `docs/G2A_ACCEPTANCE.md`, `docs/BLENDER_WEB_INTEGRATION.md`, IMPLEMENTATION_LOG, inventário e o estado real do Git/código. Preserve a infraestrutura e os testes G1/G2A; não reinicialize o observatório.

1. Inventarie os arquivos realmente entregues pelo artista: `.blend`, GLB, materiais/mapas, licença/atribuição/versão/hash, manifesto e validações. Não presuma nomes ou disponibilidade. Se faltar o arquivo/licença, registre blocker e mantenha o proxy.
2. Revise a geometria com o artista/revisor: proporções, frente/posterior, unidades/eixos, origem/pivô, topologia/normais, UV/PBR e subestruturas. Região do kakuhou é aproximada; a forma interna continua reconstrução conceitual.
3. Acrescente entradas de assets aprovadas, representação e bindings explícitos por `extras.atlasId`, bounds/anchors/sockets e recursos necessários. Mantenha os seis IDs anatômicos e a interface atual. Não copie o pacote inteiro para public; coloque somente recursos autorizados de runtime.
4. Teste skin/bones/inverse bind/pesos, clips/morphs e extremos realmente fornecidos. Se o export usar sparse, decoder, extensão ou outro recurso hoje bloqueado, homologue a necessidade com regressões e revisão de custo; não desative a validação para obter sucesso.
5. Integre progressivamente por lease/AssetSlot, com seleção/raycast, foco/órbita/zoom/reset, camadas/opacidade/isolar, evidências, mobile/gaveta, teclado/reduced motion e fallback/retry preservados.
6. Execute os checks existentes completos, acrescente testes relevantes dos arquivos reais, veja capturas desktop/mobile/silhueta/poses e meça produção no protocolo documentado. Registre custo de payload, draws/triângulos/texturas e memória observável; não extrapole emulação para celular físico.

Entregue inventário dos arquivos lidos/adquiridos, registro de proveniência, mapa semântico/espacial, comparativo visual proxy→asset, resultados reais, limitações e classificação P0/P1/P2 por sistema. P2 só após revisão artística/anatômica explícita. Não implemente manifestação rinkaku G3, RC/microcirculação ou novas afirmações canônicas sem fonte. **Pare após G2B.**
