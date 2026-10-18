# K08 — atualização após reconexão do ASUS, 18/10/2026

Branch `codex/melhorias-setembro-2026`, fonte `791e0dd`. Continuação do
[teste isolado de Downloads](android-mediastore-isolado-2026-10-18.md), após o
usuário informar que o telefone estava conectado. Reutilizada a autorização de
APK de teste e abertura breve offline, sem apagar dados. Não é release/publicação.

## Resultado

| Estado | Verificação | Evidência e limite |
| --- | --- | --- |
| PASS | Dispositivo correto | ASUS_I005DA Android 13, `RBAISCBR000F2X2`, ADB autorizado. |
| PASS | Build web/PlayDebug | `android:sync` e build Gradle offline com JDK 21 concluídos. Sem upgrade, AAB ou mudança de assinatura/versão. |
| PASS | Correção do extrato no APK | Bytes do renderer iguais à fonte de `b034248`; índice contém `clipboard-confirmation-20261018`. Não é teste físico de compartilhar/copiar extrato real. |
| PASS | Assinatura compatível | APK anterior e novo têm o mesmo certificado SHA-256. |
| PASS | Instalação sem limpeza | `adb install -r` retornou Success; hash do APK instalado igual ao preparado. Sem desinstalar/limpar ERP ou criar conta. |
| PASS limitado | Abertura offline | MainActivity Status ok; build novo confirmado no WebView e área de trabalho estável em três observações, usando sessão existente. |
| PASS limitado | Login/etapas | Na tela final observada não havia login, etapas, retry nem trava. Não foi repetido o observador pré-scripts de histórico de DOM; não comprova ausência de um piscar transitório. |
| PASS limitado | Runtime | Android/App/AdMob disponíveis, IA/updater/checkout externo indisponíveis; PDF 3165 bytes e QR SVG somente em memória. Não certifica anúncios, Bridge de arquivos, impressão ou compartilhamento. |
| PASS | Preservação e encerramento | Modelo QAD com o mesmo hash antes/depois. Aplicativo encerrado antes de restaurar Wi-Fi/dados 1/1; modo avião 0; nenhum encaminhamento ADB restante. |
| PENDENTE | K08 completo | Navegação/segundo plano, impressão/partilha, câmera/permissões, API 24–28, execução 16 KB e fluxos que exigem ambiente Auth/API isolado. |

## Artefato e pré-verificações

- APK: `android/app/build/outputs/apk/play/debug/app-play-debug.apk`.
- Build: `0.1.0-408b0682f0c50e6f`, confirmado no DOM instalado.
- Pacote `br.com.ne3d.erp`, versão/código 1.0.39/67, mínimo/alvo/compile
  24/36/36, arm64-v8a. São metadados de teste, não validação de versão Play.
- Tamanho: 31.367.653 bytes.
- SHA-256: `b53d6aff2ffbec6317eda82733d625fad48cfb19a5390cccf8e7eed9096c60cf`.
- Certificado SHA-256:
  `1c1989682cbe464c71636d95bdd3513aaa28c7d4f9a9561cdd305285e984f62a`.
- APK anterior copiado para recuperação antes de atualizar; hash
  `f99f3c77a5c54be9472ac544321309b49ecf2d3ea3346cc0f62cfef9fa2a6bbb`.
  Cópia binária não é backup completo dos dados do usuário.
- Assets do extrato, bootstrap, renderer de UI e entrega de PDF comparados com
  as fontes: idênticos. Nenhum modelo GGUF/ONNX/safetensors/TFLite nem runtime
  Needle/llama/ggml no APK. Única `.so`: `libandroidx.graphics.path.so`.
- Flags compiladas Play false para IA, atualizador próprio e checkout externo;
  ausência dos plugins também confirmada em runtime, sem inicializar modelos.
- `zipalign -c -P 16 4`: PASS estático. O ASUS usa 4 KB; não é execução 16 KB.

