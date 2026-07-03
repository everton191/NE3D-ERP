# Simplifica Local Agent

Agente local somente leitura para OctoPrint, Moonraker, PrusaLink e gateways Bambu autorizados.

1. No ERP, abra `Impressoras > Agente local` e crie um agente.
2. Cadastre a impressora com o modo `Simplifica Local Agent` e associe o agente.
3. Copie `config.example.json` para um arquivo fora do repositório.
4. Preencha o token do agente, o ID da impressora e a conexão local.
5. Execute com Node.js 18 ou superior:

```powershell
node agent.js C:\caminho\seguro\config.json
```

O processo não abre porta pública e não recebe comandos. Ele apenas consulta status e envia snapshots ao Simplifica.
