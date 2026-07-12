(function initUiV3DevRoute(global){
  const isLocal=["localhost","127.0.0.1","[::1]"].includes(location.hostname);
  const isRoute=location.pathname.replace(/\/+$/,"").toLowerCase()==="/dev/ui-v3";
  function mount(){
    if(!isLocal||!isRoute)return false;
    document.querySelectorAll('link[rel="stylesheet"]:not([href*="/styles/ui-v3/"])').forEach(link=>{link.disabled=true});
    document.querySelector('body>header')?.remove();
    document.getElementById('app-shell')?.remove();
    document.getElementById('floatingCalculator')?.remove();
    document.getElementById('popup')?.remove();
    const root=document.createElement('div');root.dataset.uiVersion='v3';root.dataset.ui3DevRoute='true';
    const U=global.UiV3;
    const button=(label,action,variant='secondary')=>U.Button({label,action,variant});
    const cards=[1,2,3].map((n)=>U.GridItem(U.Card({title:`Card ${n}`,content:`<p>Altura coerente e conteúdo que pode crescer sem quebrar a coluna.</p>`}),{span:4})).join('');
    const form=U.ResponsiveGrid(`${U.GridItem(U.FormField({label:'Nome',name:'nome',value:'Exemplo'}),{span:4})}${U.GridItem(U.FormField({label:'Email',name:'email',type:'email',value:'teste@example.com'}),{span:4})}${U.GridItem(U.FormField({label:'Descrição longa',name:'descricao',help:'Campo de largura total para testar foco e teclado.'}),{full:true})}`);
    const settings=U.SettingsList(U.SettingsRow({icon:'A',title:'Conta e preferências',description:'Texto longo permanece legível e a ação mantém seu trilho.',action:button('Alterar','noop')})+U.SettingsRow({icon:'S',title:'Segurança',description:'Ação independente do conteúdo.',action:button('Revisar','noop')}));
    const table=U.ScrollableTableArea(`<table><thead><tr><th>Pedido</th><th>Cliente</th><th>Status</th><th>Total</th></tr></thead><tbody><tr><td>#1042</td><td>Cliente de demonstração com nome longo</td><td>Produção</td><td>R$ 248,00</td></tr><tr><td>#1043</td><td>Empresa Exemplo</td><td>Concluído</td><td>R$ 99,00</td></tr></tbody></table>`);
    const states=U.ResponsiveGrid(`${U.GridItem(U.EmptyState('Adicione o primeiro registro.'),{span:4})}${U.GridItem(U.ErrorState('Tente novamente em alguns instantes.'),{span:4})}${U.GridItem(U.LoadingState(),{span:4})}`);
    const actions=`${button('Abrir modal','dialog')}${button('Abrir sheet','sheet')}${button('Abrir drawer','drawer')}${button('Confirmar','confirm','danger')}${button('Fonte 125%','font')}`;
    const page=U.PageContainer(`${U.PageHeader({title:'UI V3 — laboratório técnico',description:'Fundação isolada. Esta rota existe apenas em ambiente local.',actions:`<div>${actions}</div>`})}${U.PageSection({title:'Grid oficial 4 / 8 / 12',content:U.ResponsiveGrid(cards)})}${U.PageSection({title:'Formulário e foco',content:form})}${U.PageSection({title:'Lista de configurações',content:settings})}${U.PageSection({title:'Tabela e gráfico',content:`${table}${U.ChartContainer('<strong>Área reservada para gráfico responsivo</strong>')}`})}${U.PageSection({title:'Feedback',content:states})}${U.DangerZone({description:'Ações irreversíveis ficam visual e semanticamente separadas.',action:button('Excluir demonstração','confirm','danger')})}${U.StickyActionBar(`${button('Cancelar','noop')}${button('Salvar','noop','primary')}`)}`);
    root.innerHTML=U.AppShell({header:'<strong>Simplifica 3D · UI V3</strong><span class="ui3-muted">/dev/ui-v3</span>',content:page,navigation:U.BottomNavigation([{label:'Início',action:'noop'},{label:'Pedidos',action:'noop'},{label:'Relatórios',action:'noop'},{label:'Conta',action:'noop'}])});
    root.addEventListener('click',event=>{const action=event.target.closest('[data-ui3-action]')?.dataset.ui3Action;if(!action||action==='noop')return;if(action==='dialog')U.Dialog({title:'Modal centralizado',content:'<p>No mobile continua sendo modal, sem transformação automática em sheet.</p><input aria-label="Campo no modal" placeholder="Teste de foco">'});if(action==='sheet')U.BottomSheet({title:'Bottom sheet',content:'<p>Componente explicitamente inferior e com safe area.</p>'});if(action==='drawer')U.Drawer({title:'Drawer',content:'<p>Painel lateral renderizado via Portal.</p>'});if(action==='confirm')U.ConfirmationDialog({message:'Confirma a ação de demonstração?'});if(action==='font')root.dataset.fontScale=root.dataset.fontScale==='large'?'normal':'large'});
    document.body.append(root);document.title='UI V3 · Simplifica 3D';return true;
  }
  global.UiV3Dev={isRoute:isLocal&&isRoute,mount};
})(window);
