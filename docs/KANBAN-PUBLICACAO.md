# Simplifica 3D — Kanban de preparação para publicação

Atualizado em 17/10/2026. Branch: `codex/melhorias-setembro-2026`.
Checkpoint inicial desta rodada: `6f20dae`. **Liberação para publicar: NÃO.**
Resultados anteriores: [fechamento inicial](fechamento-publicacao-2026-10-16.md).
Continuação local: [editor, catálogo e evidências de persistência](homologacao-editor-planos-2026-10-16.md).

Este é o quadro de acompanhamento desta etapa. Atualizar o cartão e sua evidência
ao terminar cada trabalho; não recriar itens já resolvidos. PASS local não significa
staging, produção ou aparelho aprovados. Este documento não executa tarefas sozinho.

## Quadro

| A fazer | Em andamento | Aguardando ambiente / autorização | Concluído com limite de evidência |
| --- | --- | --- | --- |
| — | — | K05 — Staging, Edge e sandbox | B01 — Flavor Play e API 36 no código |
| K07 — Dois navegadores/aparelhos | — | K06 — Revisão de históricos | B02 — Proteções de cobrança: PASS local |
| K08 — Android: fluxos completos pendentes | — | — | B03 — Licenças na UI/API: PASS parcial local |
| — | — | K09 — Privacidade e Play Console | K00 — Quadro e sequência registrados |
| — | — | K10 — Implantação autorizada | K01 — Vencimento: PASS Auth/API local |
| — | — | K11 — Assinatura, AAB e envio | K02 — Logout: PASS frontend e navegador local |
| — | — | — | K03 — Editor e catálogo: PASS UI/API local |
| — | — | — | K04 — Regressão integrada: PASS local |

## Cartões e critérios de conclusão

| ID | Prioridade / depende de | Entrega e critério verificável |
| --- | --- | --- |
| K00 | Organização | Manter este quadro versionado, com resultados, pendências e checkpoints locais. Concluído: arquivo criado; não implica publicação autorizada. |
| K01 | P0; concluído local | Migration nova para `clients.plan_expires_at` acompanhar concessão Start/Pro, renovação, +dias e retorno Free. PASS PostgreSQL isolado e Auth/API em esquema completo; cliente, assinatura, autorização, auditoria, autoridade manual e proteção Mercado Pago conferidos. Commit `58f2471`. Sem backfill arbitrário de clientes existentes; rollout em K05/K10. |
| K02 | P0; concluído local | Logout central fecha overlays, sem redesenhar a interface. PASS para perfil/topbar em legado/UiV3, logout repetido e troca de conta/licença em VM/DOM simulado (`13a781f`). Nesta continuação, saída pelo perfil deixou login limpo e novo login funcionou no navegador local. Repetição em plataformas distintas e aparelho permanece K07/K08; não prova revogação Auth remota. |
| K03 | P0; concluído local | Formulário controlado substitui `prompt()` sem CSS novo. Seis campos e preço informativo gravados pela UI; cancelamento e falha real do proxy sem sucesso falso; releitura independente autenticada, recarga e novo login mantiveram dados. Preço cobrado intacto. Corrigidos bindings administrativos e precedência canônica também no caminho de sincronização. Evidências no relatório da continuação. |
| K04 | P0; concluído local | Auth/API reais no esquema completo local: Free/Start/Pro, datas, renovação, vencimento, concorrência, auditoria, RLS, negações e falha/recuperação PASS. Regressão frontend/build web PASS; K03 aprovado em UI/API local. Fixtures desta rodada limpas, cards restaurados e hashes dos 11 clientes/assinaturas anteriores idênticos. Não certifica Edge/sandbox, PWA completo nem Android. |
| K05 | P0; aguardando acesso | Confirmar staging isolado e executar migrations/Edge real e Mercado Pago sandbox. Conexão atual não listou projetos e a configuração local não identifica o staging esperado com segurança. Usuário decidiu continuar somente local; nenhum projeto reativado/alterado. Retomar com acesso e sandbox seguros. Validar contrato recorrente, checkout ida/volta, aprovação, eventos antigos, duplicação, resposta ambígua e falhas. Não criar projetos pagos nem usar assinaturas reais. |
| K06 | P0 de implantação; K05 | Inventariar históricos sem origem/data/plano, contratos externos incertos e espelhos de vencimento divergentes; definir revisão/reconciliação comprovável sem inventar datas, crédito extra nem cancelamento automático. K01 corrige operações futuras, não reescreve cadastros anteriores. Inspeção de produção depende de autorização própria. |
| K07 | P0 de validação; K04; K05 para cobrança | Dois navegadores ou aparelhos realmente distintos: licença/cards após recarregar, logout/login, bloqueio administrativo, falha e reconexão. Duas origens do mesmo navegador não são duas plataformas certificadas. |
| K08 | P0; validação física parcial | Correções `3bf78cc`/`30aa6ea`: recuperação e [smoke físico](android-validacao-fisica-2026-10-17.md) PASS. Continuação: removida espera fixa de três segundos, preservando login/renovação/digital; 80 falhas, 21 callbacks, 38 cenários de sessão e 17 suítes PASS. PlayDebug `0.1.0-0c971df2969175a0` atualizado no ASUS sem limpeza; primeira tela pronta observada pós-DOMContentLoaded de 3175 para 505 ms em uma amostra offline por versão. [Limites e evidências da abertura rápida](android-abertura-rapida-2026-10-17.md). Runtime Play e PDF/QR em memória PASS; app encerrado, rede restaurada; sem backend remoto. Restam novo login/biometria isolados, assinaturas, pedidos, produção, estoque, caixa, calculadora, arquivos/câmera, voltar Android, offline/retorno, permissões negadas, recuperação de falha nativa e 16 KB. Não é aprovação de release. |
| K09 | P0; pode avançar em paralelo | Confirmar conta Play Console, requisitos de testes aplicáveis, política e exclusão de conta públicas/funcionais, formulário de dados/SDKs/permissões, classificação, imagens, descrição e acesso de revisão. Estado da conta não foi consultado nesta rodada. |
| K10 | P0; K05–K07 e autorização expressa | Antes de implantar: backup, inventário do que está realmente instalado, ordem das migrations/handlers, rollback e plano de pós-validação. Só executar com autorização específica; homologação não autoriza produção. |
| K11 | Final; K08–K10, Console apta e autorização | Confirmar chave de upload sem expor segredos, versão/código aceitos, gerar AAB atualizado assinado, inspecionar e validar faixa interna. Upload/publicação exigem autorização. APK de teste não substitui AAB final. |

