# 06 — Governança de conteúdo e lore

## Problema a evitar

A anatomia humana é estudada cientificamente; a anatomia ghoul é ficcional e incompleta. Uma experiência visual detalhada facilmente transmite certeza falsa. O app deve preservar em cada item **origem, evidência, extrapolação e propósito editorial**.

## Taxonomia obrigatória

| EvidenceKind | Quando usar | Exemplo |
|---|---|---|
| `official` | site oficial, glossário publicado ou texto de fonte primária verificada | kakuhou armazena células RC, segundo Young Jump |
| `manga_needs_verification` | afirmação rastreada via secundária, ainda sem checagem do quadro original | faixa de valores RC frequentemente citada |
| `real_anatomy` | anatomia/fisiologia humana da literatura de ensino confiável | coração, capilares e retorno venoso |
| `inference` | consequência interpretativa do que a obra mostra | visualização de vias de transporte RC específicas |
| `hypothetical_model` | desenho proposto pelo projeto para demonstrar mecanismo | lóbulos no kakuhou, partículas cruzando vias esquemáticas |
| `unknown` | não estabelecido e não reconstruído | organelas exatas de uma célula RC |

Cada `Claim` deve conter id, texto, tipo, links e anotação de incerteza. Dados meramente visuais podem ter `evidenceKind=hypothetical_model` e `isLoreClaim=false`.

## Testes editoriais automáticos

- `official` => pelo menos 1 `citation` direta, título, URL, data de consulta, trecho/resumo, parte específica (capítulo/URL).
- `manga_needs_verification` => requisito `verificationTodo`; não renderizar selo `OFICIAL`.
- `inference` ou `hypothetical_model` => texto `disclaimer` público não vazio.
- `unknown` => não gerar coordenadas anatômicas 'precisas' nem números falsos.
- Nunca transformar fonte secundária em `official` sem leitura do suporte primário.
- Evitar reproduzir scans completos de páginas/licenciamento proprietário.

## Exemplo de claim confiável

```json
{
  "id": "claim.rc.kakuhou.storage",
  "text": "O kakuhou acumula células RC que participam da formação do kagune.",
  "kind": "official",
  "citations": [{
    "title": "Tokyo Ghoul — material oficial de dados",
    "url": "https://youngjump.jp/tokyoghoul/tg/data/",
    "sourceType": "publisher",
    "note": "Descrição oficial do papel das células RC e do kakuhou",
    "verifiedAt": null
  }]
}
```

`verifiedAt` pode ficar `null` até auditoria ativa do Codex. Link conhecido não significa automaticamente visita atual validada. Para `official`, deve-se preencher validação após conferência.

## Biblioteca editorial mínima

| AnatomyID | Conteúdo | Cautela |
|---|---|---|
| `human.vascular.heart` | anatomia cardiovascular real | pode ter dados anatômicos reais |
| `ghoul.rc.cell` | célula RC, identidade e atributos gerais | detalhes internos desconhecidos |
| `ghoul.rc.factor` | níveis RC e limites | faixas precisam checagem direta do material |
| `ghoul.kakuhou.rinkaku` | localização regional lombar + função | shape interno interpretativo |
| `ghoul.kagune.rinkaku` | manifestação, propriedades gerais | tempos de formação são animação |
| `ghoul.kakugan` | alteração ocular | histologia desconhecida |
| `ghoul.digestion` | alimento, água, café, rejeição | vias bioquímicas hipotéticas |

## Uso dos documentos de pesquisa

O Codex deve consolidar (sem apagar as fontes anteriores): `research/` → `docs/RESEARCH_INDEX.md` → `src/content/sources` + `src/content/claims`. Se as duas pesquisas divergirem, criar registro `conflict` e não decidir por conveniência visual.

## Perguntas de auditoria

1. Algum número que aparece no HUD pode ser interpretado como canon mas é inventado?
2. Algum órgão ghoul ganhou nome anatômico que não aparece na fonte?
3. `Kakuhou` está colocado com coordenada absoluta sem evidência? Se sim, marcar `approximate`.
4. O app representa `RC circulation` como confirmado histologicamente ou como uma visualização didática?
5. Filtros de canon mudam as legendas e fontes? São acessíveis também por teclado?

A resposta final da auditoria deve acompanhar a entrega do gate.
