const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js', 'utf-8');
const mtSrc = fs.readFileSync('js/my-tasks-store.js', 'utf-8');
let rawHtml = fs.readFileSync('task-list.html', 'utf-8');
rawHtml = rawHtml.replace('<script src="js/flow-config-store.js"></script>', '<script>' + cfgSrc + '</script>')
                 .replace('<script src="js/my-tasks-store.js"></script>', '<script>' + mtSrc + '</script>')
                 .replace('<script src="../shared/doc-viewer/doc-viewer.js"></script>', '');
const vc = new VirtualConsole(); const errs=[];
vc.on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(rawHtml, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://example.com/task-list.html', virtualConsole:vc });
dom.window.addEventListener('load', finish);
setTimeout(finish, 300);
function finish(){
  const d = dom.window.document;
  const pc = d.getElementById('panelContract');
  const pt = d.getElementById('panelTemp');
  const sg = pc.querySelector('.flow-group[data-flow-id="sg"]');
  console.log('=== CONTRACT panel sg group exists:', !!sg);
  if (sg) {
    console.log('main-contract:', sg.querySelectorAll('.main-contract').length);
    console.log('mc-own (主合同阶段任务):', sg.querySelectorAll('.mc-own').length);
    console.log('mc-sub-band (子合同任务):', sg.querySelectorAll('.mc-sub-band').length);
    console.log('contract-section (子合同):', sg.querySelectorAll('.contract-section').length);
    console.log('stage-item:', sg.querySelectorAll('.stage-item').length);
    console.log('task-item (contract):', sg.querySelectorAll('.task-item').length);
    console.log('contains 查看流程:', sg.innerHTML.indexOf('查看流程')>=0);
    // dump any text containing 流程 that looks like a link/button
    const texts = [];
    sg.querySelectorAll('*').forEach(e=>{
      const t = (e.childNodes[0] && e.childNodes[0].nodeType===3) ? e.childNodes[0].textContent.trim() : '';
      if (t && t.indexOf('流程')>=0 && /查看|›|↗|进入/.test(t)) texts.push(e.tagName+'.'+e.className+' => "'+t+'"');
    });
    console.log('flow-link-like texts:', JSON.stringify(texts,null,0));
  }
  const czc = pc.querySelector('.flow-group[data-flow-id="cz"]');
  console.log('=== CONTRACT panel cz:', !!czc, czc? czc.textContent.replace(/\s+/g,' ').slice(0,120):'');
  const lhc = pc.querySelector('.flow-group[data-flow-id="lh"]');
  console.log('=== CONTRACT panel lh:', !!lhc, lhc? lhc.textContent.replace(/\s+/g,' ').slice(0,120):'');
  const sgt = pt.querySelector('.flow-group[data-flow-id="sg"]');
  console.log('=== TEMP panel sg:', !!sgt, sgt? 'task-item='+sgt.querySelectorAll('.task-item').length+' | html len '+sgt.innerHTML.length : 'empty');
  const lht = pt.querySelector('.flow-group[data-flow-id="lh"]');
  console.log('=== TEMP panel lh task-item:', lht? lht.querySelectorAll('.task-item').length : 'none', '| temp-stage-card:', lht?lht.querySelectorAll('.temp-stage-card').length:'-', '| temp-loose:', lht?lht.querySelectorAll('.temp-loose').length:'-');
  const czt = pt.querySelector('.flow-group[data-flow-id="cz"]');
  console.log('=== TEMP panel cz task-item:', czt? czt.querySelectorAll('.task-item').length : 'none', '| temp-stage-card:', czt?czt.querySelectorAll('.temp-stage-card').length:'-', '| temp-loose:', czt?czt.querySelectorAll('.temp-loose').length:'-');
  console.log('=== ERRORS:', errs.slice(0,5));
}
