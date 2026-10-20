# Simplifica 3D — Kanban de preparação para publicação

Atualizado em 20/10/2026. Branch: `codex/melhorias-setembro-2026`.
Base histórica do quadro: `6f20dae`. HEAD inicial da retomada Supabase de 18/10:
`d5667bf`. **Liberação para publicar: NÃO.**
Resultados anteriores: [fechamento inicial](fechamento-publicacao-2026-10-16.md).
Continuação local: [editor, catálogo e evidências de persistência](homologacao-editor-planos-2026-10-16.md).

Este é o quadro de acompanhamento desta etapa. Atualizar o cartão e sua evidência
ao terminar cada trabalho; não recriar itens já resolvidos. PASS local não significa
staging, produção ou aparelho aprovados. Este documento não executa tarefas sozinho.

## Ordem atual — webhook por último

Decisão do usuário em 18/10: continuar as outras correções e deixar
webhook/Edge/Mercado Pago sandbox para a última frente de homologação externa.
Não remover/desligar o webhook real nem implantar alterações de cobrança por
essa decisão. K05 segue parcial, não dispensado ou aprovado.

1. K08: concluir correções e ensaios Android/imagens em ambiente descartável.
2. K07: validar login, licença e persistência nas plataformas distintas.
3. K09: corrigir e homologar privacidade/exclusão de dados; preparar Console.
4. K06: preparar revisão de históricos, sem consultar produção sem autorização.
5. K05: por último, novas RPCs financeiras, Edge, webhook e sandbox isolados.
6. Só então K10/implantação e K11/AAB/publicação, com autorizações próprias.

Continuação local a partir de `95745db`, com checkpoints `2468ae5` e `fbb9cf3`:
callback PDF/arquivo após permissão e
seleção concorrente de imagens corrigidos; fingerprint web atualizado e testes
antigos OAuth alinhados sem reativar Google. 24 suítes JS selecionadas e 74 JUnit
frescos PASS; build web `0.1.0-4718b10a8c334d08`. Sem APK novo/instalação,
Supabase ou deploy nesta continuação. [Resultados e limites](correcoes-locais-webhook-adiado-2026-10-18.md).

Checkpoint K09 de 18/10, base `d9153bb`, commit `d4b4997`: confirmação/cancelamento sem sucesso falso,
RPC atômica, proteção dos campos de exclusão e bloqueio de duplo envio corrigidos
localmente. 28 suítes JS/build web PASS; 34 cenários frontend, 42 Edge simulada e
80 grupos PostgreSQL isolado. Sem nova migration/Edge implantadas, OTP real,
concorrência independente ou purga. [Correção e limites](exclusao-conta-confirmacao-atomica-2026-10-18.md).
O processador ainda só desativa a empresa/bloqueia membros, sem concluir sozinho
a exclusão dos dados. Não executar purga de dados reais como teste.
[Inventário e critérios restantes](privacidade-inventario-local-2026-10-18.md).

Em 19/10, checkpoint de testes `803f5f5`, stack nativa recuperada sem Docker/upgrade: migration aplicada no
esquema completo local e em clone descartável. 7 grupos Auth/PostgREST/SMTP reais
com handler em Node VM e 9 grupos de concorrência SQL PASS. Licenças Auth/API
reexecutadas PASS e dados anteriores preservados. Não certifica Edge/Deno,
staging, cron diário, UI ou exclusão definitiva. [Homologação atual](homologacao-exclusao-local-2026-10-19.md).

K08 em 19/10, checkpoint `1060d22`: ASUS reconectado, módulo canônico de imagens validado no WebView
físico isolado (13 cenários/324 assertions; oito imagens decodificadas), mais
oito métodos instrumentados selecionados PASS, sem impressão. 21 suítes JS,
74 JUnit frescos e builds PASS. Pacotes temporários removidos; ERP instalado
não atualizado/aberto, hashes e rede preservados. Seletor Android/câmera,
persistência de imagens, UI completa, API 24–28 e 16 KB continuam pendentes.
[Evidências e limites](android-imagens-isoladas-2026-10-19.md).

