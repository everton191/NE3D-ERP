# Decisões

## 2026-08-16 — infraestrutura mestre

- Manter o projeto no caminho atual; não migrar projetos existentes.
- Adotar memória externa em `.projeto-ai` sem copiar código-fonte.
- Reutilizar a arquitetura de IA existente e impedir raiz paralela.
- Usar índice incremental estrutural e termos esparsos localmente; embeddings densos ficam opcionais até existir modelo de embeddings instalado e validado.
- LiteRT é o único runtime embarcado real deste checkout; llama.cpp não será simulado.
