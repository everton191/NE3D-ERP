# Diagnóstico de espaço do disco C

Data: 2026-07-23

O levantamento inicial foi somente leitura. Depois de autorização expressa,
os modelos do Ollama foram movidos para o D e o cache temporário Xet do
Hugging Face foi removido, conforme o registro de execução abaixo.

## Execução autorizada

Data: 2026-07-23

- único modelo encontrado: `gemma4-3090:latest`;
- formato: GGUF, família Gemma 4, 25,8B parâmetros, quantização Q4_K_M;
- tamanho registrado pelo Ollama: 17.987.582.143 bytes;
- modelos movidos de `C:\Users\PAESS\.ollama\models` para
  `D:\Ollama\models`;
- variável de usuário `OLLAMA_MODELS` definida como `D:\Ollama\models`;
- origem e destino foram comparados antes da remoção: 6 arquivos e
  17.987.583.040 bytes em cada lado;
- catálogo validado pela API local do Ollama após a mudança;
- não havia outro modelo instalado para remover;
- cache temporário `C:\Users\PAESS\.cache\huggingface\xet`, com cerca de
  9,31 GB, removido sem processos Python, ComfyUI ou Xet ativos;
- espaço livre no C passou de 14,60 GB para 41,41 GB;
- espaço livre no D passou de 197,70 GB para 181,00 GB.

Uma inferência curta do modelo foi tentada depois da mudança, mas excedeu
180 segundos e foi cancelada. O catálogo, manifesto, tamanho e digest foram
reconhecidos corretamente; o desempenho de carregamento do modelo no D ainda
deve ser investigado antes de considerá-lo adequado para uso interativo.

## Substituição testada do modelo local

Data: 2026-07-23

- `qwen3-vl:30b` baixado diretamente em `D:\Ollama\models`;
- tamanho registrado: 19.595.410.062 bytes;
- família: `qwen3vlmoe`, 31,1B parâmetros, Q4_K_M;
- capacidades confirmadas: visão, texto, ferramentas e raciocínio;
- contexto configurado para os aplicativos: 8.192 tokens;
- carregamento inicial medido a partir do HDD: 12,95 segundos;
- modelo carregado 100% na RTX 3090;
- geração aquecida medida entre aproximadamente 117 e 143 tokens por segundo,
  incluindo tokens internos de raciocínio;
- teste visual reconheceu corretamente tela, pedido, cliente, status,
  quantidade e valor em uma captura real do Simplifica3D;
- API compatível com OpenAI retornou conteúdo visível corretamente;
- Android Studio 2026.1.2 alterado de `gemma4-3090:latest` para
  `qwen3-vl:30b`, com backups dos dois XMLs anteriores;
- depois do teste manual bem-sucedido no Android Studio,
  `gemma4-3090:latest` foi removido;
- `qwen3-vl:30b` passou a ser o único modelo instalado e o padrão do
  Android Studio;
- a remoção do Gemma aumentou o espaço livre no D para aproximadamente
  179,50 GB.

O armazenamento não altera o limite lógico de tokens do modelo. Um HDD afeta
principalmente download, primeiro carregamento e troca de modelos. Quando o
modelo está 100% na VRAM, a velocidade de geração depende majoritariamente da
GPU, do tamanho do contexto e da quantidade de tokens de raciocínio.

## Testes de contexto ampliado

Data: 2026-07-23

| Contexto | Resultado | Processamento | Velocidade | Observação |
| ---: | --- | --- | ---: | --- |
| 8K | aprovado | 100% GPU | 117–143 tokens/s | maior margem para imagens |
| 32K | aprovado | 100% GPU | cerca de 139 tokens/s | usa aproximadamente 24,0 GB de VRAM |
| 64K F16 | funcional, não recomendado | 88% GPU / 12% CPU | 46,7 tokens/s | primeiro teste levou cerca de 240 s |
| 64K Q8 | funcional, não recomendado | 98% GPU / 2% CPU | 16,6 tokens/s | deixou apenas cerca de 220 MB de VRAM |