## Base já existente — não refazer

- **B01 — Presente no código:** API 36; flavor `play` desativa IA local, atualizador
  de APK e checkout externo, preservando fontes e assinaturas existentes.
  Evidências: `android/app/build.gradle`, `android/variables.gradle`,
  [guia de release](google-play-release.md). Falta certificar o artefato final.
- **B02 — PASS local documentado:** autorização e persistência atômica de checkout,
  ordem das tentativas, crédito único e preservação de autoridade mais recente.
  Evidências: [checkout](homologacao-criacao-assinatura-2026-10-16.md),
  [tentativas](homologacao-tentativas-pagamento-2026-10-16.md). Não comprovam
  execução Edge/sandbox real ou implantação na produção.
- **B03 — PASS parcial local:** login, concessões, +dias, rejeição de data passada,
  licença após novo login e negação administrativa. O
  [relatório do navegador](homologacao-navegador-licencas-2026-10-16.md) registrou
  as falhas K01/K02, agora corrigidas nas camadas de teste descritas acima, e o
  editor K03, agora aprovado na continuação local acima. Não equivale a repetição
  visual em dois navegadores/aparelhos distintos.

## Sequência e limites

1. K01 e K02 em correções pequenas e independentes; testes e checkpoints separados.
2. K03 e K04, depois K05/K06/K07. K09 pode ser conferido em paralelo.
3. K08 em pacote de teste autorizado; K10 só com aprovação explícita.
4. K11 somente depois dos gates anteriores e autorização para gerar/enviar/publicar.

Na rodada inicial de 16/10, não gerar APK/AAB. Em 17/10 houve autorização
específica para gerar/instalar somente APK de teste em K08; AAB continua fora
do escopo. Não fazer push, deploy, migrations em produção,
tuning ou ativação de IA. Não alterar `apps/opticore`, Home, calculadora ou carrossel.
Não utilizar dados/contratos reais nos ensaios. A verificação da conta Play,
credenciais sandbox e assinatura são dependências externas, não PASS presumidos.

## Histórico desta rodada

