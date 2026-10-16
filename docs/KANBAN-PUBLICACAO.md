# Simplifica 3D — Kanban de preparação para publicação

Atualizado em 16/10/2026. Branch: `codex/melhorias-setembro-2026`.
Checkpoint inicial desta rodada: `6f20dae`. **Liberação para publicar: NÃO.**
Resultados desta execução: [relatório e evidências](fechamento-publicacao-2026-10-16.md).

Este é o quadro de acompanhamento desta etapa. Atualizar o cartão e sua evidência
ao terminar cada trabalho; não recriar itens já resolvidos. PASS local não significa
staging, produção ou aparelho aprovados. Este documento não executa tarefas sozinho.

## Quadro

| A fazer | Em andamento | Aguardando ambiente / autorização | Concluído com limite de evidência |
| --- | --- | --- | --- |
| K03 — Editor dos cards na interface | K04 — Regressão integrada (parcial) | K05 — Staging, Edge e sandbox | B01 — Flavor Play e API 36 no código |
| K07 — Dois navegadores/aparelhos | — | K06 — Revisão de históricos | B02 — Proteções de cobrança: PASS local |
| — | — | K08 — Android Play no aparelho | B03 — Licenças na UI/API: PASS parcial local |
| — | — | K09 — Privacidade e Play Console | K00 — Quadro e sequência registrados |
| — | — | K10 — Implantação autorizada | K01 — Vencimento: PASS Auth/API local |
| — | — | K11 — Assinatura, AAB e envio | K02 — Logout: PASS automatizado frontend |

## Cartões e critérios de conclusão

| ID | Prioridade / depende de | Entrega e critério verificável |
| --- | --- | --- |
| K00 | Organização | Manter este quadro versionado, com resultados, pendências e checkpoints locais. Concluído: arquivo criado; não implica publicação autorizada. |
| K01 | P0; concluído local | Migration nova para `clients.plan_expires_at` acompanhar concessão Start/Pro, renovação, +dias e retorno Free. PASS PostgreSQL isolado e Auth/API em esquema completo; cliente, assinatura, autorização, auditoria, autoridade manual e proteção Mercado Pago conferidos. Commit `58f2471`. Sem backfill arbitrário de clientes existentes; rollout em K05/K10. |
| K02 | P0; concluído automatizado | Logout central fecha overlays, sem redesenhar a interface. PASS para perfil/topbar em legado/UiV3, logout repetido e troca de conta/licença em VM/DOM simulado. Commit `13a781f`. Repetição visual no navegador/aparelho permanece em K07/K08; não é prova de revogação Auth remota. |
| K03 | P0 de validação | Gravar nomes, descrições, benefícios e preço informativo pela interface, reler em outra sessão, rejeitar usuário comum e falha de rede sem sucesso falso. Preço cobrado permanece igual. `prompt()` não funciona no navegador integrado; testar navegador compatível ou adaptar ao formulário existente antes de concluir. |
| K04 | P0; K01–K03 | Regressão com Auth/API reais e esquema completo local: Free/Start/Pro, datas, renovação, vencimento, concorrência, auditoria, permissões, falha e recuperação. Dados sintéticos, evidências e limpeza por IDs. Testes estáticos isolados não fecham este cartão. |
| K05 | P0; K04 | Confirmar staging isolado e executar migrations/Edge real e Mercado Pago sandbox. Validar identificação real do contrato recorrente, checkout ida/volta, aprovação, eventos antigos, duplicação, resposta ambígua e falhas. Não criar projetos pagos nem usar assinaturas reais. |
| K06 | P0 de implantação; K05 | Inventariar históricos sem origem/data/plano, contratos externos incertos e espelhos de vencimento divergentes; definir revisão/reconciliação comprovável sem inventar datas, crédito extra nem cancelamento automático. K01 corrige operações futuras, não reescreve cadastros anteriores. Inspeção de produção depende de autorização própria. |
| K07 | P0 de validação; K04; K05 para cobrança | Dois navegadores ou aparelhos realmente distintos: licença/cards após recarregar, logout/login, bloqueio administrativo, falha e reconexão. Duas origens do mesmo navegador não são duas plataformas certificadas. |
| K08 | P0; K04 e ambiente isolado | Com autorização para gerar/instalar pacote: testar flavor Play atualizado no aparelho. IA/init/download ausentes; sem atualizador/checkout externo. Login, assinaturas existentes, pedidos, produção, estoque, caixa, calculadora, PDF/QR, arquivos/câmera quando usados, voltar Android, offline/retorno e permissões negadas. Verificar compatibilidade nativa de 16 KB no pacote final e em execução. |
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
  editor K03, ainda sem aprovação por UI. Não equivale a repetição visual completa.

## Sequência e limites

1. K01 e K02 em correções pequenas e independentes; testes e checkpoints separados.
2. K03 e K04, depois K05/K06/K07. K09 pode ser conferido em paralelo.
3. K08 em pacote de teste autorizado; K10 só com aprovação explícita.
4. K11 somente depois dos gates anteriores e autorização para gerar/enviar/publicar.

Não gerar APK/AAB nesta rodada. Não fazer push, deploy, migrations em produção,
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

### Falhas antigas dos testes — corrigidas

- `test-auth-session-boundary.js`: completado o documento simulado para o
  renderer atual; cobertura pré-login, restauração e biometria preservada/ampliada.
- `test:profile-admin-separation`: substituída a expectativa da flag antiga por
  execução da rota Aparência, habilitada intencionalmente no histórico; preservados
  os testes administrativos e acrescentadas negações por identidade/licença/papel.
- Ambas falhavam no checkpoint inicial e passaram depois da correção dos testes
  (`dd98685`), sem desabilitar suítes nem alterar o comportamento do produto.
  K04 ainda depende da validação do editor de K03 e da repetição visual pertinente.

Prontidão exige K01–K11 concluídos com a evidência de cada ambiente, não uma
percentagem estimada nem apenas um build bem-sucedido.
