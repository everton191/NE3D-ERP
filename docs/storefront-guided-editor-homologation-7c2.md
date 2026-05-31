# Fase 7C.1 / 7C.2 - homologacao do editor guiado

## Resultado tecnico

- A sessao autenticada disponivel foi validada no plano Pro.
- O editor guiado abriu pela navegacao real do ERP.
- O preview mobile usa a vitrine como superficie principal.
- A topbar extensa e a barra contextual ficam ocultas no mobile.
- O rodape mobile legado foi removido.
- O botao flutuante `Editar loja` abre o bottom sheet dentro da viewport.
- O botao `Editar loja` fica a esquerda e o carrinho flutuante a direita, sem sobreposicao.
- O toque no banner abre os campos correspondentes.
- `Adicionar produto` abre o formulario detalhado.
- O botao `Editar` de produto existente carregou o item correto.
- O WhatsApp recebe DDI brasileiro quando necessario e preserva DDI existente.
- O console permaneceu sem erros durante o smoke.

## Breakpoints mobile

Foram exercitados no navegador os tamanhos solicitados:

- `320px`
- `360px`
- `390px`
- `412px`
- `430px`

Em todos os tamanhos, o DOM confirmou ausencia de overflow horizontal, painel inferior fechado por padrao e botao flutuante como unico atalho persistente.

O bottom sheet foi aberto em `390px`, permaneceu dentro da viewport e fechou por acao explicita. O console permaneceu sem erros ou avisos.

## Desktop

O smoke desktop confirmou toolbar administrativa unica, barra contextual duplicada removida, rodape legado ausente e ausencia de overflow horizontal.

Foram validados `1366px`, `1440px` e `1920px`. Em todos os tamanhos, o DOM manteve exatamente uma toolbar, nenhum rodape legado e nenhum overflow horizontal.

## Pendencias de homologacao real

A matriz completa com contas descartaveis Free, Start, Pro e Super Admin ainda depende de sessoes autenticadas proprias. A sessao disponivel permitiu validar Pro. Criar, salvar, duplicar e excluir produtos remotos continua protegido pela confirmacao sensivel da conta e nao foi contornado.

Antes do push condicionado da fase, executar com contas descartaveis:

- salvar produto temporario e confirmar persistencia;
- trocar foto, duplicar e excluir o item temporario;
- abrir link publico depois da publicacao;
- validar Free sem publicacao;
- validar Start e Pro com publicacao conforme a regra atual;
- validar Super Admin.

## Cache PWA

O cache foi avancado para `simplifica-3d-v128-estavel-20260531-store-editor-toolbar` e o cache-bust web para `1.0.22-rc-store-editor-toolbar-20260531`.
