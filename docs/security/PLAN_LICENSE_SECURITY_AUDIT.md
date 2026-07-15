# Auditoria de segurança de licenças e planos

## 1. Resumo executivo

Conclusão: **a proteção está parcialmente implementada**. O backend possui autoridade de licença e uma proteção robusta para publicação da loja, mas não existe uma autorização central aplicada antes de todas as operações pagas. Um APK/JavaScript modificado libera recursos locais, e um administrador da própria empresa consegue administrar funcionários diretamente pelo PostgREST mesmo quando o plano não é PRO ativo.

## 2. Situação atual e fonte oficial

A autoridade mais confiável está no Supabase: assinaturas, planos comerciais, estado de cobrança e RPCs de licença em `supabase/migrations/20260602180000_saas_license_authority_phase1.sql`. Porém, o frontend também mantém `billingConfig`, `saasSubscriptions`, cliente, cache por usuário e `localStorage`; essas fontes concorrentes controlam menus e funções locais. Metadados/cache do cliente não devem autorizar operações reais.

## 3. Matriz central

Existe matriz no frontend (`FEATURE_ACCESS_MATRIX`, `PLAN_REGISTRY` e `PlanService`) e no backend em `20260630113000_feature_access_matrix.sql`. A matriz backend não é aplicada uniformemente pelas políticas RLS das tabelas operacionais.

## 4. Validações encontradas

| Área | Controle atual | Classificação |
|---|---|---|
| Menus, rotas, temas, PDF, relatórios e limites | Estado/caches do frontend | funcional local; contornável |
| IA local Android | booleano `proAllowed` enviado pelo JavaScript | risco alto local |
| Pedidos/limites/anúncios/créditos | contadores e desbloqueios em `localStorage` | proteção incompleta |
| Publicação da loja | guarda backend deriva tenant, assinatura, pagamento, vencimento e cancelamento | protegida pelo backend |
| Funcionários/permissões | RLS verifica administrador do tenant, mas não plano/status/vencimento | vulnerável |
| Caixa/fiscal | RLS por membro; divisão Free/avançado não é materializada na operação | médio/inconclusivo |
| Backup/exportação | principalmente dono/usuário; sem autorização de feature uniforme | proteção incompleta |

## 5. Recursos protegidos corretamente

- Isolamento básico por usuário/empresa em várias tabelas com RLS.
- RPC segura para recursos sensíveis deriva associação, função e assinatura no servidor.
- Publicação/visibilidade pública da loja usa `storefront_plan_publication_guard.sql` e bloqueia assinatura não paga, pendente ou expirada.
- RPCs anônimas críticas e tabelas de persistência de planos possuem revogações específicas.

## 6. Vulnerabilidades

### P2 / Médio - Administração de funcionários ignora o entitlement PRO

Um `owner/admin` autenticado da própria empresa pode chamar diretamente INSERT/UPDATE/DELETE em `company_members`. A matriz exige PRO ativo, mas as políticas verificam somente administração do tenant.

Evidências:

- Requisito PRO: `supabase/migrations/20260630113000_feature_access_matrix.sql:73`.
- RLS sem plano/status/expiração: `supabase/migrations/20260505125834_plans_ads_roles_suggestions.sql:674-692`.
- Grants REST autenticados: `supabase/migrations/20260505230205_restore_public_rest_grants.sql:19`.

Cenário: empresa FREE, expirada ou após fim do cancelamento envia requisição PostgREST autenticada e continua criando ou alterando membros. Não foi observado acesso entre tenants ou elevação a superadmin.

### Fraqueza comercial local - IA Pro nativa confia em booleano do JavaScript

`SimplificaFilesPlugin.isAiLocalProAllowed` aceita `proAllowed` do `PluginCall` em `android/app/src/main/java/br/com/ne3d/erp/SimplificaFilesPlugin.java:1088-1090`. Esse valor protege download, carga, teste e execução do modelo (`:204-220`, `:549-650`). Um APK/JS modificado chama o plugin com `proAllowed:true`.

Pela política de segurança, o caso é informativo/sem prioridade: exige que o próprio dono altere seu APK e o efeito fica na IA offline do próprio aparelho. Continua relevante para proteção comercial da licença.

### Fraqueza comercial local - Plano Pro pode ser forjado no cache

