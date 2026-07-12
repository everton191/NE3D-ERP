# Contrato de overlays UI V3

Todos os overlays são criados pelo controlador em Portal anexado diretamente à raiz V3. Dialog é centralizado; sheet é inferior; drawer é lateral; fullscreen é variante explícita.

Contrato: backdrop, `role=dialog`, `aria-modal`, título associado, foco inicial, trap de Tab, Escape, restauração do elemento abridor, clique no backdrop, botão fechar, histórico/voltar, lock do `ContentScroller`, scroll interno, `100dvh`, safe areas e escala z-index própria. Abrir um overlay fecha o anterior. Modal mobile não muda de tipo.
