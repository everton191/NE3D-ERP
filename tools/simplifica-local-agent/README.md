# Simplifica Local Agent

Agente local somente leitura para OctoPrint, Moonraker, PrusaLink e Bambu Cloud experimental.

1. No ERP, abra `Impressoras > Agente local` e crie um agente.
2. Cadastre a impressora com o modo `Simplifica Local Agent` e associe o agente.
3. Copie `config.example.json` para um arquivo fora do repositório.
4. Preencha o token do agente, o ID da impressora e a conexão local.
5. Execute com Node.js 18 ou superior:

```powershell
node agent.js C:\caminho\seguro\config.json
```

O processo não abre porta pública e não recebe comandos. Ele apenas consulta status e envia snapshots ao Simplifica.

## Preparar uma conta Bambu no Windows

1. Instale as dependências dentro desta pasta com `npm.cmd install`.
2. Crie o agente e a impressora Bambu no ERP, ambos vinculados entre si.
3. Copie `config.example.json` para um arquivo fora do repositório e preencha `endpoint` e `agentToken`.
4. Execute `node bambu-setup.js C:\caminho\seguro\config.json`.
5. Digite a senha no terminal oculto ou use um código de verificação, escolha a impressora e informe o UUID cadastrado no Simplifica.
6. Inicie com `node agent.js C:\caminho\seguro\config.json`.

A senha existe apenas na memória durante o login. O arquivo recebe o token Bambu cifrado pelo DPAPI e vinculado ao usuário atual do Windows. O agente assina somente o tópico MQTT de relatórios e não publica comandos. Se o token expirar ou for revogado, execute novamente o assistente. Nunca envie o arquivo real de configuração para o GitHub ou suporte.
