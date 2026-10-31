# Calculadora: campos e diagnóstico de persistência — 2026-10-30

Branch verificada: `codex/melhorias-setembro-2026`; base `7a6ab33`.
`apps/opticore` já estava alterado e foi preservado.

## Ajuste visual aplicado

- `styles/ui-v3/screens/calculator.css`: Peso, Horas e Minutos usam o mesmo controle de 44 px, fonte, alinhamento e espaço para unidades. Cards iguais, sem altura máxima fixa. Fonte de 18 px até 360 px; 20 px acima disso.
- As unidades ficam na mesma célula do input, com espaço reservado e sem interceptar toques.
- No desktop os cards ocupam quatro colunas da grade existente: duas posições por linha entre 768–1023 px e três acima de 1024 px.
- Inputs e selects da janela de configurações usam a mesma altura, inclusive quando o formulário é promovido ao diálogo V3.
- `styles/ui-v3/index.css` e `index.html`: atualização das URLs de CSS para evitar reutilização do estilo antigo em cache.

Fórmulas, handlers e persistência não foram alterados.

## Evidência de layout

Fixture descartável usou o renderer real da calculadora, o módulo real de configurações, o diálogo V3 e o CSS do projeto. Não carregou o bootstrap do app; não usou contas reais, Auth ou Supabase. Removida após a conferência.

- Antes, em 390 px: Peso com 44 px/fonte 20 px; Horas e Minutos com 32 px/fonte 18 px.
- Depois: três inputs de 44 px e cards de 94 px; unidades contidas nos controles; sem overflow horizontal nas larguras verificadas de 320, 390, 700, 701, 767, 768 e 1280 px. Temas claro/escuro e perfis CSS APK/PWA foram amostrados; não é uma matriz exaustiva de todos os cruzamentos.
- Janela promovida em 390 px/tema escuro: os onze inputs/selects mediram 44 px.
- Captura de campos preenchidos: `artifacts/calculator-fields-20261030/fields-light.jpg`.

Isso comprova o layout isolado no navegador, não a renderização física no aparelho.

## Validação automatizada

PASS: `node --check app.js`, `git diff --check`, `test-calculator-horizontal-overflow.js`, `test-calculator-domain.js`, `test-calculator-reconciliation.js`, `test-calculator-extra-fee.js` e os seis testes de `test-settings-persistence-behavior.js`.

FAIL preexistente: `test-calculator-time-fee-controls.js` exige o antigo `calc-time-split` e o separador HTML `:</b>`. Executado também contra os arquivos de HEAD, produziu as mesmas duas falhas. O teste não foi removido, desabilitado ou alterado. Os testes existentes de preferências visuais não comprovam a persistência da calculadora.

PASS: build web, `npm.cmd run android:sync` e Gradle/JDK 21 `:app:assemblePlayDebug`.

## APK instalado a pedido do proprietário

- Dispositivo: Samsung `SM_S948B`, identificado pelo ADB como autorizado.
- Pacote: `br.com.ne3d.erp`, PlayDebug, `1.0.39` / versionCode `67`, targetSdk 36.
- `AI_ENABLED`, `SELF_UPDATE_ENABLED` e `EXTERNAL_CHECKOUT_ENABLED`: `false` no BuildConfig gerado. Nenhum GGUF ou biblioteca de runtime local de IA encontrada no APK.
- Certificado do novo APK compatível com o instalado: SHA-256 `1c1989682cbe464c71636d95bdd3513aaa28c7d4f9a9561cdd305285e984f62a`.
- `adb install -r` retornou `Success`; sem desinstalação ou limpeza de dados.
- SHA-256 do APK local e do `base.apk` instalado: `fb6765266b4e3d1ab18bf0952565ab192b44ecabf6bc6fc20914f7ba8ca70317`.
- CSS de origem, assets sincronizados e entrada no APK com o mesmo SHA-256: `b68590444ca49fd27cae0016d5240a6a42ca75d20984ee477231c2c9ff57199a`.
- Build web instalado: `0.1.0-121024834c019afe`; atualização do pacote registrada pelo Android em `2026-10-30 21:25:38`.

Não foi gerado AAB, nem houve publicação ou alteração no Supabase. Abertura e aparência física da calculadora permanecem para conferência manual; não foram declaradas aprovadas pela instalação.

## Diagnóstico de salvamento — ainda requer implementação

Reprodução local em memória, usando funções reais e requisições remotas simuladas, sem gravar na conta:

1. O botão “Salvar calculadora” das configurações gerais chama `salvarPersonalizacao()`. Sem acesso à personalização visual, o fluxo salva somente preferências básicas, ignora os campos da calculadora e pode exibir mensagem de sucesso.
2. `lerPersonalizacaoCampos()` atualiza margem/energia/filamento no nível principal de `appConfig`, mas preserva valores antigos em `calculatorDefaults`. `getConfiguracaoCalculadora()` prioriza essa cópia antiga; uma gravação posterior pode restaurá-la também no nível principal.
3. O payload da sincronização dedicada de preferências remotas (`normalizarAppearanceSettings`) e a leitura correspondente não incluem essas configurações da calculadora. Existe outro caminho de backup completo, condicionado a acesso à nuvem; isso não torna o salvamento local do popup equivalente a sincronização de preferências entre aparelhos.
4. O histórico de uso pode prevalecer sobre impressora/material escolhidos explicitamente. Há também tratamento de zero como fallback em alguns campos.

Os quatro grupos de diagnóstico reproduziram as falhas sem rede. A alteração visual não corrige esses caminhos de persistência.

Próxima correção funcional: consolidar a leitura/gravação dos defaults existentes, separar o salvamento da calculadora da personalização visual e incluir os campos na sincronização de preferências, com testes de isolamento de conta, falha de conexão e conflito entre sessões. Validar depois em homologação e em dois dispositivos. Nenhuma escrita em dados reais foi feita nesta tarefa.
