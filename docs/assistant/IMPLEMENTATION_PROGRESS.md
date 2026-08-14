# Andamento — Assistente Core Universal e IA Local Multimodelo

Atualizado em: 2026-08-14

Legenda: `[x]` concluída e validada; `[~]` em implementação; `[ ]` não iniciada; `[!]` bloqueio ou evidência insuficiente.

## Etapas

- [x] ETAPA 0 — Auditoria antes de alterar. Causa do aparelho novo confirmada por código e ADB em `AI_ARCHITECTURE_AUDIT.md`.
- [~] ETAPA 1 — Núcleo reutilizável. Estrutura, contratos e packs iniciais criados; integração completa ainda pendente.
- [~] ETAPA 2 — App Manifest. Contrato universal e manifest inicial do Simplifica criados.
- [~] ETAPA 3 — Contexto global da tela. Provider criado; registro em todas as rotas pendente.
- [x] ETAPA 4 — Conversa única global. Memória persistente ligada ao chat atual; nova conversa limpa mensagens e estado operacional sem apagar dados do ERP. Fluxo validado no aparelho.
- [~] ETAPA 5 — Contexto fixo 8192. Valor de referência aplicado no core; orçamento completo pendente.
- [~] ETAPA 6 — Memória/RLM controlada. Fatos, correções e prioridades criados; sumarização integrada pendente.
- [~] ETAPA 7 — Política de cache. Cache com TTL, runtime separado e cascata por conversa criados; anexos/embeddings reais pendentes.
- [~] ETAPA 8 — Tool Registry universal. READ/NAVIGATION/CALCULATE ligados às facades reais e WRITE reutiliza o pipeline existente.
- [~] ETAPA 9 — Busca natural. Motor fuzzy e adapters de pedidos/clientes/estoque ligados; resultados únicos, vazios e ambíguos já têm cards, mas a abertura direta de uma entidade entre múltiplas opções ainda precisa de aceite completo.
- [~] ETAPA 10 — Resultados e ambiguidade. Contratos de card para escolha, resultado e estado vazio implementados; seleção de uma opção ambígua ainda pendente.
- [~] ETAPA 11 — Navegação controlada. Registry ligado a `trocarTela`/`voltarTela`; comandos determinísticos para Home, Pedidos, Novo pedido, Estoque, Calculadora e Caixa foram validados no APK. Filtros visuais ainda estão pendentes.
- [~] ETAPA 12 — Preservar estado da tela. Pilha criada; drafts/filtros reais pendentes.
- [x] ETAPA 13 — Interface global mínima. Launcher discreto, arrastável, limitado à área útil e com posição persistida por usuário foi validado no Android; o painel abre sobre a tela atual.
- [x] ETAPA 14 — Cabeçalho contextual. Nome, estado, contexto global e chip removível implementados; remover o chip não apaga a conversa.
- [x] ETAPA 15 — Campo de mensagem. Adicionar, microfone, texto e envio implementados e inspecionados no Zenfone.
- [~] ETAPA 16 — Imagem/galeria. Câmera/galeria, MIME, EXIF, redimensionamento, JPEG compatível, thumbnail, IndexedDB e uma imagem por mensagem implementados. O fluxo completo com arquivo real foi validado; abertura manual dos dois seletores do sistema ainda será conferida no aceite visual.
- [~] ETAPA 17 — Resultado visual. Miniatura, estado de análise, resposta multimodal real e card persistente de análise estão funcionando; extração específica de hipóteses/ações diagnósticas ainda está pendente.
- [~] ETAPA 18 — Model Provider abstraction. Provider Android próprio integrado; providers Web/Remote pendentes.
- [~] ETAPA 19 — Model Registry. Catálogo versionado com artifact E2B imutável criado; consulta remota/atualização pendente.
- [x] ETAPA 20 — Três perfis. Leve, Equilibrada e Avançada aparecem na configuração; Leve/Avançada permanecem honestamente em validação e somente a Equilibrada oferece artifact funcional.
- [~] ETAPA 21 — Modo Automático. Seleção conservadora considera compatibilidade e todos os modelos instalados com metadados de verificação por modelo. Fallback E4B → E2B não pode ser validado enquanto o artifact E4B estiver indisponível.
- [~] ETAPA 22 — Device Capability Profiler. Android validado com 7,1 GB, 44 GB livres, ARM64, LiteRT-LM 0.15.0 e backend GPU; detecção PWA existe, mas ainda precisa de teste em navegadores com e sem WebGPU.
- [x] ETAPA 23 — Benchmark local. Benchmark curto automático/manual mede warmup, inicialização, geração e tokens/s. No Zenfone: GPU, 9.560 ms de inicialização, 753 ms de geração, 2,32 tokens/s e `READY`.
- [x] ETAPA 24 — Download em dispositivos novos. O próprio aplicativo baixou 2.588.147.712 bytes por HTTPS, verificou SHA-256, instalou e inicializou sem copiar o modelo por ADB.
- [~] ETAPA 25 — Download robusto. Progresso, Range/resume, retry, cancelamento, arquivo parcial, SHA-256 e rename atômico implementados. Cancelamento ficou estável em 726.424.191 bytes; retomada concluiu 2.588.147.712 bytes e ativou somente após checksum. Testes provocados de falta de espaço e perda de conexão ainda pendentes.
- [~] ETAPA 26 — Manifest versionado. `models/models-manifest.v1.json` criado com URL imutável por commit; hospedagem/refresh remoto pendentes.
- [x] ETAPA 27 — Atualizações do APK preservando modelo. Várias instalações `adb install -r` preservaram o arquivo validado de 2.588.147.712 bytes e a IA continuou respondendo sem novo download.
- [~] ETAPA 28 — Configuração de IA. Ativação, seleção, três perfis, recomendação, tamanho, estado instalado, perfil do aparelho, benchmark, progresso, cancelamento e remoção criados e inspecionados no Zenfone. Remoção após instalação integral ainda pendente para evitar apagar a evidência antes do aceite final.
- [~] ETAPA 29 — Desativar IA. Estado OFF padrão e unload implementados; teste de RAM pendente.
- [x] ETAPA 30 — Primeiro uso opt-in. Chat direciona à configuração própria, informa 2,4 GB e o download só começa após confirmação explícita; fluxo validado visualmente no Zenfone.
- [~] ETAPA 31 — PWA. Provider Web agora implementa catálogo, seleção, ativação, download, cancelamento, remoção, prewarm, unload, benchmark opcional e envio pelo mesmo contrato do Android. A PWA degrada com mensagem honesta; runtime e artifact web reais ainda não foram publicados.
- [~] ETAPA 32 — Storage PWA. OPFS preferencial e IndexedDB em blocos, namespace por aplicativo, quota/persistência, progresso, cancelamento, Range/resume, reinício seguro, tamanho exato, SHA-256, remoção e eviction foram implementados e testados por contrato. Teste com artifact grande em navegador real permanece na Etapa 45.
- [x] ETAPA 33 — Service Worker separado do modelo. Core/app shell entram no cache; manifest usa rede e nenhum modelo é baixado/cacheado pelo SW.
- [~] ETAPA 34 — Editor da Loja. Pack somente leitura criado; integração pendente.
- [x] ETAPA 35 — Componentes reutilizáveis. `AssistantLauncher`, `AssistantPanel`, `AssistantComposer`, `AssistantContextChip`, `AssistantResultCard`, `AssistantConfirmation` e `AssistantAttachment` foram extraídos para o pacote visual compartilhado, recebem identidade/escopo do app e estão integrados ao Simplifica. Os quatro packs foram instanciados isoladamente em teste automatizado.
- [x] ETAPA 36 — Ações contextuais. Home, Pedidos, Pedido, Estoque, Caixa, Calculadora e Produção exibem atalhos do contexto. Resumos de Home/Estoque/Caixa, listagem de pedidos, navegação e cálculo evitam LLM quando não necessário. A tela Estoque foi validada no Zenfone com resposta direta em cerca de 111 ms.
- [~] ETAPA 37 — Cards de resultado. Cálculo, cliente, estoque, histórico de pedido, busca vazia/ambígua, confirmação e análise de imagem têm cards persistentes e ações via NavigationRegistry. Card específico de produção ainda pendente.
- [~] ETAPA 38 — Estados de processamento. Pensando, consultando e analisando imagem refletem operações reais; granularidade específica para cada tool ainda será ampliada.
- [~] ETAPA 39 — Erros amigáveis. Modelo/download/checksum/compatibilidade/runtime e consultas vazias têm mensagens sem detalhes técnicos; testes provocados de todos os erros físicos ainda pendentes.
- [~] ETAPA 40 — Fallback de modelo. Android e PWA agora tentam outro modelo compatível somente no modo Automático e somente quando ele já está instalado/verificado; nunca iniciam download. O fallback Web Avançada → Equilibrada e a retenção do fallback passaram em teste. O Android compilou e a inferência E2B normal passou no Zenfone, mas o fallback físico E4B → E2B depende da disponibilidade futura do artifact E4B.
- [x] ETAPA 41 — Comportamento por capabilities. Texto, visão, áudio e tools vêm do provider/runtime e do descriptor, sem inferência pelo nome. Câmera/galeria só abrem com `supportsVision`; a ausência de visão foi simulada na WebView real e mostrou orientação sem abrir o menu. O E2B real informou texto, visão e tools ativos no Zenfone.
- [x] ETAPA 42 — Privacidade. Política local por padrão foi formalizada; Android e PWA local passam pela política e `RemoteModelProvider` bloqueia envio. Não existe fallback remoto, envio silencioso de imagem/contexto ou pesquisa web nesta fase.
- [~] ETAPA 43 — Testes automatizados. Core, contexto, lifecycle, UX, componentes visuais, política de modelo/privacidade, segurança, paridade/transação de pedido, RLM e storage/provider PWA têm regressões automatizadas. O teste de UI cobre os sete componentes, quatro packs, isolamento de escopo, escaping e integração real; o teste PWA cobre isolamento por app, capacidade, interrupção, cancelamento, retomada, servidor sem Range, checksum, artifact grande, remoção, provider Web e fallback entre modelos já instalados. Falhas físicas e browsers reais ainda pendem.
- [~] ETAPA 44 — Aparelho físico. APK atualizado, download próprio integral, SHA-256, retomada/cancelamento, preservação em atualização, reabertura, inferência textual GPU, visão local com imagem real, orçamento → calculadora, cards persistentes, launcher arrastável e matriz de navegação das áreas principais foram comprovados no Zenfone. Remoção e os seletores manuais de câmera/galeria permanecem para o aceite final.
- [~] ETAPA 45 — Teste PWA. Build servido em origem local nova abriu a tela de acesso sem erros de console e sem bloquear o aplicativo. Cenários autenticados com/sem WebGPU, artifact real, reload, offline e remoção em browsers reais ainda pendentes.
- [~] ETAPA 46 — Performance. Benchmark local registrou GPU, 9.560 ms de inicialização, 753 ms de geração e 2,32 tokens/s; ação determinística de estoque respondeu em cerca de 111 ms. Matriz comparativa entre aparelhos/PWA ainda pendente.
- [x] ETAPA 47 — Limites registrados e preservados: sem web real, voz contínua, WRITE automático, vetores globais ou download silencioso.
- [x] ETAPA 48 — Documentação. Os doze documentos obrigatórios de arquitetura, manifest, contexto/memória, tools, navegação, modelos, downloads Android/Web, UI, segurança, novo adapter e matriz de testes foram criados, além deste marcador de progresso.
- [ ] ETAPA 49 — Relatório final.

