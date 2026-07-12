(function initUiV3Foundation(global){
  const escapeHtml=(value="")=>String(value).replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]);
  const attrs=(input={})=>Object.entries(input).filter(([,value])=>value!==false&&value!=null).map(([key,value])=>value===true?` ${key}`:` ${key}="${escapeHtml(value)}"`).join("");
  const component=(tag,className,content="",attributes={})=>`<${tag} class="${className}"${attrs(attributes)}>${content}</${tag}>`;
  const api={escapeHtml,component};
  global.UiV3=Object.assign(global.UiV3||{},api);
})(window);
