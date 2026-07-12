const fs=require('node:fs');
const file=process.argv[2];const tokens=process.argv.slice(3);
if(!file||!tokens.length)throw new Error('Uso: node scripts/remove-migrated-css.js <css> <token...>');
let css=fs.readFileSync(file,'utf8');let removedRules=0,removedLines=0;
const leaf=/([^{}]+)\{([^{}]*)\}/g;
css=css.replace(leaf,(full,rawSelector)=>{
  const selector=rawSelector.trim();
  if(!selector||selector.startsWith('@')||/^(from|to|\d+%)$/.test(selector))return full;
  const parts=selector.split(',').map(item=>item.trim()).filter(Boolean);
  if(!parts.length||!parts.every(part=>tokens.some(token=>part.includes(token))))return full;
  removedRules+=1;removedLines+=full.split('\n').length-1;return '';
});
css=css.replace(/@media[^{}]+\{\s*\}/g,'').replace(/\n{3,}/g,'\n\n');
fs.writeFileSync(file,css);
console.log(JSON.stringify({file,removedRules,removedLines,tokens}));
