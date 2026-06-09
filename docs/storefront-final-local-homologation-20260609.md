# Homologacao visual final local da Loja Online

Data: 2026-06-09
Branch: `codex/stable-premium-motion`
Checkpoint base: `8af7612 fix(storefront): stabilize contextual mobile editor flow`
Publicacao remota: nao executada

## Ambiente testado

- Build local: `npm.cmd run build:web`
- Servidor local com fallback SPA:
  - `http://127.0.0.1:5266`
  - `http://127.0.0.1:5267` usado apenas para confirmar que a sessao autenticada nao estava disponivel nessa origem.
- Navegador: in-app browser com viewport emulado.
- Usuario autenticado: sessao local ja existente na origem `127.0.0.1:5266`.
- APK/PWA instalados: nao homologados nesta etapa.

## Rotas validadas

### `/ne3d?admin=1`

Responsabilidade validada: vitrine real da loja em modo de edicao contextual.

Validado:

- preview da loja permanece visivel;
- botao `Editar loja` abre o painel correto;
- painel nao altera a rota indevidamente;
- mini-card `Sua loja esta 60%` abre o checklist;
- checklist usa o painel contextual e nao abre uma segunda tela;
- botao `Falar com a loja` em modo admin abre `CONTATO`, sem disparar WhatsApp publico;
- produto tocado corretamente abre painel `PRODUTO`;
- card do produto correto recebe destaque;
- fechar painel mantem a rota `/ne3d?admin=1`;
- somente um painel fica aberto;
- sem erros de console nos fluxos validados;
- sem overflow horizontal relevante.

Observacao: um clique automatico por coordenada atingiu a regiao de banner quando o produto nao estava visivel acima do bottom sheet. Refeito com alvo medido, o produto abriu corretamente.

### `/store-admin/ne3d`

Responsabilidade validada: tela administrativa estruturada da loja.

Validado:

- renderiza `store-editor-shell`;
- nao renderiza a vitrine publica como shell principal;
- possui editor, preview, produtos, categorias, banner, contatos e rascunho;
- nao apresentou erros de console;
- mobile 390px sem overflow;
- desktop 1366px com diferenca fracionaria de 1px no medidor automatizado, sem evidencia visual de quebra.

## Larguras e orientacoes testadas

### Mobile retrato

Testado em:

- 320px;
- 360px;
- 390px;
- 412px;
- 480px.

Resultado:

- painel abriu em todos os tamanhos;
- FAB ficou acima da barra inferior;
- bottom sheet manteve altura controlada;
- preview continuou tocavel;
- sem erros de console;
- leituras de `overflowX` foram 0 ou 1px em alguns tamanhos por arredondamento fracionario do emulador.

### Mobile paisagem

Testado em:

- 844 x 320;
- 844 x 360;
- 844 x 390;
- 844 x 412;
- 932 x 480.

Resultado:

- rota carregou sem erro de console;
- layout ficou em modo amplo/tablet conforme breakpoints atuais;
- FAB contextual nao fica visivel em todos os cenarios, pois o painel lateral/sticky passa a ser a superficie principal;
- leituras de `overflowX` de 1px em algumas larguras parecem arredondamento do viewport emulado.

### Tablet e desktop

Testado em:

- 768px;
- 820px;
- 900px;
- 1024px;
- 1280px;
- 1366px;
- 1440px;
- 1920px.

Resultado:

- sidebar/painel lateral aparece nos breakpoints amplos;
- sem bottom sheet indevido em desktop;
- sem erros de console;
- sem overflow relevante; alguns tamanhos mediram 1px fracionario.

## Cenarios de teclado e formulario

Validacao executada:

- painel `PRODUTO` abre com campos de edicao;
- painel `CONTATO` abre com campos de contato;
- campos aparecem dentro do bottom sheet/painel.

Limitacao da homologacao local:

- a automacao do navegador nao conseguiu digitar texto porque a superficie retornou erro de clipboard virtual;
- tambem houve tentativa de clicar em input fora da area visivel do bottom sheet, entao a digitacao real com teclado virtual nao foi considerada homologada.

