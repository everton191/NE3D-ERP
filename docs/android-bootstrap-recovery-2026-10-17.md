# K08 — recuperação segura da abertura, 17/10/2026

Branch `codex/melhorias-setembro-2026`, base `3bf78cc`.
Continuação da [correção do temporizador](android-bootstrap-offline-2026-10-17.md).
**PASS local; validação física pendente; publicação não liberada.**

## Causa e comportamento corrigido

Exceções nos inicializadores anteriores à cadeia OAuth deixavam `restoring`
permanente. Simplesmente apagar o marcador era inseguro: a identidade local
anterior podia ser reconhecida antes de concluir a validação.

- Captura das falhas síncronas da abertura, renderizações e rejeições da cadeia
  OAuth/restauração. Falha ativa um estado interno bloqueado até recarregar.
- Tela de recuperação independente do renderer principal, com mensagem genérica
  e “Tentar novamente”. Não usa logout, não apaga credenciais/cache/dados e não
  tenta autenticar uma identidade substituta.
- O getter canônico retorna nulo durante falha; a UI interrompe a renderização
  antes do shell privado. Login por cima de inicialização parcial não é liberado.
- Camadas modal/drawer/overlay/toast e introdução limpas somente visualmente,
  sem acionar callbacks comerciais. CSS/tema e layout normal não alterados.
- Monitores autenticados iniciam somente após render final saudável. Durante
  restauração, chamadas antecipadas do starter não iniciam esses monitores.
- Callbacks de backup, promoções, plano e atividade de sessão ficam inertes após
  falha, inclusive quando agendados antes dela. Persistência em pagehide não
  sobrescreve o cache com uma inicialização interrompida.
- Diagnóstico registra código genérico, não a mensagem arbitrária da exceção.
  Falha do próprio diagnóstico não impede mostrar a recuperação.

## RED/GREEN e verificações

| Estado | Evidência | Limite |
| --- | --- | --- |
| PASS | Fronteira de falha: teste RED anterior falhava pela ausência de recuperação; GREEN após correção. | VM, sem Auth remoto. |
| PASS | 78 falhas controladas + 2 falhas de monitores. | Inicializadores, render inicial/temporizado/final, OAuth/cache, rotas, diagnóstico, camadas e callbacks tardios; identidades simuladas. |
| PASS | Getter/renderer reais: falha não acessa shell privado nem reconhece identidade local comum/superadmin. | Função real extraída com armazenamento sintético. |
| PASS | 21/21 testes de tarefas em segundo plano. | Oito funções reais extraídas. Antes: 4/21; depois: 21/21. Inclui token preservado, backup forçado, intervalos/timeouts e controles saudáveis. |
| PASS | 22 casos offline anteriores. | Regras atuais de sessão/licença/biometria preservadas; nenhuma operação remota. |
| PASS | Navegador: falha injetada só pelo servidor local de teste. | Estado failed, sem progresso, sem menus privados, botão de recuperação visível e zero camadas ativas. |
| PASS | Clique real em “Tentar novamente” após remover a falha do servidor local. | Nova abertura voltou ao login, documento complete, marcador vazio, sem progresso e sem botão de recuperação. Nenhum login realizado. |
| PASS | 17 suítes locais + sintaxe + diff check. | Lista abaixo; não representa certificação remota/nativa. |
| PASS | Web/Capacitor + PlayDebug. | BUILD SUCCESSFUL em Java 21; avisos de SDK XML, flatDir e deprecações Gradle não bloqueantes. |
| PASS | Inspeção do APK. | app.js, bootstrap e renderer iguais às fontes por SHA-256; fixture de falha não incluída. |
| PENDENTE | Instalação e teste físico desta versão. | Duas leituras de adb devices sem aparelhos; usuário solicitado a reconectar. Sem nova instalação nem mudança de rede nesta rodada. |

Suítes PASS:

- `test:app-bootstrap`, `test:bootstrap-background-boundary`,
  `test:offline-session-restoration`, `test-auth-session-boundary.js`;
