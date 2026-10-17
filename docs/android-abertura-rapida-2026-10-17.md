# K08 — abertura sem espera artificial, 17/10/2026

Branch confirmada: `codex/melhorias-setembro-2026`. Base: `b1a1dfe`.
Continuação da [validação física](android-validacao-fisica-2026-10-17.md).
**PASS local e smoke físico offline; não é aprovação de release.**

## Mudança restrita

Removido somente o `await` que impunha três segundos em toda abertura, antes
mesmo de iniciar OAuth e restauração. O HTML invalida a versão antiga do bootstrap.
Os três temporizadores restantes apenas atualizam o status enquanto a restauração
estiver pendente; não bloqueiam nem substituem a tela já concluída.

A inspeção confirmou que a implementação existente já agenda licença e fila
offline em segundo plano quando a sessão local é válida. Foi reutilizada, não
duplicada. Não foram alterados `app.js`, login, renovação, biometria, autorização,
licenças, estilos ou navegação. As orientações de sessão Supabase limitaram a
mudança ao agendamento, sem APIs novas, backend ou credenciais.

- OAuth e restauração continuam sendo aguardados antes do render final.
- Token ausente, expirado ou com identidade divergente continua exigindo renovação.
- Digital/desbloqueio obrigatório continua bloqueando a área autenticada. Cancelar
  a biometria não remove a trava; o formulário de desbloqueio permanece disponível.
- Regras locais anteriores preservadas: sessão inferior a sete dias; licença
  offline validada há no máximo três dias; desbloqueio recente até 12 horas.
- Falhas continuam fechando o acesso; tarefas autenticadas só iniciam após
  restauração e render saudável, sem duplicação.
- Sem sessão utilizável, o login pode aparecer imediatamente. Não é necessário
  prolongar artificialmente a tela de verificação para apresentar o formulário.

## Testes locais

| Estado | Verificação | Evidência / limite |
| --- | --- | --- |
| PASS | RED antes / GREEN depois | O novo teste de início no relógio zero falhou na fonte anterior e passou com a remoção do atraso. |
| PASS | Bootstrap e recuperação | 78 falhas controladas e duas falhas de monitores preservadas; sessão pronta conclui sem avançar relógio/RAF; OAuth/cache pendentes continuam bloqueados após 120 segundos simulados. |
| PASS | Trabalho em segundo plano | 38 cenários: 22 offline preservados e 16 online novos. Funções reais de restauração, validação local e agendamento; licença/fila pendentes não seguram sessão válida; renovação e digital são aguardadas. |
| PASS | Limite de falha | 21 callbacks reais com dados sintéticos, sem rede; tarefas já agendadas continuam protegidas após falha de startup. |
| PASS | Regressão | As 17 suítes abaixo passaram, além de sintaxe dos quatro JS alterados e `git diff --check`. |
| PASS | Revisão independente | Diff de produto restrito à pausa e à referência HTML; nenhum achado de regressão na revisão local. |

Suítes executadas:

```text
npm run test:app-bootstrap
npm run test:bootstrap-background-boundary
npm run test:offline-session-restoration
node scripts/test-auth-session-boundary.js
npm run test:auth-ui
npm run test:auth-hotfix
npm run test:logout-account-overlays
npm run test:profile-admin-separation
npm run test:storefront-offline-recovery
npm run test:manual-plan-licenses
npm run test:plan-presentation-editor
npm run test:prepublication-p0
npm run test:superadmin-control-layout
npm run test:play-ai-disabled
npm run test:play-no-self-update
npm run test:play-no-external-checkout
node scripts/test-app-js-finalization.js
```

Operações remotas e biometria desses testes são controladas com dados sintéticos.
Não verificam assinatura JWT, servidor, pagamento ou leitor biométrico físico.
Falha da renovação no cache não cria nova identidade; não se extrapola essa
assertiva para uma revalidação remota da identidade já presente no ramo ativo.

## APK de teste e medição no ASUS

`npm run android:sync` e `:app:assemblePlayDebug` com JDK 21: PASS.
Build Android registrou avisos preexistentes de `flatDir`, metadados SDK XML e
deprecações Gradle. Não foram motivo para atualizar dependências fora do escopo.

- Aparelho: ASUS_I005DA / Android 13, `RBAISCBR000F2X2`.
- Pacote `br.com.ne3d.erp`; versão 1.0.39 / 67; mínimo 24; alvo/compile 36;
  ABI arm64-v8a. Sem mudança de assinatura ou número de versão.
- Build novo `0.1.0-0c971df2969175a0`, confirmado no WebView instalado.
- APK de 31.367.653 bytes; SHA-256:
  `631517fd77cf76f67cfd4f217df098f24fa8ca3546d88775b6b8e954bbbb3026`.
