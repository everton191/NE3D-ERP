# Editor visual simples da loja - primeira etapa

## Escopo entregue

A primeira etapa reutiliza o editor guiado existente e mantém a loja visível
durante a edição. Nenhum segundo editor ou fluxo comercial foi criado.

- menu superior da própria loja baseado nas categorias visíveis;
- categorias em rolagem horizontal no mobile;
- painel simples para produto, categoria, banner, identidade e contato;
- exemplos de Impressão 3D com nomes coerentes com as fotos locais;
- checklist básico de preparação da loja;
- confirmação antes de trocar item, sair ou voltar com alterações não salvas;
- ações compactas no desktop e barra Voltar, Salvar e Mais no mobile;
- uma única ação Compartilhar loja, com cópia automática como fallback;
- resumo da Loja Online sem ações repetidas de editar, compartilhar e copiar;
- exemplos podem ser editados, transformados em itens reais ou removidos.

## Responsabilidades preservadas

- regras Free, Start e Pro não foram alteradas;
- publicação e persistência continuam usando os fluxos existentes;
- `public_slug` e a persistência idempotente da loja permanecem preservados;
- editor completo continua disponível pelo fluxo existente, sem aparecer junto
  do editor visual simples;
- loja pública continua sem controles administrativos.

## Modelo inicial

Nesta entrega somente o modelo Impressão 3D foi preparado. Os seis produtos de
exemplo usam fotos locais já licenciadas e agora possuem títulos e descrições
compatíveis com o conteúdo visual:

- Peça técnica flexível;
- Protótipo funcional;
- Miniatura personalizada;
- Modelo orgânico;
- Maquete arquitetônica;
- Vaso decorativo.

Os demais nichos ficam para entregas futuras, depois da homologação do primeiro
modelo.

## Validação

O teste `test:storefront-visual-simple-editor` protege a estrutura visual
simples, a edição guiada, a confirmação de alterações não salvas, a navegação
por categorias, os exemplos e a ausência de ações redundantes.

Também devem continuar passando os testes existentes de editor guiado,
persistência, publicação, PWA, responsividade, overflow e regras de planos.

Foi executada validação autenticada no navegador local em desktop e mobile:

- editor guiado abriu sobre a loja real;
- painel simples de produto abriu com nome, descrição, valor e categoria;
- alteração local marcou o item como não salvo;
- troca de item exibiu a confirmação antes de perder a edição;
- categorias ficaram roláveis no mobile;
- barra de ações mobile permaneceu dentro da área visível;
- resumo da loja ficou com uma ação de editar e uma de compartilhar;
- não houve overflow horizontal nem erro de console.

Web/PWA foram regenerados com cache
`simplifica-3d-v154-storefront-visual-simple-20260606`. O APK de teste foi
compilado como `1.0.26-rc`, código `25`.

## Homologação manual ainda necessária

- salvar uma edição remota descartável e validar upload de foto;
- validar APK em aparelhos Android reais com gestos e com três botões;
- confirmar upload e troca de foto usando uma conta de teste;
- validar publicação real em conta Start e Pro.
