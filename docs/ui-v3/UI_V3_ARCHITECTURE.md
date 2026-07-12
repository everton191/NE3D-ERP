# Arquitetura UI V3

A UI V3 é um subsistema opt-in sob `[data-ui-version="v3"]`. Componentes ficam em `src/ui-v3`, estilos em `styles/ui-v3` e nenhum seletor foi anexado ao `style.css`. O laboratório local desabilita folhas legadas, provando independência estrutural.

Fluxo: `AppShell -> header + ContentScroller + BottomNavigation`. Portals são filhos diretos da raiz V3. A rota `/dev/ui-v3` só monta em `localhost`, `127.0.0.1` ou `::1`; em outro host o bootstrap normal continua.

Breakpoints oficiais: mobile `<768`, tablet `768–1023`, desktop `>=1024`. Não há breakpoint por aparelho.
