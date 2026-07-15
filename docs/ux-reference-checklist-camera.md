# Checklist UX/UI - Referencias Camera.rar

Data: 2026-07-08

Origem: `C:\Users\PAESS\Downloads\Mobile Devices\Camera.rar`

Objetivo: transformar as sugestoes visuais do pacote em regras praticas para o Simplifica 3D, sem redesenhar telas existentes automaticamente. Use este checklist antes de criar ou ajustar tela, card, formulario, menu, modal, bottom sheet ou fluxo mobile.

## Checklist obrigatorio

- [ ] Campos de formulario usam caixas visiveis, nao apenas underline.
- [ ] Labels e placeholders explicam o dado esperado sem texto tecnico.
- [ ] Campo com erro mostra o erro perto do campo e indica exatamente onde ocorreu.
- [ ] Campos com tipo especifico usam layout adequado: codigo, data, telefone, dinheiro, percentual, hora e busca.
- [ ] Formularios longos sao quebrados em etapas ou secoes curtas.
- [ ] Acoes principais ficam visualmente mais fortes que acoes secundarias.
- [ ] CTA principal fica perto da area de toque do usuario no mobile.
- [ ] Elementos clicaveis parecem clicaveis e tem area de toque confortavel.
- [ ] Icones usados com texto ajudam contexto; icone sozinho precisa tooltip ou aria-label.
- [ ] Navegacao usa icones simples, familiares e consistentes.
- [ ] Itens relacionados ficam agrupados.
- [ ] Alinhamento horizontal e vertical segue grid claro.
- [ ] Fontes seguem a escala oficial do sistema e priorizam leitura.
- [ ] Texto com 4 linhas ou mais fica alinhado a esquerda.
- [ ] Interface evita preto puro e branco puro em superficies grandes.
- [ ] Tema escuro evita saturacao forte.
- [ ] Paleta usa poucas cores por tela, com status bem separados.
- [ ] Gradiente so entra quando melhora hierarquia, nunca como enfeite pesado.
- [ ] Loading novo usa skeleton quando o conteudo tem estrutura previsivel.
- [ ] Onboarding ou assistente sempre oferece pular/fechar quando nao for obrigatorio.
- [ ] Escolhas simples usam radio; checklist usa checkbox.
- [ ] Select com muitas opcoes permite digitar e rolar.
- [ ] Tap areas do mobile respeitam tamanho minimo e nao ficam coladas.
- [ ] Estados vazios dizem o que aconteceu e qual acao faz sentido.
- [ ] Modal destrutivo usa cor de perigo apenas na acao destrutiva.
- [ ] Mobile e desktop passam em rolagem vertical, horizontal intencional e sem overflow acidental.

## Aplicavel agora no Simplifica 3D

- [x] Reforcar documentacao de botoes, cards, inputs, icones, scroll e formularios.
- [x] Adicionar checklist objetiva para revisao antes de nova tela.
- [x] Manter sugestoes como regra de sistema, sem redesenhar visual existente nesta etapa.
- [x] Criar teste local para garantir que o checklist e o contrato continuem presentes.

## Pendente para aplicar quando mexer em telas

- [ ] Auditar formularios de login, cadastro, perfil, pedidos, estoque, caixa e relatorios contra esta lista.
- [ ] Trocar campos soltos por componentes/tokens oficiais quando a tela for alterada.
- [ ] Padronizar mensagens de erro por campo em formularios maiores.
- [ ] Conferir se todos os botoes de acao principal estao perto do polegar no mobile.
- [ ] Conferir skeleton loading em telas com listas longas.
- [ ] Revisar selects grandes para permitir busca.
- [ ] Revisar modais destrutivos para manter hierarquia de perigo correta.

## Nao aplicar automaticamente

- [ ] Nao trocar paleta global so por referencia generica.
- [ ] Nao transformar todo formulario em etapas sem necessidade.
- [ ] Nao adicionar gradientes em telas operacionais.
- [ ] Nao trocar fontes existentes sem teste visual completo.
- [ ] Nao alterar loja publica junto com ERP sem validar isolamento.

## Como usar

Antes de finalizar uma tela nova ou ajuste de UI:

1. Conferir `docs/ui-component-standards.md`.
2. Conferir `docs/icon-system-registry.md`.
3. Marcar este checklist.
4. Rodar o teste local de contrato:

```bash
npm run test:ux-reference-checklist
```
