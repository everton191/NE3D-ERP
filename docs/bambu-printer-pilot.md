# Piloto de acompanhamento de impressoras Bambu

Status em 31/07/2026: a guia **Impressoras** está habilitada para um piloto controlado com três usuários. O cadastro e o acompanhamento continuam somente leitura. Há dois caminhos experimentais: conexão automática pela função segura do Simplifica, com token cifrado no servidor, e Agente Local, com token protegido pelo DPAPI do Windows. O teste com credencial e impressora física ainda precisa ser executado pelo titular da conta.

## Objetivo e limite atual

O piloto prepara a interface, o consentimento, o cadastro e o conector local do Simplifica 3D. Ele não deve ser apresentado como integração oficial da Bambu Lab e não autoriza comandos de iniciar, pausar, retomar, cancelar, enviar arquivo, alterar temperatura ou movimentar eixos.

O botão **Ver resumo e preparar** registra apenas o avanço da preparação. Marcar todas as etapas não conecta a conta e não comprova que a impressora foi validada.

## Fluxo operacional na interface

- A guia **Impressoras** concentra o acompanhamento das máquinas e dos pedidos em impressão.
- Ao adicionar uma máquina, **Bambu automática** prepara o conector Bambu em modo nuvem experimental, abre o login e localiza as impressoras vinculadas à conta. O cadastro manual continua disponível para qualquer marca.
- Tocar no card abre um painel inspirado na organização de informações do Bambu Handy, mas com identidade do Simplifica: trabalho atual, progresso, camadas, tempo restante, temperaturas, conexão e AMS. A câmera permanece apenas como espaço preparado até validação técnica.
- O cadastro manual é ilimitado. A cota considera somente impressoras automáticas ativas: **1 no Free**, **3 no Start** e sem limite definido no **Pro**.
- A conexão automática e o Agente Local não são bloqueados no Free; o servidor aplica a cota por empresa antes de criar ou converter uma impressora automática.
- Proprietários e administradores podem **Editar** ou **Remover** cada impressora no resumo e no cartão detalhado. Remover oculta a máquina ativa e apaga suas credenciais, preservando o histórico operacional para auditoria.
- A operação visível é reduzida a **Em fila**, **Imprimindo** e **Pronto**.
- Pendências e falhas existentes permanecem preservadas e aparecem dentro da fila com aviso.
- **Pago** e **Entregue** são estados comerciais e continuam sendo alterados somente na guia **Pedidos**.
- Marcar todos os itens de um pedido como prontos atualiza o pedido para `pronto`, mas não registra pagamento nem entrega automaticamente.

## Dados e credenciais

- O progresso do guia é salvo no `localStorage`, separado pelo usuário autenticado, com o prefixo `bambuCloudPilotProgress`.
- São persistidos somente marcadores booleanos de preparação e a data da última atualização.
- O formulário automático solicita e-mail e senha ou código de verificação. A credencial transita por HTTPS até a Edge Function somente durante a autenticação e não é persistida nem registrada em logs ou eventos.
- O token devolvido pela Bambu é cifrado com AES-GCM antes de ser salvo no Supabase. O token em texto puro não é devolvido ao aplicativo.
- No caminho alternativo do Agente Local, a senha é usada somente no computador do usuário e o token é protegido pelo DPAPI do Windows.
- Desconectar a conta apaga o token cifrado do cadastro da impressora.

## Avisos obrigatórios ao usuário

A interface deve continuar informando, antes da autorização, que:

1. a integração é comunitária, experimental e não oficial;
2. o Simplifica não guarda a senha Bambu;
3. o acesso ou token pode expirar, ser limitado ou revogado pela Bambu Lab;
4. o piloto é somente para acompanhamento;
5. os dados esperados são estado, progresso, camadas, temperaturas, tempo restante e AMS.

Esses textos fazem parte do contrato de segurança do piloto e estão cobertos pelo teste `test:printer-monitoring`.

## Arquitetura do login automático experimental

