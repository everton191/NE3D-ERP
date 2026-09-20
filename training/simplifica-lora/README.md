# LoRA operacional do Simplifica 3D

Este diretório inicia o conjunto de treinamento do interpretador local. O modelo apenas escolhe uma ferramenta pequena e preenche seus argumentos. O aplicativo continua responsável por cálculo, validação, autorização e confirmação.

## Regras

- Não acessar configurações, conta, segurança, administração, empresa, sincronização ou backup.
- Não salvar, finalizar, enviar, excluir, cancelar, receber pagamento ou movimentar estoque.
- Copiar os valores informados pelo usuário sem alterá-los.
- Chamar a calculadora apenas quando o usuário pedir ou quando um campo derivado exigir cálculo.
- Consultar material, cor e saldo quando um pedido solicitar uso do estoque.
- Se o saldo não atender, mostrar alternativas reais ou preparar somente um rascunho solicitado.
- Nunca trocar material ou cor automaticamente; o usuário escolhe a alternativa.
- Nunca cadastrar, excluir, movimentar, reservar ou dar baixa no estoque.
- Perguntar por campos obrigatórios ausentes; nunca inventar.
- Manter exemplos de validação e teste separados do treinamento.

## Próximas metas do conjunto

- 100 a 200 exemplos normais por ferramenta.
- 50 a 100 variações de escrita e transcrição por ferramenta.
- 30 a 50 ambiguidades por ferramenta.
- 30 a 50 exemplos negativos por ferramenta ou área proibida.
- Divisão sugerida: 70% treino, 15% validação e 15% teste final.