Continuação K08 em 19/10: seletor real do Android abriu/cancelou no host isolado,
com callback original nulo único e retorno à mesma Activity/Bridge PASS. Método
isolado e regressão de nove métodos selecionados PASS; seis suítes JS e build
do módulo PASS. Nenhuma imagem pessoal selecionada; ERP/rede preservados e
pacotes novos removidos. Seleção positiva e persistência ainda PENDENTES.
[Novo recorte e riscos do teste](android-seletor-cancelamento-2026-10-19.md).

Continuação local em 20/10 (celular ausente): corrigidos reader de imagem
obsoleto (`70d6ee5`), dimensões após compactar e fallback de transparência WebP
(`f67e6f9`). 23 casos de seleção e 12 de codificação PASS; 22 suítes JS/build web PASS. Chrome
isolado confirmou pixels/alfa e dimensões reais, mais 13 casos/324 assertions
canônicos. Não é nova aprovação física; seleção positiva, salvamento completo
e demais gates continuam pendentes. [Recorte atual](correcao-imagens-local-2026-10-20.md).

Após reconexão em 20/10: correções no WebView ASUS PASS no pacote isolado
(novo 8/145 + anterior 13/324 = 21 casos/469 assertions). Regressão final de dez
métodos PASS; primeira rodada 9/10, com falha de preparo do fixture anterior não
localizada e não reproduzida, registrada sem aumentar timeout. Pacotes novos
removidos, ERP parado/hashes/rede preservados; APK principal não atualizado.
[Recorte físico atual e riscos](android-correcoes-imagens-fisico-2026-10-20.md).

## Retomada Supabase autorizada — 18/10/2026

Após o usuário autorizar o início desta etapa, staging recuperado pela CLI:
`sgcsgudgaxzysqyqxnik`, ativo, sem reativação/custo novo. Foram aplicadas 14
migrations pendentes somente nele, totalizando 95 versões. Licenças e pagamentos
sintéticos Auth/API remotos PASS, com sete contas removidas e dados anteriores
preservados. [Evidências, hashes, avisos e pendências](homologacao-staging-licencas-2026-10-18.md).

K05 não está completo: staging sem funções publicadas/segredos de integração;
faltam novas RPCs de cobrança exercitadas remotamente e Mercado Pago sandbox.
O `.env.staging` antigo aponta a um ref obsoleto e
não foi utilizado. Raiz continua vinculada à produção; foi usado contexto CLI
separado. Não executar comandos remotos pelo vínculo padrão. Produção,
deploy de funções, APK/AAB e publicação não foram executados nesta etapa.

## Histórico do ponto de retomada — somente tarefas sem Supabase

As restrições de 17/10 abaixo registram o corte anterior. A autorização de
18/10 permite agora a homologação isolada descrita acima, não produção.

Salvo por solicitação do usuário em 17/10/2026. Checkpoint funcional: `02a13fc`,
precedido por `ad7baec`. Antes de retomar, conferir branch, HEAD, diferenças e
aparelho disponíveis; não presumir que continuam iguais. Alteração preexistente
em `apps/opticore` preservada e fora dos commits desta etapa.

Já concluído neste corte: retirada da espera fixa de três segundos e do painel
transitório de etapas com sessão local pronta. Login, renovação necessária,
digital e recuperação de falha continuam bloqueando quando exigidos. As 17
suítes passaram no checkpoint; APK PlayDebug `0.1.0-13ee3eac04468d68` foi
instalado sem limpeza no ASUS, e o histórico de DOM da recarga offline não
registrou painel nem formulário de login. Isso não certifica login remoto nem
ganho adicional de velocidade. [Evidências e limites](android-abertura-rapida-2026-10-17.md).

