# Relatorio de Lacunas - Simplifica 3D

Data da revisão: 2026-07-23

Base revisada: versão estável local no commit `6d6581c`.

## Resumo de maturidade

| Modulo | Maturidade inicial | Foco recomendado |
| --- | --- | --- |
| Dashboard | funcional incompleto | template, cards, alertas |
| Pedidos | funcional incompleto | historico unificado e integracao transacional |
| Estoque | madura parcial | reserva, consumo e devolucao auditaveis |
| Caixa | funcional incompleto | acoes compactas, historico, fechamento |
| Producao | madura parcial | capacidade, prazo e custo real |
| Loja | madura parcial | pedido/orcamento, checklist, plano |
| Planos | madura parcial | feature gates, RLS, loja por status |
| Superadmin | funcional incompleto | empresas SaaS, usuarios por tenant, logs |
| Relatorios | funcional incompleto | cards compactos, filtros, exportacao |
| Perfil | funcional incompleto | scroll, senha, modo de uso, exclusao |

## Fundações já existentes

- [x] Estoque por rolo/lote e movimentações.
- [x] Ajuste e saída de estoque com motivo.
- [x] Fila manual de produção vinculável a pedido/item.
- [x] Eventos operacionais de produção.
- [x] Sessões e fechamento de caixa no backend.
- [x] Matriz central de recursos por plano, perfil e modo de interface.
- [x] Cadastro e monitoramento somente-leitura de impressoras preparados no backend.

Essas fundações não significam validação completa de todos os fluxos na interface,
em sessão autenticada ou em produção.

## Lacunas essenciais agora

- [x] Pedido possui linha do tempo local unificada para status, estoque, produção e caixa.
- [ ] Persistir a linha do tempo como contrato remoto próprio, se a auditoria concluir que a agregação local não é suficiente.
- [ ] Reserva, consumo, devolução e perda de material precisam formar um fluxo auditável.
- [ ] Baixa de estoque deve continuar acontecendo pelo pedido/produção, nunca pela simulação da calculadora.
- [x] Produção possui resumo local de capacidade, carga estimada e atrasos.
- [ ] Evoluir a capacidade para previsão de entrega considerando expediente, pausas e manutenção.
- [ ] Caixa precisa expor e validar o fechamento diário existente no backend.
- [ ] Planos e permissoes precisam auditoria por toda nova funcao.
- [ ] Loja precisa manter publicacao conforme plano e periodo pago.
- [ ] Superadmin deve tratar clientes SaaS como empresas, separado de clientes finais.

## Melhorias importantes

- [ ] Pedido/orcamento vindo da loja.
- [ ] Aprovação pública de orçamento por link.
- [ ] Reserva de estoque por pedido/item.
- [ ] Falha e reimpressao na producao.
- [ ] Relatorio de consumo de material.
- [~] Rentabilidade estimada por pedido e comparação entre tempo estimado/real disponíveis; custos reais completos ainda dependem de perdas e despesas efetivas.
- [~] Resumo de capacidade disponível; calendário visual permanece futuro.
- [ ] Fornecedores, reposição e manutenção preventiva.
- [ ] Anexos protegidos por empresa e plano.
- [ ] Mensagens de status para WhatsApp acionadas pelo usuário.
- [ ] Skeleton loading em listas longas.
- [ ] Selects grandes com busca.

## Futuro ou desativado

- [ ] Monitoramento remoto de impressoras.
- [ ] Agente Local Simplifica.
- [ ] Checkout completo da loja.
- [ ] Integracao fiscal.
- [ ] Marketplace.
- [ ] BI avancado.

## Ordem recomendada

1. Persistir e auditar remotamente o histórico operacional consolidado.
2. Fechar reserva/consumo/devolução de estoque por item.
3. Integrar produção e caixa ao histórico do pedido.
4. Entregar aprovação pública de orçamento.
5. Adicionar capacidade produtiva e rentabilidade real.
6. Extrair regras do `app.js` por domínio, em etapas pequenas.

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
