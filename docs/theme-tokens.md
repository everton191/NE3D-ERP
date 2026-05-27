# Theme Tokens - Fase 3A

Data: 2026-05-27

## Tokens obrigatorios

```css
--bg-primary
--bg-secondary
--bg-tertiary

--card-bg
--card-bg-hover

--text-primary
--text-secondary
--text-muted

--border-primary
--border-secondary

--accent-primary
--accent-secondary

--success
--warning
--danger
--info
```

## Tema dark

Direcao: grafite, petroleo escuro, teal controlado e laranja como acento.

Arquivo preparado:

```txt
themes/dark/tokens.css
```

## Tema light

Direcao: off-white, superficies solidas, contraste mais forte e teal/laranja controlados.

Arquivo preparado:

```txt
themes/light/tokens.css
```

## Tema premium

Preset futuro para elevar profundidade e contraste sem criar visual exagerado.

Arquivo preparado:

```txt
themes/premium/tokens.css
```

## Regra de manutencao

Componentes novos nao devem depender de hexadecimais ou `rgba(...)` diretos. Quando uma cor nova for necessaria, criar primeiro um token semanticamente nomeado.

