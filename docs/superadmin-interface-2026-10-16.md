# Superadmin — controles proporcionais e interface mais simples

16/10/2026 · `codex/melhorias-setembro-2026` · base `0464f7a`.

## Entrega

- Ajuste somente de apresentação no CSS canônico do Superadmin V3. Nenhum
  handler, função, permissão, assinatura, plano ou regra administrativa removido.
- Escala única: mínimo de 40 px no desktop e 44 px no mobile, com altura
  automática para rótulos maiores, texto de ação de 13 px e quebra sem corte.
- Ações deixam a grade global de quatro colunas; largura pelo conteúdo no
  desktop e reorganização local no mobile. Cards dos planos mantêm ações
  alinhadas; preço informativo e legenda não se sobrepõem.
- Widgets operacionais de 104 px passam a 80 px desktop / 76 px mobile.
  Todos os quatro widgets, ícones, contagens e acessos permanecem.
- Cabeçalho mobile separa título, busca e Sistema interno: o botão não cobre
  mais o título. Busca por e-mail em Configurações usa a largura disponível.
- Editar/Plano e itens do submenu deixaram as regras legadas de 26 px e fonte
  de 8,5 px. Coluna, wrapper e acionador dos menus usam a mesma escala.
- Removida a exceção antiga de 42 px dos botões de empresas no próprio módulo,
  em vez de manter duas escalas concorrentes. Cores de risco, disabled e foco
  continuam com os contratos existentes.
- URLs dos estilos atualizadas para invalidar referências antigas; nenhuma
  mudança no service worker ou na lógica de sincronização.

## Verificação

**PASS — navegador integrado com Auth e dados fictícios exclusivamente locais.**
Percorridas as 12 áreas principais e os 7 submenus do perfil de empresa no
desktop. Sem estouro horizontal do documento/raiz nem rótulos de botões cortados
nas medições dessas telas. Isso não testa o resultado de cada operação do backend.

Medidas finais observadas, em pixels CSS:

| Tela / controle | Desktop | Mobile |
| --- | --- | --- |
| Larguras efetivamente medidas | 1.365 e 1.706 | 389 |
| Atualizar / Exportar / Sistema interno | 40 de altura | 44 de altura |
| Editar / Plano na lista de empresas | 40 de altura | 44 de altura |
| Acionador e wrapper do menu | 40 de largura | 44 de largura |
| Seis itens do submenu de empresas | — | 44 de altura, fonte 13, sem corte |
| Widgets de Configurações | 80 de altura | 76 de altura |
| Campo Buscar por e-mail | largura disponível | 277 de largura |

Empresas, Planos, Configurações e perfil também conferidos no mobile, sem
estouro horizontal ou sobreposição entre título e Sistema interno. A ferramenta
de viewport usa escala do navegador: as larguras acima são as reais do DOM,
não os números nominais solicitados ao controle de janela.

**PASS — 15 suítes locais e build web:** `test:superadmin-control-layout`,
`test:ui-v3-foundation`, `test:ui-v3-system-authority`, `test:theme-account-ui`,
`test:profile-admin-separation`, `test:auth-hotfix`, `test:auth-ui`,
`test:plan-presentation-editor`, `test:plan-presentation-persistence`,
`test:plans-presentation`, `test:superadmin-plan-catalog-loader`,
`test:saas-admin-command-bindings`, `test:plan-catalog-canonical-precedence`,
`test:logout-account-overlays` e `test:prepublication-p0`.
O teste novo é explicitamente estático; não substitui as medições reais acima.

Provas ignoradas pelo Git em `artifacts/superadmin-ui-20261016/`:
`settings-before.png`, `settings-mobile-final.png`, `settings-desktop-final.png`,
`companies-mobile-final.png`, `company-menu-mobile-final.png`,
`company-profile-mobile-final.png`, `layout-measurements.json`,
`menu-measurements-final.json`, `desktop-sections-final.json` e
`company-tabs-final.json`. Somente dados sintéticos; sem credenciais.

## Segurança, arquivos e limites

Alterados: `styles/ui-v3/screens/superadmin.css`, `styles/ui-v3/index.css`,
`index.html` (referência CSS), `scripts/test-superadmin-control-layout.js`,
`package.json`, este relatório e o histórico do Kanban.
Sem alteração no `app.js`, CSS global legado, backend, IA, Home, calculadora,
carrossel, Android ou `apps/opticore` preexistente.

Quatro usuários fictícios criados/removidos pelo fluxo local guardado, sessões
revogadas, ledger removido, auditoria preservada. Cards e preços originais
confirmados. Os 11 clientes e 11 assinaturas anteriores mantiveram os hashes
do checkpoint precedente: `282be9f03109f21c4dd06e997c75ac15` e
`52878f3f4a48fcff29e48de64300c0e9`. Proxies encerrados e stack parada preservando
bancos. Nenhum acesso remoto, deploy, push, APK/AAB ou operação de negócio real.

**PENDENTE manual:** aparência no aparelho Android físico e contraste no tema
escuro real; atualização/cache no PWA instalado após uma distribuição autorizada.
Esta rodada conferiu o tema claro no navegador, preservando os tokens de tema.
Não amplia a prontidão de publicação além do Kanban existente.
