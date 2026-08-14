# Fase 1.5 — estabilização antes de WRITE

## Escopo

Esta fase mantém `READ` e `SIMULATION` habilitados e mantém toda Capability `WRITE` indisponível. Não existe confirmação de escrita, dry-run de escrita nem conexão com `fecharPedido()`.

## Harness Android fail-closed

O comando `npm run test:simplifica3d-ai-device-safe` somente libera um teste quando comprova, nesta ordem:

1. existe exatamente um aparelho ADB autorizado;
2. `br.com.ne3d.erp` é a Activity em foreground;
3. o PID pertence a esse pacote;
4. existe o socket `webview_devtools_remote_<pid>`;
5. o alvo CDP contém Capacitor Android e o novo núcleo da IA;
6. a página está visível;
7. o modal, input e botão do chat existem quando `--require-chat` é usado.

Qualquer divergência termina com exit code 2 e `ABORTADO`. O harness não usa `adb input text`, taps ou coordenadas.

## Tempos instrumentados

- `T_PARSE`: classificação/continuação.
- `T_CONTEXT`: construção do contexto orientado à tarefa.
- `T_PROVIDER`: chamada ao provider legado.
- `T_TOOL`: execução de READ ou SIMULATION.
- `T_RESPONSE`: tempo total do processamento da mensagem.

Os eventos ficam em um buffer local de no máximo 80 entradas, isolado pela conta. Não são registrados prompt, texto do usuário, Draft, dados de cliente ou resposta do modelo.

## Estados extremos cobertos automaticamente

- restauração do Draft após recriação do `ConversationTaskManager`;
- separação da sessão quando muda a chave da conta;
- falha estruturada de Tool sem detalhes internos;
- provider indisponível sem descarte da memória operacional;
- assunto contextual diferente sem apagar a tarefa;
- retorno ao pedido preservando o mesmo `taskId`;
- cancelamento explícito descartando apenas o Draft.

## Validação visual

O modal existente mostra um estado acessível de espera — “Pensando e consultando as informações necessárias...” — e bloqueia um segundo envio enquanto a resposta está em andamento. A aparência e a navegação existentes foram preservadas.

## Gate

Antes de qualquer teste futuro com WRITE, o harness seguro é obrigatório. A próxima fase deve continuar com `WriteCapabilityGate` fechado e executar confirmação somente em dry-run.