O cache por usuário é lido/mesclado em `app.js:3384-3456`; `resolverEstadoPlano` aceita campos locais de licença em `app.js:8706-8959`. Isso libera menus, PDF, limites, relatórios e telas locais. O impacto backend depende da RLS de cada operação; funcionários já possuem o caminho servidor descrito acima.

### Fraqueza comercial local - Quotas e recompensas são editáveis

`src/services/monetizationLimits.js:60-213` confia em `localStorage` para contadores e desbloqueios. Além disso, a configuração distribuída mantém anúncios desligados e `app.js:2385-2389` permite a ação sem consumo. Limpar/editar a chave reinicia quotas quando o mecanismo é ativado.

## 7. Candidatos suprimidos

- `can_access_app_feature` aceita plano/função fornecidos pelo chamador, mas só devolve JSON e não foi encontrado consumidor backend privilegiado; não é vulnerabilidade explorável isoladamente.
- Estado local do AdMob foi absorvido pelo achado de quotas; anúncios estão desligados e não há efeito servidor independente.

## 8. Cenários de bypass avaliados

- Alterar plano, estado, cache ou `localStorage`: bypass local confirmado.
- Chamar plugin Android com `proAllowed:true`: caminho estático confirmado; falta ensaio em aparelho/modelo.
- Chamar RPC que aceita plano: resposta forjável, mas sem sink privilegiado; suprimido.
- Mutar funcionários diretamente: vulnerável para administrador do próprio tenant.
- Publicar loja como Free/expirado: bloqueado pelo backend.
- Acesso entre empresas: não confirmado; RLS de tenant encontrada como controle.
- Relatórios/estoque/caixa avançado: matriz local existe, mas nem toda operação possui entitlement servidor explícito; requer fechamento por operação na correção.

## 9. Arquitetura recomendada

Criar uma função backend única `authorize_feature(user_id, company_id, feature, requested_action)` que derive usuário, associação, função, plano canônico, status, pagamento, vencimento, cancelamento e uso. Ela deve retornar `authorized`, `plan`, `reason`, `limit`, `used` e `remaining`. RLS/RPC/Edge Function deve chamá-la antes de cada operação paga; nunca aceitar plano, função ou `active` enviados pelo cliente.

O cache frontend deve ser apenas apresentação, curto e revalidado. O APK pode ocultar UX, mas recursos nativos pagos precisam de licença assinada/curta emitida pelo backend ou validação online antes da operação.

## 10. Plano de correção

1. **P0/P1:** aplicar autorização backend em `company_members` e ações de funcionários.
2. **P1:** remover `proAllowed` do contrato do plugin e validar licença backend assinada.
3. **P1:** mapear cada operação paga de estoque, caixa, relatórios, backup/exportação e integrações para uma guarda servidor.
4. **P2:** tornar caches locais incapazes de marcar fonte como “backend-rpc” e revalidar por expiração curta.
5. **P2:** mover quotas comerciais relevantes ao servidor; localStorage fica somente como cache.
6. **P3:** substituir RPC de decisão com parâmetros de plano por wrapper que derive tudo do servidor.

## 11. Arquivos e migrações necessárias

- Nova migração para função central e políticas de `company_members`.
- Revisão de `feature_access_matrix.sql`, `saas_license_authority_phase1.sql` e políticas operacionais.
- `app.js`, `monetizationLimits.js` e `SimplificaFilesPlugin.java`.
- Testes RLS para Free/Start/Pro, expiração, cancelamento e isolamento entre empresas.

## 12. Checklist de conclusão

- [ ] Nenhuma operação paga aceita plano/status/função do cliente.
- [ ] Funcionários exigem PRO ativo no backend.
- [ ] IA nativa não aceita booleano de autorização do JavaScript.
- [ ] Free, expirado e cancelado são negados após o período.
- [ ] Limites são transacionais e por empresa.
- [ ] Loja continua protegida.
- [ ] Testes cobrem chamadas REST/RPC diretas e cross-tenant.
- [ ] APK modificado só altera apresentação, nunca a autorização real.

## 13. Limitações

Não foram executadas mutações destrutivas ou tentativas contra produção. As validações de RLS usaram rastreamento estático, testes existentes e grants/policies versionados. O ensaio do plugin de IA exige aparelho Android e modelo local. Nenhuma correção, migração, commit ou publicação foi realizada nesta auditoria.
