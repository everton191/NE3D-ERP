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
