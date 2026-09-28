# Lote 4.2 — hardening PT-BR

O roteamento preserva `rawInput` e cria `normalizedRoutingInput` somente para matching. A normalização é limitada a abreviações PT-BR comprovadas, sem corrigir nomes, materiais, códigos ou números de forma agressiva.

Antes do Needle, valores inequívocos recebem proveniência `USER`: preço com `reais`/`cada`, quantidade associada a item, peso em gramas, duração em minutos canônicos, número de pedido e hints de cliente/material. Schemas Needle são mínimos, têm `additionalProperties: false`, expõem nomes humanos (`materialName`, `orderNumber`, `customerName`) e nunca IDs internos. Valores `USER` vencem inferência de modelo; conflito e ID não resolvido são registrados no shadow.

Validação real no ASUS após a mudança: `qnt tem de pla preto` normalizou para `quanto tem de pla preto` e selecionou `inventory.get_stock`; `faz 3 chaveiros pra Maria 12 cada` selecionou `orders.create` e extraiu `quantity=3`, `unitPrice=12`, `description=chaveiro`, `customerName=Maria`; `calcula 120g 2h` extraiu `weightGrams=120` e `timeMinutes=120`. Nenhum desses valores foi promovido para execução.

O Needle ainda pode suprimir uma call quando todos os argumentos já foram resolvidos deterministicamente. Isso é aceitável em shadow; a comparação deve considerar os argumentos mesclados com proveniência, não apenas a call crua.
