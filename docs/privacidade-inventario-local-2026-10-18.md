# K09 — inventário local de privacidade e exclusão

Data: 18/10/2026. Análise do código versionado na branch
`codex/melhorias-setembro-2026`, a partir de `95745db`. Sem acesso a dados,
Auth, banco ou configuração de produção/staging nesta rodada. Não é formulário
Play preenchido nem comprovação de práticas reais em servidor/aparelho.

## Bloqueadores encontrados no código

| Estado | Item | Evidência e limite |
| --- | --- | --- |
| FAIL local | Exclusão concluída somente como desativação | `supabase/migrations/20260630143000_account_security_email_2fa_and_deletion.sql`, função `process_due_account_deletions`: marca empresa inativa/completed e membros blocked. Não remove Auth, perfis, dados operacionais ou arquivos. Política em `app.js`, `getDocumentoLegal` e `renderExclusaoContaPublica`, anuncia processo de exclusão/anonimização após a carência. Não foi comprovado procedimento adicional manual/automático. |
| PASS integração local; staging PENDENTE | Sucesso sem comprovar gravação | Correção de 18/10 e testes isolados preservados. Em 19/10, nova migration aplicada no esquema completo local e clone descartável: 7 grupos Auth/PostgREST/SMTP reais com handler em Node VM e 9 grupos concorrentes em conexões PostgreSQL independentes PASS. Sem Deno/Edge real, staging ou produção. [Homologação e limites](homologacao-exclusao-local-2026-10-19.md). |
| PENDENTE | Processamento agendado | Migration cria cron apenas se o schema existir e transforma falhas em NOTICE. Existência da função não prova execução diária. Conferir exclusivamente em homologação isolada antes do rollout autorizado. |
| PENDENTE | Escopo de conta vs empresa | `ensureAllowed` restringe exclusão/cancelamento ao proprietário. Definir fluxo para conta pessoal de membro sem apagar dados da empresa ou de outros usuários. Não ampliar autorização automaticamente. |
| NÃO VERIFICADO | Estado realmente implantado | Nenhuma consulta ao ambiente remoto nesta rodada. Uma migration versionada não prova a definição/rotina atualmente em produção. |

