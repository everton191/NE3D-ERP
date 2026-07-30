# Roadmap operacional executável

Data de consolidação: 2026-07-23

Este documento transforma a revisão técnica em entregas verificáveis. `Concluído`
significa implementado localmente e coberto por teste; não significa publicado em
produção.

## Núcleo operacional

| Entrega | Estado local | Próxima validação |
| --- | --- | --- |
| Histórico agregado do pedido | Concluído | sessão autenticada e persistência após sincronização |
| Eventos com usuário, data e vínculo ao pedido | Concluído para novos eventos locais | contrato remoto próprio |
| Produção por item do pedido | Existente | validar pedido com vários itens |
| Falha, qualidade e reimpressão | Existente | validar no emulador |
| Reserva de material por rolo | Fundação SQL desativada | criar RPC transacional e homologar RLS |
| Consumo, devolução e perda por reserva | Fundação SQL desativada | criar RPCs idempotentes |
| Fechamento com esperado, contado, diferença e justificativa | Concluído localmente | sincronização remota da sessão |
| Dashboard de exceções | Concluído no modo Simplifica | validar dados reais e modo profissional |

## Funções de alto valor

| Entrega | Estado local | Dependência |
| --- | --- | --- |
| Aprovação pública de orçamento | Pendente | token público, expiração, RLS/RPC e tela pública |
| Capacidade produtiva | Resumo concluído | calendário, expediente e manutenção |
| Tempo estimado versus real | Concluído | descontar pausas |
| Rentabilidade estimada | Concluído | perdas, embalagem e despesas reais |
| Fornecedores e compras simples | Parcial no cadastro de estoque | contrato próprio e reposição |
| Manutenção preventiva | Parcial no cadastro de impressoras | eventos e horas acumuladas |
| Anexos do pedido | Pendente | bucket privado, limites e URLs assinadas |
| Notificações por evento | Fundação de mensagens existente | modelos por estado e acionamento manual |

## Evolução comercial

| Entrega | Estado local | Dependência |
| --- | --- | --- |
| Loja para fila de orçamento | Drafts/leads existentes | adaptação idempotente para pedido |
| Funil de conversão | Eventos de loja existentes | agregação e relatório |
| Perdas e reimpressões | Eventos existentes | relatório dedicado |
| Previsão de reposição | Pendente | consumo histórico confiável |
| Perfis de funcionário | Matriz existente | autoridade backend concluída localmente |
| Backup restaurável versionado | Checkpoint manual concluído | fluxo guiado com verificação |

## Segurança e arquitetura

| Entrega | Estado local | Observação |
| --- | --- | --- |
| Entitlement backend para funcionários | Migração local concluída | não aplicada remotamente |
| Autoridade central por feature | Função local criada | ampliar por operação paga |
| Extração incremental do `app.js` | Pendente | começar pelo agregador operacional |
| Migração incremental do `style.css` | Em andamento | novos estilos usam arquivo operacional |

## Itens explicitamente fora da rodada atual

- marketplace;
- integração fiscal completa;
- BI avançado;
- checkout completo;
- controle remoto de impressoras;
- reformulação visual global.