Pendente em Android fisico:

- foco persistente durante digitacao;
- teclado nao fechando sozinho;
- botao salvar visivel com teclado aberto;
- campo focado permanecendo visivel;
- fechamento do teclado sem quebrar o painel.

## Temas testados

Validado no estado atual:

- ERP em tema claro;
- loja em tema claro;
- vitrine publica e editor contextual sem filtro cinza aparente no banner durante a validacao local;
- botao, cards, painel e texto legiveis no tema claro.

Nao homologado nesta etapa:

- alternancia ERP escuro x loja claro;
- loja escura, caso a opcao ainda esteja disponivel;
- APK/PWA instalados com tema do sistema.

Motivo: a etapa pediu nao alterar preferencias persistentes, cache, PWA ou APK. A validacao escuro/claro completa deve ocorrer em rodada separada com restauracao controlada da preferencia.

## Fluxos aprovados

- Abrir `/ne3d?admin=1` autenticado.
- Abrir painel pelo FAB `Editar loja`.
- Abrir checklist pelo mini-card.
- Fechar painel sem sair da vitrine.
- Tocar no produto visivel e abrir painel `PRODUTO`.
- Tocar em `Falar com a loja` e abrir painel `CONTATO`.
- Abrir `/store-admin/ne3d` em mobile e desktop.
- Validar ausencia de erros de console nos fluxos executados.

## Problemas encontrados

### Medio - teste anti-regressao obsoleto

- Arquivo: `scripts/test-storefront-visual-simple-editor.js`
- Sintoma: teste ainda esperava a chamada antiga `if (changed) storefrontFlushAutosaveNow();`.
- Impacto: a bateria de storefront falhava mesmo com o fluxo atual correto.
- Correcao realizada: teste atualizado para validar `setStorefrontContextualEditorState`, que centraliza a troca de selecao e o autosave.

### Baixo - medidor automatico acusou 1px de overflow em alguns viewports

- Rotas: `/ne3d?admin=1` e `/store-admin/ne3d`
- Frequencia: alguns breakpoints emulados.
- Impacto: sem evidencia visual de quebra; provavelmente arredondamento fracionario do viewport do navegador.
- Correcao: nenhuma nesta etapa.
- Recomendacao: observar em Android fisico e Chrome normal antes de tratar como bug real.

### Baixo - automacao nao conseguiu digitar em inputs

- Rota: `/ne3d?admin=1`
- Impacto: impede homologar teclado virtual via browser automation.
- Correcao: nenhuma; nao e bug confirmado do app.
- Recomendacao: validar em Android fisico e APK/PWA instalados.

## Triagem dos relatorios de bugs existentes

Arquivos analisados:

- `docs/BUGS.md`
- `docs/RELATORIO_BUGS_SIMPLIFICA3D.md`
- `docs/diagnostics-error-reports.md`
- `docs/superadmin-bug-reports.md`
- `docs/codex-diagnostics-report.md`
- `backups/storefront-phase37/.../app_error_logs.json`
- `backups/storefront-phase37/.../app_feedback_reports.json`

Resumo:

- `docs/RELATORIO_BUGS_SIMPLIFICA3D.md` registra "Nenhum bug aberto nesta versao".
- `docs/BUGS.md` contem riscos antigos de superadmin, sessao, migrations e Supabase, sem bloqueador direto novo da Loja Online.
- Backups de logs contem eventos antigos de:
  - login com credencial invalida;
  - cadastro com e-mail invalido;
  - pagamento exigindo conta online;
  - falhas `Failed to fetch` em licenca/Supabase;
  - eventos AdMob.
- Nao foi identificado bug bloqueador atual de loja/editor/publicacao nesses arquivos.

Classificacao relevante:

