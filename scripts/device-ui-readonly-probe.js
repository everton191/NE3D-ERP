// Feed to agent-browser eval --stdin on the connected Android WebView.
JSON.stringify({
  width: innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  screen: typeof telaAtual === 'string' ? telaAtual : null,
  phase4Loaded: typeof abrirEtapasPedido === 'function',
  phase5Loaded: typeof calcularCaixaVinculadoPedido === 'function',
  phase6Loaded: typeof getResumoCapacidadeProducao === 'function' && getResumoCapacidadeProducao.toString().includes('minutosValidos'),
  paragraphs: Array.from(document.querySelectorAll('.order-more-options > p')).map(el => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return {height:r.height,width:r.width,lineHeight:s.lineHeight,fontSize:s.fontSize,transform:s.transform,overflow:s.overflow,flexShrink:s.flexShrink,
      style:el.getAttribute('style'), children:el.innerHTML,
      parents:[el.parentElement,el.parentElement.parentElement].map(p=>({className:p.className,style:p.getAttribute('style'),transform:getComputedStyle(p).transform,overflow:getComputedStyle(p).overflow,borderRadius:getComputedStyle(p).borderRadius})),
      font:s.font,zoom:s.zoom,writingMode:s.writingMode,textSizeAdjust:s.webkitTextSizeAdjust};
  }),
  overflow: Array.from(document.querySelectorAll('.order-more-options, .order-more-action, .order-profitability-summary, .production-capacity-summary')).map(el => {
    const r=el.getBoundingClientRect();return {className:el.className, width:r.width, right:r.right, left:r.left, scrollWidth:el.scrollWidth, clientWidth:el.clientWidth};
  })
});
