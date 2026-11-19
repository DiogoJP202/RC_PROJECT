# 04 — Wireframes e comportamento responsivo

## A. Landing desktop (informação editorial vs navegação técnica)
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ GHOUL ATLAS                          ATLAS       ESTUDOS       FONTES          AJUDA      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ARQUIVO ANATÔMICO / ESTUDO INDEPENDENTE          [CENA 3D DO ESPÉCIME EM DESTAQUE]     │
│  Atlas anatômico ghoul                                                               │
│  Modelos 3D interativos de células RC,                                              │
│  kakuhou e kagune.                                                                  │
│  [ ABRIR OBSERVATÓRIO ]    [ VER ESTUDOS ]                                             │
│  Modelo conceitual · referências auditáveis                                           │
│                                                                                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [01 ANATOMIA]        [02 RINKAKU]          [03 CIRCULAÇÃO RC]                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
Nunca mostrar cena falsa como se fosse modelo final. Poster GLB/proxy pode aparecer com selo discreto.

## B. Workspace desktop no estado de repouso
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ GHOUL ATLAS       Atlas / Corpo / Espécime 001             [ESTUDOS] [FONTES] [?]      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [≡ Estruturas]                                                                   [i]   │
│                                                                                        │
│                     [CENA 3D QUE DOMINA O VIEWPORT]                                   │
│                                                                                        │
│   ┌──── Seleção contextual ─────┐                        [frente] [trás] [camadas]     │
│   │ Kakuhou · região lombar     │                                                     │
│   │ [Inspecionar] [Simular]     │                                    [Ficha ▸]         │
│   └─────────────────────────────┘                                                     │
│                                                 MODELO CONCEITUAL                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
Inspector abre drawer, preservando câmera/seleção. Drawer esquerdo controla índice e camadas. Em simulação, transporte aparece em dock curto e contextual.

## C. Workspace com inspector
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER 64                                                                            │
├─────────────── PALCO 3D DOMINANTE ──────────────────────────────┬──────────────────────┤
│ [≡]                        ESTRUTURA EM FOCO                   │ KAKUHOU              │
│                                                               │ Região lombar · RC    │
│                 [3D]                                          │ Função / localização  │
│                                                               │ [Anatomia] [Fontes]  │
│                                                               │ Status do modelo      │
│  [vistas] [camadas] [transparência]                             │ [Fechar]              │
├────────── TIMELINE SÓ EM SIMULAÇÃO ─────────────────────────────┴──────────────────────┤
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## D. Micro
Ao entrar, a viewport conserva mesmo shell de navegação, mas muda stage, não identidade gráfica. Toolbar: `Células` `Fluxo` `Seguir` `RC destacadas` `Voltar ao Corpo`. Selection abre ficha compacta. `Seguir` só habilitado quando há entidade elegível. Timeline minimal contextual, não rodapé de largura infinita sem razão.

## E. Mobile 390×844
Header simples 56px → palco entre 55–65vh, sem título sobreposto → toolbar flutuante contextual → bottom sheet `Estruturas / Inspeção / Fontes` com alturas snap definidas → transporte compacto visível apenas quando relevante. Nunca empilhar permanentemente painel esquerdo, painel direito e timeline, na ordem desktop.

## F. Estados vazios
`Comparar` não aparece como principal antes de G6; se URL antiga for aberta, página honesta com `Comparação em desenvolvimento` e rota `Voltar ao atlas`. G4B só anunciado como disponível após contrato/testes de release; se estiver em construção, marcar `Em desenvolvimento` nas vitrines.

## G. Acessibilidade
Sem navegação exclusivamente 3D: lista semântica, foco, teclado, Esc contextual, texto alternativo, reduced motion e conteúdo factual fora do canvas. Não remover selos/avisos do modelo ao usar canon filter.
