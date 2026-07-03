# Registro de icones do Simplifica 3D

Este documento define a base de icones usada em telas, menus, cards e botoes do ERP. Antes de criar uma tela ou botao novo, conferir esta lista e usar o token existente em `renderUiIcon("token")`.

## Regra de uso

- Usar sempre `renderUiIcon("token")` para icones de interface.
- Nao colar SVG solto em tela nova sem adicionar um token aqui e em `UI_ICON_TOKEN_REGISTRY`.
- Manter o estilo visual Lucide: `24x24`, traco linear arredondado, `stroke-width` proximo de `2px`, `stroke="currentColor"`.
- A cor principal do icone deve vir do tema/tokens do sistema. No tema claro, o padrao visual usa verde-petroleo suave no traco e fundo claro no bloco do icone.
- Se um nome vier de biblioteca Lucide, cadastrar como alias em `UI_ICON_ALIASES` para cair no token correto.

## Areas principais

| Token | Uso | Lucide de referencia |
| --- | --- | --- |
| `dashboard` | Home | `LayoutDashboard` |
| `pedidos` | Pedidos | `ClipboardList` |
| `pedido` | Novo pedido | `FileText` |
| `producao` | Producao | `PrinterCheck` |
| `caixa` | Caixa | `WalletCards` |
| `clientes` | Clientes | `UsersRound` |
| `estoque` | Estoque | `PackageOpen` |
| `financeiro` | Financeiro | `CircleDollarSign` |
| `relatorios` | Relatorios | `ChartNoAxesColumn` |
| `lojaonline` | Loja online | `Store` |
| `config` | Ajustes | `Settings` |
| `preferencias` | Preferencias da calculadora | `SlidersHorizontal` |

## Administracao da empresa

| Token | Uso | Lucide de referencia |
| --- | --- | --- |
| `empresa` | Dados da empresa | `Building2` |
| `assinatura` | Plano e assinatura | `CreditCard` |
| `usuarios` | Funcionarios | `UserRoundCog` |
| `seguranca` | Permissoes | `ShieldCheck` |
| `departamentos` | Departamentos | `GitBranch` |
| `cargo` | Cargos e funcoes | `UserCheck` |
| `gruposAcesso` | Grupos de acesso | `UsersRoundCog` |
| `politicas` | Politicas de acesso | `FileShield` |
| `sessoes` | Sessoes ativas | `MonitorSmartphone` |
| `historico` | Historico de acessos | `History` |
| `logs` | Logs e auditoria | `FileClock` |
| `loginSeguranca` | Seguranca e login | `LockKeyhole` |
| `autenticacao2fa` | Autenticacao 2FA | `KeyRound` |
| `recuperacaoSenha` | Recuperacao de senha | `MailQuestion` |
| `dispositivos` | Dispositivos | `Devices` |

## Operacao e gestao

| Token | Uso | Lucide de referencia |
| --- | --- | --- |
| `catalogo` | Catalogo da loja | `ShoppingBag` |
| `tag` | Categorias e tags | `Tags` |
| `produtosLoja` | Produtos da loja | `PackageSearch` |
| `carrinho` | Pedidos da loja / nova venda | `ShoppingCart` |
| `cupom` | Cupons e descontos | `BadgePercent` |
| `estrela` | Avaliacoes | `Star` |
| `imagem` | Banner e aparencia | `Image` |
| `mensagens` | Canais de atendimento | `MessagesSquare` |
| `movimentacoes` | Movimentacoes | `ArrowUpDown` |
| `sangria` | Sangria e suprimento | `HandCoins` |
| `fechamento` | Fechamento de caixa | `Lock` |
| `conciliacao` | Conciliacao | `CheckCircle2` |
| `grupoClientes` | Grupos de clientes | `Users` |
| `tagCliente` | Tags de clientes | `Bookmark` |
| `listaPrecos` | Lista de precos | `ListChecks` |
| `orcamento` | Orcamentos | `FileText` |
| `filaImpressao` | Fila de impressao | `ListOrdered` |
| `impressoras` | Impressoras | `PrinterCog` |
| `statusProducao` | Status de producao | `Activity` |
| `entrega` | Entregas e envios | `Truck` |
| `produtos` | Produtos e materiais | `Boxes` |
| `estoqueMovimento` | Movimentacoes de estoque | `ArrowLeftRight` |
| `alerta` | Alertas de estoque | `AlertTriangle` |

## Sistema e configuracoes

| Token | Uso | Lucide de referencia |
| --- | --- | --- |
| `aparencia` | Aparencia do sistema | `Palette` |
| `tema` | Temas e cores | `Paintbrush2` |
| `config` | Configuracoes gerais | `Settings2` |
| `bell` | Notificacoes | `BellRing` |
| `integracoes` | Integracoes | `Cable` |
| `whatsapp` | WhatsApp | `MessageCircle` |
| `email` | E-mail | `AtSign` |
| `contatoGoogle` | Google / Contatos | `UserRoundPlus` |
| `financeiro` | Mercado Pago | `CircleDollarSign` |
| `backup` | Backup da empresa | `CloudUpload` |
| `importar` | Importar dados | `Upload` |
| `exportar` | Exportar dados | `Download` |
| `database` | Banco de dados | `Database` |
| `statusSistema` | Status do sistema | `Server` |
| `ajuda` | Central de ajuda | `CircleHelp` |
| `feedback` | Ajuda e suporte | `LifeBuoy` |
| `conta` | Meu perfil | `UserRound` |
| `search` | Pesquisar | `Search` |
| `admin` | Admin | `ShieldUser` |
| `agenda` | Agenda | `CalendarDays` |
| `back` | Voltar | `ArrowLeft` |
| `check` | Confirmar | `Check` |
| `edit` | Editar | `Pencil` |
| `menu` | Menu | `Menu` |
| `pdf` | PDF | `FileDown` |
| `plus` | Adicionar | `Plus` |
| `print` | Imprimir | `Printer` |
| `refresh` | Atualizar/sincronizar | `RefreshCw` |
| `time` | Horario | `Clock` |
| `trash` | Excluir | `Trash2` |
| `tutorial` | Tutoriais | `BookOpen` |
| `atalhos` | Atalhos do teclado | `Keyboard` |
| `suporte` | Fale com o suporte | `Headphones` |
| `sobre` | Sobre o sistema | `Info` |
| `superadmin` | Super Admin | `Crown` |

## Checklist para novo botao ou nova tela

1. Procurar um token existente nesta lista.
2. Se precisar de token novo, adicionar em `UI_ICON_TOKEN_REGISTRY`.
3. Adicionar alias em `UI_ICON_ALIASES` quando o nome vier da referencia Lucide.
4. Adicionar o SVG correspondente em `renderUiIcon`.
5. Atualizar `UI_SCREEN_RELATIONS` ou a relacao do botao para apontar para o token, nunca para um emoji ou SVG solto.
6. Rodar `node --check app.js` e build/teste visual antes de considerar pronto.
