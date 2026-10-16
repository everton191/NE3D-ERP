# Homologação no navegador — licenças e persistência

Data: 16/10/2026. Branch `codex/melhorias-setembro-2026`, base `221062e`.

## Resultado

Os fluxos de licença manual passaram na interface, com Auth/API/PostgreSQL locais reais. A homologação encontrou duas falhas adicionais: espelho de vencimento desatualizado em `clients` e painel de perfil persistindo sobre o login após logout. O editor de cards usa `prompt()`, não suportado pelo navegador integrado, e não foi aprovado por UI.

Esta rodada é de verificação e preparação do ambiente. Não alterou código de negócio, frontend do produto, CSS, migrations ou produção. As falhas descobertas não foram corrigidas por suposição nem ocultadas pelos testes estáticos que passaram.

## Ambiente e isolamento

- Supabase local nativo em WSL, Auth/PostgREST/PostgreSQL completos, API `http://127.0.0.1:28065`.
- Aplicativo original servido em `http://127.0.0.1:4187` e `http://127.0.0.1:4188`, com configuração pública local antes de carregar app.js.
- As duas origens isolam localStorage/sessionStorage e sessões Auth. São duas sessões no mesmo navegador integrado, **não dois navegadores distintos**. Chrome constava no inventário, mas os métodos documentados de criação/seleção retornaram indisponível; essa linha não foi repetida indefinidamente.
- Proxy encaminha somente Auth/REST à origem local validada. CSP bloqueia conexões/fontes externas; arquivos sensíveis e redirecionamentos externos do proxy são negados. Apenas a chave pública local chega ao navegador.
- Quatro contas sintéticas com empresas independentes foram criadas; interações de UI utilizaram superadmin e cliente inicialmente Free. Start e Pro adicionais serviram como controles independentes na releitura autenticada.
- Edge Functions e service worker foram explicitamente indisponibilizados. Não houve simulação de autorização, licença ou DOM da aplicação. Isso é teste web, não certificação PWA, Edge/Deno ou gateway.
- Nenhum botão de contratação/cobrança foi acionado: CSP de conexão não garante bloquear window.open, e o frontend ainda possui fallback externo de checkout.

## Testes executados

| Cenário | Estado | Evidência |
| --- | --- | --- |
| Login real de superadmin | PASS | Autenticação pela UI, autorização remota real e painel com as empresas locais. Senha não foi salva no navegador. |
| Login real do cliente | PASS | Conta comum abriu o ERP; apresentação inicial foi pulada pelo controle normal. |
| Validade vencida | PASS | UI rejeitou `2020-01-01` com “Informe uma data de vencimento futura”, sem alteração de plano. |
| Free → Start | PASS | Superadmin concedeu Start até 15/11/2026; segunda sessão passou a exibir Start após recarregar. |
| Start → Pro | PASS | Concessão até 01/12/2026 persistiu no banco e apareceu na segunda sessão. |
| Logout e novo login: licença | PASS | Nova autenticação do cliente manteve Pro; releitura API independente confirmou ACTIVE/Pro. A limpeza visual do logout falhou separadamente. |
| Acrescentar dias ao Pro | PASS | Sete dias estenderam 01/12 para 08/12, sem substituir a base pela data atual. Motivo e confirmação foram preenchidos na UI normal. |
| Falha de conexão | PASS | Apenas o servidor de teste 4187 foi interrompido. Tentativa de Free retornou “Falha ao atualizar: Failed to fetch”, manteve Pro/08/12 e não informou sucesso. Supabase e segunda origem permaneceram disponíveis durante essa simulação. |
| Recuperação e retorno ao Free | PASS para licença | Reiniciado o servidor, operação normal passou. Segunda sessão mostrou Free; RPC autenticada retornou FREE e validade nula. Espelho do cliente ficou incoerente, descrito abaixo. |
| Acesso administrativo por conta comum | PASS | Navegação para `/superadmin` exibiu “Acesso negado”, perfil sem permissão; retorno ao dashboard permaneceu Free. |
| Leitura dos cards/preço comercial | PASS leitura | Catálogo foi carregado pela UI e relido pela API; preço comercial permaneceu igual ao snapshot anterior. |
| Gravação de cards pela UI | NÃO VERIFICADO | Clique em “Editar apresentação” produziu `Error: prompt() is not supported` em app.js:27397; nenhum formulário abriu ou card foi gravado. Não confundir com os testes API anteriores. |
| Dois navegadores/aparelhos | PENDENTE | Foram usadas duas origens no navegador integrado; Chrome/dispositivo físico não foram certificados. |
| Capturas de tela/pixels | NÃO VERIFICADO | As duas APIs documentadas de captura falharam com “Unable to capture screenshot”, inclusive com visibilidade ativada. Foram preservadas evidências DOM reais, sem fabricar imagem. |
| Harness e regressões existentes | PASS | Teste independente do servidor, sintaxe, build web, homolog-safety, manual-plan-licenses e plan-presentation-persistence. Os dois últimos não cobriam as falhas novas de UI/espelho. |
| Limpeza | PASS | Quatro Auths/empresas/clientes sintéticos removidos por IDs e vínculo verificados; sessões revogadas; auditoria preservada; preço/metadados originais do card confirmados; arquivo temporário de credenciais removido. |

