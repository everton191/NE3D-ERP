# Fase 7D - Auditoria inicial de renderizacao mobile

## Escopo do Lote 0

Esta auditoria nao aplica otimizacoes profundas. Ela registra os pontos que
precisam ser medidos antes do Lote 7.

## Riscos encontrados

| Area | Evidencia | Proximo passo |
| --- | --- | --- |
| CSS global | `16` regras `overflow-x:hidden` podem mascarar largura excedente | Auditar por componente no Lote 6 |
| Viewport | `7` usos de `width:100vw` | Trocar somente onde houver overflow comprovado |
| Camadas | `27` `position:fixed` e `58` `position:absolute` | Validar drawer, modal, toast e CTA |
| Editor guiado | Sidebar, toolbar e canvas coexistem no mobile | Medir DOM e reduzir reconstrucoes no Lote 7 |
| Preview | Atualizacao visual pode reconstruir blocos completos | Aplicar debounce depois de medir |
| Imagens | Assets publicos precisam reservar espaco | Auditar `aspect-ratio`, lazy loading e thumbnails |
| Android | Fundo WebView e barras nativas fixos escuros | Tratar somente apos aprovacao Web/PWA |

## Metricas a coletar no Lote 7

- Quantidade de shells publicos e administrativos.
- Quantidade de listeners apos abrir e fechar o editor.
- Tempo de render do preview apos digitacao.
- Quantidade de imagens sem `loading="lazy"` e `decoding="async"`.
- Layout shift do banner e cards de produto.
- Scroll horizontal em `320`, `360`, `390`, `412` e `430` pixels.

## Regra de seguranca

Nao remover `overflow-x:hidden` global durante esta fundacao. O Lote 6 deve
identificar a causa real por componente antes de retirar cada protecao.
