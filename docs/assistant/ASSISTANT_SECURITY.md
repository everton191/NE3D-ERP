# Segurança e privacidade da Assistente

## Regra padrão

A Assistente do Simplifica 3D opera em modo local. Texto, contexto operacional e imagens são entregues somente ao runtime local do próprio aplicativo (LiteRT-LM no Android ou runtime Web local quando realmente disponível).

O módulo `src/assistant-core/security/privacy-policy.js` registra essa fronteira de forma executável. A política padrão rejeita `REMOTE`, inclusive se um chamador isolado marcar consentimento. Um produto futuro só poderá liberar processamento remoto criando uma política própria com `allowRemote: true` **e** recebendo consentimento explícito naquela operação.

Nesta fase:

- não há pesquisa web pela Assistente;
- não há fallback silencioso para API externa;
- imagens não são enviadas a servidor de IA;
- dados do ERP não são enviados a provedor externo;
- `RemoteModelProvider` permanece desativado e bloqueia `send`;
- os modelos e preferências usam namespace próprio por aplicativo.

## Limites de operação

Tools `READ`, `NAVIGATION` e `CALCULATE` passam pelo registro de capacidades e pelos adapters do aplicativo. Operações `WRITE` não são executadas pelo modelo: a IA interpreta e prepara; o domínio valida; o usuário confirma; o executor determinístico persiste.

Rotas, tools e parâmetros desconhecidos são recusados. Mensagens de erro apresentadas ao usuário não exibem stack trace.

## Imagens

A interface consulta `supportsVision` retornado pelo provider/runtime e não deduz visão pelo nome comercial do modelo. Sem visão disponível, câmera e galeria não abrem e a interface explica que é necessário um modelo e runtime compatíveis.

Arquivos aceitos são validados, redimensionados e mantidos no armazenamento privado da conversa. O arquivo temporário criado pelo plugin Android para inferência é removido no bloco `finally`.

## Fallback de modelo

No modo Automático, uma falha de inicialização pode usar outro modelo compatível **somente se ele já estiver instalado e verificado no mesmo aplicativo**. O fallback não chama instalação nem inicia download. Se a IA Equilibrada não estiver instalada, o usuário recebe recomendação; qualquer download continua dependendo da confirmação explícita.

## Verificações

- `npm run test:assistant-model-policy`
- `npm run test:simplifica3d-ai-context-v2`
- `npm run test:simplifica3d-ai-operation-safety`
- `npm run test:simplifica3d-ai-rlm-security`
- build Android, instalação com `adb install -r` e teste local no aparelho
