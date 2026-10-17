# K08 — instalação e abertura offline no ASUS, 17/10/2026

Branch `codex/melhorias-setembro-2026`, código `30aa6ea`.
Continuação da [recuperação segura](android-bootstrap-recovery-2026-10-17.md),
após o usuário informar o celular conectado. **Instalação e smoke físico PASS;
homologação Android completa e publicação continuam pendentes.**

## Artefato e preservação

- ASUS_I005DA, Android 13, serial `RBAISCBR000F2X2`.
- APK PlayDebug já preparado, instalado com `adb install -r`: Success.
  Sem recompilar, desinstalar, limpar dados ou alterar assinatura/versão.
- `br.com.ne3d.erp`, versão 1.0.39 / 67, mínimo API 24, alvo/compile API 36,
  arm64-v8a. Metadado do aparelho: lastUpdateTime `2026-10-17 18:30:43`
  (relógio do dispositivo, não horário convertido do cliente).
- Build `0.1.0-b6bea0370fb41c1a` confirmado no WebView instalado.
- SHA-256 do APK gerado e instalado:
  `532a22e107bb2b183050d8dc5e80c885630b69c145eaf07b86f9f12e1e585102`.
- Certificado do APK anterior e do novo idêntico:
  `1c1989682cbe464c71636d95bdd3513aaa28c7d4f9a9561cdd305285e984f62a`.
- APK anterior copiado para recuperação; não é backup completo dos dados.
  SHA-256 `9cc674f85669796c7465f9f6c65047a742a7d79a659262197d80359cbfb6e53a`.
- Modelo QAD local de 695.755.488 bytes preservado. Antes/depois:
  `bb741ebb106d543e9de114b843a3d3d73d51c74b5801e69da2abde821a0cb3e1`.
  Não inicializado nem usado para inferência.

## Resultado observado

| Estado | Verificação | Evidência e limite |
| --- | --- | --- |
| PASS | Atualização sem limpeza | install -r Success; hash do pacote instalado igual ao artefato conferido. |
| PASS | Abertura a frio | MainActivity Status ok; última abertura TotalTime 1377 ms. Não mede tempo total de uso. |
| PASS | Finalização da verificação inicial | Documento complete, visível, bootstrap vazio, sem indicador de progresso nem tela de falha. |
| PASS limitado | Sessão existente restaurada offline | Área de trabalho visível em três observações estáveis; nenhuma identidade/sessão criada ou substituída. Não é novo login remoto. |
| PASS limitado | Indicadores de confiança local | Sessão <7 dias, licença validada há no máximo 3 dias, desbloqueio há no máximo 12 horas, UID/refresh presentes, identidade do cache correspondente e usuário ativo conhecido: todos true, conforme relógio do aparelho. Apenas booleanos retornados, sem credenciais. |
| PASS | Inicializadores | Arquitetura, viewport, navegação e proteção de gestos configurados. Última observação: zero camadas ativas. |
| PASS limitado | Logs | Zero ocorrências selecionadas de FATAL EXCEPTION ou Uncaught ReferenceError/TypeError/SyntaxError no processo. Não prova ausência de todo erro. |
| PASS | Runtime Play | Android nativo; plugins App e AdMob disponíveis. IA local, updater e checkout externo indisponíveis; suporte/atalho de IA ausentes. Disponibilidade AdMob não valida anúncios. |
| PASS limitado | PDF e QR | PDF de 3165 bytes e QR SVG produzidos somente em memória. Não certifica arquivo salvo, compartilhamento ou impressão. |
| PASS | Encerramento e rede | App encerrado antes de restaurar rede; Wi-Fi/dados voltaram a 1/1 e avião continuou 0. Nenhum encaminhamento ADB restante. |

## Segurança do procedimento

O aplicativo mantém a configuração do backend que já tinha; ela não foi
alterada. Antes de cada abertura, Wi-Fi e dados foram desativados e a ausência de
rede padrão foi confirmada. Em finally, o app foi encerrado antes de restaurar
os dois rádios ao estado original. Não houve login, logout, operação de plano,
teste de compra nem alteração manual de dados reais. Nenhuma chamada dos testes
ao backend remoto; não se afirma cancelamento de chamadas de outros aplicativos.

A orientação de sessão Supabase foi utilizada para limitar a inspeção aos
indicadores de validade, sem renovar credenciais nem tratar uma sessão local
como prova de validação remota.

### Ocorrências do verificador, sem ocultar falhas

1. Após a instalação, o primeiro comando automatizado de abertura não foi
   executado por conflito do parâmetro `-W` com opções do PowerShell. Corrigido
   somente no script descartável; rede restaurada. Instalação não foi repetida.
2. A primeira sondagem exigia formulário de login, mas o aparelho exibiu o perfil
   de uma sessão existente. Resultado LOGIN_READINESS_NOT_CONFIRMED: documento e
   bootstrap já concluídos, sem progresso/erro, mas login ausente. Esse resultado
   não demonstrava travamento do aplicativo.
3. A sondagem foi adequada aos resultados funcionais: login, trava ou sessão
   existente. Para aceitar sessão existente exige também os seis indicadores
   locais acima, área conhecida e três observações estáveis. Nenhum estado do
   aplicativo foi alterado para obter PASS. Repetição terminou em cached-session
   com todos os indicadores true; smoke nativo passou em seguida.

## Evidências e arquivos

Evidências ignoradas pelo Git em
`artifacts/android-device-check-20261017-30aa6ea/`: backup do APK anterior,
scripts descartáveis, `offline-readiness.json` da sondagem inicial e
`offline-readiness-confirmed.json` da repetição. Capturas contêm dados de conta;
não publicar, embutir no relatório nem commitar.

Código de produto não alterado nesta instalação. Atualizados este relatório,
`docs/KANBAN-PUBLICACAO.md` e a nota de continuação em
`docs/android-bootstrap-recovery-2026-10-17.md`. `apps/opticore` preservado.

## Pendências

- Novo login/logout e biometria real em ambiente isolado; a sessão existente não
  exigiu biometria nesta execução. Não forçar vencimentos na conta real.
- Fluxos operacionais completos, arquivos/câmera, voltar Android, permissões
  negadas, recuperação com conexão em ambiente isolado e compatibilidade 16 KB.
- Injeção de falha/retry no aparelho: aprovada em VM/navegador local, não injetada
  no APK instalado nem testada com dados reais.
- K05–K11: staging/sandbox, duas plataformas, revisão dos históricos, privacidade,
  rollout autorizado e Console. Nenhum PASS de implantação ou publicação.

Sem AAB, push, deploy, migrations ou ativação de IA. **Publicação não liberada.**
