# Melhorias Simplifica 3D — setembro de 2026

## Entrega e publicação

Pedido: implementar incrementalmente e guardar localmente para uma publicação conjunta.
Branch: `codex/melhorias-setembro-2026`. Base: `4c0a839`.
Não enviar commits ao GitHub, publicar Vercel ou aplicar migrações em produção nesta fase.
Arquivos não rastreados anteriores ao trabalho devem ser preservados e excluídos dos commits.

## Etapas

1. Persistência: densidade padrão, tema entre aparelhos, edição pendente, formulário parcial e troca de sessão.
2. Segurança: verificar isolamento real, autorização do segundo fator no servidor, RPCs e restauração de backup; preparar correções locais.
3. Desempenho: medir baseline; otimizar salvamento e carregamento por módulo sem reescrita global.
4. Usabilidade: consolidar o fluxo orçamento, aprovação, produção, entrega e recebimento.
5. Diferenciais: aproveitar bases existentes para lucro realizado, aprovação por link e reserva de material.
6. Produção e IA: planejar capacidade, avaliar integrações e validar ações com confirmação.
7. Regressão integrada e publicação conjunta somente após validação das etapas.

## Primeiro lote — implementado e validado localmente

- Aceitar explicitamente densidade `default` na normalização e no recebimento remoto.
- Preferir tema remoto quando não há edição local pendente, atualizando o cache de inicialização.
- Recusar leitura remota durante uma edição pendente.
- Preservar checkboxes ausentes em formulários parciais.
- Persistir a marca de pendência antes de tentar salvar preferências Free na rede.
- Descartar leitura que terminou depois de uma troca de usuário.
- Testes comportamentais em `scripts/test-settings-persistence-behavior.js`.

Validação de 2026-09-05: 6 testes comportamentais passaram, além de lint, typecheck, theme-account-ui, theme-isolation, build:web e git diff --check. Nenhuma escrita em produção foi realizada.

## Pendências e limites

As etapas 2 a 7 não estão concluídas. Este documento não é certificação de publicação.
O teste local com dependências simuladas não substitui dois navegadores autenticados, teste offline real ou isolamento RLS.
Próximo trabalho de persistência: serializar gravações rápidas em voo e proteger conclusão assíncrona após troca de conta; revisar todos os chamadores do salvamento remoto.
Antes da publicação: conferir migração de preferências antigas, cache/service worker, Android e web; renovar identificador dos assets no lote final.
