# Pendências atuais do Simplifica 3D

Data da revisão: 2026-07-01

Esta relação separa recursos ainda não implementados de recursos existentes que dependem de validação ou ativação controlada.

## Precisa de validação real

- Instalação e atualização do APK em aparelho Android físico.
- PWA instalado em Android, incluindo atualização, cache e funcionamento offline.
- Fluxos completos com duas empresas diferentes para confirmar isolamento de clientes, funcionários e impressoras.
- Pagamentos Start e Pro no sandbox: aprovado, recusado, pendente, abandono e cancelamento.
- Aplicação da migração `20260701203000_user_preferences_interface_mode.sql` no Supabase para sincronizar o Modo de uso entre dispositivos. Até lá, a troca instantânea continua funcionando pelo armazenamento local.

## Existe, mas permanece limitado nesta fase

- A guia Impressoras, o cadastro e o conector Bambu no Agente Local estão habilitados para um piloto controlado. O teste com conta e impressora física permanece pendente; comandos remotos continuam desativados. Consulte `docs/bambu-printer-pilot.md`.
- Política local preparada: impressoras manuais ilimitadas; automáticas limitadas por empresa a 1 no Free, 3 no Start e sem limite no Pro. A Edge Function precisa ser publicada antes de essa regra valer no ambiente remoto.
- IA pesada/local. O assistente manual permanece ativo, mas o runtime pesado está desativado.
- Sincronização realtime. O sistema continua usando sincronização controlada e filas locais.
- 2FA por WhatsApp. O 2FA ativo usa e-mail; WhatsApp exige provedor oficial e backend dedicado.
- Integrações externas avançadas do Google além do login. A fundação existe, mas os recursos devem continuar atrás de ativação controlada.

## Ainda precisa ser adicionado

- Para concluir o piloto de impressoras: instalador e atualização próprios do Agente Local Simplifica para Windows.
- Para concluir o piloto de impressoras: teste Bambu autenticado, revogação guiada do token e validação em impressão real no desktop e no APK piloto.
- Migração assistida para usuários antigos sem `clientId` ou `companyId`.
- Auditoria gradual dos botões legados para migração ao `renderAppButton` e ao registro `UI_BUTTON_RELATIONS`.
- Extração progressiva de `app.js` e `style.css` em módulos menores, sem reescrita global.

## Contrato para novas telas e botões

- Toda tela nova deve entrar em `UI_SCREEN_RELATIONS` com `label`, `icon` e `tokenSet`.
- Todo botão novo deve usar `renderAppButton` e uma variante de `UI_BUTTON_RELATIONS`.
- Novas variantes visuais devem declarar seus tokens `--s3d-button-*` em `themes/base/design-system-v2.css`.
- Execute `npm run test:ui-relation-registry` antes de considerar a tela concluída.
