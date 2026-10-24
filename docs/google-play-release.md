# Simplifica 3D — bundle Google Play

O flavor `play` mantém o código-fonte da IA, do atualizador e do Mercado Pago no repositório, mas não registra a IA nem o instalador, não empacota as bibliotecas nativas da IA e não inicia checkout externo. Assinaturas já existentes continuam sendo reconhecidas. O bundle também não solicita microfone nem instalação de APK.

## Assinatura de upload

As credenciais nunca devem ser gravadas no repositório. Defina estes valores como variáveis de ambiente ou propriedades Gradle locais:

- `SIMPLIFICA_PLAY_UPLOAD_STORE_FILE`: caminho absoluto para o keystore de upload.
- `SIMPLIFICA_PLAY_UPLOAD_STORE_PASSWORD`: senha do keystore.
- `SIMPLIFICA_PLAY_UPLOAD_KEY_ALIAS`: alias da chave.
- `SIMPLIFICA_PLAY_UPLOAD_KEY_PASSWORD`: senha da chave.

Depois execute:

```powershell
npm run android:play:bundle
npm run test:play-bundle
```

## Preparação local com credencial protegida

Para a chave exclusiva autorizada no primeiro envio, use JDK 21 e o comando:

```powershell
$env:JAVA_HOME='C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/build-play-release.ps1
```

O script lê `%USERPROFILE%\.android-keystores\simplifica3d\upload-key.json`,
carrega a senha protegida pelo Windows somente no processo, executa os testes,
prepara os recursos web sem downloads, gera o flavor Play e verifica o artefato.
Não instala, publica nem acessa o backend. Não recrie a chave em atualizações.
A credencial DPAPI depende do usuário/máquina Windows; uma segunda cópia local
não substitui backup externo recuperável em cofre seguro.

Disponibilize o bundletool oficial em
`artifacts/tools/bundletool-all-1.18.3.jar` ou informe `-BundletoolJar`.
Para executar o inspetor separadamente, configure também
`SIMPLIFICA_PLAY_UPLOAD_CERT_SHA256` e `SIMPLIFICA_BUNDLETOOL_JAR`.
O inspetor exige verificação positiva do jarsigner, certificado esperado não
debug, identidade/API corretas, validação bundletool e alinhamento nativo 16 KB.
`artifactSignatureVerified` não equivale a aprovação funcional/política;
`publishable` permanece `false` porque essa checagem não certifica publicação.

O pacote final e o relatório ficam em `artifacts/play-release-AAAAMMDD/`.
O script recusa sobrescrever uma entrega existente. Apenas o `.aab` é enviado
à Play Console: nunca envie keystore, credencial ou configuração privada.
Consulte o [guia oficial de assinatura](https://developer.android.com/studio/publish/app-signing).

O comando oficial falha quando a assinatura não está configurada. Para validar tecnicamente um AAB que não pode ser enviado à Play Console:

```powershell
npm run android:play:bundle:unsigned
```

Artefato gerado: `android/app/build/outputs/bundle/playRelease/app-play-release.aab`.

No primeiro envio foi preservada a versão `1.0.39` / código `67`, pacote
`br.com.ne3d.erp`, nome `Simplifica 3D`. Antes de cada atualização após esse
envio, aumente o `versionCode` e mantenha a mesma identidade/chave de upload.
Antes de liberar produção, valide privacidade, exclusão de dados e demais gates
do Kanban. Faça primeiro um teste em faixa interna/fechada da Play Console.