Sequência local em execução; são desdobramentos dos cartões existentes, não
novos recursos ou autorização para publicação. Continuação em `71af7fe`,
`53fe141` e `2a8568b`: [correções locais e evidências](android-correcoes-locais-2026-10-17.md).
Em 18/10, `b034248` corrigiu sucesso falso de cópia do extrato; `9363b98`
adicionou o pacote isolado de testes: 12 ensaios MediaStore reais PASS no ASUS,
sem abrir/reinstalar o ERP. [Evidências e limites atuais](android-mediastore-isolado-2026-10-18.md).
Após nova reconexão, o ERP foi atualizado sem limpeza para PlayDebug
`0.1.0-408b0682f0c50e6f`, com smoke offline PASS e rede restaurada;
[relatório da atualização](android-atualizacao-dispositivo-2026-10-18.md).
Continuação dos testes: falha real de callbacks PDF corrigida (`1869012`), host
isolado (`6e8f832`) e smoke do APK (`4bb6739`). APK atual
`0.1.0-29e9c1b79666b110`; [relatório de Bridge/PDF e ressalvas](android-testes-bridge-pdf-2026-10-18.md).

| Ordem | Cartão | Trabalho que pode avançar sem Supabase |
| --- | --- | --- |
| 1 | K08 | PASS estático: ZIP/ELF alinhados a 16 KB, permissões e flags Play conferidas no APK. PENDENTE execução 16 KB: emulador descartável não iniciou e segunda tentativa falhou por espaço (11342,34 MB disponíveis / 12288 MB exigidos). ASUS usa 4 KB. Sem upgrade necessário. |
| 2 | K08 | Voltar no detalhe corrigido; mesmos 16 cenários agora também PASS no WebView físico com estado sintético, não navegação visual real do ERP. Host descartável CREATED→RESUMED/reload PASS. Fluxo físico completo/segundo plano do ERP continuam PENDENTES. |
| 3 | K08 | MediaStore anterior 12 PASS; agora Bridge real PDF/JSON, codificação corrigida e 8/8 instrumentados no roteiro revisado. Impressão abriu e job próprio foi encerrado com destruição do host; não valida Voltar manual/impressora física. 85 assertions do caixa no WebView usam navigator fictício, não clipboard/share sheet reais. Seleção de imagem/câmera, permissões legadas e fluxos visuais seguem PENDENTES. |
| 4 | K08 | Completar medições offline frias/quentes quando necessário e recuperação de falhas em cenário isolado. Preservar sessão/datas/credenciais; não forçar digital ou vencimento da conta real. |
| 5 | K07 | Preparar regressão frontend em dois navegadores/perfis descartáveis com mocks e dados sintéticos. Não marcar persistência Auth/API entre plataformas como homologada por esse ensaio. |
| 6 | K09 | Preparar inventário local de dados, SDKs, permissões e documentação de privacidade/exclusão. Estado do Play Console, páginas públicas e funcionamento da exclusão remota continuam sem validação por esse trabalho local. |

Nesta retomada, não iniciar nem acessar Supabase local, staging ou produção,
nem cobrar/pagar/cancelar assinaturas. Escritas de teste apenas em ambiente
descartável e sintético, com rede remota bloqueada; se o isolamento não puder
ser comprovado, limitar à inspeção/testes simulados e registrar a pendência.
O app instalado mantém configuração remota anterior: não abri-lo online como
teste nem usar sua conta real para operações. Rever conexão/autorização do
aparelho antes de novos ensaios; preservar dados e restaurar o estado da rede.

Ficam separados: K05/K06/K10 (staging/sandbox, históricos e implantação), os
ensaios de login/renovação, digital e reconexão que precisem Auth/API isolada,
e a persistência real de licenças/cards de K07. K11/AAB/publicação dependem de
outra etapa e autorização. Sem push, deploy, tuning, ativação de IA ou alterações
no OptiCore. K08 e a liberação para publicar continuam incompletos.

## Quadro

