# Plano da próxima implementação

Este plano não foi executado nesta fase.

## Etapa 1 — contratos globais

1. Escolher `#app-content` como único scroller do ERP autenticado.
2. Unificar sinais responsivos: uma escala de breakpoints e uma fonte JS derivada dela.
3. Definir container de página (max-width, padding e safe area) e grade opt-in 4/8/12.
4. Definir tokens únicos para header, bottom-nav, keyboard inset e camadas.
5. Criar testes estáticos que falhem com novo scroller de página, z-index numérico ou modal legado.

## Etapa 2 — overlays e teclado

1. Consolidar modal/drawer/bottom-sheet/toast em uma API que renderize nas camadas do shell.
2. Implementar bloqueio idempotente, foco inicial/trap/restauração, Escape e voltar Android.
3. Centralizar `visualViewport`/teclado e aplicar inset apenas ao scroller responsável.
4. Migrar primeiro “Modo de uso” como prova do contrato centralizado.

## Etapa 3 — telas piloto, em lotes pequenos

1. **Novo pedido:** corrigir pertencimento das ações por etapa; depois container/scroll; depois grid e espaçamento.
2. **Usuário:** criar trilho ícone/conteúdo/ação; completar/posicionar Zona de perigo conforme regra existente.
3. **Segurança:** normalizar header, cards, scroll, PIN/senha e FAB sem alterar autenticação.
4. **Relatórios:** remover autoridade local de viewport e validar scroll único.

## Etapa 4 — limpeza controlada

Para cada tela migrada: registrar seletores legados substituídos, remover somente os comprovadamente órfãos e executar busca de duplicidade/especificidade. Storefront/editor permanecem em zona isolada.

## Validação por lote

- sintaxe e imports;
- build web;
- testes existentes de shell, overflow, safe area, scroll e estabilidade mobile;
- 320x568, 360x800, 390x844, 430x932, 768x1024, 1024x768, 1366x768 e 1920x1080;
- zoom 80/100/125/200%;
- navegador, PWA e Android físico;
- teclado aberto em cada formulário piloto;
- navegação voltar/Escape e restauração de foco em overlays.

## Riscos

Maior risco: regras tardias por perfil reintroduzirem comportamento antigo. Mitigação: migração opt-in, screenshots antes/depois e nenhuma remoção global até todas as rotas piloto passarem.