- Certificado conferido, igual ao instalado anteriormente:
  `1c1989682cbe464c71636d95bdd3513aaa28c7d4f9a9561cdd305285e984f62a`.
- Bootstrap empacotado idêntico aos bytes da fonte. Nenhum modelo GGUF/ONNX/
  safetensors/TFLite ou runtime nativo Needle/llama/ggml no APK.
- Flags Play continuam false: IA, atualizador próprio e checkout externo.
- Backup binário do APK anterior preservado em artefatos ignorados. Não é backup
  completo dos dados da conta. Hash anterior:
  `532a22e107bb2b183050d8dc5e80c885630b69c145eaf07b86f9f12e1e585102`.

Comparação com o mesmo diagnóstico, sondagem de 100 ms e uma abertura a frio por
versão. O aparelho estava offline, sem alterar manualmente identidade ou datas
locais para obter o resultado:

| Medição observada | Antes | Depois |
| --- | ---: | ---: |
| Primeira tela pronta observada após início de DOMContentLoaded | 3175 ms | 505 ms |
| Terceira observação estável após início de DOMContentLoaded | 3452 ms | 1472 ms |
| MainActivity TotalTime / WaitTime | 1062 / 1066 ms | 1396 / 1399 ms |
| Terminal seguro | cached-session | cached-session |

São medidas pontuais por sondagem, não benchmark. A primeira tela pronta foi
observada 2670 ms antes, mas o diagnóstico só se conecta depois da abertura
nativa: o valor é um limite observado, não instante exato de conclusão. Não
representa o tempo total desde tocar no ícone, não deve ser somado diretamente ao
TotalTime, nem garante igual resultado online ou em outros aparelhos. O tempo
nativo variou e não melhorou nesta amostra. A remoção da espera mínima de três
segundos é comprovada separadamente pelo teste determinístico.

Instalação com `adb install -r`: Success; hash do pacote instalado igual ao
artefato preparado. Sem desinstalação ou limpeza de dados. Documento completo,
bootstrap concluído, sem status pendente, retry ou trava local; área de trabalho
visível em três observações estáveis. Os seis indicadores locais de sessão,
licença, desbloqueio, credenciais presentes, identidade correspondente e usuário
ativo foram true. Somente booleanos lidos, sem expor credenciais. Arquitetura,
viewport, navegação e gestos configurados; zero camadas ativas e zero ocorrências
selecionadas de erro fatal no processo.

Smoke nativo PASS: Android e plugins App/AdMob disponíveis; IA, updater e checkout
externo indisponíveis. PDF de 3165 bytes e QR SVG produzidos só em memória. Não
valida anúncios, gravação/compartilhamento de arquivo nem operações do ERP.

O modelo QAD já existente nos dados do app continua com 695.755.488 bytes e hash
`bb741ebb106d543e9de114b843a3d3d73d51c74b5801e69da2abde821a0cb3e1`.
Não foi inicializado. Wi-Fi/dados desativados e ausência de rede padrão confirmada
antes de abrir o app; em `finally`, app encerrado antes de restaurar os rádios a
1/1. Modo avião permaneceu 0. App parou e não restou encaminhamento ADB.

## Arquivos e evidências

Arquivos versionados desta correção:

- `src/app/bootstrap.js` e `index.html`.
- `scripts/test-app-bootstrap.js`, `scripts/test-auth-ui.js` e
  `scripts/test-offline-session-restoration.js`.
- Este relatório e `docs/KANBAN-PUBLICACAO.md`.

Evidências locais ignoradas pelo Git em
`artifacts/android-fast-startup-20261017/before/` e `after/`, incluindo
`offline-readiness-confirmed.json`, capturas e backup do APK anterior. Capturas
contêm dados da conta: não publicar nem commitar. Scripts descartáveis de
instalação/diagnóstico permanecem em
`artifacts/android-device-check-20261017-30aa6ea/`.

## Riscos e próximos testes

- PENDENTE: novo login, renovação remota, biometria real aceita/cancelada e
  reconexão em ambiente isolado. A sessão existente não exigiu digital nesta
  execução; não foram alteradas datas ou credenciais reais para forçar esse caso.
- PENDENTE: comparar várias aberturas a frio/quentes, online/offline e aparelhos
  distintos. Não há garantia de redução equivalente no carregamento nativo.
- Risco residual: trabalho em segundo plano e chamadas já em andamento seguem
  os limites anteriores; esta alteração não cria cancelamento de requisições.
- K08 permanece parcial; K05–K11 conservam suas dependências de homologação,
  acesso, privacidade, implantação e publicação autorizadas.

`apps/opticore` preexistente preservado. Sem backend remoto, mudanças comerciais,
UI nova, tuning, ativação da IA, produção, AAB, push ou deploy.
**Publicação não liberada.**
