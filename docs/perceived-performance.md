# Desempenho percebido

## Objetivo

A camada `window.SmartLoader` informa o andamento real de operações assíncronas sem atrasar ações rápidas. O feedback é discreto desde o início no botão acionado e ganha um painel contextual somente quando a operação continua ativa por mais de um segundo.

Não existem esperas artificiais. Conclusão, sucesso e erro acompanham a Promise ou operação real.

## Componente global

Arquivo: `src/services/smartLoaderService.js`

Recursos:

- spinner compacto;
- estado de botão;
- painel contextual;
- progresso determinado ou indeterminado;
- etapas em timeline;
- informações de upload;
- skeletons reutilizáveis;
- sucesso e erro;
- telemetria por duração.

API principal:

```js
const operationId = SmartLoader.start({
  name: "save-order",
  title: "Salvando pedido",
  message: "Validando dados...",
  button,
  steps: ["Validando dados", "Salvando pedido", "Finalizando"]
});

SmartLoader.update(operationId, {
  stepIndex: 1,
  progress: 60,
  message: "Salvando pedido..."
});

SmartLoader.success(operationId, "Pedido salvo");
```

## Limites de observabilidade

- 2 segundos: registra aviso de operação lenta;
- 5 segundos: registra possível gargalo;
- 10 segundos: registra erro de desempenho.

Os eventos são enviados ao diagnóstico local por `smartloader:performance`. Eles não interrompem nem repetem a operação.

## Telas com skeleton

Os presets globais cobrem:

- Dashboard;
- Pedidos;
- Clientes;
- Estoque;
- Relatórios;
- Loja Online;
- Produtos.

Durante a sincronização manual, a tela atual usa skeleton em vez de conteúdo vazio. O estado é removido no `finally`, inclusive quando a rede falha.

## Operações com feedback visual

- login;
- cadastro;
- sincronização manual com Supabase;
- pedido rápido;
- lançamento rápido no caixa;
- entrada rápida no estoque;
- upload de imagens da loja;
- salvamento de aparência da loja;
- salvamento de produtos da loja;
- publicação ou retirada da loja;
- geração, download, compartilhamento e impressão de PDF.

Os fluxos antigos que já usavam `setBotaoLoading()` passam a usar o estado visual central do SmartLoader sem trocar seus contratos.

## Upload de imagens

O upload mostra arquivo atual, quantidade total, bytes enviados, percentual, velocidade e estimativa quando esses dados são mensuráveis.

O upload atual do Storage usa uma requisição única. Por isso, o percentual de rede é indeterminado enquanto a requisição está em trânsito e chega a 100% somente na confirmação do servidor. O sistema não inventa progresso intermediário.

## Toasts

O sistema existente de toasts permanece como autoridade para mensagens globais:

- sucesso;
- aviso;
- erro;
- informação;
- carregamento.

O SmartLoader controla o estado contextual e delega a mensagem final aos fluxos existentes, evitando toasts duplicados.

## Possíveis gargalos encontrados

1. Sincronização manual executa perfil, fila offline e dois ciclos de backup sequencialmente.
2. Geração de PDF desenha todas as páginas no thread principal.
3. Upload para o Supabase Storage usa `fetch`, que não oferece progresso granular de envio no navegador.
4. Publicação da loja depende de reconciliação remota e pode aguardar a rede antes de confirmar.
5. Login dispara tarefas pós-login em paralelo; elas são silenciosas e podem prolongar a atualização de dados após a entrada.

## Operações ainda sem progresso granular

- restauração completa de backup;
- exportações CSV simples;
- pesquisas locais síncronas;
- tarefas silenciosas de pós-login;
- atualização remota individual de categorias e contatos;
- rotinas automáticas em segundo plano.

Essas operações continuam com toast ou estado de botão quando já existente. Devem receber progresso detalhado apenas quando houver etapas reais observáveis, evitando indicadores fictícios.

## Sugestões reais de otimização

1. Consolidar os dois uploads de backup da sincronização quando a reconciliação permitir.
2. Mover montagem pesada de PDF para Web Worker se medições reais confirmarem bloqueio acima de 2 segundos.
3. Usar upload resumível ou XHR somente se for necessário mostrar progresso de bytes durante arquivos grandes.
4. Medir consultas da loja por endpoint e reduzir payloads com seleção de colunas.
5. Registrar duração agregada por operação antes de otimizar, priorizando ocorrências acima de 5 segundos.

## Validação

Executar:

```bash
node --check app.js
node --check src/services/smartLoaderService.js
npm run test:perceived-performance
npm run test:restructuring-checks
npm run test:ui-overflow
npm run test:ui-responsive-balance
npm run build:web
git diff --check
```
