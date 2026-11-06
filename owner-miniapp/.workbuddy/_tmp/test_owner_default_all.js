/* 业主端全部任务：首屏默认「全部」+ 横向流程项栏停在最左 专项回归
   验收要点：默认选中首个「全部」、6 个流程组全部可见、rail 首项为「全部」且 scrollLeft=0、
   切到后面流程项仅选中不改变默认首屏、切回全部恢复 58 条。 */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js', 'utf-8');
let raw = fs.readFileSync('task-list.html', 'utf-8')
  .replace('<script src="js/flow-config-store.js"></script>', '<script>' + cfgSrc + '</script>')
  .replace('<script src="../shared/doc-viewer/doc-viewer.js"></script>', '');
const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(raw, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.com/task-list.html', virtualConsole: vc });
dom.window.addEventListener('load', run);
setTimeout(run, 400);
let done = false, pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.log('  FAIL: ' + m); } }
function run() {
  if (done) return; done = true;
  try { body(); } catch (e) { console.log('THROW: ' + (e && e.stack || e)); fail++; }
  console.log('\nRESULT: ' + pass + ' passed, ' + fail + ' failed');
  process.exitCode = fail ? 1 : 0;
}
function body() {
  const w = dom.window, d = w.document;
  const rail = d.getElementById('flowRail');
  const items = Array.from(rail.querySelectorAll('.flow-rail-item'));
  const groups = Array.from(d.querySelectorAll('#panelContract .flow-group'));
  const activeGroups = () => groups.filter(g => g.classList.contains('is-active')).map(g => g.getAttribute('data-flow-id'));

  // 1) rail 首项为「全部」且为激活态
  ok(items.length === 7, 'rail 共 7 项（全部 + 6 流程项）实际 ' + items.length);
  ok(items[0].getAttribute('data-flow-id') === 'all' && items[0].textContent.trim() === '全部', 'rail 首项是「全部」');
  ok(items[0].classList.contains('active'), '首屏「全部」为选中态');
  ok(items.filter(i => i.classList.contains('active')).length === 1, '首屏仅一个选中项');

  // 2) rail 停在最左
  ok(rail.scrollLeft === 0, 'rail 首屏 scrollLeft = 0（实际 ' + rail.scrollLeft + '）');

  // 3) 全部流程组可见
  ok(groups.length === 6, '合同面板 6 个流程组');
  ok(activeGroups().length === 6, '「全部」下 6 个流程组全部 is-active（实际 ' + activeGroups().join(',') + '）');
  ['lh', 'cs', 'ht', 'sg', 'cz', 'sh'].forEach(id => {
    const g = d.querySelector('#panelContract .flow-group[data-flow-id="' + id + '"]');
    ok(!!g && g.classList.contains('is-active') && g.style.display !== 'none', id + ' 流程组首屏可见');
  });

  // 4) 结果条为全部口径
  const rc = d.getElementById('resultCount').textContent.trim();
  ok(rc.indexOf('共 35 个任务') === 0, '结果条默认按当前「合同任务」Tab 计 35 个任务（实际 ' + rc + '）');
  ok(rc.indexOf('全部流程项') >= 0, '结果条标注「全部流程项」');
  ok(d.getElementById('emptyState').style.display === 'none', '首屏无空态');

  // 5) 切到后面流程项：只选中该项，其它隐藏
  w.selectFlow('sg');
  ok(activeGroups().join(',') === 'sg', '选「基础施工服务」后仅 sg 激活（实际 ' + activeGroups().join(',') + '）');
  ok(items.find(i => i.getAttribute('data-flow-id') === 'sg').classList.contains('active'), 'sg chip 高亮');
  ok(!items[0].classList.contains('active'), '「全部」取消高亮');
  ok(d.getElementById('resultCount').textContent.indexOf('共 24 个任务') === 0, 'sg 口径 24 个任务');

  // 6) 切回「全部」
  w.selectFlow('all');
  ok(activeGroups().length === 6, '切回「全部」恢复 6 组');
  ok(d.getElementById('resultCount').textContent.indexOf('共 35 个任务') === 0, '切回「全部」恢复合同 Tab 全量 35 个任务');

  // 7) revealRail 在无布局环境不报错、不改动 scrollLeft
  w.revealRail('sh');
  w.revealRail('all', true);
  ok(rail.scrollLeft === 0, 'revealRail 在无布局下不改变 scrollLeft');

  console.log('jsdom errors: ' + (errs.length ? errs.slice(0, 2).join(' | ') : 'none'));
}
