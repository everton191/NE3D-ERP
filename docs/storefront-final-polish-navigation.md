# Checkpoint Storefront Final Polish

## Escopo

Polimento incremental da Loja/Vitrine e do editor guiado, sem alterar regras de negocio, checkout, planos, Supabase ou publicacao remota.

## Navegacao interna

O retorno seguro da vitrine segue esta ordem:

1. fechar modal;
2. fechar painel inferior guiado ou menu mobile;
3. voltar para a rota anterior da vitrine;
4. voltar de uma rota interna para a home da vitrine quando nao houver historico;
5. sair da home da vitrine para `Loja Online` no ERP.

O mesmo contrato e usado pelo gesto fisico de voltar no perfil `android_apk`.

## Tema claro

O editor guiado respeita `data-store-theme="light"` e nao recebe mais tokens escuros incondicionais. Modais visuais externos ao shell tambem usam os tokens claros da vitrine.

## Editor e modelos

- A topbar desktop usa duas opcoes de preview e botoes compactos.
- O carrinho flutuante fica oculto durante edicao contextual.
- O cabecalho interno dos formularios guiados isola o estilo global de `header`, evitando grade herdada, campos espremidos e rolagem visual excessiva no painel mobile.
- A faixa superior da vitrine trunca nomes longos com seguranca em telas estreitas e preserva o botao de menu.
- Produtos-modelo exibem descricao e orientacao antes da clonagem.
- Acoes secundarias dos produtos reais ficam agrupadas em `Mais acoes`.
- Bordas discretas do editor acompanham Free, Start e Pro sem colorir toda a tela.

## Perfil APK

As correcoes vivem na base compartilhada Web/PWA/APK. O perfil `android_apk` recebe contencao de scroll e toque no painel inferior. A geracao e a publicacao do APK permanecem fora deste checkpoint visual.
