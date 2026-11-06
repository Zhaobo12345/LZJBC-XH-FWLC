const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js', 'utf-8');
let raw = fs.readFileSync('task-list.html', 'utf-8')
  .replace('<script src="js/flow-config-store.js"></script>', '<script>' + cfgSrc + '</script>')
  .replace('<script src="../shared/doc-viewer/doc-viewer.js"></script>', '');
const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(raw, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.com/task-list.html', virtualConsole: vc });
dom.window.addEventListener('load', go); setTimeout(go, 400);
let done = false;
function go() {
  if (done) return; done = true;
  const w = dom.window, d = w.document;
  const sg = d.querySelector('#panelContract .flow-group[data-flow-id="sg"]');
  console.log('--- 折叠态（默认）---');
  sg.querySelectorAll('.subct-row').forEach(r => {
    const depth = r.getAttribute('data-depth');
    const nm = r.querySelector(':scope > .subct-main .subct-name').textContent;
    const n = r.querySelector(':scope > .subct-main .subct-n').textContent;
    const meta = r.querySelector(':scope > .subct-meta').textContent;
    console.log('  '.repeat(+depth) + '├ ' + nm + '  [' + n + ']  ' + meta);
  });
  console.log('--- 展开「水电班组服务合同」---');
  w.toggleSubct(sg.querySelector('.subct-row[data-sub-id="water"] > .subct-main'));
  w.toggleSubct(sg.querySelector('.subct-row[data-sub-id="demo"] > .subct-main'));
  sg.querySelectorAll('.subct-body.show').forEach(b => {
    const row = b.parentElement;
    const nm = row.querySelector(':scope > .subct-main .subct-name').textContent;
    console.log('  ▾ ' + nm);
    b.querySelectorAll('.subct-task').forEach(t => {
      console.log('      · ' + t.querySelector('.task-name').textContent +
        ' | ' + t.querySelector('.task-meta').textContent +
        ' | ' + t.querySelector('.task-status-text').textContent.trim());
    });
  });
  console.log('--- 未匹配说明 ---');
  const note = sg.querySelector('.subct-note');
  console.log('  ' + (note ? note.textContent.replace(/\s+/g, ' ') : '(无)'));
  console.log('--- 结果条 ---');
  console.log('  合同 tab: ' + d.getElementById('resultCount').textContent.trim());
  console.log('errors: ' + (errs.length ? errs.slice(0, 2).join(' | ') : 'none'));
}
