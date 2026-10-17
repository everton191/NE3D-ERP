# Simplifica 3D — fechamento local do editor e catálogo de planos

Data: 16/10/2026. Branch confirmada: `codex/melhorias-setembro-2026`.
Checkpoint inicial desta continuação: `4c36d32`.
Decisão do proprietário: **continuar somente com as correções locais**.
**Publicação NÃO liberada.** Este relatório complementa, sem substituir,
[o fechamento inicial](fechamento-publicacao-2026-10-16.md) e atualiza
[o Kanban](KANBAN-PUBLICACAO.md).

## Correções e causas verificadas

1. **PASS local — editor utilizável.** Os comandos usavam vários `prompt()`
   nativos, que não permitiam concluir a edição no navegador integrado. Agora
   usam um formulário no popup/UiV3 existente, sem CSS novo: nome, título,
   descrição, benefícios multilinha, selo e texto do botão. Preço informativo
   continua em comando separado; nunca é enviado como preço de cobrança.
2. **PASS automatizado — ciclo de vida.** Fechar, cancelar, Escape, histórico,
   fechamento UiV3 e logout resolvem a edição e liberam listeners/bloqueio.
   Submissões repetidas e outro comando durante gravação/releitura não duplicam
   a operação. O teste encontrou acesso ao formulário já removido no segundo
   submit; um guard de conclusão corrige isso. Limites seguem os da RPC.
3. **PASS local — dependências dos comandos.** O módulo administrativo usava
   `deps` sem recebê-lo em oito funções, embora os wrappers já o enviassem.
   Isso causava `ReferenceError`, inclusive em Atualizar catálogo. Foram apenas
   completadas as assinaturas; corpos, autorização, payloads e RPCs preservados.
   O loader foi exercitado na UI/API; os outros sete comandos têm teste runtime
   com rede simulada, não prova de execução administrativa remota/destrutiva.
4. **PASS local — classificação do catálogo.** Aliases legados inativos podiam
   substituir ID/estado de FREE/START/PRO conforme a ordem recebida. Além disso,
   a sincronização normalizava cada linha antes da escolha, apagando sua origem
   e convertendo variantes desconhecidas em Free. Agora a mesclagem mantém os
   slugs originais até a resolução canônica; só depois normaliza/persiste.
   Registros canônicos prevalecem, inclusive desativação explícita. Fallback
   legado sem registro canônico, preços e capacidades padrão foram preservados.
   Cache contaminado se recupera quando o catálogo completo é relido.

## Ambiente e evidência end-to-end

- Supabase **local nativo no WSL Ubuntu 24.04**, CLI 2.120.0, Auth,
  PostgreSQL/PostgREST e RLS no banco completo `postgres` já preparado nas
  rodadas anteriores. API `127.0.0.1:28065`; proxies exclusivamente loopback.
- Nenhuma migration nova nem aplicada nesta continuação. A migration de espelho
  de validade de K01 já estava instalada; testes SQL/API validaram seu uso.
- Navegador integrado: edição dos seis campos, gravação, preço informativo,
  cancelamento, recarga, fechamento por Escape, logout limpo e novo login.
- Falha real: somente o proxy web local foi interrompido antes de Salvar.
  A interface exibiu falha, não sucesso; valor offline não chegou ao banco.
  Proxy reiniciado, leitura autenticada independente confirmou recuperação.
- Cliente Supabase autenticado independente releu todos os seis campos e
  `priceLabel` iguais aos editados na UI; textos cancelado/offline ausentes.
  `plans.price` permaneceu exatamente igual ao snapshot anterior.
- Atualizar catálogo executou a RPC autenticada e mostrou sucesso. Depois da
  correção da sincronização, cards locais e catálogo indicaram os mesmos estados
  ativos para os três planos presentes neste banco; antes Free/Pro apareciam
  incorretamente inativos na seção local. Não foram alterados estados no banco.

Artefatos locais ignorados pelo Git, sem senhas/tokens:

- `artifacts/browser-plans-k03-20261016/controlled-form.png`
- `artifacts/browser-plans-k03-20261016/controlled-form-ax.txt`
- `artifacts/browser-plans-k03-20261016/presentation-saved.png`
- `artifacts/browser-plans-k03-20261016/logout-clean.png`
- `artifacts/browser-plans-k03-20261016/logout-clean-ax.txt`
- `artifacts/browser-plans-k03-20261016/catalog-before-sync-fix.png`
- `artifacts/browser-plans-k03-20261016/catalog-after-sync-fix.png`
- `artifacts/browser-plans-k03-20261016/catalog-after-sync-fix-ax.txt`
- `artifacts/browser-plans-k03-20261016/authenticated-api-observations.json`

**Limites:** novas sessões no mesmo navegador e um cliente API independente
não são dois navegadores/aparelhos distintos. O proxy bloqueia rede externa,
gateway, service worker e serviços não necessários: não certifica checkout,
PWA completo, Edge Functions ou Android. O teste chamado “second device” em
uma suíte unitária representa simulação, não aparelho físico.

## Testes executados