O cache KV Q8 foi revertido para F16 porque apresentou falha de alocação do
projetor visual durante novos carregamentos. Também foram encontrados e
encerrados runners antigos de 8K e 64K que permaneceram órfãos após os testes.

Configuração final:

- Android Studio: entrada de 32.768 tokens e saída máxima de 8.192 tokens;
- `OLLAMA_CONTEXT_LENGTH=32768`;
- `OLLAMA_FLASH_ATTENTION=1`;
- `OLLAMA_KV_CACHE_TYPE=f16`;
- `OLLAMA_NUM_PARALLEL=1`;
- `OLLAMA_MAX_LOADED_MODELS=1`.

O teste limpo de 32K manteve o modelo 100% na GPU, mas deixou somente cerca de
321 MB livres. Para análise frequente de imagens grandes, 16K é a opção mais
segura. Para obter 64K com folga na RTX 3090, seria necessário um modelo visual
menor, como o Qwen3-VL 8B, com perda de capacidade em relação ao 30B.

## Proteção de VRAM para geração de mídia

ComfyUI e Hunyuan3D não utilizam a janela de contexto do Ollama. Eles mantêm
seus próprios modelos e fluxos, mas disputam a mesma RTX 3090. Para impedir que
o Qwen3-VL 30B permaneça ocupando a VRAM durante geração de imagem ou 3D, os
seguintes launchers passaram a executar `ollama stop qwen3-vl:30b` antes de
carregar seus modelos:

- `D:\AI-Fotos\Abrir AI Fotos.vbs`;
- `E:\AI3D\Iniciar Hunyuan3D.cmd`;
- `E:\AI3D\Iniciar API Blender.cmd`.

O serviço do Ollama permanece disponível. Ao voltar ao Android Studio, o Qwen
será carregado novamente do D automaticamente; por estar em HDD, esse primeiro
carregamento pode levar alguns minutos.

## Aplicativos de IA da Área de Trabalho

Foi realizada uma varredura nas duas Áreas de Trabalho do usuário. A única
integração ativa adicional que ainda apontava para o Gemma era o add-on
Assistente IA3D do Blender.

Alterações:

- `E:\AI3D\BlenderAddons\ai3d_assistant.py` passou a usar
  `qwen3-vl:30b`;
- o add-on do Blender usa contexto próprio de 8.192 tokens, saída máxima de
  2.048 tokens e `keep_alive` de 2 minutos para preservar VRAM;
- `C:\Users\PAESS\OneDrive\Desktop\AI3D-CONFIGURACAO-ATUAL.txt` foi
  atualizado;
- o antigo `Modelfile-gemma4-3090-8k` foi renomeado para
  `Modelfile-qwen3-vl-30b-8k` e atualizado;
- backups anteriores à troca foram salvos em `E:\AI3D\BackupAtual`;
- o teste real da API retornou JSON válido com `action=analyze` e carregou o
  Qwen 100% na GPU com contexto de 8K.

Não foram alterados:

- FLUX/ComfyUI, Hunyuan3D e Wan, pois utilizam modelos próprios;
- o Qwen 2.5 de 0,5B embarcado no APK do ERP, pois é um modelo móvel separado
  e o Qwen3-VL 30B não pode ser distribuído dentro do Android;
- arquivos de backup e ZIPs históricos.

## Situação dos discos

| Disco | Capacidade | Livre | Ocupação |
| --- | ---: | ---: | ---: |
| C: | 237,5 GB | 14,6 GB | 93,9% |
| D: | 931,5 GB | 197,7 GB | 78,8% |
| E: | 119,1 GB | 24,0 GB | 79,8% |

O disco D é o destino mais adequado para dados grandes que possuem configuração
oficial de pasta externa.

## Maiores consumidores identificados