## Falhas reais identificadas

### 1. Espelho de validade antigo no cliente

**FAIL.** Depois de Pro até 01/12, acréscimo até 08/12 e retorno explícito a Free, a releitura por uma sessão Auth independente encontrou:

```text
get_effective_license: active_plan=free, effective_status=FREE, validade=null
subscriptions: active_plan=free, premium_until=null, plan_expires_at=null,
               current_period_end=null, expires_at=null
clients: active_plan=free, plan_expires_at=2026-12-02T02:59:59+00:00
```

A data UTC corresponde a 01/12 às 23:59:59 em Fortaleza. O painel da empresa exibia Grátis e preço R$ 0, mas “Vencimento do plano: 01/12/2026”. Não houve concessão paga indevida na licença efetiva; existe inconsistência persistida e exibida, não apenas atraso de renderização.

O helper manual da migration `20261011151202_normalize_manual_plan_licenses.sql` atualiza as datas de `subscriptions`, mas seu UPDATE de `clients` não espelha nem limpa `plan_expires_at`. O marcador administrativo posterior não corrige esse espelho. Próxima correção deve ser uma migration nova, preservando auditoria, autorização e bloqueios, com teste que compare os campos em ambas as tabelas após concessão, acréscimo e Free. Não editar migration histórica.

### 2. Perfil permanece aberto após logout

**FAIL.** Em duas ocorrências, “Sair” exibiu a tela de login, mas o diálogo “Perfil e conta” continuou aberto com nome/e-mail sintéticos e plano anterior. Fechar o diálogo manualmente liberou a tela. Nova autenticação confirmou que a licença não havia sido removida.

O botão do perfil chama `logoutUsuario()` sem fechar o popup; o fluxo em app.js:29401 limpa o estado da sessão e renderiza, mas não encerra esse overlay. A correção deve fechar overlays de conta no caminho central de logout e testar que nenhum diálogo com identidade anterior permanece na tela. A mensagem técnica “Subscription encerrada” também apareceu; não foi alterada nesta auditoria.

### 3. Editor usa prompt nativo

**PENDENTE / limitação comprovada neste ambiente.** `editarPlanoApresentacaoSuperadmin` e `editarPrecoExibidoPlanoSuperadmin` dependem de `prompt()`. O navegador integrado rejeita essa API. Isso não prova falha no Chrome normal; o teste nele não ficou disponível. Foi solicitada autorização para reutilizar o formulário controlado já existente no app, mantendo os mesmos campos e regras. Nenhuma troca foi feita nesta rodada.

## Arquivos e evidências

Arquivos adicionados: `scripts/serve-licensing-browser-homolog.js`, `scripts/test-licensing-browser-homolog-server.js`, `scripts/licensing-browser-homolog-fixtures.js` e este relatório. `package.json` ganhou os comandos do harness/fixtures.

Evidências locais geradas, ignoradas pelo Git, em `artifacts/browser-licensing-20261016/`: renovação Pro confirmada, leitura na segunda sessão, retorno Free, falha de conexão, negação de superadmin, painel remanescente no logout e `authenticated-api-observations.json`. Não contêm senhas ou tokens. O ledger temporário que continha senhas aleatórias locais foi removido na limpeza.

A stack estava desligada no início. A primeira recuperação encontrou um PID-file antigo; ausência de processo/socket e `pg_ctl status` foram confirmados antes de preservar a trava com outro nome. O ambiente voltou a ficar indisponível durante o encerramento; uma recuperação controlada permitiu concluir a limpeza e parar a stack preservando os bancos. Não foi comprovada a causa da interrupção. Não houve reset ou descarte de volumes; as exclusões ficaram restritas às identidades exatas deste ensaio.

A versão final do harness também verifica a allowlist depois de resolver links, impedindo que um atalho em assets exponha artifacts, scripts, Supabase ou OptiCore. O teste com junction real temporária no Windows passou; essa alteração é exclusiva da infraestrutura de testes, não do aplicativo.

Para repetir, configurar exclusivamente as variáveis `S3D_LOCAL_SUPABASE_*`, criar fixtures com `npm run homolog:browser:fixtures -- setup`, iniciar origens novas com `npm run homolog:browser:serve -- <porta>`, verificar com `npm run homolog:browser:fixtures -- verify` e concluir com `npm run homolog:browser:fixtures -- cleanup`. O servidor exige alvo local; não carregar .env de produção. Utilizar portas novas ou um perfil limpo para não reutilizar caches de outro ensaio.

## Próxima rodada

Corrigir espelho de vencimento e encerramento de overlays no logout; decidir adaptação do editor; repetir estes cenários e a edição/gravação de cards na UI. Depois, validar em Chrome/outro navegador, staging isolado, Edge real e Mercado Pago sandbox. PWA/offline completo, layout em pixels, aparelhos físicos e publicação continuam pendentes. **Não READY TO PUBLISH.**