## Checkpoints de validação

1. Fundação universal: contratos, manifests, memória, busca, navegação e tool registry.
2. Integração Simplifica: rotas, contexto, sessão global, buscas e cards.
3. Modelos Android: provider próprio, download opt-in, checksum, instalação, remoção e atualização.
4. PWA: provider WebGPU, storage grande separado e degradação segura.
5. UI e mídia: launcher, painel, câmera/galeria, states e responsividade.
6. Aceite final: testes, builds, APK novo, Zenfone, PWA e documentação.

Nenhuma etapa parcial pode ser tratada como concluída apenas porque um arquivo existe. O marcador só vira `[x]` após teste proporcional ao requisito.

## Evidência do orçamento relatado

- Frase testada no APK instalado: `Faça um orçamento para uma peça de 20 gramas que leva 3 horas`.
- Resultado: a Assistente abriu a calculadora real, preencheu peso `20`, horas `3`, minutos `0` e mostrou `R$ 20,32` usando a configuração atual do ERP.
- Ao reabrir a conversa, o card `Orçamento calculado` permaneceu salvo com ID, timestamp, metadados, peso, tempo, quantidade e botão `Abrir calculadora`.
- O botão do card reabriu a calculadora com os mesmos dados mesmo após reinstalar o APK com `adb install -r`.
- O modelo Gemma 4 E2B permaneceu com `2.588.147.712` bytes, metadados SHA-256 por modelo e saúde `READY` no backend GPU.

