# Saneamento tecnico - 2026-05-26

## Escopo

Fase conservadora de limpeza para ERP + Storefront antes de novas expansoes. A prioridade foi reduzir ruido do workspace sem apagar rollback, preview ou artefatos que ainda possam ser uteis para recuperacao.

## Classificacao

### Manter versionado

- `app.js`, `style.css`, `index.html`, `sw.js`, `manifest.webmanifest`
- `android/`
- `src/`
- `supabase/`
- `assets/`
- `scripts/test-*`
- `docs/`
- `downloads/NE3D-ERP.apk`
- `downloads/update.json`

### Manter local, fora do Git

- `rollback/`: snapshots e APKs de retorno rapido.
- `storefront-preview/`: prototipo/preview com `node_modules`, `dist` e logs proprios.
- `backups/`: backups locais.
- `dist/`: build gerado.
- imagens soltas de QA na raiz, ja cobertas por `/*.png`, `/*.jpg`, `/*.webp`.

### Arquivar depois de validacao manual

- Rollbacks antigos dentro de `rollback/` quando houver checkpoint mais novo validado em producao.
- Previews experimentais em `storefront-preview/` se a implementacao principal ja cobrir o fluxo.

### Nao remover automaticamente

- Qualquer migration Supabase.
- APK atual em `downloads/`.
- Scripts de teste ativos.
- Documentos de auditoria e validacao.

## Limpezas aplicadas

- `rollback/` adicionado ao `.gitignore` para evitar commits acidentais de APKs antigos.
- `storefront-preview/` adicionado ao `.gitignore` para manter prototipo pesado fora do historico.
- `scripts/backup-supabase-public-rest.js` adicionado ao `.gitignore` enquanto permanecer script local/experimental.

## Temas e PWA/APK

- A versao `1.0.11-estavel` / `versionCode 109` ja contem as paletas controladas no PWA e no APK.
- O build web foi regenerado depois do ajuste de paletas.
- O APK foi regenerado a partir do mesmo `dist/`.

## Riscos restantes

- Ainda existe uma alteracao local pre-existente em `scripts/test-storefront-production-controlled.js`; ela nao foi incluida neste saneamento.
- A limpeza fisica de rollback/preview deve ser feita apenas depois de confirmar que nao ha necessidade de retorno para esses pontos.

## Validacao recomendada

- `node --check app.js`
- `npm run build:web`
- `npm run test:ui-contrast`
- `npm run test:ui-theme-consistency`
- `npm run test:mobile-visual-stability`
- `npm run test:storefront-visual-balance`
- `npm run android:apk`
- Teste manual em PWA/APK no tema claro e escuro.
