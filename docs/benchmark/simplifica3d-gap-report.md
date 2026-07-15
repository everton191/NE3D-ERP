# Relatorio de Lacunas - Simplifica 3D

Data: 2026-07-08

## Resumo de maturidade

| Modulo | Maturidade inicial | Foco recomendado |
| --- | --- | --- |
| Dashboard | funcional incompleto | template, cards, alertas |
| Pedidos | funcional incompleto | status, historico, materiais do estoque |
| Estoque | funcional incompleto | movimentacoes, rolo/lote, alertas |
| Caixa | funcional incompleto | acoes compactas, historico, fechamento |
| Producao | funcional incompleto | fila manual, status, responsavel |
| Loja | madura parcial | pedido/orcamento, checklist, plano |
| Planos | madura parcial | feature gates, RLS, loja por status |
| Superadmin | funcional incompleto | empresas SaaS, usuarios por tenant, logs |
| Relatorios | funcional incompleto | cards compactos, filtros, exportacao |
| Perfil | funcional incompleto | scroll, senha, modo de uso, exclusao |

## Lacunas essenciais agora

- [ ] Pedidos precisam consolidar historico, status e materiais do estoque.
- [ ] Estoque precisa historico/movimentacao por rolo/material.
- [ ] Baixa de estoque deve acontecer pelo pedido/producao, nao pela calculadora.
- [ ] Producao precisa fila manual e status consistentes.
- [ ] Planos e permissoes precisam auditoria por toda nova funcao.
- [ ] Loja precisa manter publicacao conforme plano e periodo pago.
- [ ] Superadmin deve tratar clientes SaaS como empresas, separado de clientes finais.

## Melhorias importantes

- [ ] Pedido/orcamento vindo da loja.
- [ ] Reserva de estoque por pedido.
- [ ] Falha e reimpressao na producao.
- [ ] Relatorio de consumo de material.
- [ ] Skeleton loading em listas longas.
- [ ] Selects grandes com busca.

## Futuro ou desativado

- [ ] Monitoramento remoto de impressoras.
- [ ] Agente Local Simplifica.
- [ ] Checkout completo da loja.
- [ ] Integracao fiscal.
- [ ] Marketplace.
- [ ] BI avancado.

## Regras de decisao

Antes de implementar melhoria, responder:

- [ ] Existe referencia em sistema maduro?
- [ ] Resolve problema real do Simplifica 3D?
- [ ] Deixa o app mais simples ou mais complicado?
- [ ] Depende de outra funcao?
- [ ] Afeta Free, Start ou Pro?
- [ ] Afeta mobile, desktop ou loja publica?
- [ ] Precisa de banco/RLS/storage/servico?
- [ ] Deve ficar ativa agora ou em feature flag?
- [ ] Deve ser feita inteira ou por fases?