## Evidência das funções principais e do botão flutuante

- No APK `1.0.33` (`versionCode 61`) recém-instalado, `Abrir a Home`, `Abrir pedidos`, `Abrir novo pedido`, `Abrir estoque`, `Abrir calculadora` e `Abrir caixa` chegaram às seis telas esperadas.
- `Liste os pedidos`, `Quais materiais estão acabando?`, `Quanto vendi hoje?` e `Mostre o resumo da Home hoje` executaram respectivamente `ORDER.SEARCH`, `STOCK.SUMMARY`, `CASH.SUMMARY` e `HOME.SUMMARY` pelas tools do ERP, sem cair no provider conversacional.
- `Veja se tem filamento preto no estoque` executou `STOCK.SEARCH` com a busca limpa `filamento preto`; o aparelho retornou `NOT_FOUND` porque não havia correspondência, sem perguntar preço do filamento.
- O launcher foi arrastado de `(315, 666)` para `(100, 280)`, suprimiu o clique acidental ao soltar, abriu normalmente no toque seguinte e restaurou `(100, 280)` após reinstalar o APK.
- Após a extração visual, o APK foi reconstruído e instalado com `adb install -r`; Home, Pedidos, Estoque, Calculadora e Caixa foram novamente acionados pela conversa na WebView real. O orçamento preencheu `20 g`, `3 h` e retornou `R$ 20,32`.
- O launcher reutilizável foi arrastado de `(100, 280)` para `(10, 100)`, gravou essa coordenada no armazenamento da conta e reaplicou exatamente a posição após ser renderizado novamente.

