# Auditoria da Interface Fase 2

Data: 2026-07-08

Escopo: auditar a padronizacao criada nas fases anteriores antes de migrar telas reais.

## Resumo

A base existe, mas ainda nao virou uma regra unica aplicada a todas as telas.

Ja existe:

- tokens em `themes/` e aliases em `style.css`;
- contratos por familia em `components/*/contract.css`;
- documentacao em `docs/design-system.md`, `docs/component-contracts.md`, `docs/ui-component-standards.md` e `docs/ux-reference-checklist-camera.md`;
- registro de telas em `UI_SCREEN_RELATIONS`;
- registro de navegacao em `NAVIGATION_AUDIT_REGISTRY`;
- testes de UI e responsividade em `scripts/`;
- isolamento parcial da loja/editor em `src/storefront` e `modules/store-*`.

Ainda esta parcial:

- `app.js` continua concentrando renderizacao, regra e fluxo;
- `style.css` continua concentrando muitos estilos de tela;
- nem toda tela real usa os componentes `ds-*` ou contratos oficiais;
- estados loading/empty/error/success precisam ser auditados por tela;
- mobile/desktop ainda precisam validacao de scroll por tela;
- impressoras devem continuar como futuro/desativado;
- os componentes e templates oficiais existem, mas ainda nao substituem a interface atual sem aprovacao por tela.

## Problemas encontrados

| Severidade | Area | Problema | Recomendacao |
| --- | --- | --- | --- |
| Alta | Global | `app.js` segue grande e mistura render, negocio e navegacao | extrair por modulo em fases, sem reescrita global |
| Alta | Global | `style.css` segue acumulando estilos legados e novos | migrar tela por tela para contratos/tokens |
| Alta | Permissões | Toda funcao nova precisa cruzar plano, permissao e backend/RLS | usar checklist de impacto antes de qualquer feature |
| Alta | Loja | Loja publica deve permanecer isolada de tema/sidebar do ERP | manter testes de isolamento e tema claro |
| Media | Componentes | Ha contratos oficiais, mas uso ainda e gradual | escolher tela piloto e migrar para `ds-*`/tokens |
| Media | Mobile | Scroll precisa ser validado em perfil, caixa, relatorios, estoque e producao | rodar auditoria visual e scroll por tela |
| Media | Icones | Registro existe, mas telas alteradas podem repetir icones ou usar icone errado | exigir registro antes de novo botao/tela |
| Media | Futuro | Impressoras e monitoramento automatico ainda aparecem como risco se voltarem ao menu | manter oculto/feature flag ate agente local |
| Baixa | Documentacao | Benchmarks de mercado ainda nao estavam formalizados | estrutura criada em `src/architecture/market-benchmark` e `docs/benchmark` |

## Duplicidades a observar

- botoes manuais versus `renderAppButton`;
- cards manuais versus `.ds-card` / `.s3d-card`;
- headers soltos versus PageHeader/toolbar;
- modais no legado versus `#modal-layer`;
- drawers/bottom sheets improvisados;
- filtros de tela duplicados em relatorios, caixa e estoque;
- estados vazios diferentes por tela.

## Regra de aplicacao

O Design System deve padronizar contratos, tamanhos, acessibilidade e reutilizacao sem reconstruir a estetica existente. Nenhuma tela piloto visual sera aplicada automaticamente. A migracao ocorre somente quando um componente real precisar de correcao funcional ou quando houver aprovacao especifica da tela.

## Ordem de correcao sugerida

- [x] Preservar a interface atual e usar os contratos apenas em correcoes incrementais.
- [ ] Dashboard.
- [ ] Pedidos e Novo pedido.
- [ ] Caixa.
- [ ] Producao manual.
- [ ] Perfil e seguranca.
- [ ] Relatorios.
- [ ] Loja/Admin.
- [ ] Editor da loja.
- [ ] Loja publica.
- [ ] Planos.
- [ ] Superadmin.

## O que faltou aplicar do prompt

- [x] Checklist UX das fotos do RAR.
- [x] Inventario inicial de telas.
- [x] Estrutura de benchmark de mercado.
- [x] Matriz inicial de lacunas.
- [x] Mapa inicial de maturidade.
- [x] Roadmap guiado por mercado.
- [x] Checklist de impacto para funcao nova.
- [~] Design System existe, mas nao esta 100% aplicado nas telas reais.
- [~] Tokens existem, mas ainda ha CSS legado/hardcoded.
- [~] Componentes oficiais existem como contratos, mas a migracao real e gradual.
- [~] Permissoes existem, mas precisam auditoria por funcao nova.
- [x] Criar `src/shared/design-system/` como camada JS de componentes reais.
- [x] Criar templates oficiais reais para mobile simples, mobile profissional e desktop.
- [x] Preservar a estetica existente; nenhuma tela foi redesenhada para provar o contrato.
- [x] Criar quality gate que impede aumento de botao/card/input manual novo.
- [~] Auditoria autenticada: roteiro e inventario prontos; a execucao real deve registrar a sessao e as telas verificadas.

## Decisao

Nao padronizar tudo de uma vez.

Proxima etapa segura:

1. Rodar testes de estrutura.
2. Revisar este relatorio.
3. Corrigir por tela somente quando houver defeito comprovado.
4. Reutilizar componentes e tokens oficiais sem alterar a organizacao visual.
5. Atualizar o baseline somente com justificativa registrada.
