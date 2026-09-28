# Contrato de ActionPlan

## Finalidade

Este é um contrato documental para a futura convergência de router determinístico, Needle, LFM, workflows, validação e executor. Não cria runtime, não muda tool exposure e não autoriza WRITE.

```json
{
  "domain": "orders",
  "intent": "orders.create",
  "status": "INCOMPLETE",
  "entities": {},
  "fields": {},
  "fieldSources": {},
  "missingRequired": [],
  "missingOptional": [],
  "workflow": "orders.create",
  "selectedTool": "orders.prepare_create",
  "confidence": { "route": 0, "entity": 0, "provider": 0 },
  "readyToPrepare": false,
  "requiresConfirmation": true
}
```

| Campo | Contrato futuro |
|---|---|
| `domain` | Domínio canônico, por exemplo `orders` ou `inventory`. |
| `intent` | ID semântico único, por exemplo `orders.create`; nunca um alias de provider. |
| `status` | `READY`, `INCOMPLETE`, `MISSING_REQUIRED`, `AMBIGUOUS_ENTITY`, `NO_MATCH`, `NOT_IMPLEMENTED`, `BLOCKED`, `REQUIRES_CONFIRMATION`, `PREPARED`, `EXECUTED` ou `FAILED`. |
| `entities` | Referências humanas e entidades resolvidas pelo ERP; IDs só entram após resolução verificável. |
| `fields` | Valores de input validados pelo schema da intenção/workflow. |
| `fieldSources` | Proveniência por campo, usando a tabela abaixo. |
| `missingRequired` | Campos exigidos pelo schema real ainda ausentes ou inválidos. |
| `missingOptional` | Campos úteis, mas não necessários para PREPARE. |
| `workflow` | Identificador do workflow canônico aplicável. |
| `selectedTool` | Tool READ ou PREPARE realmente selecionada após máscara Top-K. |
| `confidence` | Confianças separadas de rota, entidade e provider; nunca autorização para WRITE. |
| `readyToPrepare` | Verdadeiro somente após schema, entidade e policy validator aprovarem. |
| `requiresConfirmation` | Obrigatório para qualquer transição a WRITE, mesmo quando o plano estiver completo. |

## Field sources previstos

| Fonte | Uso permitido |
|---|---|
| `USER` | Informação informada explicitamente pelo usuário. |
| `CURRENT_SCREEN` | Contexto selecionado da tela ativa. |
| `ERP_DATABASE` | Dado retornado por consulta real do ERP. |
| `PREVIOUS_TURN` | Informação persistida no workflow/conversa atual. |
| `WORKFLOW` | Valor produzido por etapa anterior validada. |
| `ENTITY_RESOLVER` | ID ou referência resolvida a partir de candidatos reais. |
| `CALCULATION` | Resultado do cálculo determinístico. |
| `MODEL_INFERENCE` | Hipótese do provider, sempre sujeita a validação. |

`MODEL_INFERENCE` sozinho não poderá preencher IDs, preços, valores financeiros, descontos, quantidades críticas, identificadores críticos ou qualquer WRITE. Esses campos exigem `USER`, `ERP_DATABASE`, `ENTITY_RESOLVER`, `CALCULATION` ou validação explícita do workflow.

## Limite deste lote

O contrato não substitui `ConversationSession`, `SafeOperationPipeline`, `WorkflowToolGraph` nem `ActionRegistry`. A integração executável pertence ao LOTE 2.
