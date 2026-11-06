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
  w.switchTaskTab('contract'); w.selectFlow('all');
  console.log('全部/合同:', d.getElementById('resultCount').textContent.trim());
  const czg=d.querySelector('#panelContract .flow-group[data-flow-id="cz"]');
  console.log('主材安装 合同组可见:', czg && w.getComputedStyle(czg).display!=='none', '| 组头计数:', czg.querySelector('[data-group-count]').textContent);
  w.selectFlow('lh');
  const lhg=d.querySelector('#panelContract .flow-group[data-flow-id="lh"]');
  console.log('量房 合同组空态文本:', lhg.querySelector('.block-empty').textContent.replace(/\s+/g,' ').trim());
  console.log('runtime errors:', errs.length?errs.slice(0,3).join(' | '):'none');
  process.exit(0);
}
