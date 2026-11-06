/* 只读诊断：统计各服务流程项在两个 Tab 下的任务分布、角色胶囊命中、我的任务清单口径 */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const cfgSrc = fs.readFileSync('js/flow-config-store.js', 'utf-8');
const mtSrc = fs.readFileSync('js/my-tasks-store.js', 'utf-8');

function load(qs) {
  let h = fs.readFileSync('task-list.html', 'utf-8');
  h = h.replace('<script src="js/flow-config-store.js"></script>', '<script>' + cfgSrc + '</script>');
  h = h.replace('<script src="js/my-tasks-store.js"></script>', '<script>' + mtSrc + '</script>');
  const vc = new VirtualConsole(); const errs = [];
  vc.on('jsdomError', e => errs.push(e.message));
  const dom = new JSDOM(h, { runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'https://example.com/task-list.html' + (qs || ''), virtualConsole: vc });
  return new Promise(res => {
    let done = false;
    const finish = () => { if (!done) { done = true; setTimeout(() => res({ d: dom.window.document, w: dom.window, errs }), 30); } };
    dom.window.addEventListener('load', finish); setTimeout(finish, 200);
  });
}
const qa = (o, s) => Array.prototype.slice.call(o.querySelectorAll(s));
const q = (o, s) => o.querySelector(s);

(async function () {
  const { d, w, errs } = await load('');
  const cfg = w.eval('cfgList()');
  console.log('jsdom errors:', errs.length ? errs.slice(0, 3) : 'none');
  console.log('\n=== 各流程项：合同内任务 / 临时任务 Tab 分布（真实 DOM） ===');
  console.log('id\t名称\t含合同\t合同Tab\t临时Tab\t合同Tab示例任务');
  cfg.forEach(c => {
    const c1 = qa(d, '#panelContract .flow-group[data-flow-id="' + c.id + '"] .task-item');
    const t1 = qa(d, '#panelTemp .flow-group[data-flow-id="' + c.id + '"] .task-item');
    const names = c1.slice(0, 2).map(t => (q(t, '.task-name') || {}).textContent || '?').join('、');
    const empty = q(d, '#panelContract .flow-group[data-flow-id="' + c.id + '"] .block-empty');
    const emptyT = q(d, '#panelTemp .flow-group[data-flow-id="' + c.id + '"] .block-empty');
    console.log([c.id, c.name, c.hasContract ? '是' : '否', c1.length + (empty ? '(空态)' : ''),
      t1.length + (emptyT ? '(空态)' : ''), names].join('\t'));
  });
  console.log('\n=== 徽标（默认 sg） ===');
  qa(d, '#taskTabBar .task-tab').forEach(b => console.log(' ', b.textContent.replace(/\s+/g, ' ').trim()));

  console.log('\n=== 角色胶囊命中数（默认 sg 合同 Tab） ===');
  ['all', 'mine', 'exec', 'confirm'].forEach(r => {
    w.eval("applyPill('" + r + "', null)");
    const scope = w.eval('activeTaskScope()');
    const n = scope ? qa(scope, '.task-item').filter(t => t.style.display !== 'none').length : -1;
    console.log(' ', r, '→', n, '条；结果条=', (q(d, '#resultCount') || {}).textContent);
  });
  w.eval("applyPill('all', null)");

  console.log('\n=== 我的任务清单 vs 本页 DOM 任务池 ===');
  ['nonworker', 'worker'].forEach(role => {
    const list = w.eval("MyTasksStore.list('" + role + "')");
    const domNames = {};
    qa(d, '.task-panel .task-item').forEach(t => { const e = q(t, '.task-name'); if (e) domNames[e.textContent] = 1; });
    const miss = list.filter(t => !domNames[t.name]).map(t => t.name);
    const byType = {};
    list.forEach(t => { byType[t.type] = (byType[t.type] || 0) + 1; });
    const byFlow = {};
    list.forEach(t => { byFlow[t.flowId] = (byFlow[t.flowId] || 0) + 1; });
    console.log(' ', role, '共', list.length, '条；type=', JSON.stringify(byType), 'flow=', JSON.stringify(byFlow));
    console.log('   在本页 DOM 找不到的任务名:', miss.length ? miss.join('、') : '(无)');
  });

  console.log('\n=== 我的任务视图下角色胶囊命中（全部流程项） ===');
  const m = await load('?scope=mytasks&role=nonworker');
  ['all', 'mine', 'exec', 'confirm'].forEach(r => {
    m.w.eval("applyPill('" + r + "', null)");
    const scope = m.w.eval('activeTaskScope()');
    const n = scope ? qa(scope, '.task-item').filter(t => t.style.display !== 'none').length : -1;
    console.log(' ', r, '→', n, '条');
  });
  console.log('\n=== 主合同/临时任务阶段结构（sg） ===');
  console.log('  .mc-own 任务:', qa(d, '#panelContract .mc-own .task-item').length);
  console.log('  .mc-children 任务:', qa(d, '#panelContract .mc-children .task-item').length);
  console.log('  temp 阶段卡:', qa(d, '#panelTemp .temp-stage-card').length, ' 无阶段:', qa(d, '#panelTemp .temp-loose-band .task-item').length);
})();