| Estado | Teste / evidência | Alcance |
| --- | --- | --- |
| PASS | `test:plan-presentation-editor` | Funções reais de edição/save/readback; DOM/rede isolados, cancelamentos, validação, autorização perdida, concorrência, erro/ack inválido/offline/releitura divergente sem sucesso falso. |
| PASS | `test:plan-catalog-canonical-precedence` | 5.040 permutações e oito sincronizações reais em memória; cache contaminado, canônicos ativos/desativados, IDs, repetição, legado e capacidades/preços. RED no merge e no sync anteriores; GREEN corrigidos. |
| PASS | `test:superadmin-plan-catalog-loader` | Dependência recebida, RPC autenticada, falta de sessão/papel e erro; RED no checkpoint inicial. Rede simulada. |
| PASS | `test:saas-admin-command-bindings` | Sete comandos, parâmetros/rejeições/payloads. Rede e exclusão simuladas, sem apagar dados externos. RED antes dos parâmetros. |
| PASS | `test-licensing-supabase-api.js local` | Auth/API reais: Free/Start/Pro, validade obrigatória/futura, renovação, repetição/concorrência, espelhos de datas, proteção Mercado Pago, negações administrativas/RLS/escalonamento, campos comerciais proibidos, persistência, falha/recuperação, auditoria e vencimento com rebaixamento único. Cinco usuários sintéticos limpos. |
| PASS | `licensing-browser-homolog-fixtures.js verify` | Licença efetiva e datas por sessões reais Free/Start/Pro; superadmin retornou Pro por seu papel autorizado. Card Start relido, preço cobrado intacto. |
| PASS | UI real local e API independente | Gravação dos seis campos e preço, cancelamento, falha do proxy, recarga/novo login, logout e catálogo conforme seção anterior. |
| PASS | `test:licensing-postgres-isolated` | SQL, autoridade/ACL, espelhos, RLS e apresentação em PostgreSQL isolado. Não substitui Auth/API acima. |
| PASS | Regressões frontend/planos | `test:plan-capabilities`, `test:plan-persistence`, `test:plans-ui`, `test:plan-presentation-persistence`, `test:plans-presentation`, `test:manual-plan-licenses`, `test-plan-normalizers.js`. |
| PASS | Regressões de sessão/UI | `test:logout-account-overlays`, `test:auth-hotfix`, `test:auth-ui`, `test:profile-admin-separation`, `test-auth-session-boundary.js`, `test:ui-v3-foundation`, `test:theme-account-ui`. |
| PASS | Gates locais de distribuição/harness | `test:prepublication-p0`, `test:play-ai-disabled`, `test:play-no-self-update`, `test:play-no-external-checkout`, `test:play-account-deletion`, `test:licensing-browser-harness`. Contratos locais, não certificação Play. |
| PASS | `test-app-js-finalization.js` | Proibição de roteador global duplicado mantida. Expectativa antiga distinguida do único listener temporário do formulário, cuja remoção/cancelamento é testada dinamicamente. Nenhuma suíte desabilitada. |
| PASS | Sintaxe, diferenças e `build:web` | Build web sem GGUF local; não gerou APK/AAB nem sincronizou Android. |
| PENDENTE | Dois navegadores/aparelhos, Edge/sandbox remoto e Android Play | K05/K07/K08; sem evidência nova de aprovação. |

## Restauração e preservação

- Quatro contas fictícias da UI removidas por IDs e identidades verificados,
  com revogação das sessões; ledger de credenciais gerado removido. A suíte API
  removeu seus cinco usuários separadamente. Auditoria preservada.
- Metadata original do card Start restaurada com comparação prévia/CAS e
  releitura exata; preço comercial original confirmado. `plans.updated_at`
  pode refletir o teste/restauração, portanto não se alega hash integral idêntico
  de `plans`. Nenhum preço/contrato real alterado.
- Antes/depois: `clients` manteve 11 linhas e hash completo ordenado
  `282be9f03109f21c4dd06e997c75ac15`; `subscriptions`, 11 linhas e
  `52878f3f4a48fcff29e48de64300c0e9`. Dados anteriores preservados.
- Abas e proxies de teste encerrados; stack local parada preservando bancos,
  sem reset/exclusão de volumes. Artefatos de prova não contêm credenciais.

## Arquivos e limites da entrega

- `app.js`: formulário, ciclo de vida, precedência canônica e dependência do sync.
- `src/features/saas/saas-admin-commands.js`: oito parâmetros faltantes.
- `src/features/security/security-audit-commands.js`: resolver catálogo antes da
  normalização que perde o slug original.
- Quatro novos testes acima; `scripts/test-app-js-finalization.js` ajustado
  estritamente ao listener temporário; `package.json` registra os novos testes.
- Este relatório e `docs/KANBAN-PUBLICACAO.md`.
- `apps/opticore` já estava alterado: preservado e fora dos commits. Sem CSS,
  Home, calculadora, carrossel, IA, dependências, assinatura Android ou migrations.

Checkpoints locais, criados somente após os testes PASS:

- `85fe056` — parâmetros dos comandos administrativos e dois testes runtime.
- `183ccdb` — formulário, sincronização canônica, regressões e atalhos dos testes.
- Relatório e Kanban em commit documental separado; nenhum push executado.

## Pendências e prontidão

**K03/K04 concluídos apenas localmente.** Antes da escolha local-only, o inventário
remoto somente leitura não listou projetos acessíveis; isso não prova que o staging
foi apagado. Configuração local não correspondia ao staging esperado e sandbox
não estava disponível com as confirmações exigidas. Não corrigimos/apontamos
credenciais por suposição e não executamos reativação, deploy ou escrita remota.

Restam: acesso seguro ao staging/sandbox e execução Edge real (K05), revisão
controlada de históricos (K06), dois navegadores/aparelhos distintos (K07), pacote
Play no aparelho e compatibilidade nativa/16 KB (K08), privacidade/Console (K09),
implantação autorizada com backup/rollback (K10) e AAB assinado/envio somente em
etapa expressamente autorizada (K11). Não houve push, produção ou publicação.
