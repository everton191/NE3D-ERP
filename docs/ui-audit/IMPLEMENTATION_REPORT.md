# Relatório de implementação — Fase 1

## Concluído

- branch isolada criada sem descartar alterações locais anteriores;
- shell único preservado e documentado;
- rolagem principal atribuída ao documento;
- tokens estruturais consolidados com aliases legados preservados;
- largura máxima e centralização aplicadas;
- `min-width: 0` aplicado nos principais limites Grid/Flex;
- métricas de Dashboard convertidas em grid fluido;
- spans de Dashboard normalizados no mobile;
- navegação inferior, safe area e teclado considerados no espaço inferior;
- overlays e formulários limitados à viewport dinâmica;
- nenhum contrato de dados, regra de negócio, rota ou loja pública alterado.

## Componentes reaproveitados

`AppShell`, `DesktopShell`, `MobileBottomNavigation`, camadas de modal/drawer e os componentes em `src/shared/design-system` foram mantidos. Nenhum componente paralelo foi criado.

## CSS removido

Nenhum CSS foi removido nesta etapa conservadora. Os aliases legados continuam necessários por causa da ampla superfície de seletores em `style.css`.

## Testes

Executar: build web, contratos do shell, overflow, responsividade e auditoria técnica de scroll. A validação manual deve cobrir 320x568, 360x800, 390x844, 430x932, 768x1024, 1024x768, 1280x720, 1366x768, 1440x900, 1920x1080 e 2560x1440; zoom 80%, 100%, 125% e 200%; navegador, PWA e Android.

## Pendências e riscos

- screenshots antes/depois e teclado virtual real dependem de sessão autenticada e dispositivo;
- tabelas densas precisam de walkthrough por módulo para confirmar prioridade de colunas;
- regras tardias e específicas por perfil tornam regressão visual possível apesar dos testes estáticos;
- Fase 2 não deve começar até Dashboard e Caixa passarem pela matriz manual.