| Data | Cartão | Evidência / estado |
| --- | --- | --- |
| 16/10/2026 | K00 | Branch/HEAD conferidos; alteração preexistente limitada a `apps/opticore`, preservada. Quadro iniciado a partir dos relatórios atuais. |
| 16/10/2026 | K01 | RED antes/GREEN depois; nova migration aplicada somente em dois bancos locais completos. Auth/API local PASS; dados anteriores preservados por comparação de hashes. Commit `58f2471`. |
| 16/10/2026 | K02 | RED antes/GREEN depois, com cinco cenários automatizados frontend. Commit `13a781f`. |
| 16/10/2026 | K04 | Licenças e sete suítes financeiras Auth/API locais PASS ao final; contratos/runtime/frontend e build web PASS. Dois testes antigos foram corrigidos sem mudar o produto e passaram (`dd98685`). Houve falhas transitórias de JWT no ambiente, registradas no relatório. Não equivale a aprovação visual do editor. |
| 16/10/2026 | K03/K04 | Continuação: formulário, persistência, cancelamento, falha de conexão e novo login PASS local. Catálogo carregou via RPC; sync canônico corrigido após reprodução visual. 5.040 ordens e oito syncs em memória PASS; integração Auth/API real repetida PASS. Commits `85fe056` e `183ccdb`; ver relatório da continuação. |
| 16/10/2026 | K02 | Logout real pelo perfil deixou login sem overlay/identidade anterior; novo login funcionou no navegador integrado local. |
| 16/10/2026 | K05 | Após inventário somente leitura, usuário escolheu continuar apenas com correções locais. Staging e sandbox permanecem sem homologação nesta rodada. |
| 16/10/2026 | Interface Superadmin | Controles proporcionais e simplificação local sem remover funções; 12 áreas e 7 submenus de empresa percorridos no navegador, mobile e desktop. Ver [relatório de interface](superadmin-interface-2026-10-16.md). Não altera os gates de staging/Android/publicação. |
| 17/10/2026 | K08 | Usuário autorizou APK de teste: instalação PlayDebug concluída, build/hash conferidos no ASUS, modelo preservado. Smoke técnico PASS; finalização do login offline FAIL/PENDENTE de correção. Rede restaurada, app encerrado, sem produção. Evidências no relatório Android. |
| 17/10/2026 | K08 | Corrigido agendamento de três segundos que dependia de quadro de animação: RED em `48d7301`, GREEN atual. Restauração/autorização preservadas; 22 casos offline PASS. PlayDebug `0.1.0-04256611e51b367d` preparado, sem nova instalação porque o ASUS desconectou. Validação física e recuperação de exceções pré-OAuth ainda pendentes. |
| 17/10/2026 | K08 | Recuperação de exceções concluída localmente: acesso bloqueado, cache preservado, retry por recarga e limpeza apenas visual de camadas. 80 falhas, 21 callbacks e regressão de 17 suítes PASS; recuperação percorrida no navegador isolado. Novo PlayDebug preparado; aparelho continua ausente. Sem produção/publicação. |
| 17/10/2026 | K08 | ASUS reconectado: APK de `30aa6ea` instalado com install -r, hash/certificado conferidos e modelo preservado. Bootstrap e sessão existente offline PASS após corrigir expectativa de login do verificador; PDF/QR em memória e plugins Play PASS. Rádio restaurado 1/1, app encerrado. K08 continua parcial; ver relatório físico. |
| 17/10/2026 | K08 | Abertura rápida: removido somente atraso fixo de três segundos. 17 suítes PASS; cobertura de sessão ampliada de 22 para 38 casos, preservando barreiras reais. Build web/PlayDebug PASS, APK atualizado com install -r e dados preservados; medição pontual offline pós-DOMContentLoaded 3175 → 505 ms, sem alegar tempo total de abertura. Login/digital reais em isolamento e demais fluxos continuam pendentes. Ver relatório da abertura rápida. |

### Falhas antigas dos testes — corrigidas

- `test-auth-session-boundary.js`: completado o documento simulado para o
  renderer atual; cobertura pré-login, restauração e biometria preservada/ampliada.
- `test:profile-admin-separation`: substituída a expectativa da flag antiga por
  execução da rota Aparência, habilitada intencionalmente no histórico; preservados
  os testes administrativos e acrescentadas negações por identidade/licença/papel.
- Ambas falhavam no checkpoint inicial e passaram depois da correção dos testes
  (`dd98685`), sem desabilitar suítes nem alterar o comportamento do produto.
  K03/K04 foram concluídos no limite local nesta continuação; K07/K08 continuam
  exigindo as plataformas e o aparelho reais.

Prontidão exige K01–K11 concluídos com a evidência de cada ambiente, não uma
percentagem estimada nem apenas um build bem-sucedido.