- `test:auth-ui`, `test:auth-hotfix`, `test:logout-account-overlays`,
  `test:profile-admin-separation`, `test:storefront-offline-recovery`;
- `test:manual-plan-licenses`, `test:plan-presentation-editor`,
  `test:prepublication-p0`, `test:superadmin-control-layout`;
- `test:play-ai-disabled`, `test:play-no-self-update`,
  `test:play-no-external-checkout`, `test-app-js-finalization.js`.

O teste do navegador utilizou somente localhost, configuração sintética,
proxy restrito e CSP sem acesso externo. A injeção ocorre em memória no servidor
temporário de teste, nunca por flag no aplicativo. Servidor/aba encerrados ao
concluir. Captura sem credenciais em
`artifacts/android-bootstrap-recovery-20261017/recovered-login.png` (ignorada).

## Artefato preparado, não instalado

`android/app/build/outputs/apk/play/debug/app-play-debug.apk`

- Build `0.1.0-b6bea0370fb41c1a`.
- APK SHA-256: `532a22e107bb2b183050d8dc5e80c885630b69c145eaf07b86f9f12e1e585102`.
- Certificado SHA-256: `1c1989682cbe464c71636d95bdd3513aaa28c7d4f9a9561cdd305285e984f62a`.
- IA, atualizador próprio e checkout externo: flags desativadas; zero modelos
  ou runtimes locais Needle/LFM no APK. Código-fonte preservado.
- Sem alteração de versão ou assinatura. Não gerado AAB/release de publicação.

## Arquivos alterados

- `src/app/bootstrap.js`: estado fatal, recuperação visual, captura e sequência.
- `src/features/app-ui/app-ui-renderers.js`: barreira antes do shell privado.
- `app.js`: getter e proteções das tarefas automáticas; sem regras comerciais novas.
- `index.html`: versões das URLs dos três scripts alterados.
- `package.json`: comando do teste de tarefas automáticas.
- `scripts/test-app-bootstrap.js`: matriz e controles de abertura saudável.
- `scripts/test-auth-session-boundary.js`: renderer/getter sem identidade não validada.
- `scripts/test-auth-ui.js`: versões atuais dos scripts.
- `scripts/test-bootstrap-background-boundary.js`: novo teste de callbacks reais.
- Este relatório, `docs/KANBAN-PUBLICACAO.md` e
  `docs/android-bootstrap-offline-2026-10-17.md`: evidências e histórico.

## Limites e testes manuais necessários

1. Reconectar ASUS, conferir assinatura/build, instalar com `adb install -r`
   preservando dados e repetir abertura offline. Encerrar app antes de restaurar
   conectividade. Não testar escrita em produção.
2. Confirmar biometria real, login legítimo isolado, recuperação, voltar Android
   e ausência de camadas nativas sobre a recuperação. Build não comprova isso.
3. Proteções impedem novas tarefas nos caminhos cobertos após falha; **não
   cancelam requisições já em andamento** antes dela. Cancelamento integral
   exigiria outro escopo. Promessa legítima que não termina não é aprovada por
   timeout: preservado o bloqueio de sessão enquanto estiver pendente.
4. Se o erro persistir após recarregar, a tela permanece bloqueada. O botão
   reinicia a abertura; não promete reparar dependência externa indisponível.
5. Staging/sandbox, duas plataformas, revisão dos históricos, privacidade,
   implantação autorizada e Play Console permanecem K05–K11.

Sem Supabase remoto, migrations, clientes reais, deploy, push ou publicação.
`apps/opticore` preexistente preservado. As orientações de sessão Supabase e de
verificação ponta a ponta guiaram a preservação da identidade/cache e o teste
real da recuperação no navegador, sem confundir esses resultados com Android.

Continuação após reconectar o aparelho: [instalação e smoke offline físicos](android-validacao-fisica-2026-10-17.md)
aprovados com sessão existente. As pendências desta rodada acima são históricas;
o relatório posterior distingue esse PASS limitado da homologação Android completa.
