# Estoque por rolos - ativacao segura

Data: 2026-07-10

## Ativo nesta fase

- estoque simples permanece disponivel no Free;
- cada item recebe codigo interno numerico, estavel e pesquisavel;
- o cadastro em etapas bloqueia produto repetido antes de alterar o saldo;
- identificador externo opcional aceita codigo de barras ou conteudo de QR e ja participa da busca;
- controle por rolos/lotes aparece somente no Start e Pro;
- codigo unico, lote do fabricante, localizacao, tara, peso inicial e saldo atual;
- saldo negativo bloqueado e historico local preservado;
- calculadora continua sem baixar estoque;
- baixa geral continua vinculada ao pedido/status de producao;
- anuncios ficam desligados por `src/config/runtimeFeatures.js`.

## Preparado, mas nao aplicado remotamente

- migracao local com catalogo de filamentos, cores, rolos, reservas e movimentos;
- RLS por empresa e verificacao de plano;
- idempotencia de reservas e movimentos;
- preservacao dos dados em rebaixamento de plano.

## Futuro e invisivel no uso normal

- leitura por camera ou leitor fisico, mantida inativa por `stockScannerEnabled`;
- reservas transacionais, mantidas inativas por `stockReservationsEnabled`;
- RPC unico de movimento/estorno, mantido inativo por `stockMovementRpcEnabled` ate a migracao remota ser revisada;
- baixa automatica por rolo;
- depositos e enderecamento;
- compras e recebimento;
- quarentena e controle de qualidade;
- transferencias;
- inventario ciclico;
- previsao e reposicao automatica;
- eventos externos e integracoes empresariais.

Esses modulos ficam com flags `false` em `src/config/runtimeFeatures.js`. A reativacao exige regra de negocio, testes, aprovacao e migracao remota separada.

## Regra arquitetural

Nao criar um segundo estoque. Interface simples, rolos, leitor, reservas, producao e inventario devem usar o mesmo historico append-only e as mesmas regras de saldo. Movimentos incorretos devem receber estorno; nunca edicao retroativa.
