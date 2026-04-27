# Android do NE3D ERP

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

## Requisitos para compilar

- Android Studio instalado.
- Java/JDK configurado no `JAVA_HOME`.
- Android SDK configurado pelo Android Studio.

No Windows, se `npm run android:apk` mostrar erro de `JAVA_HOME`, abra o Android Studio uma vez, instale o SDK sugerido e reinicie o terminal.

## Distribuicao

Quando o APK estiver pronto, envie o arquivo para GitHub Releases:

```text
https://github.com/everton191/NE3D-ERP/releases
```

O app ja aponta o botao Android para essa pagina de releases quando nenhum link especifico estiver salvo no Admin.
