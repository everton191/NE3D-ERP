# Conflitos de CSS legado

## Ordem real de carregamento

1. `style.css`
2. `themes/base/design-system-v2.css`
3. `src/storefront/styles/tokens.css`
4. `src/storefront/styles/components.css`
5. `src/storefront/styles/layouts.css`
6. `src/styles/google-expressive-motion.css`

Contratos em `components/**` e `modules/**` não aparecem como `<link>` em `index.html`; são documentação/ativos não globais salvo cópia/importação indireta. Tokens de tema separados descritos em documentos não são todos carregados diretamente.

## Principais anuladores

| Fonte | Por que conflita |
|---|---|
| `style.css` | arquivo monolítico com dezenas de milhares de linhas, múltiplas gerações de regras e blocos tardios |
| regras por `data-ui-profile` | mudam largura, scroll, modal e densidade depois da base |
| `.mobile-mode` + `.viewport-*` | sinais paralelos para o mesmo breakpoint/comportamento |
| media queries tardias | repetem seletores em muitos breakpoints não padronizados |
| `!important` | impede que a fundação de baixa especificidade prevaleça |
| estilos inline gerados por `app.js` | superam folhas externas para propriedades normais |
| storefront/editor | corretamente isolados por prefixos em boa parte, mas mantêm escala própria de viewport/z-index |

## Conflitos confirmados de conceito

- `max-width:none` compete com limites `--layout-shell-max`/`--desktop-content-max`.
- `#app-content` recebe regras em blocos distantes e por viewport/perfil.
- `.mobile-bottom-nav` é declarada em vários blocos, inclusive teclado, tema e perfil.
- `.modal-backdrop/.popup` recebem ajustes globais, PWA e mobile.
- Relatórios e Segurança possuem grandes blocos específicos posteriores à fundação.
- `overflow-x:hidden` mascara filhos largos em vez de identificar a origem.

## Breakpoints

Não há escala única. Foram encontrados muitos limiares entre 359 e 1500 px, inclusive pares 760/767/768 e 860/900. Isso permite estados em que JS (`mobile-mode`/viewport) e CSS discordam.

## Recomendação

Não apagar o legado em massa. Criar uma camada de autoridade pequena e opt-in, migrar uma tela por vez, registrar seletores substituídos e remover a regra antiga somente após comparação mobile/desktop.
