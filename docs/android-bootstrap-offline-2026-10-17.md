# Android — correção local da espera inicial, 17/10/2026

Branch `codex/melhorias-setembro-2026`; base `48d7301`.
Escopo: continuidade de K08, sem produção, mudança de autenticação ou visual.

## Defeito reproduzido e correção

O bootstrap criava o temporizador de três segundos **dentro** de
`requestAnimationFrame`. Sem entrega desse quadro, os temporizadores das etapas
700/1500/2300 ms chegavam a “Quase pronto”, mas a restauração nem começava.

Reprodução determinística com a fonte de `48d7301`, em memória, sem checkout:
`test-app-bootstrap.js` terminou com exit 1; temporizadores observados
`[700,1500,2300]`, esperado também `3000`. Na fonte corrigida: exit 0.

Mudança funcional restrita a `src/app/bootstrap.js`: agendar diretamente a pausa
de três segundos. `index.html` atualiza somente a versão da URL desse script.
Não há timeout para aprovar sessão: OAuth e restauração continuam aguardados.
Regras de licença, sete dias de sessão, janela local de 12 horas e biometria
permanecem nas funções originais, sem dados/identidades substituídos.

O mecanismo reproduzido é compatível com o sintoma da instalação anterior, mas
**a causa do episódio físico não foi confirmada**: o aparelho não estava mais
conectado durante esta correção. O FAIL físico anterior não vira PASS por build.

## Evidências

| Estado | Verificação | Limite |
| --- | --- | --- |
| PASS | RED/GREEN do bootstrap sem quadro de animação | VM com relógio e dependências controlados; duas situações, com/sem usuário restaurado. |
| PASS | Etapas visuais e fronteira 2999/3000 ms | Não altera duração mínima; suspender animação não impede o agendamento. Temporizadores ainda podem ser suspensos pelo sistema. |
| PASS | OAuth/cache pendentes mantêm `restoring` | Sem tarefas autenticadas antes da conclusão; sem usuário, nenhuma dessas tarefas inicia. |
| PASS | 22 casos de restauração offline | Funções e constantes reais extraídas de `app.js`; armazenamento em memória e dados sintéticos. Sem API real. |
| PASS | Proteções offline | Cache inválido/ausente/desativado/vencido, UID/refresh ausentes e usuário inativo recusados; licença ausente/antiga mantém trava; zero tentativas remotas. |
| PASS | Desbloqueio | Fronteiras de 3/7 dias e 12 horas; biometria pendente/cancelada/indisponível mantém trava. Confirmação simulada é o único cenário de desbloqueio biométrico. |
| PASS limitado | Navegador local isolado | Abertura até login sem autenticar; configuração sintética, CSP e proxy restritos a localhost, backend indisponível. Não certifica PWA offline nem Android. |
| PASS | Build web e sincronização Capacitor | `npm run android:sync`, sem downloads de distribuição nem GGUF. |
| PASS | Compilação PlayDebug | Java 21; `:app:assemblePlayDebug`, BUILD SUCCESSFUL. Avisos preexistentes flatDir/deprecações Gradle, sem upgrade. |
| PASS | Artefato | Bootstrap dentro do APK idêntico à fonte por SHA-256; certificado debug compatível com o artefato da instalação anterior. |
| PENDENTE | Instalar esta correção / repetir teste offline no ASUS | `adb devices -l` sem dispositivos. Nenhuma nova instalação ou alteração de rede nesta continuação. |

Suítes executadas com PASS nesta continuação:

- `test:app-bootstrap`, `test:offline-session-restoration` (22 casos),
  `test:auth-ui`, `test-auth-session-boundary.js`, `test:auth-hotfix`;
- `test:logout-account-overlays`, `test:profile-admin-separation`,
  `test-app-js-finalization.js`, `test:storefront-offline-recovery`;
- `test:manual-plan-licenses`, `test:plan-presentation-editor`,
  `test:prepublication-p0`, `test:superadmin-control-layout`;
- `test:play-ai-disabled`, `test:play-no-self-update`,
  `test:play-no-external-checkout`.

Sintaxe de `app.js`, bootstrap e ambos os testes de execução: PASS.
`git diff --check`: PASS. Nenhuma suíte desabilitada.

Leitura final do navegador: documento `complete`, marcador de bootstrap vazio,
indicador ausente e botão Entrar visível; URL do script
`/src/app/bootstrap.js?v=offline-bootstrap-20261017`. Console sem avisos/erros
capturados. Não houve login. Servidor e aba temporários encerrados ao concluir.

## Arquivos alterados

- `src/app/bootstrap.js`: única mudança funcional.
- `index.html`: versão da URL do bootstrap.
- `package.json`: comandos dos dois testes de execução.
- `scripts/test-app-bootstrap.js`: regressão RED/GREEN e esperas de autenticação.
- `scripts/test-auth-ui.js`: expectativa da versão atualizada do bootstrap.
- `scripts/test-offline-session-restoration.js`: 22 cenários sintéticos novos.
- `docs/KANBAN-PUBLICACAO.md`: estado e pendências de K08.
- `docs/android-instalacao-local-2026-10-17.md`: evidência da instalação anterior
  e vínculo para esta continuação.
- `docs/android-bootstrap-offline-2026-10-17.md`: este relatório.

## APK de teste preparado, ainda não instalado

`android/app/build/outputs/apk/play/debug/app-play-debug.apk`

- Build: `0.1.0-04256611e51b367d`.
- SHA-256: `e6cae99383aeff652068051d9538ef7a743c5f98faaddadfb7950a94bc2107ef`.
- Bootstrap SHA-256: `4a1c7140dd51c109ba2f2ba749f2aa2513b4fe0e80683bf92f62b25621fe9bd7`.
- Certificado SHA-256: `1c1989682cbe464c71636d95bdd3513aaa28c7d4f9a9561cdd305285e984f62a`.
- `br.com.ne3d.erp`, versão 1.0.39 / 67; API mínima 24, alvo/compile 36,
  arm64-v8a. Sem alteração de versão ou assinatura.
- Flags geradas: IA, atualizador próprio e checkout externo desativados.
  Nenhum modelo nem runtime Needle/LFM no pacote. Fontes preservadas.

O caminho do APK agora contém o novo build; o aparelho permanece com o build
anterior documentado no [relatório de instalação](android-instalacao-local-2026-10-17.md).

## Riscos e próxima validação

1. Reconectar o ASUS e instalar com `adb install -r`, sem desinstalar/limpar dados.
   Repetir abertura offline, conferindo build, visibilidade, término do indicador,
   logs e manutenção da trava. Encerrar antes de restaurar a rede.
2. Biometria real e login legítimo em ambiente isolado continuam pendentes;
   não utilizar identidade artificial ou credenciais de produção no aparelho.
3. Exceções síncronas nos inicializadores anteriores à cadeia OAuth ainda podem
   deixar o marcador ativo. Defeito de tratamento identificado por injeção de
   falha, não observado nesta execução normal. Exige um corte separado com
   recuperação fail-closed, sem simplesmente apagar o indicador e expor cache.
4. Staging/sandbox, duas plataformas, funcionalidades Android completas,
   privacidade, rollout autorizado e Play Console continuam nos cartões K05–K11.

Sem migrações, escrita em banco, publicação, AAB, push, deploy ou ativação de IA.
`apps/opticore` preexistente preservado. **Não pronto para publicar.**
