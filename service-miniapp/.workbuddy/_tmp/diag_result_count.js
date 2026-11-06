/* 只读诊断：结果条 resultCount 在「切换流程项 / 切换 Tab / 筛选」下的当前口径 */
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
const count = (d, pid, fid) => qa(d, '#' + pid + ' .flow-group[data-flow-id="' + fid + '"] .task-item').length;

(async function () {
  const { d, w, errs } = await load('');
  console.log('jsdom errors:', errs.length ? errs.slice(0, 3) : 'none');
  const cfg = w.eval('cfgList()');
  console.log('\n=== 各流程项：合同 / 临时 / 应有合计 ===');
  cfg.forEach(c => {
    const a = count(d, 'panelContract', c.id), b = count(d, 'panelTemp', c.id);
    console.log(' ', c.id, c.name, '| 合同', a, '| 临时', b, '| 合计', a + b);
  });

  console.log('\n=== 逐流程项：结果条（当前口径） ===');
  for (const c of cfg) {
    w.eval("selectFlow('" + c.id + "')");
    const s1 = q(d, '#resultCount').textContent;
    w.eval("switchTaskTab('temp')");
    const s2 = q(d, '#resultCount').textContent;
    w.eval("switchTaskTab('contract')");
    console.log(' ', c.id, '| 合同Tab', s1, '| 临时Tab', s2);
  }

  w.eval("selectFlow('sg')");
  console.log('\n=== sg 筛选场景（当前口径） ===');
  const si = q(d, '#searchInput');
  si.value = '巡检'; w.eval('filterTasks()');
  console.log('  搜「巡检」合同Tab:', q(d, '#resultCount').textContent);
  w.eval("switchTaskTab('temp')");
  console.log('  搜「巡检」临时Tab:', q(d, '#resultCount').textContent);
  si.value = ''; w.eval("switchTaskTab('contract'); filterTasks()");
  w.eval("selectStatus('completed','已完成',null)");
  console.log('  筛已完成 合同Tab:', q(d, '#resultCount').textContent);

  console.log('\n=== 独立加载 ?level=水电工作组 ===');
  const r = await load('?level=水电工作组');
  console.log('  结果条:', q(r.d, '#resultCount').textContent,
    '| 合同分组可见', qa(r.d, '#panelContract .flow-group.is-active .task-item').filter(t => t.style.display !== 'none').length,
    '| 临时分组可见', qa(r.d, '#panelTemp .flow-group.is-active .task-item').filter(t => t.style.display !== 'none').length);

  console.log('\n=== 文案出现处 ===');
  let h = fs.readFileSync('task-list.html', 'utf-8');
  h.split('\n').forEach((l, i) => { if (l.indexOf('临时/流程任务') >= 0) console.log('  L' + (i + 1) + ':', l.trim().slice(0, 120)); });
})();
