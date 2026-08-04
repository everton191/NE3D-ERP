# Inventario de Telas - Simplifica 3D

Data: 2026-07-08

Origem principal: `UI_SCREEN_RELATIONS` e `NAVIGATION_AUDIT_REGISTRY` em `app.js`.

Objetivo: listar as telas conhecidas e indicar o estado de padronizacao antes de migrar qualquer visual.

## Telas principais

| Tela | Modulo | Registro | Estado atual | Proxima acao segura |
| --- | --- | --- | --- | --- |
| Início / Dashboard | Dashboard | `dashboard` | ativa, piloto de densidade e scroll central | validar visualmente em desktop amplo e usar como referencia para novos cards |
| Pedidos | Pedidos | `pedidos` | ativa | auditar lista, filtros, empty/error/loading e vínculo com estoque/caixa |
| Novo pedido | Pedidos | `pedido` | ativa | confirmar secao "Materiais do estoque" e baixa apenas pelo pedido |
| Calculadora 3D | Calculadora | `calculadora` | ativa | manter simples, lote opcional e botao "Gerar pedido" sem baixa de estoque |
| Estoque | Estoque | `estoque` | ativa, menu e scroll corrigidos | preservar lista, FAB, busca e filtros dentro do contrato central da Home |
| Caixa | Caixa | `caixa` | ativa | auditar botoes, modal de configuracao, movimento/extrato e tamanho dos cards |
| Produção | Produção | `producao` | ativa | manter producao manual, ocultar impressora automatica futura |
| Clientes | Clientes | `clientes` | ativa | garantir cliente da empresa para usuarios comuns e empresa SaaS no superadmin |
| Relatórios | Relatórios | `relatorios` | ativa | compactar cards, remover botao redundante, validar filtros e scroll |
| Loja Online | Loja/Admin | `lojaOnline` | ativa | confirmar publicacao conforme plano e loja clara isolada |
| Admin da Loja | Loja/Admin | `lojaAdmin` | ativa | manter separado da vitrine publica |
| Perfil / Usuário | Perfil | `conta` | ativa | corrigir scroll, modo de uso e seguranca sem misturar admin |
| Segurança | Perfil | `seguranca` | ativa | revisar troca de senha, sessoes, 2FA e exclusao de conta |
| Empresa | Configurações | `empresa` | registrada | auditar se usa template/configuracao correta |
| Sistema | Configurações | `config` / `backup` | ativa | remover itens tecnicos indevidos para usuario final |
| Aparência | Configurações | `personalizacao` | registrada | tema deve ficar centralizado no perfil/modo, sem duplicar menu |
| Calculadora config | Configurações | `preferencias` | registrada | garantir que nao reative estoque dentro da calculadora |
| Funcionários e permissões | Administração | `usuarios` | ativa/restrita | garantir usuarios da empresa, nao todos os usuarios SaaS |
| Administração da empresa | Administração | `administracao` | ativa | separar de superadmin e limitar a funcoes da empresa |
| Planos | Planos | `planos`, `assinatura`, `minhaAssinatura` | ativa | auditar Free/Start/Pro e loja publica por periodo pago |
| Superadmin | Plataforma | `superadmin` | restrita | mostrar empresas SaaS, nao clientes finais do ERP |
| Ajuda e suporte | Suporte | `feedback` | ativa | manter como suporte/sugestoes, sininho abre sugestoes |
| Sobre | Público/Sistema | `sobre` | ativa | validar textos e versao |
| Privacidade / Termos | Público | `privacy`, `terms` | ativa | manter publico e sem UI administrativa |
| Introdução | Onboarding | `onboarding` | ativa condicional | manter opção pular quando aplicavel |
| Acesso negado | Segurança | `acessoNegado` | ativa | manter feedback claro |

## Telas futuras ou controladas

| Tela/Função | Estado | Regra |
| --- | --- | --- |
| Impressoras | piloto controlado/ativa | exibir cadastro e guia Bambu; manter chave de rollback e modo somente leitura |
| Monitoramento remoto | piloto tecnico, validacao fisica pendente | nao declarar operacional antes do teste com conta e impressora real |
| IA pesada/local | desativada | nao adicionar menu/tela visivel nesta fase |
| Integrações Google alem do login | fundacao desativada | nao ativar sem backend e permissao |

## Checklist por tela antes de corrigir

- [ ] Usa registro em `UI_SCREEN_RELATIONS`.
- [ ] Usa entrada em `NAVIGATION_AUDIT_REGISTRY` quando aparece no menu.
- [ ] Usa icone em `docs/icon-system-registry.md`.
- [ ] Usa botao de `UI_BUTTON_RELATIONS` / `renderAppButton`.
- [ ] Usa card/input conforme `docs/ui-component-standards.md`.
- [ ] Possui loading.
- [ ] Possui empty state.
- [ ] Possui error state.
- [ ] Possui feedback de sucesso/salvando quando altera dados.
- [ ] Respeita plano/permissao no frontend e backend/RLS quando houver banco.
- [ ] Mobile rola com toque.
- [ ] Desktop rola com roda/mouse/teclado.
- [ ] Nao cria overflow horizontal acidental.
- [ ] Loja publica nao herda tema/sidebar do ERP.
