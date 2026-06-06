# Auditoria global do tema claro - 2026-06-06

## Escopo e limites

Auditoria visual e estrutural do tema claro no ERP, PWA, APK e Loja Online.
Nenhuma regra comercial, permissao, calculo, rota, autenticacao, banco ou
backend foi alterado.

## Achados da Etapa A

- O tema claro ja possuia correcoes locais, mas a paleta estava repetida em
  blocos diferentes e ainda usava teal forte em alguns componentes.
- A Loja Online ja tinha autoridade de tema no runtime, mas ainda restavam
  seletores CSS `body.theme-light .store-*`, permitindo vazamento visual do ERP.
- Os cards claros de planos no Design System V2 ainda continham gradientes.
- A maioria dos gradientes antigos pertence ao tema escuro, graficos funcionais
  ou estilos legados anteriores. Eles nao foram removidos indiscriminadamente.

## Classificacao dos gradientes restantes

- **Tema escuro:** preservados, pois esta etapa nao pode alterar o tema escuro.
- **Graficos funcionais:** `conic-gradient` de donuts/pizzas preservados porque
  representam dados, nao decoracao.
- **Emails Supabase:** preservados por estarem fora da interface Web/PWA/APK e
  fora do escopo autorizado de backend.
- **Tema claro ativo:** superficies comuns, navegacao, planos, loja, modais,
  cards e paineis recebem uma autoridade final solida, sem gradiente visivel.
- **Legado nao dominante:** mantido quando uma remocao direta poderia afetar o
  tema escuro; a camada clara final neutraliza sua exibicao no tema claro.

## Correcoes aplicadas

- Tokens claros consolidados com fundo suave, superficies moderadas, teal
  acinzentado e laranja preservado.
- Cards claros de planos convertidos para cores solidas.
- Seletores da loja deixaram de depender de `body.theme-light`.
- Superficies compartilhadas claras neutralizam gradiente, glow, filtro e blur.
- Imagens reais de banner da loja preservam cor, opacidade e nitidez.
- Menus claros usam destaque teal suave sem deslocar o layout.
- Areas de toque mantem minimo de 44px em dispositivos touch.
- Suporte a `prefers-reduced-motion` adicionado.

## Gradientes preservados por motivo tecnico

- Graficos de pizza/donut gerados por dados.
- Swatch visual de material transparente.
- Tema escuro.
- Templates de email Supabase.

## Validacao

O teste `test:light-theme-no-gradient` verifica:

- tokens suaves obrigatorios;
- ausencia de seletores da loja controlados pelo tema do ERP;
- ausencia de gradientes nos planos claros;
- camada final sem gradientes e suporte a movimento reduzido.