## Evidência dos componentes reutilizáveis

- O pacote `src/assistant-core/ui-contracts/components.js` fornece os sete componentes da ETAPA 35 sem conter regra de negócio do ERP.
- O Simplifica injeta nome, identidade, escopo e handlers pelo adapter e consome os sete componentes no chat instalado.
- `test:assistant-ui-components`, `test:simplifica3d-ai-assistant-ux` e `test:simplifica3d-ai` passaram após a extração, incluindo escaping contra HTML injetado.
- No Zenfone, `AssistantLauncher`, `AssistantPanel` e `AssistantComposer` foram encontrados na WebView real; na Home o painel mostrou `Resumo de hoje`, `Abrir pedidos` e `Abrir calculadora` como ações contextuais.

## Evidência de capabilities, fallback e privacidade

- Após `adb install -r`, o arquivo E2B continuou com `2.588.147.712` bytes e o plugin retornou `READY`, `supportsText=true`, `supportsVision=true` e `supportsTools=true`.
- A inferência local pós-refactor respondeu `Sim, estou funcionando corretamente.` e confirmou backend `GPU`, sem fallback ativo.
- Com `supportsVision=false` simulado na WebView, o botão mostrou `Imagem requer modelo compatível`, não abriu o menu e exibiu a explicação amigável.
- `test:assistant-model-policy` comprovou política local, bloqueio remoto, fallback Android sem chamada de instalação e consumo de capabilities; `test:assistant-pwa-model-storage` comprovou Avançada falhando e Equilibrada já instalada assumindo sem novo download.

## Evidência do storage/provider PWA

- `test:assistant-pwa-model-storage` comprovou namespace independente para `simplifica-3d`, `simplifica-rural`, `simplifica-tec` e `simplifica-store-editor`.
- O teste cobriu download integral, progresso, cancelamento preservando parcial, retomada com `Range`, reinício quando o servidor ignora `Range`, falta de espaço, checksum inválido, verificação incremental pelo runtime, remoção e não baixar novamente um artifact `READY`.
- O provider Web foi exercitado com runtime controlado: ativação, seleção, carregamento com contexto `8192`, resposta, benchmark e unload passaram; WebGPU ausente, runtime ausente e catálogo web ausente produziram indisponibilidade explícita.
- O build web abriu em `http://127.0.0.1:4177/` numa origem nova, exibiu a tela de acesso completa e não registrou erro ou aviso no console. A tela autenticada não foi simulada nem declarada validada.