A política Google Play exige um caminho no app e um recurso web para solicitar
exclusão; desativação não substitui exclusão dos dados associados. Retenções
legítimas devem ser informadas. Não é obrigatório concluir tudo automaticamente
no app, mas um procedimento manual precisa existir e ser demonstrável.
[Requisitos oficiais de exclusão](https://support.google.com/googleplay/android-developer/answer/13327111?hl=pt-BR).

Não foi implementada purga destrutiva para fazer um teste passar. Antes disso,
inventariar referências/Storage/Backups, contas compartilhadas, dados de outros
titulares, contratos e retenções; aprovar o procedimento e validá-lo com dados
sintéticos. Não apagar assinaturas reais ou marcar `completed` como prova de
eliminação de todos os dados.

## Dados, componentes e permissões

| Categoria | Evidência local | O que falta comprovar/declarar |
| --- | --- | --- |
| Conta e empresa | `account-security/index.ts`, exportação de company/members/profiles/subscriptions/security_events | Nome, e-mail, contato, identificadores e vínculo empresarial. Exportação atual não demonstra cobertura de pedidos, estoque, caixa e arquivos. Não chamá-la de exportação completa de todo ERP sem validar escopo. |
| Pedidos/produção/estoque/caixa | Dados operacionais em `src/features` e schema público versionado | Separar dados pessoais de titular/cliente/funcionário, finalidade, destino, retenção e quem pode excluir. Nenhum conteúdo real foi lido. |
| Diagnósticos | `src/services/diagnosticsService.js:303`, `src/services/errorTelemetry.js:127` | Payloads podem incluir UID/e-mail, tela/ação, versão, plataforma/dispositivo/SO, mensagem e stack sanitizada. Conferir ativação, sanitização e destino efetivos. |
| Contatos do telefone | `SimplificaFilesPlugin.java`, `searchPhoneContacts`, `queryPhoneContacts`, `queryEmailsForContact`; manifesto `READ_CONTACTS` | Nome, telefone e e-mail acessados após permissão. Validar consentimento, escolha do contato e o que é persistido/transmitido; não declarar envio de toda a agenda apenas pela existência da permissão. |
| Avisos de mensagens | `SimplificaNotificationListenerService.java`, `onNotificationPosted`, `baseEvent`, `sendEvent` | Com opt-in, monta origem, título/remetente sanitizado, chave hash e horário e pode enviar ao relay. Não lê EXTRA_TEXT nessa implementação. Política atual não descreve explicitamente esse tratamento; verificar divulgação/consentimento e receptor. |
| Biometria | `MainActivity.java`, plugin de autenticação; manifesto `USE_BIOMETRIC`/`USE_FINGERPRINT` | Código usa API local. Não há evidência aqui de envio de template biométrico. Validar o fluxo sem registrar conteúdo sensível. |
| PDF, JSON e imagens | `SimplificaFilesPlugin.java` e `config-appearance.js` | Downloads locais, imagens de perfil/marca e backup/exportação. Mapear armazenamento remoto e compartilhamento quando acionados. Testes locais não demonstram retenção remota. |
| Publicidade | `@capacitor-community/admob` 8.2.1 em `package.json`; `adsEnabled=false` em `src/config/runtimeFeatures.js` | Flag JS desligada não comprova ausência de inicialização/processamento nativo. Manifesto PlayDebug anteriormente gerado ainda contém AD_ID/AdServices e MobileAdsInitProvider. Verificar o artefato final e comportamento do SDK antes da declaração, sem presumir coleta só por presença. |
| IA/voz no Play | `android/app/build.gradle`, `MainActivity.java`, `src/play/AndroidManifest.xml` | Fontes preservadas; registro IA/voz e microfone removidos no flavor Play. Contratos locais PASS; certificar o artefato final em outra etapa, sem reativar IA. |
| Backup Android/sessão | Manifesto principal `allowBackup=true`; persistências WebView e preferências nativas | Auditar inclusão/exclusão de sessões e dados pessoais no backup/restauração. Não declarar proteção integral só pelo uso de preferências seguras em um componente. |

O formulário deve refletir o comportamento real do app e dos SDKs. Este mapa
não autoriza declarar “nenhum dado coletado” nem classifica automaticamente
toda transferência a provedor como compartilhamento publicitário.
[Orientação oficial sobre Segurança dos dados](https://support.google.com/googleplay/android-developer/answer/10787469?hl=pt-BR).

## Páginas e canal de suporte

Rotas locais `/privacy`/`/privacidade` e
`/excluir-conta`/`/exclusao-de-conta`/`/account-deletion` existem em
`vercel.json` e `app.js`. O recurso público menciona Simplifica 3D, oferece
mailto ao suporte cadastrado no projeto e indica o caminho dentro do app.

| Estado | Validação |
| --- | --- |
| PASS local limitado | `test-play-account-deletion.js` confirma contratos textuais de rotas/conteúdo; `test-account-security-activation.js` confirma contratos de schema/ações. Não comprovam execução da exclusão ou entrega de e-mail. |
| PASS local limitado | `test-phase3-privacy-analytics.js` exercita consentimento e limpeza de PII legada em ambiente simulado; não é prova de coleta real do pacote Android. |
| NÃO VERIFICADO | Carregamento público efetivamente publicado, sem login/erro, em outro navegador; disponibilidade da caixa de suporte e atendimento da solicitação. |
| NÃO VERIFICADO | Conta Play Console, declaração final de dados/SDKs, consentimentos e prazos de retenção aprovados pelo responsável. |

A política precisa corresponder às práticas reais e estar publicamente
acessível; não basta o texto estar no repositório.
[Política oficial de dados do usuário](https://support.google.com/googleplay/android-developer/answer/10144311?hl=pt-BR).

## Sequência antes do webhook

1. Repetir em staging autorizado com Edge/Deno real e UI a confirmação/cancelamento
   já homologada localmente com OTP, esquema completo e concorrência em 19/10.
2. Aprovar e implementar/comprovar o procedimento real de exclusão/anonimização,
   retenções e recuperação, sem apagar dados reais durante testes.
3. Conferir SDKs/backup/permissões e divulgar exatamente os dados tratados.
4. Validar canais públicos e formulário Play, sem publicar/enviar nada ainda.
5. Depois das demais frentes: webhook/Edge/Mercado Pago de teste. Não adiar
   correções de privacidade por dependerem de outra parte do backend.

K09 segue **PENDENTE/FAIL local nos pontos restantes**, não concluído. O inventário
inicial não realizou operações de banco; a correção de 18/10 usou PGlite em memória.
Em 19/10, a homologação avançou ao esquema completo local, Auth/PostgREST/SMTP reais
com handler em Node VM e concorrência SQL independente. Não é Edge/Deno, Supabase
remoto ou exclusão definitiva. As skills Supabase/PostgreSQL orientaram a separação
entre código, autorização, transação e evidência de cada ambiente.
