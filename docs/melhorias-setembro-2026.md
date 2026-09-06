# Melhorias Simplifica 3D — setembro de 2026

## Entrega e publicação

Pedido: implementar incrementalmente e guardar localmente para uma publicação conjunta.
Branch: `codex/melhorias-setembro-2026`. Base: `4c0a839`.
Não enviar commits ao GitHub, publicar Vercel ou aplicar migrações em produção nesta fase.
Arquivos não rastreados anteriores ao trabalho devem ser preservados e excluídos dos commits.

## Etapas

1. Persistência: densidade padrão, tema entre aparelhos, edição pendente, formulário parcial e troca de sessão.
2. Segurança: verificar isolamento real, autorização do segundo fator no servidor, RPCs e restauração de backup; preparar correções locais.
3. Desempenho: medir baseline; otimizar salvamento e carregamento por módulo sem reescrita global.
4. Usabilidade: consolidar o fluxo orçamento, aprovação, produção, entrega e recebimento.
5. Diferenciais: aproveitar bases existentes para lucro realizado, aprovação por link e reserva de material.
6. Produção e IA: planejar capacidade, avaliar integrações e validar ações com confirmação.
7. Regressão integrada e publicação conjunta somente após validação das etapas.

## Primeiro lote — implementado e validado localmente

- Aceitar explicitamente densidade `default` na normalização e no recebimento remoto.
- Preferir tema remoto quando não há edição local pendente, atualizando o cache de inicialização.
- Recusar leitura remota durante uma edição pendente.
- Preservar checkboxes ausentes em formulários parciais.
- Persistir a marca de pendência antes de tentar salvar preferências Free na rede.
- Descartar leitura que terminou depois de uma troca de usuário.
- Testes comportamentais em `scripts/test-settings-persistence-behavior.js`.

Validação de 2026-09-05: 6 testes comportamentais passaram, além de lint, typecheck, theme-account-ui, theme-isolation, build:web e git diff --check. Nenhuma escrita em produção foi realizada.

## Pendências e limites

## Fase 2 — lote local de 2026-09-06 (parcial)

- Exportação em `account-security`: exige sessão de segundo fator válida quando habilitado; falhas de consulta bloqueiam a operação; eventos exportados limitados ao usuário e à empresa; respostas com `Cache-Control: no-store`.
- Seis testes comportamentais da função passaram, incluindo falta de autenticação, segundo fator ausente/válido/desabilitado e falhas nas consultas de segurança. Dependências simuladas, sem conexão de produção.
- Restrição de autoridade dos perfis preparada SOMENTE como rascunho em `docs/security/drafts/20260906151531_phase2_profile_authority_guard.sql`, fora das migrações automáticas. Teste SQL em PostgreSQL local em memória confirmou 12 escritas proibidas, edição pessoal permitida, isolamento de dois usuários, service_role preservado e reaplicação.
- Bloqueio de compatibilidade identificado: `atualizarStatusPerfisClienteSupabase`, `atualizarFlagTesteClienteSaasSupabase` e `atualizarAnonimizacaoClienteSaasSupabase` ainda fazem PATCH direto de campos protegidos. Migrar esses fluxos para operações autorizadas no servidor e testar antes de promover o rascunho para migração. Não ampliar permissões para contornar a proteção.
- Validações: account-security-activation, employee-entitlement-authority, phase3-rpc-hardening, lint, typecheck, build:web e diff --check passaram. A checagem TypeScript do frontend não certifica os tipos da Edge Function.
- Testes reproduzíveis: `node scripts/test-phase2-security-behavior.js`; `node scripts/test-phase2-profile-sql.js <diretorio-externo-com-pglite-0.5.8>`. Nenhuma dependência adicionada ao produto. A fixture SQL é reduzida, não uma restauração completa do Supabase.
- Auditoria parcial: scan `85fac0f4-6c18-444b-bd2b-67a532f6ef78`, snapshot `150cf2c1b443dc13105e14e46676229c48507a2c`. Dois achados: autoridade de perfis e autorização da exportação. Não equivale a auditoria completa das RPCs.
- Próximo lote: compatibilidade administrativa da restrição de perfis, revisão das demais RPCs e cobertura MFA, restauração de backup e E2E real com dois usuários/lojas. Nenhuma alteração publicada ou aplicada no backend; não recalcular SAFE_TO_PUBLISH como aprovado.

## Limites gerais

## Fase 3 — primeiro lote de desempenho (2026-09-06)

- `garantirNumeracaoSequencialPedidos` evita construir conjunto e ordenar cronologicamente a lista inteira quando todos os pedidos já têm números válidos. Essa rotina é chamada ao obter a numeração de cada card. Não utiliza cache por referência, preservando a detecção de alterações e inclusões na mesma lista.
- Teste reproduzível: `node scripts/test-phase3-order-performance.js`; comparação com a implementação do commit `6269281`. Oito cenários de equivalência e testes de inclusão/edição em memória passaram.
- Baseline local em Node: 5.000 pedidos previamente numerados, 30 chamadas por amostra, mediana de cinco amostras após aquecimento: 346,28 ms antes e 76,15 ms depois (4,55x no helper). Não é medição de FPS, startup, dispositivo mobile ou tela completa; tempos variam por máquina.
- Lint, typecheck e build:web passaram. Não foram alterados layout, dependências, backend ou política de gravação síncrona.
- Salvamento examinado: o snapshot por usuário ainda serializa todos os dados e inclui savedAt em cada gravação. Otimização desse caminho fica pendente de testes de durabilidade, troca de conta e múltiplas abas; não introduzir debounce que possa perder dados.
- Restam na fase 3: baseline real no navegador/mobile, carregamento por módulo e otimização segura do salvamento. Este lote não encerra a fase nem remove os bloqueios da fase 2. Publicação continua suspensa para o pacote conjunto.

## Pendências gerais de certificação

As etapas 2 a 7 não estão concluídas. Este documento não é certificação de publicação.
O teste local com dependências simuladas não substitui dois navegadores autenticados, teste offline real ou isolamento RLS.
Próximo trabalho de persistência: serializar gravações rápidas em voo e proteger conclusão assíncrona após troca de conta; revisar todos os chamadores do salvamento remoto.
Antes da publicação: conferir migração de preferências antigas, cache/service worker, Android e web; renovar identificador dos assets no lote final.
