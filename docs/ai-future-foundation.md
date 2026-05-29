# IA Futura para Diagnosticos - Desativada

Data: 2026-05-29

## Estado atual

A Fase 6A prepara a base para analises futuras de bugs e sugestoes, mas mantem IA totalmente desligada.

Flags internas:

```txt
enableAiDiagnostics = false
enableAiAssistant = false
enableAiBugSummary = false
```

## O que nao existe nesta fase

- Nenhum botao de IA.
- Nenhum menu de IA.
- Nenhuma tela publica de IA.
- Nenhum provider real.
- Nenhuma chamada para IA local/offline.
- Nenhuma chamada para API externa.
- Nenhuma chave de API.
- Nenhum prompt enviado para modelo.

## Estrutura preparada

Tabelas:

- `app_ai_analysis_runs`;
- `app_ai_knowledge_base`.

Uso futuro previsto:

- analisar bugs;
- agrupar sugestoes semelhantes;
- priorizar correcoes;
- gerar prompt tecnico para Codex;
- explicar status de correcao para usuarios.

## Ativacao futura segura

Antes de ativar qualquer IA sera necessario:

1. Escolher provider.
2. Implementar adapter real no backend seguro.
3. Configurar chaves apenas em ambiente protegido.
4. Ativar flag global.
5. Ativar owner/beta/superadmin.
6. Definir limite mensal.
7. Validar logs, custos e privacidade.
8. Liberar por plano pago.

Enquanto esses passos nao ocorrerem, a IA permanece apenas como fundacao tecnica documentada.

## Fase 6B

A validacao de diagnosticos manteve a IA desativada:

- `enableAiDiagnostics = false`;
- `enableAiAssistant = false`;
- `enableAiBugSummary = false`;
- nenhuma chamada local/offline;
- nenhuma chamada externa;
- nenhum item visual novo de IA.

Os relatorios para Codex sao gerados por template deterministico, sem modelo de IA.

## Validacao remota - Fase 6C

A migration `20260529141000_ai_foundation_disabled.sql` foi aplicada no Supabase remoto principal junto das migrations de diagnostico.

Validacoes confirmadas:

- `app_ai_settings`, `app_ai_usage_logs`, `app_ai_context_snapshots` e `app_ai_feature_flags` existem;
- RLS esta ativo nas tabelas;
- nao ha policy publica aberta;
- `app_ai_settings` nao possui IA habilitada nem provider real configurado;
- usuario comum consegue registrar somente tentativa bloqueada em `app_ai_usage_logs`;
- nenhum provider de IA foi conectado;
- nenhuma chave foi adicionada;
- nenhuma mudanca visual foi exposta ao usuario.

A ativacao futura continua exigindo backend seguro, provider real, flags, limites e liberacao controlada.

## Smoke remoto - Fase 6D

No deploy `dpl_GWXFJVvQxrGJtX2Zqyb9SkL5gu8z`, a fundacao de IA permaneceu invisivel:

- `index.html` remoto nao contem `aiService`, `ai-foundation` ou `AI_ENABLED_GLOBAL`;
- nenhum script de IA e carregado pela pagina;
- nenhum botao, menu, card ou tela de IA aparece no smoke sem login;
- os testes `test:diagnostics`, `test:restructuring-checks` e `supabase:test:migrations` continuam passando.

Estado final da fase:

```txt
IA estruturada: sim
IA ativa: nao
Provider real: nao
API externa: nao
Botao/menu visivel: nao
```
