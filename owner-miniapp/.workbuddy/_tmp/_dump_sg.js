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
  const sg=d.querySelector('#panelContract .flow-group[data-flow-id="sg"]');
  const sec=sg.querySelector('.contract-section');
  // header
  console.log('HEADER:', sec.querySelector('.contract-name').textContent.replace(/\s+/g,' ').trim(), '|', sec.querySelector('.contract-meta').textContent.trim());
  // bands
  Array.from(sec.querySelectorAll('.mc-band')).forEach((b,i)=>{
    console.log('BAND'+i+':', b.textContent.replace(/\s+/g,' ').trim());
  });
  // sub contract rows (flatten)
  Array.from(sec.querySelectorAll('.subct-row')).forEach(r=>{
    const depth=r.getAttribute('data-depth');
    const pad='  '.repeat(Number(depth)+1);
    console.log(pad+'- '+r.querySelector('.subct-name').textContent+' ['+r.querySelector('.subct-tag').textContent+'] ['+r.querySelector('.subct-status').textContent+']');
    const m=r.querySelector('.subct-meta');
    console.log(pad+'    '+m.textContent.trim());
  });
  console.log('runtime errors:', errs.length?errs.slice(0,3).join(' | '):'none');
  process.exit(0);
}
