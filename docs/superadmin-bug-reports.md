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
