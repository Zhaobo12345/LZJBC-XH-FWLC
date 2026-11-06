const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js', 'utf-8');
const mtSrc = fs.readFileSync('js/my-tasks-store.js', 'utf-8');
let raw = fs.readFileSync('task-list.html', 'utf-8')
  .replace('<script src="js/flow-config-store.js"></script>', '<script>' + cfgSrc + '</script>')
  .replace('<script src="js/my-tasks-store.js"></script>', '<script>' + mtSrc + '</script>')
  .replace('<script src="../shared/doc-viewer/doc-viewer.js"></script>', '');
const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(raw, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.com/task-list.html', virtualConsole: vc });
dom.window.addEventListener('load', go); setTimeout(go, 500);
let done = false;
function go() {
  if (done) return; done = true;
  const w = dom.window, d = w.document;
  const rail = d.getElementById('flowRail');
  const items = Array.from(rail.querySelectorAll('.flow-rail-item'));
  console.log('rail 项:', items.map(i => i.textContent.trim() + (i.classList.contains('active') ? '[active]' : '')).join(' | '));
  console.log('rail.scrollLeft:', rail.scrollLeft);
  const active = Array.from(d.querySelectorAll('.task-panel.is-active .flow-group.is-active')).map(g => g.getAttribute('data-flow-id'));
  console.log('当前 Tab:', d.querySelector('#taskTabBar .task-tab.active').getAttribute('data-tab'), '| 激活流程组:', active.join(','));
  const g = d.querySelector('.task-panel.is-active .flow-group.is-active');
  console.log('首屏组内容摘要:', g ? g.textContent.replace(/\s+/g, ' ').trim().slice(0, 160) : '(无)');
  console.log('结果条:', (d.getElementById('resultCount') || {}).textContent ? d.getElementById('resultCount').textContent.trim() : 'n/a');
  const pc = d.getElementById('panelContract'), pt = d.getElementById('panelTemp');
  console.log('合同面板任务数:', pc.querySelectorAll('.task-item').length, '| 临时面板任务数:', pt.querySelectorAll('.task-item').length);
  console.log('errors:', errs.length ? errs.slice(0, 3).join(' | ') : 'none');
}
