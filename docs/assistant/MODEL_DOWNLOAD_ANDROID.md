# Download de modelo no Android

O download é opt-in e pertence ao próprio APK. `ModelArtifactManager` registra seleção, estado, progresso e metadados verificados; `LocalModelDownloadWorker` executa o trabalho em segundo plano.

Fluxo:

1. mostrar modelo, tamanho e compatibilidade;
2. pedir confirmação explícita;
3. verificar espaço e arquitetura;
4. baixar para `.part`, retomando com HTTP Range;
5. registrar progresso e permitir cancelamento;
6. validar tamanho exato e SHA-256;
7. mover atomicamente para o caminho versionado;
8. marcar `READY` e somente então inicializar.

Estados: `NOT_INSTALLED`, `CHECKING`, `DOWNLOADING`, `VERIFYING`, `INSTALLING`, `READY`, `FAILED`, `UPDATE_AVAILABLE`, `INCOMPATIBLE` e `EXPERIMENTAL`.

Atualização normal por `adb install -r`/loja preserva o modelo privado válido. Reinstalação com limpeza de dados exige novo download. Cancelar preserva o parcial para retomada; remover é uma ação separada e confirmada.

Evidência atual no Zenfone: E2B com `2.588.147.712` bytes, SHA-256 validado, backend GPU e preservação em múltiplas atualizações do APK.