| A fazer | Em andamento | Aguardando ambiente / autorização | Concluído com limite de evidência |
| --- | --- | --- | --- |
| — | — | K05 — Banco/Auth/API parcial PASS; webhook/sandbox por último | B01 — Flavor Play e API 36 no código |
| K07 — Dois navegadores/aparelhos | — | K06 — Revisão de históricos | B02 — Proteções de cobrança: PASS local |
| K08 — Android: fluxos completos pendentes | — | — | B03 — Licenças na UI/API: PASS parcial local |
| — | K09 — Confirmação homologada localmente; exclusão definitiva pendente | Play Console e Edge/staging: validação externa pendente | K00 — Quadro e sequência registrados |
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
| K05 | P0; parcial remoto; última homologação externa | Staging confirmado ativo pela CLI; 14 migrations aplicadas somente nele (95 totais). Free/Start/Pro, renovação/vencimento/concorrência, autorização/RLS e persistência de cards PASS por Auth/API remotos; pagamentos sintéticos PASS no caminho legado privilegiado do trigger. Sete contas limpas e dez clientes/assinaturas anteriores com hashes idênticos. Novas RPCs financeiras apenas instaladas/ACL conferida, ainda sem execução remota. Staging sem funções/segredos de integração; falta configurar e homologar Edge real/Mercado Pago sandbox. Adiado por decisão do usuário, não dispensado; manter cobrança atual intacta. Validar contrato recorrente, checkout ida/volta, aprovação, eventos antigos, duplicação, resposta ambígua e falhas. Não criar projetos pagos, usar assinaturas reais nem executar wrappers ligados à produção. Ver relatório de 18/10. |
| K06 | P0 de implantação; K05 | Inventariar históricos sem origem/data/plano, contratos externos incertos e espelhos de vencimento divergentes; definir revisão/reconciliação comprovável sem inventar datas, crédito extra nem cancelamento automático. K01 corrige operações futuras, não reescreve cadastros anteriores. Inspeção de produção depende de autorização própria. |
| K07 | P0 de validação; K04; K05 para cobrança | Dois navegadores ou aparelhos realmente distintos: licença/cards após recarregar, logout/login, bloqueio administrativo, falha e reconexão. Duas origens do mesmo navegador não são duas plataformas certificadas. |
| K08 | P0; validação física parcial | Fonte corrigida em 20/10: reader/metadados/alpha. Após reconexão, WebView ASUS isolado: 21 casos de imagens/469 assertions e regressão final de dez métodos PASS. Primeira rodada 9/10: falha de preparo do fixture não localizada, não reproduzida; manter ressalva. [Recorte físico atual](android-correcoes-imagens-fisico-2026-10-20.md). Pacotes novos removidos; ERP/hash/rede preservados. Principal não atualizado, último build conhecido `0.1.0-29e9c1b79666b110`. Restam seleção positiva/persistência e concorrência do save completo, UI/segundo plano ERP, impressão/partilha, câmera/permissões, API 24–28/16 KB e Auth/API isolados. Não é aprovação de release. |
| K09 | P0; confirmação PASS integração local, restante pendente | Correção `d4b4997` aplicada no esquema completo local e clone SQL. 7 grupos Auth/PostgREST/SMTP reais com handler em Node VM e 9 grupos concorrentes independentes PASS; regressão de licenças PASS, dados anteriores preservados. Falta Edge/Deno, staging/UI e cron diário. FAIL separado: rotina de exclusão somente lógica, sem prova de eliminação de dados; fluxo de membro/empresa a definir. Inventariados SDKs, contatos, diagnósticos, avisos de mensagens, biometria, arquivos e backup. Confirmar política/canal públicos, procedimento real, retenções, formulário de dados/SDKs/permissões, Console e acesso de revisão. [Homologação atual e limites](homologacao-exclusao-local-2026-10-19.md). Sem produção/Console/purga real. |
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

## Sequência histórica e limites

A ordem atual de trabalho é a seção inicial “webhook por último”. A sequência
abaixo registra a organização original; os limites de autorização continuam.

