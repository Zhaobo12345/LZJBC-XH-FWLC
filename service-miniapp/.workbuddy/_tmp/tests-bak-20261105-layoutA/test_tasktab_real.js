const { JSDOM, VirtualConsole } = require('jsdom');
const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => errs.push(e.message));

JSDOM.fromFile('task-list.html', {
  resources: 'usable',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc
}).then(dom => {
  setTimeout(() => {
    const w = dom.window, d = w.document;
    const rail = d.querySelectorAll('#flowRail .flow-rail-item');
    const active = d.querySelector('#flowRail .flow-rail-item.active');
    const contractPanel = d.getElementById('panelContract');
    const tempPanel = d.getElementById('panelTemp');
    console.log('FlowCfgStore loaded :', typeof w.FlowCfgStore, w.FlowCfgStore && typeof w.FlowCfgStore.get);
    console.log('rail items          :', rail.length, Array.prototype.map.call(rail, x => x.getAttribute('data-flow-id')).join(','));
    console.log('default active flow :', active && active.getAttribute('data-flow-id'));
    console.log('default tab         :', d.querySelector('.task-tab.active').getAttribute('data-tab'));
    console.log('panels active/hidden:', contractPanel.classList.contains('is-active'), tempPanel.classList.contains('is-active'));
    console.log('resultCount         :', d.getElementById('resultCount').textContent);
    console.log('legacy cards left   :', d.querySelectorAll('#taskContainer > .flow-item-card').length);
    console.log('jsdom errors        :', errs.length, errs.join(' | '));
    const ok = rail.length === 6 && active && active.getAttribute('data-flow-id') === 'sg'
      && d.querySelector('.task-tab.active').getAttribute('data-tab') === 'contract'
      && contractPanel.classList.contains('is-active') && !tempPanel.classList.contains('is-active')
      && d.getElementById('resultCount').textContent === '共 65 个任务'
      && d.querySelectorAll('#taskContainer > .flow-item-card').length === 0
      && errs.length === 0;
    console.log(ok ? 'REAL LOAD: PASS' : 'REAL LOAD: FAIL');
    process.exit(ok ? 0 : 1);
  }, 400);
}).catch(e => { console.error(e); process.exit(1); });
