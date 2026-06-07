# Persistencia e sincronizacao da Loja Online - 2026-06-06

## Problemas corrigidos

- listas locais vazias de produtos e categorias eram substituidas novamente por
  conteudo de exemplo;
- a fila offline apenas mudava o status dos itens, sem executar a persistencia
  remota;
- a sincronizacao remota podia sobrescrever alteracoes locais ainda pendentes;
- cache da loja publica podia continuar exibindo uma versao anterior depois de
  uma alteracao no editor;
- falhas temporarias de rede em loja, categorias e produtos nao preservavam de
  forma uniforme a operacao para uma tentativa posterior;
- uma copia local sem o ID remoto podia tentar recriar a loja e falhar na
  restricao global `stores_public_slug_unique`.

## Contrato atual

1. Toda edicao valida e salva primeiro no armazenamento local por proprietario.
2. Quando a conexao remota esta disponivel, a operacao e enviada ao Supabase.
3. Quando o envio falha ou o dispositivo esta offline, a operacao entra na fila
   `simplifica-storefront-admin-offline-queue-v1`.
4. Ao voltar online ou sincronizar manualmente, a fila e processada da operacao
   mais antiga para a mais nova.
5. Dados remotos somente sao baixados depois que a fila termina e quando nao ha
   formulario local marcado como alterado.
6. Mudancas em loja, categorias, produtos e imagens invalidam o cache publico
   local da respectiva loja.
7. Antes de criar uma loja remota, o app recupera a loja ja pertencente ao
   usuario. Se o endereco inicial pertencer a outra loja, a primeira criacao
   recebe um sufixo estavel do proprietario. O editor comum apenas exibe esse
   endereco e nao permite altera-lo.
8. O endereco publico e criado somente no primeiro INSERT. Edicoes de banner,
   tema, contatos, configuracoes, publicacao e recuperacao de rascunho enviam
   apenas campos mutaveis por UPDATE.
9. Categorias e produtos sao localizados primeiro por ID e depois por
   `store_id + slug`; retries e conflitos reconciliam o registro existente antes
   de qualquer novo INSERT.
10. Salvamentos e uploads possuem trava por operacao para impedir duplo toque,
    reenvio simultaneo e duplicacao durante re-renderizacao.
11. O modelo atual concentra contatos e tema em `stores.theme_config`; nao
    existem tabelas separadas `store_contacts`, `store_theme` ou
    `store_sections` nesta versao.

## Operacoes cobertas pela fila

- salvar identidade/aparencia da loja;
- alterar status de publicacao;
- criar ou editar categoria;
- excluir categoria;
- reorganizar categorias;
- criar ou editar produto;
- alterar visibilidade/destaque do produto;
- excluir produto;
- concluir upload pendente de logo, banner e imagens de produto;
- excluir imagem de produto.

## Limites atuais

- a ordem manual de produtos ainda nao possui coluna propria no modelo remoto e
  permanece local;
- homologacao real entre dois dispositivos e com perda de rede durante upload
  continua recomendada.