1. K01 e K02 em correções pequenas e independentes; testes e checkpoints separados.
2. K03 e K04, depois K05/K06/K07. K09 pode ser conferido em paralelo.
3. K08 em pacote de teste autorizado; K10 só com aprovação explícita.
4. K11 somente depois dos gates anteriores e autorização para gerar/enviar/publicar.

Na rodada inicial de 16/10, não gerar APK/AAB. Em 17/10 houve autorização
específica para gerar/instalar somente APK de teste em K08; AAB continua fora
do escopo. Em 18/10, primeiro os APKs de validação com IDs próprios foram instalados
e removidos; após reconexão houve atualização separada do ERP e smoke offline.
Não fazer push, deploy, migrations em produção,
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
| 17/10/2026 | K08 | Sessão pronta sem janela de etapas: render informativo adiado sem bloquear a restauração; renderer silencioso não lê identidade privada e preserva login/digital/falha. RED/GREEN e 17 suítes PASS. APK atualizado sem limpeza; histórico real de DOM na recarga offline mudou de uma inserção de painel/login para zero, com sessão final estável. Sem novo ganho de velocidade comprovado. Relatório de abertura rápida atualizado; K08 continua parcial. |
| 17/10/2026 | K08 | Continuação sem Supabase: Downloads pendentes corrigidos (`71af7fe`), Voltar em detalhe sem histórico (`53fe141`) e limpeza de recursos PDF (`2a8568b`). RED/GREEN; 27 suítes JS e 74 JUnit PASS. ZIP/ELF 16 KB PASS estático, execução 16 KB pendente. Novo PlayDebug `0.1.0-36aba7e81164a1b1` instalado sem limpeza; abertura e histórico de DOM offline PASS. Nenhum ensaio físico de gravação/impressão/câmera ou backend. Ver relatório de correções locais. |
| 18/10/2026 | K08 | Cópia do extrato sem sucesso falso (`b034248`) e módulo MediaStore opt-in sem Internet (`9363b98`). 29 suítes JS/74 JUnit PASS; 12 testes físicos PASS no ASUS, com bytes PDF/JSON, publicação, falhas injetadas e limpeza das próprias URIs. Pacotes novos removidos, APK ERP idêntico e não aberto. Execução 16 KB pendente: boot offline e depois falta de espaço; temporários do novo AVD permanecem nos artefatos por bloqueio de limpeza. Supabase continua por último. Ver relatório de 18/10. |
| 18/10/2026 | K08 | Telefone reconectado: PlayDebug `0.1.0-408b0682f0c50e6f` de `791e0dd` instalado com install -r; certificado/hash/assets conferidos. Sessão existente e runtime/PDF/QR em memória PASS offline; modelo QAD idêntico, app encerrado e Wi-Fi/dados restaurados 1/1. Quatro suítes locais repetidas PASS; tarefa JUnit UP-TO-DATE, sem reexecução dos 74 casos. Sem teste visual de cópia/impressão/câmera ou Supabase. Ver relatório da atualização de 18/10. |
| 18/10/2026 | K08 | Testes autorizados: 6/8 inicialmente por Illegal invocation em PDF; bindings Window corrigidos, 7/8 na repetição (identidade do diálogo invisível). Roteiro de impressão revisado sem ação global: 8/8, com job próprio encerrado/host destruído; cancelamento manual continua pendente. 32 suítes JS e 74 JUnit frescos PASS; APK `0.1.0-29e9c1b79666b110` atualizado e smoke da codificação real PASS. Pacotes/fixtures novos removidos, rede restaurada e modelo preservado. Logs FAIL anteriores e ressalva de processo após segunda rodada mantidos no novo relatório. Commits `1869012`, `6e8f832`, `4bb6739`; publicação não liberada. |

