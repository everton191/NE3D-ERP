# Arquitetura do Assistant Core

O Assistant Core é uma camada reutilizável e sem regra de negócio específica. Cada produto injeta um `assistant-pack`, adapters de leitura/navegação e sua própria política de modelo.

Fluxo principal:

```text
Launcher/Painel
  → contexto da tela + conversa
  → interpretação determinística ou provider local
  → Tool Registry
  → adapter do aplicativo
  → card/rota/rascunho
  → confirmação humana para WRITE
  → executor determinístico do domínio
```

Responsabilidades:

- `schemas`: contratos de manifest e contexto;
- `context`: tela, rota, entidades e capacidades atuais;
- `memory`: conversa, fatos corrigíveis e resumo compacto;
- `cache`: TTL e isolamento por conversa;
- `search`: busca normalizada/fuzzy sobre adapters;
- `tools`: registro, permissão, validação e execução;
- `navigation`: rotas autorizadas, parâmetros e pilha de retorno;
- `models`: catálogo, provider, capacidade, download e fallback;
- `attachments`: imagem privada e miniatura;
- `ui-contracts`: sete componentes sem regra de ERP;
- `security`: processamento local por padrão.

O pack `apps/simplifica/assistant-pack` está integrado ao ERP. Rural, Tec e Editor da Loja possuem manifests e namespaces próprios; não compartilham banco privado, preferências, conversa ou arquivo de modelo.

Limites atuais estão no marcador `IMPLEMENTATION_PROGRESS.md`. A existência de um contrato não significa que todos os adapters de todos os produtos já estejam ativos.
