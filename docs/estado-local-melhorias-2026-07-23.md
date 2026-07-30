# Estado local das melhorias

Data: 2026-07-23

Este arquivo marca o ponto exato da rodada atual. As alterações estão salvas no
workspace local, mas ainda não foram commitadas, enviadas ao GitHub, publicadas ou
aplicadas no Supabase remoto.

## Implementado localmente

- histórico operacional agregado no detalhe do pedido;
- vínculo explícito de novos eventos ao pedido;
- rentabilidade estimada por pedido;
- resumo de capacidade produtiva;
- comparação entre tempo estimado e tempo real;
- dashboard de exceções operacionais;
- fechamento de caixa com saldo contado, diferença, justificativa e responsável;
- migração local de autoridade backend para gerenciamento de funcionários;
- documentação, mapa de maturidade e testes estruturais atualizados;
- APK `1.0.17` / `versionCode 18` recompilado e instalado no emulador.

## APK da rodada

- Arquivo: `downloads/NE3D-ERP.apk`
- Pacote: `br.com.ne3d.erp`
- SHA-256: `33B63ADCBDF638017BA3302557A5ECDB4D7A2C90508CEC538729AD3A6F1C3517`

## Pendente para futuras correções

- RPC transacional para reservar, consumir, liberar, devolver e registrar perda de rolos;
- persistência remota do histórico operacional consolidado;
- sincronização remota completa da conferência de caixa;
- aplicação e homologação da migração de entitlement de funcionários;
- aprovação pública de orçamento;
- calendário produtivo com expediente, pausas e manutenção;
- fornecedores e compras simplificados;
- manutenção preventiva com horas acumuladas;
- anexos privados de pedidos;
- notificações por evento;
- loja para fila de orçamento e indicadores de conversão;
- previsão de reposição;
- extração incremental de pedidos/estoque do `app.js`;
- migração gradual do CSS legado.

## Arquivos novos da rodada

- `docs/checkpoint-estavel-2026-07-23.md`
- `docs/roadmap-operacional-executavel-2026-07-23.md`
- `docs/testes-emulador-melhorias-operacionais-2026-07-23.md`
- `scripts/test-order-operational-history.js`
- `scripts/test-operational-core-phase2.js`
- `scripts/test-employee-entitlement-authority.js`
- `supabase/migrations/20260723123000_employee_entitlement_authority.sql`

## Proteções mantidas

- reservas remotas continuam desativadas por feature flag;
- nenhuma migração nova foi aplicada remotamente;
- nenhum deploy ou push foi realizado;
- o ponto estável anterior continua em
  `backups/stable-before-improvements-20260723-115324/`.

## Diagnóstico de armazenamento

O levantamento somente leitura do disco C e as opções seguras de limpeza ou
movimentação foram registrados em
`docs/diagnostico-espaco-disco-c-2026-07-23.md`. Nenhum arquivo do sistema,
modelo, emulador, cache ou projeto foi movido ou apagado durante o diagnóstico.
