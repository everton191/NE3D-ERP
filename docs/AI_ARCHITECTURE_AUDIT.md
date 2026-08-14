# Auditoria de arquitetura da IA

## Arquitetura atual

`Chat em app.js -> Simplifica3dAiRuntime -> Capacitor SimplificaLocalAiPlugin -> ContentProvider externo br.com.simplifica.ai.provider -> JSON -> Simplifica3dAiActions -> Simplifica3dErpBridge`.

O runtime Android não pertence integralmente ao Simplifica 3D: delega download, estado e geração a um aplicativo/provider compartilhado. Isso conflita com o requisito de modelo, configuração e runtime próprios do 3D.

## Inventário e classificação

| Componente | Arquivo | Estado |
|---|---|---|
| Chat/modal | `app.js:46566-46662` | PARCIAL |
| Memória de mensagens | `app.js:46566-46589` | FUNCIONAL, limitada |
| Runtime web | `src/services/simplifica3dAiRuntime.js` | PARCIAL |
| Prompt | `SimplificaLocalAiPlugin.java` | PARCIAL, embutido |
| Provider local | ContentProvider externo | NÃO PERTENCE AO CHECKOUT |
| Registro/normalização de actions | `simplifica3dAiActions.js` | PARCIAL |
| Bridge/executor | `app.js:20517-20546` | NÃO CONECTADO para writes |
| Tools formais | inexistentes | AUSENTE |
| Capabilities/readiness/self-test | inexistentes | AUSENTE |
| Memória operacional/draft/task stack | inexistentes | AUSENTE |
| Permissão no caminho IA | inexistente | AUSENTE |
| Idempotência/queue/telemetria IA | inexistente | AUSENTE |

## Causas confirmadas

### Modelo ausente em aparelho novo

O APK `br.com.ne3d.erp` não possui runtime, catálogo, URL, checksum nem gerenciador de artifacts de modelo próprios. `SimplificaLocalAiPlugin` chama o provider externo `content://br.com.simplifica.ai.provider` e delega a ele `status`, `ensure_model` e `generate`. O `ensure_model` executado em `load()` também é silencioso e pertence ao aplicativo externo, não ao ERP.

Auditoria física realizada em 2026-08-13 no ASUS I005DA conectado por ADB:

- `br.com.ne3d.erp` versão `1.0.33` (`versionCode 61`) estava instalado;
- `br.com.simplifica.ai` versão `0.3.0` (`versionCode 3`) também estava instalado;
- ambos tinham a mesma assinatura e o ERP solicitava `br.com.simplifica.ai.permission.USE_LOCAL_AI`;
- o provider resolvia para `br.com.simplifica.ai/.SharedAiProvider`;
- `br.com.simplifica.ai/files/models/gemma-4-E2B-it.litertlm` ocupava aproximadamente 2,4 GB;
- `br.com.ne3d.erp/files/models` não continha o modelo.

Portanto, o aparelho de desenvolvimento funciona porque tem um segundo APK, assinado de forma compatível, que já armazena o modelo. Instalar somente o APK do Simplifica 3D em outro aparelho não instala esse provider e não oferece caminho próprio de download. A dependência não é de ADB em tempo de execução, mas de um aplicativo auxiliar previamente instalado/configurado; ADB ou instalação manual apenas mascaram essa dependência durante o desenvolvimento.

Correção exigida: substituir essa dependência implícita por um `ModelArtifactManager` pertencente ao produto distribuído (ou empacotar e instalar explicitamente um provider obrigatório como parte verificável da distribuição). O fluxo deve ser opt-in, expor tamanho/progresso, baixar por HTTPS, retomar, validar SHA-256, instalar atomicamente e ativar somente após self-test. Até isso existir, a IA deve permanecer indisponível de forma clara em instalações novas, sem fingir que o modelo será preparado.

### Executor de operações incompleto

O prompt permite `pedido.criar`, `pedido.status`, `estoque.entrada` e `caixa.lancar`. `Simplifica3dAiActions` normaliza essas ações e exige confirmação. Depois, `Simplifica3dErpBridge.execute()` só trata `chat`, `navegar`, `caixa.consultar`, `estoque.consultar` e `producao.status`; qualquer outra ação cai no `throw` de `app.js:20544`. É um executor incompleto, não um erro de mensagem. Apagar o texto apenas ocultaria a falha.

## Placeholders relacionados à IA

- `app.js:20544`: executor de alteração não conectado — P0.
- Mensagens “modelo compartilhado”/“IA compartilhada” no runtime e plugin — incompatibilidade arquitetural P0.
- Não foram encontrados outros TODO/FIXME específicos do núcleo da IA fora desse caminho; placeholders de OAuth/loja são fora do escopo.

## Dados e duplicações

O bridge lê diretamente arrays/estado globais (`pedidos`, `estoque`, `caixa`) em vez de serviços de consulta. Escritas ainda não existem. O registro de actions duplica parcialmente nomes/regras superficiais, mas não há repositories `Ai*`. O maior risco é conectar o bridge diretamente a arrays/`salvarDados()` e assim contornar validações manuais.

## Prioridades

### P0

- Capabilities de escrita são anunciadas sem executor.
- Provider/modelo compartilhado e externo ao 3D.
- Ausência de continuidade operacional: cada mensagem vira uma nova ação.
- Confirmação usa `window.confirm` e passa `true` ao executor; não há pending action robusta.
- Sem PermissionGuard/plan guard no caminho IA.

### P1

- Contexto contém snapshots indiscriminados e só estoque baixo, não busca relevante.
- Parser extrai o primeiro bloco `{...}` por regex, sem schema/versionamento.
- Erros técnicos do bridge podem chegar diretamente ao chat.
- Não há resolução de entidades, idempotência, fila nem resultados estruturados.
- UseCases explícitos são escassos; o domínio principal vive em funções monolíticas.

### P2

- Prompt e versão do modelo não têm catálogo/versionamento.
- Sem métricas de latência, tokens ou lifecycle observável.
- Teste atual prova strings/contrato, não comportamento real.

## Preservar

Modal contextual, armazenamento escopado por conta, `CalculatorDomain`, `InventoryService`, rascunho manual de pedido, guards de plano/sensibilidade, `ErrorService`, telemetria existente e funções operacionais manuais maduras.

## Corrigir/criar depois do gate

Criar provider próprio 3D, armazenamento abstrato, sessão/tarefa/draft, registries com readiness, adapters para operações existentes, schemas/resultados, resolver/validator/permissions/confirmation e executor fino. Antes de conectar writes, extrair ou formalizar UseCases a partir dos fluxos manuais, incrementalmente.

## Arquivos previstos

`src/services/simplifica3dAiRuntime.js`, `src/services/simplifica3dAiActions.js`, novos módulos sob `src/ai-3d/`, `app.js` apenas como composição/adapters, código Android próprio do modelo, testes em `scripts/` e estes documentos. Nenhum módulo Rural/TEC.

## Risco de regressão

Alto em pedidos/estoque/caixa por acoplamento global; médio em startup Android; baixo na UI se o modal existente for preservado. Mitigação: leitura primeiro, adapters para o caminho manual, testes de paridade e writes somente após confirmação/idempotência.
