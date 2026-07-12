# Auditoria das fórmulas da Calculadora

## Fluxo encontrado

`renderCalculadoraConteudo` coleta peso, tempo, lote e taxa. `calcular` validava os campos e realizava todas as fórmulas diretamente em `app.js`. `confirmCalculatorResult` convertia o resultado em item; pedido, PDF e WhatsApp consumiam esse item e os totais do pedido.

## Causa raiz comprovada

O lote antigo lia `quantidade`, mas não multiplicava peso ou tempo. Calculava custos uma vez e dividia o preço pela quantidade. Não havia como declarar se os dados eram de uma peça ou do lote inteiro. Isso tornava os dois casos indistinguíveis e produzia valor unitário incorreto quando peso e tempo eram por peça.

## Fonte única

`src/services/calculatorDomain.js` é o domínio determinístico. A unidade canônica de tempo é minuto e o material usa gramas. A tela e o payload do item recebem o mesmo objeto `ultimoCalculo` derivado desse domínio.

| Cálculo | Fórmula anterior | Problema encontrado | Fórmula final | Teste |
|---|---|---|---|---|
| Material | `(peso / 1000) * preçoKg` | correta, mas usava peso ambíguo no lote | `pesoTotalG * (preçoKg / 1000)` | passou |
| Energia | `(W / 1000) * horas * tarifa` | correta, mas tempo ambíguo no lote | `(W / 1000) * horasTotais * tarifa` | passou |
| Máquina | `horas * custoHora` | correta, mas tempo ambíguo no lote | `horasTotais * custoHora` | passou |
| Lote | custo único e `preço / quantidade` | peso/tempo por peça nunca multiplicados | por peça multiplica peso e minutos; lote inteiro preserva ambos | passou |
| Taxa percentual | `valorProduto * percentual / 100` | correta, ativação implícita | `subtotalBase * percentual / 100`, somente quando ativada | passou |
| Taxa fixa | valor informado | correta, ativação implícita | valor fixo, somente quando ativada | passou |
| Margem/markup | `custo * (1 + percentual/100)` | interface chama de margem, fórmula é markup | fórmula preservada como acréscimo/markup para compatibilidade | passou |
| Arredondamento | `ceil(total/passo)*passo` | correta; aplicada no fim | preservada no fim, sem arredondamento intermediário | passou |

## Inventário de unidades e consumidores

- Peso informado: gramas.
- Preço de material: reais por quilograma; convertido uma vez para custo por grama.
- Tempo informado: horas e minutos; convertido uma vez para minutos.
- Energia: watts para quilowatts e minutos para horas.
- Custo de máquina: reais por hora.
- Acréscimo comercial: percentual tratado como markup.
- Taxa extra: percentual sobre subtotal após markup ou valor fixo.
- Pedido: recebe `valor` unitário e `total = valor * quantidade`.
- PDF e WhatsApp: consomem itens e total do pedido; não recalculam material, energia ou lote.

## Reconciliação

Tela, item salvo e pedido compartilham `unitPrice` e `totalPrice`. O item mantém campos legados (`peso`, `tempo`, `qtd`, `valor`, `total`) e acrescenta `loteAtivo`, `modoLote`, `pesoInformado`, `pesoTotal`, `tempoInformadoMinutos`, `tempoTotalMinutos`, `taxaExtraAtiva` e `tipoTaxaExtra`. PDF e WhatsApp usam o total do pedido, evitando uma segunda fórmula.

## Não reproduzido

O cálculo incorreto original não veio acompanhado dos valores exatos de perfil, peso, tempo, quantidade, modo e taxa. A falha estrutural do lote foi comprovada e corrigida, mas não é possível afirmar que reproduz exatamente o caso observado sem esses dados.

## Compatibilidade e riscos

- Registros antigos continuam legíveis por fallback dos campos existentes.
- O termo histórico `margem` permanece nos dados, embora a fórmula seja markup. Renomear contratos persistidos exigiria migração fora deste escopo.
- Não existem regras explícitas de mão de obra, embalagem, impostos ou taxa de pagamento dentro desta Calculadora; não foram inventadas.
- Nenhuma publicação foi realizada.
