# Adicionar a IA a outro aplicativo

O núcleo é compartilhável, mas dados, permissões, conversa e modelos devem permanecer isolados por aplicativo.

## 1. Criar o assistant-pack

Crie `apps/<app>/assistant-pack/index.js` com:

- `manifest.appId` exclusivo;
- domínios, rotas, entidades e capabilities reais desse aplicativo;
- `modelScope` exclusivo e estável;
- lista `tools` ligando cada capability ao nome do adapter esperado;
- `createRuntime(options)` usando `AppAssistantRuntime`;
- status `READY_FOR_APP_ADAPTER` enquanto as funções reais ainda não estiverem conectadas.

Não coloque no core nomes específicos como pedido, filamento, animal ou ordem de serviço.

## 2. Criar adapters reais

O aplicativo cria o runtime e injeta seus adapters reais:

```js
const runtime = assistantPack.createRuntime({
  storage,
  navigate,
  back,
  permissionGuard,
  writePipeline,
  modelRuntime,
  modelArtifacts
});

const readiness = runtime.bindAdapters({
  searchOrders: (input) => orderService.search(input),
  navigate: (input) => appNavigation.open(input)
});
```

Somente mude o status do pack para `ACTIVE` quando `readiness.ready` for verdadeiro e os adapters tiverem sido testados no aplicativo correspondente.

Cada tool READ consulta os serviços atuais do próprio aplicativo. NAVIGATION aceita apenas rotas do manifest. WRITE deve reutilizar o pipeline de segurança do aplicativo e permanecer indisponível quando algum guard não existir.

## 3. Isolar estado

Use identificadores diferentes para:

- conversa e memória;
- anexos;
- cache de busca;
- configurações do provider;
- `modelScope` do armazenamento de artifacts.

Exemplos reservados nesta estrutura:

- `simplifica-3d`;
- `simplifica-rural`;
- `simplifica-tec`;
- `simplifica-store-editor`.

Mesmo quando dois aplicativos usam o mesmo modelo, nenhum deles deve assumir acesso direto ao diretório privado do outro.

## 4. Configurar o provider

Android injeta seu plugin/runtime próprio no adapter de `ModelProvider`. PWA instancia:

```js
new WebLocalModelProvider({
  appId: assistantPack.modelScope,
  runtime,
  artifacts,
  navigatorRef: navigator
});
```

Não anuncie visão, áudio ou tools apenas pelo nome do modelo. Faça a interseção das capabilities do descriptor com as capabilities realmente expostas pelo runtime.

## 5. Gatilhos de ativação

- IA começa desligada.
- Modelo não fica dentro do APK nem no service worker.
- Download só começa após confirmação explícita.
- Falta de IA não bloqueia as funções normais do aplicativo.
- Remover modelo não apaga conversa nem dados do domínio.

## 6. Validação mínima antes de ativar

- manifest e rotas aceitam apenas IDs conhecidos;
- READ executa pelo serviço real;
- WRITE desconhecido ou sem guard falha fechado;
- conversa persiste ao mudar de tela;
- nova conversa limpa somente a sessão;
- armazenamento e remoção estão isolados pelo `modelScope`;
- download interrompido retoma ou reinicia com segurança;
- checksum inválido nunca chega a `READY`;
- navegador sem WebGPU continua usando o aplicativo normalmente;
- build do aplicativo e teste no aparelho/navegador alvo passam.

Rural, Tec e Editor da Loja possuem manifestos e runtimes isolados prontos para receber adapters. Os serviços reais e a integração visual ainda devem ser implementados e validados nos respectivos projetos antes de mudar o status para ativo.
