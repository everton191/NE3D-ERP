# Bugs e riscos atuais

Data: 2026-05-04
Branch: `fix/stability-auth-superadmin-onboarding`

## Criticos

1. Superadmin ainda depende de `syncConfig.supabaseAccessToken` para carregar clientes remotos.
   - Sintoma: a aba de clientes pede login Supabase para a conta do superadmin.
   - Impacto: parece que nao existem clientes, mesmo quando a falha e sessao/permissao.
   - Correção prevista: usar sessao Supabase restaurada corretamente para superadmin e backend/RPC seguro para operacoes sensiveis.

2. Sessao persistente nao esta completa.
   - Tokens Supabase sensiveis ficam em `sessionStorage`.
   - Cache em `localStorage` nao guarda refresh token.
   - `adminLogado` tambem usa `sessionStorage`.
   - Impacto: app/superadmin podem sair ao fechar/reabrir, ou perder acesso remoto.
   - Status: Etapa 3 adicionou refresh token no cache local e removeu logout automatico por inatividade. Falta validar em navegador/APK real.

3. Acoes administrativas sao principalmente locais.
   - Bloquear/desbloquear, alterar plano e excluir cliente alteram arrays locais.
   - Impacto: o Supabase pode continuar diferente do painel.
   - Correção prevista: criar RPC/Edge Function protegida para operacoes administrativas.

4. Modelo de empresa/conta ainda nao existe.
   - Nao ha `companies` nem `company_members`.
   - Impacto: faltam isolamento por empresa, dono da conta e funcionarios com papeis.
   - Status: migration local criada na Etapa 2. Falta aplicar e validar em staging/remoto.

5. Backup/sincronizacao ainda pede configuracao tecnica.
   - Campos de URL, token, URL/chave Supabase, senha Supabase e Google Drive aparecem para usuario final.
   - Impacto: experiencia confusa e risco de suporte/erro operacional.
   - Status: Etapa 7 ocultou esses campos da experiencia do cliente e deixou Supabase como destino padrao. Falta teste visual/web/APK.

6. Migrations novas ainda nao estao aplicadas no Supabase remoto.
   - `supabase migration list --linked` mostrou pendentes:
     - `20260504111204_account_companies_members_sync.sql`;
     - `20260504120234_onboarding_initial_flow.sql`.
   - Impacto: o remoto ainda nao tem o modelo novo de empresas/membros/sync/onboarding.
   - Status: `db push --dry-run` nao concluiu por timeout e depois por `ECIRCUITBREAKER` no pooler remoto. Nao foi aplicado schema em producao.

7. Supabase local nao esta disponivel neste ambiente.
   - `supabase status` falhou porque o Docker local nao esta rodando/acessivel.
   - Impacto: testes locais com banco Supabase completo ainda nao foram executados.
   - Status: validacoes estaticas e REST remoto passaram, mas falta staging/local real.

## Importantes

1. Busca no superadmin chama `renderApp()` a cada tecla.
   - Impacto: no mobile pode fechar teclado, perder foco e voltar ao topo.
   - Correção prevista: debounce e renderizacao/preservacao de foco/scroll.
   - Status: Etapa 5 trocou para filtro direto nas linhas, com debounce. Falta teste visual em mobile/APK.

2. Listagem remota do superadmin usa `limit=1000`.
   - Impacto: nao escala e vai contra a otimizacao de contexto/paginacao pedida.
   - Correção prevista: paginar com limite menor e filtros.

3. Cadastro ainda nao segue o fluxo em 2 etapas.
   - Hoje coleta nome, email, senha, confirmacao, negocio e telefone numa tela.
   - Falta separar campos obrigatorios e opcionais, incluindo CNPJ opcional.

4. Onboarding inicial nao existe.
   - Faltam `onboarding_completed`, `onboarding_step` e `setup_completed`.
   - Impacto: cliente novo nao e guiado ate o primeiro pedido.
   - Status: Etapa 8 implementou migration e fluxo local. Falta validar visualmente e aplicar em staging/remoto.

5. Exportacao local usa nome antigo.
   - Nome atual: `backup-erp-3d.json`.
   - Nome desejado: `backup-simplifica3d-email-data.json`.
   - Status: Etapa 7 alterou a exportacao para `backup-simplifica3d-EMAIL-DATA.json`.

6. Google Drive aparece mesmo nao estando pronto como integracao final.
   - Deve ser ocultado/desativado por feature flag.
   - Status: Etapa 7 adicionou `ENABLE_GOOGLE_DRIVE_BACKUP = false` e removeu a UI do usuario final.

7. Flag de troca de senha precisa revisao.
   - Ha uso de `must_change_password` e condicoes locais.
   - Risco: pedir troca de senha repetidamente se a flag nao for limpa no banco.

8. Avisos antigos no lint remoto.
   - `register_saas_client` ainda tem variavel/parametro de trial nao usados.
   - `redeem_promotional_token` ainda tem parametro `p_codigo` nao usado.
   - Risco: baixo para execucao atual, mas indica codigo legado que deve ser limpo com cuidado em rodada propria.

## Ja existente e aproveitavel

- Trigger `handle_new_saas_auth_user` cria registros SaaS quando Auth cria usuario.
- RPC `sync_saas_user_after_login` tenta completar `clients`, `profiles`, `erp_profiles` e `subscriptions`.
- Ha backfill SQL idempotente para usuarios antigos.
- Ha tratamento visual basico para estado de clientes remotos.
- Assistente local ja limita mensagens recentes a 20.

## Fora do escopo desta rodada imediata

- Reestruturar planos novamente. A parte de planos ja foi simplificada; agora so sera ajustada se for necessario para auth/superadmin/permissoes.
- Alterar Mercado Pago de forma ampla sem teste especifico.
- Atualizar APK ou mergear para branch principal antes dos testes.
