# Padrao de botoes, cards, fontes e scroll do Simplifica 3D

Este documento complementa `docs/icon-system-registry.md`. Toda tela, card ou botao novo deve seguir estes contratos antes de criar CSS proprio.

## Cor principal e contraste

- Tema claro: teal `#0f8f88`, com estados mais escuros para hover e clique.
- Tema escuro: teal moderado `#2faaa3`, sem brilho ou efeito neon.
- Botoes primarios usam fundo teal escuro e texto branco.
- Cards de planos usam superficie neutra; a cor do plano aparece apenas como identificacao e borda discreta.
- Texto secundario nunca deve depender de baixa opacidade para manter contraste.

## Principios

- Usar componentes e classes existentes antes de criar uma nova variante.
- Usar tokens de tema, espaco, fonte, radius e sombra.
- Nao usar emoji como icone de interface nova.
- Nao usar SVG solto sem token em `renderUiIcon`.
- Nao usar fonte fluida baseada em viewport.
- Nao criar cards dentro de cards.
- Nao criar `overflow:hidden` em tela inteira sem declarar onde o scroll vai acontecer.

## Largura e rolagem

- `#app-content` e o unico proprietario da rolagem vertical das paginas do ERP.
- Templates usam `data-ui-scroll-scope="page"`; paginas e secoes nao criam uma segunda barra vertical.
- Conteudo usa `width: 100%`, `max-width: 100%`, `min-width: 0` e `box-sizing: border-box`.
- Grids sempre usam colunas `minmax(0, 1fr)` para texto ou cards nao ampliarem a tela.
- Carrosseis e tabelas podem usar rolagem horizontal local, mas nunca `width: 100vw`.
- Modais, menus e listas internas extensas podem ter scroll proprio porque nao sao paginas.

## Botoes

Classes base:

| Uso | Classe |
| --- | --- |
| Acao principal | `.btn` ou `.app-button` com variante primaria |
| Acao secundaria | `.btn.secondary` |
| Acao discreta | `.btn.ghost` |
| Acao destrutiva | `.btn.danger` |
| Botao so de icone | `.icon-button` |

Tamanhos:

| Contexto | `data-ui-size` | Desktop | Mobile | Icone |
| --- | --- | --- | --- | --- |
| Compacto | `compact` | `36px` | `34px` | `16px` a `18px` |
| Padrao | `standard` | `40px` | `40px` | `18px` |
| Destaque | `large` | `44px` | `44px` | `18px` a `20px` |
| Somente icone | `standard` | `40px` | `40px` | `20px` |

Uso obrigatorio em componente novo:

```html
<button class="btn s3d-button" data-ui-size="standard">Salvar</button>
```

Em JavaScript, preferir `renderAppButton({ size: "standard" })`. O registro oficial fica em `UI_COMPONENT_SIZE_RELATIONS`.

Regras:

- Botao com texto deve usar icone de `18px`.
- Botao so de icone deve usar icone de `20px`.
- Texto de botao deve usar `var(--font-sm)` ou `var(--font-md)`.
- Nao usar icone maior que `22px` dentro de botao.
- Botao deve ter `min-width:0` quando estiver dentro de grid/flex.
- Se o texto nao couber, quebrar linha ou truncar de forma intencional, nunca estourar o container.

## Cards

Classes base:

| Uso | Classe recomendada |
| --- | --- |
| Card comum | `.card` |
| Card de KPI | `.kpi-card` / `.reports-kpi-card` |
| Linha clicavel | `.history-item`, `.list-row`, `.profile-list-row` |
| Card de acao | `.quick-action`, `.action-tile` |

Tamanhos:

| Contexto | `data-ui-size` | Altura desktop/mobile | Padding desktop/mobile |
| --- | --- | --- | --- |
| Compacto / linha | `compact` | `56px / 52px` | `8px / 7px` |
| Padrao | `standard` | `72px / 64px` | `12px / 10px` |
| Destaque | `large` | `96px / 84px` | `16px / 12px` |

Uso obrigatorio em card novo:

```html
<article class="card s3d-card" data-ui-size="standard">...</article>
```

Cards com conteudo dinamico usam `min-height`, nunca `height` fixa. Excecao: atalhos/KPIs de formato fechado e testado.

Regras:

- Card nao deve criar scroll horizontal.
- Card clicavel deve ter `cursor:pointer`, foco visivel e estado `active` discreto.
- Card de tela inteira deve ser a tela, nao um card dentro de outro card.
- Se o card precisar conter lista longa, a lista deve ter wrapper proprio com `overflow-y:auto`.
- Evitar `overflow:hidden` em cards que contem dropdown, accordion, lista longa ou formulario.

## Tipografia

Escala oficial:

| Token | Uso |
| --- | --- |
| `--font-xs` | metadados, badges, legendas curtas |
| `--font-sm` | botoes, labels, textos auxiliares |
| `--font-md` | corpo, campos, linhas de lista |
| `--font-lg` | subtitulos compactos |
| `--font-xl` | titulos de painel |
| `--font-2xl` | titulos de tela |
| `--font-3xl` | destaques raros de dashboard |

Regras:

- Nao usar `vw` para fonte.
- Nao usar letter-spacing negativo.
- Titulo dentro de card deve ser menor que titulo de pagina.
- Numeros grandes em KPI podem usar `--font-2xl`, mas devem caber no card.
- Textos dinamicos devem usar `min-width:0`, `overflow-wrap:anywhere` quando houver risco de e-mail, URL ou nome longo.

## Icones

Fonte oficial: `docs/icon-system-registry.md`.

Tamanhos padrao:

| Contexto | Tamanho |
| --- | --- |
| Botao com texto | `18px` |
| Botao so de icone | `20px` |
| Icone de card/lista | `20px` a `22px` |
| Icone decorativo grande de hero ou empty state | maximo `34px`, somente quando a tela pede destaque |

Regras:

- Todo icone novo deve ter token documentado.
- Se uma area ou funcao nao tiver token, criar um SVG no mesmo estilo Lucide e adicionar no registro.
- Evitar usar o mesmo token para duas funcoes visiveis lado a lado.
- Reuso e permitido quando as telas nao aparecem juntas ou representam exatamente o mesmo conceito.

## Scroll

Contrato:

- O scroll principal do app fica em `#app-content`, `.app-content-shell` ou `.mobile-panel-content`.
- No shell atual do ERP, `#app-content` e o proprietario unico do scroll vertical. `.mobile-panel-content` participa do fluxo e nao cria uma segunda barra.
- Telas internas usam `overflow-y:visible`, exceto listas longas declaradas.
- Uma tela interna nao pode combinar `overflow-x:hidden` com `overflow-y:visible`; essa combinacao vira `overflow-y:auto` e pode capturar a roda do mouse. Use `overflow-x:clip`.
- Listas longas usam wrapper proprio com `overflow-y:auto` e `scroll-padding-bottom`.
- No mobile, sempre manter `-webkit-overflow-scrolling:touch`.
- Nao usar `touch-action:none` em tela ou card; reservar para gesto especifico.
- O mesmo container deve responder a roda do mouse, touchpad e toque. Nao considerar o teste concluido apenas porque a barra lateral pode ser arrastada.

Checklist para nova tela:

1. Conteudo maior que a viewport rola no mobile?
2. Conteudo maior que a viewport rola no desktop?
3. Bottom nav nao cobre o ultimo botao?
4. Nenhum container pai usa `overflow:hidden` bloqueando dropdown/lista?
5. Nao existe scroll horizontal acidental?

## Referencia de densidade

A Home e a tela piloto para densidade e distribuicao responsiva do ERP.

| Elemento desktop | Padrao inicial |
| --- | --- |
| KPI | `min-height: 104px`, padding `12px 14px` |
| Painel analitico/grafico | `min-height: 340px`, altura automatica |
| Lista ou painel simples | altura pelo conteudo, sem espaco vazio artificial |
| Painel secundario | `min-height: 190px`, altura automatica |
| Conteudo da pagina | maximo `1440px`, centralizado |

Essas medidas sao referencias, nao alturas fixas. Conteudo dinamico pode crescer. Nova variante deve usar os tokens oficiais e ser registrada antes de receber CSS local.

## Antes de finalizar tela nova

1. Conferir icone no registro.
2. Conferir variante de botao.
3. Conferir altura e tamanho do SVG.
4. Conferir fonte pelos tokens.
5. Conferir scroll no desktop e mobile.
6. Rodar `node --check app.js`, `npm run build:web` e teste visual relacionado.
7. Confirmar os tamanhos pelo `data-ui-size`; nao criar altura local sem registrar uma nova variante.

## Checklist UX de referencia

As referencias recebidas em `Camera.rar` foram consolidadas em `docs/ux-reference-checklist-camera.md`.

Use esse checklist junto deste contrato quando criar ou ajustar:

- login, cadastro, perfil e seguranca;
- formularios de pedido, estoque, caixa e producao;
- filtros, busca, selects e campos com mascara;
- cards clicaveis, atalhos e FABs;
- modais, bottom sheets, estados vazios, erros e loading.

Regras incorporadas ao padrao:

- formulario deve usar campos em caixas visiveis;
- placeholder deve orientar o dado esperado;
- erro deve aparecer perto do campo afetado;
- CTA principal deve se destacar e ficar facil de tocar;
- escolhas simples usam radio; multiplas escolhas usam checkbox;
- loading estruturado deve preferir skeleton;
- texto longo deve alinhar a esquerda;
- elementos relacionados devem ficar agrupados;
- evitar preto puro, branco puro e saturacao forte em superficies grandes;
- item clicavel precisa parecer clicavel e ter area de toque confortavel.
