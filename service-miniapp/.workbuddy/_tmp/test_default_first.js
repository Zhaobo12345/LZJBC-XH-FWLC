/* 服务端「全部任务」首屏默认项专项：默认选中配置首项（量房），rail 停在最左
   验收要点：默认 activeFlow = 配置第一项而非「进行中」；rail 首项即选中项；scrollLeft=0；
   选中后面的流程项仍能切换；切 Tab 不改变作用域；总数据 56/28 守恒。 */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js', 'utf-8');
const mtSrc = fs.readFileSync('js/my-tasks-store.js', 'utf-8');
const raw = fs.readFileSync('task-list.html', 'utf-8')
  .replace('<script src="js/flow-config-store.js"></script>', '<script>' + cfgSrc + '</script>')
  .replace('<script src="js/my-tasks-store.js"></script>', '<script>' + mtSrc + '</script>')
  .replace('<script src="../shared/doc-viewer/doc-viewer.js"></script>', '');
const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(raw, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.com/task-list.html', virtualConsole: vc });
dom.window.addEventListener('load', go); setTimeout(go, 400);
let done = false, pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.log('  FAIL: ' + m); } }
function go() {
  if (done) return; done = true;
  try { body(); } catch (e) { console.log('THROW: ' + (e && e.stack || e)); fail++; }
  console.log('\nRESULT: ' + pass + ' passed, ' + fail + ' failed' + (errs.length ? ' | errors: ' + errs.slice(0, 2).join(' | ') : ''));
  process.exitCode = fail ? 1 : 0;
}
function body() {
  const w = dom.window, d = w.document;
  const rail = d.getElementById('flowRail');
  const items = Array.from(rail.querySelectorAll('.flow-rail-item'));

  // 1) rail 首项 = 量房（配置首项），且为默认选中项
  ok(items.length === 6, 'rail 6 项（实际 ' + items.length + '）');
  ok(items[0].getAttribute('data-flow-id') === 'lh', 'rail 首项 = 量房 lh');
  ok(items[0].classList.contains('active'), '首屏选中项 = rail 首项');
  ok(items.filter(i => i.classList.contains('active')).length === 1, '首屏仅一个激活项');
  ok(!items.some(i => i.getAttribute('data-flow-id') === 'sg' && i.classList.contains('active')),
    '首屏不再默认选中「基础施工服务」');

  // 2) rail 停在最左
  ok(rail.scrollLeft === 0, 'rail 首屏 scrollLeft = 0（实际 ' + rail.scrollLeft + '）');

  // 3) 只渲染首项流程组
  const activeGroups = Array.from(d.querySelectorAll('.task-panel.is-active .flow-group.is-active'))
    .map(g => g.getAttribute('data-flow-id'));
  ok(activeGroups.join(',') === 'lh', '合同面板仅「量房」激活（实际 ' + activeGroups.join(',') + '）');

  // 4) 切到后面流程项仍正常
  w.selectFlow('sg');
  const act2 = Array.from(d.querySelectorAll('.task-panel.is-active .flow-group.is-active')).map(g => g.getAttribute('data-flow-id'));
  ok(act2.join(',') === 'sg', '选「基础施工服务」后仅 sg 激活');
  ok(items.find(i => i.getAttribute('data-flow-id') === 'sg').classList.contains('active'), 'sg chip 高亮');
  ok(/共 65 个任务/.test(d.getElementById('resultCount').textContent), 'sg 口径跨 Tab 求和 65');

  // 5) 切 Tab 保持作用域、rail 不被重置为别项
  w.switchTaskTab('temp');
  const act3 = Array.from(d.querySelectorAll('.task-panel.is-active .flow-group.is-active')).map(g => g.getAttribute('data-flow-id'));
  ok(act3.join(',') === 'sg', '切临时 Tab 仍保持 sg 作用域');
  ok(items.find(i => i.getAttribute('data-flow-id') === 'sg').classList.contains('active'), '切 Tab 后 sg chip 仍高亮');
  w.switchTaskTab('contract');

  // 6) 回到首项
  w.selectFlow('lh');
  ok(/共 3 个任务/.test(d.getElementById('resultCount').textContent), '量房口径 3 个任务（合同0+临时3）');

  // 7) 数据守恒
  ok(d.querySelectorAll('#panelContract .task-item').length === 56, '合同面板 56 条不变');
  ok(d.querySelectorAll('#panelTemp .task-item').length === 28, '临时面板 28 条不变');
}
