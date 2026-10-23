# Catálogo de runtime G1 — migração explícita v1 → v2

`contracts/seed-catalog.json` permanece intacto como exemplo legado e evidência da auditoria G0. O antigo sucesso no validador mínimo não significava fontes conferidas ou modelos existentes. O gate novo **deve rejeitá-lo**: versão 1, citações sem data/locator, assets GLB sem arquivos e campos de apresentação ausentes. Não mudar apenas o número de versão para fazê-lo passar.

A origem de conteúdo publicada é `public/catalog.json`, carregada por `src/content/catalog.ts` via `fetch` assíncrono; não há catálogo alternativo inline. O contrato adaptado é `contracts/atlas-schema.ts` v2. A organização pública em arrays mantém as relações originais: `citations`, `claims`, `anatomy`, `assets` e `cameraBookmarks`. O loader traduz `anatomy` em `structures` para a UI, sem duplicar a autoria dos dados.

Mudanças de contrato:

- Claims agora têm `confidence` e `scope`; confiança descreve suporte da frase, sem autenticar a malha. `official` exige ao menos uma citação direta elegível com título, URL, data ISO, locator e nota de conferência. `real_anatomy` exige literatura didática humana conferida. Hipótese/inferência exigem disclaimer; mangá pendente exige ação de verificação.
- Anatomia tem função, descrição, layer e disclosure do modelo independentes do EvidenceKind. IDs/campos/enums, referências, parents/ciclos, cameras e limites numéricos são validados antes de uso.
- `procedural` é um kind explícito: `sourcePath` aponta para código existente e `manifestPath` aponta para seu manifesto. O Python confirma existência e relação de nodes; testes da cena verificam geometrias/nodes gerados. Não há GLB fictício. Arquivos GLB futuros precisam existir, ter cabeçalho glTF 2 válido e nodes declarados presentes no chunk JSON.
- Asset disponível requer autoria identificada, licença/autorização e atribuição; terceiro exige origem HTTP(S). Disponibilidade técnica `proxy` não equivale a fidelidade anatômica nem à liberação de uma licença pública definitiva do projeto.

Os cinco IDs de Claim do seed foram preservados. Afirmações de kagune, sangue e organelas aparecem como contexto textual no kakuhou/tórax, pois seus nós originais não integram a cena G1. Seus `relatedAnatomyIds` foram migrados para esses contextos, sem prometer render de kagune, vaso ou célula. Novas claims humanas se limitam a funções gerais. Não há valores RC, histologia ghoul ou dimensões RC canônicas inventadas.

Datas/locators Young Jump e OpenStax 18.1/20.5/22.1 aproveitam **apenas a conferência textual G0** descrita em `CONTENT_AUDIT`; nenhuma data foi atribuída a painel não lido. As seções OpenStax 4.1/5.1/7.1 foram abertas no G1 em 23/10/2026 para suporte factual humano mínimo. Somente resumos autorais curtos e links entram no runtime; nenhuma imagem, scan, mesh ou texto extenso das fontes é distribuído. As regras de licença vigentes dessas fontes não concedem licença aos modelos autorais do projeto nem são substituídas por esta migração.

Verificação reproduzível (usar Python instalado, ou o runtime Python informado no log):

```powershell
python tools/validate_catalog.py public/catalog.json
python -m unittest discover -s tools -p test_validate_catalog.py -v
npm test -- src/content/catalog.test.ts
python tools/validate_catalog.py contracts/seed-catalog.json # rejeição esperada, exit 1
```

Os onze falsos positivos ADR-012 possuem regressões negativas independentes em `tools/test_validate_catalog.py`; testes Vitest exercitam também a fronteira de JSON/fetch, falhas HTTP, abort, integridade do manifesto e separação evidência/modelo. A inspeção de arquivo real é responsabilidade do gate Python; o navegador confere o manifesto compilado e não tenta ler o filesystem do usuário. Carregar GLB futuro passa pelo gate Python e pela importação/testes da cena antes de liberar novos nodes no runtime.
