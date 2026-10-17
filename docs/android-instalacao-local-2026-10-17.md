# Android — atualização local autorizada em 17/10/2026

Fonte: `48d7301`, branch `codex/melhorias-setembro-2026`.
Autorização: gerar/instalar APK de teste preservando dados e verificar inicialmente
sem rede. Sem publicação, produção, AAB, mudança de versão ou assinatura.

## Resultado

| Estado | Verificação | Evidência |
| --- | --- | --- |
| PASS | Build PlayDebug com Java 21 | `:app:assemblePlayDebug` terminou com BUILD SUCCESSFUL. |
| PASS | Instalação preservando dados | `adb install -r` retornou Success, sem desinstalação/limpeza. |
| PASS | Assinatura compatível | Certificado SHA-256 do APK novo igual ao instalado anteriormente. |
| PASS | Código atualizado no dispositivo | Build `0.1.0-57b7966bcd1932f0` no APK e no DOM do WebView. CSS do superadmin no pacote idêntico à fonte. |
| PASS | APK instalado idêntico ao gerado | SHA-256 `9cc674f85669796c7465f9f6c65047a742a7d79a659262197d80359cbfb6e53a`. |
| PASS | Versão e alvo | `br.com.ne3d.erp`, versão 1.0.39 / 67, mínimo API 24, alvo/compilação API 36, arm64-v8a. Sem version bump. |
| PASS | Preservação da IA para futuro | Modelo local de 695.755.488 bytes manteve SHA-256 `bb741ebb106d543e9de114b843a3d3d73d51c74b5801e69da2abde821a0cb3e1`. Não foi carregado. |
| PASS | IA desativada no Play | Sem modelos/runtime local no pacote; plugin, suporte de IA e atalhos ausentes no runtime. Código-fonte preservado. |
| PASS | Atualizador/checkout externo desativados | Plugins ausentes no runtime instalado. |
| PASS | Plugins básicos, PDF e QR | Smoke físico: Android nativo, App e AdMob disponíveis; PDF de 3.165 bytes e QR em memória. Não verifica anúncio, impressão, compartilhamento nem cobrança real. |
| PASS | Abertura nativa | MainActivity abriu a frio, Status ok. |
| FAIL | Finalização do bootstrap offline | Em duas verificações limitadas, documento completo, build correto e botão Entrar visível/habilitado, mas `bootstrap=restoring` e status de progresso continuaram presentes. Segunda observação após aproximadamente 18 segundos de sondagem. Sem login. |
| PASS limitado | Logs do processo da última abertura | Zero ocorrências selecionadas de FATAL EXCEPTION ou Uncaught ReferenceError/TypeError/SyntaxError. Não significa ausência de todo erro possível. |
| PENDENTE | Superadmin autenticado no aparelho / tema escuro | Não forçada identidade, sessão ou licença. Sem validar operações administrativas reais. |

Dispositivo: ASUS_I005DA, Android 13, serial `RBAISCBR000F2X2`.

## Rede e preservação

- Wi-Fi e dados móveis estavam habilitados. Foram temporariamente desativados;
  ausência de rede padrão confirmada antes das aberturas.
- O aparelho demorou a concluir uma transição de rede. Uma tentativa foi
  interrompida antes da abertura por falta de confirmação imediata; a leitura
  posterior confirmou restauração. Sondagem limitada passou a aguardar o estado
  efetivo. Ao encerrar, Wi-Fi e dados móveis confirmados no estado inicial (1/1).
- Aplicativo encerrado antes de restaurar a conectividade, evitando sincronização
  automática com produção durante este teste. Nenhum login ou operação real.
- APK anterior guardado em
  `artifacts/android-local-update-20261017/previous-installed.apk` para recuperação.
  A cópia é do aplicativo, não um backup completo dos dados do usuário.

## Arquivos e pendência

APK atualizado: `android/app/build/outputs/apk/play/debug/app-play-debug.apk`.
Evidências ignoradas pelo Git: `artifacts/android-local-update-20261017/`, incluindo
`offline-readiness.json`, sondagem diagnóstica somente leitura e capturas locais.
As capturas podem conter o e-mail lembrado pelo login; não publicar/commitar.

Código funcional inalterado nesta rodada. Somente este relatório e o histórico
do Kanban foram atualizados; `apps/opticore` preexistente preservado.

Instalação concluída, mas **homologação Android completa não aprovada**. Próxima
correção: investigar a restauração que mantém o indicador ativo sem conexão e
retomar K08 com cenário isolado/autenticação legítima. A causa ainda não foi
determinada; não remover validações de sessão para fazer o teste passar.
Nenhum novo commit de produto, push, deploy ou publicação nesta instalação.

Continuação: [correção local do agendamento e APK novo, ainda não instalado](android-bootstrap-offline-2026-10-17.md).
O build instalado e o FAIL físico acima são o registro desta instalação anterior;
o caminho de saída do APK foi reutilizado pelo novo build. Não confundir os dois.
