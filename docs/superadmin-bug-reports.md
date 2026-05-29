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
