# Relatorio Tecnico para Codex

Data: 2026-05-29

## Objetivo

Gerar um texto tecnico padronizado para acelerar correcao de bugs reais coletados em producao.

O relatorio pode nascer de:

- detalhe de bug;
- cluster;
- filtros gerais do painel de diagnostico.

## Estrutura

O formato gerado por `generateCodexTechnicalReport()` segue:

```txt
# Relatorio tecnico para correcao

## Resumo
Descricao curta do problema.

## Frequencia
Ocorrencias:
Usuarios afetados:
Primeira ocorrencia:
Ultima ocorrencia:

## Contexto
Tela:
Acao:
Versoes afetadas:
Plataformas:
Dispositivos:

## Evidencias
Mensagens de erro:
Stack sanitizada:
Eventos relacionados:
Feedbacks relacionados:

## Possivel causa
Hipotese tecnica baseada nos dados coletados.

## Arquivos provaveis
Lista de arquivos/modulos suspeitos.

## Prioridade
Baixa / Media / Alta / Critica.

## Instrucao para Codex
Corrigir o problema mantendo compatibilidade, sem alterar regras fora do escopo, adicionando teste anti-regressao e documentando a correcao.
```

## Privacidade

O relatorio deve usar stack sanitizada e metadados ja filtrados. Ele nao deve incluir tokens, senhas, cartao, segredos de webhook ou payload completo de pagamento.

## Relatorio geral

`generateDiagnosticsSummaryReport(filters, data)` prepara:

- top bugs;
- top sugestoes;
- bugs criticos;
- eventos de pagamento;
- eventos de sync;
- recomendacoes de prioridade.

Nesta fase o relatorio e deterministico e local. Nenhuma IA e chamada.

## Validacao e persistencia - Fase 6B

`gerarRelatorioCodexDiagnostico()` agora:

- gera o texto estruturado;
- copia para area de transferencia quando o navegador permite;
- tenta salvar o registro em `app_bug_reports_exports`;
- relaciona `related_error_ids`, `related_feedback_ids` e `related_cluster_ids`;
- usa status inicial `generated`;
- cria entrada local temporaria se o Supabase estiver indisponivel.

O texto continua sem IA real e sem envio para provider externo.

Limite:

- o salvamento definitivo depende de token Supabase e migration aplicada no ambiente alvo.

## Validacao remota - Fase 6C

Com as migrations aplicadas no Supabase remoto, o export tecnico foi validado em transacao:

- `app_bug_reports_exports` existe com RLS ativo;
- usuario comum nao tem acesso global ao export;
- superadmin consegue inserir relatorio com status `generated`;
- o teste usa `rollback`, portanto nao deixa relatorio temporario salvo.

O relatorio continua deterministico, sem provider de IA e sem envio automatico para servico externo.
