(function initUiV3Foundation(global){
  const escapeHtml=(value="")=>String(value).replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]);
  const attrs=(input={})=>Object.entries(input).filter(([,value])=>value!==false&&value!=null).map(([key,value])=>value===true?` ${key}`:` ${key}="${escapeHtml(value)}"`).join("");
  /** @param {any} value */ const trustedHtml=(value="")=>Object.freeze({__ui3TrustedHtml:true,value:String(value)});
  // Components receive escaped text by default. Only design-system generated
  // fragments may cross the explicit trustedHtml boundary.
  /** @param {any} value */ const contentOf=(value="")=>value&&typeof value==="object"&&value.__ui3TrustedHtml===true?value.value:escapeHtml(value);
  const component=(tag,className,content="",attributes={})=>`<${tag} class="${escapeHtml(className)}"${attrs(attributes)}>${contentOf(content)}</${tag}>`;
  const api={escapeHtml,trustedHtml,component};
  global.UiV3=Object.assign(global.UiV3||{},api);
})(window);