| 18/10/2026 | K05 | Staging recuperado e 14 migrations aplicadas somente nele; 95 versões. Duas suítes Auth/API remotas PASS, sete contas limpas e dados anteriores preservados. Novas RPCs financeiras e Edge/sandbox não homologados. Commit `95745db`; ver relatório remoto. |
| 18/10/2026 | K08/K09 | Webhook adiado por decisão do usuário. Corrigidos callback de permissão e corrida de imagens; fingerprint reconhece o módulo alterado. Dois testes OAuth obsoletos corrigidos sem mudar produto. 24 suítes JS selecionadas/74 JUnit PASS; build web novo, sem APK/Supabase/deploy. Inventário K09 documenta bloqueadores reais de exclusão, SDKs/permissões e validações externas. |
| 18/10/2026 | K09 | Corrigidos confirmação/cancelamento e falso sucesso com RPC transacional service-only, trigger dos campos sensíveis, validação de resposta e duplo envio (`d4b4997`). 28 suítes JS/build web PASS; testes novos: 34 frontend, 42 Edge simulada e 80 grupos SQL em memória. Nenhuma implantação ou exclusão real; Auth/API/concorrência e procedimento de eliminação continuam pendentes. [Relatório e arquivos](exclusao-conta-confirmacao-atomica-2026-10-18.md). |
| 19/10/2026 | K09 | Stack nativa preservada recuperada; migration existente aplicada integralmente só no esquema completo local e clone descartável. 7 grupos Auth/PostgREST/SMTP reais em Node VM e 9 grupos SQL concorrentes PASS, incluindo corrida com processador sem ressuscitar empresa. Regressão de licenças e 31 suítes/build web PASS; fixtures limpas e hashes dos dados anteriores iguais. Testes `803f5f5`. Sem Edge/Deno publicado, staging/produção, APK/AAB ou eliminação definitiva. [Evidências](homologacao-exclusao-local-2026-10-19.md). |
| 19/10/2026 | K08 | Celular reconectado: novo ensaio do canônico de imagens no WebView isolado (`1060d22`), 13 casos/324 assertions e 8 saídas decodificadas PASS. Método isolado e rodada de oito métodos selecionados PASS; impressão não executada. 21 suítes JS/74 JUnit frescos/builds PASS. Só pacotes temporários instalados/removidos, ERP/`.test` anterior intactos, rede sem mudança. Seletor Android e persistência não aprovados. [Relatório](android-imagens-isoladas-2026-10-19.md). |
| 19/10/2026 | K08 | Continuação: abertura/cancelamento do Photo Picker real PASS no pacote isolado, sem selecionar arquivo. Callback original único nulo, mesma Activity/Bridge retomada; 1 método isolado + 9 selecionados PASS. Seis suítes JS/build isolado PASS. Falha inicial por chamada sem gesto mantida no relatório; roteiro ajustado para toque apenas no WebView próprio. Pacotes novos limpos, ERP/rede preservados. Seleção positiva/persistência e demais gates continuam pendentes. [Relatório](android-seletor-cancelamento-2026-10-19.md). |
| 20/10/2026 | K08 | Celular ausente, nenhuma instalação. Corrigidos reader pendente obsoleto (`70d6ee5`), metadados após redução e fallback WebP com alfa. Testes locais, 22 suítes JS e build web PASS. Chrome em perfil descartável comprovou JPEG325×325, alfa PNG0/128 e regressão canônica13/324 PASS. Não certifica Android, save completo nem Supabase. [Relatório e limites](correcao-imagens-local-2026-10-20.md). |
| 20/10/2026 | K08 | Aparelho reconectado: novos oito casos/145 assertions e anteriores13/324 PASS no WebView isolado. Rodada inicial9/10 por preparo do fixture não localizado; diagnóstico correlacionado melhorado, isolado e regressão final10/10 PASS sem alterar timeout. Pacotes temporários removidos nas duas rodadas, hashes ERP/`.test` e rede1/1 iguais, launcher final. Não atualizou principal nem certifica save/seleção positiva. [Relatório físico](android-correcoes-imagens-fisico-2026-10-20.md). |

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