| Problema | Severidade | Rota | Impacto | Status |
| --- | --- | --- | --- | --- |
| Teste visual simples obsoleto | Medio | testes | bloqueava bateria local | corrigido |
| Logs antigos de login/cadastro invalido | Alto fora do escopo | login/cadastro | historico antigo; nao reproduzido nesta etapa | pendente em etapa de auth se reaparecer |
| Logs antigos de pagamento sem conta online | Alto fora do escopo | planos/assinatura | fora do escopo da loja | pendente para rodada de checkout |
| Supabase `Failed to fetch` antigo | Medio fora do escopo | varias telas | depende de rede/licenca remota | monitorar |
| Overflow fracionario 1px no emulador | Baixo | loja/editor | sem evidencia visual | monitorar em aparelho real |

## Correcoes realizadas

- Atualizado `scripts/test-storefront-visual-simple-editor.js` para o contrato atual do editor contextual:
  - `setStorefrontContextualEditorState`;
  - flush de autosave centralizado;
  - selecao contextual abrindo painel.

Nao houve alteracao de regra de negocio, banco, plano, checkout, slug, PWA, service worker, manifest ou APK.

## Testes executados

Sintaxe e build:

- `node --check app.js` - passou
- `node --check scripts/test-storefront-contextual-mobile-flow.js` - passou
- `node --check scripts/test-storefront-visual-simple-editor.js` - passou
- `npm.cmd run build:web` - passou

Obrigatorios:

- `npm.cmd run test:storefront-contextual-mobile-flow` - passou
- `npm.cmd run test:storefront-guided-editor` - passou
- `npm.cmd run test:storefront-publish-validation` - passou
- `git diff --check` - passou com aviso CRLF do Windows
- `git diff --cached --check` - passou

Relacionados a loja:

- `npm.cmd run test:storefront-mobile-resilience` - passou
- `npm.cmd run test:storefront-desktop-upscale` - passou
- `npm.cmd run test:storefront-mobile-actions` - passou
- `npm.cmd run test:storefront-mobile-real` - passou
- `npm.cmd run test:storefront-public-ui` - passou
- `npm.cmd run test:storefront-light-theme-stability` - passou
- `npm.cmd run test:storefront-theme-v2` - passou
- `npm.cmd run test:theme-isolation` - passou
- `npm.cmd run test:storefront-visual-simple-editor` - passou apos ajuste do teste
- `npm.cmd run test:storefront-visual-balance` - passou
- `npm.cmd run test:storefront-final-polish` - passou
- `npm.cmd run test:storefront-demo-products` - passou
- `npm.cmd run test:storefront-idempotency` - passou
- `npm.cmd run test:storefront-persistence-sync` - passou
- `npm.cmd run test:storefront-offline-recovery` - passou
- `npm.cmd run test:storefront-share-links` - passou
- `npm.cmd run test:storefront-performance-lite` - passou
- `npm.cmd run test:storefront-pwa-upgrade` - passou

## Riscos remanescentes

- Teclado virtual precisa de Android fisico.
- APK instalado nao foi homologado.
- PWA instalada nao foi homologada.
- Tema escuro/tema do sistema nao foi alternado nesta etapa.
- Logs antigos de auth/pagamento existem, mas nao foram tratados por estarem fora do escopo.
- Diferencas de 1px de overflow em emulacao devem ser observadas em dispositivo real.

## Pendencias em Android fisico

- Samsung com botoes virtuais.
- Asus com botoes virtuais.
- Android com navegacao por gestos.
- APK com teclado aberto.
- PWA instalada.
- Barra inferior com painel aberto.
- Gesto de voltar com painel aberto.
- Orientacao retrato e paisagem.
- Entrada de texto em produto, contato e banner.

## Confirmacoes negativas

Nesta etapa nao houve:

- push;
- deploy Vercel;
- alteracao de cache PWA;
- atualizacao de PWA;
- geracao de APK;
- alteracao de `versionCode`;
- alteracao de `versionName`;
- alteracao de manifest;
- alteracao de service worker;
- alteracao de planos;
- alteracao de banco de dados;
- alteracao de checkout;
- alteracao de slug.
