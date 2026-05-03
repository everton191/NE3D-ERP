# Android do Simplifica 3D

O projeto Android fica na pasta `android/` e foi criado com Capacitor.

## Comandos

```bash
npm install
npm run android:sync
npm run android:open
```

Para gerar um APK de teste:

```bash
npm run android:apk
```

O APK debug, quando o Android Studio/JDK estiver instalado, sai em:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

O comando tambem copia o APK para nomes prontos para compartilhar:

```text
downloads/NE3D-ERP.apk
downloads/update.json
```

O arquivo `downloads/NE3D-ERP-android-users17-debug.apk` ainda e atualizado como compatibilidade para links antigos, mas o link principal agora e `downloads/NE3D-ERP.apk`.

O app Android do Simplifica 3D consulta `downloads/update.json` no GitHub. Quando a versao publicada for diferente da `APP_VERSION` instalada, ele avisa o usuario e abre o download de `downloads/NE3D-ERP.apk`.

Antes de publicar uma nova versao, atualize:

- `APP_VERSION` em `app.js`
- `versionCode` e `versionName` em `android/app/build.gradle`

Depois rode `npm run android:apk`, faca commit e push. Quando o `update.json` novo estiver no GitHub, os apps Android com atualizacao automatica ligada passam a avisar e abrir o APK novo.

## Requisitos para compilar

- Android Studio instalado.
- Java/JDK configurado no `JAVA_HOME`.
- Android SDK configurado pelo Android Studio.

No Windows, se `npm run android:apk` mostrar erro de `JAVA_HOME`, abra o Android Studio uma vez, instale o SDK sugerido e reinicie o terminal.

## Distribuicao

Quando o APK estiver pronto, envie `NE3D-ERP.apk` e `update.json` para o repositorio publico de atualizacao:

```text
https://github.com/everton191/NE3D-ERP.apk
```

O app consulta `https://raw.githubusercontent.com/everton191/NE3D-ERP.apk/main/update.json` e baixa o APK em `https://github.com/everton191/NE3D-ERP.apk/raw/main/NE3D-ERP.apk`.
