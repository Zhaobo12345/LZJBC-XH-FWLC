const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js','utf-8');
let raw = fs.readFileSync('task-list.html','utf-8')
  .replace('<script src="js/flow-config-store.js"></script>','<script>'+cfgSrc+'</script>')
  .replace('<script src="../shared/doc-viewer/doc-viewer.js"></script>','');
const vc=new VirtualConsole(); const errs=[]; vc.on('jsdomError',e=>errs.push(e.message));
const dom=new JSDOM(raw,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/task-list.html',virtualConsole:vc});
dom.window.addEventListener('load',go); setTimeout(go,400);
let done=false;
function go(){ if(done)return; done=true; const w=dom.window,d=w.document;
  const rc=d.getElementById('resultCount');
  console.log('默认(全部/合同/sg):', rc?rc.textContent.trim():'n/a');
  // 切到临时 tab
  w.switchTaskTab('temp');
  const rc2=d.getElementById('resultCount');
  console.log('临时 tab:', rc2?rc2.textContent.trim():'n/a');
  // 选量房
  w.selectFlow('lh');
  const rc3=d.getElementById('resultCount');
  console.log('临时/量房:', rc3?rc3.textContent.trim():'n/a');
  // 切回合同 tab + 选主材安装
  w.switchTaskTab('contract'); w.selectFlow('cz');
  const rc4=d.getElementById('resultCount');
  console.log('合同/主材安装:', rc4?rc4.textContent.trim():'n/a');
  const czg=d.querySelector('#panelContract .flow-group[data-flow-id="cz"]');
  console.log('主材安装 合同组可见:', czg && getComputedStyle(czg).display!=='none', '| 组头计数:', (czg&&czg.querySelector('[data-group-count]'))?czg.querySelector('[data-group-count]').textContent:'n/a');
  // 全部流程项
  w.selectFlow('all'); w.switchTaskTab('contract');
  console.log('全部/合同:', d.getElementById('resultCount').textContent.trim());
  console.log('runtime errors:', errs.length?errs.slice(0,3).join(' | '):'none');
  process.exit(0);
}
