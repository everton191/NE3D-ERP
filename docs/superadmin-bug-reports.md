# Superadmin - Relatorios e Diagnostico

Data: 2026-05-29

## Tela

A Fase 6A adiciona a aba Superadmin `Relatorios e Diagnostico`.

Ela centraliza:

- visao geral;
- bugs;
- sugestoes;
- eventos;
- clusters;
- relatorios para Codex.

## Visao geral

Cards exibidos:

- bugs novos;
- bugs criticos;
- sugestoes novas;
- usuarios afetados;
- versao com mais erros;
- tela com mais erros;
- ultimas 24h;
- ultimos 7 dias.

## Bugs

A tabela de bugs mostra:

- erro;
- tela;
- acao;
- severidade;
- status;
- ocorrencias;
- usuarios afetados;
- versao;
- plataforma;
- ultima ocorrencia.

A acao `Codex` gera um relatorio tecnico estruturado a partir do bug selecionado.

## Sugestoes

Sugestoes e relatos manuais continuam vindo de `app_feedback_reports`. O formulario do usuario nao mostra stack trace nem detalhes tecnicos brutos.

Mensagem final:

`Obrigado! Seu relato foi enviado e sera analisado.`

## Eventos

A aba permite filtrar eventos como:

- `sync_failed`;
- `store_editor_failed`;
- `checkout_opened`;
- `checkout_abandoned`;
- `payment_failed`;
- `webhook_validation_failed`;
- `pwa_cache_error`.

## Clusters

Clusters agrupam erros por `fingerprint` e exibem:

- titulo;
- ocorrencias;
- usuarios afetados;
- telas afetadas;
- versoes afetadas;
- plataformas afetadas;
- status;
- severidade.

## Permissoes

Somente superadmin deve visualizar agregados globais, alterar status, alterar severidade, adicionar notas administrativas e gerar relatorios tecnicos globais.

Usuario comum permanece restrito aos proprios relatos/logs.

## Validacao e endurecimento - Fase 6B

A tela passou a oferecer acoes operacionais adicionais para validacao real:

- alterar status de bug para `investigating`, `fixed` ou `ignored`;
- alterar severidade de bug para `critical`;
- adicionar nota administrativa em bug;
- alterar status de feedback;
- adicionar nota administrativa em feedback;
- alterar status de cluster;
- alterar severidade de cluster;
- adicionar nota administrativa em cluster;
- gerar relatorio tecnico para Codex e salvar em `app_bug_reports_exports`.

Essas acoes continuam protegidas por `isSuperAdmin()` no frontend e por RLS/policies no Supabase.

Pendencia de validacao real:

- testar com superadmin autenticado apos aplicar migrations;
- testar usuario comum tentando acessar dados globais;
- confirmar persistencia visual apos reload em ambiente remoto.

## Validacao remota - Fase 6C

As migrations de diagnostico ja foram aplicadas no Supabase remoto principal e a validacao RLS foi executada por `npm run supabase:diagnostics:validate`.

Resultado da validacao transacional:

- usuario comum cria feedback/log/evento proprio;
- usuario comum nao le `app_bug_clusters`;
- usuario comum nao altera severidade/status de bug;
- superadmin temporario reconhecido por `erp_is_superadmin()` le clusters;
- superadmin altera bug, feedback e gera registro em `app_bug_reports_exports`;
- todos os dados temporarios sao revertidos por `rollback`.

Validacao manual ainda recomendada apos deploy:

- abrir Superadmin com sessao real;
- acessar `Relatorios e Diagnostico`;
- confirmar carregamento das abas Bugs, Sugestoes, Eventos, Clusters e Relatorios para Codex;
- confirmar que usuario comum nao ve o painel nem dados globais.

## Smoke remoto - Fase 6D

O deploy `dpl_GWXFJVvQxrGJtX2Zqyb9SkL5gu8z` foi publicado em producao e validado em `https://erpne3d.vercel.app`.

Confirmado sem login:

- rota protegida `/store-admin/ne3d` volta para login;
- login por e-mail/senha continua visivel;
- nao aparece Google Login;
- nao aparece recurso de IA;
- nao ha erro de console capturado no smoke inicial.

Pendente de usuario autenticado:

- abrir `Relatorios e Diagnostico` com conta Superadmin real;
- validar filtros, detalhes, status, severidade e notas;
- confirmar persistencia apos reload;
- confirmar que usuario comum nao executa acoes administrativas.
