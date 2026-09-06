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

## Fase 4 — primeiro lote de usabilidade (2026-09-06)

- Detalhe do pedido: os quatro botões simultâneos de status foram reunidos em “Atualizar etapa”, reutilizando o diálogo compacto existente. O menu informa o status atual e permite abrir Financeiro e cobrança.
- Mantidas as ações atuais de liberação de produção e atualização de status. Não foram criadas transições automáticas, aprovação remota ou regras financeiras; “Marcar status como pago” não é uma nova integração de recebimentos.
- O pedido é consultado novamente após fechar o diálogo para impedir ação sobre registro removido ou cancelado nesse intervalo. Permissões e validações continuam nos handlers existentes.
- CSS restrito ao botão único da faixa de ações, ocupando as colunas disponíveis sem alterar outros conjuntos de botões.
- `node scripts/test-phase4-order-workflow.js`: 11 verificações passaram; lint, typecheck, build:web e diff --check passaram.
- Validação visual não realizada neste lote. Testar detalhe e menu em desktop e mobile 360/390/412 px, teclado/foco/fechamento e executar o fluxo com pedido de teste. Faltam a consolidação completa de orçamento/aprovação e a separação entre etapas operacionais e recebimento. Fase 4 parcial; alterações somente locais.

## Certificação ainda pendente

## Fase 5 — primeiro lote de diferenciais (2026-09-06)

- Detalhe do pedido agora apresenta entradas, saídas, saldo de caixa e quantidade de lançamentos vinculados, além da rentabilidade estimada existente. Reutiliza os estilos existentes e a classificação de cancelamento do caixa.
- Associação estrita por pedidoId/pedido_id/orderId (IDs numéricos ou texto). Não associa por descrição, cliente ou coincidência de valor. Lançamentos cancelados/excluídos, tipos desconhecidos e valores inválidos são descartados; somas em centavos.
- Texto explícito distingue saldo de caixa de lucro realizado. Ausência de vínculo não comprova ausência de pagamento. A visão depende dos registros locais carregados; não certifica conciliação bancária nem integralidade dos custos.
- Nenhuma cobrança, baixa/reserva de estoque, escrita no backend ou modificação dos lançamentos. Migração automática de vínculos antigos não foi feita.
- `node scripts/test-phase5-order-cash.js`, lint, typecheck, build:web e diff --check passaram. Cobertos aliases de ID, cancelamentos, outro pedido, valores inválidos, precisão decimal, saldo negativo e ausência de mutação.
- Pendentes: conferência visual desktop/mobile, comparação com caixa de pedidos reais de teste, apuração completa de custos realizados, aprovação por link com autorização e reserva de material com liberação/idempotência. Fase 5 parcial, sem publicação.

## Limites de publicação

## Fases 6 e 7 — validação parcial no Zenfone 8 (2026-09-06)

- Aparelho ASUS_I005DA conectado por ADB. APK debug 1.0.39 (67) atualizado com install -r, sem limpar dados. Versão mantida porque este não é um release; artefato local final SHA-256: `339D48E75BFE175E51C4F45F7835109342B724907BC2831B189D1EAEFA12495F`.
- Fase 6: capacidade exclui tempos negativos/não finitos, respeita zero explícito e aliases de atividade/manutenção. A interface informa “Capacidade teórica”, 24h/dia sem paradas; não representa promessa de prazo nem disponibilidade real por máquina.
- Fase 7: tela inicial autenticada, detalhe do pedido, caixa vinculado, menu Atualizar etapa e produção abertos no aparelho. Monitoramento existente mostrou uma impressão ativa; nenhum comando foi enviado à impressora. Nenhum pedido/recebimento real foi alterado nos testes de menu.
- Medições em larguras emuladas 360/390/412 px no WebView: largura do documento igual à viewport e componentes observados sem extravasamento horizontal. Não equivale a três aparelhos ou certificação desktop.
- Bug visual confirmado por captura nativa: container legado do menu promovido ao Dialog v3 mantinha overflow hidden e raio de 18px, recortando a primeira letra. CSS restrito corrigiu para overflow visible e raio zero no conteúdo interno. Rebuild, reinstalação e captura nativa final confirmaram texto íntegro. Capturas CDP deformaram texto e não foram usadas isoladamente para concluir.
- IA: módulos corretos carregados, sem packs Rural/Tec. Primeiro prompt conversacional retornou fallback seguro em cerca de 1,47s; “Abrir pedidos” retornou a navegação e tela Pedidos foi observada. Isso não certifica qualidade geral/inferência de todas as ações. Indicador indisponível durante inicialização foi observado; reabertura do chat passou. WRITE não foi ampliado.
- Passaram: testes comportamentais das fases 1–6, contratos IA/isolation/model-policy/UI, lint, typecheck, build web/Android, Android testDebugUnitTest e diff --check. Teste P0 estático passou, sem comprovar HTTP live.
- Falha preservada: `node scripts/test-manual-production-ui.js` exige a frase “Acompanhe somente Em fila, Imprimindo e Pronto.” ausente também no baseline 73b2e5e. Não foi alterado para mascarar a divergência; revisar contrato de produção no próximo lote.
- Achado financeiro: pedido com status operacional Pago exibe entrada zero/pendente e nenhum movimento explicitamente vinculado. Não inferir quitação nem criar lançamentos automaticamente. Separar estado operacional e recebimento e testar conciliação antes de publicar.
- Scripts de inspeção somente leitura: `scripts/device-ui-readonly-probe.js` e `scripts/device-ai-readonly-probe.js`, enviados via stdin ao agent-browser conectado por CDP ao WebView. Não contêm credenciais nem fixtures de clientes.
- Evidências nativas locais (não versionadas, contêm dados do usuário): `%LOCALAPPDATA%/Temp/simplifica-phase7-menu.png`, `simplifica-phase7-production.png`, `simplifica-phase7-menu-fixed.png`.
- Não executados integralmente: troca de tema/reload entre dois aparelhos, offline/sincronização, dois usuários/lojas, 2FA real, restauração de backup, todas as RPCs, secrets scan completo, HTTP/SEO/cache/consentimento live, desempenho prolongado/temperatura, aprovação por link e reserva de material.
- `SAFE_TO_PUBLISH=FALSE`. Fases 6 e 7 parciais. Sem push GitHub, deploy Vercel ou migrações remotas. APK instalado é apenas candidato local de teste.

## Bloqueios mantidos

As etapas 2 a 7 não estão concluídas. Este documento não é certificação de publicação.
O teste local com dependências simuladas não substitui dois navegadores autenticados, teste offline real ou isolamento RLS.
Próximo trabalho de persistência: serializar gravações rápidas em voo e proteger conclusão assíncrona após troca de conta; revisar todos os chamadores do salvamento remoto.
Antes da publicação: conferir migração de preferências antigas, cache/service worker, Android e web; renovar identificador dos assets no lote final.
