# Checklist da rodada - Pedidos, IA Pro e estabilidade

## 1. Pedidos / edição mobile
- [x] Transformar edição em fluxo visual por etapas: resumo, itens, revisão.
- [x] Compactar resumo do pedido no topo.
- [x] Compactar cards de itens, com detalhes recolhidos.
- [x] Reduzir bloco de material para chips/texto secundário.
- [x] Criar barra inferior fixa com total e ações principais.
- [x] Usar ícones compactos para editar/remover item.
- [x] Evitar scroll excessivo e botões empilhados.
- [x] Manter revisão final antes de salvar edição.

## 2. IA Local exclusiva Pro pago
- [x] Free visualiza IA, mas não baixa/instala/usa.
- [x] Trial visualiza IA, mas não baixa/instala/usa.
- [x] Apenas Pro pago ativo pode baixar, instalar, iniciar runtime e usar chat local.
- [x] Bloqueio existir nas funções de UI e nas chamadas de runtime/download.
- [x] Mensagem de upgrade clara.

## 3. Free/anúncios/limites
- [x] Auditar motivo do Free bloquear como limite diário já usado.
- [x] Garantir carregamento de anúncio no APK quando usuário Free precisar desbloquear.
- [x] Evitar falso bloqueio no primeiro uso do dia.

## 4. IA runtime/diagnóstico
- [x] Auditar runtime atual llama.cpp/JNI.
- [x] Separar estado: modelo baixado, runtime iniciado, IA pronta.
- [x] Criar tela/área de diagnóstico técnico básica.
- [x] Não trocar modelo até estabilizar Qwen Q8_0.

## 5. Validação/publicação
- [x] node --check app.js.
- [x] npm run build:web.
- [x] npm run android:apk.
- [x] Instalar no emulador Android Studio e abrir.
- [x] Testar fluxo principal autenticado no emulador.
- [x] Testar calculadora flutuante e duplo toque fora para minimizar.
- [x] Testar fallback de senha sem expor mensagem técnica ao usuário.
- [x] Confirmar que o APK não embute arquivo GGUF.
- [x] Atualizar APK público e PWA somente após validação.

Observação: o AVD disponível localmente é Android SDK 37 x86_64. Teste em Android antigo ainda depende de criar/baixar outra imagem no Android Studio.