## Verificações desta continuação

Executados novamente com PASS:

```text
node scripts/test-cash-renderer.js
npm run test:play-ai-disabled
npm run test:play-no-self-update
npm run test:play-no-external-checkout
npm run android:sync
android/gradlew.bat --project-dir android --offline :app:testPlayDebugUnitTest :app:assemblePlayDebug --console=plain
```

A tarefa JUnit estava `UP-TO-DATE`: manteve os resultados anteriores de 74
testes/15 suítes, sem nova execução dos casos nesta continuação. Não confundir
esse cache com os 12 testes MediaStore físicos executados no corte anterior.
Avisos preexistentes de flatDir, SDK XML e deprecações Gradle continuam visíveis.

Reutilizado o instalador local já revisado
`artifacts/android-device-check-20261017-30aa6ea/install-offline.ps1`, passando
o hash/build novos e diretório novo de evidências. Ele comprova Wi-Fi/dados
desligados e `Active default network: none` antes de instalar/abrir, confere o
hash instalado, aguarda prontidão real e roda `test:play-runtime-android`.
Em finally, encerra o app e restaura o estado anterior da rede. Nenhum backend
Supabase local, staging ou produção foi acessado; SDKs do ERP permaneceram sem
conectividade durante a abertura. Sem login/logout, mudança manual de datas,
concessão de licença ou operação em dados comerciais reais.

Prontidão observada: documento completo/visível, viewport e listeners prontos,
bootstrap concluído, área de trabalho visível e seis indicadores locais de
sessão/licença/desbloqueio/identidade válidos. Apenas booleanos foram retornados,
sem e-mail, token, senha ou datas privadas. Uma camada ativa foi contada; a
captura mostra aviso de dispositivo desbloqueado, não uma tela de login. Não
foi exigido nem afirmado contador zero de camadas.

MainActivity TotalTime/WaitTime: 1845/1856 ms. Primeira tela pronta observada
4760 ms após DOMContentLoaded; terceira amostra em 5988 ms. São observações
pontuais incluindo sondagem, não benchmark nem comprovação de maior velocidade.
Logs do processo: zero ocorrências dos padrões selecionados de erro fatal/
Uncaught ReferenceError/TypeError/SyntaxError; não é garantia de ausência de
todo erro possível.

Modelo anterior `files/models/lfm2/LFM2.5-1.2B-Instruct-QAD-Q4_0.gguf`:
SHA-256 antes/depois
`bb741ebb106d543e9de114b843a3d3d73d51c74b5801e69da2abde821a0cb3e1`.
Somente leitura de hash; não carregado/removido. A sessão existente funcionou,
mas não houve comparação integral de todos os arquivos privados.

Evidências ignoradas em `artifacts/android-local-update-20261018-791e0dd/`:
APK anterior, `offline-readiness-confirmed.json` e captura local. A imagem pode
conter dados da conta; não publicar nem commitar. O build de saída agora contém
o APK novo; não usar o caminho sozinho para identificar o artefato anterior.

## Alterações, riscos e continuidade

Nenhum código de produto mudou nesta continuação. Somente este relatório, a
referência no relatório anterior e o Kanban foram atualizados. Sync não deixou
diferenças versionadas adicionais. OptiCore preexistente preservado.

A correção do extrato agora está instalada, mas compartilhar/cópia visual ainda
precisa ser validado em contexto descartável, sem acessar extratos reais nem
sobrescrever clipboard pessoal para simular sucesso. Sem nova homologação de
16 KB; o emulador segue bloqueado por espaço. Temporários desse emulador
permanecem nos artefatos por bloqueio anterior de limpeza, sem novas tentativas.

Próximos cartões locais: K08 restante, K07 com dados sintéticos/mocks e inventário
K09. Supabase/staging/sandbox e persistência remota continuam por último, em
etapa própria. Sem push, deploy, AAB ou publicação. **Publicação não liberada.**
