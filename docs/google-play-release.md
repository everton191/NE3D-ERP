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

O comando oficial falha quando a assinatura não está configurada. Para validar tecnicamente um AAB que não pode ser enviado à Play Console:

```powershell
npm run android:play:bundle:unsigned
```

Artefato gerado: `android/app/build/outputs/bundle/playRelease/app-play-release.aab`.

Antes do upload, aumente o `versionCode`, confirme o `versionName`, valide a política de privacidade e a página pública de exclusão já publicadas, e faça um teste em faixa interna da Play Console.
