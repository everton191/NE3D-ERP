# Regras arquiteturais

- Preservar o isolamento exclusivo do Simplifica 3D.
- Reutilizar `src/assistant-core`, `src/ai-3d` e os serviços reais antes de criar arquivos.
- Não criar `service-new`, `service2`, `utils-final`, `helper-new`, `page-v2` ou equivalentes.
- O LLM interpreta; validação, autorização, confirmação e escrita são determinísticas.
- WRITE permanece fail-closed sem `writePipeline` e capability autorizada.
- A aplicação deve funcionar integralmente sem modelo instalado.
- Pesos ficam em armazenamento privado Android ou `.models/`, nunca no Git.
- Memória de desenvolvimento (`.projeto-ai`) não se mistura com conversas/memória do usuário final.
- Não mover este projeto para `D:\Projetos`; esse diretório é somente para novos projetos.