| Local | Tamanho aproximado | Classificação |
| --- | ---: | --- |
| `C:\Users\PAESS\AppData\Local\Android` | 18,17 GB | SDK Android |
| `C:\Users\PAESS\.ollama` | 16,75 GB | modelos locais |
| `C:\Users\PAESS\OneDrive` | 15,77 GB | projetos e arquivos sincronizados |
| `C:\Users\PAESS\.cache` | 10,79 GB | principalmente Hugging Face/Xet |
| `C:\Users\PAESS\.gradle` | 9,44 GB | cache e distribuições Gradle |
| `C:\Users\PAESS\.android` | 7,77 GB | principalmente emulador Android |
| `C:\Users\PAESS\.codex` | 5,45 GB | sessões e estado do Codex |
| `C:\Users\PAESS\Documents\Codex` | 4,94 GB | artefatos antigos do Codex |
| cache do npm | 3,96 GB | cache recriável |

## Ações recomendadas

### Primeira etapa: menor risco

1. Remover pelo SDK Manager a imagem Android `android-37.0`, com cerca de
   2,89 GB. O emulador `Pixel_10_Pro` usa `android-37.1`, portanto a imagem
   `37.0` não é a imagem ativa.
2. Limpar o cache do npm, com potencial de até 3,96 GB. Pacotes necessários
   serão baixados novamente em builds futuros.
3. Revisar `C:\Users\PAESS\Documents\Codex\2026-04-28`, com cerca de 4,56 GB,
   e arquivar no D apenas os artefatos que não precisam permanecer no C.
4. Usar a opção do OneDrive **Liberar espaço** em arquivos já sincronizados,
   especialmente `Desktop\arquivos 3d` (cerca de 2,00 GB). Isso preserva os
   arquivos na nuvem e remove apenas a cópia local.

Potencial conservador desta etapa: aproximadamente 9 a 13 GB.

### Segunda etapa: mover com configuração

1. Mover os modelos do Ollama para o D usando `OLLAMA_MODELS` e reiniciar o
   serviço. Potencial: 16,75 GB.
2. Mover o AVD para o D usando `ANDROID_AVD_HOME`, com Android Studio e
   emulador fechados. Potencial: 7,76 GB.
3. Definir `GRADLE_USER_HOME` no D. O cache atual ocupa 9,44 GB e pode ser
   recriado ou migrado depois de parar os processos Gradle.
4. Definir `HF_HOME`/cache Xet no D. A parte Xet ocupa cerca de 9,31 GB.
   Excluir diretamente pode exigir novo download de modelos.

Potencial desta etapa: aproximadamente 43 GB.

## Itens que não devem ser apagados diretamente

- `C:\Users\PAESS\.codex`: contém sessões e estado do Codex, inclusive a tarefa
  atual;
- `C:\Users\PAESS\.android\avd`: o `Pixel_10_Pro` estava em execução durante o
  diagnóstico;
- `C:\Users\PAESS\.ollama`: Ollama estava em execução e há um modelo
  `gemma4-3090:latest`;
- NDK `27.0.12077973`: é exigido por
  `C:\Projetos\Echo-Music\app\build.gradle.kts`;
- `Desktop\erpNE3d`: é outro checkout Git, em outra branch, e possui arquivos
  não rastreados; deve ser preservado ou movido como projeto completo;
- `OneDrive\Documentos\.tmp.driveupload`: ocupa 2,30 GB, mas é estado interno
  do OneDrive. Deve ser tratado pelo cliente do OneDrive, não apagado
  manualmente;
- `output/` e `tmp/` do projeto atual: já existiam e não foram classificados
  como descartáveis nesta rodada.

## Ordem segura para execução futura

1. Fechar emulador, Android Studio, Ollama e tarefas de build.
2. Criar as pastas de destino no D.
3. Mover um componente por vez e configurar sua variável oficial.
4. Validar inicialização e uso do componente no novo local.
5. Somente depois da validação, remover a cópia antiga do C.
6. Conferir novamente o espaço livre e registrar o resultado.

Meta recomendada: deixar ao menos 35 a 50 GB livres no C para builds Android,
atualizações do Windows e arquivos temporários.