```text
Simplifica 3D (PWA/APK)
  -> mostra avisos e envia a credencial somente após consentimento
Edge Function printer-monitor
  -> autentica no endpoint comunitário da Bambu
  -> descarta a senha depois da chamada
  -> cifra o token com AES-GCM
  -> devolve somente dispositivos e status sanitizados
Supabase Database
  -> armazena cadastro, token cifrado e snapshots de leitura
```

O acesso não é OAuth oficial do Bambu Handy. É uma integração comunitária sujeita a mudança ou bloqueio pela Bambu Lab. A chave `PRINTER_CREDENTIALS_SECRET` deve existir somente no ambiente seguro da função e nunca no aplicativo.

## Ativação, rollback e suporte

- Chave atual: `PRINTER_FEATURE_ENABLED = true`, em `app.js`.
- Rollback de interface: alterar a chave para `false` e executar novamente os testes e o build. A verificação de acesso e o filtro de menu foram preservados.
- O progresso local pode ser revogado pelo próprio usuário limpando os dados locais do aplicativo/navegador. Não há dado de credencial para remover nessa etapa.
- Se a Bambu mudar ou bloquear o acesso, interromper novas autorizações, manter as impressoras em modo manual e registrar a ocorrência antes de adaptar o conector.

## Procedimento do primeiro teste real

1. Implantar a Edge Function `printer-monitor` em ambiente de piloto com `PRINTER_CREDENTIALS_SECRET` configurado; não reutilizar segredo do cliente.
2. Abrir **Impressoras**, tocar em **Adicionar impressora** e manter o preset **Bambu automática**.
3. Salvar o cadastro; o Simplifica deve abrir automaticamente a tela **Conectar conta Bambu**.
4. Ler o aviso, autorizar e entrar com a própria conta. Se a Bambu exigir código, informar o código recebido.
5. Quando houver mais de uma máquina, selecionar a impressora correta.
6. Tocar no card e confirmar que o painel detalhado abre no celular e no desktop.
7. Iniciar uma impressão pequena e conferir estado, progresso, camadas, temperaturas, arquivo, tempo restante e AMS.
8. Confirmar que câmera e comandos continuam indisponíveis e que nenhum comando foi enviado à impressora.
9. Usar **Desconectar Bambu** e confirmar que o cadastro volta ao estado não configurado.

## Critérios para ampliar o piloto

- Agente Local com instalador e atualização controlada para Windows (o protótipo atual executa por Node.js).
- Credenciais nunca registradas em logs e senha descartada após autenticação.
- Token cifrado usando proteção do sistema operacional, não texto simples.
- Ação explícita para desconectar/revogar e remover o token local.
- Testes com conta de piloto e ao menos uma impressão real, sem comandos remotos.
- Validação de expiração, revogação, indisponibilidade da nuvem e troca de rede.
- Revisão da licença e dos termos aplicáveis antes de uso comercial.

## APK isolado para teste

Use `npm.cmd run android:pilot`. O artefato é criado em `output/bambu-pilot/Simplifica3D-Bambu-Pilot-0.9.0.apk`, com pacote `br.com.ne3d.erp.pilot`, `versionName 0.9.0-pilot` e `versionCode 10`. Ele pode coexistir com o pacote estável `br.com.ne3d.erp` e não altera `downloads/update.json` nem os APKs publicados.

## Teste manual do que existe hoje

1. Entrar como proprietário ou administrador e abrir **Impressoras**.
2. Confirmar que a guia aparece no desktop e no mobile.
3. Abrir **Ver resumo e preparar** e conferir todos os avisos.
4. Marcar algumas etapas, salvar, fechar e reabrir a guia.
5. Confirmar que o percentual foi preservado somente naquele usuário e dispositivo.
6. Adicionar uma impressora manual e confirmar que ela aparece na lista.
7. Confirmar que não existe campo de senha Bambu nem comando remoto.

## Referências técnicas avaliadas

- `joel-sgc/BambooMobile`: referência comunitária de comunicação local; não reutilizar código sem revisão da AGPL-3.0.
- `Doridian/OpenBambuAPI`: documentação comunitária do protocolo; tratar endpoints e comportamento como não oficiais e sujeitos a mudança.
