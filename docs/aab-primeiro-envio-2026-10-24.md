# Primeiro AAB assinado — 24/10/2026

Base: `66058fc`, branch `codex/melhorias-setembro-2026`.
Autorização explícita do proprietário: primeiro envio, criar chave exclusiva
e preparar pacote para envio manual posterior. Nenhum upload/deploy realizado.

## Resultado

| Verificação | Estado | Evidência |
| --- | --- | --- |
| Identidade | PASS | AAB real: Simplifica 3D, br.com.ne3d.erp, 1.0.39 / 67, min24 / target36. |
| Build PlayRelease | PASS | Gradle offline/JDK21, BUILD SUCCESSFUL em 2m18s, 203 tarefas; lintVitalPlayRelease concluído. |
| Regressão local selecionada | PASS | Nove scripts: release-consistency, bundle-signature, play-ai-disabled, play-no-self-update, play-no-external-checkout, play-account-deletion, prepublication-p0, config-image-selection (23 casos), config-image-encoding (12 casos). |
| Verificador de assinatura | PASS | 12 fixtures e locale fixo; certificado público real aceito e fingerprint diferente rejeitado. Inspetor do AAB real também rejeitou fingerprint incorreto e passou com o esperado. Erro de ferramenta não conta mais como assinatura válida. |
| Pacote efetivo | PASS | bundletool1.18.3 validate; jarsigner positivo; certificado esperado, não debug; hash conferido na cópia final. |
| IA / atualizador / checkout | PASS local | Testes do flavor; zero GGUF/AI JNI, sem REQUEST_INSTALL_PACKAGES ou RECORD_AUDIO no manifesto real. Não é teste remoto de assinaturas. |
| Bibliotecas nativas 16 KB | PASS estático | Única .so: arm64-v8a/libandroidx.graphics.path.so, PT_LOAD mínimo16384, config PAGE_ALIGNMENT_16K. Runtime16KB não testado. |
| Credenciais privadas | PASS local | Keystore fora do repo/OneDrive; DPAPI por usuário Windows; DACL restrita e segunda cópia local conferida por hash. Backup externo portátil ainda necessário. |
| Play Console / execução via Play | NÃO VERIFICADO | Nenhum upload, teste via loja, aprovação de pacote ou conta nesta rodada. |
| Liberação pública | PENDENTE | Gates K05–K11 ainda exigem evidências específicas; build não resolve privacidade, sandbox ou implantação. |

## Artefato

`artifacts/play-release-20261024/Simplifica3D-1.0.39-vc67-play-release.aab`

18.047.189 bytes. SHA256:
`812d4134648701847a944d4fa685ed0f69b2981216ea46cff8edc43afd58abd3`.

Certificado upload SHA256:
`7fc59b2aa478d0105e622be8d14d9a37254f1cdd1c1cd073d862cedf46d451a0`.
Relatório automático e guia LEIA-ME-PLAY.md ao lado do AAB.
Chave privada/senha não fazem parte da entrega pública ou do Git.

## Alterações e recuperação

- `scripts/inspect-play-bundle.js`: verificação positiva fail-closed, certificado,
  bundletool, identidade, conteúdo e alinhamento. Não afirma publicabilidade.
- `scripts/lib/play-bundle-signature.js` e `scripts/test-play-bundle-signature.js`:
  contratos testáveis do verificador.
- `scripts/build-play-release.ps1`: credencial protegida somente no processo,
  nove verificações, build offline sem daemon persistente, inspeção e cópia por
  hash, ferramenta oficial1.18.3 fixada por SHA256; restaura ambiente ao finalizar.
- `docs/google-play-release.md` e `docs/KANBAN-PUBLICACAO.md`: instruções/gates.

O AAB gerado antigo foi preservado por hash em `previous-generated`, sem ser
tratado como entrega aprovada. Não houve mudança de versão, assinatura debug,
regra comercial, visual, IA fonte, Supabase ou `apps/opticore` (dirty preexistente).
Avisos existentes: flatDir, SDK XML, API Java depreciada e incompatibilidade
futura com Gradle9; não impediram o build atual e não motivaram upgrade amplo.

## Próximos testes manuais

Enviar primeiro à faixa interna; instalar a versão entregue pela Play e testar
login/digital, sessões, planos existentes sem checkout externo, navegação,
PDF/QR/arquivos/imagens e recuperação offline. Homologar runtime16KB/API antigas,
persistência entre plataformas e privacidade/exclusão; concluir sandbox/Edge e
implantação controlada separadamente. Não aprovar produção apenas com este AAB.
Para atualizar depois do primeiro envio aceito: mesmo pacote/chave, código>67.
